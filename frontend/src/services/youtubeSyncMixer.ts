/**
 * YouTube Sync Mixer (youtubeSyncMixer.ts)
 * 
 * Technical architecture for the "Virtual Mix" (Mix Ảo):
 * - Two independent audio engines locked to a single master clock:
 *   1. Beat Track: YouTube IFrame Player (controls=0, volume controlled via setVolume)
 *   2. Vocal Track: Web Audio API (AudioBufferSourceNode + GainNode + Compressor + Convolver Reverb)
 * - YouTube audio cannot enter Web Audio due to browser Cross-Origin (CORS) limits.
 * - Master Clock: ytPlayer.getCurrentTime().
 * - Synchronization: Checks drift on requestAnimationFrame; if drift > 85ms,
 *   resynchronizes the vocal AudioBufferSourceNode (avoids per-frame jitter/pitch flutter).
 * - Full Offline Mixdown: If user provides a local beat file, uses OfflineAudioContext
 *   to render a complete mixed master WAV file with full vocal FX!
 */

import { IYouTubeTake } from './youtubeTakeStorageService';

export interface IMixerState {
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  beatVolume: number;   // 0.0 .. 1.0
  vocalVolume: number;  // 0.0 .. 1.5
  nudgeOffsetMs: number; // -500 .. +500
  isReverbEnabled: boolean;
  reverbLevel: number;  // 0.0 .. 1.0
  isCompressorEnabled: boolean;
}

export interface IOfflineMixOptions {
  beatVolume?: number;
  vocalVolume?: number;
  nudgeOffsetMs?: number;
  isReverbEnabled?: boolean;
  reverbLevel?: number;
  isCompressorEnabled?: boolean;
  trimToTake?: boolean;
}

export class YouTubeSyncMixer {
  private audioContext: AudioContext | null = null;
  private ytPlayer: any = null;

  // Active Take Audio Buffer
  private currentTake: IYouTubeTake | null = null;
  private vocalAudioBuffer: AudioBuffer | null = null;

  // Web Audio Graph
  private vocalSourceNode: AudioBufferSourceNode | null = null;
  private vocalGainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;

  // Sync state
  private isPlaying = false;
  private beatVolume = 0.8;
  private vocalVolume = 1.0;
  private nudgeOffsetMs = 0;
  private isReverbEnabled = false;
  private reverbLevel = 0.25;
  private isCompressorEnabled = true;

  // Drift detection
  private syncRafId: number | null = null;
  private lastResyncTime = 0;
  private vocalStartTimeInAudioCtx = 0;
  private vocalOffsetWhenStartedSec = 0;

  // Callbacks
  private onTimeUpdateCallback: ((timeSec: number, durationSec: number) => void) | null = null;
  private onPlaybackEndedCallback: (() => void) | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public getAudioContext(): AudioContext {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioCtx();
    }
    return this.audioContext;
  }

  /**
   * Links YouTube IFrame Player instance.
   */
  public attachYouTubePlayer(player: any): void {
    this.ytPlayer = player;
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(Math.round(this.beatVolume * 100));
    }
  }

  /**
   * Loads a vocal take into the Web Audio engine.
   * Decodes the audio blob into an AudioBuffer for zero-latency seeking.
   */
  public async loadVocalTake(take: IYouTubeTake): Promise<void> {
    this.currentTake = take;
    this.nudgeOffsetMs = take.nudgeOffsetMs || 0;
    this.vocalVolume = take.volume ?? 1.0;

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    try {
      const arrayBuffer = await take.audioBlob.arrayBuffer();
      this.vocalAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn('Failed to decode vocal take audio blob:', err);
      this.vocalAudioBuffer = null;
    }

    this.setupAudioGraph();
  }

  /**
   * Sets up the Web Audio graph with Gain, Soft Compressor, and Algorithmic Reverb.
   */
  private setupAudioGraph(): void {
    const ctx = this.getAudioContext();

    if (!this.vocalGainNode) {
      this.vocalGainNode = ctx.createGain();
      this.vocalGainNode.gain.value = this.vocalVolume;
    }

    // Dynamics Compressor (Vocals Glue)
    if (!this.compressorNode) {
      this.compressorNode = ctx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-24, ctx.currentTime);
      this.compressorNode.knee.setValueAtTime(12, ctx.currentTime);
      this.compressorNode.ratio.setValueAtTime(3.0, ctx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.01, ctx.currentTime);
      this.compressorNode.release.setValueAtTime(0.12, ctx.currentTime);
    }

    // Dry / Wet Reverb setup
    if (!this.dryGainNode) {
      this.dryGainNode = ctx.createGain();
      this.dryGainNode.gain.value = 1.0;
    }
    if (!this.wetGainNode) {
      this.wetGainNode = ctx.createGain();
      this.wetGainNode.gain.value = this.isReverbEnabled ? this.reverbLevel : 0.0;
    }
    if (!this.convolverNode) {
      this.convolverNode = ctx.createConvolver();
      this.convolverNode.buffer = this.buildImpulseResponse(ctx, 1.8, 2.5);
    }

    // Connect nodes:
    // vocalGain -> compressor -> dryGain -> destination
    //                         -> convolver -> wetGain -> destination
    try {
      this.vocalGainNode.disconnect();
      this.compressorNode.disconnect();
      this.dryGainNode.disconnect();
      this.wetGainNode.disconnect();
      this.convolverNode.disconnect();

      this.vocalGainNode.connect(this.compressorNode);

      // Dry path
      this.compressorNode.connect(this.dryGainNode);
      this.dryGainNode.connect(ctx.destination);

      // Wet Reverb path
      this.compressorNode.connect(this.convolverNode);
      this.convolverNode.connect(this.wetGainNode);
      this.wetGainNode.connect(ctx.destination);
    } catch (e) {
      console.warn('Audio graph connection error:', e);
    }
  }

  /**
   * Synthesizes an impulse response for subtle studio room/hall reverb without external files.
   */
  public buildImpulseResponse(ctx: BaseAudioContext, duration = 1.8, decay = 2.5): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const envelope = Math.exp(-n * decay);
      // White noise with exponential decay
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    return impulse;
  }

  /**
   * Starts synchronized playback of YouTube Beat and Web Audio Vocal.
   */
  public async play(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.isPlaying = true;

    // Start YouTube player
    if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
    }

    // Sync vocal node with current YouTube beat position
    const currentBeatTime = this.getCurrentBeatTime();
    this.startVocalAtBeatTime(currentBeatTime);

    this.startSyncLoop();
  }

  /**
   * Pauses synchronized playback.
   */
  public pause(): void {
    this.isPlaying = false;
    this.stopSyncLoop();

    // Pause YouTube
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }

    // Stop vocal node
    this.stopVocalNode();
  }

  /**
   * Unified seek: pauses, seeks YouTube beat, recalculates vocal offset, and resumes.
   */
  public seekTo(targetTimeSec: number): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    // Seek YouTube
    if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      this.ytPlayer.seekTo(targetTimeSec, true);
    }

    if (wasPlaying) {
      // Small timeout to allow YouTube iframe player to buffer seek
      setTimeout(() => {
        this.play();
      }, 50);
    } else {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(targetTimeSec, this.getDuration());
      }
    }
  }

  /**
   * Starts or schedules vocal playback based on the beat playhead.
   */
  private startVocalAtBeatTime(beatTimeSec: number): void {
    this.stopVocalNode();

    if (!this.vocalAudioBuffer || !this.currentTake) {
      return;
    }

    const ctx = this.getAudioContext();
    const effectiveStartPoint = this.currentTake.startPointSec - (this.nudgeOffsetMs / 1000);
    const vocalDuration = this.vocalAudioBuffer.duration;

    // Case 1: Beat hasn't reached the vocal start point yet
    if (beatTimeSec < effectiveStartPoint) {
      const waitDelaySec = effectiveStartPoint - beatTimeSec;
      // Schedule future start
      this.vocalSourceNode = ctx.createBufferSource();
      this.vocalSourceNode.buffer = this.vocalAudioBuffer;
      this.vocalSourceNode.connect(this.vocalGainNode!);

      const whenToStart = ctx.currentTime + waitDelaySec;
      this.vocalSourceNode.start(whenToStart, 0);
      this.vocalStartTimeInAudioCtx = whenToStart;
      this.vocalOffsetWhenStartedSec = 0;
      return;
    }

    // Case 2: Beat is currently inside the vocal take
    const vocalOffset = beatTimeSec - effectiveStartPoint;
    if (vocalOffset < vocalDuration) {
      this.vocalSourceNode = ctx.createBufferSource();
      this.vocalSourceNode.buffer = this.vocalAudioBuffer;
      this.vocalSourceNode.connect(this.vocalGainNode!);

      this.vocalSourceNode.start(0, vocalOffset);
      this.vocalStartTimeInAudioCtx = ctx.currentTime;
      this.vocalOffsetWhenStartedSec = vocalOffset;
    }
    // Case 3: Beat has passed the vocal take duration -> vocal remains silent
  }

  private stopVocalNode(): void {
    if (this.vocalSourceNode) {
      try {
        this.vocalSourceNode.stop();
        this.vocalSourceNode.disconnect();
      } catch (e) {
        // Ignored
      }
      this.vocalSourceNode = null;
    }
  }

  /**
   * requestAnimationFrame loop that tracks beat time and checks drift threshold.
   * "nếu lệch quá khoảng 80–100ms thì chỉnh lại thời gian giọng, đừng chỉnh liên tục từng frame"
   */
  private startSyncLoop(): void {
    this.stopSyncLoop();

    const checkSync = () => {
      if (!this.isPlaying) return;

      const beatTime = this.getCurrentBeatTime();
      const duration = this.getDuration();

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(beatTime, duration);
      }

      // Check drift if vocal is supposed to be playing
      if (this.vocalAudioBuffer && this.currentTake) {
        const effectiveStartPoint = this.currentTake.startPointSec - (this.nudgeOffsetMs / 1000);
        const vocalDuration = this.vocalAudioBuffer.duration;

        if (beatTime >= effectiveStartPoint && beatTime < effectiveStartPoint + vocalDuration) {
          const expectedVocalPosition = beatTime - effectiveStartPoint;
          const ctx = this.getAudioContext();
          const currentVocalPosition = this.vocalOffsetWhenStartedSec + (ctx.currentTime - this.vocalStartTimeInAudioCtx);

          const driftSec = Math.abs(expectedVocalPosition - currentVocalPosition);
          const now = performance.now();

          // Resync only if drift exceeds 85ms and at least 350ms elapsed since last resync
          if (driftSec > 0.085 && now - this.lastResyncTime > 350) {
            this.lastResyncTime = now;
            this.startVocalAtBeatTime(beatTime);
          }
        }
      }

      this.syncRafId = requestAnimationFrame(checkSync);
    };

    this.syncRafId = requestAnimationFrame(checkSync);
  }

  private stopSyncLoop(): void {
    if (this.syncRafId !== null) {
      cancelAnimationFrame(this.syncRafId);
      this.syncRafId = null;
    }
  }

  public getCurrentBeatTime(): number {
    if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        return this.ytPlayer.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.ytPlayer && typeof this.ytPlayer.getDuration === 'function') {
      try {
        return this.ytPlayer.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  // Volume & Nudge Controls
  public setBeatVolume(vol: number): void {
    this.beatVolume = Math.max(0, Math.min(1.0, vol));
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(Math.round(this.beatVolume * 100));
    }
  }

  public setVocalVolume(vol: number): void {
    this.vocalVolume = Math.max(0, Math.min(1.5, vol));
    if (this.vocalGainNode && this.audioContext) {
      this.vocalGainNode.gain.setValueAtTime(this.vocalVolume, this.audioContext.currentTime);
    }
  }

  public setNudgeOffsetMs(offsetMs: number): void {
    this.nudgeOffsetMs = Math.max(-500, Math.min(500, offsetMs));
    // If playing, immediately resync to reflect nudge in real-time
    if (this.isPlaying) {
      this.startVocalAtBeatTime(this.getCurrentBeatTime());
    }
  }

  public setReverb(enabled: boolean, level = 0.25): void {
    this.isReverbEnabled = enabled;
    this.reverbLevel = level;
    if (this.wetGainNode && this.audioContext) {
      this.wetGainNode.gain.setValueAtTime(enabled ? level : 0.0, this.audioContext.currentTime);
    }
  }

  public setCompressor(enabled: boolean): void {
    this.isCompressorEnabled = enabled;
    if (this.compressorNode && this.audioContext) {
      this.compressorNode.ratio.setValueAtTime(enabled ? 3.0 : 1.0, this.audioContext.currentTime);
    }
  }

  public onTimeUpdate(cb: (timeSec: number, durationSec: number) => void): void {
    this.onTimeUpdateCallback = cb;
  }

  public onPlaybackEnded(cb: () => void): void {
    this.onPlaybackEndedCallback = cb;
  }

  public getState(): IMixerState {
    return {
      isPlaying: this.isPlaying,
      currentTimeSec: this.getCurrentBeatTime(),
      durationSec: this.getDuration(),
      beatVolume: this.beatVolume,
      vocalVolume: this.vocalVolume,
      nudgeOffsetMs: this.nudgeOffsetMs,
      isReverbEnabled: this.isReverbEnabled,
      reverbLevel: this.reverbLevel,
      isCompressorEnabled: this.isCompressorEnabled,
    };
  }

  /**
   * Offline Audio Mixdown:
   * When user uploads a real audio beat file (MP3/WAV/M4A), this method renders
   * the beat and vocal track together into a single downloadable WAV file!
   */
  public async renderOfflineMixdown(
    beatFile: File | Blob,
    take: IYouTubeTake,
    onProgress?: (pct: number) => void,
    options?: IOfflineMixOptions
  ): Promise<Blob> {
    const beatVol = options?.beatVolume ?? this.beatVolume;
    const vocalVol = options?.vocalVolume ?? this.vocalVolume;
    const nudge = options?.nudgeOffsetMs ?? take.nudgeOffsetMs ?? this.nudgeOffsetMs;
    const reverbOn = options?.isReverbEnabled ?? this.isReverbEnabled;
    const revLevel = options?.reverbLevel ?? this.reverbLevel;
    const compOn = options?.isCompressorEnabled ?? this.isCompressorEnabled;
    const trimToTake = options?.trimToTake ?? false;

    const beatBuffer = await beatFile.arrayBuffer();
    const vocalBuffer = await take.audioBlob.arrayBuffer();

    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBeat = await tempCtx.decodeAudioData(beatBuffer);
    const decodedVocal = await tempCtx.decodeAudioData(vocalBuffer);
    tempCtx.close();

    const sampleRate = decodedBeat.sampleRate || 44100;
    const effectiveVocalStart = Math.max(0, take.startPointSec - (nudge / 1000));
    const vocalDuration = decodedVocal.duration;

    let renderDurationSec: number;
    let beatOffsetSec = 0;
    let vocalOffsetSec = effectiveVocalStart;

    if (trimToTake) {
      // Trim: start slightly before vocal (1.5s lead-in), end 3s after vocal tail (reverb tail)
      const leadIn = Math.min(1.5, effectiveVocalStart);
      const renderStartSec = Math.max(0, effectiveVocalStart - leadIn);
      const renderEndSec = Math.min(
        decodedBeat.duration,
        effectiveVocalStart + vocalDuration + 3.0
      );
      renderDurationSec = Math.max(1.0, renderEndSec - renderStartSec);
      beatOffsetSec = -renderStartSec;
      vocalOffsetSec = effectiveVocalStart - renderStartSec;
    } else {
      // Full track duration
      renderDurationSec = Math.max(
        decodedBeat.duration,
        effectiveVocalStart + vocalDuration
      );
      beatOffsetSec = 0;
      vocalOffsetSec = effectiveVocalStart;
    }

    const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtx(2, Math.ceil(renderDurationSec * sampleRate), sampleRate);

    // 1. Beat Track Node
    const beatSource = offlineCtx.createBufferSource();
    beatSource.buffer = decodedBeat;
    const beatGain = offlineCtx.createGain();
    beatGain.gain.value = beatVol;
    beatSource.connect(beatGain);
    beatGain.connect(offlineCtx.destination);

    // 2. Vocal Track Node
    const vocalSource = offlineCtx.createBufferSource();
    vocalSource.buffer = decodedVocal;
    const vocalGain = offlineCtx.createGain();
    vocalGain.gain.value = vocalVol;

    // Dynamics Compressor (Vocals Glue)
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, 0);
    compressor.knee.setValueAtTime(12, 0);
    compressor.ratio.setValueAtTime(compOn ? 3.0 : 1.0, 0);
    compressor.attack.setValueAtTime(0.01, 0);
    compressor.release.setValueAtTime(0.12, 0);

    vocalSource.connect(vocalGain);
    vocalGain.connect(compressor);

    // Dry / Wet Reverb
    if (reverbOn && revLevel > 0) {
      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 1.0;
      compressor.connect(dryGain);
      dryGain.connect(offlineCtx.destination);

      const convolver = offlineCtx.createConvolver();
      convolver.buffer = this.buildImpulseResponse(offlineCtx, 1.8, 2.5);
      const wetGain = offlineCtx.createGain();
      wetGain.gain.value = revLevel;
      compressor.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(offlineCtx.destination);
    } else {
      compressor.connect(offlineCtx.destination);
    }

    // Start schedules
    if (beatOffsetSec >= 0) {
      beatSource.start(beatOffsetSec);
    } else {
      // Offset into beat buffer
      beatSource.start(0, Math.abs(beatOffsetSec));
    }

    if (vocalOffsetSec >= 0) {
      vocalSource.start(vocalOffsetSec);
    } else {
      vocalSource.start(0, Math.abs(vocalOffsetSec));
    }

    if (onProgress) onProgress(30);

    const renderedBuffer = await offlineCtx.startRendering();
    if (onProgress) onProgress(90);

    // Encode rendered Stereo AudioBuffer to WAV
    const wavBlob = this.encodeAudioBufferToWav(renderedBuffer);
    if (onProgress) onProgress(100);

    return wavBlob;
  }

  /**
   * Encodes a Web Audio AudioBuffer to a 16-bit PCM WAV Blob.
   */
  public encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    // Interleave samples
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        const s = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  public dispose(): void {
    this.pause();
    this.stopVocalNode();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignored
      }
      this.audioContext = null;
    }
  }
}

export const youtubeSyncMixer = new YouTubeSyncMixer();

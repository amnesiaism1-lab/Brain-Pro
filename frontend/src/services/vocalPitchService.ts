/**
 * Vocal Pitch Tracker Service (vocalPitchService.ts)
 * 
 * Provides real-time microphone pitch detection using McLeod Pitch Method (MPM)
 * via the `pitchy` library, supporting both AudioWorkletNode and ScriptProcessorNode fallback.
 * Integrates with Brain-Pro's auditoryEngine and musicTheoryService.
 */

import { PitchDetector } from 'pitchy';
import { auditoryEngine } from './auditoryEngine';
import { getNoteFrequency } from './musicTheoryService';
import { VocalRangePreference } from '@brain-exercises/shared';

export interface IVocalPitchReading {
  freqHz: number;
  clarity: number;
  volumeRms: number;
  volumeDb: number;
  noteName: string;
  solfegeName: string;
  midiNumber: number;
  centsDeviation: number;
  isSinging: boolean;
  timestamp: number;
}

export interface IVocalPitchMatchEvaluation {
  matched: boolean;
  centsDiff: number;           // Deviation from target (positive = sharp, negative = flat)
  octaveOffset: number;        // 0 if same octave, -1 if 1 octave lower, +1 if higher
  clarity: number;
  inTolerance: boolean;
  stabilityScore: number;      // 0..1
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SOLFEGE_NAMES = ['Đô', 'Đô#', 'Rê', 'Rê#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

class VocalPitchService {
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private highPassFilterNode: BiquadFilterNode | null = null;
  private lowPassFilterNode: BiquadFilterNode | null = null;
  private micAnalyserNode: AnalyserNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private isMonitoring = false;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private isListening = false;
  private detector: PitchDetector<Float32Array> | null = null;
  private bufferSize = 2048;

  // Selected device
  private currentDeviceId: string | null = null;

  // Smoothing & Filtering state
  private pitchHistory: number[] = [];
  private smoothedFreq = 0;
  private lastReading: IVocalPitchReading | null = null;
  private subscribers: Set<(reading: IVocalPitchReading) => void> = new Set();

  // Pitch Stabilization & Note Hysteresis (Eliminates border oscillation and octave jumps)
  private lockedMidi = 0;
  private pendingNewMidi = 0;
  private pendingNewMidiCount = 0;

  // Voice Focus & Anti-Transient State (Rejects door slams, desk knocks, keyboard clicks)
  private voiceFocusEnabled = true;
  private consecutivePitchFrames = 0;
  private readonly minAttackFramesToTrigger = 2; // ~80-90ms sustained vocal requirement from silence to reject impulse clicks
  private harmonicRepeatCount = 0;

  // Noise gate and limits
  // Default -38 dBFS suppresses typical USB sound card (Ugreen) idle noise (-45 to -36 dBFS)
  private noiseGateDb = -38;
  private readonly gateHysteresisDb = 7; // 7 dB release margin: keeps gate open while singing even when breath/volume drops
  private minVolumeRms = Math.pow(10, -38 / 20); // ~0.0126
  private minClarity = 0.65;    // Balanced baseline for MPM (pitchy)
  private minFreq = 80;   // High-pass cutoff at 80Hz completely cuts 50Hz/60Hz/77.8Hz electrical hum!
  private maxFreq = 1100; // C6 (approx 1046.5 Hz)

  private consecutiveDropFrames = 0;
  private maxHangoverFrames = 8; // ~350ms grace window for sustained notes, vibrato wavers and breath transitions

  // Vocal range preference
  private userRange: VocalRangePreference = 'auto';

  // Test recording & playback state
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private testAudioUrl: string | null = null;
  private testAudioElement: HTMLAudioElement | null = null;
  private isRecordingTest = false;
  private isPlayingTest = false;

  /**
   * Check if getUserMedia is supported in the current environment
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 
      !!navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function';
  }

  public setUserRange(range: VocalRangePreference): void {
    this.userRange = range;
  }

  public getUserRange(): VocalRangePreference {
    return this.userRange;
  }

  /**
   * Voice Focus: Focus exclusively on human singing voice, rejecting door slams, desk thumps & clicks
   */
  public setVoiceFocus(enabled: boolean): void {
    this.voiceFocusEnabled = enabled;
    if (this.highPassFilterNode) {
      const ctx = auditoryEngine.initContext();
      if (ctx) {
        this.highPassFilterNode.frequency.setValueAtTime(enabled ? 100 : 80, ctx.currentTime);
      }
    }
  }

  public getVoiceFocus(): boolean {
    return this.voiceFocusEnabled;
  }

  /**
   * Dynamic minimum frequency based on vocal range to eliminate low-frequency electrical hum (50Hz - 78Hz)
   */
  public getEffectiveMinFreq(): number {
    switch (this.userRange) {
      case 'soprano':
        return 130; // C3 (130.8 Hz)
      case 'tenor-alto':
        return 98;  // G2 (98.0 Hz)
      case 'bass-baritone':
        return 80;  // E2 (82.4 Hz)
      case 'auto':
      default:
        return 80;  // 80 Hz blocks 50Hz/60Hz AC hum and 77.8Hz (D#2) noise!
    }
  }

  /**
   * Noise Gate Controls
   */
  public setNoiseGateDb(db: number): void {
    this.noiseGateDb = Math.min(-20, Math.max(-60, db));
    this.minVolumeRms = Math.pow(10, this.noiseGateDb / 20);
  }

  public getNoiseGateDb(): number {
    return this.noiseGateDb;
  }

  /**
   * Auto-Calibrate Noise Floor:
   * Measures ambient microphone / sound card noise floor for 1.5 seconds,
   * then places the noise gate safely +5 dB above the ambient noise floor.
   */
  public async calibrateNoiseFloor(durationMs = 1500): Promise<{ ambientDb: number; suggestedGateDb: number }> {
    const samples: number[] = [];
    const unsubscribe = this.subscribe((reading) => {
      if (reading.volumeDb > -90) {
        samples.push(reading.volumeDb);
      }
    });

    await new Promise((res) => setTimeout(res, durationMs));
    unsubscribe();

    if (samples.length === 0) {
      this.setNoiseGateDb(-38);
      return { ambientDb: -45, suggestedGateDb: -38 };
    }

    samples.sort((a, b) => a - b);
    // Take 80th percentile of ambient noise to cover occasional electrical spikes
    const ambientDb = samples[Math.floor(samples.length * 0.8)];
    const suggestedGateDb = Math.min(-24, Math.max(-50, ambientDb + 5));
    this.setNoiseGateDb(suggestedGateDb);

    return {
      ambientDb: Math.round(ambientDb),
      suggestedGateDb: Math.round(suggestedGateDb),
    };
  }

  /**
   * Device Management
   */
  public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch (err) {
      console.warn('Failed to enumerate audio devices:', err);
      return [];
    }
  }

  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  public async switchAudioInputDevice(deviceId: string): Promise<boolean> {
    this.currentDeviceId = deviceId;
    const wasListening = this.isListening;
    this.stopListening(true);
    if (wasListening) {
      return await this.startListening(deviceId);
    }
    return true;
  }

  /**
   * Live Microphone Monitoring (Hear own voice in headphones)
   */
  public setLiveMonitoring(enabled: boolean): void {
    this.isMonitoring = enabled;
    if (this.monitorGainNode) {
      const ctx = auditoryEngine.initContext();
      if (ctx) {
        this.monitorGainNode.gain.setValueAtTime(enabled ? 0.85 : 0, ctx.currentTime);
      }
    }
  }

  public getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Mic Analyser for real-time oscilloscope / spectrum rendering
   */
  public getMicAnalyser(): AnalyserNode | null {
    return this.micAnalyserNode;
  }

  /**
   * Test Recording & Playback (Check what the microphone is hearing)
   */
  public getIsRecordingTest(): boolean {
    return this.isRecordingTest;
  }

  public getIsPlayingTest(): boolean {
    return this.isPlayingTest;
  }

  public getTestAudioUrl(): string | null {
    return this.testAudioUrl;
  }

  public async startTestRecording(): Promise<void> {
    if (!this.mediaStream || !this.mediaStream.active) {
      await this.startListening(this.currentDeviceId || undefined);
    }
    if (!this.mediaStream) throw new Error('Không thể khởi tạo luồng micro');

    this.stopPlayback();
    this.recordedChunks = [];

    if (this.testAudioUrl) {
      URL.revokeObjectURL(this.testAudioUrl);
      this.testAudioUrl = null;
    }

    let options: MediaRecorderOptions = {};
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }
    }

    this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.isRecordingTest = true;
    this.mediaRecorder.start(100);
  }

  public async stopTestRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.isRecordingTest = false;
        return reject(new Error('MediaRecorder chưa được khởi tạo'));
      }

      this.mediaRecorder.onstop = () => {
        this.isRecordingTest = false;
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.testAudioUrl = URL.createObjectURL(blob);
        resolve(this.testAudioUrl);
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else if (this.testAudioUrl) {
        this.isRecordingTest = false;
        resolve(this.testAudioUrl);
      } else {
        this.isRecordingTest = false;
        reject(new Error('Chưa có dữ liệu ghi âm'));
      }
    });
  }

  public playTestRecording(onEnded?: () => void): HTMLAudioElement | null {
    if (!this.testAudioUrl) return null;
    this.stopPlayback();

    const audio = new Audio(this.testAudioUrl);
    this.testAudioElement = audio;
    this.isPlayingTest = true;

    audio.onended = () => {
      this.isPlayingTest = false;
      this.testAudioElement = null;
      if (onEnded) onEnded();
    };

    audio.onerror = () => {
      this.isPlayingTest = false;
      this.testAudioElement = null;
      if (onEnded) onEnded();
    };

    audio.play().catch((err) => {
      console.warn('Playback error:', err);
      this.isPlayingTest = false;
      if (onEnded) onEnded();
    });

    return audio;
  }

  public stopPlayback(): void {
    if (this.testAudioElement) {
      this.testAudioElement.pause();
      this.testAudioElement.currentTime = 0;
      this.testAudioElement = null;
    }
    this.isPlayingTest = false;
  }

  /**
   * Start microphone capture and pitch detection
   */
  public async startListening(preferredDeviceId?: string): Promise<boolean> {
    if (preferredDeviceId) {
      this.currentDeviceId = preferredDeviceId;
    }

    if (this.isListening) return true;

    // Fast-path: If media stream and processor are already active, seamlessly unpause
    if (
      this.mediaStream && 
      this.mediaStream.active && 
      this.mediaStream.getAudioTracks().some(t => t.readyState === 'live') &&
      (this.workletNode || this.scriptProcessorNode)
    ) {
      this.isListening = true;
      return true;
    }

    try {
      // 1. Ensure AudioContext is running
      await auditoryEngine.resumeAudioContext();
      const ctx = auditoryEngine.initContext();
      if (!ctx) {
        throw new Error('Web Audio API is not available on this browser');
      }

      // 2. Request microphone stream with clean musical settings & device selection
      // Disable browser echoCancellation & noiseSuppression so WebRTC does not treat sustained singing notes as stationary fan noise!
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      };

      if (this.currentDeviceId) {
        audioConstraints.deviceId = { exact: this.currentDeviceId };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false,
        });
      } catch (deviceErr) {
        // Fallback to default audio device if selected deviceId is no longer valid
        if (this.currentDeviceId) {
          console.warn('Microphone deviceId failed, falling back to default:', deviceErr);
          this.currentDeviceId = null;
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1,
            },
            video: false,
          });
        } else {
          throw deviceErr;
        }
      }

      this.mediaStream = stream;
      this.sourceNode = ctx.createMediaStreamSource(stream);

      // 3. Studio-grade Vocal Bandpass Filtering (100Hz HPF - 3600Hz LPF)
      // Eliminates 50Hz/60Hz AC electrical hum, ground loops, door slams (<100Hz), and key clicks (>3600Hz)
      this.highPassFilterNode = ctx.createBiquadFilter();
      this.highPassFilterNode.type = 'highpass';
      this.highPassFilterNode.frequency.setValueAtTime(this.voiceFocusEnabled ? 100 : 80, ctx.currentTime);
      this.highPassFilterNode.Q.setValueAtTime(0.707, ctx.currentTime);

      this.lowPassFilterNode = ctx.createBiquadFilter();
      this.lowPassFilterNode.type = 'lowpass';
      this.lowPassFilterNode.frequency.setValueAtTime(3600, ctx.currentTime);
      this.lowPassFilterNode.Q.setValueAtTime(0.707, ctx.currentTime);

      // 4. Dedicated Mic Analyser for live oscilloscope & waveform
      this.micAnalyserNode = ctx.createAnalyser();
      this.micAnalyserNode.fftSize = 512;
      this.micAnalyserNode.smoothingTimeConstant = 0.75;

      // 5. Live Monitor Gain Node (routed to speakers/headphones on user request)
      this.monitorGainNode = ctx.createGain();
      this.monitorGainNode.gain.setValueAtTime(this.isMonitoring ? 0.85 : 0, ctx.currentTime);

      // Connect source -> HPF -> LPF
      this.sourceNode.connect(this.highPassFilterNode);
      this.highPassFilterNode.connect(this.lowPassFilterNode);

      // Connect LPF to Analyser
      this.lowPassFilterNode.connect(this.micAnalyserNode);
      // Connect LPF to Monitor Gain -> ctx.destination
      this.lowPassFilterNode.connect(this.monitorGainNode);
      this.monitorGainNode.connect(ctx.destination);

      // 6. Initialize PitchDetector (MPM)
      this.detector = PitchDetector.forFloat32Array(this.bufferSize);
      this.detector.clarityThreshold = this.minClarity;

      // 7. Try loading AudioWorklet with inline Blob URL
      let workletSuccess = false;
      try {
        if (ctx.audioWorklet && typeof ctx.audioWorklet.addModule === 'function') {
          const workletCode = `
            class VocalPitchCaptureProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.bufferSize = ${this.bufferSize};
                this.buffer = new Float32Array(this.bufferSize);
                this.writeIndex = 0;
              }
              process(inputs) {
                const input = inputs[0];
                if (!input || !input[0]) return true;
                const channel = input[0];
                for (let i = 0; i < channel.length; i++) {
                  this.buffer[this.writeIndex++] = channel[i];
                  if (this.writeIndex >= this.bufferSize) {
                    this.port.postMessage(this.buffer.slice());
                    this.writeIndex = 0;
                  }
                }
                return true;
              }
            }
            registerProcessor('vocal-pitch-capture-processor', VocalPitchCaptureProcessor);
          `;
          const blob = new Blob([workletCode], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          await ctx.audioWorklet.addModule(blobUrl);
          URL.revokeObjectURL(blobUrl);

          this.workletNode = new AudioWorkletNode(ctx, 'vocal-pitch-capture-processor');
          this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            if (this.isListening && event.data) {
              this.processAudioBuffer(event.data, ctx.sampleRate);
            }
          };

          // AudioWorklet receives audio after the Bandpass Filter!
          this.lowPassFilterNode.connect(this.workletNode);
          workletSuccess = true;
        }
      } catch (workletErr) {
        console.warn('AudioWorklet initialization fallback to ScriptProcessor:', workletErr);
      }

      // 8. Fallback to ScriptProcessorNode if AudioWorklet is blocked or failed
      if (!workletSuccess) {
        this.scriptProcessorNode = ctx.createScriptProcessor(this.bufferSize, 1, 1);
        this.scriptProcessorNode.onaudioprocess = (e) => {
          if (!this.isListening) return;
          const inputData = e.inputBuffer.getChannelData(0);
          this.processAudioBuffer(inputData, ctx.sampleRate);
        };
        this.lowPassFilterNode.connect(this.scriptProcessorNode);
        const muteGain = ctx.createGain();
        muteGain.gain.setValueAtTime(0, ctx.currentTime);
        this.scriptProcessorNode.connect(muteGain);
        muteGain.connect(ctx.destination);
      }

      this.isListening = true;
      this.pitchHistory = [];
      this.smoothedFreq = 0;
      this.consecutivePitchFrames = 0;
      return true;
    } catch (err) {
      console.error('Failed to start vocal pitch tracking:', err);
      this.stopListening(true);
      throw err;
    }
  }

  /**
   * Pause pitch processing without destroying hardware audio tracks
   */
  public pauseListening(): void {
    this.isListening = false;
  }

  /**
   * Stop microphone capture and clean up audio resources
   */
  public stopListening(forceFullTeardown = true): void {
    this.isListening = false;
    this.stopPlayback();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }

    if (!forceFullTeardown) {
      return;
    }

    if (this.monitorGainNode) {
      try {
        this.monitorGainNode.disconnect();
      } catch {}
      this.monitorGainNode = null;
    }

    if (this.micAnalyserNode) {
      try {
        this.micAnalyserNode.disconnect();
      } catch {}
      this.micAnalyserNode = null;
    }

    if (this.lowPassFilterNode) {
      try {
        this.lowPassFilterNode.disconnect();
      } catch {}
      this.lowPassFilterNode = null;
    }

    if (this.highPassFilterNode) {
      try {
        this.highPassFilterNode.disconnect();
      } catch {}
      this.highPassFilterNode = null;
    }

    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
      } catch {}
      this.workletNode = null;
    }

    if (this.scriptProcessorNode) {
      try {
        this.scriptProcessorNode.disconnect();
        this.scriptProcessorNode.onaudioprocess = null;
      } catch {}
      this.scriptProcessorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }

    this.pitchHistory = [];
    this.smoothedFreq = 0;
    this.consecutivePitchFrames = 0;
    this.lastReading = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getLastReading(): IVocalPitchReading | null {
    return this.lastReading;
  }

  /**
   * Subscribe to pitch readings (dispatched ~20 times per second)
   */
  public subscribe(callback: (reading: IVocalPitchReading) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Core Audio Processing: RMS volume calculation, Pitchy MPM, Median & EMA filtering
   */
  private processAudioBuffer(buffer: Float32Array, sampleRate: number): void {
    if (!this.detector) return;

    // 1. Calculate RMS volume & dB
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;

    const isAlreadySinging = Boolean(this.lastReading?.isSinging);

    // Schmitt Trigger Hysteresis Gate:
    // To trigger from silence: requires db >= noiseGateDb (e.g. -38 dBFS)
    // To sustain while singing: requires db >= (noiseGateDb - 7 dB) and rms >= (minVolumeRms * 0.45)
    // This prevents the noise gate from chattering or cutting off sustained notes when breath softens.
    const activeGateDb = isAlreadySinging ? (this.noiseGateDb - this.gateHysteresisDb) : this.noiseGateDb;
    const activeMinRms = isAlreadySinging ? (this.minVolumeRms * 0.45) : this.minVolumeRms;

    if (rms < activeMinRms || db < activeGateDb) {
      if (isAlreadySinging && this.consecutiveDropFrames < this.maxHangoverFrames) {
        // Sustained note hangover: bridges micro-pauses or breath dips without cutting the note
        this.consecutiveDropFrames++;
        const heldReading: IVocalPitchReading = {
          ...this.lastReading!,
          volumeRms: rms,
          volumeDb: Math.round(db),
          timestamp: performance.now(),
        };
        this.notifySubscribers(heldReading);
        return;
      }

      this.consecutiveDropFrames = 0;
      this.consecutivePitchFrames = 0;
      this.smoothedFreq = 0;
      this.pitchHistory = [];
      this.lockedMidi = 0;
      this.pendingNewMidi = 0;
      this.pendingNewMidiCount = 0;
      this.harmonicRepeatCount = 0;
      const silentReading: IVocalPitchReading = {
        freqHz: 0,
        clarity: 0,
        volumeRms: rms,
        volumeDb: Math.round(db),
        noteName: '',
        solfegeName: '',
        midiNumber: 0,
        centsDeviation: 0,
        isSinging: false,
        timestamp: performance.now(),
      };
      this.lastReading = silentReading;
      this.notifySubscribers(silentReading);
      return;
    }

    // 2. Find Pitch using MPM
    const [rawPitch, clarity] = this.detector.findPitch(buffer, sampleRate);

    // 3. Filter valid human singing pitch based on vocal range & clarity
    // While already singing: relax clarity threshold to 0.60 so sustained notes with vibrato/vocal fry don't cut out.
    // On fresh attack from silence: require 0.68 in voice focus mode (or 0.64 in standard mode) to reject ambient room noise.
    const effectiveMinClarity = isAlreadySinging 
      ? 0.60 
      : (this.voiceFocusEnabled ? 0.68 : 0.64);

    const effectiveMinFreq = this.voiceFocusEnabled ? Math.max(90, this.getEffectiveMinFreq()) : this.getEffectiveMinFreq();
    const isValidPitch = 
      clarity >= effectiveMinClarity && 
      rawPitch >= effectiveMinFreq && 
      rawPitch <= this.maxFreq;

    if (!isValidPitch) {
      if (isAlreadySinging && this.consecutiveDropFrames < this.maxHangoverFrames) {
        this.consecutiveDropFrames++;
        const heldReading: IVocalPitchReading = {
          ...this.lastReading!,
          volumeRms: rms,
          volumeDb: Math.round(db),
          timestamp: performance.now(),
        };
        this.notifySubscribers(heldReading);
        return;
      }

      this.consecutiveDropFrames = 0;
      this.consecutivePitchFrames = 0;
      const unpitchedReading: IVocalPitchReading = {
        freqHz: 0,
        clarity,
        volumeRms: rms,
        volumeDb: Math.round(db),
        noteName: '',
        solfegeName: '',
        midiNumber: 0,
        centsDeviation: 0,
        isSinging: false,
        timestamp: performance.now(),
      };
      this.lastReading = unpitchedReading;
      this.notifySubscribers(unpitchedReading);
      return;
    }

    // 4. Anti-Transient Sustain Gate (Rejects knocking sounds, door thuds, desk bumps)
    // Impulsive impacts (door slams, desk knocks, mouse clicks) last < 50ms (1 buffer frame).
    // Human singing requires sustained periodic vocal cord vibration.
    // NOTE: This check ONLY applies when triggering from silence; once actively singing, the voice is never suppressed!
    if (!isAlreadySinging) {
      this.consecutivePitchFrames++;
      const requiredAttackFrames = this.voiceFocusEnabled ? this.minAttackFramesToTrigger : 1;
      if (this.consecutivePitchFrames < requiredAttackFrames) {
        // Sound is an isolated single-frame impulse/knock -> Suppress until confirmed
        const transientReading: IVocalPitchReading = {
          freqHz: 0,
          clarity,
          volumeRms: rms,
          volumeDb: Math.round(db),
          noteName: '',
          solfegeName: '',
          midiNumber: 0,
          centsDeviation: 0,
          isSinging: false,
          timestamp: performance.now(),
        };
        this.lastReading = transientReading;
        this.notifySubscribers(transientReading);
        return;
      }
    } else {
      // Actively singing: keep frame count healthy
      this.consecutivePitchFrames = Math.max(3, this.consecutivePitchFrames + 1);
    }

    // Sound is confirmed active singing -> reset any drop frames
    this.consecutiveDropFrames = 0;

    // 5. Smart Harmonic & Octave Lock (Eliminates Octave Doubling / Halving Jumps)
    // If the singer intentionally jumps octaves for 4+ frames, release lock and accept new octave.
    let processedPitch = rawPitch;
    if (this.smoothedFreq > 0) {
      const ratio = rawPitch / this.smoothedFreq;
      if (ratio >= 1.84 && ratio <= 2.16) {
        this.harmonicRepeatCount++;
        if (this.harmonicRepeatCount <= 3) {
          processedPitch = rawPitch / 2; // Fold transient harmonic spike
        } else {
          processedPitch = rawPitch; // Intentional octave leap
        }
      } else if (ratio >= 0.46 && ratio <= 0.54) {
        this.harmonicRepeatCount++;
        if (this.harmonicRepeatCount <= 3) {
          processedPitch = rawPitch * 2; // Fold transient subharmonic glitch
        } else {
          processedPitch = rawPitch;
        }
      } else if (ratio >= 2.82 && ratio <= 3.18) {
        this.harmonicRepeatCount++;
        if (this.harmonicRepeatCount <= 3) {
          processedPitch = rawPitch / 3;
        } else {
          processedPitch = rawPitch;
        }
      } else {
        this.harmonicRepeatCount = 0;
      }
    }

    // 6. 5-Sample Median Filter (Rejects random outside room noise outliers)
    this.pitchHistory.push(processedPitch);
    if (this.pitchHistory.length > 5) {
      this.pitchHistory.shift();
    }
    const sorted = [...this.pitchHistory].sort((a, b) => a - b);
    const medianFreq = sorted[Math.floor(sorted.length / 2)];

    // 7. Adaptive Exponential Moving Average (EMA) smoothing
    // If pitch is steady, smooth with alpha=0.22 for zero jitter
    // If singer intentionally jumps notes (> 120 cents), adapt to alpha=0.55 for responsive tracking
    let alpha = 0.22;
    if (this.smoothedFreq > 0) {
      const centsStep = Math.abs(1200 * Math.log2(medianFreq / this.smoothedFreq));
      if (centsStep > 120) {
        alpha = 0.55;
      }
    }

    if (this.smoothedFreq === 0) {
      this.smoothedFreq = medianFreq;
    } else {
      this.smoothedFreq = alpha * medianFreq + (1 - alpha) * this.smoothedFreq;
    }

    // 8. Map to Note, Cents, and Solfege with Pitch Hysteresis
    const noteInfo = this.frequencyToNoteInfo(this.smoothedFreq);

    const reading: IVocalPitchReading = {
      freqHz: Math.round(this.smoothedFreq * 100) / 100,
      clarity: Math.round(clarity * 100) / 100,
      volumeRms: rms,
      volumeDb: Math.round(db),
      noteName: noteInfo.noteName,
      solfegeName: noteInfo.solfegeName,
      midiNumber: noteInfo.midiNumber,
      centsDeviation: noteInfo.centsDeviation,
      isSinging: true,
      timestamp: performance.now(),
    };

    this.lastReading = reading;
    this.notifySubscribers(reading);
  }

  private notifySubscribers(reading: IVocalPitchReading): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(reading);
      } catch (e) {
        console.error('Error in vocal pitch subscriber:', e);
      }
    });
  }

  /**
   * Convert frequency in Hz to Note Name, Solfege Name, Midi, and Cents Deviation
   * Includes semitone hysteresis deadband to prevent flickering between adjacent notes.
   */
  public frequencyToNoteInfo(freqHz: number, applyHysteresis = true): {
    noteName: string;
    solfegeName: string;
    midiNumber: number;
    centsDeviation: number;
    nearestFreqHz: number;
  } {
    if (freqHz <= 0) {
      this.lockedMidi = 0;
      this.pendingNewMidi = 0;
      this.pendingNewMidiCount = 0;
      return { noteName: '', solfegeName: '', midiNumber: 0, centsDeviation: 0, nearestFreqHz: 0 };
    }

    // MIDI 69 = A4 (440 Hz)
    const exactMidi = 12 * Math.log2(freqHz / 440) + 69;
    let chosenMidi = Math.round(exactMidi);

    // Note Hysteresis & Deadband to eliminate semitone border flickering
    if (applyHysteresis && this.lockedMidi > 0) {
      const diffFromLocked = exactMidi - this.lockedMidi;
      // If within ±0.60 semitones (±60 cents), stick with the locked note
      if (Math.abs(diffFromLocked) <= 0.60) {
        chosenMidi = this.lockedMidi;
        this.pendingNewMidiCount = 0;
      } else {
        // Singer is transitioning to a new note. Require 2 stable frames to lock new note
        if (chosenMidi === this.pendingNewMidi) {
          this.pendingNewMidiCount++;
          if (this.pendingNewMidiCount >= 2) {
            this.lockedMidi = chosenMidi;
            this.pendingNewMidiCount = 0;
          } else {
            chosenMidi = this.lockedMidi;
          }
        } else {
          this.pendingNewMidi = chosenMidi;
          this.pendingNewMidiCount = 1;
          chosenMidi = this.lockedMidi;
        }
      }
    } else if (applyHysteresis) {
      this.lockedMidi = chosenMidi;
      this.pendingNewMidiCount = 0;
    }

    // Cents deviation against the chosen (locked) note
    const centsDeviation = Math.round((exactMidi - chosenMidi) * 100);

    const noteIndex = ((chosenMidi % 12) + 12) % 12;
    const octave = Math.floor(chosenMidi / 12) - 1;

    const baseName = NOTE_NAMES[noteIndex];
    const solfege = SOLFEGE_NAMES[noteIndex];
    const noteName = `${baseName}${octave}`;
    const solfegeName = `${solfege} ${octave}`;

    // Standard frequency of the chromatic note
    const nearestFreqHz = 440 * Math.pow(2, (chosenMidi - 69) / 12);

    return {
      noteName,
      solfegeName,
      midiNumber: chosenMidi,
      centsDeviation,
      nearestFreqHz: Math.round(nearestFreqHz * 100) / 100,
    };
  }

  /**
   * Compare user's real-time singing pitch against target note.
   * Supports smart Octave-Folding so male/female vocal ranges can match the target comfortably.
   */
  public evaluatePitchMatch(
    reading: IVocalPitchReading,
    targetNote: string,
    toleranceCents: number,
    strictOctave = false
  ): IVocalPitchMatchEvaluation {
    if (!reading.isSinging || reading.freqHz <= 0) {
      return {
        matched: false,
        centsDiff: 999,
        octaveOffset: 0,
        clarity: reading.clarity,
        inTolerance: false,
        stabilityScore: 0,
      };
    }

    const targetFreq = getNoteFrequency(targetNote);
    if (!targetFreq) {
      return {
        matched: false,
        centsDiff: 999,
        octaveOffset: 0,
        clarity: reading.clarity,
        inTolerance: false,
        stabilityScore: 0,
      };
    }

    // Target MIDI note
    const targetMidiExact = 12 * Math.log2(targetFreq / 440) + 69;
    const targetMidi = Math.round(targetMidiExact);

    // User exact MIDI note
    const userMidiExact = 12 * Math.log2(reading.freqHz / 440) + 69;

    let centsDiff: number;
    let octaveOffset = 0;

    if (strictOctave) {
      centsDiff = Math.round((userMidiExact - targetMidi) * 100);
      octaveOffset = Math.round((reading.midiNumber - targetMidi) / 12);
    } else {
      // Octave-folding: map target to closest octave of the user's voice
      octaveOffset = Math.round((reading.midiNumber - targetMidi) / 12);
      const targetTransposedMidi = targetMidi + octaveOffset * 12;
      centsDiff = Math.round((userMidiExact - targetTransposedMidi) * 100);
    }

    const inTolerance = Math.abs(centsDiff) <= toleranceCents;
    const minMatchClarity = 0.60;
    const matched = inTolerance && reading.clarity >= minMatchClarity;

    // Stability score (1.0 = 0 cents diff, decays smoothly towards tolerance boundary)
    const normalizedErr = Math.min(1, Math.abs(centsDiff) / (toleranceCents * 1.5));
    const clarityNormalized = Math.min(1, reading.clarity / 0.75);
    const stabilityScore = Math.max(0, 1 - normalizedErr) * clarityNormalized;

    return {
      matched,
      centsDiff,
      octaveOffset,
      clarity: reading.clarity,
      inTolerance,
      stabilityScore: Math.round(stabilityScore * 100) / 100,
    };
  }
}

export const vocalPitchService = new VocalPitchService();

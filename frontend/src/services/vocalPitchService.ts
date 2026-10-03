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

  // Noise gate and limits
  // Default -38 dBFS suppresses typical USB sound card (Ugreen) idle noise (-45 to -36 dBFS)
  private noiseGateDb = -38;
  private minVolumeRms = Math.pow(10, -38 / 20); // ~0.0126
  private minClarity = 0.70;    // 0.70 for McLeod Pitch Method (stable for natural human vocals)
  private minFreq = 80;   // High-pass cutoff at 80Hz completely cuts 50Hz/60Hz/77.8Hz electrical hum!
  private maxFreq = 1100; // C6 (approx 1046.5 Hz)

  private consecutiveDropFrames = 0;
  private maxHangoverFrames = 4; // ~180ms grace window for vowel transitions and consonants

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

      // 2. Request microphone stream with clean settings & device selection
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
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
              echoCancellation: true,
              noiseSuppression: true,
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

      // 3. Studio-grade 80Hz High-Pass Filter (Low-Cut)
      // Eliminates 50Hz/60Hz AC electrical hum, ground loops, and PC fan desk rumble
      this.highPassFilterNode = ctx.createBiquadFilter();
      this.highPassFilterNode.type = 'highpass';
      this.highPassFilterNode.frequency.setValueAtTime(80, ctx.currentTime);
      this.highPassFilterNode.Q.setValueAtTime(0.707, ctx.currentTime);

      // 4. Dedicated Mic Analyser for live oscilloscope & waveform
      this.micAnalyserNode = ctx.createAnalyser();
      this.micAnalyserNode.fftSize = 512;
      this.micAnalyserNode.smoothingTimeConstant = 0.75;

      // 5. Live Monitor Gain Node (routed to speakers/headphones on user request)
      this.monitorGainNode = ctx.createGain();
      this.monitorGainNode.gain.setValueAtTime(this.isMonitoring ? 0.85 : 0, ctx.currentTime);

      // Connect source to HighPassFilter
      this.sourceNode.connect(this.highPassFilterNode);
      // Connect HighPassFilter to Analyser
      this.highPassFilterNode.connect(this.micAnalyserNode);
      // Connect HighPassFilter to Monitor Gain -> ctx.destination
      this.highPassFilterNode.connect(this.monitorGainNode);
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

          // AudioWorklet receives audio after the 80Hz HighPassFilter!
          this.highPassFilterNode.connect(this.workletNode);
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
        this.highPassFilterNode.connect(this.scriptProcessorNode);
        const muteGain = ctx.createGain();
        muteGain.gain.setValueAtTime(0, ctx.currentTime);
        this.scriptProcessorNode.connect(muteGain);
        muteGain.connect(ctx.destination);
      }

      this.isListening = true;
      this.pitchHistory = [];
      this.smoothedFreq = 0;
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

    // 1. Calculate RMS volume
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;

    // Noise gate check: Suppress quiet ambient noise and electrical hum
    if (rms < this.minVolumeRms || db < this.noiseGateDb) {
      if (this.lastReading?.isSinging && this.consecutiveDropFrames < this.maxHangoverFrames) {
        this.consecutiveDropFrames++;
        const heldReading: IVocalPitchReading = {
          ...this.lastReading,
          volumeRms: rms,
          volumeDb: Math.round(db),
          timestamp: performance.now(),
        };
        this.notifySubscribers(heldReading);
        return;
      }

      this.consecutiveDropFrames = 0;
      this.smoothedFreq = 0;
      this.pitchHistory = [];
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

    // 3. Filter valid human singing pitch based on vocal range & min frequency
    const effectiveMinFreq = this.getEffectiveMinFreq();
    const isValidPitch = 
      clarity >= this.minClarity && 
      rawPitch >= effectiveMinFreq && 
      rawPitch <= this.maxFreq;

    if (!isValidPitch) {
      // Hangover check: if user was singing and briefly dipped in clarity (e.g. consonant or breath)
      if (this.lastReading?.isSinging && this.consecutiveDropFrames < this.maxHangoverFrames && rms >= this.minVolumeRms * 0.7) {
        this.consecutiveDropFrames++;
        const heldReading: IVocalPitchReading = {
          ...this.lastReading,
          volumeRms: rms,
          volumeDb: Math.round(db),
          timestamp: performance.now(),
        };
        this.notifySubscribers(heldReading);
        return;
      }

      this.consecutiveDropFrames = 0;
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

    this.consecutiveDropFrames = 0;

    // 4. Median filter over recent 3 readings to eliminate octave jump flickers
    this.pitchHistory.push(rawPitch);
    if (this.pitchHistory.length > 3) {
      this.pitchHistory.shift();
    }
    const sorted = [...this.pitchHistory].sort((a, b) => a - b);
    const medianFreq = sorted[Math.floor(sorted.length / 2)];

    // 5. Exponential Moving Average (EMA) smoothing for studio-grade stability
    const alpha = 0.38;
    if (this.smoothedFreq === 0) {
      this.smoothedFreq = medianFreq;
    } else {
      this.smoothedFreq = alpha * medianFreq + (1 - alpha) * this.smoothedFreq;
    }

    // 6. Map to Note, Cents, and Solfege
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
   */
  public frequencyToNoteInfo(freqHz: number): {
    noteName: string;
    solfegeName: string;
    midiNumber: number;
    centsDeviation: number;
    nearestFreqHz: number;
  } {
    if (freqHz <= 0) {
      return { noteName: '', solfegeName: '', midiNumber: 0, centsDeviation: 0, nearestFreqHz: 0 };
    }

    // MIDI 69 = A4 (440 Hz)
    const exactMidi = 12 * Math.log2(freqHz / 440) + 69;
    const nearestMidi = Math.round(exactMidi);
    const centsDeviation = Math.round((exactMidi - nearestMidi) * 100);

    const noteIndex = ((nearestMidi % 12) + 12) % 12;
    const octave = Math.floor(nearestMidi / 12) - 1;

    const baseName = NOTE_NAMES[noteIndex];
    const solfege = SOLFEGE_NAMES[noteIndex];
    const noteName = `${baseName}${octave}`;
    const solfegeName = `${solfege} ${octave}`;

    // Standard frequency of the nearest chromatic note
    const nearestFreqHz = 440 * Math.pow(2, (nearestMidi - 69) / 12);

    return {
      noteName,
      solfegeName,
      midiNumber: nearestMidi,
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
    const matched = inTolerance && reading.clarity >= this.minClarity;

    // Stability score (1.0 = 0 cents diff, decays smoothly towards tolerance boundary)
    const normalizedErr = Math.min(1, Math.abs(centsDiff) / (toleranceCents * 1.5));
    const stabilityScore = Math.max(0, 1 - normalizedErr) * reading.clarity;

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

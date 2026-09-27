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
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private isListening = false;
  private detector: PitchDetector<Float32Array> | null = null;
  private bufferSize = 2048;

  // Smoothing & Filtering state
  private pitchHistory: number[] = [];
  private smoothedFreq = 0;
  private lastReading: IVocalPitchReading | null = null;
  private subscribers: Set<(reading: IVocalPitchReading) => void> = new Set();

  // Noise gate and limits
  private minVolumeRms = 0.005; // ~ -46 dBFS (high sensitivity for natural, relaxed singing)
  private minClarity = 0.68;    // 0.68 for McLeod Pitch Method (stable for natural human vocals)
  private minFreq = 65;   // C2 (approx 65.4 Hz)
  private maxFreq = 1100; // C6 (approx 1046.5 Hz)

  private consecutiveDropFrames = 0;
  private maxHangoverFrames = 4; // ~180ms grace window for vowel transitions and consonants

  // Vocal range preference
  private userRange: VocalRangePreference = 'auto';

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
   * Start microphone capture and pitch detection
   */
  public async startListening(): Promise<boolean> {
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

      // 2. Request microphone stream with clean echo cancellation & high sensitivity
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
        },
        video: false,
      });

      this.mediaStream = stream;
      this.sourceNode = ctx.createMediaStreamSource(stream);

      // 3. Initialize PitchDetector (MPM)
      this.detector = PitchDetector.forFloat32Array(this.bufferSize);
      this.detector.clarityThreshold = this.minClarity;

      // 4. Try loading AudioWorklet with inline Blob URL
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

          this.sourceNode.connect(this.workletNode);
          workletSuccess = true;
        }
      } catch (workletErr) {
        console.warn('AudioWorklet initialization fallback to ScriptProcessor:', workletErr);
      }

      // 5. Fallback to ScriptProcessorNode if AudioWorklet is blocked or failed
      if (!workletSuccess) {
        this.scriptProcessorNode = ctx.createScriptProcessor(this.bufferSize, 1, 1);
        this.scriptProcessorNode.onaudioprocess = (e) => {
          if (!this.isListening) return;
          const inputData = e.inputBuffer.getChannelData(0);
          this.processAudioBuffer(inputData, ctx.sampleRate);
        };
        this.sourceNode.connect(this.scriptProcessorNode);
        // ScriptProcessor must be connected to destination in some browsers to fire events
        // Use a 0-gain node to prevent microphone feedback loop into speakers!
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

    if (!forceFullTeardown) {
      // Keep stream warm for fast re-entry
      return;
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

    // Noise gate check
    if (rms < this.minVolumeRms) {
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

    // 3. Filter valid human singing pitch
    const isValidPitch = 
      clarity >= this.minClarity && 
      rawPitch >= this.minFreq && 
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

import * as Tone from 'tone';
import { getNoteFrequency } from './musicTheoryService';

export interface IADSREnvelope {
  attack: number;   // seconds (e.g. 0.02)
  decay: number;    // seconds (e.g. 0.15)
  sustain: number;  // gain level 0.0 to 1.0 (e.g. 0.6)
  release: number;  // seconds (e.g. 0.3)
}

export type TimbrePreset = 'acoustic-piano' | 'electric-piano' | 'pure-sine' | 'warm-saw' | 'woodwind';

export interface IPlayNoteOptions {
  volume?: number;
  pan?: number;               // -1.0 (left) to 1.0 (right)
  waveform?: OscillatorType;  // 'sine' | 'triangle' | 'square' | 'sawtooth'
  detuneCents?: number;       // cents deviation (-100 to +100)
  adsr?: IADSREnvelope;
  filterCutoff?: number;      // Hz
  filterType?: BiquadFilterType;
  filterQ?: number;
  timbrePreset?: TimbrePreset;
}

interface IActiveVoice {
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  oscillators: OscillatorNode[];
  startTime: number;
}

class AuditoryEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isUnlocked = false;
  private activeVoices: Map<string, IActiveVoice> = new Map();
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private isDroneRunning = false;
  private currentDroneNote = 'C3';

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

          this.analyser = this.ctx.createAnalyser();
          this.analyser.fftSize = 256;
          this.analyser.smoothingTimeConstant = 0.8;

          this.masterGain.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);

          // Pre-create 1 second of white noise for realistic snare / hi-hat
          this.createNoiseBuffer();

          // Configure Listener in 3D space safely
          this.setupAudioListener();
        } catch (e) {
          console.warn('AudioContext creation error:', e);
        }
      }
    }
    return this.ctx;
  }

  public setupAudioListener(): void {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const listener = this.ctx.listener;
      if (!listener) return;

      if (listener.positionX && listener.forwardX) {
        listener.positionX.setValueAtTime(0, now);
        listener.positionY.setValueAtTime(0, now);
        listener.positionZ.setValueAtTime(0, now);
        listener.forwardX.setValueAtTime(0, now);
        listener.forwardY.setValueAtTime(0, now);
        listener.forwardZ.setValueAtTime(-1, now);
        if (listener.upX) listener.upX.setValueAtTime(0, now);
        if (listener.upY) listener.upY.setValueAtTime(1, now);
        if (listener.upZ) listener.upZ.setValueAtTime(0, now);
      } else if (typeof listener.setPosition === 'function') {
        listener.setPosition(0, 0, 0);
        if (typeof listener.setOrientation === 'function') {
          listener.setOrientation(0, 0, -1, 0, 1, 0);
        }
      }
    } catch (e) {
      console.warn('AudioListener setup fallback:', e);
    }
  }

  public async resumeAudioContext(): Promise<boolean> {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
    } catch (err) {
      console.warn('Tone.start resume error:', err);
    }

    const ctx = this.initContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('Native AudioContext resume error:', err);
      }
    }
    this.isUnlocked = ctx.state === 'running';
    return this.isUnlocked;
  }

  public isAudioActive(): boolean {
    return (!!this.ctx && this.ctx.state === 'running') || Tone.context.state === 'running';
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  /**
   * Start playing a note with dynamic velocity sensitivity (timbre, harmonics, attack, gain)
   * Designed for real-time MIDI keyboard input and expressive touch.
   * @param noteOrFreq Note name (e.g. 'C4') or frequency in Hz
   * @param velocity 0.0 to 1.0 (or raw 1 to 127)
   */
  public startNote(
    noteOrFreq: string | number,
    velocity = 0.7,
    options: Partial<IPlayNoteOptions> = {}
  ): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const baseFreq = typeof noteOrFreq === 'number' ? noteOrFreq : getNoteFrequency(noteOrFreq);
    if (!baseFreq || isNaN(baseFreq) || baseFreq <= 0) return;

    const voiceKey = typeof noteOrFreq === 'number' ? noteOrFreq.toFixed(2) : noteOrFreq;

    // If this note is already active, stop old voice cleanly
    this.stopNote(voiceKey, 0.04);

    // Normalize velocity (supports 0..1 or raw 1..127 from MIDI)
    let normVel = velocity > 1.0 ? velocity / 127 : velocity;
    normVel = Math.max(0.01, Math.min(1.0, normVel));

    const now = Math.max(ctx.currentTime, 0.02) + 0.005;

    // 1. Dynamic Loudness Curve (Logarithmic perceptual curve)
    // Very soft touch (~0.1) -> gain ~0.03, Hard touch (~1.0) -> gain ~0.82
    const dynamicGain = Math.max(0.025, Math.min(1.0, Math.pow(normVel, 1.42) * 0.82));

    // 2. Dynamic Timbre Filter (Lowpass filter cutoff modulation)
    // Piano hammer acoustics: soft strike -> warm & dark; hard strike -> crisp, bright harmonics
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const minCutoff = Math.max(650, baseFreq * 2.0);
    const maxCutoff = Math.min(14500, Math.max(minCutoff * 3.5, baseFreq * 16));
    const targetCutoff = minCutoff + Math.pow(normVel, 1.35) * (maxCutoff - minCutoff);
    filter.frequency.setValueAtTime(targetCutoff, now);
    filter.Q.setValueAtTime(0.8 + normVel * 0.9, now);

    // 3. Dynamic Attack Time
    // Hard strike: 2.5ms punchy transient; Soft strike: 15ms gentle onset
    const attackTime = 0.015 - normVel * 0.0125;

    // 4. Voice Gain Node & ADSR envelope
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(dynamicGain, now + attackTime);
    // Natural acoustic piano decay if key held down
    voiceGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, dynamicGain * 0.18),
      now + attackTime + 3.2
    );
    voiceGain.gain.exponentialRampToValueAtTime(
      0.00001,
      now + attackTime + 6.0
    );

    // Filter -> VoiceGain -> MasterGain (which connects to AnalyserNode for oscilloscope)
    filter.connect(voiceGain);
    voiceGain.connect(this.masterGain);

    const oscillators: OscillatorNode[] = [];

    // Fundamental oscillator (Triangle wave for rich body)
    const osc1 = ctx.createOscillator();
    osc1.type = options.waveform || 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.connect(filter);
    osc1.start(now);
    oscillators.push(osc1);

    // 2nd Harmonic (Octave overtone, shines more with velocity)
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    const h2Gain = 0.12 + normVel * 0.22;
    osc2Gain.gain.setValueAtTime(h2Gain, now);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc2.start(now);
    oscillators.push(osc2);

    // 3rd Harmonic (Twelfth / hammer bite on harder velocities)
    if (normVel > 0.35) {
      const osc3 = ctx.createOscillator();
      const osc3Gain = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(baseFreq * 3, now);
      const h3Gain = Math.pow(normVel, 2.0) * 0.12;
      osc3Gain.gain.setValueAtTime(h3Gain, now);
      osc3.connect(osc3Gain);
      osc3Gain.connect(filter);
      osc3.start(now);
      oscillators.push(osc3);
    }

    this.activeVoices.set(voiceKey, {
      gainNode: voiceGain,
      filterNode: filter,
      oscillators,
      startTime: now
    });
  }

  /**
   * Stop playing a note on Note Off event with smooth natural damper release
   * @param noteOrFreq Note name (e.g. 'C4') or frequency
   * @param releaseSec Release time in seconds (default 0.18s like piano damper)
   */
  public stopNote(noteOrFreq: string | number, releaseSec = 0.18): void {
    const voiceKey = typeof noteOrFreq === 'number' ? noteOrFreq.toFixed(2) : noteOrFreq;
    const voice = this.activeVoices.get(voiceKey);
    if (!voice || !this.ctx) return;

    this.activeVoices.delete(voiceKey);

    const now = this.ctx.currentTime;
    try {
      voice.gainNode.gain.cancelScheduledValues(now);
      // Anchor current gain
      const currentGain = Math.max(0.0001, voice.gainNode.gain.value);
      voice.gainNode.gain.setValueAtTime(currentGain, now);
      voice.gainNode.gain.exponentialRampToValueAtTime(0.00001, now + releaseSec);

      setTimeout(() => {
        voice.oscillators.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        });
        try {
          voice.filterNode.disconnect();
          voice.gainNode.disconnect();
        } catch (e) {}
      }, Math.round((releaseSec + 0.05) * 1000));
    } catch (e) {
      console.warn('stopNote error:', e);
    }
  }

  /**
   * Stop all active notes immediately
   */
  public stopAllNotes(releaseSec = 0.12): void {
    const keys = Array.from(this.activeVoices.keys());
    keys.forEach(k => this.stopNote(k, releaseSec));
  }

  /**
   * Play a musical note with natural warm acoustic overtones (Piano/Vibraphone warmth)
   */
  public playNote(
    noteOrFreq: string | number,
    durationSec = 0.5,
    options: IPlayNoteOptions = {}
  ): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const baseFreq = typeof noteOrFreq === 'number' ? noteOrFreq : getNoteFrequency(noteOrFreq);
    if (!baseFreq || isNaN(baseFreq) || baseFreq <= 0) return;

    // Lookahead to prevent scheduling in the past or audio glitching
    const now = Math.max(ctx.currentTime, 0.04) + 0.02;
    const waveform = options.waveform ?? 'triangle';
    const pan = Math.max(-1, Math.min(1, options.pan ?? 0));
    const detune = options.detuneCents ?? 0;

    // Perceptual loudness compensation
    let volumeMultiplier = 1.0;
    if (waveform === 'sine') volumeMultiplier = 1.45;
    else if (waveform === 'triangle') volumeMultiplier = 1.2;
    else if (waveform === 'square') volumeMultiplier = 0.75;
    else if (waveform === 'sawtooth') volumeMultiplier = 0.7;
    const vol = (options.volume ?? 0.38) * volumeMultiplier;

    const adsr: IADSREnvelope = options.adsr ?? {
      attack: 0.02,
      decay: 0.15,
      sustain: 0.5,
      release: Math.max(0.12, durationSec * 0.4)
    };

    try {
      const gainNode = ctx.createGain();

      // Envelope shaping
      gainNode.gain.setValueAtTime(0.0001, now);
      // Attack
      gainNode.gain.linearRampToValueAtTime(vol, now + adsr.attack);
      // Decay to sustain
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.001, vol * adsr.sustain),
        now + adsr.attack + adsr.decay
      );
      // Sustain duration
      const stopTime = now + durationSec;
      // Release
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        stopTime + adsr.release
      );

      // Optional Biquad Filter
      let destinationNode: AudioNode = gainNode;
      if (options.filterCutoff) {
        const filter = ctx.createBiquadFilter();
        filter.type = options.filterType || 'lowpass';
        filter.frequency.setValueAtTime(options.filterCutoff, now);
        filter.Q.setValueAtTime(options.filterQ || 1.0, now);
        filter.connect(gainNode);
        destinationNode = filter;
      }

      // Panning
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
        gainNode.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gainNode.connect(this.masterGain);
      }

      // Fundamental oscillator
      const osc1 = ctx.createOscillator();
      osc1.type = waveform;
      osc1.frequency.setValueAtTime(baseFreq, now);
      if (detune !== 0) {
        osc1.detune.setValueAtTime(detune, now);
      }
      osc1.connect(destinationNode);
      osc1.start(now);
      osc1.stop(stopTime + adsr.release + 0.06);

      // Soft 2nd harmonic (octave overtone for acoustic presence)
      if (waveform === 'triangle' || waveform === 'sine') {
        const osc2 = ctx.createOscillator();
        const osc2Gain = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 2, now);
        if (detune !== 0) osc2.detune.setValueAtTime(detune, now);
        osc2Gain.gain.setValueAtTime(0.2, now);
        osc2.connect(osc2Gain);
        osc2Gain.connect(destinationNode);
        osc2.start(now);
        osc2.stop(stopTime + adsr.release + 0.06);
      }
    } catch (e) {
      console.warn('playNote error:', e);
    }
  }

  /**
   * Play a sequence of notes sequentially
   */
  public async playNoteSequence(
    notes: string[],
    noteIntervalMs = 500,
    noteDurationSec = 0.45,
    onNoteTrigger?: (note: string, index: number) => void
  ): Promise<void> {
    await this.resumeAudioContext();
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (onNoteTrigger) {
        onNoteTrigger(note, i);
      }
      this.playNote(note, noteDurationSec);
      await new Promise(resolve => setTimeout(resolve, noteIntervalMs));
    }
    await new Promise(resolve => setTimeout(resolve, Math.round(noteDurationSec * 1000) + 120));
  }

  /**
   * Play an interval (melodic ascending, melodic descending, or simultaneous harmonic)
   */
  public async playInterval(
    noteA: string,
    noteB: string,
    mode: 'ascending' | 'descending' | 'harmonic',
    durationSec = 0.6,
    gapMs = 450
  ): Promise<void> {
    await this.resumeAudioContext();
    if (mode === 'harmonic') {
      // Play simultaneously
      this.playNote(noteA, durationSec, { volume: 0.32 });
      this.playNote(noteB, durationSec, { volume: 0.32 });
      await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 120));
    } else if (mode === 'ascending') {
      this.playNote(noteA, durationSec * 0.85);
      await new Promise(r => setTimeout(r, gapMs));
      this.playNote(noteB, durationSec);
      await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 120));
    } else {
      // descending
      this.playNote(noteB, durationSec * 0.85);
      await new Promise(r => setTimeout(r, gapMs));
      this.playNote(noteA, durationSec);
      await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 120));
    }
  }

  /**
   * Play a chord (block chord or rolling arpeggio)
   */
  public async playChord(
    notes: string[],
    mode: 'block' | 'arpeggio' = 'block',
    durationSec = 1.0,
    arpeggioDelayMs = 60
  ): Promise<void> {
    await this.resumeAudioContext();
    if (mode === 'block') {
      const singleVol = Math.max(0.14, 0.46 / Math.sqrt(notes.length));
      notes.forEach(note => {
        this.playNote(note, durationSec, { volume: singleVol });
      });
      await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 150));
    } else {
      // Arpeggio
      const singleVol = 0.32;
      for (let i = 0; i < notes.length; i++) {
        this.playNote(notes[i], Math.max(0.4, durationSec - (i * 0.05)), { volume: singleVol });
        await new Promise(r => setTimeout(r, arpeggioDelayMs));
      }
      await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 150));
    }
  }

  /**
   * Play a Tonic Anchor (neo âm chủ) to firmly establish tonal center in auditory cortex
   * @param tonicNote Root note name (default 'C4')
   * @param mode 'chord' (Tonic Triad) | 'single' (Root + Octave tuning fork) | 'cadence' (V -> I resolution)
   */
  public async playTonicAnchor(
    tonicNote = 'C4',
    mode: 'chord' | 'single' | 'cadence' = 'chord',
    durationSec = 1.0
  ): Promise<void> {
    await this.resumeAudioContext();
    const cleanNote = tonicNote.toUpperCase();
    const oct = parseInt(cleanNote.slice(-1), 10) || 4;
    const letter = cleanNote.slice(0, -1);

    if (mode === 'single') {
      // Deep tuning-fork anchor: Root + Low Octave
      const lowOctave = `${letter}${Math.max(2, oct - 1)}`;
      this.playNote(lowOctave, durationSec * 1.1, { volume: 0.32, waveform: 'triangle' });
      this.playNote(tonicNote, durationSec, { volume: 0.38, waveform: 'sine' });
      await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 100));
    } else if (mode === 'cadence') {
      // V -> I Classical cadence to lock tonal expectation
      // Determine approximate Dominant (V)
      const domRoot = letter === 'C' ? 'G' : letter === 'F' ? 'C' : letter === 'G' ? 'D' : 'G';
      await this.playChord([`${domRoot}${oct - 1}`, `${letter}${oct}`], 'block', 0.42);
      await new Promise(r => setTimeout(r, 80));
      // Resolve to Tonic triad
      await this.playChord([tonicNote, `${letter}${oct}`], 'arpeggio', durationSec, 40);
    } else {
      // Tonic Triad (or open fifth for universal diatonic stability)
      const baseFreq = getNoteFrequency(tonicNote);
      if (baseFreq > 0) {
        // Root + 5th (e.g. C4 + G4) + Octave (C5)
        const fifthFreq = baseFreq * 1.4983; // equal tempered fifth
        const octFreq = baseFreq * 2.0;

        this.playNote(baseFreq, durationSec * 1.1, { volume: 0.35, waveform: 'triangle' });
        setTimeout(() => {
          this.playNote(fifthFreq, durationSec * 0.95, { volume: 0.28, waveform: 'sine' });
        }, 35);
        setTimeout(() => {
          this.playNote(octFreq, durationSec * 0.85, { volume: 0.22, waveform: 'triangle' });
        }, 70);

        await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 120));
      }
    }
  }

  /**
   * Start a continuous ambient background drone to anchor relative pitch perception
   * @param tonicNote Anchor root note (default 'C3')
   * @param volume Subtle ambient gain (default 0.08)
   */
  public startDrone(tonicNote = 'C3', volume = 0.08): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    // If drone is already running for same note, leave it
    if (this.isDroneRunning && this.currentDroneNote === tonicNote) return;
    this.stopDrone(0.2);

    const baseFreq = getNoteFrequency(tonicNote) || 130.81; // C3
    const fifthFreq = baseFreq * 1.4983; // G3
    const now = ctx.currentTime;

    try {
      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.0001, now);
      droneGain.gain.linearRampToValueAtTime(volume, now + 0.8);

      // Lowpass filter for smooth, warm ambient pad
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, now);
      filter.Q.setValueAtTime(1.0, now);

      filter.connect(droneGain);
      droneGain.connect(this.masterGain);

      // Fundamental oscillator (Root)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.connect(filter);
      osc1.start(now);

      // 5th interval harmonic drone oscillator
      const osc2 = ctx.createOscillator();
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.5, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(fifthFreq, now);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      osc2.start(now);

      this.droneOscs = [osc1, osc2];
      this.droneGain = droneGain;
      this.isDroneRunning = true;
      this.currentDroneNote = tonicNote;
    } catch (e) {
      console.warn('startDrone error:', e);
    }
  }

  /**
   * Stop continuous ambient drone with smooth fade out
   */
  public stopDrone(fadeSec = 0.4): void {
    if (!this.isDroneRunning || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      if (this.droneGain) {
        this.droneGain.gain.cancelScheduledValues(now);
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
        this.droneGain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
      }
      const oscsToStop = [...this.droneOscs];
      setTimeout(() => {
        oscsToStop.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
      }, Math.round((fadeSec + 0.05) * 1000));
    } catch (e) {
      console.warn('stopDrone error:', e);
    } finally {
      this.droneOscs = [];
      this.droneGain = null;
      this.isDroneRunning = false;
    }
  }

  /**
   * Check if ambient drone is currently sounding
   */
  public isDroneActive(): boolean {
    return this.isDroneRunning;
  }

  /**
   * Play a note with explicit Timbre Preset for forced variability learning
   */
  public playPresetNote(
    noteOrFreq: string | number,
    durationSec = 0.5,
    preset: TimbrePreset = 'acoustic-piano',
    options: IPlayNoteOptions = {}
  ): void {
    switch (preset) {
      case 'pure-sine':
        this.playNote(noteOrFreq, durationSec, {
          ...options,
          waveform: 'sine',
          volume: options.volume ?? 0.42,
          adsr: { attack: 0.03, decay: 0.1, sustain: 0.7, release: durationSec * 0.3 }
        });
        break;
      case 'electric-piano':
        this.playNote(noteOrFreq, durationSec, {
          ...options,
          waveform: 'sine',
          filterCutoff: 3400,
          filterType: 'lowpass',
          volume: options.volume ?? 0.36,
          adsr: { attack: 0.012, decay: 0.22, sustain: 0.45, release: durationSec * 0.4 }
        });
        break;
      case 'warm-saw':
        this.playNote(noteOrFreq, durationSec, {
          ...options,
          waveform: 'sawtooth',
          filterCutoff: 1600,
          filterQ: 1.2,
          volume: options.volume ?? 0.28,
          adsr: { attack: 0.025, decay: 0.2, sustain: 0.5, release: durationSec * 0.35 }
        });
        break;
      case 'woodwind':
        this.playNote(noteOrFreq, durationSec, {
          ...options,
          waveform: 'triangle',
          filterCutoff: 2200,
          volume: options.volume ?? 0.38,
          adsr: { attack: 0.05, decay: 0.15, sustain: 0.75, release: durationSec * 0.25 }
        });
        break;
      case 'acoustic-piano':
      default:
        this.playNote(noteOrFreq, durationSec, options);
        break;
    }
  }

  /**
   * Synthesize percussion instruments (Kick, Snare, Hi-hat, Tom, Woodblock)
   */
  public playDrum(type: 'kick' | 'snare' | 'hihat' | 'tom' | 'woodblock' = 'snare', velocity = 1.0): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const vol = Math.max(0.01, Math.min(1.0, velocity));

    if (type === 'kick') {
      // Punchy deep kick: fast pitch sweep from 140Hz to 38Hz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      gain.gain.setValueAtTime(0.7 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'snare') {
      // Snare: noise burst + pitched snap
      if (this.noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(800, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6 * vol, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.22);
      }

      // Snare tone body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      oscGain.gain.setValueAtTime(0.4 * vol, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hihat') {
      // Crisp metallic hi-hat: highpass filtered noise
      if (this.noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(9500, now);
        filter.Q.setValueAtTime(3.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.08);
      }
    } else if (type === 'tom') {
      // Resonant tom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);

      gain.gain.setValueAtTime(0.55 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.38);
    } else {
      // Woodblock / Clave
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.04);

      gain.gain.setValueAtTime(0.6 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  /**
   * 3D Spatial Audio using HRTF PannerNode with Pinna Spectral Cues
   * Azimuth: 0 = straight ahead, 90 = right, 180 = behind, 270 = left
   * Elevation: -90 = below, 0 = level, +90 = above
   * Distance: meters (1 to 20)
   */
  public play3DSpatialTone(
    noteOrFreq: string | number = 'C4',
    azimuthDeg = 0,
    elevationDeg = 0,
    distanceMeters = 2.0,
    durationSec = 0.55
  ): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.setupAudioListener();

    const baseFreq = typeof noteOrFreq === 'number' ? noteOrFreq : getNoteFrequency(noteOrFreq);
    const now = ctx.currentTime;

    // Convert spherical polar coords to cartesian (Web Audio coordinate system: x=right, y=up, z=towards listener)
    const azRad = (azimuthDeg * Math.PI) / 180;
    const elRad = (elevationDeg * Math.PI) / 180;

    const x = distanceMeters * Math.sin(azRad) * Math.cos(elRad);
    const y = distanceMeters * Math.sin(elRad);
    const z = -distanceMeters * Math.cos(azRad) * Math.cos(elRad);

    // HRTF Panner
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 1000;
    panner.rolloffFactor = 1.2;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, now);
      panner.positionY.setValueAtTime(y, now);
      panner.positionZ.setValueAtTime(z, now);
    } else {
      panner.setPosition(x, y, z);
    }

    // Pinna spectral filter (Behind vs Front cues)
    // When sound is behind (90° < angle < 270°), the human pinna dampens frequencies above 3.5kHz
    const isBehind = azimuthDeg > 110 && azimuthDeg < 250;
    const pinnaFilter = ctx.createBiquadFilter();
    if (isBehind) {
      pinnaFilter.type = 'lowpass';
      pinnaFilter.frequency.setValueAtTime(2800, now);
      pinnaFilter.Q.setValueAtTime(0.7, now);
    } else {
      pinnaFilter.type = 'peaking';
      pinnaFilter.frequency.setValueAtTime(3600, now);
      pinnaFilter.gain.setValueAtTime(4.0, now);
      pinnaFilter.Q.setValueAtTime(1.2, now);
    }

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    // Rich dual-oscillator acoustic spatial pulse (fundamental + bright transient harmonic for instant localization)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    // Frequency sweep downward for clear sonar/radar acoustic ping
    osc2.frequency.setValueAtTime(baseFreq * 2.5, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);

    gain.connect(pinnaFilter);
    pinnaFilter.connect(panner);
    panner.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + 0.25);
  }

  /**
   * Play an additive overtone stimulus with RMS normalization (M0-1 Overtone Spotting)
   * Plays 5 additive harmonics (f, 2f, 3f, 4f, 5f) and boosts one harmonic during the middle window.
   * Total acoustic energy (RMS) is strictly preserved so the listener cannot use overall loudness as a cue.
   */
  public async playOvertoneStimulus(
    baseFreqOrNote: number | string = 'C3',
    boostHarmonicIndex: number = 2, // 1 to 5
    boostDb: number = 9,
    durationSec = 1.8
  ): Promise<void> {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;
    await this.resumeAudioContext();

    const baseFreq = typeof baseFreqOrNote === 'number' ? baseFreqOrNote : getNoteFrequency(baseFreqOrNote);
    if (!baseFreq || baseFreq <= 0) return;

    const now = Math.max(ctx.currentTime, 0.04) + 0.02;
    const boostFactor = Math.pow(10, boostDb / 20);

    // Natural acoustic harmonic rolloff (1/n)
    const baseGains = [1.0, 0.52, 0.35, 0.25, 0.18];
    const boostedGains = baseGains.map((g, idx) => (idx + 1 === boostHarmonicIndex ? g * boostFactor : g));

    // Calculate RMS for strict loudness normalization
    const baseRms = Math.sqrt(baseGains.reduce((sum, g) => sum + g * g, 0));
    const boostedRms = Math.sqrt(boostedGains.reduce((sum, g) => sum + g * g, 0));
    const rmsNormalizationFactor = baseRms / boostedRms;
    const finalBoostedGains = boostedGains.map(g => g * rmsNormalizationFactor);

    const overallGainNode = ctx.createGain();
    overallGainNode.gain.setValueAtTime(0.001, now);
    overallGainNode.gain.linearRampToValueAtTime(0.42, now + 0.08);
    overallGainNode.gain.setValueAtTime(0.42, now + durationSec - 0.12);
    overallGainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    overallGainNode.connect(this.masterGain);

    // Mid-section time window for the overtone emphasis
    const midStart = now + durationSec * 0.32;
    const midEnd = now + durationSec * 0.72;

    for (let i = 0; i < 5; i++) {
      const harmonicNumber = i + 1;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * harmonicNumber, now);

      const initialGain = baseGains[i] * 0.22;
      const midGain = finalBoostedGains[i] * 0.22;

      oscGain.gain.setValueAtTime(initialGain, now);
      oscGain.gain.linearRampToValueAtTime(midGain, midStart);
      oscGain.gain.setValueAtTime(midGain, midEnd);
      oscGain.gain.linearRampToValueAtTime(initialGain, now + durationSec - 0.08);

      osc.connect(oscGain);
      oscGain.connect(overallGainNode);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    }

    await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 120));
  }

  /**
   * Play an articulated note with musical phrasing (Legato, Staccato, Tenuto, Accent)
   */
  public playArticulatedNote(
    noteOrFreq: string | number,
    articulation: 'legato' | 'staccato' | 'tenuto' | 'accent' = 'legato',
    nominalDurationSec = 0.55,
    options: IPlayNoteOptions = {}
  ): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    let effDuration = nominalDurationSec;
    let attackTime = 0.02;
    let decayTime = 0.12;
    let sustainLevel = 0.6;
    let releaseTime = 0.15;
    let volMultiplier = 1.0;

    switch (articulation) {
      case 'staccato':
        // Crisp, detached, 35% of nominal duration
        effDuration = nominalDurationSec * 0.35;
        attackTime = 0.008;
        decayTime = 0.06;
        sustainLevel = 0.15;
        releaseTime = 0.04;
        volMultiplier = 1.1;
        break;
      case 'legato':
        // Smooth connected, gentle attack, long release
        attackTime = 0.035;
        sustainLevel = 0.75;
        releaseTime = 0.26;
        break;
      case 'tenuto':
        // Held full value, heavy steady sustain
        attackTime = 0.015;
        sustainLevel = 0.92;
        releaseTime = 0.08;
        break;
      case 'accent':
        // Punchy transient attack bite (+35% peak)
        volMultiplier = 1.35;
        attackTime = 0.006;
        decayTime = 0.08;
        sustainLevel = 0.45;
        releaseTime = 0.12;
        break;
    }

    this.playNote(noteOrFreq, effDuration, {
      ...options,
      volume: (options.volume ?? 0.35) * volMultiplier,
      adsr: {
        attack: attackTime,
        decay: decayTime,
        sustain: sustainLevel,
        release: releaseTime
      }
    });
  }

  /**
   * Play an articulated sequence of notes to demonstrate articulation differences
   */
  public async playArticulatedSequence(
    notes: string[],
    articulation: 'legato' | 'staccato' | 'tenuto' | 'accent',
    noteIntervalMs = 420
  ): Promise<void> {
    await this.resumeAudioContext();
    for (let i = 0; i < notes.length; i++) {
      this.playArticulatedNote(notes[i], articulation, noteIntervalMs / 1000);
      await new Promise(r => setTimeout(r, noteIntervalMs));
    }
  }

  /**
   * Play a Harmonic Cadence progression (V-I, x-V, V-vi, IV-I)
   */
  public async playCadence(
    chordProgression: string[][],
    chordDurationSec = 0.95,
    gapMs = 140
  ): Promise<void> {
    await this.resumeAudioContext();
    for (let i = 0; i < chordProgression.length; i++) {
      const chordNotes = chordProgression[i];
      await this.playChord(chordNotes, 'block', chordDurationSec);
      if (i < chordProgression.length - 1) {
        await new Promise(r => setTimeout(r, gapMs));
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }

  /**
   * Play multi-voice polyphonic streams with Bregman auditory stream separation (Voice Tracking)
   */
  public async playPolyphonicStreams(
    streams: Array<{
      name: string; // 'soprano' | 'alto' | 'bass'
      notes: Array<{ note: string; durationSec: number; rest?: boolean }>;
      waveform?: OscillatorType;
      pan?: number;
      volume?: number;
    }>,
    soloStreamName?: string
  ): Promise<void> {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;
    await this.resumeAudioContext();

    const streamsToPlay = soloStreamName
      ? streams.filter(s => s.name === soloStreamName)
      : streams;

    const baseStartTime = Math.max(ctx.currentTime, 0.04) + 0.05;
    let maxStreamDuration = 0;

    streamsToPlay.forEach(stream => {
      let voiceCurrentTime = baseStartTime;
      const pan = stream.pan ?? (stream.name === 'soprano' ? 0.35 : stream.name === 'bass' ? -0.35 : 0.0);
      const waveform = stream.waveform ?? (stream.name === 'soprano' ? 'triangle' : stream.name === 'bass' ? 'sawtooth' : 'sine');
      const baseVol = stream.volume ?? 0.32;

      stream.notes.forEach(item => {
        if (!item.rest && item.note) {
          const freq = getNoteFrequency(item.note);
          if (freq && freq > 0) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = waveform;
            osc.frequency.setValueAtTime(freq, voiceCurrentTime);

            gain.gain.setValueAtTime(0.0001, voiceCurrentTime);
            gain.gain.linearRampToValueAtTime(baseVol, voiceCurrentTime + 0.015);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.001, baseVol * 0.4), voiceCurrentTime + item.durationSec * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.00001, voiceCurrentTime + item.durationSec);

            if (typeof ctx.createStereoPanner === 'function') {
              const panner = ctx.createStereoPanner();
              panner.pan.setValueAtTime(pan, voiceCurrentTime);
              osc.connect(gain);
              gain.connect(panner);
              panner.connect(this.masterGain!);
            } else {
              osc.connect(gain);
              gain.connect(this.masterGain!);
            }

            osc.start(voiceCurrentTime);
            osc.stop(voiceCurrentTime + item.durationSec + 0.05);
          }
        }
        voiceCurrentTime += item.durationSec;
      });

      const streamTotal = voiceCurrentTime - baseStartTime;
      if (streamTotal > maxStreamDuration) {
        maxStreamDuration = streamTotal;
      }
    });

    await new Promise(r => setTimeout(r, Math.round(maxStreamDuration * 1000) + 150));
  }

  /**
   * Play dynamic contour (crescendo / decrescendo / terraced dynamics)
   */
  public async playDynamicContour(
    notes: string[],
    contour: 'crescendo' | 'decrescendo' | 'flat',
    nominalDurationSec = 0.45
  ): Promise<void> {
    await this.resumeAudioContext();
    const count = notes.length;
    for (let i = 0; i < count; i++) {
      let vol = 0.35;
      if (contour === 'crescendo') {
        vol = 0.12 + (i / Math.max(1, count - 1)) * 0.45;
      } else if (contour === 'decrescendo') {
        vol = 0.55 - (i / Math.max(1, count - 1)) * 0.43;
      }
      this.playNote(notes[i], nominalDurationSec, { volume: vol });
      await new Promise(r => setTimeout(r, Math.round(nominalDurationSec * 1000)));
    }
  }

  /**
   * Sound effect for connecting two nodes in Relational Dynamics / Sound Network
   * Synthesizes the harmonic interval between the two nodes
   */
  public playRelationalConnection(freq1 = 261.63, freq2 = 392.00, relationType = 'FLOW_CONNECT'): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.playNote(freq1, 0.45, { volume: 0.28, waveform: 'triangle', pan: -0.2 });
    setTimeout(() => {
      this.playNote(freq2, 0.45, { volume: 0.28, waveform: 'sine', pan: 0.2 });
    }, 45);

    // Subtle resonant harmonic shimmer for harmony relations
    if (relationType === 'SOUND_HARMONIZE' || relationType === 'FLOW_CONNECT') {
      setTimeout(() => {
        const overtoneFreq = Math.max(freq1, freq2) * 1.5;
        this.playNote(overtoneFreq, 0.25, { volume: 0.12, waveform: 'triangle' });
      }, 90);
    }
  }

  /**
   * Sound effect for slicing/cutting a connection in Relational Dynamics
   * Pitch changes with cutRatio (higher pitch for target cuts, deeper resonant snap for source cuts)
   */
  public playRelationalCut(baseFrequency = 440, cutRatio = 0.5): void {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startFreq = baseFrequency * (0.8 + cutRatio * 1.4);
      const endFreq = baseFrequency * 0.35;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + 0.14);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(startFreq * 1.2, now);
      filter.Q.setValueAtTime(3.5, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('playRelationalCut error:', e);
    }
  }

  /**
   * Play additive synthesis note with a boosted harmonic overtone (Overtone Spotting)
   * @param baseFreq Fundamental frequency in Hz (e.g. 130.81 for C3)
   * @param boostedPartial 1=Fundamental, 2=Octave, 3=Twelfth/Fifth, 4=Double Octave, 5=Major 17th
   */
  public async playOvertoneSpotting(baseFreq = 130.81, boostedPartial = 2, durationSec = 1.2): Promise<void> {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;
    await this.resumeAudioContext();

    const now = ctx.currentTime + 0.02;
    const partials = [1, 2, 3, 4, 5];

    partials.forEach(p => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = baseFreq * p;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Normal partial rolloff: 1/p
      let pVol = (0.28 / Math.sqrt(p));
      if (p === boostedPartial) {
        // Prominently boost the target overtone
        pVol *= 2.8;
      } else {
        pVol *= 0.65;
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(pVol, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, pVol * 0.4), now + durationSec * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    });

    await new Promise(r => setTimeout(r, Math.round(durationSec * 1000) + 100));
  }

  /**
   * Play an articulation sequence with exact acoustic physics
   * staccato = 28% duration; legato = 105% duration with overlap; tenuto = 90% duration; accent = +6dB initial punch
   */
  public async playArticulationSequence(
    notes: string[],
    articulation: 'legato' | 'staccato' | 'tenuto' | 'accent',
    stepDurationSec = 0.45
  ): Promise<void> {
    await this.resumeAudioContext();
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      let noteDuration = stepDurationSec * 0.8;
      let vol = 0.35;
      let attack = 0.02;

      if (articulation === 'staccato') {
        noteDuration = stepDurationSec * 0.28;
        attack = 0.008;
      } else if (articulation === 'legato') {
        noteDuration = stepDurationSec * 1.08; // smooth overlap
        attack = 0.035;
      } else if (articulation === 'tenuto') {
        noteDuration = stepDurationSec * 0.92;
        attack = 0.02;
      } else if (articulation === 'accent') {
        noteDuration = stepDurationSec * 0.75;
        vol = 0.55;
        attack = 0.005;
      }

      this.playNote(note, noteDuration, { volume: vol, adsr: { attack, decay: 0.1, sustain: 0.6, release: 0.05 } });
      await new Promise(r => setTimeout(r, Math.round(stepDurationSec * 1000)));
    }
  }

  /**
   * Play Classical Cadence progression (V-I, x-V, V-vi, IV-I) with full 4-part harmony
   */
  public async playCadenceProgression(
    cadenceType: 'AUTHENTIC' | 'HALF' | 'DECEPTIVE' | 'PLAGAL',
    _rootNote = 'C4'
  ): Promise<void> {
    await this.resumeAudioContext();
    let chord1: string[] = [];
    let chord2: string[] = [];

    if (cadenceType === 'AUTHENTIC') {
      // V -> I (G Major -> C Major)
      chord1 = ['G3', 'B3', 'D4', 'G4'];
      chord2 = ['C3', 'E4', 'G4', 'C5'];
    } else if (cadenceType === 'HALF') {
      // IV -> V (F Major -> G Major)
      chord1 = ['F3', 'A3', 'C4', 'F4'];
      chord2 = ['G3', 'B3', 'D4', 'G4'];
    } else if (cadenceType === 'DECEPTIVE') {
      // V -> vi (G Major -> A Minor)
      chord1 = ['G3', 'B3', 'D4', 'G4'];
      chord2 = ['A3', 'C4', 'E4', 'A4'];
    } else {
      // PLAGAL (IV -> I: Amen cadence)
      chord1 = ['F3', 'A3', 'C4', 'F4'];
      chord2 = ['C3', 'E4', 'G4', 'C5'];
    }

    await this.playChord(chord1, 'block', 0.65, 0);
    await new Promise(r => setTimeout(r, 120));
    await this.playChord(chord2, 'block', 0.95, 0);
    await new Promise(r => setTimeout(r, 1000));
  }

  /**
   * Play domino step sound for Causal Cascade
   */
  public playCausalDominoStep(stepIndex = 1, isTarget = false): void {
    if (isTarget) {
      this.playNote('C5', 0.3, { volume: 0.35, waveform: 'triangle' });
      setTimeout(() => this.playNote('E5', 0.3, { volume: 0.35, waveform: 'triangle' }), 60);
      setTimeout(() => this.playNote('G5', 0.5, { volume: 0.4, waveform: 'sine' }), 120);
    } else {
      const baseFreq = 220 * Math.pow(1.059463, Math.min(18, stepIndex * 2));
      this.playNote(baseFreq, 0.12, { volume: 0.28, waveform: 'triangle', adsr: { attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.04 } });
    }
  }
  public playFeedback(isCorrect: boolean): void {
    if (isCorrect) {
      this.playNote('E5', 0.12, { volume: 0.25, waveform: 'sine' });
      setTimeout(() => {
        this.playNote('B5', 0.22, { volume: 0.3, waveform: 'triangle' });
      }, 90);
    } else {
      this.playNote('C#3', 0.25, { volume: 0.28, waveform: 'sawtooth', filterCutoff: 600 });
    }
  }
}

export const auditoryEngine = new AuditoryEngine();

// Auto-unlock AudioContext on the very first user click, touch or keydown anywhere on the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    auditoryEngine.resumeAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}

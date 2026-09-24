import * as Tone from 'tone';
import { getNoteFrequency } from './musicTheoryService';

export interface IADSREnvelope {
  attack: number;   // seconds (e.g. 0.02)
  decay: number;    // seconds (e.g. 0.15)
  sustain: number;  // gain level 0.0 to 1.0 (e.g. 0.6)
  release: number;  // seconds (e.g. 0.3)
}

export interface IPlayNoteOptions {
  volume?: number;
  pan?: number;               // -1.0 (left) to 1.0 (right)
  waveform?: OscillatorType;  // 'sine' | 'triangle' | 'square' | 'sawtooth'
  detuneCents?: number;       // cents deviation (-100 to +100)
  adsr?: IADSREnvelope;
  filterCutoff?: number;      // Hz
  filterType?: BiquadFilterType;
  filterQ?: number;
}

class AuditoryEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isUnlocked = false;

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
   * Sound effect for correct or incorrect answers in audio exercises
   */
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

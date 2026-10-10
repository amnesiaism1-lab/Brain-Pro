/**
 * Unified Music Pitch & Frequency Utility Functions
 * Single source of truth for frequency, MIDI, cents deviation, and octave folding.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];

export const SOLFEGE_NAMES = ['Đô', 'Đô#', 'Rê', 'Rê#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'] as const;
export type SolfegeName = typeof SOLFEGE_NAMES[number];

export interface INoteInfo {
  noteName: string;          // e.g. "A4", "F#2"
  solfegeName: string;       // e.g. "La 4", "Fa# 2"
  baseNote: NoteName;        // e.g. "A", "F#"
  solfegeBase: SolfegeName;  // e.g. "La", "Fa#"
  pitchClass: number;        // 0..11 (0 = C, 1 = C#, ..., 9 = A, 11 = B)
  octave: number;            // e.g. 4
  midiNumber: number;        // Rounded MIDI number (e.g. 69 for A4)
  exactMidi: number;         // Float MIDI number (e.g. 69.15)
  centsDeviation: number;    // Difference in cents from nearest note (-50..+50)
  nearestFreqHz: number;     // Canonical frequency of the nearest note
}

/**
 * Convert frequency in Hz to floating-point MIDI number
 */
export function freqToMidi(freqHz: number, a4 = 440): number {
  if (freqHz <= 0 || !isFinite(freqHz)) return 0;
  return 12 * Math.log2(freqHz / a4) + 69;
}

/**
 * Convert MIDI number to frequency in Hz
 */
export function midiToFreq(midi: number, a4 = 440): number {
  if (midi <= 0 || !isFinite(midi)) return 0;
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Canonical cents difference between two frequencies (f / fRef)
 * Positive = sharp (higher), negative = flat (lower)
 */
export function centsDiff(freqHz: number, refFreqHz: number): number {
  if (freqHz <= 0 || refFreqHz <= 0 || !isFinite(freqHz) || !isFinite(refFreqHz)) return 0;
  return 1200 * Math.log2(freqHz / refFreqHz);
}

/**
 * Mathematical octave folding of cents into the canonical range [-600, +600)
 */
export function foldCents(cents: number): number {
  if (!isFinite(cents)) return 0;
  return (((cents + 600) % 1200 + 1200) % 1200) - 600;
}

/**
 * Convert MIDI note number to structured note naming
 */
export function midiToNoteInfo(midi: number, a4 = 440): INoteInfo {
  const exactMidi = midi;
  const chosenMidi = Math.round(midi);
  const pitchClass = ((chosenMidi % 12) + 12) % 12;
  const octave = Math.floor(chosenMidi / 12) - 1;
  const baseNote = NOTE_NAMES[pitchClass];
  const solfegeBase = SOLFEGE_NAMES[pitchClass];
  const centsDeviation = Math.round((exactMidi - chosenMidi) * 100);
  const nearestFreqHz = Math.round(midiToFreq(chosenMidi, a4) * 100) / 100;

  return {
    noteName: `${baseNote}${octave}`,
    solfegeName: `${solfegeBase} ${octave}`,
    baseNote,
    solfegeBase,
    pitchClass,
    octave,
    midiNumber: chosenMidi,
    exactMidi: Math.round(exactMidi * 100) / 100,
    centsDeviation,
    nearestFreqHz,
  };
}

export interface IFreqToNoteOptions {
  a4?: number;
  lockedMidi?: number;
  applyHysteresis?: boolean;
  hysteresisMargin?: number; // Default 0.54 semitones (~4 cents over knife-edge)
}

/**
 * Convert frequency in Hz to comprehensive note information with optional boundary hysteresis
 */
export function freqToNote(freqHz: number, options: IFreqToNoteOptions = {}): INoteInfo {
  if (freqHz <= 0 || !isFinite(freqHz)) {
    return {
      noteName: '',
      solfegeName: '',
      baseNote: 'C',
      solfegeBase: 'Đô',
      pitchClass: 0,
      octave: 0,
      midiNumber: 0,
      exactMidi: 0,
      centsDeviation: 0,
      nearestFreqHz: 0,
    };
  }

  const a4 = options.a4 ?? 440;
  const exactMidi = freqToMidi(freqHz, a4);
  let chosenMidi = Math.round(exactMidi);

  if (options.applyHysteresis && options.lockedMidi && options.lockedMidi > 0) {
    const margin = options.hysteresisMargin ?? 0.54;
    const diff = exactMidi - options.lockedMidi;
    if (Math.abs(diff) <= margin) {
      chosenMidi = options.lockedMidi;
    }
  }

  const pitchClass = ((chosenMidi % 12) + 12) % 12;
  const octave = Math.floor(chosenMidi / 12) - 1;
  const baseNote = NOTE_NAMES[pitchClass];
  const solfegeBase = SOLFEGE_NAMES[pitchClass];
  const centsDeviation = Math.round((exactMidi - chosenMidi) * 100);
  const nearestFreqHz = Math.round(midiToFreq(chosenMidi, a4) * 100) / 100;

  return {
    noteName: `${baseNote}${octave}`,
    solfegeName: `${solfegeBase} ${octave}`,
    baseNote,
    solfegeBase,
    pitchClass,
    octave,
    midiNumber: chosenMidi,
    exactMidi: Math.round(exactMidi * 100) / 100,
    centsDeviation,
    nearestFreqHz,
  };
}

/**
 * Fold user's MIDI value to the nearest octave of the target MIDI
 */
export function foldMidiToTargetOctave(userMidi: number, targetMidi: number): {
  foldedMidi: number;
  octaveShift: number;
} {
  const octaveShift = Math.round((userMidi - targetMidi) / 12);
  const foldedMidi = userMidi - octaveShift * 12;
  return { foldedMidi, octaveShift };
}

/**
 * Evaluate cents deviation against a target note or frequency, with optional smart octave folding
 */
export function evaluateCentsDeviation(
  userFreqHz: number,
  targetMidi: number,
  options: { smartOctaveFold?: boolean; a4?: number } = {}
): {
  centsDiff: number;
  userExactMidi: number;
  displayMidi: number;
  octaveShift: number;
} {
  const a4 = options.a4 ?? 440;
  const userExactMidi = freqToMidi(userFreqHz, a4);

  if (options.smartOctaveFold) {
    const { foldedMidi, octaveShift } = foldMidiToTargetOctave(userExactMidi, targetMidi);
    const centsDiff = Math.round((foldedMidi - targetMidi) * 100);
    return {
      centsDiff,
      userExactMidi,
      displayMidi: foldedMidi,
      octaveShift,
    };
  }

  const centsDiff = Math.round((userExactMidi - targetMidi) * 100);
  return {
    centsDiff,
    userExactMidi,
    displayMidi: userExactMidi,
    octaveShift: 0,
  };
}

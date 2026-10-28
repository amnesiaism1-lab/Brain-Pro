import { 
  VocalRangePreference,
  buildScaleNotes,
  fitScaleToVocalRange,
  generateScaleRunPattern,
  pickRandomVocalScale,
  normalizeRootPitchClass,
  SCALE_CATALOG,
  ALL_SCALE_CORES,
  NOTE_NAMES,
  SOLFEGE_NAMES,
  midiToNoteInfo,
  NoteName
} from '@brain-exercises/shared';

export interface TargetNoteItem {
  note: string;
  solfege: string;
  degree?: string;
  degreeIndex?: number;
  holdDurationMs: number;
  scaleId?: string;
  scaleNameVi?: string;
  root?: string;
}

export interface IVocalGenerationContext {
  modeId: string;
  params: Record<string, unknown>;
  vocalRange: VocalRangePreference;
  requiredHoldMs: number;
  lastScaleSelected?: { scaleId: string; root: string };
}

export function generateVocalTargets(ctx: IVocalGenerationContext): {
  targets: TargetNoteItem[];
  activeScaleMeta?: { id: string; nameVi: string; root: string; feel?: string; allScaleNotes: string[] };
} {
  const { modeId, params, vocalRange, requiredHoldMs, lastScaleSelected } = ctx;

  let octave = 4;
  if (vocalRange === 'bass-baritone') octave = 3;
  else if (vocalRange === 'soprano') octave = 4;

  const baseHoldMs = typeof params.holdDurationMs === 'number' ? params.holdDurationMs : requiredHoldMs;

  // 1. SCALE MODE
  if (modeId === 'vocal.scale') {
    const scaleSelection = (params.scaleSelection as string) || 'random';
    let chosenScaleId = 'major';
    let chosenRoot: NoteName = 'C';

    if (scaleSelection === 'fixed') {
      chosenScaleId = (params.scaleId as string) || 'major';
      const fixedRoot = (params.root as string) || 'C';
      chosenRoot = normalizeRootPitchClass(fixedRoot);
    } else {
      const scalePool = (params.scalePool as string[]) || [];
      const rootPool = (params.rootPool as string[])?.map(normalizeRootPitchClass) || ['C', 'D', 'E', 'F', 'G', 'A'];
      const picked = pickRandomVocalScale({
        scalePool,
        rootPool: rootPool as NoteName[],
        vocalRange,
        lastSelected: lastScaleSelected
      });
      chosenScaleId = picked.scale.id;
      chosenRoot = picked.root;
    }

    const scaleDef = SCALE_CATALOG[chosenScaleId] || ALL_SCALE_CORES[0];
    const octaveSpan = typeof params.octaveSpan === 'number' ? params.octaveSpan : 1;
    const rawScaleNotes = buildScaleNotes(chosenRoot, chosenScaleId, octave, octaveSpan);
    const fittedScaleNotes = fitScaleToVocalRange(rawScaleNotes, vocalRange);

    const pattern = (params.pattern as any) || 'ascending';
    const noteCount = typeof params.noteCount === 'number' ? params.noteCount : 6;
    const runNotes = generateScaleRunPattern(fittedScaleNotes, pattern, { noteCount });

    const targets: TargetNoteItem[] = runNotes.map(n => ({
      note: n.note,
      solfege: n.solfege,
      degree: n.degree,
      degreeIndex: n.degreeIndex,
      holdDurationMs: baseHoldMs,
      scaleId: chosenScaleId,
      scaleNameVi: scaleDef.nameVi,
      root: chosenRoot
    }));

    return {
      targets: targets.length > 0 ? targets : [{ note: `C${octave}`, solfege: `Đô ${octave}`, holdDurationMs: baseHoldMs }],
      activeScaleMeta: {
        id: chosenScaleId,
        nameVi: scaleDef.nameVi,
        root: chosenRoot,
        feel: scaleDef.feel,
        allScaleNotes: fittedScaleNotes.map(n => n.note)
      }
    };
  }

  // 2. INTERVAL MODE (Sửa dứt điểm bug interval nhảy sai)
  if (modeId === 'vocal.interval') {
    const intervalType = (params.intervalType as string) || 'consonant';
    // Semitone steps
    let intervalSteps = [3, 4, 5, 7, 12]; // consonant
    if (intervalType === 'dissonant') {
      intervalSteps = [1, 2, 6, 10, 11]; // minor 2nd, major 2nd, tritone, minor 7th, major 7th
    } else if (intervalType === 'all') {
      intervalSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    const chosenStep = intervalSteps[Math.floor(Math.random() * intervalSteps.length)];
    const rootIndex = Math.floor(Math.random() * 8); // C to G
    const rootMidi = 12 * (octave + 1) + rootIndex;
    const targetMidi = rootMidi + (Math.random() > 0.5 ? chosenStep : -chosenStep);

    const rInfo = midiToNoteInfo(rootMidi);
    const tInfo = midiToNoteInfo(targetMidi);

    return {
      targets: [
        { note: rInfo.noteName, solfege: rInfo.solfegeName, degree: 'Root', holdDurationMs: baseHoldMs },
        { note: tInfo.noteName, solfege: tInfo.solfegeName, degree: `Quãng ${chosenStep}st`, holdDurationMs: baseHoldMs }
      ]
    };
  }

  // 3. ARPEGGIO MODE (Sửa dứt điểm bug arpeggio)
  if (modeId === 'vocal.arpeggio') {
    const triad = (params.triad as string) || 'major';
    let offsets = [0, 4, 7]; // major
    if (triad === 'minor') offsets = [0, 3, 7];
    else if (triad === 'diminished') offsets = [0, 3, 6];
    else if (triad === 'augmented') offsets = [0, 4, 8];

    const rootIndex = Math.floor(Math.random() * 8);
    const rootMidi = 12 * (octave + 1) + rootIndex;

    const targets: TargetNoteItem[] = offsets.map((offset, i) => {
      const info = midiToNoteInfo(rootMidi + offset);
      return {
        note: info.noteName,
        solfege: info.solfegeName,
        degree: i === 0 ? '1' : i === 1 ? '3' : '5',
        holdDurationMs: baseHoldMs
      };
    });

    return { targets };
  }

  // 4. SINGLE NOTE MODE (Default)
  const baseNotes = [
    { n: 'C', s: 'Đô' },
    { n: 'D', s: 'Rê' },
    { n: 'E', s: 'Mi' },
    { n: 'F', s: 'Fa' },
    { n: 'G', s: 'Sol' },
    { n: 'A', s: 'La' },
    { n: 'B', s: 'Si' }
  ];

  const pick = baseNotes[Math.floor(Math.random() * baseNotes.length)];
  return {
    targets: [
      {
        note: `${pick.n}${octave}`,
        solfege: `${pick.s} ${octave}`,
        degree: '1',
        holdDurationMs: baseHoldMs
      }
    ]
  };
}

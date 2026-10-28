import { describe, it, expect } from 'vitest';
import { generateVocalTargets } from '../vocalTargetGenerators';

describe('vocalTargetGenerators', () => {
  it('generates single note targets according to vocal range', () => {
    const bassResult = generateVocalTargets({
      modeId: 'vocal.single-note',
      params: { notePool: ['C', 'E', 'G'], holdDurationMs: 1500 },
      vocalRange: 'bass-baritone',
      requiredHoldMs: 1500,
    });

    expect(bassResult.targets).toHaveLength(1);
    expect(bassResult.targets[0].holdDurationMs).toBe(1500);
    // Bass-baritone should produce octave 3 notes
    expect(bassResult.targets[0].note).toMatch(/^[A-G]#?3$/);

    const sopranoResult = generateVocalTargets({
      modeId: 'vocal.single-note',
      params: { notePool: ['C', 'E', 'G'], holdDurationMs: 2000 },
      vocalRange: 'soprano',
      requiredHoldMs: 2000,
    });

    expect(sopranoResult.targets).toHaveLength(1);
    expect(sopranoResult.targets[0].note).toMatch(/^[A-G]#?4$/);
  });

  it('generates scale targets with degree metadata in vocal.scale mode', () => {
    const scaleResult = generateVocalTargets({
      modeId: 'vocal.scale',
      params: {
        scaleSelection: 'fixed',
        scaleId: 'major',
        root: 'C',
        pattern: 'ascending',
        noteCount: 8,
        holdDurationMs: 1800,
      },
      vocalRange: 'tenor-alto',
      requiredHoldMs: 1800,
    });

    expect(scaleResult.targets.length).toBeGreaterThan(0);
    expect(scaleResult.activeScaleMeta).toBeDefined();
    expect(scaleResult.activeScaleMeta?.id).toBe('major');
    expect(scaleResult.activeScaleMeta?.root).toBe('C');

    // First note of C major ascending should have degree 1 and solfege
    const first = scaleResult.targets[0];
    expect(first.scaleId).toBe('major');
    expect(first.degree).toBe('1');
    expect(first.solfege).toBeDefined();
    expect(first.holdDurationMs).toBe(1800);
  });

  it('generates random scale selection within scalePool', () => {
    const randomScaleResult = generateVocalTargets({
      modeId: 'vocal.scale',
      params: {
        scaleSelection: 'random',
        scalePool: ['pentatonic-major', 'blues'],
        rootPool: ['C', 'G'],
        pattern: 'ascending',
        noteCount: 5,
      },
      vocalRange: 'tenor-alto',
      requiredHoldMs: 1500,
    });

    expect(randomScaleResult.targets.length).toBeGreaterThan(0);
    expect(randomScaleResult.activeScaleMeta).toBeDefined();
    expect(['major pentatonic', 'pentatonic-major', 'minor blues', 'blues']).toContain(randomScaleResult.activeScaleMeta?.id);
    expect(['C', 'G']).toContain(randomScaleResult.activeScaleMeta?.root);
  });

  it('generates interval targets with correct semitone offsets', () => {
    const intervalResult = generateVocalTargets({
      modeId: 'vocal.interval',
      params: {
        intervalTypes: ['P5'], // 7 semitones
        motion: 'ascending',
        holdDurationMs: 1200,
      },
      vocalRange: 'tenor-alto',
      requiredHoldMs: 1200,
    });

    expect(intervalResult.targets).toHaveLength(2);
    expect(intervalResult.targets[0].holdDurationMs).toBe(1200);
    expect(intervalResult.targets[1].holdDurationMs).toBe(1200);
  });

  it('generates arpeggio targets', () => {
    const arpeggioResult = generateVocalTargets({
      modeId: 'vocal.arpeggio',
      params: {
        chordTypes: ['major-triad'],
        arpeggioPattern: 'up',
        holdDurationMs: 1000,
      },
      vocalRange: 'bass-baritone',
      requiredHoldMs: 1000,
    });

    expect(arpeggioResult.targets).toHaveLength(3);
    arpeggioResult.targets.forEach((t) => {
      expect(t.holdDurationMs).toBe(1000);
      expect(t.note).toBeDefined();
    });
  });
});

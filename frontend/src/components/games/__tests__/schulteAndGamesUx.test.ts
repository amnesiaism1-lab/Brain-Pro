import { describe, it, expect } from 'vitest';
import {
  getSchulteCenterFixationConfig,
  getCounterRotationDeg,
} from '../SchulteTableGame';

describe('SchulteTableGame fixation reticle & orientation helpers', () => {
  it('assigns non-occluding corner-bracket reticle for odd grids (3x3, 5x5, 7x7, 9x9)', () => {
    const expectedCenters: Record<number, number> = {
      3: 1,
      5: 2,
      7: 3,
      9: 4,
    };

    for (const size of [3, 5, 7, 9]) {
      const cfg = getSchulteCenterFixationConfig('standard', size);
      expect(cfg.activeSize).toBe(size);
      expect(cfg.isOddGrid).toBe(true);
      expect(cfg.centerIndex).toBe(expectedCenters[size]);
      expect(cfg.reticleMode).toBe('corner-brackets');
    }
  });

  it('assigns gap-intersection reticle without cell center for even grids (4x4, 6x6, 8x8)', () => {
    for (const size of [4, 6, 8]) {
      const cfg = getSchulteCenterFixationConfig('standard', size);
      expect(cfg.activeSize).toBe(size);
      expect(cfg.isOddGrid).toBe(false);
      expect(cfg.centerIndex).toBeNull();
      expect(cfg.reticleMode).toBe('gap-intersection');
    }
  });

  it('locks gorbov mode to a 7x7 odd grid with center index 3 regardless of prior gridSize', () => {
    for (const priorSize of [4, 5, 6, 8]) {
      const cfg = getSchulteCenterFixationConfig('gorbov', priorSize);
      expect(cfg.activeSize).toBe(7);
      expect(cfg.isOddGrid).toBe(true);
      expect(cfg.centerIndex).toBe(3);
      expect(cfg.reticleMode).toBe('corner-brackets');
    }
  });

  it('counter-rotates glyphs across 0, 90, 180, 270, 360 degrees to keep digits upright', () => {
    for (const deg of [0, 90, 180, 270, 360]) {
      const counter = getCounterRotationDeg(deg);
      expect(deg + counter).toBe(0);
    }
    expect(Object.is(getCounterRotationDeg(0), 0)).toBe(true);
  });
});

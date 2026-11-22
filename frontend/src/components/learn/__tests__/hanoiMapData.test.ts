import { describe, it, expect } from 'vitest';
import {
  HANOI_BRIDGES,
  HANOI_BRIDGES_NORTH_TO_SOUTH,
  HANOI_BRIDGE_MATRIX,
  HANOI_RING_ROADS,
  HANOI_RING_DETAILS,
  HANOI_CLOCK_RADIALS,
  HANOI_ADMIN_CLUSTERS,
  HANOI_TRANSIT_LINES,
  HANOI_FRENCH_GRID_STREETS,
  HANOI_LEARNING_STAGES,
  HANOI_THEORY_CHAPTERS,
  HANOI_QUIZ_BANK,
  HANOI_FLASHCARDS,
  getHanoiSolarAzimuth,
  getHanoiShadowBearing,
  bearingToCardinalName
} from '@brain-exercises/shared';

describe('Hanoi Cognitive Atlas & Curriculum Integrity (V3.0)', () => {
  it('orders the 6 core Red River bridges strictly from upstream NW to downstream SE', () => {
    expect(HANOI_BRIDGES_NORTH_TO_SOUTH).toEqual([
      'bridge-thang-long',
      'bridge-nhat-tan',
      'bridge-long-bien',
      'bridge-chuong-duong',
      'bridge-vinh-tuy',
      'bridge-thanh-tri'
    ]);
    expect(HANOI_BRIDGES.map((b) => b.id)).toEqual(HANOI_BRIDGES_NORTH_TO_SOUTH);

    // Thăng Long is further North & West (upstream) than Nhật Tân
    const thangLong = HANOI_BRIDGES.find((b) => b.id === 'bridge-thang-long')!;
    const nhatTan = HANOI_BRIDGES.find((b) => b.id === 'bridge-nhat-tan')!;
    expect(thangLong.coords.lat).toBeGreaterThan(nhatTan.coords.lat);
    expect(thangLong.coords.lng).toBeLessThan(nhatTan.coords.lng);

    // Full 13-bridge regional matrix preserves strictly increasing order 1..13
    expect(HANOI_BRIDGE_MATRIX).toHaveLength(13);
    expect(HANOI_BRIDGE_MATRIX.map((r) => r.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
    ]);
  });

  it('enforces real-world verified one-way directions in the French Quarter', () => {
    const phoHue = HANOI_FRENCH_GRID_STREETS.find((s) => s.id === 'st-pho-hue')!;
    const baTrieu = HANOI_FRENCH_GRID_STREETS.find((s) => s.id === 'st-ba-trieu')!;
    const trangThi = HANOI_FRENCH_GRID_STREETS.find((s) => s.id === 'st-trang-thi')!;

    expect(phoHue.isOneWay).toBe(true);
    expect(phoHue.oneWayDirection).toContain('NAM lên BẮC');

    expect(baTrieu.isOneWay).toBe(true);
    expect(baTrieu.oneWayDirection).toContain('BẮC xuống NAM');

    expect(trangThi.isOneWay).toBe(true);
    expect(trangThi.oneWayDirection).toContain('ĐÔNG sang TÂY');
  });

  it('covers all 6 concentric Ring Roads (1, 2, 2.5, 3, 3.5, 4) with unrolled street chains', () => {
    expect(HANOI_RING_ROADS).toHaveLength(6);
    expect(HANOI_RING_DETAILS).toHaveLength(6);

    for (const detail of HANOI_RING_DETAILS) {
      expect(detail.nodesChain.length).toBeGreaterThanOrEqual(4);
      expect(detail.motorbikeRuleVi.length).toBeGreaterThan(15);
    }
  });

  it('provides 12 clock-face radial spokes, 5 spatial admin clusters, and 3 transit lines', () => {
    expect(HANOI_CLOCK_RADIALS).toHaveLength(12);
    expect(HANOI_ADMIN_CLUSTERS).toHaveLength(5);
    expect(HANOI_TRANSIT_LINES).toHaveLength(3);

    // Metro 2A and Metro 3 each have 12 stations
    expect(HANOI_TRANSIT_LINES[0].stations).toHaveLength(12);
    expect(HANOI_TRANSIT_LINES[1].stations).toHaveLength(12);
  });

  it('contains 12 structured theory chapters across 4 progressive learning stages', () => {
    expect(HANOI_LEARNING_STAGES).toHaveLength(4);
    expect(HANOI_THEORY_CHAPTERS).toHaveLength(12);

    const validStageIds = new Set(HANOI_LEARNING_STAGES.map((s) => s.id));
    HANOI_THEORY_CHAPTERS.forEach((chap, idx) => {
      expect(chap.chapterNumber).toBe(idx + 1);
      expect(validStageIds.has(chap.stageId)).toBe(true);
      expect(chap.keyTakeaways.length).toBeGreaterThanOrEqual(3);
      expect(chap.contentMarkdown.length).toBeGreaterThan(600);
      expect(chap.quickCheck.question.length).toBeGreaterThan(15);
      expect(chap.quickCheck.answer.length).toBeGreaterThan(15);
    });
  });

  it('validates all 20 diagnostic quiz questions and 24 active-recall flashcards', () => {
    expect(HANOI_QUIZ_BANK).toHaveLength(20);
    for (const q of HANOI_QUIZ_BANK) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.relatedChapterNumber).toBeGreaterThanOrEqual(1);
      expect(q.relatedChapterNumber).toBeLessThanOrEqual(12);
    }

    expect(HANOI_FLASHCARDS).toHaveLength(24);
    for (const fc of HANOI_FLASHCARDS) {
      expect(fc.frontPrompt.length).toBeGreaterThan(10);
      expect(fc.backAnswer.length).toBeGreaterThan(10);
    }
  });

  it('computes accurate solar azimuth and opposite 180-deg shadow bearings for Hanoi', () => {
    const morningAz = getHanoiSolarAzimuth(7);
    const afternoonAz = getHanoiSolarAzimuth(16.5);

    expect(bearingToCardinalName(morningAz)).toBe('Đông');
    expect(bearingToCardinalName(afternoonAz)).toBe('Tây');
    expect(getHanoiShadowBearing(16.5)).toBe((afternoonAz + 180) % 360);
  });
});

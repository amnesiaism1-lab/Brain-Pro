import { describe, it, expect } from 'vitest';
import { 
  generatePracticalHanoiQuestion,
  generateCorridorChainQuestion,
  generateCrossStreetOrderQuestion,
  generateWhichIntersectionQuestion,
  generateSuperblockCellQuestion,
  generateAddressDecoderQuestion,
  generateRoutePlannerQuestion,
  generateOneWayTrapQuestion,
  generatePersonalAnchorQuestion,
  generateGpsLossRecoveryQuestion
} from '../hanoiQuestionGenerator';
import { PracticalGameMode, IPersonalAnchor } from '@brain-exercises/shared';

describe('HanoiQuestionGenerator Practical Modes (A - I)', () => {
  const modes: PracticalGameMode[] = [
    'corridor_chain',
    'cross_street_order',
    'which_intersection',
    'superblock_cell',
    'address_decoder',
    'route_planner_ab',
    'oneway_turn_trap',
    'personal_anchor_drill',
    'gps_loss_recovery'
  ];

  const mockAnchors: IPersonalAnchor[] = [
    {
      id: 'test-anchor-1',
      label: 'home',
      customTitle: 'Nhà riêng Thanh Xuân',
      district: 'Thanh Xuân',
      nearestStreet: 'Nguyễn Trãi',
      nearestIntersection: 'Ngã Tư Sở',
      createdAt: '2026-10-18T00:00:00Z',
      updatedAt: '2026-10-18T00:00:00Z'
    }
  ];

  modes.forEach((mode) => {
    it(`should generate a valid question for mode ${mode}`, () => {
      const q = generatePracticalHanoiQuestion(mode, 1, mockAnchors);

      expect(q).toBeDefined();
      expect(q.id).toBeTypeOf('string');
      expect(q.mode).toBe(mode);
      expect(q.prompt.length).toBeGreaterThan(10);
      expect(q.options.length).toBeGreaterThanOrEqual(2);

      // Exactly 1 correct answer
      const correctOptions = q.options.filter(o => o.isCorrect);
      expect(correctOptions.length).toBe(1);

      // Distractors have isCorrect === false
      const wrongOptions = q.options.filter(o => !o.isCorrect);
      expect(wrongOptions.length).toBeGreaterThanOrEqual(1);

      // Cognitive lesson must not be empty
      expect(q.cognitiveLesson).toBeTruthy();
      expect(q.cognitiveLesson.length).toBeGreaterThan(10);
    });
  });

  it('generates corridor chain questions with valid continuation', () => {
    const q = generateCorridorChainQuestion(1);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
    expect(q.title).toContain('Chuỗi Trục');
  });

  it('generates cross street order questions with order clues', () => {
    const q = generateCrossStreetOrderQuestion(2);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });

  it('generates which intersection questions matching 2 streets', () => {
    const q = generateWhichIntersectionQuestion(3);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });

  it('generates superblock cell questions with escape strategies', () => {
    const q = generateSuperblockCellQuestion(4);
    expect(q.cognitiveLesson).toBeTruthy();
  });

  it('generates address decoder questions with gate positions', () => {
    const q = generateAddressDecoderQuestion(5);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });

  it('generates route planner questions with hierarchical logic', () => {
    const q = generateRoutePlannerQuestion(6);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });

  it('generates one-way and turn traps for motorbike navigation', () => {
    const q = generateOneWayTrapQuestion(7);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });

  it('generates personal anchor questions when anchors provided', () => {
    const q = generatePersonalAnchorQuestion(8, mockAnchors);
    expect(q.prompt).toContain('Nhà riêng Thanh Xuân');
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });

  it('generates gps loss recovery questions with skyline or boundary clues', () => {
    const q = generateGpsLossRecoveryQuestion(9);
    expect(q.options.some(o => o.isCorrect)).toBe(true);
  });
});

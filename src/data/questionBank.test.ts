import { describe, expect, it } from 'vitest';
import { BUILTIN_QUESTIONS } from './questionBank';

describe('BUILTIN_QUESTIONS integrity & newly generated scenarios', () => {
  it('has no duplicate question IDs and every question has 4 choices, whyCorrect, distractors, and examTip', () => {
    const ids = new Set<string>();
    for (const q of BUILTIN_QUESTIONS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);

      expect(q.options).toHaveLength(4);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
      expect(q.whyCorrect.trim().length).toBeGreaterThan(20);
      expect(q.examTip.trim().length).toBeGreaterThan(10);
      expect(q.distractorBreakdown.length).toBeGreaterThanOrEqual(3);

      const incorrectLetters = q.options
        .map((o) => o.letter)
        .filter((l) => l !== q.correctAnswer);
      const breakdownLetters = new Set(q.distractorBreakdown.map((d) => d.letter));
      for (const letter of incorrectLetters) {
        expect(breakdownLetters.has(letter)).toBe(true);
      }
    }
  });

  it('includes the 5 new Path 1 questions across Modules 1, 2, and 3', () => {
    const path1NewIds = [
      'az900-mod1-q16',
      'az900-mod1-q17',
      'az900-mod2-q16',
      'az900-mod2-q17',
      'az900-mod3-q16',
    ];
    for (const id of path1NewIds) {
      const q = BUILTIN_QUESTIONS.find((item) => item.id === id);
      expect(q).toBeDefined();
      expect(q?.learningPathId).toBe(1);
      expect([1, 2, 3]).toContain(q?.moduleId);
    }
  });

  it('includes the 5 new Path 2 questions across Modules 4 and 5', () => {
    const path2NewIds = [
      'az900-mod4-q17',
      'az900-mod4-q18',
      'az900-mod4-q19',
      'az900-mod5-q17',
      'az900-mod5-q18',
    ];
    for (const id of path2NewIds) {
      const q = BUILTIN_QUESTIONS.find((item) => item.id === id);
      expect(q).toBeDefined();
      expect(q?.learningPathId).toBe(2);
      expect([4, 5]).toContain(q?.moduleId);
    }
  });
});

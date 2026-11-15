import { describe, it, expect } from 'vitest';
import {
  analyzeModulePerformance,
  rankWeakestModules,
  buildWeakestAreasPracticeSet,
  ensureCompleteExplanations,
} from './weakAreasAnalyzer';
import { Question, UserStats, QuestionAttempt } from '../types/quiz';

const makeStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  totalAnswered: 0,
  totalCorrect: 0,
  streakDays: 1,
  lastActiveDate: '2026-11-14',
  bookmarks: [],
  attempts: {},
  moduleMastery: {},
  pathMastery: {},
  mistakesHistory: [],
  ...overrides,
});

const makeQuestion = (
  id: string,
  moduleId: number,
  difficulty: Question['difficulty'] = 'Intermediate',
  partialBreakdown = false
): Question => ({
  id,
  learningPathId: moduleId <= 3 ? 1 : moduleId <= 7 ? 2 : 3,
  learningPathTitle: `Path for M${moduleId}`,
  moduleId,
  moduleTitle: `Module ${moduleId}`,
  difficulty,
  scenario: `Scenario for ${id} in module ${moduleId}`,
  question: `Question text for ${id}?`,
  options: [
    { letter: 'A', text: 'Option A text' },
    { letter: 'B', text: 'Option B text' },
    { letter: 'C', text: 'Option C text' },
    { letter: 'D', text: 'Option D text' },
  ],
  correctAnswer: 'B',
  whyCorrect: `Explanation why B is correct for ${id}.`,
  distractorBreakdown: partialBreakdown
    ? [{ letter: 'A', reason: 'A is wrong.' }]
    : [
        { letter: 'A', reason: 'A is wrong.' },
        { letter: 'C', reason: 'C is wrong.' },
        { letter: 'D', reason: 'D is wrong.' },
      ],
  examTip: `Tip for ${id}.`,
});

describe('weakAreasAnalyzer', () => {
  it('ranks attempted lowest-scoring modules ahead of untouched 0/0 modules', () => {
    const stats = makeStats({
      moduleMastery: {
        1: { correct: 4, total: 4 }, // 100%
        5: { correct: 1, total: 4 }, // 25% -> weakest attempted
        7: { correct: 2, total: 4 }, // 50% -> second weakest attempted
      },
    });

    const analysis = analyzeModulePerformance(stats, [], []);
    const top3Ids = analysis.rankedWeakestModules.slice(0, 3).map((m) => m.moduleId);

    // Module 5 (25%) and Module 7 (50%) and Module 1 (100%, attempted) come before untouched 0/0 modules
    expect(top3Ids[0]).toBe(5);
    expect(top3Ids[1]).toBe(7);
    expect(top3Ids[2]).toBe(1);
    expect(analysis.rankedWeakestModules[0].status).toBe('critical');
    expect(analysis.rankedWeakestModules[1].status).toBe('needs-work');
  });

  it('weights just-completed quiz misses immediately in effectiveAccuracy', () => {
    const stats = makeStats({
      moduleMastery: {
        2: { correct: 5, total: 5 }, // previously 100%
        6: { correct: 2, total: 4 }, // 50% overall
      },
    });

    const sessionAttempts: QuestionAttempt[] = [
      {
        questionId: 'q-m2-1',
        moduleId: 2,
        pathId: 1,
        selectedAnswer: 'A',
        isCorrect: false,
        timestamp: 1000,
      },
      {
        questionId: 'q-m2-2',
        moduleId: 2,
        pathId: 1,
        selectedAnswer: 'C',
        isCorrect: false,
        timestamp: 2000,
      },
    ];

    const analysis = analyzeModulePerformance(stats, sessionAttempts, [], 'Mock Exam');
    const m2 = analysis.moduleSummaries.find((m) => m.moduleId === 2)!;

    expect(m2.sessionTotal).toBe(2);
    expect(m2.sessionWrong).toBe(2);
    expect(m2.sessionAccuracy).toBe(0);
    // Blended: 0.65 * 0 + 0.35 * 100 = 35%
    expect(m2.effectiveAccuracy).toBe(35);
    expect(analysis.rankedWeakestModules[0].moduleId).toBe(2);
  });

  it('builds a balanced practice set from target weakest modules prioritizing missed & unseen items', () => {
    const questions: Question[] = [
      makeQuestion('m5-seen-correct', 5, 'Intermediate'),
      makeQuestion('m5-missed', 5, 'Fundamental'),
      makeQuestion('m5-unseen', 5, 'Intermediate'),
      makeQuestion('m8-unseen-1', 8, 'Fundamental', true),
      makeQuestion('m8-unseen-2', 8, 'Intermediate'),
      makeQuestion('m1-strong', 1, 'Intermediate'), // Not in weak targets
    ];

    const stats = makeStats({
      attempts: {
        'm5-seen-correct': [
          {
            questionId: 'm5-seen-correct',
            moduleId: 5,
            pathId: 2,
            selectedAnswer: 'B',
            isCorrect: true,
            timestamp: 100,
          },
        ],
      },
    });

    const sessionAttempts: QuestionAttempt[] = [
      {
        questionId: 'm5-missed',
        moduleId: 5,
        pathId: 2,
        selectedAnswer: 'A',
        isCorrect: false,
        timestamp: 200,
      },
    ];

    const practiceSet = buildWeakestAreasPracticeSet({
      targetModuleIds: [5, 8],
      allQuestions: questions,
      stats,
      sessionAttempts,
      questionCount: 4,
    });

    expect(practiceSet).toHaveLength(4);
    expect(practiceSet.every((q) => q.moduleId === 5 || q.moduleId === 8)).toBe(true);
    // Missed question comes first for Module 5
    expect(practiceSet[0].id).toBe('m5-missed');
    // Round robin picks Module 8 second
    expect(practiceSet[1].moduleId).toBe(8);
    // Partial distractorBreakdown gets filled for all non-correct options (A, C, D)
    const m8Q1 = practiceSet.find((q) => q.id === 'm8-unseen-1')!;
    expect(m8Q1.distractorBreakdown.map((d) => d.letter)).toEqual(['A', 'C', 'D']);
  });

  it('fills missing explanations cleanly in ensureCompleteExplanations', () => {
    const sparse = ensureCompleteExplanations({
      ...makeQuestion('q-sparse', 3, 'Fundamental', true),
      whyCorrect: '',
      examTip: '',
    });

    expect(sparse.whyCorrect.length).toBeGreaterThan(10);
    expect(sparse.examTip.length).toBeGreaterThan(10);
    expect(sparse.distractorBreakdown).toHaveLength(3);
  });

  it('respects scopedPathId filter in rankWeakestModules', () => {
    const stats = makeStats({
      moduleMastery: {
        1: { correct: 0, total: 2 },
        10: { correct: 1, total: 4 },
      },
    });
    const analysis = analyzeModulePerformance(stats, [], []);
    const path3Ranked = rankWeakestModules(analysis.moduleSummaries, {
      scopedPathId: 3,
      limit: 3,
    });

    expect(path3Ranked.every((m) => m.pathId === 3)).toBe(true);
    expect(path3Ranked[0].moduleId).toBe(10);
  });
});

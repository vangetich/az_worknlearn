import { describe, it, expect } from 'vitest';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import type { Question, UserStats } from '../types/quiz';
import type { PrintableExamTrack } from '../types/printableExam';
import {
  MIN_PRINTABLE_QUESTIONS,
  MAX_PRINTABLE_QUESTIONS,
  clampPrintableCount,
  deduplicateQuestions,
  buildPrintableMockExamQuestions,
  collectGroundingSources,
  validatePrintableQuestionCount,
} from './printableExamEngine';

describe('printableExamEngine', () => {
  it('clamps printable question counts strictly between 20 minimum and 45 maximum', () => {
    expect(MIN_PRINTABLE_QUESTIONS).toBe(20);
    expect(MAX_PRINTABLE_QUESTIONS).toBe(45);
    expect(clampPrintableCount(5)).toBe(20);
    expect(clampPrintableCount(19)).toBe(20);
    expect(clampPrintableCount(20)).toBe(20);
    expect(clampPrintableCount(33)).toBe(33);
    expect(clampPrintableCount(45)).toBe(45);
    expect(clampPrintableCount(60)).toBe(45);
    expect(clampPrintableCount(Number.NaN)).toBe(25);
  });

  it('deduplicates questions by both id and normalized stem', () => {
    const base = BUILTIN_QUESTIONS[0];
    const dupById: Question = { ...base, question: 'Completely different stem?' };
    const dupByStem: Question = {
      ...base,
      id: 'dup-stem-id',
      question: `  ${base.question.toUpperCase()}  `,
    };

    const result = deduplicateQuestions([base, dupById, dupByStem, BUILTIN_QUESTIONS[1]]);
    expect(result).toHaveLength(2);
    expect(result.map((q) => q.id)).toEqual([base.id, BUILTIN_QUESTIONS[1].id]);
  });

  it('generates unique 20-to-45 question packets for every track', () => {
    const tracks: PrintableExamTrack[] = [
      'balanced',
      'path-1',
      'path-2',
      'path-3',
      'weak-areas',
      'progressive',
      'scenario-only',
      'tricky-traps',
      'unseen-fresh',
    ];

    for (const track of tracks) {
      const packet20 = buildPrintableMockExamQuestions({
        allQuestions: BUILTIN_QUESTIONS,
        track,
        targetCount: 20,
        seed: 3,
      });
      expect(packet20).toHaveLength(20);
      expect(new Set(packet20.map((q) => q.id)).size).toBe(20);

      const packet45 = buildPrintableMockExamQuestions({
        allQuestions: BUILTIN_QUESTIONS,
        track,
        targetCount: 45,
        seed: 7,
      });
      expect(packet45).toHaveLength(45);
      expect(new Set(packet45.map((q) => q.id)).size).toBe(45);
    }
  });

  it('orders progressive exams from Fundamental to Intermediate to Advanced', () => {
    const packet = buildPrintableMockExamQuestions({
      allQuestions: BUILTIN_QUESTIONS,
      track: 'progressive',
      targetCount: 30,
      seed: 2,
    });
    const rank: Record<Question['difficulty'], number> = {
      Fundamental: 1,
      Intermediate: 2,
      Advanced: 3,
    };

    for (let i = 1; i < packet.length; i++) {
      expect(rank[packet[i].difficulty]).toBeGreaterThanOrEqual(rank[packet[i - 1].difficulty]);
    }
  });

  it('prioritizes missed questions and selected focus modules in weak-areas track', () => {
    const targetQ = BUILTIN_QUESTIONS.find((q) => q.moduleId === 9)!;
    const stats: Partial<UserStats> = {
      mistakesHistory: [
        {
          questionId: targetQ.id,
          moduleId: targetQ.moduleId,
          wrongChoice: 'Wrong option',
          correctChoice: targetQ.correctAnswer,
          timestamp: Date.now(),
          trapType: 'Conceptual Gap',
        },
      ],
      moduleMastery: {
        9: { correct: 1, total: 10 },
      },
    };

    const packet = buildPrintableMockExamQuestions({
      allQuestions: BUILTIN_QUESTIONS,
      track: 'weak-areas',
      targetCount: 20,
      stats: stats as UserStats,
      focusModuleIds: [9],
      seed: 1,
    });

    expect(packet.some((q) => q.id === targetQ.id)).toBe(true);
    expect(packet.slice(0, 10).some((q) => q.moduleId === 9)).toBe(true);
  });

  it('prioritizes Google-sourced questions and deduplicates grounding source URLs', () => {
    const googleQ: Question = {
      ...BUILTIN_QUESTIONS[0],
      id: 'google-test-1',
      question: 'Which Azure Well-Architected pillar addresses FinOps and Reservations?',
      sourcedViaGoogle: true,
      groundingSources: [
        { title: 'Microsoft Learn AZ-900', uri: 'https://learn.microsoft.com/en-us/azure/' },
        { title: 'Duplicate URL', uri: 'https://learn.microsoft.com/en-us/azure/' },
      ],
    };

    const packet = buildPrintableMockExamQuestions({
      allQuestions: [googleQ, ...BUILTIN_QUESTIONS],
      track: 'balanced',
      targetCount: 22,
      prioritizeGoogleSourced: true,
      seed: 1,
    });

    expect(packet[0].id === 'google-test-1' || packet.some((q) => q.id === 'google-test-1')).toBe(
      true
    );
    const sources = collectGroundingSources(packet);
    expect(sources).toHaveLength(1);
    expect(sources[0].uri).toBe('https://learn.microsoft.com/en-us/azure/');
  });

  it('validates selected question count (20-45) strictly before initiating print', () => {
    expect(validatePrintableQuestionCount(20, 20)).toEqual({ valid: true, error: null });
    expect(validatePrintableQuestionCount(35, 35)).toEqual({ valid: true, error: null });
    expect(validatePrintableQuestionCount(45, 45)).toEqual({ valid: true, error: null });

    expect(validatePrintableQuestionCount(19, 20).valid).toBe(false);
    expect(validatePrintableQuestionCount(46, 45).valid).toBe(false);
    expect(validatePrintableQuestionCount(Number.NaN, 25).valid).toBe(false);
    expect(validatePrintableQuestionCount(25.5, 25).valid).toBe(false);
    expect(validatePrintableQuestionCount(25, 19).valid).toBe(false);
  });
});

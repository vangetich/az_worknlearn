import { describe, it, expect } from 'vitest';
import {
  getMostIncorrectModulesInBlock,
  formatQuestionContextMarkdown,
  computeNextConfidenceStreakState,
  ConfidenceStreakState,
} from './studyConsolidation';
import { Question, QuestionAttempt } from '../types/quiz';

const sampleQuestion: Question = {
  id: 'q-test-5',
  learningPathId: 2,
  learningPathTitle: 'Describe Azure Architecture and Services',
  moduleId: 5,
  moduleTitle: 'Describe Azure Compute and Networking Services',
  difficulty: 'Intermediate',
  scenario: 'An enterprise needs a dedicated private fiber connection between its on-premises datacenter and Azure.',
  question: 'Which Azure networking service provides a private dedicated connection that bypasses the public internet?',
  options: [
    { letter: 'A', text: 'Azure VPN Gateway' },
    { letter: 'B', text: 'Azure ExpressRoute' },
    { letter: 'C', text: 'Azure Bastion' },
    { letter: 'D', text: 'Azure DNS' },
  ],
  correctAnswer: 'B',
  whyCorrect: 'Azure ExpressRoute establishes a private dedicated fiber connection via a connectivity provider, bypassing the public internet.',
  distractorBreakdown: [
    { letter: 'A', reason: 'VPN Gateway sends encrypted IPsec traffic over the public internet rather than private fiber.' },
    { letter: 'C', reason: 'Azure Bastion provides browser-based RDP/SSH access to VMs.' },
    { letter: 'D', reason: 'Azure DNS hosts domain name resolution records.' },
  ],
  examTip: 'ExpressRoute = private fiber (no public internet); VPN Gateway = encrypted over public internet.',
};

describe('studyConsolidation utilities', () => {
  it('ranks modules with the most incorrect answers in the previous 6-question block first', () => {
    const block: QuestionAttempt[] = [
      { questionId: '1', moduleId: 2, pathId: 1, selectedAnswer: 'A', isCorrect: true, timestamp: 10 },
      { questionId: '2', moduleId: 5, pathId: 2, selectedAnswer: 'A', isCorrect: false, timestamp: 20 },
      { questionId: '3', moduleId: 9, pathId: 3, selectedAnswer: 'C', isCorrect: false, timestamp: 30 },
      { questionId: '4', moduleId: 5, pathId: 2, selectedAnswer: 'D', isCorrect: false, timestamp: 40 },
      { questionId: '5', moduleId: 2, pathId: 1, selectedAnswer: 'B', isCorrect: true, timestamp: 50 },
      { questionId: '6', moduleId: 7, pathId: 2, selectedAnswer: 'A', isCorrect: true, timestamp: 60 },
    ];

    const res = getMostIncorrectModulesInBlock(block);
    expect(res.blockTotalQuestions).toBe(6);
    expect(res.blockIncorrectCount).toBe(3);
    expect(res.weakModulesInBlock[0].moduleId).toBe(5);
    expect(res.weakModulesInBlock[0].incorrectCount).toBe(2);
    expect(res.weakModulesInBlock[0].exercise.steps).toHaveLength(3);
    expect(res.weakModulesInBlock[1].moduleId).toBe(9);
    expect(res.weakModulesInBlock[1].incorrectCount).toBe(1);
  });

  it('tracks consecutive high-confidence streak without double-counting the same question', () => {
    let state: ConfidenceStreakState = {
      currentStreak: 0,
      bestStreak: 0,
      lastRatedQuestionId: null,
      lastConfidenceLevel: null,
    };

    state = computeNextConfidenceStreakState(state, 'q1', 4);
    expect(state.currentStreak).toBe(1);
    expect(state.bestStreak).toBe(1);

    // Updating q1 from 4 -> 5 should not increment streak twice
    state = computeNextConfidenceStreakState(state, 'q1', 5);
    expect(state.currentStreak).toBe(1);
    expect(state.lastConfidenceLevel).toBe(5);

    // Consecutive question q2 rated high confidence increments streak
    state = computeNextConfidenceStreakState(state, 'q2', 5);
    expect(state.currentStreak).toBe(2);
    expect(state.bestStreak).toBe(2);

    // Low confidence rating resets current streak while preserving bestStreak
    state = computeNextConfidenceStreakState(state, 'q3', 2);
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(2);
  });

  it('formats question, explanation, and selected distractor into a clean markdown prompt snippet', () => {
    const md = formatQuestionContextMarkdown(sampleQuestion, 'A', true);
    expect(md).toContain('### AZ-900 Question Context — Module 5: Describe Azure Compute and Networking Services');
    expect(md).toContain('**My Selected Answer:** Option A — Azure VPN Gateway (Incorrect Distractor)');
    expect(md).toContain('**Correct Answer:** Option B — Azure ExpressRoute');
    expect(md).toContain('**Why My Selected Distractor (Option A) Is Incorrect:**');
    expect(md).toContain('VPN Gateway sends encrypted IPsec traffic over the public internet');
    expect(md).toContain('**Explanation (Why Correct):**');
    expect(md).toContain('**Prompt for AI Knowledge Assistant:**');
  });
});

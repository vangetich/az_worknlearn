export interface DistractorItem {
  letter: string;
  reason: string;
}

export interface QuizOption {
  letter: string;
  text: string;
}

export interface ErrorDiagnostic {
  trapType: 'Service Scope Confusion' | 'Model Boundary (IaaS/PaaS/SaaS)' | 'Over-Engineering' | 'Governance vs Access' | 'Cost & Redundancy Trap' | 'Conceptual Gap';
  correctivePrescription: string;
}

export interface Question {
  id: string;
  learningPathId: 1 | 2 | 3;
  learningPathTitle: string;
  moduleId: number;
  moduleTitle: string;
  difficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  scenario: string;
  question: string;
  options: QuizOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  whyCorrect: string;
  distractorBreakdown: DistractorItem[];
  examTip: string;
  errorDiagnostic?: ErrorDiagnostic;
  isAiGenerated?: boolean;
}

export interface ModuleInfo {
  id: number;
  title: string;
  pathId: 1 | 2 | 3;
  description: string;
  units: string[];
  keyTerms: string[];
  iconName: string;
}

export interface LearningPathInfo {
  id: 1 | 2 | 3;
  title: string;
  examWeight: string;
  minWeight: number;
  maxWeight: number;
  summary: string;
  modules: ModuleInfo[];
  accentColor: string;
}

export interface QuestionAttempt {
  questionId: string;
  moduleId: number;
  pathId: 1 | 2 | 3;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
  trapType?: string;
  confidence?: number; // 1 (Guessing) to 5 (Mastered)
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  streakDays: number;
  lastActiveDate: string;
  dailyGoal?: number; // target questions per day
  bookmarks: string[]; // Question IDs
  attempts: Record<string, QuestionAttempt[]>; // questionId -> history
  moduleMastery: Record<number, { correct: number; total: number }>;
  pathMastery: Record<number, { correct: number; total: number }>;
  mistakesHistory?: {
    questionId: string;
    moduleId: number;
    wrongChoice: string;
    correctChoice: string;
    timestamp: number;
    trapType: string;
  }[];
  completedModules?: number[]; // Module IDs (1..12) marked complete by user
  reviewedMistakeIds?: string[]; // Question IDs reviewed successfully and removed from future review sessions
  reviewedMistakeTimestamps?: Record<string, number>; // questionId -> timestamp when reviewed successfully
  confidenceScores?: Record<string, number>; // questionId -> 1..5 user self-rated confidence
  moduleConfidenceScores?: Record<number, number>; // moduleId -> 1..5 user self-rated confidence
}

export interface CheatSheetItem {
  id: string;
  moduleId: number;
  title: string;
  category: string;
  summary: string;
  keyRule: string;
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
  examTrap: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface QuizSessionMissedQuestion {
  questionId: string;
  scenario: string;
  question: string;
  selectedAnswer: string;
  selectedAnswerText: string;
  correctAnswer: string;
  correctAnswerText: string;
  whyCorrect: string;
  examTip: string;
  moduleId: number;
  moduleTitle: string;
  learningPathTitle: string;
}

export interface QuizSessionRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  title: string;
  mode: 'adaptive' | 'mock' | 'practice' | 'micro-drill';
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  passed: boolean;
  durationSeconds?: number;
  missedQuestions: QuizSessionMissedQuestion[];
}


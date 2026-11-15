import React from 'react';
import { Question, UserStats, QuestionAttempt } from '../types/quiz';
import { WeakestAreasReviewView } from './WeakestAreasReviewView';

export interface WeakModuleSummary {
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  pathTitle: string;
  accuracy: number;
  correct: number;
  total: number;
  sessionWrong: number;
  keyTerms: string[];
}

interface PostSessionWeakAreaReviewProps {
  stats: UserStats;
  sessionAttempts: QuestionAttempt[];
  allQuestions: Question[];
  selectedPathId: number | 'all';
  sourceLabel?: string;
  onAnswerReviewQuestion: (
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    generatedQuestion?: Question
  ) => void;
  onAddGeneratedQuestionsToBank?: (questions: Question[]) => void;
  onSelectPathForPractice?: (pathId: 1 | 2 | 3 | 'all', moduleId?: number | 'all') => void;
  onStartPersonalizedReview?: () => void;
  onQuickRetrySessionQuestions?: (questionsToQueue: Question[]) => void;
  onAskTutorAboutQuestion?: (question: Question, selectedOption?: string | null) => void;
  unresolvedMistakesCount?: number;
  onClose: () => void;
}

export const PostSessionWeakAreaReview: React.FC<PostSessionWeakAreaReviewProps> = ({
  stats,
  sessionAttempts,
  allQuestions,
  selectedPathId,
  sourceLabel = 'Practice Quiz Session',
  onAnswerReviewQuestion,
  onAddGeneratedQuestionsToBank,
  onSelectPathForPractice,
  onStartPersonalizedReview,
  onQuickRetrySessionQuestions,
  onAskTutorAboutQuestion,
  onClose,
}) => {
  return (
    <WeakestAreasReviewView
      stats={stats}
      sessionAttempts={sessionAttempts}
      allQuestions={allQuestions}
      selectedPathId={
        selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3
          ? selectedPathId
          : 'all'
      }
      sourceLabel={sourceLabel}
      onAnswerReviewQuestion={onAnswerReviewQuestion}
      onAddGeneratedQuestionsToBank={onAddGeneratedQuestionsToBank}
      onSelectModuleForPractice={
        onSelectPathForPractice
          ? (moduleId, pathId) => {
              onSelectPathForPractice(pathId, moduleId);
              onClose();
            }
          : undefined
      }
      onQuickRetrySessionQuestions={onQuickRetrySessionQuestions}
      onStartPersonalizedReview={onStartPersonalizedReview}
      onAskTutorAboutQuestion={onAskTutorAboutQuestion}
      onClose={onClose}
    />
  );
};

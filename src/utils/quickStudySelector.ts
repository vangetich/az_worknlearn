import { Question, UserStats } from '../types/quiz';

/**
 * High-frequency AZ-900 exam keywords used to score and rank questions
 * for the 5-minute curated Quick Study drill sprint.
 */
const HIGH_FREQUENCY_EXAM_SIGNALS: Array<{ keyword: string; weight: number }> = [
  { keyword: 'shared responsibility', weight: 10 },
  { keyword: 'capex', weight: 9 },
  { keyword: 'opex', weight: 9 },
  { keyword: 'availability zone', weight: 10 },
  { keyword: 'region pair', weight: 9 },
  { keyword: 'expressroute', weight: 10 },
  { keyword: 'vpn gateway', weight: 8 },
  { keyword: 'archive', weight: 9 },
  { keyword: 'rehydrat', weight: 8 },
  { keyword: 'lrs', weight: 8 },
  { keyword: 'zrs', weight: 8 },
  { keyword: 'grs', weight: 9 },
  { keyword: 'entra id', weight: 10 },
  { keyword: 'conditional access', weight: 9 },
  { keyword: 'rbac', weight: 10 },
  { keyword: 'zero trust', weight: 9 },
  { keyword: 'azure policy', weight: 10 },
  { keyword: 'resource lock', weight: 10 },
  { keyword: 'cannotdelete', weight: 8 },
  { keyword: 'tco calculator', weight: 9 },
  { keyword: 'pricing calculator', weight: 9 },
  { keyword: 'azure advisor', weight: 9 },
  { keyword: 'service health', weight: 8 },
  { keyword: 'azure monitor', weight: 8 },
  { keyword: 'azure arc', weight: 9 },
  { keyword: 'bicep', weight: 8 },
  { keyword: 'arm template', weight: 8 },
  { keyword: 'elasticity', weight: 9 },
  { keyword: 'iaas', weight: 8 },
  { keyword: 'paas', weight: 8 },
  { keyword: 'saas', weight: 8 },
  { keyword: 'defense in depth', weight: 8 },
  { keyword: 'purview', weight: 7 },
];

/**
 * Selects a curated deck of 10 high-frequency AZ-900 questions distributed
 * across core curriculum modules so users can run a focused 5-minute sprint
 * without manual filtering.
 */
export function selectCuratedQuickStudyQuestions(
  questions: Question[],
  stats?: UserStats,
  limit = 10
): Question[] {
  if (!questions || questions.length === 0) return [];
  if (questions.length <= limit) return [...questions];

  const scored = questions.map((q) => {
    const haystack = `${q.question} ${q.scenario} ${q.examTip} ${q.whyCorrect}`.toLowerCase();
    let score = 0;

    for (const signal of HIGH_FREQUENCY_EXAM_SIGNALS) {
      if (haystack.includes(signal.keyword)) {
        score += signal.weight;
      }
    }

    // Prefer Path 2 (highest exam weight 35-40%) and Path 3 (30-35%) slightly on ties
    if (q.learningPathId === 2) score += 3;
    else if (q.learningPathId === 3) score += 2;
    else score += 1;

    // Slight prioritization boost for previously missed or unattempted high-frequency questions
    const attempts = stats?.attempts?.[q.id] || [];
    if (attempts.length === 0) {
      score += 4;
    } else {
      const latest = [...attempts].sort((a, b) => b.timestamp - a.timestamp)[0];
      if (!latest.isCorrect) {
        score += 6;
      }
    }

    return { question: q, score };
  });

  scored.sort((a, b) => b.score - a.score || a.question.moduleId - b.question.moduleId);

  // First pass: pick up to 1 top-scoring question per unique module to guarantee breadth
  const selected: Question[] = [];
  const usedIds = new Set<string>();
  const usedModules = new Set<number>();

  for (const item of scored) {
    if (selected.length >= limit) break;
    if (!usedModules.has(item.question.moduleId)) {
      selected.push(item.question);
      usedIds.add(item.question.id);
      usedModules.add(item.question.moduleId);
    }
  }

  // Second pass: fill remaining slots up to `limit` with highest-scoring questions overall
  for (const item of scored) {
    if (selected.length >= limit) break;
    if (!usedIds.has(item.question.id)) {
      selected.push(item.question);
      usedIds.add(item.question.id);
    }
  }

  return selected.sort((a, b) => a.learningPathId - b.learningPathId || a.moduleId - b.moduleId);
}

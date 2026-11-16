import type { Question, UserStats } from '../types/quiz';
import type {
  GroundingSourceLink,
  PrintableExamTrack,
  PrintableMockExam,
} from '../types/printableExam';

export const MIN_PRINTABLE_QUESTIONS = 20;
export const MAX_PRINTABLE_QUESTIONS = 45;
const SAVED_PRINTABLE_EXAMS_KEY = 'az900_saved_printable_exams_v1';

export function clampPrintableCount(count: number): number {
  if (!Number.isFinite(count)) return 25;
  return Math.max(MIN_PRINTABLE_QUESTIONS, Math.min(MAX_PRINTABLE_QUESTIONS, Math.round(count)));
}

export interface PrintableCountValidationResult {
  valid: boolean;
  error: string | null;
}

export function validatePrintableQuestionCount(
  selectedCount: number,
  assembledCount?: number
): PrintableCountValidationResult {
  if (!Number.isFinite(selectedCount) || !Number.isInteger(selectedCount)) {
    return {
      valid: false,
      error: `Enter a whole number of questions between ${MIN_PRINTABLE_QUESTIONS} and ${MAX_PRINTABLE_QUESTIONS} before printing.`,
    };
  }
  if (selectedCount < MIN_PRINTABLE_QUESTIONS || selectedCount > MAX_PRINTABLE_QUESTIONS) {
    return {
      valid: false,
      error: `Printable mock exams must contain between ${MIN_PRINTABLE_QUESTIONS} and ${MAX_PRINTABLE_QUESTIONS} questions (currently set to ${selectedCount}).`,
    };
  }
  if (
    typeof assembledCount === 'number' &&
    (assembledCount < MIN_PRINTABLE_QUESTIONS || assembledCount > MAX_PRINTABLE_QUESTIONS)
  ) {
    return {
      valid: false,
      error: `Current exam packet has ${assembledCount} questions, outside the required ${MIN_PRINTABLE_QUESTIONS}–${MAX_PRINTABLE_QUESTIONS} printable range.`,
    };
  }
  return { valid: true, error: null };
}

function normalizeStem(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = (seed * 9301 + 49297) % 233280;
  if (s <= 0) s = 12345;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function deduplicateQuestions(pool: Question[]): Question[] {
  const seenIds = new Set<string>();
  const seenStems = new Set<string>();
  const unique: Question[] = [];

  for (const q of pool) {
    if (!q || !q.id || !q.question || !Array.isArray(q.options) || q.options.length < 4) {
      continue;
    }
    const stemKey = normalizeStem(q.question);
    if (seenIds.has(q.id) || (stemKey && seenStems.has(stemKey))) {
      continue;
    }
    seenIds.add(q.id);
    if (stemKey) seenStems.add(stemKey);
    unique.push(q);
  }
  return unique;
}

function scoreWeakness(q: Question, stats?: UserStats, focusModuleIds?: number[]): number {
  let score = 0;
  if (focusModuleIds && focusModuleIds.length > 0 && focusModuleIds.includes(q.moduleId)) {
    score += 140;
  }

  const mistakeIds = new Set((stats?.mistakesHistory || []).map((m) => m.questionId));
  const skippedIds = new Set(stats?.skippedQuestionIds || []);

  if (mistakeIds.has(q.id)) score += 120;
  if (skippedIds.has(q.id)) score += 60;

  const attempts = stats?.attempts?.[q.id] || [];
  if (attempts.length > 0) {
    const wrongs = attempts.filter((a) => !a.isCorrect).length;
    const rights = attempts.length - wrongs;
    if (wrongs > rights) score += 85;
    else if (wrongs > 0) score += 35;
  } else {
    score += 12;
  }

  const qConf = stats?.confidenceScores?.[q.id];
  if (typeof qConf === 'number' && qConf <= 3) score += 45;

  const modConf = stats?.moduleConfidenceScores?.[q.moduleId];
  if (typeof modConf === 'number' && modConf <= 3) score += 30;

  const modMastery = stats?.moduleMastery?.[q.moduleId];
  if (modMastery && modMastery.total > 0) {
    const acc = modMastery.correct / modMastery.total;
    if (acc < 0.65) score += 55;
    else if (acc < 0.75) score += 32;
  }

  if (q.difficulty === 'Advanced') score += 18;
  else if (q.difficulty === 'Intermediate') score += 8;
  if (q.errorDiagnostic) score += 14;

  return score;
}

function scoreTrapDensity(q: Question): number {
  let score = 0;
  if (q.errorDiagnostic) score += 45;
  if (q.difficulty === 'Advanced') score += 35;
  else if (q.difficulty === 'Intermediate') score += 15;

  const combined = `${q.scenario} ${q.question} ${q.examTip}`.toLowerCase();
  const trapKeywords = [
    'policy',
    'rbac',
    'lock',
    'expressroute',
    'vpn',
    'availability zone',
    'availability set',
    'capex',
    'opex',
    'lrs',
    'zrs',
    'grs',
    'gzrs',
    'iaas',
    'paas',
    'saas',
    'shared responsibility',
    'entra',
    'defense in depth',
    'zero trust',
    'elasticity',
    'scalability',
  ];
  for (const kw of trapKeywords) {
    if (combined.includes(kw)) score += 12;
  }
  return score;
}

export interface BuildPrintableExamOptions {
  allQuestions: Question[];
  track: PrintableExamTrack;
  targetCount: number;
  stats?: UserStats;
  seed?: number;
  prioritizeGoogleSourced?: boolean;
  focusModuleIds?: number[];
}

export function buildPrintableMockExamQuestions({
  allQuestions,
  track,
  targetCount,
  stats,
  seed = 1,
  prioritizeGoogleSourced = true,
  focusModuleIds = [],
}: BuildPrintableExamOptions): Question[] {
  const count = clampPrintableCount(targetCount);
  const uniqueBank = deduplicateQuestions(allQuestions);
  if (uniqueBank.length === 0) return [];

  const googleSourced = prioritizeGoogleSourced
    ? uniqueBank.filter((q) => q.sourcedViaGoogle || q.isAiGenerated)
    : [];
  const googleIds = new Set(googleSourced.map((q) => q.id));

  const appendUnique = (selected: Question[], candidates: Question[], limit: number): Question[] => {
    const usedIds = new Set(selected.map((q) => q.id));
    const usedStems = new Set(selected.map((q) => normalizeStem(q.question)));
    const next = [...selected];
    for (const q of candidates) {
      if (next.length >= limit) break;
      const stem = normalizeStem(q.question);
      if (!usedIds.has(q.id) && !usedStems.has(stem)) {
        usedIds.add(q.id);
        usedStems.add(stem);
        next.push(q);
      }
    }
    return next;
  };

  let picked: Question[] = [];

  if (track === 'path-1' || track === 'path-2' || track === 'path-3') {
    const targetPath = track === 'path-1' ? 1 : track === 'path-2' ? 2 : 3;
    const primaryGoogle = shuffleWithSeed(
      googleSourced.filter((q) => q.learningPathId === targetPath),
      seed
    );
    const primaryBank = shuffleWithSeed(
      uniqueBank.filter((q) => q.learningPathId === targetPath && !googleIds.has(q.id)),
      seed + 7
    );
    picked = appendUnique(picked, [...primaryGoogle, ...primaryBank], count);
    if (picked.length < count) {
      picked = appendUnique(picked, shuffleWithSeed(uniqueBank, seed + 13), count);
    }
    return picked.slice(0, count);
  }

  if (track === 'weak-areas') {
    const ranked = [...uniqueBank]
      .map((q, idx) => ({
        q,
        score:
          scoreWeakness(q, stats, focusModuleIds) +
          (q.sourcedViaGoogle ? 25 : 0) +
          ((idx + seed * 17) % 11),
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.q);
    return appendUnique([], ranked, count).slice(0, count);
  }

  if (track === 'progressive') {
    const tier1Count = Math.floor(count / 3);
    const tier2Count = Math.floor((count - tier1Count) / 2);
    const tier3Count = count - tier1Count - tier2Count;

    const fundPool = shuffleWithSeed(
      uniqueBank.filter((q) => q.difficulty === 'Fundamental'),
      seed + 3
    );
    const interPool = shuffleWithSeed(
      uniqueBank.filter((q) => q.difficulty === 'Intermediate'),
      seed + 5
    );
    const advPool = shuffleWithSeed(
      uniqueBank.filter((q) => q.difficulty === 'Advanced'),
      seed + 11
    );

    const t1 = appendUnique([], fundPool, tier1Count);
    const t2 = appendUnique([], interPool, tier2Count);
    const t3 = appendUnique([], advPool, tier3Count);
    picked = appendUnique([], [...t1, ...t2, ...t3], count);

    if (picked.length < count) {
      picked = appendUnique(picked, shuffleWithSeed(uniqueBank, seed + 19), count);
    }

    const diffOrder: Record<Question['difficulty'], number> = {
      Fundamental: 1,
      Intermediate: 2,
      Advanced: 3,
    };
    return picked.slice(0, count).sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
  }

  if (track === 'scenario-only') {
    const scenarioRich = shuffleWithSeed(
      uniqueBank.filter((q) => q.scenario && q.scenario.trim().length >= 90),
      seed + 23
    ).sort((a, b) => {
      if (Boolean(a.sourcedViaGoogle) !== Boolean(b.sourcedViaGoogle)) {
        return a.sourcedViaGoogle ? -1 : 1;
      }
      return b.scenario.length - a.scenario.length;
    });
    const fallbackScenarios = shuffleWithSeed(
      uniqueBank.filter((q) => q.scenario && q.scenario.trim().length > 0),
      seed + 29
    );
    picked = appendUnique([], [...scenarioRich, ...fallbackScenarios, ...uniqueBank], count);
    return picked.slice(0, count);
  }

  if (track === 'tricky-traps') {
    const ranked = [...uniqueBank]
      .map((q, idx) => ({
        q,
        score: scoreTrapDensity(q) + ((idx + seed * 13) % 9),
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.q);
    return appendUnique([], ranked, count).slice(0, count);
  }

  if (track === 'unseen-fresh') {
    const attemptedIds = new Set(Object.keys(stats?.attempts || {}));
    const freshGoogle = shuffleWithSeed(googleSourced, seed + 31);
    const unseen = shuffleWithSeed(
      uniqueBank.filter((q) => !attemptedIds.has(q.id) && !googleIds.has(q.id)),
      seed + 37
    );
    const rest = shuffleWithSeed(
      uniqueBank.filter((q) => attemptedIds.has(q.id) && !googleIds.has(q.id)),
      seed + 41
    );
    return appendUnique([], [...freshGoogle, ...unseen, ...rest], count).slice(0, count);
  }

  // Default: 'balanced' — Official AZ-900 Blueprint Weights (27% P1, 40% P2, 33% P3)
  const p1Target = Math.round(count * 0.27);
  const p2Target = Math.round(count * 0.4);
  const p3Target = Math.max(1, count - p1Target - p2Target);

  const p1Pool = shuffleWithSeed(
    uniqueBank.filter((q) => q.learningPathId === 1),
    seed + 1
  ).sort((a, b) => (a.sourcedViaGoogle === b.sourcedViaGoogle ? 0 : a.sourcedViaGoogle ? -1 : 1));
  const p2Pool = shuffleWithSeed(
    uniqueBank.filter((q) => q.learningPathId === 2),
    seed + 2
  ).sort((a, b) => (a.sourcedViaGoogle === b.sourcedViaGoogle ? 0 : a.sourcedViaGoogle ? -1 : 1));
  const p3Pool = shuffleWithSeed(
    uniqueBank.filter((q) => q.learningPathId === 3),
    seed + 3
  ).sort((a, b) => (a.sourcedViaGoogle === b.sourcedViaGoogle ? 0 : a.sourcedViaGoogle ? -1 : 1));

  const s1 = appendUnique([], p1Pool, p1Target);
  const s2 = appendUnique([], p2Pool, p2Target);
  const s3 = appendUnique([], p3Pool, p3Target);
  picked = appendUnique([], shuffleWithSeed([...s1, ...s2, ...s3], seed + 9), count);

  if (picked.length < count) {
    picked = appendUnique(picked, shuffleWithSeed(uniqueBank, seed + 43), count);
  }

  return picked.slice(0, count);
}

export function collectGroundingSources(questions: Question[]): GroundingSourceLink[] {
  const seen = new Set<string>();
  const links: GroundingSourceLink[] = [];
  for (const q of questions) {
    for (const src of q.groundingSources || []) {
      if (src.uri && !seen.has(src.uri)) {
        seen.add(src.uri);
        links.push(src);
      }
    }
  }
  return links;
}

export function loadSavedPrintableExams(): PrintableMockExam[] {
  try {
    const raw = localStorage.getItem(SAVED_PRINTABLE_EXAMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        Array.isArray(item.questions) &&
        item.questions.length >= MIN_PRINTABLE_QUESTIONS
    );
  } catch {
    return [];
  }
}

export function savePrintableExamLocally(exam: PrintableMockExam): PrintableMockExam[] {
  const existing = loadSavedPrintableExams();
  const filtered = existing.filter((e) => e.id !== exam.id);
  const updated = [exam, ...filtered].slice(0, 25);
  try {
    localStorage.setItem(SAVED_PRINTABLE_EXAMS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to persist printable mock exam locally:', e);
  }
  return updated;
}

export function deleteSavedPrintableExamLocally(examId: string): PrintableMockExam[] {
  const updated = loadSavedPrintableExams().filter((e) => e.id !== examId);
  try {
    localStorage.setItem(SAVED_PRINTABLE_EXAMS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove saved printable mock exam:', e);
  }
  return updated;
}

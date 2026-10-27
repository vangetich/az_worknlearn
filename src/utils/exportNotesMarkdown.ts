import { Question, UserStats } from '../types/quiz';
import { getAllQuestionNotes } from './storage';
import { LEARNING_PATHS } from '../data/curriculum';
import { AZ900_FLASHCARDS } from '../data/flashcardsData';
import { HARAMBEE_SLIDES } from '../data/harambeeWisdom';

const SAVED_MEMORY_ANCHORS_KEY = 'az900_saved_memory_anchors_v1';

export interface SavedMemoryAnchor {
  id: string;
  questionId?: string;
  moduleId: number;
  moduleTitle: string;
  title: string;
  anchorText: string;
  examTrap?: string;
  createdAt: number;
}

export function getSavedMemoryAnchors(): SavedMemoryAnchor[] {
  try {
    const raw = localStorage.getItem(SAVED_MEMORY_ANCHORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMemoryAnchor(anchor: Omit<SavedMemoryAnchor, 'createdAt'>): SavedMemoryAnchor[] {
  const current = getSavedMemoryAnchors();
  const existsIndex = current.findIndex((a) => a.id === anchor.id);
  const entry: SavedMemoryAnchor = {
    ...anchor,
    createdAt: Date.now(),
  };

  const updated =
    existsIndex >= 0
      ? current.map((item, idx) => (idx === existsIndex ? entry : item))
      : [entry, ...current];

  try {
    localStorage.setItem(SAVED_MEMORY_ANCHORS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('az900-memory-anchors-updated', { detail: { anchors: updated } })
      );
    }
  } catch (e) {
    console.error('Failed to save memory anchor', e);
  }
  return updated;
}

export function removeMemoryAnchor(anchorId: string): SavedMemoryAnchor[] {
  const current = getSavedMemoryAnchors();
  const updated = current.filter((a) => a.id !== anchorId);
  try {
    localStorage.setItem(SAVED_MEMORY_ANCHORS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('az900-memory-anchors-updated', { detail: { anchors: updated } })
      );
    }
  } catch (e) {
    console.error('Failed to remove memory anchor', e);
  }
  return updated;
}

export function isMemoryAnchorSaved(anchorId: string): boolean {
  return getSavedMemoryAnchors().some((a) => a.id === anchorId);
}

/**
 * Generates a formatted Markdown (.md) string containing:
 * 1. All saved personal question notes & mnemonics
 * 2. All user-pinned memory anchors & question exam tips
 * 3. Bookmarked questions with their memory anchors
 * 4. High-yield AZ-900 Domain Memory Anchors & Exam Shortcuts for offline revision
 */
export function generateStudyNotesAndAnchorsMarkdown(
  questions: Question[],
  stats?: UserStats
): {
  markdown: string;
  notesCount: number;
  anchorsCount: number;
  bookmarksCount: number;
} {
  const notesMap = getAllQuestionNotes();
  const customAnchors = getSavedMemoryAnchors();
  const questionById = new Map<string, Question>(questions.map((q) => [q.id, q]));

  const notedQuestionIds = Object.keys(notesMap).filter((id) => Boolean(notesMap[id]?.trim()));
  const bookmarkedIds = stats?.bookmarks || [];

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const readableDate = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [];

  lines.push('# 📘 Microsoft AZ-900 Offline Study Guide: Question Notes & Memory Anchors');
  lines.push('');
  lines.push(`> **Generated:** ${readableDate}  `);
  lines.push(`> **Saved Question Notes:** ${notedQuestionIds.length}  `);
  lines.push(`> **Pinned Memory Anchors:** ${customAnchors.length}  `);
  lines.push(`> **Bookmarked Scenarios:** ${bookmarkedIds.length}  `);
  if (stats) {
    const accuracy =
      stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
    lines.push(
      `> **Current Readiness Snapshot:** ${stats.totalCorrect}/${stats.totalAnswered} Correct (${accuracy}% Accuracy • Streak: ${stats.streakDays}d)`
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📑 Table of Contents');
  lines.push('1. [Saved Personal Question Notes & Mnemonics](#-1-saved-personal-question-notes--mnemonics)');
  lines.push('2. [Pinned Memory Anchors & Exam Triggers](#-2-pinned-memory-anchors--exam-triggers)');
  lines.push('3. [Bookmarked Question Memory Anchors](#-3-bookmarked-question-memory-anchors)');
  lines.push('4. [Core AZ-900 Curriculum Memory Anchors (Paths 1–3)](#-4-core-az-900-curriculum-memory-anchors-paths-13)');
  lines.push('5. [Harambee Rapid Exam Shortcuts](#-5-harambee-rapid-exam-shortcuts)');
  lines.push('');
  lines.push('---');
  lines.push('');

  // ============================================================================
  // SECTION 1: SAVED PERSONAL QUESTION NOTES & MNEMONICS
  // ============================================================================
  lines.push('## 📝 1. Saved Personal Question Notes & Mnemonics');
  lines.push('');

  if (notedQuestionIds.length === 0) {
    lines.push(
      '_No personal question notes saved yet. Open the **Study Notes** drawer or inline note box on any question to write or voice-dictate your personal mnemonics._'
    );
    lines.push('');
  } else {
    // Sort by module and question ID
    const sortedNoteIds = [...notedQuestionIds].sort((a, b) => {
      const qA = questionById.get(a);
      const qB = questionById.get(b);
      const modA = qA?.moduleId ?? 99;
      const modB = qB?.moduleId ?? 99;
      if (modA !== modB) return modA - modB;
      return a.localeCompare(b);
    });

    sortedNoteIds.forEach((qId, idx) => {
      const noteText = notesMap[qId]?.trim() || '';
      const q = questionById.get(qId);

      if (q) {
        const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
        const matchedFlashcard = AZ900_FLASHCARDS.find((fc) => fc.moduleId === q.moduleId);

        lines.push(
          `### ${idx + 1}. [${q.id.toUpperCase()}] Module ${q.moduleId}: ${q.moduleTitle} (Path ${q.learningPathId})`
        );
        lines.push('');
        lines.push(`- **Difficulty:** ${q.difficulty || 'Intermediate'}`);
        lines.push(`- **Scenario:** ${q.scenario}`);
        lines.push(`- **Question:** **${q.question}**`);
        lines.push(
          `- **Correct Answer:** \`${q.correctAnswer}\` — ${correctOpt ? correctOpt.text : ''}`
        );
        lines.push('');
        lines.push('#### 💡 Your Saved Study Note');
        lines.push('```text');
        lines.push(noteText);
        lines.push('```');
        lines.push('');
        if (q.examTip) {
          lines.push(`> 🎯 **Question Memory Anchor (Exam Tip):** ${q.examTip}`);
          lines.push('');
        }
        if (matchedFlashcard?.memoryRule) {
          lines.push(`> 🧠 **Domain Mnemonic Rule:** ${matchedFlashcard.memoryRule}`);
          lines.push('');
        }
        lines.push(`- **Why It Is Correct:** ${q.whyCorrect}`);
        lines.push('');
        lines.push('---');
        lines.push('');
      } else {
        lines.push(`### ${idx + 1}. Question [${qId.toUpperCase()}]`);
        lines.push('');
        lines.push('```text');
        lines.push(noteText);
        lines.push('```');
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    });
  }

  // ============================================================================
  // SECTION 2: PINNED MEMORY ANCHORS & EXAM TRIGGERS
  // ============================================================================
  lines.push('## ⚓ 2. Pinned Memory Anchors & Exam Triggers');
  lines.push('');

  if (customAnchors.length === 0) {
    lines.push(
      '_No custom memory anchors pinned yet. Click **"Save Memory Anchor"** on any question\'s Exam Anchor Tip or Flashcard to pin it here._'
    );
    lines.push('');
  } else {
    customAnchors.forEach((anchor, idx) => {
      lines.push(
        `### ${idx + 1}. ${anchor.title} (Module ${anchor.moduleId}: ${anchor.moduleTitle})`
      );
      lines.push('');
      lines.push(`> ⚓ **Memory Anchor:** ${anchor.anchorText}`);
      if (anchor.examTrap) {
        lines.push(`> ⚠️ **Exam Trap to Watch:** ${anchor.examTrap}`);
      }
      lines.push('');
    });
    lines.push('---');
    lines.push('');
  }

  // ============================================================================
  // SECTION 3: BOOKMARKED QUESTION MEMORY ANCHORS
  // ============================================================================
  lines.push('## 🔖 3. Bookmarked Question Memory Anchors');
  lines.push('');

  const bookmarkedQuestions = bookmarkedIds
    .map((id) => questionById.get(id))
    .filter((q): q is Question => Boolean(q));

  if (bookmarkedQuestions.length === 0) {
    lines.push('_No bookmarked questions yet. Bookmark tricky scenarios during practice to include their memory anchors automatically._');
    lines.push('');
  } else {
    bookmarkedQuestions.forEach((q, idx) => {
      const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
      const userNote = notesMap[q.id]?.trim();
      lines.push(
        `### ${idx + 1}. [${q.id.toUpperCase()}] M${q.moduleId}: ${q.moduleTitle}`
      );
      lines.push(`- **Question:** ${q.question}`);
      lines.push(
        `- **Correct Choice:** **${q.correctAnswer}** — ${correctOpt ? correctOpt.text : ''}`
      );
      lines.push(`- **Memory Anchor / Exam Tip:** ${q.examTip}`);
      if (userNote) {
        lines.push(`- **Personal Note:** ${userNote}`);
      }
      lines.push('');
    });
  }

  lines.push('---');
  lines.push('');

  // ============================================================================
  // SECTION 4: CORE AZ-900 CURRICULUM MEMORY ANCHORS (PATHS 1–3)
  // ============================================================================
  lines.push('## 🧠 4. Core AZ-900 Curriculum Memory Anchors (Paths 1–3)');
  lines.push('');
  lines.push(
    'High-yield memory rules and real-world analogies mapped across all three official Microsoft AZ-900 exam domains:'
  );
  lines.push('');

  LEARNING_PATHS.forEach((path) => {
    lines.push(`### Learning Path ${path.id}: ${path.title} (${path.examWeight})`);
    lines.push('');
    const pathCards = AZ900_FLASHCARDS.filter((fc) => fc.pathId === path.id);
    pathCards.forEach((card) => {
      lines.push(`#### 🔹 ${card.term}${card.acronym ? ` (${card.acronym})` : ''} — _Module ${card.moduleId}_`);
      lines.push(`- **Memory Anchor:** ${card.memoryRule}`);
      lines.push(`- **Common Exam Trap:** ${card.examTrap}`);
      lines.push(`- **Official Definition:** ${card.officialDefinition}`);
      lines.push('');
    });
  });

  lines.push('---');
  lines.push('');

  // ============================================================================
  // SECTION 5: HARAMBEE RAPID EXAM SHORTCUTS
  // ============================================================================
  lines.push('## ⚡ 5. Harambee Rapid Exam Shortcuts');
  lines.push('');
  HARAMBEE_SLIDES.forEach((slide, i) => {
    lines.push(`### ${i + 1}. ${slide.englishTitle} (_${slide.swahiliTitle}_ — ${slide.category})`);
    lines.push(`- **Golden Rule:** ${slide.coreRule}`);
    lines.push(`- **Memory Shortcut:** \`${slide.examShortcut}\``);
    lines.push(`- **Watch Out For:** ${slide.oftenMissedCue}`);
    lines.push('');
  });

  lines.push('---');
  lines.push(
    `_Exported from AZ-900 Azure Fundamentals Practice Studio on ${dateStr} for offline revision._`
  );

  return {
    markdown: lines.join('\n'),
    notesCount: notedQuestionIds.length,
    anchorsCount: customAnchors.length + AZ900_FLASHCARDS.length,
    bookmarksCount: bookmarkedQuestions.length,
  };
}

/**
 * Triggers a browser file download of the formatted Markdown study file.
 */
export function downloadNotesAndMemoryAnchorsMarkdown(
  questions: Question[],
  stats?: UserStats
): {
  filename: string;
  notesCount: number;
  anchorsCount: number;
  bookmarksCount: number;
} {
  const { markdown, notesCount, anchorsCount, bookmarksCount } =
    generateStudyNotesAndAnchorsMarkdown(questions, stats);
  const today = new Date().toISOString().split('T')[0];
  const filename = `az900-notes-and-memory-anchors-${today}.md`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, notesCount, anchorsCount, bookmarksCount };
}

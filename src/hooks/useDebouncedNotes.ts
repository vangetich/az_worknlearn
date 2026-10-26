import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuestionNote, saveQuestionNote } from '../utils/storage';

export type NoteSaveStatus = 'idle' | 'saving' | 'saved';

interface UseDebouncedNotesOptions {
  questionId: string;
  delayMs?: number;
  onSaved?: (text: string) => void;
}

/**
 * Custom debounced auto-save hook for user-defined study notes
 * in the Bookmarks and AI(3) section.
 * Persists note edits directly to localStorage without requiring a manual save click.
 */
export function useDebouncedNotes({
  questionId,
  delayMs = 500,
  onSaved,
}: UseDebouncedNotesOptions) {
  const [noteText, setNoteText] = useState<string>(() => {
    return questionId ? getQuestionNote(questionId) : '';
  });
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMountRef = useRef<boolean>(true);
  const latestSavedTextRef = useRef<string>(noteText);

  // Re-sync noteText whenever questionId changes
  useEffect(() => {
    if (questionId) {
      const existing = getQuestionNote(questionId);
      setNoteText(existing);
      latestSavedTextRef.current = existing;
      setSaveStatus(existing.trim() ? 'saved' : 'idle');
    }
  }, [questionId]);

  // Debounced auto-save effect
  useEffect(() => {
    // Avoid auto-saving on initial component mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    if (!questionId) return;

    // If text hasn't changed from the last saved state, do nothing
    if (noteText === latestSavedTextRef.current) {
      return;
    }

    setSaveStatus('saving');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        saveQuestionNote(questionId, noteText);
        latestSavedTextRef.current = noteText;
        setSaveStatus(noteText.trim() ? 'saved' : 'idle');
        setLastSavedTimestamp(Date.now());
        if (onSaved) {
          onSaved(noteText.trim());
        }
      } catch (err) {
        console.error('Failed to auto-save study note:', err);
        setSaveStatus('idle');
      }
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [noteText, questionId, delayMs, onSaved]);

  // Immediate force save (for explicit Save button clicks or on unmount)
  const forceSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (questionId) {
      saveQuestionNote(questionId, noteText);
      latestSavedTextRef.current = noteText;
      setSaveStatus(noteText.trim() ? 'saved' : 'idle');
      setLastSavedTimestamp(Date.now());
      if (onSaved) {
        onSaved(noteText.trim());
      }
    }
  }, [questionId, noteText, onSaved]);

  // Delete note
  const deleteNote = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (questionId) {
      saveQuestionNote(questionId, '');
      setNoteText('');
      latestSavedTextRef.current = '';
      setSaveStatus('idle');
      setLastSavedTimestamp(Date.now());
      if (onSaved) {
        onSaved('');
      }
    }
  }, [questionId, onSaved]);

  return {
    noteText,
    setNoteText,
    saveStatus,
    lastSavedTimestamp,
    forceSave,
    deleteNote,
    hasExistingNote: Boolean(noteText.trim()),
  };
}

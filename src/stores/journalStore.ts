import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { uid } from '../utils/formatters';
import { JournalEntry, JournalStats } from '../types/journal.types';

interface JournalState {
  entries: JournalEntry[];
  getStats: () => JournalStats;
  addEntry:    (title: string, content: string) => JournalEntry;
  updateEntry: (id: string, data: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood' | 'tags' | 'isPinned'>>) => void;
  deleteEntry: (id: string) => void;
  togglePin:   (id: string) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      getStats: () => {
        const { entries } = get();
        const totalWords = entries.reduce((a, e) => a + e.wordCount, 0);
        return {
          totalEntries: entries.length,
          totalWords,
          streakDays: 0,
          avgWordsPerEntry: entries.length ? Math.round(totalWords / entries.length) : 0,
        };
      },

      addEntry: (title, content) => {
        const now = new Date().toISOString();
        const entry: JournalEntry = {
          id: uid(), title: title || 'Untitled', content,
          tags: [], isPinned: false,
          wordCount: countWords(content),
          createdAt: now, updatedAt: now,
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
        return entry;
      },

      updateEntry: (id, data) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id
              ? { ...e, ...data,
                  wordCount: data.content !== undefined ? countWords(data.content) : e.wordCount,
                  updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      togglePin:   (id) => set((s) => ({
        entries: s.entries.map((e) => e.id === id ? { ...e, isPinned: !e.isPinned } : e),
      })),
    }),
    { name: 'zenforge_journal', storage: createJSONStorage(() => zustandAsyncStorage) }
  )
);

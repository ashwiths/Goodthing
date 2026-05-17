// ─── Journal Types ────────────────────────────────────────────────────────────

export type JournalMood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';
export type JournalTag  = string;

export interface JournalEntry {
  id:        string;
  title:     string;
  content:   string;
  mood?:     JournalMood;
  tags:      JournalTag[];
  isPinned:  boolean;
  wordCount: number;
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}

export interface JournalStats {
  totalEntries: number;
  totalWords:   number;
  streakDays:   number;
  avgWordsPerEntry: number;
}

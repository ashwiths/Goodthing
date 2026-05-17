// ─── XP & Level System ────────────────────────────────────────────────────────

// Level thresholds: level N requires XP_TABLE[N-1] total XP
const BASE_XP = 100;
const GROWTH  = 1.35; // 35% harder each level

export function xpForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(GROWTH, level - 1));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= totalXP) {
    accumulated += xpForLevel(level);
    level++;
  }
  return level;
}

export function getXPProgress(totalXP: number): {
  level:   number;
  current: number;
  toNext:  number;
  percent: number;
} {
  const level   = getLevelFromXP(totalXP);
  const prevXP  = totalXpForLevel(level);
  const levelXP = xpForLevel(level);
  const current = totalXP - prevXP;
  const toNext  = levelXP - current;
  const percent = current / levelXP;
  return { level, current, toNext, percent };
}

export function getLevelTitle(level: number): string {
  const titles = [
    'Initiate','Apprentice','Practitioner','Adept','Expert',
    'Master','Grandmaster','Virtuoso','Sage','Ascendant',
    'Enlightened','Transcendent','Cyber Monk','Void Walker','ZenForge Elite',
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

// XP rewards by action
export const XP_REWARDS = {
  habitComplete:     10,
  habitStreak7:      50,
  habitStreak30:    150,
  focusSession25:    20,
  focusSession50:    45,
  moodLog:            5,
  journalEntry:      15,
  dailyMission:      30,
  firstOfDay:        10,  // bonus for first action of the day
} as const;

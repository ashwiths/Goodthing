// ─── Date Utilities ───────────────────────────────────────────────────────────

export const TODAY = (): string =>
  new Date().toISOString().split('T')[0]; // YYYY-MM-DD

export const NOW = (): string => new Date().toISOString();

export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromDateStr(str: string): Date {
  return new Date(str + 'T00:00:00');
}

export function diffDays(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    (fromDateStr(a).getTime() - fromDateStr(b).getTime()) / msPerDay
  );
}

export function isToday(dateStr: string): boolean {
  return dateStr === TODAY();
}

export function isYesterday(dateStr: string): boolean {
  return diffDays(TODAY(), dateStr) === 1;
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toDateStr(d);
  });
}

export function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return toDateStr(d);
  });
}

export function formatDisplayDate(dateStr: string): string {
  const date = fromDateStr(dateStr);
  const today = TODAY();
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));
  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getDayName(dateStr: string, short = true): string {
  const names = short
    ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return names[fromDateStr(dateStr).getDay()];
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Night Owl Mode 🦉';
}

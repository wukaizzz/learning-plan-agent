export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function computeDaysRemaining(examDate?: string, fallback = 0): number {
  if (!examDate) return fallback;

  const target = parseLocalDateOnly(examDate);
  if (!target) return fallback;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / DAY_MS));
}

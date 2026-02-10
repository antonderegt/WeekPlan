export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function getWeekStart(date: Date): Date {
  const start = startOfDay(date);
  const dayIndex = (start.getDay() + 6) % 7; // Monday = 0
  return addDays(start, -dayIndex);
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  const endLabel = weekEnd.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  return `${startLabel} - ${endLabel}`;
}

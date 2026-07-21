import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// remainingSeats is free text from the spreadsheet (e.g. "2-3", "3(5)", "4-5*")
// - this pulls out the first number as the guaranteed minimum seat count, or
// null when there isn't one (e.g. "Nicht zutreffend"). A literal "0" isn't a
// meaningful seat count to filter by either (a stray data-entry value), so it
// is treated the same as no value - always shown, never a filter checkbox.
export function parseMinSeats(remainingSeats: string): number | null {
  const match = remainingSeats.match(/\d+/);
  if (!match) return null;
  const value = parseInt(match[0], 10);
  return value === 0 ? null : value;
}

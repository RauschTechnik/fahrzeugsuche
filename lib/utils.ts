import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// remainingSeats is free text from the spreadsheet (e.g. "2-3", "3(5)", "4-5*")
// - this pulls out the first number as the guaranteed minimum seat count, or
// null when there isn't one (e.g. "Nicht zutreffend").
export function parseMinSeats(remainingSeats: string): number | null {
  const match = remainingSeats.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

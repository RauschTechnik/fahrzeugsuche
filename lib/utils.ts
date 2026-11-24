import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Spreadsheet comments sometimes carry a remark that should not be shown
// (e.g. "ohne Elektroantrieb") in front of other information. This drops just
// those phrases and keeps the rest, or returns null when nothing else is left.
export function stripCommentPhrases(comment: string | null, phrases: Array<RegExp>): string | null {
  if (!comment || phrases.length === 0) return comment;

  let result = comment;
  for (const phrase of phrases) {
    result = result.replace(new RegExp(`${phrase.source}(?:\\s*[.,;]\\s*)?`, 'gi'), '');
  }

  result = result
    .replace(/^[\s.,;]+/, '')
    .replace(/[\s,;]+$/, '')
    .trim();

  return result || null;
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

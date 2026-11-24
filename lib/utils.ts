import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Spreadsheet comments sometimes carry a drivetrain remark ("ohne
// Elektroantrieb", "Mit Hybridantrieb noch nicht verbaut oder geprüft") in
// front of other information. This drops just those sentences and keeps the
// rest, or returns null when nothing else is left.
const DRIVETRAIN_NOTES = [
  /mit hybridantrieb noch nicht verbaut oder geprüft/gi,
  /ohne elektroantrieb/gi,
  /ohne hybridantrieb/gi
];

export function stripDrivetrainNotes(comment: string | null): string | null {
  if (!comment) return comment;

  let result = comment;
  for (const note of DRIVETRAIN_NOTES) {
    result = result.replace(new RegExp(`${note.source}(?:\\s*[.,;]\\s*)?`, note.flags), '');
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

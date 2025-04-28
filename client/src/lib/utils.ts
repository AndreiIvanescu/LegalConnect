import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cleans hidden budget markers from description text
 * Used to prevent HTML comments from being displayed to users
 */
export function cleanDescription(description: string | null | undefined): string {
  if (!description) return '';
  
  // Remove the budget marker comments that we added for internal use
  return description.replace(/<!--BUDGET:\d+-\d+-->/g, '').trim();
}

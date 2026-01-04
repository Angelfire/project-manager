import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes.
 * Combines clsx for conditional classes and twMerge to resolve conflicts.
 *
 * @param inputs - Class values (strings, objects, arrays, etc.)
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * cn("px-4", "py-2", { "bg-red-500": isActive })
 * cn("px-4 py-2", "px-6") // Resolves to "py-2 px-6"
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

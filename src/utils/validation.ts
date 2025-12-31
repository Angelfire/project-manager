/**
 * Input validation utilities for user inputs
 */

/**
 * Validates and sanitizes a search term
 * @param searchTerm - The search term to validate
 * @returns Sanitized search term or null if invalid
 */
export function validateSearchTerm(searchTerm: string): string | null {
  if (!searchTerm || typeof searchTerm !== "string") {
    return null;
  }

  // Trim whitespace
  const trimmed = searchTerm.trim();

  // Return null if empty after trimming
  if (trimmed.length === 0) {
    return null;
  }

  // Limit length to prevent DoS
  if (trimmed.length > 500) {
    return null;
  }

  // Remove clearly dangerous characters (HTML/JS metacharacters and control chars)
  // This preserves international characters while stripping likely injection vectors.
  // Using String.fromCharCode to avoid ESLint control character warnings
  const dangerousChars = [
    ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(i)), // \x00-\x1F
    String.fromCharCode(127), // \x7F
    "<>=\"'`&",
  ].join("");
  // Escape all regex metacharacters that have special meaning in character classes
  // Must escape: backslash (\), closing bracket (]), and hyphen (-)
  // Caret (^) is placed not at start to avoid special meaning
  const escapedChars = dangerousChars.replace(/[\\\]\-^]/g, "\\$&");
  const sanitized = trimmed.replace(new RegExp(`[${escapedChars}]`, "g"), "");

  // Return null if sanitization removed all characters
  if (sanitized.length === 0) {
    return null;
  }

  return sanitized;
}

/**
 * Validates a file system path
 * @param path - The path to validate
 * @returns True if path appears valid, false otherwise
 */
export function validatePath(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") {
    return false;
  }

  // Check for null bytes (path traversal attempt)
  if (path.includes("\0")) {
    return false;
  }

  // Check for path traversal using component-based validation
  // This is more robust than regex patterns and handles all edge cases
  try {
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = path.replace(/\\/g, "/");
    const components = normalizedPath.split("/").filter((c) => c !== ""); // Remove empty components

    // Check if any component is ".." (parent directory)
    // This catches all path traversal patterns: "../something", "../../etc", etc.
    if (components.includes("..")) {
      return false;
    }

    // Additional check: if path starts with ".." after normalization
    // This explicitly rejects leading "../" segments (e.g., "../file")
    if (normalizedPath.startsWith("../")) {
      return false;
    }
  } catch {
    // If path parsing fails, reject it for safety
    return false;
  }

  // Limit path length
  if (path.length > 4096) {
    return false;
  }

  return true;
}

/**
 * Validates a process ID
 * @param pid - The process ID to validate
 * @returns True if PID is valid, false otherwise
 */
export function validatePid(pid: number | null | undefined): boolean {
  if (pid === null || pid === undefined || typeof pid !== "number") {
    return false;
  }

  // PID must be a positive integer (PID 0 is reserved for kernel/swapper and dangerous to kill)
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  // On most systems, PID is limited to 2^15 (32768) or 2^22 (4194304)
  // We'll use a reasonable upper bound
  if (pid > 10_000_000) {
    return false;
  }

  return true;
}

/**
 * Validates a port number
 * @param port - The port number to validate
 * @returns True if port is valid, false otherwise
 */
export function validatePort(port: number | null | undefined): boolean {
  if (port === null || port === undefined || typeof port !== "number") {
    return false;
  }

  // Port must be a positive integer
  if (!Number.isInteger(port) || port < 0) {
    return false;
  }

  // Valid port range is 0-65535
  if (port > 65535) {
    return false;
  }

  return true;
}

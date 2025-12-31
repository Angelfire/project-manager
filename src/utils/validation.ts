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

  // Remove potentially dangerous characters (but allow normal search characters)
  // Allow: letters, numbers, spaces, hyphens, underscores, dots
  const sanitized = trimmed.replace(/[^\w\s.-]/gi, "");

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

  // Check for suspicious patterns (basic path traversal detection)
  const suspiciousPatterns = [
    /\.\.\/\.\./g, // ../../
    /\.\.\\\.\./g, // ..\..\
    /^\.\./g, // Starts with ..
    /\/\.\./g, // Contains /..
    /\\\.\./g, // Contains \..
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path)) {
      return false;
    }
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

  // PID must be a positive integer
  if (!Number.isInteger(pid) || pid < 0) {
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

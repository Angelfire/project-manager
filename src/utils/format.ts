/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @returns Formatted string (e.g., "1.5 MB") or "Unknown" if bytes is null or invalid
 * @note In practice, bytes comes from Rust backend as u64, so it's always non-negative.
 *       Only null, NaN, and Infinity are validated as these can occur from serialization issues.
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "Unknown";
  // Handle invalid values: NaN or Infinity (can occur from serialization issues)
  if (!Number.isFinite(bytes)) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formats a Unix timestamp to a localized date string
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string (e.g., "Jan 15, 2024") or "Unknown" if timestamp is null or invalid
 * @note Rust backend uses duration_since(UNIX_EPOCH) which only returns positive values or errors.
 *       Only null, NaN, and Infinity are validated as these can occur from serialization issues.
 */
export function formatDate(timestamp: number | null): string {
  if (timestamp === null) return "Unknown";
  // Handle invalid values: NaN or Infinity (can occur from serialization issues)
  if (!Number.isFinite(timestamp)) return "Unknown";
  const date = new Date(timestamp * 1000);
  // Check if date is valid (Invalid Date returns NaN for getTime())
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

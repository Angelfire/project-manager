/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @returns Formatted string (e.g., "1.5 MB") or "Unknown" if bytes is null
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formats a Unix timestamp to a localized date string
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string (e.g., "Jan 15, 2024") or "Unknown" if timestamp is null
 */
export function formatDate(timestamp: number | null): string {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


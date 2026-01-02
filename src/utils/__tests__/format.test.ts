import { describe, it, expect } from "vitest";
import { formatFileSize, formatDate } from "../format";

describe("format", () => {
  describe("formatFileSize", () => {
    it("should return 'Unknown' for null", () => {
      expect(formatFileSize(null)).toBe("Unknown");
    });

    it("should return 'Unknown' for NaN", () => {
      expect(formatFileSize(NaN)).toBe("Unknown");
    });

    it("should return 'Unknown' for Infinity", () => {
      expect(formatFileSize(Infinity)).toBe("Unknown");
      expect(formatFileSize(-Infinity)).toBe("Unknown");
    });

    it("should return '0 B' for zero bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });

    it("should format bytes correctly", () => {
      expect(formatFileSize(500)).toBe("500.0 B");
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB");
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
    });

    it("should handle large file sizes", () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 2)).toBe("2.0 GB");
      // Very large files should cap at GB
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe("1024.0 GB");
    });

    it("should format decimal values correctly", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(2560)).toBe("2.5 KB");
      expect(formatFileSize(1024 * 1024 * 2.7)).toBe("2.7 MB");
    });

    it("should handle boundary values", () => {
      // Just below 1 KB
      expect(formatFileSize(1023)).toBe("1023.0 B");
      // Exactly 1 KB
      expect(formatFileSize(1024)).toBe("1.0 KB");
      // Just above 1 KB
      expect(formatFileSize(1025)).toBe("1.0 KB");
      // Just below 1 MB
      expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.0 KB");
      // Exactly 1 MB
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      // Just below 1 GB
      expect(formatFileSize(1024 * 1024 * 1024 - 1)).toBe("1024.0 MB");
      // Exactly 1 GB
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
    });

    it("should handle very small positive values", () => {
      expect(formatFileSize(1)).toBe("1.0 B");
      // Note: Values < 1 byte are edge cases. Math.log(0.5) is negative,
      // which causes the calculation to fail. In practice, file sizes are integers >= 0.
      // This test documents that very small values may not format correctly.
    });
  });

  describe("formatDate", () => {
    it("should return 'Unknown' for null", () => {
      expect(formatDate(null)).toBe("Unknown");
    });

    it("should return 'Unknown' for NaN", () => {
      expect(formatDate(NaN)).toBe("Unknown");
    });

    it("should return 'Unknown' for Infinity", () => {
      expect(formatDate(Infinity)).toBe("Unknown");
      expect(formatDate(-Infinity)).toBe("Unknown");
    });

    it("should format Unix timestamp correctly", () => {
      // January 15, 2024 12:00:00 UTC
      const timestamp = 1705324800;
      const formatted = formatDate(timestamp);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    it("should format different dates correctly", () => {
      // December 25, 2023 00:00:00 UTC
      // Note: toLocaleDateString uses local timezone, so the date may vary
      const timestamp = 1703462400;
      const formatted = formatDate(timestamp);
      // Should be Dec 24 or Dec 25 depending on timezone
      expect(formatted).toMatch(/Dec (24|25), 2023/);
    });

    it("should use en-US locale format", () => {
      // March 1, 2024 00:00:00 UTC
      // Note: toLocaleDateString uses local timezone, so the date may vary
      const timestamp = 1709251200;
      const formatted = formatDate(timestamp);
      // Should be Feb 29 or Mar 1 depending on timezone (US format)
      expect(formatted).toMatch(/(Feb 29|Mar 1), 2024/);
    });

    it("should handle edge cases", () => {
      // January 1, 1970 00:00:00 UTC (Unix epoch)
      // Note: toLocaleDateString uses local timezone, so the date may vary
      const timestamp = 0;
      const formatted = formatDate(timestamp);
      // Should be Dec 31, 1969 or Jan 1, 1970 depending on timezone
      expect(formatted).toMatch(/(Dec 31, 1969|Jan 1, 1970)/);
    });

    it("should handle very large timestamps", () => {
      // Year 2100 (far future but valid)
      // Note: toLocaleDateString uses local timezone, so the date may vary
      const timestamp = 4102444800; // Jan 1, 2100 UTC
      const formatted = formatDate(timestamp);
      // Should be Dec 31, 2099 or Jan 1, 2100 depending on timezone
      expect(formatted).toMatch(/(Dec 31, 2099|Jan 1, 2100)/);
    });

    it("should handle fractional timestamps", () => {
      // Timestamp with decimal part (should be handled by Date constructor)
      const timestamp = 1705324800.5;
      const formatted = formatDate(timestamp);
      // Should still format correctly (fractional seconds are ignored)
      expect(formatted).toMatch(/Jan 15, 2024/);
    });
  });
});

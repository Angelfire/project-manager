import { describe, it, expect } from "vitest";
import {
  validateSearchTerm,
  validatePath,
  validatePid,
  validatePort,
} from "../validation";

describe("validation", () => {
  describe("validateSearchTerm", () => {
    it("should return sanitized string for valid search term", () => {
      expect(validateSearchTerm("react")).toBe("react");
      expect(validateSearchTerm("node.js")).toBe("node.js");
      expect(validateSearchTerm("my-project")).toBe("my-project");
      expect(validateSearchTerm("project_name")).toBe("project_name");
    });

    it("should trim whitespace", () => {
      expect(validateSearchTerm("  react  ")).toBe("react");
      expect(validateSearchTerm("\t\nreact\n\t")).toBe("react");
    });

    it("should remove dangerous characters", () => {
      expect(validateSearchTerm("react<script>")).toBe("reactscript");
      // @ is removed but . is allowed, so "testexample.com" becomes "testexample.com"
      expect(validateSearchTerm("test@example.com")).toBe("testexample.com");
      // / is removed but . is allowed
      expect(validateSearchTerm("path/to/file")).toBe("pathtofile");
      expect(validateSearchTerm("test!@#$%^&*()")).toBe("test");
    });

    it("should allow safe characters", () => {
      expect(validateSearchTerm("react-18")).toBe("react-18");
      expect(validateSearchTerm("node.js")).toBe("node.js");
      expect(validateSearchTerm("my_project")).toBe("my_project");
      expect(validateSearchTerm("test 123")).toBe("test 123");
    });

    it("should return null for empty string", () => {
      expect(validateSearchTerm("")).toBeNull();
      expect(validateSearchTerm("   ")).toBeNull();
      expect(validateSearchTerm("\t\n")).toBeNull();
    });

    it("should return null for non-string input", () => {
      expect(validateSearchTerm(null as unknown as string)).toBeNull();
      expect(validateSearchTerm(undefined as unknown as string)).toBeNull();
      expect(validateSearchTerm(123 as unknown as string)).toBeNull();
    });

    it("should return null for strings longer than 500 characters", () => {
      const longString = "a".repeat(501);
      expect(validateSearchTerm(longString)).toBeNull();
    });

    it("should allow strings up to 500 characters", () => {
      const validString = "a".repeat(500);
      expect(validateSearchTerm(validString)).toBe(validString);
    });

    it("should handle unicode characters", () => {
      // Unicode characters that are not word characters are removed
      expect(validateSearchTerm("café")).toBe("caf");
      // When all characters are removed, function returns null
      expect(validateSearchTerm("测试")).toBeNull();
    });
  });

  describe("validatePath", () => {
    it("should return true for valid paths", () => {
      expect(validatePath("/home/user/projects")).toBe(true);
      expect(validatePath("C:\\Users\\Projects")).toBe(true);
      expect(validatePath("./relative/path")).toBe(true);
      expect(validatePath("~/projects")).toBe(true);
    });

    it("should return false for null or undefined", () => {
      expect(validatePath(null)).toBe(false);
      expect(validatePath(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(validatePath("")).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(validatePath(123 as unknown as string)).toBe(false);
      expect(validatePath({} as unknown as string)).toBe(false);
    });

    it("should return false for paths containing null bytes", () => {
      expect(validatePath("/path\0/to/file")).toBe(false);
      expect(validatePath("path\0")).toBe(false);
    });

    it("should return false for path traversal patterns", () => {
      expect(validatePath("../parent")).toBe(false);
      expect(validatePath("../../etc/passwd")).toBe(false);
      expect(validatePath("..\\..\\windows\\system32")).toBe(false);
      expect(validatePath("/path/../other")).toBe(false);
      expect(validatePath("path\\..\\other")).toBe(false);
    });

    it("should return false for paths longer than 4096 characters", () => {
      const longPath = "/" + "a".repeat(4096);
      expect(validatePath(longPath)).toBe(false);
    });

    it("should allow paths up to 4096 characters", () => {
      const validPath = "/" + "a".repeat(4095);
      expect(validatePath(validPath)).toBe(true);
    });

    it("should handle edge cases", () => {
      expect(validatePath(".")).toBe(true);
      expect(validatePath("..")).toBe(false); // Path traversal
      expect(validatePath("/")).toBe(true);
      expect(validatePath("C:")).toBe(true);
    });
  });

  describe("validatePid", () => {
    it("should return true for valid PIDs", () => {
      expect(validatePid(0)).toBe(true);
      expect(validatePid(1)).toBe(true);
      expect(validatePid(12345)).toBe(true);
      expect(validatePid(32768)).toBe(true);
      expect(validatePid(1000000)).toBe(true);
    });

    it("should return false for null or undefined", () => {
      expect(validatePid(null)).toBe(false);
      expect(validatePid(undefined)).toBe(false);
    });

    it("should return false for negative numbers", () => {
      expect(validatePid(-1)).toBe(false);
      expect(validatePid(-100)).toBe(false);
    });

    it("should return false for non-integer numbers", () => {
      expect(validatePid(123.45)).toBe(false);
      expect(validatePid(123.0)).toBe(true); // 123.0 is technically an integer
      expect(validatePid(Math.PI)).toBe(false);
    });

    it("should return false for PIDs greater than 10,000,000", () => {
      expect(validatePid(10_000_001)).toBe(false);
      expect(validatePid(100_000_000)).toBe(false);
    });

    it("should allow PIDs up to 10,000,000", () => {
      expect(validatePid(10_000_000)).toBe(true);
      expect(validatePid(9_999_999)).toBe(true);
    });

    it("should return false for non-number input", () => {
      expect(validatePid("123" as unknown as number)).toBe(false);
      expect(validatePid({} as unknown as number)).toBe(false);
      expect(validatePid([] as unknown as number)).toBe(false);
    });
  });

  describe("validatePort", () => {
    it("should return true for valid ports", () => {
      expect(validatePort(0)).toBe(true); // Port 0 (requests OS to assign ephemeral port)
      expect(validatePort(80)).toBe(true);
      expect(validatePort(3000)).toBe(true);
      expect(validatePort(8080)).toBe(true);
      expect(validatePort(65535)).toBe(true); // Max valid port
    });

    it("should return false for null or undefined", () => {
      expect(validatePort(null)).toBe(false);
      expect(validatePort(undefined)).toBe(false);
    });

    it("should return false for negative numbers", () => {
      expect(validatePort(-1)).toBe(false);
      expect(validatePort(-100)).toBe(false);
    });

    it("should return false for non-integer numbers", () => {
      expect(validatePort(3000.5)).toBe(false);
      expect(validatePort(Math.PI)).toBe(false);
    });

    it("should return false for ports greater than 65535", () => {
      expect(validatePort(65536)).toBe(false);
      expect(validatePort(100000)).toBe(false);
    });

    it("should allow port 0 (requests OS to assign ephemeral port)", () => {
      expect(validatePort(0)).toBe(true);
    });

    it("should allow port 65535 (max)", () => {
      expect(validatePort(65535)).toBe(true);
    });

    it("should return false for non-number input", () => {
      expect(validatePort("3000" as unknown as number)).toBe(false);
      expect(validatePort({} as unknown as number)).toBe(false);
      expect(validatePort([] as unknown as number)).toBe(false);
    });

    it("should handle common port numbers", () => {
      expect(validatePort(22)).toBe(true); // SSH
      expect(validatePort(80)).toBe(true); // HTTP
      expect(validatePort(443)).toBe(true); // HTTPS
      expect(validatePort(3000)).toBe(true); // Common dev port
      expect(validatePort(8080)).toBe(true); // Common alt HTTP
    });
  });
});

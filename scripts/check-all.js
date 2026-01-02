#!/usr/bin/env node

/**
 * Script to run all checks: lint, format, tests, and type-check
 * Exits with error code if any check fails
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Colors for output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// Track results
const results = {
  passed: [],
  failed: [],
};

/**
 * Run a check command and track the result
 */
function runCheck(name, command) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📋 Running: ${name}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    execSync(command, {
      cwd: projectRoot,
      stdio: "inherit",
      encoding: "utf-8",
    });
    console.log(`${colors.green}✅ ${name} passed${colors.reset}\n`);
    results.passed.push(name);
    return true;
  } catch (_error) {
    console.log(`${colors.red}❌ ${name} failed${colors.reset}\n`);
    results.failed.push(name);
    return false;
  }
}

// Main execution
console.log("🔍 Running all checks...\n");

// Run all checks
runCheck("Format Check", "pnpm run format:check");
runCheck("Lint", "pnpm run lint");
runCheck("Type Check", "pnpm run type-check");
runCheck("Tests", "pnpm test:run");

// Generate final report
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📊 FINAL REPORT");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");

if (results.passed.length > 0) {
  console.log(
    `${colors.green}✅ Passed checks (${results.passed.length}):${colors.reset}`
  );
  results.passed.forEach((check) => {
    console.log(`  ${colors.green}✓${colors.reset} ${check}`);
  });
  console.log("");
}

if (results.failed.length > 0) {
  console.log(
    `${colors.red}❌ Failed checks (${results.failed.length}):${colors.reset}`
  );
  results.failed.forEach((check) => {
    console.log(`  ${colors.red}✗${colors.reset} ${check}`);
  });
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `${colors.red}❌ Some checks failed. Please fix the errors above.${colors.reset}`
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  process.exit(1);
} else {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`${colors.green}✅ All checks passed!${colors.reset}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  process.exit(0);
}

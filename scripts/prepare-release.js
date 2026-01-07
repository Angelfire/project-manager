#!/usr/bin/env node

import fs from "fs";
import { execSync } from "child_process";
import readline from "readline";

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function prepareRelease() {
  const version = process.argv[2];

  if (!version || !version.match(/^v?\d+\.\d+\.\d+$/)) {
    console.error("❌ Usage: node scripts/prepare-release.js v1.0.0");
    console.error("   or: pnpm run prepare-release v1.0.0");
    process.exit(1);
  }

  const cleanVersion = version.replace("v", "");
  const tagVersion = version.startsWith("v") ? version : `v${version}`;

  console.log(`🚀 Preparing release ${tagVersion}...\n`);

  try {
    // Check git status
    console.log("🔍 Checking git status...");
    const gitStatus = exec("git status --porcelain", { silent: true });
    if (gitStatus.trim()) {
      console.error(
        "❌ Working directory is not clean. Please commit or stash changes first."
      );
      console.log("Uncommitted changes:");
      console.log(gitStatus);
      process.exit(1);
    }
    console.log("✅ Working directory is clean");

    // Check current branch
    const currentBranch = exec("git branch --show-current", {
      silent: true,
    }).trim();
    if (currentBranch !== "main" && currentBranch !== "master") {
      console.warn(
        `⚠️  Warning: Not on main/master branch (current: ${currentBranch})`
      );
      const proceed = await askQuestion("Continue anyway? (y/N): ");
      if (proceed.toLowerCase() !== "y" && proceed.toLowerCase() !== "yes") {
        console.log("Aborted.");
        process.exit(0);
      }
    } else {
      console.log(`✅ On ${currentBranch} branch`);
    }

    // Run all checks first
    console.log("\n🔍 Running pre-release checks...");
    exec("pnpm run check-all");
    console.log("✅ All checks passed");

    // Update package.json
    console.log("\n📝 Updating package.json...");
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const oldPkgVersion = pkg.version;
    pkg.version = cleanVersion;
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
    console.log(`   ${oldPkgVersion} → ${cleanVersion}`);

    // Update Cargo.toml
    console.log("📝 Updating Cargo.toml...");
    const cargoPath = "src-tauri/Cargo.toml";
    const cargoToml = fs.readFileSync(cargoPath, "utf8");
    const oldCargoVersion = cargoToml.match(/version = "([^"]*)"/);
    const updatedCargo = cargoToml.replace(
      /version = "[^"]*"/,
      `version = "${cleanVersion}"`
    );
    fs.writeFileSync(cargoPath, updatedCargo);
    console.log(
      `   ${oldCargoVersion ? oldCargoVersion[1] : "unknown"} → ${cleanVersion}`
    );

    // Update tauri.conf.json
    console.log("📝 Updating tauri.conf.json...");
    const tauriConfigPath = "src-tauri/tauri.conf.json";
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));
    const oldTauriVersion = tauriConfig.version;
    tauriConfig.version = cleanVersion;
    fs.writeFileSync(
      tauriConfigPath,
      JSON.stringify(tauriConfig, null, 2) + "\n"
    );
    console.log(`   ${oldTauriVersion} → ${cleanVersion}`);

    // Update tauri.macos.conf.json if it exists
    const tauriMacosPath = "src-tauri/tauri.macos.conf.json";
    if (fs.existsSync(tauriMacosPath)) {
      console.log("📝 Updating tauri.macos.conf.json...");
      const tauriMacosConfig = JSON.parse(
        fs.readFileSync(tauriMacosPath, "utf8")
      );
      const oldMacosVersion = tauriMacosConfig.version;
      tauriMacosConfig.version = cleanVersion;
      fs.writeFileSync(
        tauriMacosPath,
        JSON.stringify(tauriMacosConfig, null, 2) + "\n"
      );
      console.log(`   ${oldMacosVersion} → ${cleanVersion}`);
    }

    // Run pnpm install to update lock files
    console.log("\n📦 Updating lock files...");
    exec("pnpm install", { silent: true });
    console.log("✅ Lock files updated");

    // Verify configurations
    console.log("\n🔍 Verifying configurations...");

    if (!tauriConfig.bundle?.active) {
      console.warn("⚠️  Warning: Bundle is not active in tauri.conf.json");
    } else {
      console.log("✅ Bundle is active");
    }

    if (!tauriConfig.bundle?.targets?.includes("dmg")) {
      console.warn("⚠️  Warning: DMG target not included in bundle targets");
    } else {
      console.log("✅ DMG target configured");
    }

    // Final check that Rust code compiles
    console.log("\n🔍 Running final compilation check...");
    exec("cd src-tauri && cargo check", { silent: true });
    console.log("✅ Rust compilation check passed");

    console.log(`\n🎉 Successfully prepared release ${tagVersion}!`);
    console.log("\n📋 Next steps:");
    console.log(`   1. Review changes: git diff`);
    console.log(`   2. Commit changes: git add .`);
    console.log(
      `   3. Create commit: git commit -m "chore: release ${tagVersion}"`
    );
    console.log(`   4. Create tag: git tag ${tagVersion}`);
    console.log(`   5. Push: git push origin ${currentBranch} --tags`);
     console.log(`\n🚀 After pushing:`);
     console.log(
       `   • Build macOS release: pnpm tauri build --config src-tauri/tauri.macos.conf.json`
     );
    console.log(
      `   • Create GitHub release: https://github.com/Angelfire/runstack/releases/new?tag=${tagVersion}`
    );
    console.log(`   • Upload DMG and .app files to the GitHub release`);

    // Interactive execution option
    const answer = await askQuestion(
      "\n❓ Would you like me to execute the git commands? (y/N): "
    );

    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      console.log("\n⚡ Executing git commands...");

      console.log("📝 Adding changes...");
      exec("git add .");

      console.log("💾 Creating commit...");
      exec(`git commit -m "chore: release ${tagVersion}"`);

      console.log("🏷️  Creating tag...");
      exec(`git tag ${tagVersion}`);

      console.log("📤 Pushing to remote...");
      exec(`git push origin ${currentBranch} --tags`);

       console.log(`\n🎊 Release ${tagVersion} has been published!`);
       console.log(
         `📦 Build the release: pnpm tauri build --config src-tauri/tauri.macos.conf.json`
       );
      console.log(
        `📱 Create GitHub release: https://github.com/Angelfire/runstack/releases/new?tag=${tagVersion}`
      );
    } else {
      console.log("\n📝 Git commands saved for manual execution.");
      console.log("   Run them when you're ready to release.");
    }
  } catch (error) {
    console.error("\n❌ Pre-release preparation failed:", error.message);
    process.exit(1);
  }
}

// Run if this is the main module
prepareRelease();

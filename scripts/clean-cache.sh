#!/bin/bash

# Script to clean all caches and build artifacts from the project
# This includes: node_modules, dist, Rust target, coverage, and pnpm cache

set -e

echo "🧹 Cleaning project caches..."

# Frontend build artifacts
if [ -d "dist" ]; then
  echo "  Removing dist/..."
  rm -rf dist
fi

# Node modules
if [ -d "node_modules" ]; then
  echo "  Removing node_modules/..."
  rm -rf node_modules
fi

# Rust build artifacts
if [ -d "src-tauri/target" ]; then
  echo "  Removing src-tauri/target/..."
  rm -rf src-tauri/target
fi

# Coverage reports
if [ -d "coverage" ]; then
  echo "  Removing coverage/..."
  rm -rf coverage
fi

# Vite cache (if exists)
if [ -d ".vite" ]; then
  echo "  Removing .vite/..."
  rm -rf .vite
fi

# pnpm store cache (optional - uncomment if needed)
# echo "  Clearing pnpm store cache..."
# pnpm store prune

echo "✅ Cache cleanup complete!"
echo ""
echo "To reinstall dependencies, run: pnpm install"
echo "To rebuild, run: pnpm run build"


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const host = process.env.TAURI_DEV_HOST;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Build optimizations for production
  build: {
    // Disable source maps in production for faster builds
    sourcemap: false,
    // Disable compressed size reporting for faster builds
    reportCompressedSize: false,
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Use esbuild for minification (20-40x faster than terser, only 1-2% worse compression)
    // esbuild automatically removes console.logs and debugger statements in production
    minify: "esbuild",
    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching (function form is more flexible)
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("node_modules/@tauri-apps") ||
            id.includes("node_modules/@tauri-apps/plugin")
          ) {
            return "vendor-tauri";
          }
          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/lucide-react")
          ) {
            return "vendor-ui";
          }
          if (
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/sonner")
          ) {
            return "vendor-utils";
          }
        },
      },
    },
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
    },
  },

  // Optimize dependencies - explicitly prebundle these deps
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tauri-apps/api",
      "@tauri-apps/plugin-dialog",
      "@tauri-apps/plugin-fs",
      "@tauri-apps/plugin-opener",
      "@tauri-apps/plugin-shell",
      "lucide-react",
      "sonner",
      "clsx",
      "tailwind-merge",
    ],
  },
  // Vitest configuration (only used when running tests)
  // @ts-expect-error - test is a valid property for Vitest but not in Vite types
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "src-tauri/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/__tests__/**",
        "**/__mocks__/**",
      ],
    },
  },
});

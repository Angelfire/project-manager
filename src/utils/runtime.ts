import { Project } from "../types";

export const getRuntimeIcon = (runtime: string): string => {
  switch (runtime) {
    case "Node.js":
      return "🟢";
    case "Deno":
      return "🦕";
    case "Bun":
      return "🥟";
    default:
      return "📦";
  }
};

export const getRuntimeColor = (runtime: string): string => {
  switch (runtime) {
    case "Node.js":
      return "bg-green-900/30 text-green-200 border border-green-700";
    case "Deno":
      return "bg-teal-900/30 text-teal-200 border border-teal-700";
    case "Bun":
      return "bg-amber-900/30 text-amber-200 border border-amber-700";
    default:
      return "bg-gray-700 text-gray-300 border border-gray-600";
  }
};

export const getRuntimeTopBar = (runtime: string): string => {
  switch (runtime) {
    case "Node.js":
      return "bg-green-900";
    case "Deno":
      return "bg-teal-900";
    case "Bun":
      return "bg-amber-900";
    default:
      return "bg-gray-700";
  }
};

export const getDefaultPortForFramework = (project: Project): number | null => {
  // Use the detected framework to get the correct default port
  const framework = project.framework || "node";

  switch (framework) {
    case "astro":
      return 4321;
    case "nextjs":
      return 3000;
    case "vite":
      return 5173;
    case "react":
      return 3000;
    case "sveltekit":
      return 5173;
    case "nuxt":
      return 3000;
    case "deno":
      return 8000;
    default:
      return 3000; // Generic default port
  }
};


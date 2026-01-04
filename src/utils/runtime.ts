import { Project } from "@/types";

/**
 * Returns the Nerd Font icon class name for a given runtime.
 *
 * @param runtime - Runtime name (e.g., "Node.js", "Deno", "Bun")
 * @returns Nerd Font icon class name
 */
export const getRuntimeIcon = (runtime: string): string => {
  switch (runtime) {
    case "Node.js":
      return "nf nf-md-nodejs";
    case "Deno":
      return "nf nf-dev-denojs";
    case "Bun":
      return "nf nf-dev-bun";
    default:
      return "nf nf-oct-package";
  }
};

export const getRuntimeColor = (runtime: string): string => {
  switch (runtime) {
    case "Node.js":
      return "bg-runtime-node/30 text-runtime-node-foreground border border-runtime-node";
    case "Deno":
      return "bg-runtime-deno/30 text-runtime-deno-foreground border border-runtime-deno";
    case "Bun":
      return "bg-runtime-bun/30 text-runtime-bun-foreground border border-runtime-bun";
    default:
      return "bg-accent text-foreground border border-border";
  }
};

export const getRuntimeTopBar = (runtime: string): string => {
  switch (runtime) {
    case "Node.js":
      return "bg-runtime-node";
    case "Deno":
      return "bg-runtime-deno";
    case "Bun":
      return "bg-runtime-bun";
    default:
      return "bg-accent";
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

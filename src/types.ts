export interface Project {
  name: string;
  path: string;
  runtime: string;
  package_manager: string | null;
  port: number | null;
  framework: string | null;
  runtime_version: string | null;
  scripts: Record<string, string> | null;
  size: number | null;
  modified: number | null;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: "stdout" | "stderr";
  content: string;
  projectPath: string;
}

export interface FilterOption {
  runtime: string;
  framework: string;
  status: "all" | "running" | "stopped";
}

export type SortOption = "name" | "modified" | "size";

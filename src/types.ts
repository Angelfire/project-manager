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


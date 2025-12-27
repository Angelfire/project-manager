export interface Project {
  name: string;
  path: string;
  runtime: string;
  package_manager: string | null;
  port: number | null;
  framework: string | null;
}


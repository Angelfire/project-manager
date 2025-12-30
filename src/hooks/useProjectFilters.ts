import { useMemo } from "react";
import { Project } from "../types";
import { FilterOption } from "../components/ProjectFilters";

type SortOption = "name" | "modified" | "size";

export function useProjectFilters(
  projects: Project[],
  searchTerm: string,
  filters: FilterOption,
  sortBy: SortOption,
  sortAscending: boolean,
  runningProjects: Set<string>
) {
  const uniqueRuntimes = useMemo(
    () => Array.from(new Set(projects.map((p) => p.runtime))),
    [projects]
  );

  const uniqueFrameworks = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => p.framework)
            .filter((f): f is string => f !== null)
        )
      ),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Search filter
        if (!project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Runtime filter
        if (filters.runtime && project.runtime !== filters.runtime) {
          return false;
        }

        // Framework filter
        if (filters.framework && project.framework !== filters.framework) {
          return false;
        }

        // Status filter
        const isRunning = runningProjects.has(project.path);
        if (filters.status === "running" && !isRunning) {
          return false;
        }
        if (filters.status === "stopped" && isRunning) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "modified": {
            const aModified = a.modified || 0;
            const bModified = b.modified || 0;
            comparison = aModified - bModified;
            break;
          }
          case "size": {
            const aSize = a.size || 0;
            const bSize = b.size || 0;
            comparison = aSize - bSize;
            break;
          }
        }

        return sortAscending ? comparison : -comparison;
      });
  }, [projects, searchTerm, filters, sortBy, sortAscending, runningProjects]);

  return {
    uniqueRuntimes,
    uniqueFrameworks,
    filteredProjects,
  };
}

import { useState, lazy, Suspense } from "react";
import { Loader2, Filter, Search, FolderOpen, Folder } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { DirectorySelector } from "@/components/DirectorySelector";
import { useSearchInput } from "@/hooks/useSearchInput";
import { useSort } from "@/hooks/useSort";
import { useDirectorySelection } from "@/hooks/useDirectorySelection";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { SortControls } from "@/components/SortControls";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import type { FilterOption } from "@/components/ProjectFilters";

// Lazy load heavy components to improve initial load time
const ProjectLogs = lazy(() =>
  import("@/components/ProjectLogs").then((module) => ({
    default: module.ProjectLogs,
  }))
);

// Note: ProjectFilters is loaded on-demand to improve initial load
// It's used conditionally (filters only when shown)
const ProjectFilters = lazy(() =>
  import("@/components/ProjectFilters").then((module) => ({
    default: module.ProjectFilters,
  }))
);

/**
 * Main application component.
 * Manages project scanning, filtering, sorting, and display.
 *
 * @component
 */
function App() {
  const {
    searchTerm,
    searchError,
    handleChange: handleSearchChange,
  } = useSearchInput();

  const { sortBy, sortAscending, handleSortChange, toggleSortDirection } =
    useSort();

  const [filters, setFilters] = useState<FilterOption>({
    runtime: null,
    framework: null,
    status: "all",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [openLogsFor, setOpenLogsFor] = useState<string | null>(null);

  const {
    selectedDirectory,
    setSelectedDirectory,
    projects,
    loading,
    runningProjects,
    rustProcessPids,
    getProjectLogs,
    clearProjectLogs,
    loadProjects,
    runProject,
    stopProject,
  } = useProjects();

  const { selectDirectory } = useDirectorySelection({
    onDirectorySelected: (path) => {
      setSelectedDirectory(path);
      loadProjects(path);
    },
  });

  const { uniqueRuntimes, uniqueFrameworks, filteredProjects } =
    useProjectFilters(
      projects,
      searchTerm,
      filters,
      sortBy,
      sortAscending,
      runningProjects
    );

  const handleToggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const handleRescan = () => {
    if (selectedDirectory) {
      loadProjects(selectedDirectory);
    }
  };

  const getProjectName = (path: string): string => {
    return projects.find((p) => p.path === path)?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-7xl">
        <AppHeader />

        <DirectorySelector
          selectedDirectory={selectedDirectory}
          loading={loading}
          onSelect={selectDirectory}
          onRescan={handleRescan}
        />

        {loading && <LoadingState />}

        {!loading && projects.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Projects
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {filteredProjects.length} of {projects.length}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <SearchBar
                    value={searchTerm}
                    onChange={handleSearchChange}
                    error={searchError}
                  />
                  <Button
                    onClick={handleToggleFilters}
                    variant={showFilters ? "primary" : "secondary"}
                    size="md"
                    icon={Filter}
                    aria-label={showFilters ? "Hide filters" : "Show filters"}
                    aria-expanded={showFilters}
                    aria-controls="project-filters"
                  >
                    Filters
                  </Button>
                  <SortControls
                    sortBy={sortBy}
                    sortAscending={sortAscending}
                    onSortChange={handleSortChange}
                    onSortDirectionToggle={toggleSortDirection}
                  />
                </div>
              </div>

              {showFilters && (
                <div id="project-filters">
                  <Suspense fallback={<div className="h-20" />}>
                    <ProjectFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      uniqueRuntimes={uniqueRuntimes}
                      uniqueFrameworks={uniqueFrameworks}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.path}
                  project={project}
                  isRunning={runningProjects.has(project.path)}
                  getProjectLogs={getProjectLogs}
                  onRun={runProject}
                  onStop={stopProject}
                  onOpenLogs={setOpenLogsFor}
                  projectPid={rustProcessPids.get(project.path)}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && searchTerm.length > 0 && (
              <EmptyState
                icon={Search}
                title={`No projects found matching "${searchTerm}"`}
                description="Try adjusting your search term or filters"
              />
            )}
          </div>
        )}

        {!loading && selectedDirectory && projects.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            title="No projects found"
            description="Try another directory"
          />
        )}

        {!selectedDirectory && (
          <EmptyState
            icon={Folder}
            title="Welcome"
            description="Select a directory to start managing your projects"
            iconSize="lg"
            showTitleAsHeading
          />
        )}

        {openLogsFor && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card rounded-lg border border-border p-8">
                  <Loader2 className="size-8 text-muted-foreground animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Loading logs...
                  </p>
                </div>
              </div>
            }
          >
            <ProjectLogs
              projectName={getProjectName(openLogsFor)}
              projectPath={openLogsFor}
              logs={getProjectLogs(openLogsFor)}
              isOpen={true}
              onClose={() => setOpenLogsFor(null)}
              onClear={() => {
                clearProjectLogs(openLogsFor);
              }}
            />
          </Suspense>
        )}

        <Toaster />
      </div>
    </div>
  );
}

export default App;

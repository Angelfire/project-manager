import { useState, useCallback, lazy, Suspense } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { cn } from "@/utils/cn";
import {
  Search,
  Loader2,
  FolderOpen,
  Folder,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import runstackIcon from "@/assets/runstack.png";
import { ProjectFilters, type FilterOption } from "@/components/ProjectFilters";
import { ProjectCard } from "@/components/ProjectCard";
import { DirectorySelector } from "@/components/DirectorySelector";
import { useSearchInput } from "@/hooks/useSearchInput";

// Lazy load heavy components
const ProjectLogs = lazy(() =>
  import("@/components/ProjectLogs").then((module) => ({
    default: module.ProjectLogs,
  }))
);
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { Toaster } from "@/components/ui/toaster";
import { toastError } from "@/utils/toast";

type SortOption = "name" | "modified" | "size";

function App() {
  const {
    searchTerm,
    searchError,
    handleChange: handleSearchChange,
  } = useSearchInput();
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortAscending, setSortAscending] = useState(true);
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
    getProjectLogs,
    clearProjectLogs,
    loadProjects,
    runProject,
    stopProject,
  } = useProjects();

  const { uniqueRuntimes, uniqueFrameworks, filteredProjects } =
    useProjectFilters(
      projects,
      searchTerm,
      filters,
      sortBy,
      sortAscending,
      runningProjects
    );

  const handleSelectDirectory = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select directory",
      });

      if (selected && typeof selected === "string") {
        setSelectedDirectory(selected);
        loadProjects(selected);
      }
    } catch (error) {
      toastError("Error selecting directory", String(error));
    }
  }, [loadProjects, setSelectedDirectory]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as SortOption);
  }, []);

  const handleSortDirectionToggle = useCallback(() => {
    setSortAscending((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-7xl">
        <header className="mb-10">
          <div className="flex items-center gap-4">
            <img src={runstackIcon} alt="RunStack" className="size-16" />

            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                RunStack
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage and run your Node.js, Deno and Bun projects
              </p>
            </div>
          </div>
        </header>

        <DirectorySelector
          selectedDirectory={selectedDirectory}
          loading={loading}
          onSelect={handleSelectDirectory}
          onRescan={() => {
            if (selectedDirectory) {
              loadProjects(selectedDirectory);
            }
          }}
        />

        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center size-12 bg-secondary rounded-lg mb-4">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
            <p className="text-muted-foreground font-medium">
              Scanning projects...
            </p>
            <p className="text-muted-foreground text-sm mt-1">Please wait</p>
          </div>
        )}

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
                  <div className="flex-1 sm:w-56">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        maxLength={500}
                        className={cn(
                          "w-full py-2.5 px-4 pl-10 border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:border-border transition-all text-sm leading-none",
                          searchError
                            ? "border-destructive focus:ring-destructive"
                            : "border-border focus:ring-ring"
                        )}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                    {searchError && (
                      <p className="mt-1 text-xs text-destructive">
                        {searchError}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleToggleFilters}
                    variant={showFilters ? "primary" : "secondary"}
                    size="md"
                    icon={Filter}
                  >
                    Filters
                  </Button>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sortBy}
                      onChange={handleSortChange}
                      placeholder="Sort by..."
                      className="w-45"
                    >
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="modified">Sort by Date</SelectItem>
                      <SelectItem value="size">Sort by Size</SelectItem>
                    </Select>
                    <Button
                      onClick={handleSortDirectionToggle}
                      variant="ghost"
                      size="sm"
                      icon={ArrowUpDown}
                      className="p-2"
                      title={sortAscending ? "Ascending" : "Descending"}
                    />
                  </div>
                </div>
              </div>

              {showFilters && (
                <ProjectFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  uniqueRuntimes={uniqueRuntimes}
                  uniqueFrameworks={uniqueFrameworks}
                />
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
                />
              ))}
            </div>

            {/* No search results message */}
            {filteredProjects.length === 0 && searchTerm.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <div className="inline-flex items-center justify-center size-12 bg-secondary rounded-lg mb-4">
                  <Search className="size-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  No projects found matching &quot;{searchTerm}&quot;
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Try adjusting your search term or filters
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && selectedDirectory && projects.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <div className="inline-flex items-center justify-center size-12 bg-secondary rounded-lg mb-4">
              <FolderOpen className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              No projects found
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Try another directory
            </p>
          </div>
        )}

        {!selectedDirectory && (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <div className="inline-flex items-center justify-center size-14 bg-secondary rounded-lg mb-6">
              <Folder className="size-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Welcome
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Select a directory to start managing your projects
            </p>
          </div>
        )}

        {/* Logs Modal */}
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
              projectName={
                projects.find((p) => p.path === openLogsFor)?.name || "Unknown"
              }
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

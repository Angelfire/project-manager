import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { cn } from "./utils/cn";
import {
  Folder,
  Play,
  Square,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2,
  FolderOpen,
  ArrowUpDown,
  Info,
  Calendar,
  HardDrive,
  Code,
  Filter,
  FileText,
} from "lucide-react";
import { useProjects } from "./hooks/useProjects";
import runstackIcon from "./assets/runstack.png";
import {
  getRuntimeIcon,
  getRuntimeColor,
  getRuntimeTopBar,
} from "./utils/runtime";
import { openProjectInBrowser, detectPort } from "./services/projectService";
import { ProjectFilters, type FilterOption } from "./components/ProjectFilters";
import { QuickActionsMenu } from "./components/QuickActionsMenu";
import { ProjectLogs } from "./components/ProjectLogs";
import { Select, SelectItem } from "./components/ui/select";
import { Button } from "./components/ui/button";
import { useProjectFilters } from "./hooks/useProjectFilters";
import { Toaster } from "./components/ui/toaster";
import { toastError } from "./utils/toast";

type SortOption = "name" | "modified" | "size";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
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
    setProjects,
    loading,
    runningProjects,
    processes,
    getProjectLogs,
    clearProjectLogs,
    loadProjects,
    runProject,
    stopProject,
  } = useProjects();

  const selectDirectory = async () => {
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
  };

  const { uniqueRuntimes, uniqueFrameworks, filteredProjects } =
    useProjectFilters(
      projects,
      searchTerm,
      filters,
      sortBy,
      sortAscending,
      runningProjects
    );

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto py-8 max-w-7xl">
        <header className="mb-10">
          <div className="flex items-center gap-4">
            <img src={runstackIcon} alt="RunStack" className="size-16" />

            <div>
              <h1 className="text-3xl font-semibold text-gray-100">RunStack</h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage and run your Node.js, Deno and Bun projects
              </p>
            </div>
          </div>
        </header>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                <FolderOpen className="size-4" />
                Directory
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedDirectory || ""}
                  readOnly
                  placeholder="Select a directory..."
                  className="w-full px-4 py-2 pl-10 border text-sm border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 placeholder:text-gray-600 focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition-all"
                />
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-600" />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={selectDirectory}
                variant="primary"
                size="md"
                icon={Folder}
                className="whitespace-nowrap"
              >
                Select
              </Button>
              {selectedDirectory && (
                <Button
                  onClick={() => loadProjects(selectedDirectory)}
                  disabled={loading}
                  variant="primary"
                  size="md"
                  icon={loading ? Loader2 : RefreshCw}
                  className={cn("whitespace-nowrap", {
                    "[&>svg]:animate-spin": loading,
                  })}
                >
                  {loading ? "Scanning" : "Rescan"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center size-12 bg-gray-800 rounded-lg mb-4">
              <Loader2 className="size-6 text-gray-500 animate-spin" />
            </div>
            <p className="text-gray-400 font-medium">Scanning projects...</p>
            <p className="text-gray-600 text-sm mt-1">Please wait</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">
                    Projects
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {filteredProjects.length} of {projects.length}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 placeholder:text-gray-600 focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition-all text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-600" />
                  </div>
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant={showFilters ? "primary" : "secondary"}
                    size="md"
                    icon={Filter}
                  >
                    Filters
                  </Button>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sortBy}
                      onChange={(value) => setSortBy(value as SortOption)}
                      placeholder="Sort by..."
                      className="w-45"
                    >
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="modified">Sort by Date</SelectItem>
                      <SelectItem value="size">Sort by Size</SelectItem>
                    </Select>
                    <Button
                      onClick={() => setSortAscending(!sortAscending)}
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
              {filteredProjects.map((project) => {
                const isRunning = runningProjects.has(project.path);
                return (
                  <div
                    key={project.path}
                    className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden transition-colors hover:border-gray-700"
                  >
                    <div
                      className={cn("h-1", getRuntimeTopBar(project.runtime))}
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <i
                              className={cn(
                                "text-2xl text-white",
                                getRuntimeIcon(project.runtime)
                              )}
                            ></i>
                            <h3 className="text-base font-semibold text-gray-100 truncate">
                              {project.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 font-mono truncate">
                            {project.path}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                          <span
                            className={cn("relative flex", {
                              "size-2.5": true,
                            })}
                          >
                            {isRunning && (
                              <span
                                className={cn(
                                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                                  "bg-green-400"
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                "relative inline-flex rounded-full size-2.5",
                                {
                                  "bg-green-500": isRunning,
                                  "bg-gray-700": !isRunning,
                                }
                              )}
                            />
                          </span>
                          <span
                            className={cn("text-xs font-medium", {
                              "text-green-400": isRunning,
                              "text-gray-600": !isRunning,
                            })}
                          >
                            {isRunning ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded text-xs font-medium",
                            getRuntimeColor(project.runtime)
                          )}
                        >
                          {project.runtime}
                        </span>
                        {project.package_manager && (
                          <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                            {project.package_manager}
                          </span>
                        )}
                        {isRunning && project.port ? (
                          <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                            :{project.port}
                          </span>
                        ) : null}
                      </div>

                      {/* Project Information */}
                      <div className="space-y-2 mb-4 text-xs text-gray-500">
                        {project.runtime_version && (
                          <div className="flex items-center gap-2">
                            <Info className="size-3.5" />
                            <span>
                              {project.runtime} {project.runtime_version}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 flex-wrap">
                          {project.modified && (
                            <div className="flex items-center gap-2">
                              <Calendar className="size-3.5" />
                              <span>{formatDate(project.modified)}</span>
                            </div>
                          )}
                          {project.size && (
                            <div className="flex items-center gap-2">
                              <HardDrive className="size-3.5" />
                              <span>{formatFileSize(project.size)}</span>
                            </div>
                          )}
                          {project.scripts &&
                            Object.keys(project.scripts).length > 0 && (
                              <div className="flex items-center gap-2">
                                <Code className="size-3.5" />
                                <span>
                                  {Object.keys(project.scripts).length} scripts
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isRunning ? (
                          <>
                            <Button
                              onClick={() => stopProject(project)}
                              variant="danger"
                              size="sm"
                              icon={Square}
                              fullWidth
                            >
                              Stop
                            </Button>
                            <Button
                              onClick={async () => {
                                const process = processes.get(project.path);
                                if (process?.pid && !project.port) {
                                  // Try to detect the port before opening
                                  try {
                                    const detectedPort = await detectPort(
                                      process.pid,
                                      1,
                                      0,
                                      0
                                    );
                                    if (detectedPort) {
                                      setProjects((prev) =>
                                        prev.map((p) =>
                                          p.path === project.path
                                            ? { ...p, port: detectedPort }
                                            : p
                                        )
                                      );
                                      await openProjectInBrowser(
                                        { ...project, port: detectedPort },
                                        processes
                                      );
                                      return;
                                    }
                                  } catch {
                                    // Port detection failed, will use default port
                                  }
                                }
                                await openProjectInBrowser(project, processes);
                              }}
                              variant="icon"
                              size="sm"
                              icon={ExternalLink}
                              title={
                                project.port
                                  ? `Open in browser (port ${project.port})`
                                  : "Open in browser (detecting port...)"
                              }
                            />
                            <Button
                              onClick={() => setOpenLogsFor(project.path)}
                              variant="icon"
                              size="sm"
                              icon={FileText}
                              title="View logs"
                            />
                            <QuickActionsMenu projectPath={project.path} />
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => runProject(project)}
                              variant="success"
                              size="sm"
                              icon={Play}
                              fullWidth
                            >
                              Run
                            </Button>
                            {getProjectLogs(project.path).length > 0 && (
                              <Button
                                onClick={() => setOpenLogsFor(project.path)}
                                variant="icon"
                                size="sm"
                                icon={FileText}
                                title="View logs"
                              />
                            )}
                            <QuickActionsMenu projectPath={project.path} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && selectedDirectory && projects.length === 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
            <div className="inline-flex items-center justify-center size-12 bg-gray-800 rounded-lg mb-4">
              <FolderOpen className="size-6 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No projects found</p>
            <p className="text-gray-600 text-sm mt-1">Try another directory</p>
          </div>
        )}

        {!selectedDirectory && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
            <div className="inline-flex items-center justify-center size-14 bg-gray-800 rounded-lg mb-6">
              <Folder className="size-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Welcome
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Select a directory to start managing your projects
            </p>
          </div>
        )}

        {/* Logs Modal */}
        {openLogsFor && (
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
        )}
        <Toaster />
      </div>
    </div>
  );
}

export default App;

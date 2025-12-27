import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Folder,
  Play,
  Square,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2,
  FolderOpen,
  Terminal,
  Circle,
} from "lucide-react";
import { useProjects } from "./hooks/useProjects";
import {
  getRuntimeIcon,
  getRuntimeColor,
  getRuntimeTopBar,
} from "./utils/runtime";
import { openProjectInBrowser } from "./services/projectService";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    selectedDirectory,
    setSelectedDirectory,
    projects,
    setProjects,
    loading,
    runningProjects,
    processes,
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
      console.error("Error selecting directory:", error);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-800 rounded-lg">
              <Terminal className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-100">
                Project Manager
              </h1>
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
                <FolderOpen className="w-4 h-4" />
                Directory
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedDirectory || ""}
                  readOnly
                  placeholder="Select a directory..."
                  className="w-full px-4 py-2.5 pl-10 border border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 placeholder:text-gray-600 focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition-all"
                />
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <button
                onClick={selectDirectory}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 flex items-center gap-2 whitespace-nowrap"
              >
                <Folder className="w-4 h-4" />
                Select
              </button>
              {selectedDirectory && (
                <button
                  onClick={() => loadProjects(selectedDirectory)}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Rescan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-800 rounded-lg mb-4">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
            <p className="text-gray-400 font-medium">Scanning projects...</p>
            <p className="text-gray-600 text-sm mt-1">Please wait</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-100">
                  Projects
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {filteredProjects.length} of {projects.length}
                </p>
              </div>
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 placeholder:text-gray-600 focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition-all text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              </div>
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
                      className={`h-1 ${getRuntimeTopBar(project.runtime)}`}
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">
                              {getRuntimeIcon(project.runtime)}
                            </span>
                            <h3 className="text-base font-semibold text-gray-100 truncate">
                              {project.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 font-mono truncate">
                            {project.path}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                          <Circle
                            className={`w-2.5 h-2.5 ${
                              isRunning
                                ? "fill-green-500 text-green-500"
                                : "fill-gray-700 text-gray-700"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              isRunning ? "text-green-400" : "text-gray-600"
                            }`}
                          >
                            {isRunning ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-medium ${getRuntimeColor(
                            project.runtime
                          )}`}
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

                      <div className="flex gap-2">
                        {isRunning ? (
                          <>
                            <button
                              onClick={() => stopProject(project)}
                              className="flex-1 px-3 py-2 bg-red-950/40 hover:bg-red-950/60 text-red-300 text-sm font-medium rounded border border-red-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                              <Square className="w-3.5 h-3.5" />
                              Stop
                            </button>
                            <button
                              onClick={async () => {
                                const process = processes.get(project.path);
                                if (process?.pid && !project.port) {
                                  // Try to detect the port before opening
                                  try {
                                    const { detectPort } = await import(
                                      "./services/projectService"
                                    );
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
                                  } catch (error) {
                                    console.error(
                                      "Error detecting port:",
                                      error
                                    );
                                  }
                                }
                                await openProjectInBrowser(project, processes);
                              }}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded border border-gray-700 transition-colors flex items-center gap-2"
                              title={
                                project.port
                                  ? `Open in browser (port ${project.port})`
                                  : "Open in browser (detecting port...)"
                              }
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => runProject(project)}
                            className="flex-1 px-3 py-2 bg-green-950/40 hover:bg-green-950/60 text-green-300 text-sm font-medium rounded border border-green-900/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Run
                          </button>
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
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-800 rounded-lg mb-4">
              <FolderOpen className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No projects found</p>
            <p className="text-gray-600 text-sm mt-1">Try another directory</p>
          </div>
        )}

        {!selectedDirectory && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-800 rounded-lg mb-6">
              <Folder className="w-7 h-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Welcome
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Select a directory to start managing your projects
            </p>
            <button
              onClick={selectDirectory}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors border border-gray-700 inline-flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Select Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

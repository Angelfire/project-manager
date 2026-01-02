import { memo, useCallback } from "react";
import { Child } from "@tauri-apps/plugin-shell";
import { cn } from "@/utils/cn";
import {
  Play,
  Square,
  ExternalLink,
  FileText,
  Info,
  Calendar,
  HardDrive,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import {
  getRuntimeIcon,
  getRuntimeColor,
  getRuntimeTopBar,
} from "@/utils/runtime";
import { formatFileSize, formatDate } from "@/utils/format";
import { openProjectInBrowser, detectPort } from "@/services/projectService";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  isRunning: boolean;
  processes: Map<string, Child>;
  getProjectLogs: (projectPath: string) => Array<{ id: string }>;
  onRun: (project: Project) => void;
  onStop: (project: Project) => void;
  onOpenLogs: (projectPath: string) => void;
  onUpdateProject: (updater: (prev: Project[]) => Project[]) => void;
}

export const ProjectCard = memo(function ProjectCard({
  project,
  isRunning,
  processes,
  getProjectLogs,
  onRun,
  onStop,
  onOpenLogs,
  onUpdateProject,
}: ProjectCardProps) {
  const handleOpenInBrowser = useCallback(async () => {
    const process = processes.get(project.path);
    if (process?.pid && !project.port) {
      // Try to detect the port before opening
      try {
        const detectedPort = await detectPort(process.pid, 1, 0, 0);
        if (detectedPort) {
          onUpdateProject((prev) =>
            prev.map((p) =>
              p.path === project.path ? { ...p, port: detectedPort } : p
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
  }, [project, processes, onUpdateProject]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden transition-colors hover:border-gray-700">
      <div className={cn("h-1", getRuntimeTopBar(project.runtime))} />
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
            <span className={cn("relative flex", { "size-2.5": true })}>
              {isRunning && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    "bg-green-400"
                  )}
                />
              )}
              <span
                className={cn("relative inline-flex rounded-full size-2.5", {
                  "bg-green-500": isRunning,
                  "bg-gray-700": !isRunning,
                })}
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
            {project.scripts && Object.keys(project.scripts).length > 0 && (
              <div className="flex items-center gap-2">
                <Code className="size-3.5" />
                <span>{Object.keys(project.scripts).length} scripts</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isRunning ? (
            <>
              <Button
                onClick={() => onStop(project)}
                variant="danger"
                size="sm"
                icon={Square}
                fullWidth
              >
                Stop
              </Button>
              <Button
                onClick={handleOpenInBrowser}
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
                onClick={() => onOpenLogs(project.path)}
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
                onClick={() => onRun(project)}
                variant="success"
                size="sm"
                icon={Play}
                fullWidth
              >
                Run
              </Button>
              {getProjectLogs(project.path).length > 0 && (
                <Button
                  onClick={() => onOpenLogs(project.path)}
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
});

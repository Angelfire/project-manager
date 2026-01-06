import { memo, useCallback } from "react";
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
import { openProjectInBrowser } from "@/services/projectService";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  isRunning: boolean;
  getProjectLogs: (projectPath: string) => Array<{ id: string }>;
  onRun: (project: Project) => void;
  onStop: (project: Project) => void;
  onOpenLogs: (projectPath: string) => void;
}

export const ProjectCard = memo(function ProjectCard({
  project,
  isRunning,
  getProjectLogs,
  onRun,
  onStop,
  onOpenLogs,
}: ProjectCardProps) {
  const handleOpenInBrowser = useCallback(async () => {
    await openProjectInBrowser(project);
  }, [project]);

  return (
    <article
      className="bg-card rounded-lg border border-border overflow-hidden transition-colors duration-150 ease-out hover:border-accent"
      aria-labelledby={`project-${project.path.replace(/\//g, "-")}-name`}
    >
      <div
        className={cn("h-1", getRuntimeTopBar(project.runtime))}
        aria-hidden="true"
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <i
                className={cn(
                  "text-2xl text-foreground",
                  getRuntimeIcon(project.runtime)
                )}
                aria-hidden="true"
              ></i>
              <h3
                id={`project-${project.path.replace(/\//g, "-")}-name`}
                className="text-base font-semibold text-card-foreground truncate"
              >
                {project.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {project.path}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <span
              className={cn("relative flex", { "size-2.5": true })}
              aria-hidden="true"
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
                className={cn("relative inline-flex rounded-full size-2.5", {
                  "bg-green-400": isRunning,
                  "bg-gray-400": !isRunning,
                })}
              />
            </span>
            <span
              className={cn("text-xs font-medium", {
                "text-green-500": isRunning,
                "text-muted-foreground": !isRunning,
              })}
              aria-label={`Status: ${isRunning ? "Active" : "Inactive"}`}
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
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
              {project.package_manager}
            </span>
          )}
          {isRunning && project.port ? (
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
              :{project.port}
            </span>
          ) : null}
        </div>

        <div className="space-y-2 mb-4 text-xs text-muted-foreground">
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

        <div
          className="flex gap-2"
          role="group"
          aria-label={`Actions for ${project.name}`}
        >
          {isRunning ? (
            <>
              <Button
                onClick={() => onStop(project)}
                variant="danger"
                size="sm"
                icon={Square}
                fullWidth
                aria-label={`Stop ${project.name}`}
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
                aria-label={
                  project.port
                    ? `Open ${project.name} in browser on port ${project.port}`
                    : `Open ${project.name} in browser (detecting port...)`
                }
              />
              <Button
                onClick={() => onOpenLogs(project.path)}
                variant="icon"
                size="sm"
                icon={FileText}
                title="View logs"
                aria-label={`View logs for ${project.name}`}
              />
              <QuickActionsMenu projectPath={project.path} />
            </>
          ) : (
            <>
              <Button
                onClick={() => onRun(project)}
                variant="primary"
                size="sm"
                icon={Play}
                fullWidth
                aria-label={`Run ${project.name}`}
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
                  aria-label={`View logs for ${project.name}`}
                />
              )}
              <QuickActionsMenu projectPath={project.path} />
            </>
          )}
        </div>
      </div>
    </article>
  );
});

import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Trash2, Download } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { LogEntry } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";
import { toastError, toastInfo, toastSuccess } from "@/utils/toast";

interface ProjectLogsProps {
  projectName: string;
  projectPath: string;
  logs: LogEntry[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const ProjectLogs = memo(function ProjectLogs({
  projectName,
  projectPath,
  logs,
  isOpen,
  onClose,
  onClear,
}: ProjectLogsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        logsContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) =>
        log.content.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [logs, searchTerm]
  );

  const formatTimestamp = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }, []);

  const exportLogs = useCallback(async () => {
    try {
      if (logs.length === 0) {
        toastInfo("No logs to export");
        return;
      }

      const logText = logs
        .map(
          (log) =>
            `[${formatTimestamp(log.timestamp)}] [${log.type.toUpperCase()}] ${
              log.content
            }`
        )
        .join("\n");

      // Sanitize project name for filename
      const sanitizedName = projectName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const fileName = `${sanitizedName}-logs-${Date.now()}.txt`;

      const filePath = await save({
        defaultPath: fileName,
        filters: [
          {
            name: "Text Files",
            extensions: ["txt"],
          },
        ],
      });

      if (filePath) {
        await writeTextFile(filePath, logText);
        const exportedFileName = filePath.split(/[\\/]/).pop() ?? filePath;
        toastSuccess(
          "Logs exported successfully",
          `Saved as ${exportedFileName}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toastError(
        "Failed to export logs",
        errorMessage.includes("Permission") || errorMessage.includes("denied")
          ? "Permission denied. Please check file system permissions."
          : errorMessage.includes("not found") ||
              errorMessage.includes("No such file")
            ? "Export location not found. Please check the path."
            : `Unable to export logs: ${errorMessage}`
      );
    }
  }, [logs, projectName, formatTimestamp]);

  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="xl" className="h-[80vh]">
        <div className="sticky top-0 z-10 bg-card">
          <DialogHeader hasCloseButtonPadding>
            <div>
              <DialogTitle>{`Logs: ${projectName}`}</DialogTitle>
              <DialogDescription className="text-xs font-mono mt-1 truncate">
                {projectPath}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportLogs}
                variant="ghost"
                size="sm"
                icon={Download}
                className="p-2"
                title="Export logs"
              />
              <Button
                onClick={onClear}
                variant="ghost"
                size="sm"
                icon={Trash2}
                className="p-2 hover:text-red-400"
                title="Clear logs"
              />
            </div>
          </DialogHeader>
          <div className="p-4 border-b border-border bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border text-sm transition-colors duration-150 ease-out"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredLogs.length} of {logs.length} log entries
              </span>
              {!autoScroll && (
                <button
                  onClick={() => {
                    setAutoScroll(true);
                    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-chart-2 hover:text-chart-1 transition-colors duration-150 ease-out"
                >
                  Scroll to bottom
                </button>
              )}
            </div>
          </div>
        </div>
        <div
          ref={logsContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs min-h-0"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? "No logs match your search" : "No logs yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn("flex gap-2", {
                    "text-destructive": log.type === "stderr",
                    "text-foreground": log.type === "stdout",
                  })}
                >
                  <span className="text-muted-foreground shrink-0">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                  <span
                    className={cn("shrink-0", {
                      "text-destructive": log.type === "stderr",
                      "text-foreground": log.type === "stdout",
                    })}
                  >
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="flex-1 wrap-break-words whitespace-pre-wrap">
                    {log.content}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
});

import { memo, useCallback } from "react";
import {
  MoreVertical,
  FileCode,
  Terminal,
  FolderOpen,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toastError, toastSuccess } from "@/utils/toast";
import { tauriApi } from "@/api/tauri";

interface QuickActionsMenuProps {
  projectPath: string;
}

export const QuickActionsMenu = memo(function QuickActionsMenu({
  projectPath,
}: QuickActionsMenuProps) {
  const handleOpenInEditor = useCallback(async () => {
    try {
      await tauriApi.quickActions.openInEditor(projectPath);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toastError(
        "Failed to open in editor",
        errorMessage.includes("not found") ||
          errorMessage.includes("Editor not found")
          ? "Editor not found. Please install VS Code or configure your default editor."
          : errorMessage.includes("Permission")
            ? "Permission denied. Please check file permissions."
            : `Unable to open editor: ${errorMessage}`
      );
    }
  }, [projectPath]);

  const handleOpenInTerminal = useCallback(async () => {
    try {
      await tauriApi.quickActions.openInTerminal(projectPath);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toastError(
        "Failed to open in terminal",
        errorMessage.includes("not found") ||
          errorMessage.includes("Terminal not found")
          ? "Terminal not found. Please configure your default terminal application."
          : errorMessage.includes("Permission")
            ? "Permission denied. Please check file permissions."
            : `Unable to open terminal: ${errorMessage}`
      );
    }
  }, [projectPath]);

  const handleOpenInFileManager = useCallback(async () => {
    try {
      await tauriApi.quickActions.openInFileManager(projectPath);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toastError(
        "Failed to open in file manager",
        errorMessage.includes("not found") ||
          errorMessage.includes("File manager not found")
          ? "File manager not found. Please check your system configuration."
          : errorMessage.includes("Permission")
            ? "Permission denied. Please check file permissions."
            : `Unable to open file manager: ${errorMessage}`
      );
    }
  }, [projectPath]);

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectPath);
      toastSuccess("Path copied to clipboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toastError(
        "Failed to copy path",
        errorMessage.includes("Permission") || errorMessage.includes("denied")
          ? "Clipboard access denied. Please check browser permissions."
          : `Unable to copy path: ${errorMessage}`
      );
    }
  }, [projectPath]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="icon"
          size="sm"
          icon={MoreVertical}
          className="shrink-0"
          title="Quick actions"
          aria-label="Open quick actions menu"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleOpenInEditor}>
          <FileCode className="size-4" />
          Open in Editor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenInTerminal}>
          <Terminal className="size-4" />
          Open in Terminal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenInFileManager}>
          <FolderOpen className="size-4" />
          Open in File Manager
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyPath}>
          <Copy className="size-4" />
          Copy Path
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

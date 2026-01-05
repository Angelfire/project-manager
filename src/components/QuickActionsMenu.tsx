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
      toastError("Failed to open in editor", String(error));
    }
  }, [projectPath]);

  const handleOpenInTerminal = useCallback(async () => {
    try {
      await tauriApi.quickActions.openInTerminal(projectPath);
    } catch (error) {
      toastError("Failed to open in terminal", String(error));
    }
  }, [projectPath]);

  const handleOpenInFileManager = useCallback(async () => {
    try {
      await tauriApi.quickActions.openInFileManager(projectPath);
    } catch (error) {
      toastError("Failed to open in file manager", String(error));
    }
  }, [projectPath]);

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectPath);
      toastSuccess("Path copied to clipboard");
    } catch (error) {
      toastError("Failed to copy path", String(error));
    }
  }, [projectPath]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="icon"
          size="sm"
          icon={MoreVertical}
          className="px-2 py-3"
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

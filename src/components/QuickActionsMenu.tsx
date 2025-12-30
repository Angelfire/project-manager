import { memo, useCallback } from "react";
import {
  MoreVertical,
  FileCode,
  Terminal,
  FolderOpen,
  Copy,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toastError, toastSuccess } from "@/utils/toast";

interface QuickActionsMenuProps {
  projectPath: string;
}

export const QuickActionsMenu = memo(function QuickActionsMenu({
  projectPath,
}: QuickActionsMenuProps) {
  const handleOpenInEditor = useCallback(async () => {
    try {
      await invoke("open_in_editor", { path: projectPath });
    } catch (error) {
      toastError("Failed to open in editor", String(error));
    }
  }, [projectPath]);

  const handleOpenInTerminal = useCallback(async () => {
    try {
      await invoke("open_in_terminal", { path: projectPath });
    } catch (error) {
      toastError("Failed to open in terminal", String(error));
    }
  }, [projectPath]);

  const handleOpenInFinder = useCallback(async () => {
    try {
      await invoke("open_in_finder", { path: projectPath });
    } catch (error) {
      toastError("Failed to open in Finder", String(error));
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
        <DropdownMenuItem onClick={handleOpenInFinder}>
          <FolderOpen className="size-4" />
          Open in Finder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyPath}>
          <Copy className="size-4" />
          Copy Path
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

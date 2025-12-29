import {
  MoreVertical,
  FileCode,
  Terminal,
  FolderOpen,
  Copy,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toastError, toastSuccess } from "../utils/toast";

interface QuickActionsMenuProps {
  projectPath: string;
}

export function QuickActionsMenu({ projectPath }: QuickActionsMenuProps) {
  const handleOpenInEditor = async () => {
    try {
      await invoke("open_in_editor", { path: projectPath });
    } catch (error) {
      console.error("Error opening in editor:", error);
      toastError("Failed to open in editor", String(error));
    }
  };

  const handleOpenInTerminal = async () => {
    try {
      await invoke("open_in_terminal", { path: projectPath });
    } catch (error) {
      console.error("Error opening in terminal:", error);
      toastError("Failed to open in terminal", String(error));
    }
  };

  const handleOpenInFinder = async () => {
    try {
      await invoke("open_in_finder", { path: projectPath });
    } catch (error) {
      console.error("Error opening in Finder:", error);
      toastError("Failed to open in Finder", String(error));
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(projectPath);
      toastSuccess("Path copied to clipboard");
    } catch (error) {
      console.error("Error copying path:", error);
      toastError("Failed to copy path", String(error));
    }
  };

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
}

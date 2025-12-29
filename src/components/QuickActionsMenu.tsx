import { useState, useEffect } from "react";
import {
  MoreVertical,
  FileCode,
  Terminal,
  FolderOpen,
  Copy,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/Button";

interface QuickActionsMenuProps {
  projectPath: string;
}

export function QuickActionsMenu({ projectPath }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenInEditor = async () => {
    try {
      await invoke("open_in_editor", { path: projectPath });
      setIsOpen(false);
    } catch (error) {
      console.error("Error opening in editor:", error);
      alert("Failed to open in editor: " + error);
    }
  };

  const handleOpenInTerminal = async () => {
    try {
      await invoke("open_in_terminal", { path: projectPath });
      setIsOpen(false);
    } catch (error) {
      console.error("Error opening in terminal:", error);
      alert("Failed to open in terminal: " + error);
    }
  };

  const handleOpenInFinder = async () => {
    try {
      await invoke("open_in_finder", { path: projectPath });
      setIsOpen(false);
    } catch (error) {
      console.error("Error opening in Finder:", error);
      alert("Failed to open in Finder: " + error);
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(projectPath);
      setIsOpen(false);
    } catch (error) {
      console.error("Error copying path:", error);
      alert("Failed to copy path: " + error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest(".quick-actions-menu")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative quick-actions-menu">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="icon"
        size="sm"
        icon={MoreVertical}
        className="px-2 py-3"
        title="Quick actions"
      />
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 quick-actions-menu">
          <button
            onClick={handleOpenInEditor}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 rounded-t-lg transition-colors"
          >
            <FileCode className="size-4" />
            Open in Editor
          </button>
          <button
            onClick={handleOpenInTerminal}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <Terminal className="size-4" />
            Open in Terminal
          </button>
          <button
            onClick={handleOpenInFinder}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <FolderOpen className="size-4" />
            Open in Finder
          </button>
          <button
            onClick={handleCopyPath}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg transition-colors"
          >
            <Copy className="size-4" />
            Copy Path
          </button>
        </div>
      )}
    </div>
  );
}

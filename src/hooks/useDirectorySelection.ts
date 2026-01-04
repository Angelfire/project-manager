import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { toastError } from "@/utils/toast";

interface UseDirectorySelectionProps {
  onDirectorySelected: (path: string) => void;
}

interface UseDirectorySelectionReturn {
  selectDirectory: () => Promise<void>;
}

/**
 * Custom hook for handling directory selection dialog.
 *
 * @param props - Hook configuration
 * @param props.onDirectorySelected - Callback when a directory is selected
 * @returns Function to open directory selection dialog
 *
 * @example
 * ```tsx
 * const { selectDirectory } = useDirectorySelection({
 *   onDirectorySelected: (path) => {
 *     setSelectedDirectory(path);
 *     loadProjects(path);
 *   }
 * });
 * ```
 */
export function useDirectorySelection({
  onDirectorySelected,
}: UseDirectorySelectionProps): UseDirectorySelectionReturn {
  const selectDirectory = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select directory",
      });

      if (selected && typeof selected === "string") {
        onDirectorySelected(selected);
      }
    } catch (error) {
      toastError("Error selecting directory", String(error));
    }
  }, [onDirectorySelected]);

  return { selectDirectory };
}

import { memo } from "react";
import { Folder, FolderOpen, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface DirectorySelectorProps {
  selectedDirectory: string | null;
  loading: boolean;
  onSelect: () => void;
  onRescan: () => void;
}

export const DirectorySelector = memo(function DirectorySelector({
  selectedDirectory,
  loading,
  onSelect,
  onRescan,
}: DirectorySelectorProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            <FolderOpen className="size-4" />
            Directory
          </label>
          <div className="relative">
            <input
              type="text"
              value={selectedDirectory || ""}
              readOnly
              placeholder="Select a directory..."
              className="w-full py-2.5 px-4 pl-10 border text-sm leading-none border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border transition-colors duration-150 ease-out"
            />
            <Folder className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <Button
            onClick={onSelect}
            variant="primary"
            size="md"
            icon={Folder}
            className="whitespace-nowrap"
          >
            Select
          </Button>
          {selectedDirectory && (
            <Button
              onClick={onRescan}
              disabled={loading}
              variant="primary"
              size="md"
              icon={loading ? Loader2 : RefreshCw}
              className={cn("whitespace-nowrap", {
                "[&>svg]:animate-spin": loading,
              })}
            >
              {loading ? "Scanning" : "Rescan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

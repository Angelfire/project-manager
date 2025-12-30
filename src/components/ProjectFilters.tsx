import { memo, useCallback } from "react";
import { Select, SelectItem } from "@/components/ui/select";

export type FilterOption = {
  runtime: string | null;
  framework: string | null;
  status: "all" | "running" | "stopped";
};

interface ProjectFiltersProps {
  filters: FilterOption;
  onFiltersChange: (filters: FilterOption) => void;
  uniqueRuntimes: string[];
  uniqueFrameworks: string[];
}

export const ProjectFilters = memo(function ProjectFilters({
  filters,
  onFiltersChange,
  uniqueRuntimes,
  uniqueFrameworks,
}: ProjectFiltersProps) {
  // Memoize callbacks at component level, not inline in JSX
  const handleRuntimeChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        runtime: value === "__all__" ? null : value,
      });
    },
    [filters, onFiltersChange]
  );

  const handleFrameworkChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        framework: value === "__all__" ? null : value,
      });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value as FilterOption["status"],
      });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Runtime
          </label>
          <Select
            value={filters.runtime || "__all__"}
            onChange={handleRuntimeChange}
            placeholder="All Runtimes"
          >
            <SelectItem value="__all__">All Runtimes</SelectItem>
            {uniqueRuntimes.map((runtime) => (
              <SelectItem key={runtime} value={runtime}>
                {runtime}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Framework
          </label>
          <Select
            value={filters.framework || "__all__"}
            onChange={handleFrameworkChange}
            placeholder="All Frameworks"
          >
            <SelectItem value="__all__">All Frameworks</SelectItem>
            {uniqueFrameworks.map((framework) => (
              <SelectItem key={framework} value={framework}>
                {framework}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Status
          </label>
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            placeholder="All Status"
          >
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
          </Select>
        </div>
      </div>
    </div>
  );
});

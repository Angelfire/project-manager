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

export function ProjectFilters({
  filters,
  onFiltersChange,
  uniqueRuntimes,
  uniqueFrameworks,
}: ProjectFiltersProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Runtime
          </label>
          <select
            value={filters.runtime || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                runtime: e.target.value || null,
              })
            }
            className="w-full px-3 py-2 border border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 text-sm focus:ring-1 focus:ring-gray-700 focus:border-gray-700"
          >
            <option value="">All Runtimes</option>
            {uniqueRuntimes.map((runtime) => (
              <option key={runtime} value={runtime}>
                {runtime}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Framework
          </label>
          <select
            value={filters.framework || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                framework: e.target.value || null,
              })
            }
            className="w-full px-3 py-2 border border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 text-sm focus:ring-1 focus:ring-gray-700 focus:border-gray-700"
          >
            <option value="">All Frameworks</option>
            {uniqueFrameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as FilterOption["status"],
              })
            }
            className="w-full px-3 py-2 border border-gray-800 rounded-lg bg-gray-800/50 text-gray-300 text-sm focus:ring-1 focus:ring-gray-700 focus:border-gray-700"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      </div>
    </div>
  );
}

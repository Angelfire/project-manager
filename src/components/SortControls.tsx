import { ArrowUpDown } from "lucide-react";
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type SortOption = "name" | "modified" | "size";

interface SortControlsProps {
  sortBy: SortOption;
  sortAscending: boolean;
  onSortChange: (value: SortOption) => void;
  onSortDirectionToggle: () => void;
}

/**
 * Sort controls component for project list sorting.
 *
 * @param props - SortControls component props
 * @param props.sortBy - Current sort field
 * @param props.sortAscending - Whether sorting is ascending
 * @param props.onSortChange - Callback when sort field changes
 * @param props.onSortDirectionToggle - Callback to toggle sort direction
 *
 * @component
 */
export function SortControls({
  sortBy,
  sortAscending,
  onSortChange,
  onSortDirectionToggle,
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={sortBy}
        onChange={(value) => onSortChange(value as SortOption)}
        placeholder="Sort by..."
        className="w-45"
      >
        <SelectItem value="name">Sort by Name</SelectItem>
        <SelectItem value="modified">Sort by Date</SelectItem>
        <SelectItem value="size">Sort by Size</SelectItem>
      </Select>
      <Button
        onClick={onSortDirectionToggle}
        variant="ghost"
        size="sm"
        icon={ArrowUpDown}
        className="p-2"
        title={sortAscending ? "Ascending" : "Descending"}
      />
    </div>
  );
}

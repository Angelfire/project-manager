import { useState, useCallback } from "react";

export type SortOption = "name" | "modified" | "size";

interface UseSortReturn {
  sortBy: SortOption;
  sortAscending: boolean;
  setSortBy: (value: SortOption) => void;
  toggleSortDirection: () => void;
  handleSortChange: (value: string) => void;
}

/**
 * Custom hook for managing sort state and handlers.
 *
 * @param defaultSortBy - Initial sort field (default: "name")
 * @param defaultAscending - Initial sort direction (default: true)
 * @returns Sort state and handler functions
 *
 * @example
 * ```tsx
 * const { sortBy, sortAscending, handleSortChange, toggleSortDirection } = useSort();
 * ```
 */
export function useSort(
  defaultSortBy: SortOption = "name",
  defaultAscending = true
): UseSortReturn {
  const [sortBy, setSortBy] = useState<SortOption>(defaultSortBy);
  const [sortAscending, setSortAscending] = useState(defaultAscending);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as SortOption);
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortAscending((prev) => !prev);
  }, []);

  return {
    sortBy,
    sortAscending,
    setSortBy,
    toggleSortDirection,
    handleSortChange,
  };
}

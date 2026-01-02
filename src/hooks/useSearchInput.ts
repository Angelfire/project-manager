import { useState, useCallback } from "react";
import { validateSearchTerm } from "@/utils/validation";

interface UseSearchInputReturn {
  searchTerm: string;
  searchError: string | null;
  handleChange: (value: string) => void;
  setSearchTerm: (value: string) => void;
}

/**
 * Custom hook for managing search input with validation
 * @returns Object containing searchTerm, searchError, and handlers
 */
export function useSearchInput(): UseSearchInputReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleChange = useCallback((value: string) => {
    // Clear any previous error message
    setSearchError(null);

    // Allow clearing the search field (empty string)
    if (value === "") {
      setSearchTerm("");
      return;
    }

    // Validate and sanitize non-empty values
    const validated = validateSearchTerm(value);

    if (validated === null) {
      // Validation failed: show feedback and keep previous valid value
      setSearchError(
        'Your search contains unsupported characters (e.g., <, >, "). Please remove them and try again.'
      );
      return;
    } else if (validated !== value) {
      // Validation sanitized the input: show warning and update
      setSearchError(
        'Your search contained unsupported characters (e.g., <, >, "), which were removed.'
      );
      setSearchTerm(validated);
    } else {
      // Valid input, clear any previous error and update normally
      setSearchError(null);
      setSearchTerm(validated);
    }
  }, []);

  return {
    searchTerm,
    searchError,
    handleChange,
    setSearchTerm,
  };
}

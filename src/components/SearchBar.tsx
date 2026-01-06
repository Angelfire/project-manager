import { Search } from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Search input component with icon and error display.
 *
 * @param props - SearchBar component props
 * @param props.value - Current search value
 * @param props.onChange - Callback when search value changes
 * @param props.error - Optional error message to display
 * @param props.placeholder - Placeholder text (default: "Search...")
 * @param props.maxLength - Maximum input length (default: 500)
 *
 * @component
 */
export function SearchBar({
  value,
  onChange,
  error,
  placeholder = "Search...",
  maxLength = 500,
}: SearchBarProps) {
  const errorId = error ? "search-error" : undefined;

  return (
    <div className="flex-1 sm:w-56">
      <div className="relative">
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <input
          id="project-search"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          aria-describedby={errorId}
          aria-invalid={!!error}
          className={cn(
            "w-full py-2 px-4 pl-10 border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:border-border transition-colors duration-150 ease-out text-sm leading-none",
            error
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-ring"
          )}
        />
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

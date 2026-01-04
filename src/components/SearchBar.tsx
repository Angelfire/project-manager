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
  return (
    <div className="flex-1 sm:w-56">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className={cn(
            "w-full py-2.5 px-4 pl-10 border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:border-border transition-all text-sm leading-none",
            error
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-ring"
          )}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

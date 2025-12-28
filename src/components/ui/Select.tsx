import {
  Children,
  isValidElement,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../utils/cn";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
}

export function Select({
  value,
  onChange,
  placeholder = "Select...",
  children,
  className = "",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
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

  const selectedLabel = Children.toArray(children)
    .filter((child) => {
      if (
        isValidElement<SelectItemProps>(child) &&
        child.props.value === value
      ) {
        return true;
      }
      return false;
    })
    .map((child) => {
      if (isValidElement<SelectItemProps>(child)) {
        return child.props.children;
      }
      return null;
    })[0];

  const handleSelect = (itemValue: string) => {
    onChange(itemValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-md border border-gray-800 bg-gray-800/50 text-gray-300 text-sm font-medium transition-colors hover:bg-gray-800 hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <span
          className={cn({
            "text-gray-100": selectedLabel,
            "text-gray-500": !selectedLabel,
          })}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-75 overflow-auto">
          <div className="p-1">
            {Children.map(children, (child) => {
              if (isValidElement<SelectItemProps>(child)) {
                const isSelected = child.props.value === value;
                return (
                  <div
                    key={child.props.value}
                    onClick={() => handleSelect(child.props.value)}
                    className={cn(
                      "relative flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer select-none outline-none transition-colors",
                      {
                        "bg-gray-700 text-gray-100": isSelected,
                        "text-gray-300 hover:bg-gray-700/50 hover:text-gray-100":
                          !isSelected,
                      }
                    )}
                  >
                    {isSelected && (
                      <Check className="mr-2 h-4 w-4 text-gray-100" />
                    )}
                    <span className={cn({ "ml-0": isSelected, "ml-6": !isSelected })}>
                      {child.props.children}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SelectItem({ children }: SelectItemProps) {
  return <>{children}</>;
}

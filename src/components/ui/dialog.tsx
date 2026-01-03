import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  headerActions?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full",
};

export function Dialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  showCloseButton = true,
  headerActions,
  size = "md",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is on the overlay (not on the dialog content)
      if (
        overlayRef.current &&
        dialogRef.current &&
        event.target === overlayRef.current
      ) {
        onClose();
      }
    };

    // Use mousedown to catch the click before it bubbles
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      data-testid="dialog-overlay"
    >
      <div
        ref={dialogRef}
        data-testid="dialog-content"
        className={cn(
          "bg-gray-900 rounded-lg border border-gray-800 w-full flex flex-col shadow-xl",
          sizeClasses[size],
          className
        )}
        onClick={(e) => {
          // Prevent closing when clicking inside the dialog
          e.stopPropagation();
        }}
      >
        {(title || subtitle || showCloseButton || headerActions) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            {(title || subtitle) && (
              <div>
                {title && (
                  <h2
                    id="dialog-title"
                    className="text-lg font-semibold text-gray-100"
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-500 font-mono mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              {headerActions}
              {showCloseButton && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  icon={X}
                  className="p-2"
                  aria-label="Close dialog"
                />
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

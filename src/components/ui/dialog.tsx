import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const DialogRoot = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

// Exported for programmatic dialog control by consumers.
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-testid="dialog-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full",
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
  }
>(
  (
    { className, children, size = "md", showCloseButton = true, ...props },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-testid="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg border border-border flex flex-col shadow-xl p-0 overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "focus:outline-none",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              className="absolute right-4 top-4 p-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary z-10"
              aria-label="Close dialog"
            />
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  hasCloseButtonPadding?: boolean;
}

const DialogHeader = ({
  className,
  hasCloseButtonPadding = false,
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn(
      hasCloseButtonPadding
        ? "flex flex-row items-center justify-between p-4 pt-14 border-b border-border pr-2"
        : "flex flex-col space-y-1.5 text-center sm:text-left p-4 border-b border-border",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// High-level component for backward compatibility
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // Required for accessibility
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  headerActions?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

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
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <DialogContent
        size={size}
        showCloseButton={showCloseButton}
        className={className}
        {...(!subtitle && { "aria-describedby": undefined })}
      >
        <DialogHeader hasCloseButtonPadding={showCloseButton}>
          <div>
            <DialogTitle>{title}</DialogTitle>
            {subtitle && (
              <DialogDescription className="text-xs font-mono mt-1 truncate">
                {subtitle}
              </DialogDescription>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-hidden">{children}</div>
      </DialogContent>
    </DialogRoot>
  );
}

export {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

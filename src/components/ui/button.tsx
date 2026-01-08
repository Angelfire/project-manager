import { ButtonHTMLAttributes, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "ghost"
  | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20",
  secondary:
    "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border",
  success:
    "bg-success-muted hover:bg-success text-success-foreground border border-success-border",
  danger:
    "bg-destructive/40 hover:bg-destructive/60 text-destructive-foreground border border-destructive/50",
  ghost:
    "bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground",
  icon: "bg-secondary hover:bg-accent text-foreground border border-border",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2 px-3 text-sm leading-none has-[>svg]:px-2.5",
  md: "py-2.5 px-4 text-sm leading-none has-[>svg]:px-3",
  lg: "py-3 px-6 text-base leading-none has-[>svg]:px-4",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  children,
  className = "",
  disabled,
  "aria-label": ariaLabelProp,
  title,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-colors duration-200 ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  );

  // Special handling for icon-only buttons
  const isIconOnly = variant === "icon" && !children && Icon;

  // For icon-only buttons without aria-label, use title as aria-label
  // Explicit aria-label prop takes precedence, then fallback to title for icon-only buttons
  const ariaLabel = ariaLabelProp || (isIconOnly && title ? title : undefined);

  const combinedClassName = cn(
    baseStyles,
    variantStyles[variant],
    {
      "p-2.5": isIconOnly && size === "md",
      "p-2": isIconOnly && size === "sm",
      "p-3": isIconOnly && size === "lg",
      [sizeStyles[size]]: !isIconOnly && variant !== "icon",
    },
    {
      "flex-1 w-full": fullWidth,
    },
    className
  );

  return (
    <button
      {...props}
      className={combinedClassName}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {Icon && iconPosition === "left" && (
        <Icon className={iconSizeStyles[size]} aria-hidden="true" />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon className={iconSizeStyles[size]} aria-hidden="true" />
      )}
    </button>
  );
}

export { Button };

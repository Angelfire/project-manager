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
  primary: "bg-secondary hover:bg-accent text-foreground border border-border",
  secondary:
    "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border",
  success:
    "bg-success-muted hover:bg-success/60 text-success-foreground border border-success-border",
  danger:
    "bg-destructive/40 hover:bg-destructive/60 text-destructive-foreground border border-destructive/50",
  ghost:
    "bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground",
  icon: "bg-secondary hover:bg-accent text-foreground border border-border",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2 px-3 text-sm leading-none has-[>svg]:px-2.5",
  md: "py-[10px] px-4 text-sm leading-none has-[>svg]:px-3",
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
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  );

  // Special handling for icon-only buttons
  const isIconOnly = variant === "icon" && !children && Icon;

  const combinedClassName = cn(
    baseStyles,
    variantStyles[variant],
    {
      "p-[9px]": isIconOnly && size === "md",
      "p-2": isIconOnly && size === "sm",
      "p-2.5": isIconOnly && size === "lg",
      [sizeStyles[size]]: !isIconOnly && variant !== "icon",
    },
    {
      "flex-1 w-full": fullWidth,
    },
    className
  );

  return (
    <button className={combinedClassName} disabled={disabled} {...props}>
      {Icon && iconPosition === "left" && (
        <Icon className={iconSizeStyles[size]} />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon className={iconSizeStyles[size]} />
      )}
    </button>
  );
}

export { Button };

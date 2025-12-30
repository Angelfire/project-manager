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
  primary: "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700",
  secondary:
    "bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-gray-300 border border-gray-800",
  success:
    "bg-green-950/40 hover:bg-green-950/60 text-green-300 border border-green-900/30",
  danger:
    "bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-900/30",
  ghost: "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-300",
  icon: "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm has-[>svg]:px-2.5",
  md: "h-9 px-4 text-sm has-[>svg]:px-3",
  lg: "h-10 px-6 text-base has-[>svg]:px-4",
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
    "outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  );

  // Special handling for icon-only buttons
  const isIconOnly = variant === "icon" && !children && Icon;

  const combinedClassName = cn(
    baseStyles,
    variantStyles[variant],
    {
      "size-9": isIconOnly && size === "md",
      "size-8": isIconOnly && size === "sm",
      "size-10": isIconOnly && size === "lg",
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

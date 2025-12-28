import { ButtonHTMLAttributes, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

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
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

export function Button({
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
  const baseStyles =
    "font-medium rounded-lg transition-colors flex items-center justify-center gap-2";

  // Special handling for icon-only buttons
  const isIconOnly = variant === "icon" && !children && Icon;

  const combinedClassName = cn(
    baseStyles,
    variantStyles[variant],
    {
      "p-2": isIconOnly,
      "p-3": variant === "icon" && children,
      [sizeStyles[size]]: !isIconOnly && variant !== "icon",
    },
    {
      "opacity-50 cursor-not-allowed": disabled,
      "flex-1 w-full": fullWidth,
    },
    className
  );

  return (
    <button className={combinedClassName} disabled={disabled} {...props}>
      {Icon && iconPosition === "left" && (
        <Icon className={iconSizeStyles[size]} />
      )}
      {children && <span>{children}</span>}
      {Icon && iconPosition === "right" && (
        <Icon className={iconSizeStyles[size]} />
      )}
    </button>
  );
}

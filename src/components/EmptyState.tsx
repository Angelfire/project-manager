import { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconSize?: "sm" | "md" | "lg";
  showTitleAsHeading?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  iconSize = "md",
  showTitleAsHeading = false,
}: EmptyStateProps) {
  const iconSizes = {
    sm: "size-6",
    md: "size-12",
    lg: "size-14",
  };

  const iconContainerSizes = {
    sm: "size-12",
    md: "size-12",
    lg: "size-14",
  };

  const marginBottom = iconSize === "lg" ? "mb-6" : "mb-4";
  const TitleComponent = showTitleAsHeading ? "h3" : "p";
  const titleClassName = showTitleAsHeading
    ? "text-lg font-semibold text-foreground mb-2"
    : "text-muted-foreground font-medium";

  return (
    <div className="bg-card rounded-lg border border-border p-12 text-center">
      <div
        className={cn(
          "inline-flex items-center justify-center",
          iconContainerSizes[iconSize],
          marginBottom
        )}
      >
        <Icon
          className={cn(iconSizes[iconSize], "text-muted-foreground")}
          aria-hidden="true"
        />
      </div>
      <TitleComponent className={titleClassName}>{title}</TitleComponent>
      <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
}

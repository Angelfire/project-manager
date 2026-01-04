import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center size-12 bg-secondary rounded-lg mb-4">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
      <p className="text-muted-foreground font-medium">Scanning projects...</p>
      <p className="text-muted-foreground text-sm mt-1">Please wait</p>
    </div>
  );
}

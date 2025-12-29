import {
  CircleCheck,
  CircleX,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-gray-100 group-[.toaster]:border-gray-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-gray-800 group-[.toast]:text-gray-100",
          cancelButton:
            "group-[.toast]:bg-gray-800 group-[.toast]:text-gray-100",
        },
      }}
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4" />,
        error: <CircleX className="size-4" />,
        loading: <Loader2 className="size-4 animate-spin" />,
      }}
      position="top-right"
      richColors
      {...props}
    />
  );
};

export { Toaster };

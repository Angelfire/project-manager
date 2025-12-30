import { toast } from "sonner";

/**
 * Utility functions for showing toast notifications
 * Replaces alert() calls with better UX
 */

/**
 * Show a success toast notification
 */
export function toastSuccess(message: string, description?: string) {
  return toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Show an error toast notification
 */
export function toastError(message: string, description?: string) {
  return toast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Show a warning toast notification
 */
export function toastWarning(message: string, description?: string) {
  return toast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show an info toast notification
 */
export function toastInfo(message: string, description?: string) {
  return toast.info(message, {
    description,
    duration: 3000,
  });
}

/**
 * Show a loading toast notification
 * Returns a function to update or dismiss the toast
 */
export function toastLoading(message: string) {
  return toast.loading(message);
}

/**
 * Show a promise toast (loading -> success/error)
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) {
  return toast.promise(promise, messages);
}

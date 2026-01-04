import { toast } from "sonner";

/**
 * Utility functions for showing toast notifications
 * Replaces alert() calls with better UX
 */

/**
 * Shows a success toast notification.
 *
 * @param message - Main message to display
 * @param description - Optional description text
 * @returns Toast ID for programmatic control
 */
export function toastSuccess(message: string, description?: string) {
  return toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Shows an error toast notification with longer duration.
 *
 * @param message - Main error message to display
 * @param description - Optional error description
 * @returns Toast ID for programmatic control
 */
export function toastError(message: string, description?: string) {
  return toast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Shows a warning toast notification.
 *
 * @param message - Main warning message to display
 * @param description - Optional warning description
 * @returns Toast ID for programmatic control
 */
export function toastWarning(message: string, description?: string) {
  return toast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Shows an informational toast notification.
 *
 * @param message - Main info message to display
 * @param description - Optional additional information
 * @returns Toast ID for programmatic control
 */
export function toastInfo(message: string, description?: string) {
  return toast.info(message, {
    description,
    duration: 3000,
  });
}

/**
 * Shows a loading toast notification.
 *
 * @param message - Loading message to display
 * @returns Function to update or dismiss the toast
 */
export function toastLoading(message: string) {
  return toast.loading(message);
}

/**
 * Shows a promise-based toast that transitions from loading to success/error.
 *
 * @param promise - Promise to track
 * @param messages - Messages for different states
 * @param messages.loading - Message shown while promise is pending
 * @param messages.success - Message or function for success state
 * @param messages.error - Message or function for error state
 * @returns Promise that resolves/rejects with the same result
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

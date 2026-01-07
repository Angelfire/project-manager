import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import "@/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Only use StrictMode in development to avoid double renders in production
const AppWithProviders = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

if (import.meta.env.DEV) {
  root.render(<React.StrictMode>{AppWithProviders}</React.StrictMode>);
} else {
  root.render(AppWithProviders);
}

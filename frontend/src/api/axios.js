import axios from "axios";

// Single source of truth for the backend API base URL.
// Set VITE_API_BASE_URL in your .env (see .env.example).
// Falls back to the local dev backend so `npm run dev` works out of the box.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Configure the global axios default so existing `import axios from "axios"`
// calls that use relative paths (e.g. "/api/auth/profile") are prefixed with
// the base URL automatically. This keeps all 32 call sites host-agnostic.
axios.defaults.baseURL = API_BASE_URL;

export default axios;

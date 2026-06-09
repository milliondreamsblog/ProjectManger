import { createApiClient } from "@pm/api-client";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "pm_token";

// Set EXPO_PUBLIC_API_URL in the environment (e.g. your deployed Render URL,
// or your machine's LAN IP for local device testing). localhost only works in
// the iOS simulator / web.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5001";

let onUnauthorizedCb: (() => void) | null = null;
export const setOnUnauthorized = (cb: () => void) => {
  onUnauthorizedCb = cb;
};

export const api = createApiClient({
  baseURL: API_BASE_URL,
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  onUnauthorized: () => onUnauthorizedCb?.(),
});

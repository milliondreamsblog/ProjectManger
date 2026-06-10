import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuth } from "../auth/AuthContext";
import { api } from "./api";

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }) as Notifications.NotificationBehavior,
});

/**
 * Requests notification permission, gets the Expo push token, and registers it
 * with the backend. Silently no-ops on simulators / Expo Go / when there's no
 * EAS projectId (push requires a dev or production build).
 */
export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Device.isDevice) return;
    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== "granted") {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== "granted") return;

        const projectId = (Constants.expoConfig as any)?.extra?.eas?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        await api.notifications.registerToken(token);
      } catch {
        // Push unavailable in this environment — ignore.
      }
    })();
  }, [user]);
}

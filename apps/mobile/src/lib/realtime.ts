import { useEffect } from "react";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const KEY = process.env.EXPO_PUBLIC_PUSHER_KEY;
const CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? "ap2";

/**
 * Subscribes to the user's Pusher channel and refreshes notifications when a
 * new one arrives. No-op when EXPO_PUBLIC_PUSHER_KEY isn't set.
 */
export function useRealtime() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!KEY || !user) return;
    const pusher = new Pusher(KEY, { cluster: CLUSTER });
    const channel = pusher.subscribe(`user-${user.id}`);
    channel.bind("new-notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${user.id}`);
      pusher.disconnect();
    };
  }, [user, qc]);
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@pm/types";
import { api } from "../lib/api";
import { Screen, H1, Body, Card, Button, Loading } from "../components/ui";
import { theme } from "../theme";

function asArray(data: unknown): Notification[] {
  if (Array.isArray(data)) return data as Notification[];
  const obj = data as { notifications?: Notification[] } | undefined;
  return obj?.notifications ?? [];
}

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
  });
  const markAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <Loading />;
  const items = asArray(data);

  return (
    <Screen>
      <H1>Notifications</H1>
      {items.length > 0 && <Button title="Mark all as read" variant="secondary" onPress={() => markAll.mutate()} />}
      {items.map((n) => (
        <Card key={n._id} style={{ borderColor: n.read ? theme.colors.border : theme.colors.primary }}>
          <Body>{n.title}</Body>
          <Body muted>{n.message}</Body>
        </Card>
      ))}
      {items.length === 0 ? <Body muted>You're all caught up.</Body> : null}
    </Screen>
  );
}

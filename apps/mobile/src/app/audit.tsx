import { useQuery } from "@tanstack/react-query";
import type { AuditLog, User } from "@pm/types";
import { api } from "../lib/api";
import { Screen, H1, Body, Card, Loading } from "../components/ui";

function asArray(data: unknown): AuditLog[] {
  if (Array.isArray(data)) return data as AuditLog[];
  const obj = data as { logs?: AuditLog[] } | undefined;
  return obj?.logs ?? [];
}

export default function Audit() {
  const { data, isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => api.audit.logs() });
  if (isLoading) return <Loading />;
  const logs = asArray(data);

  return (
    <Screen>
      <H1>Audit Logs</H1>
      {logs.map((l) => {
        const who = typeof l.userId === "object" ? (l.userId as User).name : "User";
        return (
          <Card key={l._id}>
            <Body>{l.action}</Body>
            <Body muted>
              {who}
              {l.additionalInfo ? ` · ${l.additionalInfo}` : ""}
            </Body>
            {l.timestamp ? <Body muted>{new Date(l.timestamp).toLocaleString()}</Body> : null}
          </Card>
        );
      })}
      {logs.length === 0 ? <Body muted>No audit entries.</Body> : null}
    </Screen>
  );
}

import { useQuery } from "@tanstack/react-query";
import type { User } from "@pm/types";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { Screen, H1, H2, Body, Card, Loading } from "../components/ui";

function UserCard({ u }: { u: User }) {
  return (
    <Card>
      <Body>{u.name}</Body>
      <Body muted>{u.email}</Body>
      {u.designation ? <Body muted>{u.designation}</Body> : null}
    </Card>
  );
}

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const managersQ = useQuery({
    queryKey: ["managers"],
    queryFn: () => api.auth.myManagers(),
    enabled: isAdmin,
  });
  const opicsQ = useQuery({ queryKey: ["opics"], queryFn: () => api.auth.myOpics() });

  if (opicsQ.isLoading) return <Loading />;
  const managers = (managersQ.data ?? []) as User[];
  const opics = (opicsQ.data ?? []) as User[];

  return (
    <Screen>
      <H1>Team</H1>

      {isAdmin && (
        <>
          <H2>Managers</H2>
          {managers.map((m) => (
            <UserCard key={m._id} u={m} />
          ))}
          {managers.length === 0 ? <Body muted>No managers.</Body> : null}
        </>
      )}

      <H2>Operation PICs</H2>
      {opics.map((o) => (
        <UserCard key={o._id} u={o} />
      ))}
      {opics.length === 0 ? <Body muted>No OPICs.</Body> : null}
    </Screen>
  );
}

import { useQuery } from "@tanstack/react-query";
import type { RoleConfig, User } from "@pm/types";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { Screen, H1, H2, Body, Card, Button, Loading } from "../components/ui";
import { theme } from "../theme";

export default function Settings() {
  const { user, logout } = useAuth();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => api.auth.profile() });
  const rolesQ = useQuery({ queryKey: ["role-config"], queryFn: () => api.roleConfig.all() });

  if (profileQ.isLoading) return <Loading />;
  const profile = (profileQ.data?.user ?? {}) as Partial<User>;
  const roles = (rolesQ.data ?? []) as RoleConfig[];

  return (
    <Screen>
      <H1>Settings</H1>

      <Card>
        <H2>Profile</H2>
        <Body>{profile.name ?? user?.name}</Body>
        <Body muted>{profile.email}</Body>
        <Body muted>
          {profile.role ?? user?.role}
          {profile.designation ? ` · ${profile.designation}` : ""}
          {profile.team ? ` · ${profile.team}` : ""}
        </Body>
      </Card>

      {user?.role === "admin" && roles.length > 0 && (
        <Card>
          <H2>Role permissions</H2>
          {roles.map((r) => (
            <Body key={r._id ?? r.roleName} muted>
              {r.roleName}: {r.permissions?.length ?? 0} permissions
            </Body>
          ))}
        </Card>
      )}

      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}

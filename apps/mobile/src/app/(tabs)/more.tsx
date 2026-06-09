import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthContext";
import { Screen, H1, Body, Card, Button } from "../../components/ui";
import { theme } from "../../theme";

function MenuItem({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <Body>{emoji}</Body>
        <Body>{label}</Body>
      </Card>
    </Pressable>
  );
}

export default function More() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  return (
    <Screen>
      <H1>More</H1>
      <Body muted>
        {user?.name} · {user?.role}
      </Body>

      <MenuItem label="Notifications" emoji="🔔" onPress={() => router.push("/notifications")} />
      <MenuItem label="Templates" emoji="🧩" onPress={() => router.push("/templates")} />
      <MenuItem label="Audit Logs" emoji="🧾" onPress={() => router.push("/audit")} />
      <MenuItem label="Settings" emoji="⚙️" onPress={() => router.push("/settings")} />
      {(isAdmin || isManager) && (
        <MenuItem label="Users" emoji="👥" onPress={() => router.push("/users")} />
      )}

      <View style={{ height: theme.spacing.lg }} />
      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}

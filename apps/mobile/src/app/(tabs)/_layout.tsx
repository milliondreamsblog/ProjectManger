import { Text } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../auth/AuthContext";
import { useRealtime } from "../../lib/realtime";
import { usePushRegistration } from "../../lib/push";
import { Loading } from "../../components/ui";
import { theme } from "../../theme";

const icon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

export default function TabsLayout() {
  const { user, loading } = useAuth();
  useRealtime();
  usePushRegistration();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: icon("📊") }} />
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: icon("📁") }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", tabBarIcon: icon("✅") }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: icon("📅") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon("⋯") }} />
    </Tabs>
  );
}

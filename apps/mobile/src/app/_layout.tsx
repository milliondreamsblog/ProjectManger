import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { AuthProvider } from "../auth/AuthContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="project/[id]" options={{ headerShown: true, title: "Project" }} />
              <Stack.Screen name="task/[id]" options={{ headerShown: true, title: "Task" }} />
              <Stack.Screen name="new-project" options={{ headerShown: true, title: "New Project", presentation: "modal" }} />
              <Stack.Screen name="new-task" options={{ headerShown: true, title: "New Task", presentation: "modal" }} />
              <Stack.Screen name="project-graph" options={{ headerShown: true, title: "Dependency Graph" }} />
              <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
              <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notifications" }} />
              <Stack.Screen name="audit" options={{ headerShown: true, title: "Audit Logs" }} />
              <Stack.Screen name="templates" options={{ headerShown: true, title: "Templates" }} />
              <Stack.Screen name="users" options={{ headerShown: true, title: "Users" }} />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

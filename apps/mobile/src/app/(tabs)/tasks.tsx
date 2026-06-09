import { Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { Task } from "@pm/types";
import { api } from "../../lib/api";
import { Screen, H1, Body, Card, Badge, Progress, Loading, ErrorText } from "../../components/ui";

// The user-tasks endpoint may return an array or a status-grouped object;
// normalize both shapes into a flat task list.
function normalize(data: unknown): Task[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Task[];
  if (typeof data === "object") {
    return Object.values(data as Record<string, unknown>)
      .filter(Array.isArray)
      .flat() as Task[];
  }
  return [];
}

export default function Tasks() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-tasks"],
    queryFn: () => api.tasks.userTasks(),
  });

  if (isLoading) return <Loading />;
  const tasks = normalize(data);

  return (
    <Screen>
      <H1>My Tasks</H1>
      {isError ? <ErrorText>Couldn't load tasks.</ErrorText> : null}
      {tasks.map((t) => (
        <Pressable key={t._id} onPress={() => router.push(`/task/${t._id}`)}>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Body>{t.taskName}</Body>
              <Badge label={t.teamStatus} />
            </View>
            <Body muted>{t.taskId}</Body>
            <Progress value={t.progress ?? 0} />
          </Card>
        </Pressable>
      ))}
      {tasks.length === 0 ? <Body muted>No tasks assigned.</Body> : null}
    </Screen>
  );
}

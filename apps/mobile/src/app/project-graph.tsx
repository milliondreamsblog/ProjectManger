import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { api } from "../lib/api";
import { Screen, H1, Body, Card, Loading, ErrorText } from "../components/ui";
import { TaskGraph } from "../components/TaskGraph";

export default function ProjectGraph() {
  const { projectId, name } = useLocalSearchParams<{ projectId: string; name?: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => api.tasks.byProject(projectId),
  });

  if (isLoading) return <Loading />;
  const tasks = data ?? [];

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: "Dependency Graph" }} />
      <H1>{name ?? "Project"} graph</H1>
      <Body muted>Project → tasks → subtasks. Scroll to explore.</Body>
      {isError ? <ErrorText>Couldn't load the graph.</ErrorText> : null}
      <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
        {tasks.length > 0 ? (
          <TaskGraph projectName={name ?? "Project"} tasks={tasks} />
        ) : (
          <Body muted>No tasks to visualize.</Body>
        )}
      </Card>
    </Screen>
  );
}

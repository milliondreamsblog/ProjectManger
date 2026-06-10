import { Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import type { SubTask, Task } from "@pm/types";
import { api } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { Screen, H1, H2, Body, Card, Badge, Button, Progress, Loading, ErrorText } from "../../components/ui";
import { theme } from "../../theme";

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => api.projects.list() });
  const tasksQ = useQuery({ queryKey: ["project-tasks", id], queryFn: () => api.tasks.byProject(id) });
  const milestonesQ = useQuery({ queryKey: ["milestones", id], queryFn: () => api.projects.milestones(id) });

  if (tasksQ.isLoading || projectsQ.isLoading) return <Loading />;

  const project = (projectsQ.data ?? []).find((p) => p._id === id);
  const tasks = tasksQ.data ?? [];
  const milestones = milestonesQ.data ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: project?.projectName ?? "Project" }} />
      <H1>{project?.projectName ?? "Project"}</H1>
      {project ? (
        <Body muted>
          {project.projectId} · {project.status}
          {project.clientName ? ` · ${project.clientName}` : ""}
        </Body>
      ) : null}

      <Button
        title="🕸️ View dependency graph"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: "/project-graph", params: { projectId: id, name: project?.projectName ?? "" } })
        }
      />

      {milestones.length > 0 && (
        <>
          <H2>Milestones</H2>
          {milestones.map((m) => (
            <Card key={m._id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Body>{m.milestoneName}</Body>
                <Badge label={m.status} />
              </View>
              <Body muted>Budget: {m.budget?.toLocaleString?.() ?? m.budget}</Body>
            </Card>
          ))}
        </>
      )}

      <H2>Tasks</H2>
      {hasPermission("create_task") && (
        <Button
          title="＋ New task"
          onPress={() => router.push({ pathname: "/new-task", params: { projectId: id } })}
        />
      )}
      {tasksQ.isError ? <ErrorText>Couldn't load tasks.</ErrorText> : null}
      {tasks.map((t: Task) => {
        const subs = (t.subtasks ?? []) as SubTask[];
        return (
          <Pressable
            key={t._id}
            onPress={() =>
              router.push({ pathname: "/task/[id]", params: { id: t._id, name: t.taskName, projectId: id } })
            }
          >
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Body>{t.taskName}</Body>
                <Badge label={t.teamStatus} />
              </View>
              <Body muted>
                {t.taskId}
                {Array.isArray(subs) ? ` · ${subs.length} subtasks` : ""}
              </Body>
              <Progress value={t.progress ?? 0} />
            </Card>
          </Pressable>
        );
      })}
      {tasks.length === 0 ? <Body muted>No tasks yet.</Body> : null}
      <View style={{ height: theme.spacing.xl }} />
    </Screen>
  );
}

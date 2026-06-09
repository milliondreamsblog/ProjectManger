import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { Screen, H1, H2, Body, Card, Loading, ErrorText } from "../../components/ui";
import { theme } from "../../theme";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <H1>{value}</H1>
      <Body muted>{label}</Body>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const statsQ = useQuery({
    queryKey: ["project-stats"],
    queryFn: () => api.projects.stats(),
  });
  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  if (statsQ.isLoading || projectsQ.isLoading) return <Loading />;

  const stats = (statsQ.data ?? {}) as Record<string, any>;
  const projects = projectsQ.data ?? [];

  return (
    <Screen>
      <H1>Hi, {user?.name?.split(" ")[0] ?? "there"} 👋</H1>
      <Body muted>Here's what's happening across your projects.</Body>

      {statsQ.isError ? <ErrorText>Couldn't load stats.</ErrorText> : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
        <StatCard label="Total projects" value={projects.length} />
        <StatCard label="Due today" value={stats.dueToday ?? stats.today ?? 0} />
        <StatCard label="This week" value={stats.thisWeek ?? stats.week ?? 0} />
        <StatCard label="Overdue" value={stats.overdue ?? 0} />
      </View>

      <H2>Recent projects</H2>
      {projects.slice(0, 5).map((p) => (
        <Card key={p._id}>
          <Body>{p.projectName}</Body>
          <Body muted>
            {p.projectId} · {p.status}
          </Body>
        </Card>
      ))}
      {projects.length === 0 ? <Body muted>No projects yet.</Body> : null}
    </Screen>
  );
}

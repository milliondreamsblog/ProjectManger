import { Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Screen, H1, Body, Card, Badge, Loading, ErrorText } from "../../components/ui";
import { theme } from "../../theme";

export default function Projects() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  if (isLoading) return <Loading />;
  const projects = data ?? [];

  return (
    <Screen>
      <H1>Projects</H1>
      {isError ? <ErrorText>Couldn't load projects.</ErrorText> : null}
      {projects.map((p) => (
        <Pressable key={p._id} onPress={() => router.push(`/project/${p._id}`)}>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Body>{p.projectName}</Body>
              <Badge label={p.status} />
            </View>
            <Body muted>
              {p.projectId}
              {p.clientName ? ` · ${p.clientName}` : ""}
              {p.team ? ` · ${p.team}` : ""}
            </Body>
          </Card>
        </Pressable>
      ))}
      {projects.length === 0 ? <Body muted>No projects yet.</Body> : null}
      <View style={{ height: theme.spacing.xl }} />
    </Screen>
  );
}

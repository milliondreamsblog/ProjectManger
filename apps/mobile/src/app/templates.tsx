import { useQuery } from "@tanstack/react-query";
import type { ProjectTemplate } from "@pm/types";
import { api } from "../lib/api";
import { Screen, H1, Body, Card, Loading } from "../components/ui";

function asArray(data: unknown): ProjectTemplate[] {
  if (Array.isArray(data)) return data as ProjectTemplate[];
  const obj = data as { templates?: ProjectTemplate[] } | undefined;
  return obj?.templates ?? [];
}

export default function Templates() {
  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: () => api.templates.all() });
  if (isLoading) return <Loading />;
  const templates = asArray(data);

  return (
    <Screen>
      <H1>Project Templates</H1>
      {templates.map((t) => (
        <Card key={t._id ?? t.projectName}>
          <Body>{t.projectName}</Body>
          <Body muted>
            {(t.tasks?.length ?? 0)} tasks
            {t.expectedDuration ? ` · ${t.expectedDuration} days` : ""}
          </Body>
        </Card>
      ))}
      {templates.length === 0 ? <Body muted>No templates.</Body> : null}
    </Screen>
  );
}

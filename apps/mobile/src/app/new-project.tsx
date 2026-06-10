import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { api } from "../lib/api";
import { Screen, H1, Field, Button, ErrorText, Card } from "../components/ui";
import { Select } from "../components/Select";

export default function NewProject() {
  const router = useRouter();
  const qc = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [team, setTeam] = useState("Team Alpha");
  const [clientName, setClientName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => api.clients.all() });

  const create = useMutation({
    mutationFn: () =>
      api.projects.create({
        projectName,
        projectType,
        team,
        clientName: clientName || undefined,
        totalBudget: totalBudget ? Number(totalBudget) : undefined,
        targetDate: targetDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      router.back();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to create project."),
  });

  const clientOptions = (clientsQ.data ?? []).map((c) => ({ label: c, value: c }));

  return (
    <Screen>
      <Stack.Screen options={{ title: "New Project" }} />
      <H1>New Project</H1>
      <Card>
        <Field label="Project name *" value={projectName} onChangeText={setProjectName} autoCapitalize="words" />
        <Field label="Type *" value={projectType} onChangeText={setProjectType} placeholder="e.g. Web Development" />
        <Field label="Team *" value={team} onChangeText={setTeam} />
        <Select label="Client" value={clientName} options={clientOptions} onChange={setClientName} placeholder="No clients seeded" />
        <Field label="Budget" value={totalBudget} onChangeText={setTotalBudget} keyboardType="numeric" />
        <Field label="Target date" value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button
          title="Create project"
          onPress={() => {
            setError("");
            if (!projectName || !projectType || !team) {
              setError("Name, type and team are required.");
              return;
            }
            create.mutate();
          }}
          loading={create.isPending}
        />
      </Card>
    </Screen>
  );
}

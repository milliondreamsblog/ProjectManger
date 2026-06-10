import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import type { User } from "@pm/types";
import { api } from "../lib/api";
import { Screen, H1, Field, Button, ErrorText, Card } from "../components/ui";
import { Select } from "../components/Select";

export default function NewTask() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [taskName, setTaskName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const opicsQ = useQuery({ queryKey: ["opics"], queryFn: () => api.auth.myOpics() });
  const opicOptions = ((opicsQ.data ?? []) as User[]).map((u) => ({ label: u.name, value: u._id }));

  const create = useMutation({
    mutationFn: () =>
      api.tasks.create(projectId, {
        taskName,
        assignee: assignee || undefined,
        dueDate: dueDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      router.back();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to create task."),
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "New Task" }} />
      <H1>New Task</H1>
      <Card>
        <Field label="Task name *" value={taskName} onChangeText={setTaskName} autoCapitalize="sentences" />
        <Select label="Assignee" value={assignee} options={opicOptions} onChange={setAssignee} placeholder="No team members" />
        <Field label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button
          title="Create task"
          onPress={() => {
            setError("");
            if (!taskName) {
              setError("Task name is required.");
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

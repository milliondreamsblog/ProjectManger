import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { TASK_STATUS } from "@pm/config";
import type { Comment, SubTask, Task, User } from "@pm/types";
import { api } from "../../lib/api";
import { Screen, H1, H2, Body, Card, Field, Button, Badge, Progress, Loading, ErrorText } from "../../components/ui";
import { Select } from "../../components/Select";
import { theme } from "../../theme";

const STATUS_OPTIONS = Object.values(TASK_STATUS).map((s) => ({ label: s, value: s }));

export default function TaskDetail() {
  const { id, name, projectId } = useLocalSearchParams<{ id: string; name?: string; projectId?: string }>();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [subtaskName, setSubtaskName] = useState("");
  const [files, setFiles] = useState<{ uri: string; name: string; type: string }[]>([]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setFiles((f) => [...f, { uri: a.uri, name: a.fileName ?? `photo-${f.length}.jpg`, type: a.mimeType ?? "image/jpeg" }]);
    }
  };
  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setFiles((f) => [...f, { uri: a.uri, name: a.name, type: a.mimeType ?? "application/octet-stream" }]);
    }
  };

  const commentsQ = useQuery({ queryKey: ["comments", id], queryFn: () => api.comments.byTask(id) });

  // Task object (incl. subtasks) is available when we arrived from a project.
  const tasksQ = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => api.tasks.byProject(projectId as string),
    enabled: !!projectId,
  });
  const task = (tasksQ.data ?? []).find((t: Task) => t._id === id);
  const subtasks = (task?.subtasks ?? []) as SubTask[];

  const invalidateTask = () => qc.invalidateQueries({ queryKey: ["project-tasks", projectId] });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const fd = new FormData();
      fd.append("content", content);
      files.forEach((f) => fd.append("attachments", { uri: f.uri, name: f.name, type: f.type } as any));
      return api.comments.add(id, fd);
    },
    onSuccess: () => {
      setText("");
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const setStatus = useMutation({
    mutationFn: (teamStatus: string) => api.tasks.update(id, { teamStatus }),
    onSuccess: invalidateTask,
  });

  const addSubtask = useMutation({
    mutationFn: (n: string) => api.tasks.addSubtask(id, { name: n }),
    onSuccess: () => {
      setSubtaskName("");
      invalidateTask();
    },
  });

  const toggleSubtask = useMutation({
    mutationFn: (s: SubTask) =>
      api.tasks.updateSubtask(s._id, {
        status: s.status === "Completed" ? "In Progress" : "Completed",
      }),
    onSuccess: invalidateTask,
  });

  if (commentsQ.isLoading) return <Loading />;
  const comments = commentsQ.data?.comments ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: name ?? task?.taskName ?? "Task" }} />
      <H1>{name ?? task?.taskName ?? "Task"}</H1>
      {task ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
            <Badge label={task.teamStatus} />
            <Body muted>{task.taskId}</Body>
          </View>
          <Progress value={task.progress ?? 0} />

          <Card>
            <H2>Status</H2>
            <Select
              label="Set task status"
              value={task.teamStatus}
              options={STATUS_OPTIONS}
              onChange={(s) => setStatus.mutate(s)}
            />
          </Card>

          <Card>
            <H2>Subtasks</H2>
            {subtasks.map((s) => (
              <View
                key={s._id}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.sm }}
              >
                <Body>{s.name}</Body>
                <Button
                  title={s.status === "Completed" ? "Reopen" : "Complete"}
                  variant="secondary"
                  onPress={() => toggleSubtask.mutate(s)}
                />
              </View>
            ))}
            {subtasks.length === 0 ? <Body muted>No subtasks.</Body> : null}
            <Field label="New subtask" value={subtaskName} onChangeText={setSubtaskName} placeholder="Subtask name" />
            <Button
              title="Add subtask"
              onPress={() => subtaskName.trim() && addSubtask.mutate(subtaskName.trim())}
              loading={addSubtask.isPending}
              disabled={!subtaskName.trim()}
            />
          </Card>
        </>
      ) : null}

      <Card>
        <H2>Add a comment</H2>
        <Field label="Comment" value={text} onChangeText={setText} placeholder="Write a comment…" multiline />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button title="📷 Photo" variant="secondary" onPress={pickImage} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="📎 File" variant="secondary" onPress={pickDoc} />
          </View>
        </View>
        {files.map((f, i) => (
          <Body key={i} muted>
            • {f.name}
          </Body>
        ))}
        {addComment.isError ? <ErrorText>Couldn't post comment.</ErrorText> : null}
        <Button
          title="Post comment"
          onPress={() => (text.trim() || files.length) && addComment.mutate(text.trim())}
          loading={addComment.isPending}
          disabled={!text.trim() && files.length === 0}
        />
      </Card>

      <H2>Comments</H2>
      {comments.map((c: Comment) => {
        const author = typeof c.user === "object" ? (c.user as User).name : "User";
        return (
          <Card key={c._id}>
            <Body>{c.content}</Body>
            <Body muted>
              {author}
              {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString()}` : ""}
            </Body>
            {(c.attachments ?? []).map((a, i) => (
              <Body key={i} muted>
                📎 {a.fileName}
              </Body>
            ))}
          </Card>
        );
      })}
      {comments.length === 0 ? <Body muted>No comments yet.</Body> : null}
      <View style={{ height: theme.spacing.xl }} />
    </Screen>
  );
}

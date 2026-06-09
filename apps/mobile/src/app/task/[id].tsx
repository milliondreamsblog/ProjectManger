import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import type { Comment, User } from "@pm/types";
import { api } from "../../lib/api";
import { Screen, H1, H2, Body, Card, Field, Button, Loading, ErrorText } from "../../components/ui";
import { theme } from "../../theme";

export default function TaskDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.comments.byTask(id),
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const fd = new FormData();
      fd.append("content", content);
      return api.comments.add(id, fd);
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  if (commentsQ.isLoading) return <Loading />;
  const comments = commentsQ.data?.comments ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: name ?? "Task" }} />
      <H1>{name ?? "Task"}</H1>

      <Card>
        <H2>Add a comment</H2>
        <Field label="Comment" value={text} onChangeText={setText} placeholder="Write a comment…" multiline />
        {addComment.isError ? <ErrorText>Couldn't post comment.</ErrorText> : null}
        <Button
          title="Post comment"
          onPress={() => text.trim() && addComment.mutate(text.trim())}
          loading={addComment.isPending}
          disabled={!text.trim()}
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

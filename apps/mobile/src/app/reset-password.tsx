import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../lib/api";
import { Screen, H2, Body, Field, Button, ErrorText, Card } from "../components/ui";

export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [token, setToken] = useState(params.token ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError("");
    setMsg("");
    setSubmitting(true);
    try {
      await api.auth.resetPassword(token.trim(), password);
      setMsg("Password reset. You can sign in now.");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: "Reset Password" }} />
      <Card>
        <H2>Set a new password</H2>
        <Field label="Reset token" value={token} onChangeText={setToken} />
        <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <ErrorText>{error}</ErrorText> : null}
        {msg ? <Body>{msg}</Body> : null}
        <Button title="Reset password" onPress={onSubmit} loading={submitting} />
        <Button title="Back to login" variant="secondary" onPress={() => router.replace("/login")} />
      </Card>
    </Screen>
  );
}

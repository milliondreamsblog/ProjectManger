import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { api } from "../lib/api";
import { Screen, H2, Body, Field, Button, ErrorText, Card } from "../components/ui";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError("");
    setMsg("");
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setMsg("If that email exists, a reset link has been sent.");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: "Forgot Password" }} />
      <Card>
        <H2>Reset your password</H2>
        <Body muted>Enter your account email and we'll send reset instructions.</Body>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        {error ? <ErrorText>{error}</ErrorText> : null}
        {msg ? <Body>{msg}</Body> : null}
        <Button title="Send reset link" onPress={onSubmit} loading={submitting} />
        <Button title="Back to login" variant="secondary" onPress={() => router.replace("/login")} />
      </Card>
    </Screen>
  );
}

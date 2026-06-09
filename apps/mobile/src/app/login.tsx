import { useState } from "react";
import { View } from "react-native";
import { Link, Redirect, useRouter } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { Screen, H1, Body, Field, Button, ErrorText, Card, Loading } from "../components/ui";
import { theme } from "../theme";

export default function Login() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("Demo@12345");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  if (user) return <Redirect href="/(tabs)" />;

  const onSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.lg }}>
        <H1>ProjectManager</H1>
        <Body muted>Sign in to manage your projects and tasks.</Body>
      </View>
      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button title="Sign in" onPress={onSubmit} loading={submitting} />
        <Link href="/forgot-password" style={{ color: theme.colors.primary, marginTop: theme.spacing.sm }}>
          Forgot password?
        </Link>
      </Card>
      <Body muted>Demo: admin@demo.com / Demo@12345</Body>
    </Screen>
  );
}

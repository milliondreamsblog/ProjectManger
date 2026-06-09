import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { api, TOKEN_KEY } from "../../lib/api";
import { Screen, H1, H2, Body, Card, Button, Loading } from "../../components/ui";

export default function Calendar() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => api.calendar.fetch(),
    retry: false,
  });

  const connectGoogle = async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      await WebBrowser.openBrowserAsync(api.calendar.authUrl(token));
      refetch();
    }
  };

  if (isLoading) return <Loading />;

  // 401 / error → not connected to Google yet (graceful, not a scary error).
  if (isError) {
    return (
      <Screen>
        <H1>Calendar</H1>
        <Card>
          <H2>Connect Google Calendar</H2>
          <Body muted>Link your Google account to sync and view your calendar events here.</Body>
          <Button title="Connect Google Calendar" onPress={connectGoogle} />
        </Card>
      </Screen>
    );
  }

  const events = data?.events ?? [];
  return (
    <Screen>
      <H1>Calendar</H1>
      {events.length === 0 ? <Body muted>No upcoming events.</Body> : null}
      {events.map((e: any) => (
        <Card key={e.id}>
          <Body>{e.summary ?? "(no title)"}</Body>
          <Body muted>{e.start?.dateTime ?? e.start?.date ?? ""}</Body>
        </Card>
      ))}
    </Screen>
  );
}

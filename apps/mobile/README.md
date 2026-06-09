# ProjectManager — Mobile (Expo)

React Native (Expo + expo-router) app with feature parity to the web app, talking to the
same backend API. Shares `@pm/api-client`, `@pm/types`, and `@pm/config` with the web app.

## Run it

```bash
# from the repo root
pnpm install

# point the app at your API (see .env.example)
cp apps/mobile/.env.example apps/mobile/.env   # set EXPO_PUBLIC_API_URL

pnpm --filter @pm/mobile start                 # then scan the QR with Expo Go
```

- **Physical phone (Expo Go):** set `EXPO_PUBLIC_API_URL` to your machine's LAN IP
  (e.g. `http://192.168.1.50:5001`), since `localhost` resolves to the phone itself.
- **Deployed:** set it to your Render API URL.

Demo login: `admin@demo.com` / `Demo@12345`.

## Structure
```
src/
├── app/                  # expo-router routes
│   ├── _layout.tsx       # providers (QueryClient, Auth) + auth-gated Stack
│   ├── index.tsx         # redirect (login | tabs)
│   ├── login | forgot-password | reset-password
│   ├── (tabs)/           # Dashboard, Projects, Tasks, Calendar, More
│   ├── project/[id]      # milestones + tasks
│   ├── task/[id]         # comments + add comment
│   └── notifications | audit | templates | settings | users
├── auth/AuthContext.tsx  # SecureStore-backed JWT auth
├── lib/                  # api-client instance + TanStack Query client
├── theme/                # tokens from @pm/config
└── components/ui.tsx     # shared UI kit
```

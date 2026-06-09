# 📱 Plan — Turborepo Monorepo + React Native (Expo) App with Full Web Parity

> Goal: restructure this repo into a **Turborepo monorepo** containing the existing **web app**
> and **API**, plus a **new React Native (Expo) app** that can do **everything the website can** —
> manage projects, milestones, tasks, subtasks, comments, dashboards, calendar, notifications,
> RBAC, audit logs, templates, and user management — all against the **same backend**.

**Locked decisions:** Expo (managed) · pnpm + Turborepo · TypeScript (mobile + shared packages;
web stays JS) · Full feature parity (no partial-ship milestone, but sequenced internally).

> Execution: once approved, tell me to start and I'll work through the phases in order, committing
> in logical units (and running things to verify as I go). Note: there is no `/goal` command in
> this environment — any "go ahead" works.

---

## 1. Target structure

```
ProjectManager/                      # Turborepo root (pnpm workspaces)
├── apps/
│   ├── api/          # was backend/   — Express + Mongoose (JS)   [unchanged logic]
│   ├── web/          # was frontend/  — React 19 + Vite (JS)
│   └── mobile/       # NEW            — Expo + expo-router (TS)
├── packages/
│   ├── types/        # shared domain types (User, Project, Task, …)         (TS)
│   ├── config/       # shared constants/enums (roles, permissions, statuses)(TS)
│   ├── api-client/   # typed REST client: axios factory + endpoint fns      (TS)
│   └── query/        # TanStack Query hooks wrapping api-client (optional)  (TS)
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc                            # node-linker=hoisted  (REQUIRED for Expo+pnpm)
├── package.json                      # root: workspaces + turbo scripts
├── render.yaml                       # updated: rootDir → apps/api
└── (README.md, DEPLOYMENT.md, plan.md, this file)
```

Package names (scope `@pm`): `@pm/api`, `@pm/web`, `@pm/mobile`, `@pm/types`, `@pm/config`,
`@pm/api-client`, `@pm/query`.

**What's shared vs rebuilt:**
- ♻️ **Shared** (packages): domain types, constants/enums, the REST client, and React Query hooks
  (TanStack Query is platform-agnostic → works on web + RN).
- 🔁 **Rebuilt for mobile**: all UI (React DOM ≠ React Native), charts (Recharts → victory-native),
  the D3 dependency graph (→ react-native-svg + d3-hierarchy), storage (localStorage → SecureStore).

---

## 2. Phase 0 — Monorepo restructure (foundation)

1. Create `apps/` and `packages/`; `git mv backend apps/api`, `git mv frontend apps/web`
   (preserves history).
2. Remove per-app `package-lock.json`; add:
   - `pnpm-workspace.yaml` → `packages: ["apps/*", "packages/*"]`
   - `.npmrc` → `node-linker=hoisted` (Expo's Metro bundler breaks on pnpm's symlinked store)
   - root `package.json` (private, scripts: `dev`/`build`/`lint` via `turbo run …`; devDeps: `turbo`, `typescript`, `prettier`)
   - `turbo.json` pipeline (`build` depends on `^build`; `dev` persistent; `lint`)
3. `pnpm install` at root; verify web + api still run (`turbo run dev`).
4. **Update deploy configs:**
   - `render.yaml`: `rootDir: apps/api` (or root + `pnpm --filter @pm/api`); ensure pnpm via `corepack`.
   - Vercel: set project **Root Directory = apps/web** (vercel.json already lives there).
   - Keep-alive workflow: unaffected (URL-based).
5. Keep the **in-memory MongoDB dev fallback** in `apps/api` (so `pnpm dev` still runs with zero config).

**Verify:** `turbo run dev` boots api (5001, in-memory seeded) + web (5174); login works.

---

## 3. Phase 1 — Shared packages

Built with **tsup** (fast TS→JS + `.d.ts`), wired into the turbo `build` graph so apps consume
compiled output (robust across Vite + Metro). Each package: `package.json` + `tsconfig.json` + `src/`.

- **`packages/types`** — interfaces mirroring Mongoose models: `User`, `Project`, `Milestone`,
  `Task`, `SubTask`, `Comment`, `Notification`, `AuditLog`, `RoleConfig`, `ProjectTemplate`,
  `Client`. Plus request/response DTOs.
- **`packages/config`** — `ROLES`, `PERMISSIONS`, task/project status enums, ID prefixes,
  the color palette tokens (so mobile theme matches web).
- **`packages/api-client`** — `createApiClient({ baseURL, getToken })` returns an axios instance
  with an auth interceptor; plus typed endpoint functions grouped by domain
  (`auth`, `projects`, `tasks`, `comments`, `calendar`, `notifications`, `audit`, `roleConfig`,
  `templates`, `clients`). Platform injects `getToken` (SecureStore on mobile, localStorage on web).
- **`packages/query`** *(optional but recommended)* — TanStack Query hooks (`useProjects`,
  `useTasks`, `useLogin`, …) wrapping api-client. Mobile uses these; web can adopt later.

**Verify:** `turbo run build` builds all packages; a tiny script calls a client fn against the
running api.

---

## 4. Phase 2 — Expo app scaffold (`apps/mobile`)

1. Scaffold Expo (TS) with **expo-router** (file-based routing, mirrors web routes).
2. Core deps: `expo-router`, `@tanstack/react-query`, `expo-secure-store`,
   `react-native-svg`, `victory-native` (or `react-native-gifted-charts`), `d3-hierarchy`,
   `expo-image-picker`, `expo-document-picker`, `@pusher/pusher-websocket-react-native`,
   `expo-notifications`, `expo-auth-session`, `date-fns`.
3. `app.config.ts` with `EXPO_PUBLIC_API_URL`; `eas.json` (development/preview/production profiles).
4. **Theme** from `@pm/config` palette; shared UI primitives in `src/components`
   (Button, Card, Input, Badge, Modal, StatusPill, Avatar).
5. **Root layout** `app/_layout.tsx`: QueryClientProvider + AuthProvider + navigation theme.
6. **AuthProvider** (`src/auth`): JWT in SecureStore, `login/logout`, hydrate on launch,
   inject token into api-client, 401 → auto-logout. Route guard: unauth → `(auth)/login`.

**Verify:** app launches in Expo Go; login screen hits the API and authenticates the demo admin.

---

## 5. Phase 3 — Feature screens (web → mobile parity map)

Each screen reuses the shared client/hooks; only UI is new. Built in this order:

| # | Mobile route | Mirrors web | Key endpoints |
|---|---|---|---|
| 1 | `(auth)/login`, `forgot-password`, `reset-password` | LoginForm, Forgot/Reset | `/api/auth/*` |
| 2 | `(tabs)/index` — Dashboard | Dashboard + StatsCards + ChartCard | `/api/project/stats`, `/api/task/workload`, `/api/task/performance` |
| 3 | `(tabs)/projects` + `project/[id]` | Project, ProjectsTable, MilestoneView | `/api/project/*`, `/api/project/milestones/*` |
| 4 | `task/[id]` — tasks & subtasks | TaskAndSubTask, Create/Update Task/Subtask | `/api/task/*` |
| 5 | Comments + attachments (in task view) | Comments, GoogleDrivePicker | `/api/comment/*` (multipart → Cloudinary) |
| 6 | Dependency graph (in project/task) | TaskGraphView (D3) | `/api/task/dependencies/*` → react-native-svg + d3-hierarchy |
| 7 | `(tabs)/calendar` | Calender + Google sync | `/api/calendar/*` |
| 8 | `notifications` | NotificationsPanel + real-time | `/api/notifications/*` + Pusher |
| 9 | `(tabs)/tasks` — Task Management | TaskManagement, Dependencies | `/api/task/*` |
| 10 | `templates` | ProjectTemplates | `/api/templates/*` |
| 11 | `settings` — profile + role config | Settings | `/api/auth/profile`, `/api/role-config/*` |
| 12 | `audit` | AuditLogs | `/api/audit/*` |
| 13 | `admin`, `managers`, `opics` — user mgmt | Admin, Managers, OperationPic | `/api/auth/*` (role-gated) |

RBAC: gate tabs/actions by the user's `role`/`permissions` (from JWT), mirroring web's
ProtectedRoute logic via `@pm/config`.

---

## 6. Phase 4 — Native integrations

- **File uploads:** `expo-image-picker` (profile pics) + `expo-document-picker` (attachments) →
  multipart POST → existing Cloudinary pipeline.
- **Real-time:** `@pusher/pusher-websocket-react-native` subscribe `user-{id}` → `new-notification`;
  toast + badge. Reuses existing backend Pusher triggers.
- **Push notifications:** `expo-notifications` (Expo push tokens) — optional backend route to store
  tokens + send; or surface in-app only for v1.
- **Google:** `expo-auth-session` for OAuth login + calendar connect (backend already handles tokens).

---

## 7. Phase 5 — Build, run & deploy (mobile)

- **Dev/demo:** Expo Go via QR (`pnpm --filter @pm/mobile dev`).
- **Builds:** EAS Build → APK (Android) / IPA (iOS) using `eas.json` profiles.
- **OTA:** EAS Update for instant JS updates.
- **Env:** `EXPO_PUBLIC_API_URL` → the deployed Render API; EAS secrets for Pusher/Google keys.
- **Portfolio:** publish a `preview` build + QR link; add app screenshots to the root README.

---

## 8. Cross-cutting updates

- **README.md**: add a "Monorepo" section + architecture diagram showing web + mobile + shared
  packages over one API; add mobile screenshots + Expo/EAS link.
- **DEPLOYMENT.md**: add mobile (EAS) section; update web/api paths to `apps/*`.
- **CI**: extend keep-alive only as needed; optionally add a `turbo run lint/build` check workflow.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **pnpm + Expo Metro** symlink breakage | `.npmrc` `node-linker=hoisted`; test `expo start` early in Phase 2 |
| **D3 dependency graph** on RN is hard | Use `d3-hierarchy` for math + `react-native-svg` to render; fall back to an indented tree/list if needed (logged, not silent) |
| Charts (Recharts unavailable) | `victory-native` / `react-native-gifted-charts` |
| Render monorepo build | Root install + `pnpm --filter @pm/api`; enable corepack; verify deploy after Phase 0 |
| Web is JS, shared pkgs TS | tsup-built packages emit JS + `.d.ts` → both Vite & Metro consume cleanly |
| Scope (full parity is large) | Sequenced order above; keep app runnable after Phase 2 even while screens are added |

---

## 10. Execution checklist (the order I'll follow)

1. [ ] Phase 0 — restructure to apps/* + packages/*, pnpm/turbo, fix deploy configs, verify web+api run
2. [ ] Phase 1 — `types`, `config`, `api-client` (+ `query`) packages, built via turbo
3. [ ] Phase 2 — Expo scaffold, theme, auth, route guard (login works on device)
4. [ ] Phase 3 — all feature screens (table above), in order
5. [ ] Phase 4 — uploads, real-time, push, Google
6. [ ] Phase 5 — EAS build/update, env, screenshots
7. [ ] Phase 6 — docs (README/DEPLOYMENT) + final end-to-end verification on web + mobile

> Reminder: the API needs a real `MONGO_URI` (Atlas) for a persistent shared demo across web +
> mobile; the in-memory fallback still works for local dev but resets each restart and isn't shared
> with a phone on the network unless the API is reachable (use the deployed Render URL for device testing).

---

## 11. Commit strategy — ~200 atomic commits

The scope genuinely supports this **without filler** — a monorepo restructure + 4 shared packages
+ a full Expo app (~13 feature screens, shared UI primitives, auth, charts, integrations) + docs is
realistically **150–250 distinct, logical changes**. Each commit will be **atomic**: one coherent
unit (one screen, one endpoint group, one component, one config), with a clear conventional message
(`feat(mobile): …`, `feat(api-client): …`, `chore(repo): …`, `docs: …`).

Rough budget (≈200):
- Phase 0 restructure + tooling: ~12
- `packages/types`: ~14 (≈1 per model/DTO) · `config`: ~6 · `api-client`: ~14 (≈1 per domain) · `query`: ~14
- Expo scaffold + theme + auth + UI primitives: ~20
- Feature screens (13 areas, each split into list/detail/forms/wiring): ~90
- Native integrations (uploads, real-time, push, Google): ~16
- EAS build/env + docs + final verification: ~14

If genuine atomic units come in under 200, I will **not** pad with meaningless commits — I'll tell
you the real number. Quality of history > hitting an exact count.

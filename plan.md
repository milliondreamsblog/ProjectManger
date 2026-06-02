# 📋 Plan — Host "SGC Cloud" as a Personal Side Project

> A production project-management SaaS (originally built for "Suzuki Consulting") being
> re-homed and re-branded as a portfolio piece. This file is the single source of truth for
> the work. We start tomorrow morning.

---

## 0. Problem statement

This repo is a **real, production-grade MERN project-management tool** with serious features
(3-tier RBAC, audit logs, D3 dependency graph, dashboards, Google Calendar sync, real-time
notifications, file uploads, client sync). It is **wired to the original company's
infrastructure** and was full of **their live credentials**, so it couldn't run for anyone else.

**Goal:** make it (a) safe to push to a public GitHub repo, (b) runnable entirely on **my own
free-tier accounts**, and (c) deployed live with a one-click demo login — so it works as a
flagship portfolio project.

**Approach chosen:** *Keep it real, mostly free.* Use my **own** MongoDB / Pusher / Cloudinary /
Google credentials, **mock Zoho**, and **stub email** when not configured. No external service
is shared with the original company.

---

## 1. Tech stack (what we're hosting)

| Part | Stack | Folder |
|---|---|---|
| Frontend | React 19 + Vite, custom CSS | `Project-Managemement-Tool-FE-SGC_int_D/` |
| Backend | Node/Express + Mongoose | `Project-Management-Tool-BE-DevSgcBEBP/` |
| Database | MongoDB | (Atlas, to be created) |
| File storage | **Cloudinary** (swapping off AWS S3) | (to be created) |
| Real-time | Pusher Channels | (to be created) |

---

## 2. ✅ Already done (Phases 1 & 2 — committed locally, verified)

### Phase 1 — Secrets cleanup (repo now safe to push)
- Added `.env` to the **frontend `.gitignore`** (was missing).
- Removed **all hardcoded secrets from source code** and moved them to env vars:
  - `PusherNotification/Pusher.js` → `process.env.PUSHER_*`
  - `routes/zoho.js` → `process.env.ZOHO_*`
  - `src/Components/NavBar/Layout.jsx` → `import.meta.env.VITE_PUSHER_*`
  - Deleted a dead commented Pusher block in `src/Pages/Project.jsx` that leaked the key.
- Created documented **`.env.example`** for both frontend and backend.
- Rewrote both real **`.env`** files — purged the original company's MongoDB/AWS/Gmail/Google/
  Pusher/Zoho values; generated a strong random `JWT_SECRET`.
- Verified: searching for any old secret literal returns **zero matches**.

### Phase 2 — API centralization (the main hosting blocker)
- Created **`src/api/axios.js`** — reads `VITE_API_BASE_URL`, sets global axios `baseURL`.
- Stripped the dead hardcoded backend IP (`4.240.102.75:5001`) from **all 32 files** (73 → 0).
- Fixed the 2 non-axios browser redirects that needed the full URL:
  `LoginForm.jsx` (Google login link) and `Calender.jsx` (`window.open`).
- Made backend **CORS env-driven** in `server.js` (`CORS_ORIGINS` + auto-allow `FRONTEND_URL`).
- **Verified `npm run build` succeeds** (2911 modules, no errors).

> Known non-blocker: JS bundle ~1.1 MB (gzip 333 kB). Code-splitting is a nice later optimization.

---

## 3. Credentials decision matrix (what's new vs. reuse)

| Service | Decision | Reason |
|---|---|---|
| **MongoDB** | 🆕 New (Atlas M0) | The old URI *is* their live production data |
| **AWS S3** | ❌ Drop → use Cloudinary | Old IAM key can **delete** files in their prod bucket |
| **Cloudinary** | 🆕 New (free) | Free + 2 min; keeps repo clean; old one unused in code anyway |
| **Pusher** | 🆕 New (free) | Free; our every-minute cron would burn their quota |
| **Google OAuth** | 🆕 New (free) | Their redirect URIs are locked → reuse **won't work** on our domain |
| **Google API key** | 🆕 New (free) | Likely domain-restricted |
| **Email / SMTP** | 🆕 My Gmail app pw, or stub | Old one sends as `no-reply@suzuki-gc.com` = impersonation |
| **Zoho** | 🚫 Mock | Paid; replace with seeded demo client data |

**Rule:** nothing shared with the original company. Everything is mine or mocked.

---

## 4. Remaining work — Phase 3 (provision + code)

### 4a. Code changes I can do *without* any accounts (do first tomorrow)
1. **Swap S3 → Cloudinary** for uploads:
   - `routes/authRoutes.js` (profile pictures) and `routes/commentRoutes.js` (comment attachments).
   - Use `multer` memory storage + `cloudinary.uploader.upload_stream` (config already exists in
     `config/cloudinary.js`). Remove the `aws-sdk`/`multer-s3` upload paths.
2. **Make email gracefully no-op** in `services/emailServices.js` when `EMAIL_*` env is blank
   (log instead of throwing) — so the app never crashes on account creation / password reset.
3. **Mock Zoho** — make `/api/zoho/clients` return seeded `ClientName` rows instead of calling
   the live Zoho API; keep the route shape so the UI is unaffected.
4. **Write a seed script** `scripts/seed.js` (+ `npm run seed`):
   - 1 admin (known demo email + password), a couple managers + OPICs.
   - Default `RoleConfig` per role.
   - 2–3 sample projects with milestones, tasks, subtasks, comments.
   - ~5 demo `ClientName` rows.

### 4b. Free accounts to create (need me logged in)
| Account | Where | Fill into |
|---|---|---|
| MongoDB Atlas M0 | cloud.mongodb.com | `MONGO_URI` |
| Cloudinary | cloudinary.com | `CLOUDINARY_*` (backend) |
| Pusher Channels app | pusher.com | `PUSHER_*` (backend) + `VITE_PUSHER_*` (frontend) |
| Google Cloud OAuth + API key | console.cloud.google.com | `GOOGLE_CLIENT_ID/SECRET`, `_C`, `VITE_GOOGLE_*` |
| Gmail app password (optional) | myaccount.google.com → App passwords | `EMAIL_*` |

**MongoDB Atlas quick steps:** create free M0 cluster → Database Access: add user/password →
Network Access: allow `0.0.0.0/0` (demo) → Connect → copy SRV string into `MONGO_URI`.

**Google OAuth quick steps:** new project → OAuth consent screen (External, add my email as test
user) → Credentials → OAuth client (Web) → Authorized redirect URIs: local
`http://localhost:5001/api/auth/google/callback` + the deployed backend callback. Create an API
key for the Drive picker.

### 4c. Local verification (end of Phase 3)
- `npm run seed` → log in as demo admin → create a project/task → upload a file (lands in
  **my** Cloudinary) → see dashboard charts + D3 dependency graph → trigger a Pusher notification.

---

## 5. Phase 4 — Deploy (free stack)

| Layer | Host | Notes |
|---|---|---|
| Frontend | **Vercel** | `vite build` works; set `VITE_*` in dashboard |
| Backend | **Render** (free web service) | Existing `Dockerfile` works; persistent process for `node-cron`. Free tier sleeps on idle (fine for a demo) |
| DB | MongoDB Atlas M0 | from Phase 3 |
| Files | Cloudinary | from Phase 3 |

**Steps:**
1. Init a **clean, dedicated git repo** for this project (currently it sits untracked inside an
   unrelated `BST_Visualiser` repo). Confirm no `.env` is tracked. Push to a **new public GitHub repo**.
2. Render: new Web Service from the backend folder → add all backend env vars → deploy → note URL.
3. Vercel: import the frontend folder → set `VITE_API_BASE_URL` = Render URL + other `VITE_*` → deploy.
4. Back-fill: set backend `FRONTEND_URL` + `CORS_ORIGINS` to the Vercel URL; add the deployed
   OAuth callback to Google Cloud authorized redirect URIs.
5. Smoke-test the live site end to end.

---

## 6. Phase 5 — Portfolio polish

- Replace the default Vite-template `README.md` with a real one: overview, **screenshots**,
  architecture diagram, feature list, tech stack, **live demo link + demo credentials**, and a
  short "rebranded from a production app I worked on" note.
- (Optional) Rebrand "Suzuki Consulting / SGC" naming to my own product name.
- **Feature-flag** unconfigured integrations so the UI degrades gracefully (hide "Login with
  Google" / Calendar / Drive buttons when their env vars are absent) instead of erroring.
- (Optional, strong interview signal) remove dead code (commented Socket.io, duplicate
  `TaskAndSubTask2`), re-enable TLS validation in the email transporter, add code-splitting.

---

## 7. ▶️ Tomorrow-morning checklist (ordered)

1. [ ] **Code (no accounts needed):** S3→Cloudinary swap, email no-op stub, Zoho mock, seed script.
2. [ ] **Create accounts:** MongoDB Atlas, Cloudinary, Pusher, Google OAuth+API key (+ Gmail app pw optional).
3. [ ] **Fill in both `.env` files** with the new keys.
4. [ ] **Run locally:** `npm run seed` (backend) → `npm run dev` (backend) → `npm run dev` (frontend) → smoke-test.
5. [ ] **Init clean git repo + push** to a new public GitHub repo (verify no secrets tracked).
6. [ ] **Deploy backend → Render**, then **frontend → Vercel**; wire `VITE_API_BASE_URL`, `FRONTEND_URL`, `CORS_ORIGINS`, OAuth redirect.
7. [ ] **Live smoke-test** end to end.
8. [ ] **Write README** with demo link + demo credentials; take screenshots.

**Demo login (to define in seed script):** e.g. `admin@demo.com` / `Demo@12345` — document it in the README.

---

## 8. Out of scope (mention, don't build unless asked)
- Automated test suite (none exists today) — note as a known gap.
- Keeping AWS S3 with my own free-tier account (we're standardizing on Cloudinary instead).

## 9. Reference
- Detailed original plan: `~/.claude/plans/enchanted-jingling-hejlsberg.md`
- Env templates: `*/.env.example` in both folders.

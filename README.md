# UPDATE NOTE

Sigrid is now enabled for this repo.
You have new GitHub Actions workflow files.
You will receive a Sigrid invitation shortly - accept it and review the architecture analysis of your repo as part of the project documentation assignment. There's no need to improve the codebase or architecture when working on the implementation.
Visit Sigrid at https://sigrid-says.com/cmusvfse

# 🍷 VinoVault

VinoVault is a full-stack web platform that helps users **discover wines, manage their personal cellar, and connect with other wine enthusiasts**—all in one place.

It unifies features like recommendations, reviews, inventory tracking, and social interactions into a single seamless workflow, eliminating the need to switch between multiple apps.

---

## 🚀 Features

### 🔍 Wine Discovery & Recommendations

- Search and filter wines by various attributes
- Personalized recommendations based on user behavior
- Similar wine suggestions via recommendation engine

### 📝 Wine Reviews

- Create and view community reviews
- Add ratings, tasting notes, photos, and comments
- Explore feedback from other users

### 🍾 Cellar Management

- Track your personal wine inventory
- Store details like vintage, quantity, and storage location
- Get reminders for optimal drinking windows

### 💰 Wishlist & Price Tracking

- Maintain a wishlist of wines
- Track price changes over time
- Receive alerts for significant price drops

### 👥 Social Features

- User profiles and friend connections
- Private messaging (real-time chat via WebSockets)
- Organize tastings and events

### 🔔 Notifications

- Centralized notification system
- Email alerts for reminders and updates
- User-configurable preferences

---

## 🏗️ Architecture Overview

VinoVault uses a **split backend model**: most API routes run as Vercel Serverless Functions, while the social/chat features run on a persistent Express server hosted on Render. This split is required because the real-time chat feature uses Socket.IO (WebSockets), which cannot run in Vercel's serverless environment.

```
Browser
      │
      ├── REST /api/* ───────────────────► Vercel Serverless Functions (api/)
      │                                    wines, wishlist, notifications,
      │                                    user profile, webhooks, cron
      │                                         │
      ├── REST (HTTPS) ──────────────────► Express API (Render) (server/)
      │                                    social: friends, chat, events
      │                                         │
      └── WebSocket (Socket.IO) ────────────────┤
                                                │
                                          MongoDB Atlas
                                          Clerk (Auth)
```

- **Frontend**: React + Vite SPA (TypeScript), deployed to Vercel
- **Backend (Vercel)**: Serverless Functions in `api/` (TypeScript) — wines, wishlist, notifications, user profile, cron
- **Backend (Render)**: Express.js server in `server/` (JavaScript) — social features + Socket.IO real-time chat
- **Database**: MongoDB Atlas (cloud)
- **Auth**: Clerk — frontend uses publishable key, backend verifies JWTs with secret key

---

## 🧩 Core Components

### Frontend (UI Layer)

- Wine discovery and browsing
- Reviews and social interactions
- Inventory and wishlist management
- Real-time chat (Socket.IO client)

### Backend Subsystems

**Vercel Serverless (`api/`, TypeScript)**

- **Wine Discovery** – search, filtering, and pricing (`wines.ts`)
- **Wishlist & Price Tracking** – wishlist management with price-drop alerts (`wishlist.ts`)
- **Notification System** – centralized alerts and preferences (`notifications.ts`)
- **User Profile** – profile data and sync with Clerk (`me.ts`)
- **Webhooks** – Clerk user lifecycle events (`webhooks.ts`)
- **Cron Jobs** – scheduled price monitoring (`cron.ts`)

**Express Server (`server/`, JavaScript) — deployed on Render**

- **Social System** – user relationships, friend requests (`social/friendship/`)
- **Real-time Chat** – Socket.IO WebSocket chat (`social/chat/`)
- **Events** – wine tasting events (`social/event/`)

### Data & Integration Layer

- **MongoDB Atlas** for persistence
- **GoPuff API** for wine metadata and pricing
- **Email API** for notifications

---

## 🛠️ Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Frontend         | React (Vite), TypeScript                 |
| Styling          | Tailwind CSS, Radix UI, shadcn/ui        |
| Backend (Vercel) | Node.js Serverless Functions, TypeScript |
| Backend (Render) | Node.js, Express.js, JavaScript          |
| Real-time        | Socket.IO (WebSockets)                   |
| Database         | MongoDB Atlas (Mongoose)                 |
| Auth             | Clerk (Email/Password + Google OAuth)    |
| Frontend Deploy  | Vercel                                   |
| Backend Deploy   | Vercel (serverless) + Render (Express)   |
| API Design       | RESTful JSON APIs                        |
| Tooling          | Prettier, GitHub                         |

---

## ⚙️ Key Design Decisions

- **Split Deployment (Vercel + Render)**
  - Vercel cannot run persistent processes, so Socket.IO lives on Render
  - Frontend communicates with backend via `VITE_SERVER_URL` env var

- **Clerk JWT Authentication**
  - Frontend obtains a signed JWT from Clerk and sends it as `Authorization: Bearer <token>`
  - Backend verifies it using `@clerk/express` — works cross-origin with no extra config

- **Layered Architecture**
  - Separation of UI, business logic, and data layers
  - Each social sub-feature has its own controller / service / repository / model

- **Centralized Notification System**
  - Avoids duplicated logic across features
  - Supports user preferences

---

## 🔌 API & Communication

- **REST APIs (JSON over HTTP)** — all routes under `/api/social/`
- **WebSocket (Socket.IO)** — real-time chat between friends
- Auth header required on all protected endpoints: `Authorization: Bearer <clerk_jwt>`

---

## 📦 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm
- MongoDB Atlas account
- Clerk account
- ScraperAPI account (for wine data)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/vinovault.git
cd VinoVault

# Install root/server dependencies
npm install

# Install frontend dependencies
cd client && npm install
```

### 2. Environment Variables

There are **three** env files to create for local development:

---

**Root `.env.local`** — used by Vercel serverless functions (`api/`) and the wine data pipeline:

```bash
cp .env.example .env.local
```

| Variable                     | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| `MONGODB_URI`                | MongoDB Atlas connection string                                            |
| `PORT`                       | `3001` for local Vercel dev server                                         |
| `CLERK_SECRET_KEY`           | From Clerk Dashboard → API Keys (`sk_test_...`)                            |
| `CLERK_WEBHOOK_SECRET`       | From Clerk Dashboard → Webhooks (`whsec_...`)                              |
| `CLERK_PUBLISHABLE_KEY`      | From Clerk Dashboard → API Keys (`pk_test_...`)                            |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as above — exposed to Vite                                            |
| `FRONTEND_URL`               | `http://localhost:5173` for local dev                                      |
| `SCRAPERAPI_KEY`             | From [scraperapi.com](https://www.scraperapi.com) — used for wine scraping |
| `SMTP_HOST`                  | SMTP server host (e.g. `smtp.gmail.com`)                                   |
| `SMTP_PORT`                  | SMTP port (e.g. `587`)                                                     |
| `SMTP_USER`                  | SMTP login email                                                           |
| `SMTP_PASS`                  | SMTP app password                                                          |
| `SMTP_FROM`                  | Sender display name + email                                                |
| `CRON_SECRET`                | Random secret to protect cron endpoints                                    |

---

**Express server** — create a `.env` file inside `server/`:

```bash
cp server/.env.example server/.env
```

| Variable                | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `MONGODB_URI`           | MongoDB Atlas connection string                 |
| `PORT`                  | `3000` (Express server port)                    |
| `CLERK_SECRET_KEY`      | From Clerk Dashboard → API Keys (`sk_test_...`) |
| `CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard → API Keys (`pk_test_...`) |
| `FRONTEND_URL`          | `http://localhost:5173` for local dev           |

---

**Frontend** — create a `.env.local` file inside `client/`:

```bash
cp client/.env.example client/.env.local
```

| Variable                     | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `VITE_CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard → API Keys (`pk_test_...`)        |
| `VITE_SERVER_URL`            | `http://localhost:3000` for local dev (Express server) |
| `CLERK_SECRET_KEY`           | Injected by Vercel CLI for serverless functions        |
| `MONGODB_URI`                | Injected by Vercel CLI for serverless functions        |
| `VERCEL_OIDC_TOKEN`          | Auto-populated by Vercel CLI — leave blank locally     |

> Get the actual secret values from a teammate — never commit `.env` or `.env.local` to the repo.

### 3. Run Locally (two terminals)

**Terminal 1 — Express server (social / chat):**

```bash
cd server
npm run dev
# Server starts at http://localhost:3000
```

**Terminal 2 — Frontend (Vite) and Wishlist:**

```bash
npm run dev:full
# App opens at http://localhost:5173
# http://localhost:3001 for wishlist
```

> The Vercel serverless functions (`api/`) are proxied through Vite in local dev — no separate process needed.

---

## 🍷 Wine Data Pipeline

Wine catalog data is scraped from wine.com and seeded into MongoDB.

```bash
# 1. Scrape → scripts/wine_data.json
npm run scrape

# 2. Import into MongoDB
npm run seed
```

Requires `SCRAPERAPI_KEY` in the root `.env.local`. `wine_data.json` is gitignored.

---

## 🔗 Clerk Webhook Setup

## 🚢 Production Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set the following in Render's dashboard:
   - **Root directory**: _(leave empty — repo root)_
   - **Build command**: `npm install`
   - **Start command**: `node server/src/server.js`
4. Add these **Environment Variables** in Render:

| Variable                | Value                              |
| ----------------------- | ---------------------------------- |
| `MONGODB_URI`           | MongoDB Atlas connection string    |
| `CLERK_SECRET_KEY`      | `sk_live_...` from Clerk           |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Clerk           |
| `FRONTEND_URL`          | `https://vinovault-lac.vercel.app` |
| `PORT`                  | `3000`                             |

5. Your Render URL: **`https://vinovault.onrender.com`**

### Frontend → Vercel

1. Import your GitHub repo on [vercel.com](https://vercel.com)
2. Set the following in Vercel project settings:
   - **Root directory**: `client`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Add these **Environment Variables** in Vercel:

| Variable                     | Value                            |
| ---------------------------- | -------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Clerk         |
| `VITE_SERVER_URL`            | `https://vinovault.onrender.com` |

4. Deploy — Vercel auto-deploys on every push to `main`

Your Vercel URL: **`https://vinovault-lac.vercel.app`**

---

## 🔗 Clerk Setup

### Allowed Origins

In [Clerk Dashboard](https://dashboard.clerk.com) → **Configure** → **Allowed origins**, add:

- `http://localhost:5173` (local dev)
- `https://vinovault-lac.vercel.app` (production)

### Webhook (optional)

If using Clerk webhooks, register the endpoint under **Webhooks → Add Endpoint**:

- **URL**: `https://vinovault.onrender.com/api/webhooks/clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`

Copy the signing secret → add as `CLERK_WEBHOOK_SECRET` on Render.

---

## 📈 Future Improvements

- Microservices extraction (recommendation, pricing)
- Advanced recommendation algorithms
- Mobile app support
- Multi-language localization
- Analytics & insights dashboard

---

## 👥 Team

**Team8**

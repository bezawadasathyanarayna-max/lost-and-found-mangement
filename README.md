# 🎓 Lost & Found Campus Management System

A production-ready full-stack web application tailored for college campuses, enabling students, faculty, and administrative staff to report, track, discover, and recover lost and found personal belongings seamlessly.

Built with **plain HTML, modern CSS, and vanilla JavaScript** on the frontend, powered by a modular **Express.js REST API** backend, and integrated with **Supabase** for PostgreSQL database persistence, Row Level Security (RLS), authentication, and cloud image storage. Fully configured for **Vercel Serverless** deployment.

---

## 🌟 Key Highlights & Features

- **Intuitive Campus Feed (`items.html`)**: Real-time keyword search, category pills (Phone, Laptop, ID Card, Keys, etc.), filter by Lost vs. Found, claim status, and incident date.
- **Privacy-First Contact Shielding**: Item contact numbers are shielded from public visitors and only revealed to authenticated campus members.
- **Report in Seconds (`report.html`)**: Interactive type selection cards, live photo upload preview with drag-and-drop, automated profile phone pre-fill, and input validation.
- **User Dashboard (`dashboard.html`)**: Personal metrics (Total reports, Open, Resolved), live status toggle ("Resolve" / "Reopen"), report editor modal, and deletion controls.
- **Admin Moderation Panel (`admin.html`)**: Elevated portal for authorized administrators (`role = 'admin'`) to monitor campus-wide stats, change report statuses, and purge spam listings.
- **Light & Dark Mode**: Persistent theme toggle saved in `localStorage` with a curated deep indigo/violet palette and glassmorphism styling.
- **Production Architecture**: Helmet CSP configuration, CORS, Express rate-limiting, centralized error handling, and serverless compatibility for Vercel.

---

## 🏗️ Project Architecture

```
lost-and-found/
├── api/
│   └── index.js                 # Exports Express app for Vercel serverless function
├── server/
│   ├── app.js                   # Express application setup, security middlewares, routes
│   ├── server.js                # Local server runner (http://localhost:3000)
│   ├── config/
│   │   └── supabase.js          # Supabase client configurations (public & admin clients)
│   ├── middleware/
│   │   ├── auth.js              # Supabase JWT Bearer token verification & admin guards
│   │   └── error.js             # 404 handler and centralized error handling
│   ├── controllers/
│   │   ├── itemsController.js   # Items CRUD, filtering, privacy masking, seed fallbacks
│   │   └── adminController.js   # Platform metrics, moderation, status management
│   └── routes/
│       ├── items.js             # /api/items routes
│       ├── admin.js             # /api/admin routes
│       ├── auth.js              # /api/auth routes
│       └── upload.js            # /api/upload image endpoint (Multer + Supabase Storage)
├── public/
│   ├── index.html               # High-converting landing page with animated hero & stats
│   ├── items.html               # Public/protected feed with live search & detail modal
│   ├── report.html              # Item submission wizard with image dropzone
│   ├── dashboard.html           # User dashboard with management table & stats
│   ├── admin.html               # Staff moderation console
│   ├── login.html               # Split-screen login page with floating labels
│   ├── signup.html              # Campus registration page with Roll No / ID fields
│   ├── 404.html                 # Custom 404 error page
│   ├── css/
│   │   ├── style.css            # Custom CSS design system, components, and layout
│   │   ├── dark.css             # Dark mode theme overrides
│   │   └── animations.css       # Keyframes, floating effects, and skeleton loaders
│   ├── js/
│   │   ├── config.js            # Client configuration and auto-sync
│   │   ├── auth.js              # Supabase auth SDK controller & route guards
│   │   ├── api.js               # Centralized HTTP client with automatic Bearer token injection
│   │   ├── ui.js                # Toast alerts, modals, skeletons, and theme controller
│   │   ├── items.js             # Feed controller and details modal
│   │   ├── report.js            # Form controller and file uploader
│   │   ├── dashboard.js         # User dashboard controller
│   │   └── admin.js             # Admin moderation controller
│   └── assets/
│       └── hero-banner.jpg      # Isometric campus illustration asset
├── supabase/
│   └── schema.sql               # Complete PostgreSQL schema, triggers, RLS, and storage
├── vercel.json                  # Vercel deployment routing configuration
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**, choose an organization, give your project a name (e.g. `campus-lost-and-found`), set a database password, and select your preferred region.
3. Wait approximately 1-2 minutes for the database to provision.

---

### 2. Execute the Database Schema (`supabase/schema.sql`)

1. In the Supabase Dashboard, open the **SQL Editor** tab from the left sidebar.
2. Click **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](file:///d:/lost%20and%20found%20my%20devices/supabase/schema.sql) and paste it into the SQL Editor.
4. Click **Run**.
   - This creates the `profiles` and `items` tables.
   - Sets up automatic profile creation via PostgreSQL triggers on signup (`auth.users -> profiles`).
   - Enables Row Level Security (RLS) policies.
   - Creates the `item-images` storage bucket with public-read and authenticated-upload permissions.
   - If email confirmation is enabled in Supabase, new users must confirm their email before signing in.

---

### 3. Copy Your Supabase API Credentials

1. In the Supabase Dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Copy the following keys:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public** key
   - **service_role** key (keep this secret; only used on the backend)

---

### 4. Configure Local Environment & Run Locally

1. Duplicate `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   PORT=3000
   NODE_ENV=development
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm run dev
   # Or for standard node:
   npm start
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### 5. Creating an Administrator Account

By default, newly registered users receive the role `'user'`. To grant administrator privileges:

1. Register an account via `http://localhost:3000/signup.html`.
2. Go to your Supabase Dashboard -> **Table Editor** -> select the `profiles` table.
3. Find your registered user row and change the `role` column value from `'user'` to `'admin'`.
4. Refresh your browser or log in again; the **Admin Portal** link will now appear in your user dropdown menu!

---

## 🚀 Vercel Deployment Instructions

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "feat: initial commit of Lost and Found campus management system"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

### 2. Import Project into Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository and click **Import**.
4. Leave the Framework Preset as **Other** (Vercel automatically detects `vercel.json`).

---

### 3. Configure Environment Variables in Vercel

In the **Environment Variables** section of the deployment screen, add:

| Key | Value | Description |
|---|---|---|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase Service Role key |
| `NODE_ENV` | `production` | Production environment |

Click **Deploy**.

---

### 4. Configure Supabase Authentication Redirects for Production

Once Vercel finishes deploying, you will receive a production URL (e.g. `https://campus-lost-and-found.vercel.app`):

1. Go back to your Supabase Dashboard -> **Authentication** -> **URL Configuration**.
2. Set **Site URL** to:
   ```
   https://campus-lost-and-found.vercel.app
   ```
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://campus-lost-and-found.vercel.app/**
   http://localhost:3000/**
   ```
4. Click **Save**.

Your production deployment is now live, secure, and ready for your campus community!

---

## 🛡️ API Endpoints Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health check |
| `GET` | `/api/config` | Public | Exposes public Supabase URL and anon key |
| `GET` | `/api/items` | Public / Protected | Feed of reported items (with search, category, status filters) |
| `GET` | `/api/items/:id` | Public / Protected | Specific item details (contact unlocked for logged-in users) |
| `POST` | `/api/items` | Authenticated | Create a new lost or found report |
| `PUT` | `/api/items/:id` | Owner / Admin | Update report details or change status |
| `DELETE` | `/api/items/:id` | Owner / Admin | Delete an item report |
| `GET` | `/api/my-items` | Authenticated | Get current user's reports and status metrics |
| `POST` | `/api/upload` | Authenticated | Upload image to Supabase Storage bucket `item-images` |
| `GET` | `/api/admin/stats` | Admin Only | Global campus statistics and breakdown |
| `GET` | `/api/admin/items` | Admin Only | Moderation feed with complete student details |
| `PUT` | `/api/admin/items/:id/status` | Admin Only | Moderate item status (open/claimed/resolved) |

# BrandPushers.ai

**TikTok-First Brand Incubator Platform**  
Entity: WHUT.AI LLC (Wyoming)  
Stack: Next.js 16 (App Router) + Supabase + Vercel

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up env vars (copy and fill in real values)
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: **Supabase Dashboard → Project Settings → API**

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (Navbar + Hero + WhatWeDo + WhyUs + Apply + Footer)
│   ├── auth/
│   │   ├── login/            # Magic link login page
│   │   └── callback/         # OAuth/magic link callback handler
│   ├── admin/                # Admin portal (requires role='admin')
│   │   ├── page.tsx          # Applications review
│   │   ├── members/          # View all approved members
│   │   ├── phases/           # Manage brand-building phases
│   │   └── resources/        # Manage learning resources
│   ├── dashboard/            # Member dashboard (requires role='member')
│   │   ├── page.tsx          # Phase progress tracker
│   │   ├── resources/        # Learning resources
│   │   └── documents/        # File upload/management
│   ├── portal/               # Alternate portal route (redirects to dashboard)
│   ├── pending/              # Shown while application is under review
│   ├── privacy/              # Privacy policy
│   └── terms/                # Terms of service
├── components/
│   ├── Navbar.tsx            # Landing page nav
│   ├── Hero.tsx              # Hero section
│   ├── WhatWeDo.tsx          # Services section
│   ├── WhyUs.tsx             # Why choose us section
│   ├── ApplicationForm.tsx   # Multi-step apply form
│   ├── Footer.tsx            # Landing footer
│   └── portal/
│       └── portal-nav.tsx    # Member portal navigation
├── lib/
│   ├── supabase-client.ts    # Browser Supabase client
│   ├── supabase-server.ts    # Server Supabase client
│   └── supabase/             # Alternative client exports
│       ├── client.ts
│       └── server.ts
└── proxy.ts                  # Next.js 16 route proxy (auth protection)
```

---

## 🗄️ Database Setup

Run `supabase/migrations/001_initial_schema.sql` in **Supabase Dashboard → SQL Editor**.

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extends `auth.users`. Roles: `pending`, `member`, `admin` |
| `applications` | Brand applications from the landing page form |
| `phases` | Brand-building phases (admin-managed) |
| `member_phases` | Per-member phase progress |
| `resources` | Learning materials shared with all members |
| `documents` | Files uploaded by members |

### Storage

Create a `documents` bucket in **Supabase Dashboard → Storage**. See commented SQL in the migration file for RLS policies.

### Admin Setup

After your first login with `minkovgroup@gmail.com`, run in SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'minkovgroup@gmail.com';
```

### Seed Phases (optional)

```sql
INSERT INTO public.phases (name, description, "order") VALUES
  ('Brand Strategy', 'Define your brand identity, positioning, and target audience.', 1),
  ('Content Creation', 'Produce your first batch of brand content for TikTok and social.', 2),
  ('TikTok Launch', 'Publish your first videos and establish your channel presence.', 3),
  ('Community Building', 'Grow and engage your audience across platforms.', 4),
  ('Paid Ads', 'Run targeted ad campaigns to accelerate growth.', 5),
  ('Scale & Optimize', 'Analyze performance and scale what is working.', 6);
```

---

## 🔑 Auth Flow

1. User fills **ApplicationForm** → account created in `auth.users` + `profiles` (role=`pending`) + application inserted
2. User is redirected to `/pending` page
3. **Admin** reviews at `/admin` and approves → user `role` updated to `member`
4. Member accesses `/dashboard` 
5. Admin also has full `/admin` portal

### Magic Link Login

`/auth/login` — sends magic link via Supabase. Callback at `/auth/callback` exchanges code for session.

---

## 🚢 Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

The `proxy.ts` file handles route protection for `/dashboard`, `/admin`, and `/portal` at the edge.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` |
| Accent orange | `#F24822` |
| Gradient start (purple) | `#9B0EE5` |
| Gradient end (orange) | `#F57B18` |

**Tailwind classes:** `bg-brand-orange`, `bg-brand-purple`, `bg-logo-gradient`, `glass`, `gradient-text`, `animate-float`, `animate-pulse-glow`

**CSS vars:** `var(--bg-dark)`, `var(--bg-card)`, `var(--text-secondary)`, `var(--accent)`, `var(--gradient-start)`, `var(--gradient-end)`

---

## 📋 TODO

- [ ] Connect real Supabase project URL + keys in `.env.local`
- [ ] Run `001_initial_schema.sql` in Supabase SQL Editor
- [ ] Create `documents` storage bucket + policies
- [ ] Add logo at `public/logo.svg` (placeholder exists)
- [ ] Bootstrap admin: set `minkovgroup@gmail.com` role to `admin`
- [ ] Seed phases via SQL
- [ ] Push to GitHub → deploy on Vercel
- [ ] Add custom domain `brandpushers.ai` in Vercel

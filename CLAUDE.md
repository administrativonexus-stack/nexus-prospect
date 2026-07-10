# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nexus Prospect System** — an internal (non-SaaS) commercial prospecting automation platform. The system finds companies via Google Maps, imports them as leads into a CRM, runs AI-powered website audits, initiates WhatsApp contact, and uses an AI SDR to qualify leads and schedule meetings automatically.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (auth, Postgres, Realtime) |
| AI | OpenAI API (GPT-4o — audit + SDR) |
| WhatsApp | Evolution API (webhook-based) |
| Calendar | Google Calendar API (OAuth 2.0) |
| Prospecting | Apify or Outscraper (Google Maps scraping) |

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npx supabase start   # local Supabase (Docker required)
npx supabase db push # apply migrations
npx supabase gen types typescript --local > types/database.ts
```

## Architecture

**Next.js App Router** full-stack app — pages in `app/(app)/`, API routes in `app/api/`, shared logic in `lib/`.

### Route Groups
- `app/(auth)/` — login, Supabase PKCE callback
- `app/(app)/` — protected shell with sidebar; all main modules live here
- `app/api/` — all Route Handlers (no separate Express/Fastify server)

### `lib/` Layer (integration modules)
- `lib/supabase/` — `client.ts` (browser), `server.ts` (Route Handlers/SSR), `queries/` (typed DB helpers)
- `lib/openai/auditor.ts` — `runAudit(name, url)` → structured GPT-4o output with score + lists
- `lib/openai/sdr.ts` — `runSDRTurn(context, history, msg)` → text reply + optional `{ action: 'schedule_meeting' }`
- `lib/evolution/` — HTTP wrapper for Evolution API; webhook parser with HMAC verification
- `lib/google/` — OAuth flow, Calendar event creation, token auto-refresh
- `lib/prospecting/` — `apify.ts` and `outscraper.ts` both export identical `searchGoogleMaps(niche, city, limit)` interface; provider selected via `settings` table key `prospecting_provider`
- `lib/settings.ts` — `getSetting/setSetting` backed by Supabase `settings` table; runtime API keys override env vars

### Database Schema (Supabase/Postgres)
```
profiles      — extends auth.users (id, name, email, avatar_url)
leads         — id, company_name, phone, city, website, address, rating, review_count, score, status (enum), notes, niche
conversations — id, lead_id, message, sender (enum: lead|agent|ai), whatsapp_message_id (UNIQUE), read
meetings      — id, lead_id, meeting_date, meeting_link, google_event_id, status (enum)
audits        — id, lead_id, score, has_website, is_responsive, has_form, has_cta, has_chatbot, has_lead_capture, problems/opportunities/sales_arguments (jsonb)
settings      — key (PK), value (AES-256-GCM encrypted for API keys)
lead_history  — id, lead_id, action, description, metadata (jsonb)
```

`leads.status` enum: `lead_found → message_sent → replied → meeting_scheduled → proposal → closed → lost`

Migrations are in `supabase/migrations/` (5 files: enums, tables, indexes, RLS, functions+triggers).

## Key Modules

### Prospecting (`/prospecting`)
Search form (niche + city + quantity) → Apify/Outscraper → results table → "Import to CRM" or "Analyze Company".

### AI Auditor
POST `/api/audit` — HEAD-requests the website, calls GPT-4o with structured output schema, stores in `audits` table, updates `leads.score`.

### CRM (`/crm`)
Kanban board with 7 columns. Drag-and-drop via `@dnd-kit/core` + `@dnd-kit/sortable`. Optimistic updates on drag-end → PATCH `/api/leads/[leadId]/status`. Lead detail opens as a Sheet overlay with 4 tabs.

### Conversations (`/conversations/[leadId]`)
3-panel WhatsApp inbox. Inbound messages arrive via Evolution API webhook → `/api/webhooks/evolution` → saved to DB → Supabase Realtime (`postgres_changes` on `conversations` table) → pushed to UI in real time via `use-realtime-messages.ts` hook.

### AI SDR
Strict system prompt: ONLY qualify, understand needs, and schedule meetings. NEVER sell, quote prices, or send proposals. When lead agrees to a meeting, returns `{ action: 'schedule_meeting', proposed_datetime }` → creates Google Calendar event with Meet link → sends WhatsApp confirmation → updates lead to `meeting_scheduled`.

## Design System

Dark theme, minimalist, premium. Inspired by Linear, Stripe Dashboard, Vercel Dashboard. Use shadcn/ui components as the base. No "old CRM" aesthetics.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APIFY_API_TOKEN=
SETTINGS_ENCRYPTION_KEY=    # AES-256-GCM for encrypting API keys stored in DB
EVOLUTION_WEBHOOK_SECRET=   # HMAC-SHA256 shared secret for webhook verification
GOOGLE_OAUTH_STATE_SECRET=  # CSRF token for Google OAuth flow
```

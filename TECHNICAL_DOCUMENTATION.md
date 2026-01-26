# TeenVest Project Technical Documentation

> **React 18 + Vite + TypeScript** financial literacy platform with **Supabase** backend

## 🏗️ Project Overview

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components  
- **Backend**: Supabase (Lovable Cloud) - PostgreSQL + Edge Functions
- **State Management**: TanStack React Query v5
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)

---

## 🔑 Environment Variables (Frontend)

Located in `.env` (auto-generated, do not modify directly):

```env
VITE_SUPABASE_PROJECT_ID="qhnxaehwrntkioyioxtk"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobnhhZWh3cm50a2lveWlveHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDgzMDksImV4cCI6MjA4Mzk4NDMwOX0.2fmvKJx00d9bEbnStyESNPf3pjd-mzuibGOXglEfPng"
VITE_SUPABASE_URL="https://qhnxaehwrntkioyioxtk.supabase.co"
```

**Usage in code:**
```typescript
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## 🗄️ Supabase Client

**Location**: `src/integrations/supabase/client.ts` (auto-generated, DO NOT EDIT)

```typescript
import { supabase } from "@/integrations/supabase/client";
```

---

## 🔐 Backend Secrets (Edge Functions)

Available in Edge Functions via `Deno.env.get()`:

| Secret Name | Description |
|-------------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) |
| `LOVABLE_API_KEY` | AI Gateway key for Lovable AI models |
| `POLYGON_API_KEY` | Polygon.io API key for stock candlestick data |

---

## 🌐 External APIs

### 5.1 Finnhub API (Stock Quotes)
- **API Key**: `d4ef1bpr01qrumpf5ojgd4ef1bpr01qrumpf5ok0` (hardcoded in finnhub-quote function)
- **Endpoints**:
  - Quote: `https://finnhub.io/api/v1/quote?symbol={SYMBOL}&token={KEY}`
  - Profile: `https://finnhub.io/api/v1/stock/profile2?symbol={SYMBOL}&token={KEY}`

### 5.2 External Stock API (Render)
- **Base URL**: `https://finnhub-stock-api-5xrj.onrender.com/api/stock`
- **Usage**: `GET /api/stock/{SYMBOL}` - Returns quote + profile data

### 5.3 Polygon.io API (Candlestick Charts)
- **API Key**: Stored as `POLYGON_API_KEY` secret
- **Endpoint**: `https://api.polygon.io/v2/aggs/ticker/{SYMBOL}/range/{multiplier}/{resolution}/{from}/{to}`

### 5.4 Lovable AI Gateway (AI Features)
- **Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **API Key**: `LOVABLE_API_KEY` (auto-provisioned)
- **Model**: `google/gemini-3-flash-preview` (default)
- **Supports streaming**: Yes

---

## ⚡ Edge Functions

| Function | JWT Required | Purpose |
|----------|--------------|---------|
| `chat` | No | AI chat assistant (TeenVest AI) |
| `learning-ai` | No | Learning coach AI |
| `portfolio-health-ai` | No | Portfolio analysis AI |
| `portfolio-timeline-ai` | No | Timeline analysis AI |
| `mistake-analysis-ai` | No | Trade mistake analysis |
| `market-news-explained` | No | News explanation AI |
| `stock-news` | No | Stock news fetcher |
| `polygon-candles` | No | Candlestick data from Polygon |
| `refresh-stock-cache` | No | Stock cache refresh |
| `finnhub-quote` | No | Stock quote from Finnhub |

**Calling Edge Functions from Frontend:**
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* payload */ }
});
```

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display_name, avatar_url, starting_balance, profile_public) |
| `portfolios` | User cash balances |
| `holdings` | User stock holdings |
| `trades` | Trade history |
| `watchlist` | User watchlist items |
| `achievements` | Achievement definitions |
| `user_achievements` | Earned achievements |
| `daily_streaks` | Login streak tracking |
| `learning_modules` | Lesson content |
| `user_progress` | Lesson completion tracking |
| `quiz_questions` | Quiz questions per module |
| `quiz_results` | Quiz scores |
| `stock_cache` | Cached stock data |
| `user_settings` | User preferences |
| `user_roles` | Admin roles (enum: app_role) |

---

## 🔧 Database Functions (RPC)

| Function | Purpose |
|----------|---------|
| `execute_trade(...)` | Atomic trade execution |
| `get_leaderboard()` | Returns top 10 + current user |
| `update_daily_streak(user_id)` | Updates login streaks |
| `get_public_profile(user_id)` | Safe public profile data |
| `has_role(user_id, role)` | Check if user has role |
| `is_owner(user_id)` | Check if user is owner |
| `get_platform_stats()` | Admin: platform statistics |
| `admin_lookup_user(email)` | Admin: lookup user by email |
| `admin_reset_portfolio(email)` | Admin: reset user portfolio |
| `admin_set_starting_balance(email, amount)` | Admin: set starting balance |
| `admin_grant_achievement(email, name)` | Admin: grant achievement |
| `get_all_admins()` | Owner: list all admins |
| `add_admin_by_email(email)` | Owner: add admin |
| `remove_admin_by_email(email)` | Owner: remove admin |

---

## 🔐 Authentication

**Provider**: Supabase Auth (Email/Password + Google OAuth)  
**Context**: `src/contexts/AuthContext.tsx`  
**Owner email**: `2landonl10@gmail.com` (checked via `is_owner()` function)

```typescript
import { useAuth } from '@/contexts/AuthContext';
const { user, session, signIn, signUp, signOut, signInWithGoogle } = useAuth();
```

---

## 🎯 Key Patterns

### Invoking AI from Edge Functions:
```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [...],
    stream: true, // or false
  }),
});
```

### Standard CORS Headers (Edge Functions):
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/integrations/supabase/client.ts` | Supabase client (DO NOT EDIT) |
| `src/integrations/supabase/types.ts` | Database types (DO NOT EDIT) |
| `src/contexts/AuthContext.tsx` | Authentication context |
| `src/hooks/useStockAPI.ts` | Stock data hooks |
| `supabase/config.toml` | Edge function config (DO NOT EDIT) |
| `supabase/functions/_shared/security.ts` | Security utilities (rate limiting, CSRF, CSP) |

---

## 👑 Admin Panel Notes

Admin access is checked via:
- `has_role(auth.uid(), 'admin')` 
- `is_owner(auth.uid())`

**Owner is hardcoded as**: `2landonl10@gmail.com`

---

## 🚀 Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

**Dev Server**: http://localhost:8081 (auto-finds available port)

---

## 📦 Key Dependencies

```json
{
  "react": "^18.2.0",
  "@tanstack/react-query": "^5.0.0",
  "supabase": "^2.0.0",
  "tailwindcss": "^3.4.0",
  "@radix-ui/*": "shadcn/ui components",
  "framer-motion": "^10.0.0",
  "date-fns": "^2.30.0"
}
```

---

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Rate limiting** on Edge Functions (`_shared/security.ts`)
- **CSRF protection** and **CSP headers**
- **JWT authentication** via Supabase Auth
- **Admin role checks** for sensitive operations

---

## 🎮 Garden Game System

The garden game uses localStorage for state persistence (`garden-state-v4`) and includes:
- **Stock system** with probability-based availability
- **Achievement system** for rare harvests
- **XP to money conversion** (8 XP = 1 coin)
- **Dynamic pricing** based on plant size
- **Admin updates** via custom events

---

## 📚 Learning System

- **XP rewards**: 50 XP for quizzes with ≥80% score
- **Beanstalk Game**: Interactive learning with AI-generated questions
- **Podcasts**: AI-generated lesson content
- **Progress tracking**: Module completion and quiz results
- **AI recommendations**: Personalized learning paths

---

*This documentation is maintained for external AI coders and developers working on the TeenVest project.*

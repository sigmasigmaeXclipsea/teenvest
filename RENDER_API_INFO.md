# Render API Location & Cold Start Info

## Where is the Render API?

Your Render API is hosted at:
**`https://finnhub-stock-api-5xrj.onrender.com/api/stock`**

This is a **separate Render service** that wraps the Finnhub API. It's not part of your main codebase - it's a backend API service.

## Cold Start Problem

**What happens:**
- Render free tier services **sleep after 15 minutes of inactivity**
- When someone tries to use your screener after 15+ minutes of no activity:
  1. Request hits the sleeping Render service
  2. Render wakes it up (takes 25-60 seconds)
  3. Then the API call processes (500-600ms)
  4. **Total delay: 25-60 seconds** 😱

**Where you see it:**
- When loading stocks in the screener
- When searching for stocks
- When viewing stock details
- Any time the app calls `fetchStockQuote()` or uses `useStockQuote()`

## How to Fix Cold Starts

### Option 1: FREE - Keepalive Service (Recommended First)
Use **UptimeRobot** (free, 50 monitors):
1. Sign up at https://uptimerobot.com
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://finnhub-stock-api-5xrj.onrender.com/api/stock/AAPL`
   - Interval: Every 10 minutes
3. This pings your API every 10 minutes, keeping it awake
4. **Result:** No more cold starts! ✅

### Option 2: Paid - Upgrade Render ($7/month)
Upgrade to **Render Starter Plan**:
- Services never sleep
- Always running = instant responses
- Faster baseline (200-300ms vs 500-600ms)

## Current Setup

Your code calls the Render API from:
- `src/hooks/useStockAPI.ts` - Line 3: `API_BASE_URL = "https://finnhub-stock-api-5xrj.onrender.com/api/stock"`
- `supabase/functions/refresh-stock-cache/index.ts` - Line 8: Same URL

The Render service itself is a separate codebase/repository that you'd need to access via Render dashboard.

# How to Set Up Keepalive for Render API

## 🎯 Simple Answer

**You only need to ping ONE endpoint** - it doesn't matter which stock. The keepalive just needs to "wake up" the service, not fetch all stocks.

---

## 📝 Step-by-Step Setup

### 1. Go to UptimeRobot
- Visit https://uptimerobot.com
- Sign up (free account)

### 2. Create New Monitor

**Settings:**
- **Monitor Type:** HTTP(s)
- **Friendly Name:** "Render Stock API Keepalive" (or any name)
- **URL:** `https://finnhub-stock-api-5xrj.onrender.com/api/stock/AAPL`
  - You can use ANY stock symbol (AAPL, MSFT, TSLA, etc.)
  - It doesn't matter which one - we just need to hit the service
- **Monitoring Interval:** Every 10 minutes
- **Alert Contacts:** (Optional - you can skip this)

### 3. Save and Done!

That's it! The monitor will ping your API every 10 minutes, keeping it awake.

---

## 🤔 Why Just One Stock?

**The keepalive doesn't need to fetch all stocks.** It just needs to:
1. Make a request to your Render service
2. Wake it up if it's sleeping
3. Keep it active

**Any stock symbol works** because:
- The API endpoint is the same: `/api/stock/{SYMBOL}`
- We're just checking if the service responds
- We don't care about the actual data returned

---

## ✅ What Happens

**Before keepalive:**
- User visits screener after 15+ min inactivity
- Render service is sleeping
- Takes 25-60 seconds to wake up
- User sees slow loading 😞

**After keepalive:**
- UptimeRobot pings every 10 minutes
- Service never sleeps
- User gets instant response (< 1 second)
- No cold starts! 🚀

---

## 🔄 Alternative: Multiple Monitors (Not Needed)

You *could* set up multiple monitors for different stocks, but it's **completely unnecessary**:
- One ping = wakes up entire service
- Multiple pings = same result, just wastes resources
- **One monitor is enough!**

---

## 📊 Example URLs You Could Use

Any of these work:
- `https://finnhub-stock-api-5xrj.onrender.com/api/stock/AAPL`
- `https://finnhub-stock-api-5xrj.onrender.com/api/stock/MSFT`
- `https://finnhub-stock-api-5xrj.onrender.com/api/stock/TSLA`

**Just pick one** - I recommend AAPL since it's a popular stock that's always available.

---

## 🎯 Summary

1. **One monitor is enough** - doesn't matter which stock
2. **Ping every 10 minutes** - keeps service awake
3. **Use any stock symbol** - AAPL, MSFT, TSLA, etc.
4. **Result:** No more cold starts! ✅

**The keepalive is like a "heartbeat"** - it just checks if your service is alive, not what data it returns.

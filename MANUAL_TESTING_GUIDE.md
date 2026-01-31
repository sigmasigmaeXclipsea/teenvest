# 🧪 TeenVest v1.0.0 - Manual Testing Guide
**For Release Engineering Team**  
**Target Release**: Feb 7-13, 2026

---

## 🎯 TESTING PRIORITY LEVELS

### 🔴 CRITICAL (Must Pass)
These features MUST work flawlessly before launch:
- Authentication (login/signup/logout)
- Trading system (buy/sell/portfolio calculations)
- Quiz Points system (earning and spending)
- Core navigation (all major pages load)

### 🟡 HIGH (Should Pass)
Important features that significantly impact UX:
- Interactive lesson blocks
- Beanstalk Adventure game
- Leaderboard rankings
- Garden planting/harvesting

### 🟢 MEDIUM (Nice to Have)
Features that enhance experience but aren't blockers:
- AI chat assistants
- Profile customization
- Advanced research tools

---

## 🔐 AUTHENTICATION TESTING

### Test 1: New User Signup
**URL**: `/signup`

**Steps**:
1. Enter display name: "Test User"
2. Enter email: `test+${Date.now()}@example.com`
3. Enter password: `TestPass123!`
4. Click "Sign Up"

**Expected**:
- ✅ Success toast: "Welcome to TeenVest!"
- ✅ Redirects to `/dashboard`
- ✅ User sees starting portfolio ($10,000 cash)
- ✅ User sees starting XP (0 XP)

**If Fails**: Check browser console for auth errors

---

### Test 2: Login with Email
**URL**: `/login`

**Steps**:
1. Enter email from Test 1
2. Enter password from Test 1
3. Check "Stay logged in"
4. Click "Sign In"

**Expected**:
- ✅ Success toast: "Welcome back!"
- ✅ Redirects to `/dashboard`
- ✅ User sees their existing portfolio

**If Fails**: Check if email verification is required

---

### Test 3: Google OAuth Login
**URL**: `/login`

**Steps**:
1. Click "Sign in with Google"
2. Select Google account
3. Authorize TeenVest

**Expected**:
- ✅ Redirects to `/dashboard`
- ✅ Creates new user if first time
- ✅ Portfolio initialized

**If Fails**: Check Google OAuth configuration in Supabase

---

### Test 4: Session Persistence
**Steps**:
1. Login successfully
2. Close browser tab
3. Open new tab to TeenVest
4. Navigate to `/dashboard`

**Expected**:
- ✅ User still logged in (if "Stay logged in" checked)
- ✅ Redirects to login if not checked

---

### Test 5: Logout
**Steps**:
1. While logged in, click user menu
2. Click "Logout"

**Expected**:
- ✅ Redirects to landing page (`/`)
- ✅ Trying to access `/dashboard` redirects to `/login`

---

## 💰 TRADING SYSTEM TESTING

### Test 6: Buy Stock
**URL**: `/trade`

**Steps**:
1. Search for "AAPL"
2. Click on Apple Inc.
3. Enter shares: 10
4. Click "Buy"

**Expected**:
- ✅ Success toast: "Successfully bought 10 shares of AAPL"
- ✅ Cash balance decreases
- ✅ Portfolio shows AAPL position
- ✅ Transaction appears in history

**Verify Calculations**:
- Cash after = Cash before - (Price × Shares)
- Portfolio value = Cash + (All positions market value)

---

### Test 7: Sell Stock
**URL**: `/trade`

**Steps**:
1. Go to stock you own (from Test 6)
2. Enter shares to sell: 5
3. Click "Sell"

**Expected**:
- ✅ Success toast: "Successfully sold 5 shares of AAPL"
- ✅ Cash balance increases
- ✅ Position size decreases to 5 shares
- ✅ Transaction in history

---

### Test 8: Portfolio Calculations
**URL**: `/dashboard`

**Manual Calculation**:
```
Expected Total Value = Cash Balance + Σ(Shares × Current Price for each position)
Expected P/L = Total Value - $10,000 (starting balance)
Expected P/L % = (P/L / $10,000) × 100
```

**Verify**:
- ✅ Total portfolio value matches manual calculation
- ✅ Gain/Loss percentage accurate
- ✅ Individual position P/L accurate

---

## 🎓 LEARNING SYSTEM TESTING

### Test 9: Complete a Lesson
**URL**: `/learn`

**Steps**:
1. Click any lesson module
2. Read through content
3. Scroll to bottom
4. Click "Mark as Complete"

**Expected**:
- ✅ Success toast: "Lesson completed! 🎉"
- ✅ Toast shows: "+10 XP and +10 Quiz Points"
- ✅ Check `/garden` - Quiz Points balance increased by 10
- ✅ Lesson shows checkmark/completed state

---

### Test 10: Take a Quiz
**URL**: `/learn` → Select lesson with quiz

**Steps**:
1. Complete lesson content
2. Answer all quiz questions
3. Click "Submit Quiz"

**Expected**:
- ✅ Score calculated correctly
- ✅ Quiz Points awarded based on score:
  - 100%: +50 points
  - 80-99%: +30 points
  - 60-79%: +15 points
  - <60%: +5 points
- ✅ Success toast shows points earned
- ✅ Quiz Points balance updated

---

### Test 11: Interactive Blocks
**Find lessons with each block type and verify**:

#### Candlestick Builder
- ✅ Sliders move open/high/low/close values
- ✅ Visual candlestick updates in real-time
- ✅ Values stay within constraints
- ✅ Bullish/bearish indication correct

#### Chart Annotator
- ✅ Click to add support/resistance lines
- ✅ Lines appear on chart
- ✅ Max 5 lines enforced
- ✅ "Clear" button removes all lines

#### Mini Quiz
- ✅ Radio buttons for answers
- ✅ Submit shows correct/incorrect
- ✅ Feedback text displays
- ✅ Can retry on wrong answer

#### Trade Simulator
- ✅ Price updates simulate market
- ✅ Buy/Sell buttons work
- ✅ Position tracking accurate
- ✅ P/L calculation correct

---

### Test 12: Beanstalk Adventure
**URL**: `/learn` → Open lesson → Click "Play Beanstalk Adventure"

**Steps**:
1. Click "Start Game"
2. Use spacebar to jump
3. Wait for first question to appear
4. Answer question correctly
5. Continue playing to height 2000

**Expected**:
- ✅ Game loads without errors
- ✅ Questions load from database (not AI)
- ✅ Questions appear at regular intervals
- ✅ Correct answers: Score +10, continue playing
- ✅ Wrong answers: Score +0, continue playing
- ✅ Reaching height 2000 shows completion screen
- ✅ Final score displayed

**If Questions Don't Load**:
- Check browser console for errors
- Verify `module_id` has questions in `quiz_questions` table

---

## 🌱 GARDEN SYSTEM TESTING

### Test 13: Buy Seeds with Quiz Points
**URL**: `/garden`

**Prerequisites**: Have Quiz Points from Tests 9-10

**Steps**:
1. Click "Shop" tab
2. Find a seed in stock (green "In Stock" badge)
3. Note price in Quiz Points
4. Click seed to select
5. Click on garden to plant

**Expected**:
- ✅ Quiz Points deducted (not money)
- ✅ Seed removed from inventory
- ✅ Plant appears on garden at click position
- ✅ Growth timer starts

---

### Test 14: Water Plants
**Steps**:
1. Have at least one planted seed
2. Click "Water" mode
3. Click on planted seed

**Expected**:
- ✅ Water droplet animation
- ✅ Growth time reduced by 20 minutes
- ✅ Plant shows "last watered" timestamp
- ✅ Wilting prevented (if plant was wilting)

---

### Test 15: Harvest Plants
**Steps**:
1. Plant a fast-growing seed (Radish: 30 min)
2. Wait for growth time OR advance browser time
3. Click mature plant

**Expected**:
- ✅ Harvest animation/sound
- ✅ Coins added to balance
- ✅ Plant moves to "Harvested" tab
- ✅ Shows variant (normal/golden/etc.)
- ✅ Can sell for coins

---

## 🏆 LEADERBOARD TESTING

### Test 16: Portfolio Rankings
**URL**: `/leaderboard`

**Steps**:
1. View leaderboard (default: Portfolio mode)
2. Check top 3 featured cards
3. Scroll through paginated list
4. Find your own rank

**Expected**:
- ✅ Rankings sorted by total portfolio value
- ✅ Top 3 shown in featured cards
- ✅ Your rank highlighted with "You" badge
- ✅ Pagination works (if >10 users)
- ✅ Gain % shows green/red correctly

---

### Test 17: Rank Mode
**Steps**:
1. Click "Rank" button to switch modes
2. View XP-based rankings

**Expected**:
- ✅ Rankings sorted by XP
- ✅ Shows rank names (Bronze/Silver/Gold/etc.)
- ✅ Your rank highlighted
- ✅ XP amounts displayed

---

## 🤖 AI FEATURES TESTING

### Test 18: AI Chat Bot
**URL**: Any page with chat widget (bottom right)

**Steps**:
1. Click chat widget button
2. Type: "What is diversification?"
3. Send message

**Expected**:
- ✅ Chat opens
- ✅ AI responds in ~2-5 seconds
- ✅ Response uses markdown formatting (`**bold**`, `*italic*`)
- ✅ Markdown renders correctly (not raw text)
- ✅ Response is teen-friendly language

**Test Markdown**:
- AI uses `**bold**` → Should show as **bold**
- AI uses `*italic*` → Should show as *italic*

---

### Test 19: AI Lesson Assistant
**URL**: `/learn` → Select lesson

**Steps**:
1. Scroll to "Ask AI Tutor" card
2. Click suggested question OR type custom
3. Submit

**Expected**:
- ✅ AI responds with lesson context
- ✅ Answer relates to current topic
- ✅ Markdown formatting works

---

## 📱 RESPONSIVE DESIGN TESTING

### Test 20: Mobile View (320px - 768px)
**Devices to Test**:
- iPhone SE (375×667)
- iPhone 12 (390×844)
- Galaxy S21 (360×800)

**Pages to Check**:
1. `/` - Landing page
2. `/dashboard` - Portfolio cards stack vertically
3. `/trade` - Trading interface usable
4. `/learn` - Lessons readable
5. `/garden` - Garden interactive on touch

**Expected**:
- ✅ No horizontal scroll
- ✅ Text readable without zooming
- ✅ Buttons large enough to tap (min 44px)
- ✅ Navigation menu accessible
- ✅ Charts/graphs responsive

---

### Test 21: Tablet View (768px - 1024px)
**Devices to Test**:
- iPad (810×1080)
- iPad Pro (1024×1366)

**Expected**:
- ✅ Layout adapts to wider screen
- ✅ Sidebar navigation shows
- ✅ Dashboard uses grid layout
- ✅ Charts utilize extra space

---

### Test 22: Desktop View (1024px+)
**Resolutions to Test**:
- 1920×1080 (Full HD)
- 2560×1440 (2K)
- 3840×2160 (4K)

**Expected**:
- ✅ Sidebar always visible
- ✅ Content max-width prevents stretching
- ✅ Charts scale appropriately
- ✅ No layout breaks at 4K

---

## 🌐 CROSS-BROWSER TESTING

### Required Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest - Mac/iOS only)
- ✅ Edge (latest)

### For Each Browser, Test:
1. Login/signup flow
2. Trading (buy/sell)
3. One complete lesson
4. Garden interaction
5. AI chat

**Known Issues to Watch**:
- Safari: Sometimes stricter CORS policies
- Firefox: localStorage behavior
- Edge: Usually matches Chrome (Chromium)

---

## ⚡ PERFORMANCE TESTING

### Test 23: Page Load Times
**Tools**: Chrome DevTools → Network tab

**Measure**:
- `/` (Landing): Target < 2s
- `/dashboard`: Target < 3s
- `/learn`: Target < 2s
- `/trade`: Target < 3s

**How to Test**:
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Reload page
5. Look at "Load" time at bottom

**Expected**:
- ✅ All pages < 3s on decent connection
- ✅ Interactive within 5s

---

### Test 24: Lighthouse Audit
**Tools**: Chrome DevTools → Lighthouse

**Run On**:
- Landing page (`/`)
- Dashboard (`/dashboard`)

**Target Scores**:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

---

## 🚨 ERROR HANDLING TESTING

### Test 25: Network Errors
**Steps**:
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to load dashboard
4. Try to make a trade

**Expected**:
- ✅ Error message shown (not crash)
- ✅ User-friendly error text
- ✅ Retry option available
- ✅ App doesn't break

---

### Test 26: Invalid Data
**Steps**:
1. Try to buy -5 shares
2. Try to buy 999999999999 shares
3. Try to sell more shares than owned

**Expected**:
- ✅ Validation prevents submission
- ✅ Helpful error message
- ✅ No crash or infinite loading

---

## 📋 TESTING CHECKLIST SUMMARY

### Before Launch, Verify:
- [ ] All 26 tests passed
- [ ] No critical errors in browser console
- [ ] Mobile responsive on real devices
- [ ] Cross-browser compatibility
- [ ] Page load times acceptable
- [ ] Error handling graceful
- [ ] Database backups configured
- [ ] Environment variables correct

### If Any Test Fails:
1. Document the exact failure
2. Check browser console for errors
3. Check network tab for failed requests
4. Note browser, OS, device info
5. Create bug report with reproduction steps

### Post-Launch (First 24h):
- [ ] Monitor error tracking (Sentry/similar)
- [ ] Check user signup rate
- [ ] Monitor AI API costs
- [ ] Check database performance
- [ ] Gather user feedback

---

**Testing Completion**: _____ / 26 tests passed  
**Ready for Production**: ⬜ YES ⬜ NO (needs fixes)  
**Tested By**: _____________  
**Date**: _____________

---

**IMPORTANT**: Document all failures with screenshots and console errors. No test should be marked "passed" without actual verification.

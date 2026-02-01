# 🏆 TeenVest Tournament System - Feature Specification

## 📋 Overview
A competitive trading tournament system where users can compete against friends or the public for prizes and bragging rights. Separate from main portfolio with customizable starting balances and time periods.

---

## 🎯 Core Features

### 1. Tournament Hub Page (`/tournaments`)
**Layout**:
- Header with "🏆 Tournaments" title
- VS logo prominently displayed
- Two main sections: "Public Tournaments" and "Private Tournaments"
- "Create Tournament" button (floating action button)
- Beta version badge indicator

**Visual Elements**:
- VS symbol (could be styled swords, lightning bolt, or competitive icon)
- Tournament cards showing: prize pool, participants, time remaining
- Live price tickers for active tournaments
- Leaderboard preview for each tournament

---

### 2. Tournament Creation Flow

#### Create Tournament Modal
**Fields Required**:
- Tournament Name
- Tournament Type: [Public] [Private]
- Starting Balance Options: [$5,000] [$10,000] [$25,000] [$50,000] [$100,000] [Custom]
- Duration: [1 Day] [1 Week] [1 Month] [Custom Date Range]
- Entry Fee (Quiz Points): Free / 50 / 100 / 200 points
- Max Participants: 10 / 25 / 50 / 100 / Unlimited
- Prize Description (for public tournaments)

**Advanced Options**:
- Allowed Stocks (All / Specific sectors / Custom list)
- Short Selling Allowed: Yes/No
- Margin Trading: Yes/No
- Rebuys Allowed: Yes/No

---

### 3. Tournament Types

#### Public Tournaments
- **Discoverable by all users**
- **Prize pools funded by platform or sponsors**
- **Entry fees in Quiz Points**
- **Leaderboard visible to all**
- **Featured tournaments on main page**

#### Private Tournaments
- **Invite-only with shareable code**
- **Host sets all parameters**
- **No entry fee (or custom)**
- **Friends compete against each other**
- **Custom prize (bragging rights or Quiz Points)**

---

### 4. Tournament Portfolio System

#### Separate Portfolio Instance
- **Isolated from main portfolio**
- **Starting balance set by host**
- **Real-time price updates**
- **Same trading interface as main portfolio**
- **Tournament-specific P/L tracking**

#### Trading Features
- Buy/sell functionality
- Real-time price data
- Position tracking
- Transaction history
- P/L calculations
- Rankings update in real-time

---

### 5. Tournament Phases

#### Pre-Tournament (Lobby)
- Players can join
- Chat room for participants
- Rules display
- Countdown to start
- Host can start early if all joined

#### Active Tournament
- Live trading
- Real-time leaderboard
- Performance metrics
- Time remaining display
- Participant status (active/eliminated)

#### Post-Tournament (Results)
- Final rankings
- Prize distribution
- Performance summary
- Share results
- Tournament history

---

## 🎨 UI/UX Design

### Tournament Card Design
```
┌─────────────────────────────┐
│ 🏆 [Tournament Name]        │
│ ─────────────────────────── │
│ 💰 Prize: [Prize Description]│
│ 👥 Players: 15/25           │
│ ⏰ Time: 2d 14h 32m         │
│ 💵 Starting: $10,000        │
│                             │
│ [JOIN TOURNAMENT]           │
└─────────────────────────────┘
```

### VS Symbol Design
- Could be:
  - ⚔️ Crossed swords
  - ⚡ Lightning bolt
  - 🎯 Target icon
  - Custom VS logo
- Prominently displayed on tournament pages
- Animated during active tournaments

### Beta Badge
- Fixed position: bottom right corner
- Style: Yellow/orange badge with "BETA" text
- Non-intrusive but visible
- Clickable for feedback

---

## 📊 Tournament Leaderboard

#### Real-time Rankings
```
Rank | Player | Portfolio Value | P/L | Change
----- | ------ | --------------- | --- | -----
🥇 1st | Player1 | $12,450 | +24.5% | ↑ $450
🥈 2nd | Player2 | $11,230 | +12.3% | ↑ $230
🥉 3rd | Player3 | $10,890 | +8.9%  | ↑ $90
4th  | Player4 | $10,450 | +4.5%  | ↓ $50
```

#### Performance Metrics
- Current portfolio value
- P/L percentage
- Best trade
- Win rate
- Risk score

---

## 💬 Feedback System

### Feedback Button
- Location: Bottom right (next to beta badge)
- Icon: 💬 or 📝
- Opens feedback modal

### Feedback Categories
- Bug Report
- Feature Request
- General Feedback
- Tournament Issues

### Feedback Form Fields
- Category selection
- Subject line
- Detailed description
- Screenshot upload
- Email (optional)
- Severity level

### Feedback Management
- Store in Supabase `feedback` table
- Dashboard for admin review
- Status tracking (new/in-progress/resolved)
- User notifications for updates

---

## 🛠️ Technical Implementation

### Database Schema

#### `tournaments` Table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  host_id UUID REFERENCES auth.users(id),
  starting_balance DECIMAL NOT NULL,
  entry_fee_quiz_points INTEGER DEFAULT 0,
  max_participants INTEGER,
  prize_description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  allowed_stocks TEXT[], -- Array of stock symbols
  short_selling_allowed BOOLEAN DEFAULT false,
  margin_trading_allowed BOOLEAN DEFAULT false,
  rebuys_allowed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `tournament_participants` Table
```sql
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES auth.users(id),
  join_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  final_portfolio_value DECIMAL,
  final_rank INTEGER,
  UNIQUE(tournament_id, user_id)
);
```

#### `tournament_portfolios` Table
```sql
CREATE TABLE tournament_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES auth.users(id),
  cash_balance DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `tournament_trades` Table
```sql
CREATE TABLE tournament_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT NOT NULL,
  shares INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `feedback` Table
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  email TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints (Supabase Functions)

#### Tournament Management
- `create-tournament` - Create new tournament
- `join-tournament` - User joins tournament
- `leave-tournament` - User leaves tournament
- `get-tournaments` - List available tournaments
- `get-tournament-details` - Get specific tournament info

#### Trading in Tournaments
- `tournament-buy-stock` - Buy stock in tournament
- `tournament-sell-stock` - Sell stock in tournament
- `get-tournament-portfolio` - Get tournament portfolio
- `get-tournament-leaderboard` - Get rankings

#### Feedback
- `submit-feedback` - Save user feedback
- `get-feedback` - Admin view of feedback

### Real-time Updates
- Use Supabase Realtime for:
  - Leaderboard updates
  - Tournament status changes
  - New participant joins
  - Trade confirmations

---

## 📱 Mobile Considerations

### Responsive Design
- Tournament cards stack vertically
- Leaderboard scrolls horizontally on small screens
- Create tournament form in modal
- VS symbol scales appropriately

### Touch Interactions
- Large tap targets for buttons
- Swipe gestures for tournament cards
- Pull-to-refresh for tournament list

---

## 🚀 Launch Strategy

### Phase 1: Beta Release
- Private tournaments only
- Limited to friends of existing users
- Feedback collection focused
- No prize pools initially

### Phase 2: Public Beta
- Public tournaments with small prizes
- Increased user limits
- Enhanced features based on feedback
- Marketing push

### Phase 3: Full Launch
- Large prize tournaments
- Sponsor partnerships
- Advanced features (margin, short selling)
- Tournament seasons and rankings

---

## 🎯 Success Metrics

### Engagement Metrics
- Tournament participation rate
- Average tournament duration
- Return player rate
- Social sharing frequency

### Technical Metrics
- Tournament creation success rate
- Real-time update latency
- Portfolio calculation accuracy
- System uptime during tournaments

---

## 🚨 Risk Mitigation

### Technical Risks
- Portfolio calculation errors → Double-check calculations
- Real-time update failures → Fallback to polling
- Concurrent trading issues → Database transactions
- Server load during peaks → Scalable architecture

### Business Risks
- Low participation → Gamification incentives
- Cheating/exploits → Monitoring and penalties
- Prize cost issues → Clear terms and conditions

---

## 📝 Implementation Checklist

### Pre-Launch
- [ ] Database migrations created
- [ ] API endpoints implemented
- [ ] UI components built
- [ ] Real-time subscriptions set up
- [ ] Beta badge implemented
- [ ] Feedback system integrated
- [ ] Testing with internal users

### Launch Day
- [ ] Feature flag for tournaments
- [ ] Monitor system performance
- [ ] Collect initial feedback
- [ ] Address critical issues quickly

### Post-Launch
- [ ] Analyze usage data
- [ ] Implement requested features
- [ ] Optimize performance
- [ ] Plan next tournament season

---

## 🎨 Visual Mockups Description

### Tournament Hub Page
- Hero section with VS logo and "Compete & Win" tagline
- Tab switcher for Public/Private tournaments
- Grid of tournament cards with hover effects
- Floating "Create Tournament" button
- Beta badge in bottom right

### Tournament Creation Modal
- Multi-step form with progress indicator
- Preview card showing tournament settings
- Invite friends section for private tournaments
- Create and share tournament code

### Active Tournament View
- Large timer showing time remaining
- Live leaderboard with animations
- Quick trade panel
- Chat sidebar for participants
- Performance charts

---

**Note**: This is a specification document only. No code changes have been made to the actual application. Implementation should follow this design when the feature is ready to be developed.

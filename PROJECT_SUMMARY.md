# TeenVest - Teen Financial Literacy App

## 🎯 Project Overview
TeenVest is a comprehensive financial literacy web application designed specifically for teenagers to learn about investing, trading, and money management through interactive experiences.

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Auth, Edge Functions)
- **UI Components**: Shadcn/ui component library
- **State Management**: React Query, React Context
- **Authentication**: Supabase Auth
- **Deployment**: Lovable hosting, Ionis DNS
- **Domain**: .com domain

## 📱 Core Features

### 1. Trading Simulation
- **Real-time stock data** integration
- **Portfolio management** with buy/sell functionality
- **Virtual cash balance** system
- **Transaction history** tracking
- **Advanced candlestick charts** (with settings toggle)
- **News integration** using Gemini Flash 3 AI

### 2. Learning System
- **40+ learning modules** organized by difficulty
- **Interactive quizzes** with progress tracking
- **AI-powered podcast narration** (lesson summaries)
- **Beanstalk climbing game** for educational engagement
- **Achievement system** with badges and rewards
- **XP and progression** tracking

### 3. Gamified Garden
- **40 different seeds** across 7 rarity tiers
- **RNG-based harvest system** with jackpot mechanics
- **Shop system** with seeds and gear upgrades
- **5 different sprinklers** with varying bonuses
- **Visual rarity system** with animated effects
- **Growth time management** (15-360 minutes)

### 4. User Management
- **Admin panel** with user management tools
- **Leaderboard system** for competition
- **Profile customization**
- **Settings management** (advanced mode toggle)
- **Progress tracking** and analytics

## 🎨 Design System
- **Modern, clean interface** with cartoony elements
- **Responsive design** (mobile-first approach)
- **Smooth animations** and micro-interactions
- **Color-coded rarity system** for visual hierarchy
- **Accessibility** considerations throughout

## 📊 Recent Major Updates

### Garden Game Enhancements
- **40 seeds total**: Common → Exotic rarities
- **Dragon Fruit** as Mythic tier (not the best)
- **Legendary seeds**: Phoenix Feather, Unicorn Tear, Thunder Crystal
- **Exotic seeds**: Cosmic Melon, Infinity Star (ultimate)
- **RNG size system**: 2% jackpot chance for 2x-3.5x harvests
- **5 sprinkler types**: 10%-50% golden chance bonuses

### Learning Features
- **Lesson Podcasts**: AI-narrated using Gemini Flash 3
- **Beanstalk Game**: Educational climbing game with lesson questions
- **Interactive content**: Enhanced engagement through gameplay

### UI/UX Improvements
- **Mobile menu**: Smooth sliding sheet with proper navigation
- **Candlestick charts**: Conditional display based on advanced mode
- **Visual enhancements**: Better animations and transitions

## 🏗️ Architecture Highlights

### Database Schema
- **User management**: profiles, roles, settings
- **Trading data**: portfolios, holdings, transactions
- **Learning system**: modules, progress, quiz results
- **Garden game**: seeds, gear, garden updates
- **Admin features**: achievement tracking, user analytics

### Key Components
- **DashboardLayout**: Main application shell
- **GamifiedGarden**: Core garden game logic
- **Learning modules**: LessonPage and LessonPodcast
- **Trading system**: TradePage with real-time data
- **Admin panel**: User management and analytics

### API Integrations
- **Stock data**: Real-time market information
- **Gemini Flash 3**: AI for news generation and lesson content
- **Supabase Edge Functions**: Serverless API endpoints

## 🚀 Deployment & Infrastructure
- **Production**: https://your-domain.com
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with social providers
- **File Storage**: Supabase Storage for assets
- **CI/CD**: Automated deployment pipeline

## 🎯 Current Development Focus
- **UX improvements**: Mobile responsiveness and animations
- **Feature expansion**: New learning content and game mechanics
- **Performance optimization**: Load times and data efficiency
- **Admin enhancements**: Advanced user management tools

## 📝 Development Guidelines
- **Code style**: TypeScript strict mode, ESLint configuration
- **Component patterns**: Functional components with hooks
- **State management**: React Query for server state, Context for UI state
- **Testing**: Component testing with React Testing Library
- **Git workflow**: Feature branches with pull requests

## 🔧 Key Files & Directories
```
src/
├── components/
│   ├── layouts/DashboardLayout.tsx    # Main app shell
│   ├── GamifiedGarden.tsx              # Garden game component
│   ├── LessonPodcast.tsx               # AI narration component
│   └── BeanstalkGame.tsx               # Educational game
├── pages/
│   ├── TradePage.tsx                   # Trading interface
│   ├── LearnPage.tsx                   # Learning hub
│   ├── GardenPage.tsx                  # Garden game page
│   └── AdminPage.tsx                   # Admin dashboard
├── hooks/
│   ├── useLearning.ts                  # Learning system hooks
│   ├── usePortfolio.ts                 # Trading data hooks
│   └── useAchievementTracker.ts        # Achievement system
└── contexts/
    ├── AuthContext.tsx                 # Authentication state
    └── SettingsContext.tsx             # User preferences
```

## 🎮 Game Mechanics

### Garden Economy
- **Starting money**: 50 coins
- **Seed prices**: 10-20,000 coins based on rarity
- **Growth times**: 15-360 minutes
- **Harvest RNG**: 2% jackpot for massive payouts
- **Gear upgrades**: Sprinklers, watering cans, plot expansions

### Learning Progression
- **Module structure**: Content → Quiz → Game
- **XP rewards**: For completing lessons and quizzes
- **Achievement system**: Badges for milestones
- **Difficulty scaling**: Beginner → Advanced content

## 📈 Analytics & Tracking
- **User engagement**: Lesson completion, garden activity
- **Trading performance**: Portfolio growth, transaction analysis
- **Learning progress**: Quiz scores, time spent learning
- **Game metrics**: Harvest rates, achievement unlocks

## 🔮 Future Roadmap
- **Mobile app**: React Native implementation
- **Advanced trading**: Options, futures simulation
- **Social features**: Study groups, competitions
- **Parent dashboard**: Progress monitoring for parents
- **School integration**: Classroom tools for teachers

---

**Last Updated**: January 2026
**Version**: 2.0+
**Development Team**: 2 developers
**Target Audience**: Teenagers (13-19) interested in financial literacy

# 🏆 VS Tournament Dashboard Preview Card

## 📍 Location

### Dashboard Page Placement
- **Page**: Dashboard (`/dashboard`)
- **Position**: Main content area, top section (where arrow points)
- **Layout**: Full-width banner card or prominent card in grid
- **Above or alongside**: Portfolio cards and quick actions

## 🎨 Design Options

### Option 1: Full-Width Banner
```tsx
// At the top of dashboard content
<div className="mb-6">
  <div 
    onClick={openComingSoonModal}
    className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 
               rounded-2xl p-8 cursor-pointer
               transform transition-all duration-300 
               hover:scale-[1.01] hover:shadow-2xl
               relative overflow-hidden group"
  >
    {/* Animated Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-1/4 w-96 h-96 
                      bg-white rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 
                      bg-white rounded-full blur-3xl animate-pulse 
                      animation-delay-1000" />
    </div>
    
    <div className="relative z-10 flex items-center justify-between">
      {/* Left Side - VS Symbol and Title */}
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl font-black text-white drop-shadow-2xl">
            ⚔️ VS
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Trading Tournaments
            </h1>
            <p className="text-white/90 text-lg">
              Compete. Win. Dominate.
            </p>
          </div>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2">
          <span className="bg-white/20 backdrop-blur-sm text-white 
                         px-4 py-2 rounded-full text-sm font-medium">
            🏆 Win Prizes
          </span>
          <span className="bg-white/20 backdrop-blur-sm text-white 
                         px-4 py-2 rounded-full text-sm font-medium">
            👥 Play with Friends
          </span>
          <span className="bg-white/20 backdrop-blur-sm text-white 
                         px-4 py-2 rounded-full text-sm font-medium">
            💰 $10K - $100K Portfolios
          </span>
        </div>
      </div>
      
      {/* Right Side - Coming Soon */}
      <div className="text-center">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
          <div className="text-5xl mb-2">🚀</div>
          <div className="text-white font-bold text-lg mb-1">
            COMING SOON
          </div>
          <div className="text-white/80 text-sm">
            Click to learn more
          </div>
        </div>
      </div>
    </div>
    
    {/* Hover Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                    via-white/10 to-transparent opacity-0 
                    group-hover:opacity-100 transition-opacity 
                    duration-500" />
  </div>
</div>
```

### Option 2: Grid Card (Portfolio Style)
```tsx
// As part of the dashboard grid
<Card 
  onClick={openComingSoonModal}
  className="bg-gradient-to-br from-purple-600 to-blue-600 
             border-none cursor-pointer
             transform transition-all duration-200 
             hover:scale-[1.02] hover:shadow-xl
             relative overflow-hidden group"
>
  <CardContent className="p-6">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute -top-4 -right-4 w-24 h-24 
                      bg-white rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 
                      bg-white rounded-full" />
    </div>
    
    <div className="relative z-10 text-center">
      {/* VS Symbol */}
      <div className="text-5xl font-black text-white mb-3">
        ⚔️ VS
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">
        Trading Tournaments
      </h3>
      
      <p className="text-white/90 text-sm mb-4">
        Compete against traders worldwide
      </p>
      
      {/* Features */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <span>🏆</span>
          <span>Prize Pools</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <span>⚡</span>
          <span>Live Trading</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <span>👥</span>
          <span>Private Matches</span>
        </div>
      </div>
      
      {/* Coming Soon Badge */}
      <Badge className="bg-white/20 text-white hover:bg-white/30 
                     border-white/30">
        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
        COMING SOON
      </Badge>
    </div>
  </CardContent>
</Card>
```

## 🔧 Implementation

### File Structure
```
src/
├── components/
│   ├── TournamentDashboardPreview.tsx
│   ├── TournamentComingSoonModal.tsx
│   └── FeedbackButton.tsx
└── pages/
    └── DashboardPage.tsx (modify)
```

### Dashboard Integration
```tsx
// In DashboardPage.tsx
import TournamentDashboardPreview from '@/components/TournamentDashboardPreview';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Tournament Preview Banner */}
        <TournamentDashboardPreview />
        
        {/* Existing Dashboard Content */}
        <div className="grid gap-6">
          {/* Portfolio cards, quick actions, etc. */}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### Feedback Button Component
```tsx
// src/components/FeedbackButton.tsx
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 
                   bg-primary text-primary-foreground 
                   p-4 rounded-full shadow-lg 
                   hover:shadow-xl transform transition-all 
                   hover:scale-110 group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-8 right-0 
                       bg-gray-900 text-white text-xs 
                       px-2 py-1 rounded opacity-0 
                       group-hover:opacity-100 transition-opacity">
          Feedback
        </span>
      </button>
      
      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center 
                        justify-center z-50 p-4">
          <div className="bg-background rounded-2xl max-w-md 
                          w-full p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-4">
              Share Your Feedback
            </h3>
            
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option>General Feedback</option>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Tournament Ideas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Feedback
                </label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows={4}
                  placeholder="Tell us what you think..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email (optional)
                </label>
                <input 
                  type="email" 
                  className="w-full p-2 border rounded-lg"
                  placeholder="your@email.com"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground 
                           py-2 rounded-lg hover:bg-primary/90"
              >
                Send Feedback
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

## 📱 Mobile Considerations

### Responsive Design
- Banner: Stack content vertically on mobile
- Grid card: Takes full width on mobile
- Feedback button: Bottom right, easily accessible

### Touch Interactions
- Large tap targets
- Smooth animations
- Prevent accidental clicks

## 🚀 Auto-Push to Lovable

### GitHub Actions Workflow
```yaml
# .github/workflows/auto-push-to-lovable.yml
name: Auto Push to Lovable

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Lovable
        run: |
          # Lovable automatically deploys on main branch push
          echo "Deployment triggered by GitHub push"
```

### Manual Push Command
```bash
# After any changes:
git add .
git commit -m "Update tournament preview"
git push origin main
# Lovable will automatically deploy
```

## ⚡ Beta Badge

### Add to Header
```tsx
// In DashboardLayout header
<div className="flex items-center gap-2">
  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
    BETA
  </Badge>
</div>
```

## 📊 Database Schema for Feedback

### Feedback Table
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Implementation Steps

1. **Create Tournament Dashboard Preview Component**
   - Choose banner or grid card design
   - Add animations and interactions
   - Implement modal on click

2. **Create Feedback Button Component**
   - Fixed position button
   - Feedback form modal
   - Database integration

3. **Add to Dashboard**
   - Import components
   - Place at top of dashboard
   - Add feedback button globally

4. **Set Up Auto-Push**
   - Verify Lovable auto-deploy
   - Test push workflow
   - Monitor deployments

5. **Test Everything**
   - Click interactions
   - Modal open/close
   - Feedback submission
   - Mobile responsiveness

## 🎨 Visual Summary

The dashboard will show:
- **Top**: Eye-catching VS tournament preview card
- **Bottom right**: Floating feedback button
- **Header**: Beta badge indicator
- **All interactive**: Click VS for details, click feedback to share thoughts

This creates excitement for tournaments while gathering valuable user feedback during beta phase.

# ⚔️ VS Tournament Sidebar Preview

## 📍 Location in Sidebar

### Placement
- **Position**: In the main navigation sidebar
- **Order**: After "Trade" and before "Learn"
- **Style**: Distinctive card-style preview, not just a nav item

## 🎨 Design Specification

### Sidebar Preview Card
```tsx
// Component Structure
<div className="mx-3 mb-4">
  <div 
    onClick={openComingSoonModal}
    className="bg-gradient-to-br from-purple-600 to-blue-600 
               rounded-xl p-4 cursor-pointer
               transform transition-all duration-200 
               hover:scale-[1.02] hover:shadow-xl
               relative overflow-hidden group"
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-32 h-32 
                      bg-white rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 
                      bg-white rounded-full -ml-12 -mb-12" />
    </div>
    
    {/* VS Symbol */}
    <div className="relative z-10 text-center">
      <div className="text-4xl font-black text-white mb-2 
                      tracking-wider drop-shadow-lg">
        ⚔️ VS
      </div>
      
      {/* Tagline */}
      <p className="text-white/90 text-sm font-medium mb-3">
        Trading Tournaments
      </p>
      
      {/* Features List */}
      <div className="space-y-1 text-xs text-white/80">
        <div className="flex items-center justify-center gap-1">
          <span>🏆</span>
          <span>Compete with Friends</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span>💰</span>
          <span>Win Prizes</span>
        </div>
      </div>
      
      {/* Coming Soon Badge */}
      <div className="mt-3 inline-flex items-center gap-1 
                      bg-white/20 backdrop-blur-sm 
                      rounded-full px-3 py-1 text-xs 
                      text-white font-medium">
        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        COMING SOON
      </div>
    </div>
    
    {/* Hover Effect Overlay */}
    <div className="absolute inset-0 bg-white/5 opacity-0 
                    group-hover:opacity-100 transition-opacity" />
  </div>
</div>
```

### Alternative VS Symbol Options
You can choose from these VS symbols:
- ⚔️ Crossed swords (recommended)
- ⚡ Lightning bolt
- 🎯 Target icon
- 🔥 Fire icon
- 💥 Explosion icon
- Custom SVG VS logo

## 🗂️ File Structure

### Component File
`src/components/TournamentSidebarPreview.tsx`

### Modal File
`src/components/TournamentComingSoonModal.tsx`

## 🔧 Implementation Details

### TournamentSidebarPreview Component
```tsx
import { useState } from 'react';
import { TournamentComingSoonModal } from './TournamentComingSoonModal';

export default function TournamentSidebarPreview() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div onClick={() => setShowModal(true)}>
        {/* Preview card code from above */}
      </div>
      
      {showModal && (
        <TournamentComingSoonModal 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
```

### TournamentComingSoonModal Component
```tsx
export function TournamentComingSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Content */}
        <div className="text-center">
          {/* Large VS Symbol */}
          <div className="text-6xl font-black bg-gradient-to-r from-purple-600 to-blue-600 
                          bg-clip-text text-transparent mb-4">
            ⚔️ VS
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            Trading Tournaments
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Compete against friends and other traders in exciting tournaments! 
            Win prizes and prove your trading skills.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-sm font-medium">Private Tournaments</div>
              <div className="text-xs text-muted-foreground">
                Play with friends
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-sm font-medium">Public Competitions</div>
              <div className="text-xs text-muted-foreground">
                Win amazing prizes
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-sm font-medium">Custom Balances</div>
              <div className="text-xs text-muted-foreground">
                $5K to $100K tournaments
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-sm font-medium">Real-Time Trading</div>
              <div className="text-xs text-muted-foreground">
                Live leaderboards
              </div>
            </div>
          </div>
          
          {/* Notify Me Button */}
          <button 
            onClick={handleNotifyMe}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 
                       text-white font-medium py-3 rounded-lg
                       hover:shadow-lg transition-all"
          >
            Notify Me When Available
          </button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Be the first to know when tournaments launch!
          </p>
        </div>
      </div>
    </div>
  );
}
```

## 📱 Mobile Considerations

### Responsive Design
- Same card design on mobile sidebar
- Touch-friendly tap target
- Modal adapts to mobile screen size
- Prevents sidebar scroll when modal open

### Collapsed Sidebar
- When sidebar collapsed, show just VS icon
- Expand on hover to show full preview
- Maintain functionality

## 🎯 Integration Steps

### 1. Add to DashboardLayout
```tsx
// In DashboardLayout.tsx sidebar section:
<TournamentSidebarPreview />
```

### 2. Import Components
```tsx
import TournamentSidebarPreview from '@/components/TournamentSidebarPreview';
```

### 3. Add Notify Functionality
```tsx
const handleNotifyMe = async () => {
  // Save user preference to database
  await supabase.from('tournament_notifications').insert({
    user_id: user.id,
    created_at: new Date()
  });
  
  // Show success toast
  toast({
    title: "You'll be notified!",
    description: "We'll email you when tournaments launch."
  });
  
  onClose();
};
```

## ⚡ Interactive Elements

### Hover Effects
- Card scales up slightly
- Shadow intensifies
- Background pattern becomes more visible
- Cursor changes to pointer

### Click Feedback
- Modal slides up from bottom
- Backdrop fades in
- Focus trapped in modal
- Escape key closes modal

### Animation Details
```css
/* Add to global CSS */
.tournament-preview-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tournament-preview-card:hover {
  transform: scale(1.02);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse-dot {
  animation: pulse 2s infinite;
}
```

## 🚀 Future Enhancement Ideas

### When Feature Launches
1. Replace preview with full tournament navigation
2. Add tournament count badge
3. Show active tournament status
4. Add quick actions (Create/Join)

### Advanced Features
- Tournament invitations count
- Live tournament notifications
- Quick portfolio peek
- Friend activity indicator

## 📝 Implementation Checklist

- [ ] Create TournamentSidebarPreview component
- [ ] Create TournamentComingSoonModal component
- [ ] Add to DashboardLayout sidebar
- [ ] Implement notify me functionality
- [ ] Test on desktop and mobile
- [ ] Verify animations and transitions
- [ ] Test modal accessibility

## 🎨 Visual Preview Description

The sidebar will show a distinctive purple-to-blue gradient card with:
- Large "⚔️ VS" text at the top
- "Trading Tournaments" subtitle
- Feature highlights (Compete with Friends, Win Prizes)
- Pulsing "COMING SOON" badge
- Hover effects that make it pop

When clicked, a modal appears showing:
- Even larger VS logo
- Feature grid with icons
- "Notify Me When Available" button
- Professional presentation of upcoming features

This creates excitement and anticipation for the tournament feature while maintaining a clean, professional look in the sidebar.

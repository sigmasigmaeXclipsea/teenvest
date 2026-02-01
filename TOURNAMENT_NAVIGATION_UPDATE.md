# 🧭 Tournament Navigation Integration

## 📍 Sidebar Preview Integration

### Current Navigation Items
```tsx
// In DashboardLayout.tsx - Current nav items:
- Dashboard
- Trade  
- Learn
- Research
- Garden
- Leaderboard
- Profile
```

### Updated Layout
```tsx
// Add Tournament Preview Card after Trade section:
- Dashboard
- Trade
- [TOURNAMENT PREVIEW CARD]  // NEW - Not a nav item
- Learn
- Research
- Garden
- Leaderboard
- Profile
```

## 🎨 Sidebar Preview Card Design

### Tournament Preview Card
- **Style**: Gradient purple-to-blue card, not a nav item
- **Content**: Large "⚔️ VS" symbol with features list
- **Interaction**: Opens "Coming Soon" modal (not navigation)
- **Position**: Between Trade and Learn nav items
- **Size**: Full width of sidebar with margins

### Features
- Eye-catching gradient design
- "COMING SOON" with pulsing indicator
- Hover effects (scale and shadow)
- Click opens modal, not navigation
- No route needed initially

## 🗂️ No Route Needed Initially

### Modal-Only Approach
Since the sidebar preview opens a "Coming Soon" modal:
- No route required initially
- No navigation state needed
- Component lives entirely in sidebar
- Modal handles all interactions

### Future Route Addition
When tournaments are ready to launch:
```tsx
// Then add route to App.tsx:
<Route path="/tournaments" element={
  <ProtectedRoute>
    <TournamentsPage />
  </ProtectedRoute>
} />
```

## 📱 Mobile Navigation

### Mobile Sidebar
- Same preview card appears in mobile sidebar
- Touch-friendly tap target
- Modal adapts to mobile screen
- Prevents body scroll when modal open

### Collapsed Sidebar
- When collapsed, show just "⚔️ VS" text
- Expand on hover to show full card
- Maintain click functionality

## 🎯 Implementation Steps

1. **Create Sidebar Preview Component**
   - Build gradient card with VS symbol
   - Add hover animations and effects
   - Implement click handler for modal

2. **Create Coming Soon Modal**
   - Design modal with tournament features
   - Add "Notify Me" functionality
   - Include close button and backdrop

3. **Add to DashboardLayout**
   - Import component
   - Place between Trade and Learn sections
   - Test sidebar layout

4. **Test Interactions**
   - Verify card hover effects
   - Test modal open/close
   - Check mobile responsiveness
   - Test notify me feature

## ⚠️ Important Notes

- Keep it simple for now - just a placeholder
- Don't implement full tournament system yet
- Focus on navigation and placeholder page
- Beta badge helps set expectations
- VS symbol can be added to placeholder page

## 🚀 Future Implementation

When ready to implement full feature:
1. Replace placeholder with full tournament system
2. Remove beta badge if feature is stable
3. Add tournament-specific navigation items
4. Implement deep linking to specific tournaments

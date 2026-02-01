# 🧭 Tournament Navigation Integration

## 📍 Navigation Menu Update

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

### Updated Navigation Items
```tsx
// Add Tournament after Trade:
- Dashboard
- Trade
- 🏆 Tournaments  // NEW
- Learn
- Research
- Garden
- Leaderboard
- Profile
```

## 🎨 Navigation Item Design

### Tournament Nav Item
```tsx
// In navigation component:
<Link 
  to="/tournaments"
  className={cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
    location.pathname === '/tournaments' 
      ? "bg-primary text-primary-foreground" 
      : "hover:bg-secondary"
  )}
>
  <Trophy className="w-4 h-4" />
  <span>Tournaments</span>
  <Badge variant="secondary" className="ml-auto text-xs">
    BETA
  </Badge>
</Link>
```

### Features
- Trophy icon from lucide-react
- "BETA" badge next to text
- Active state highlighting
- Hover effects
- Responsive design

## 🗂️ Route Addition

### Add to App.tsx Routes
```tsx
// Add tournament route:
<Route path="/tournaments" element={
  <ProtectedRoute>
    <TournamentsPage />
  </ProtectedRoute>
} />
```

### Create Placeholder Component
```tsx
// src/pages/TournamentsPage.tsx
export default function TournamentsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">🏆 Tournaments</h1>
          <p className="text-muted-foreground mb-4">
            Competitive trading tournaments coming soon!
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            COMING SOON
          </Badge>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

## 📱 Mobile Navigation

### Mobile Menu Update
- Add tournament item to mobile navigation drawer
- Same icon and badge styling
- Ensure proper spacing and scroll

### Bottom Tab Bar (if applicable)
- Consider adding tournament tab if using bottom navigation
- Trophy icon with "Tournaments" label
- Beta indicator dot

## 🎯 Implementation Steps

1. **Update Navigation Component**
   - Add tournament link with trophy icon
   - Include beta badge
   - Test active states

2. **Create Placeholder Page**
   - Simple "Coming Soon" page
   - Trophy icon and VS symbol
   - Beta version notice

3. **Add Route**
   - Add tournament route to App.tsx
   - Ensure protected route wrapper
   - Test navigation flow

4. **Mobile Testing**
   - Verify mobile navigation
   - Check responsive behavior
   - Test drawer/scrolling

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

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  LayoutDashboard, 
  BarChart3, 
  Briefcase, 
  BookOpen, 
  History,
  LogOut,
  Menu,
  X,
  Settings,
  Trophy,
  Shield,
  Award,
  User,
  Lightbulb,
  Search,
  Sprout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useAchievementTracker } from '@/hooks/useAchievementTracker';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/screener', icon: BarChart3, label: 'Screener' },
  { path: '/research', icon: Search, label: 'Research' },
  { path: '/trade', icon: Briefcase, label: 'Trade' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/learn', icon: BookOpen, label: 'Learn' },
  { path: '/garden', icon: Sprout, label: 'Garden' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/admin', icon: Shield, label: 'Admin' },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track and auto-award achievements
  useAchievementTracker();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar - Always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">TeenVest</span>
            </Link>
            
            {/* Top Nav Links - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                to="/learn" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/learn' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Learn
              </Link>
              <Link 
                to="/screener" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/screener' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Screener
              </Link>
              <Link 
                to="/research" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/research' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Research
              </Link>
              <Link 
                to="/leaderboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/leaderboard' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Leaderboard
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:top-14 lg:inset-y-0 lg:left-0 lg:z-40 lg:block group">
        <div className="w-16 group-hover:w-56 bg-card border-r border-border transition-all duration-300 ease-in-out overflow-hidden flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {/* Core */}
            <div className="pb-2 mb-2 border-b border-border/60">
              <div className="px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Core</div>
              </div>
              {navItems.slice(0, 4).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 w-12 h-12 group-hover:w-full rounded-lg transition-colors",
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Learning & Social */}
            <div className="pb-2 mb-2 border-b border-border/60">
              <div className="px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Learning & Social</div>
              </div>
              {navItems.slice(4, 9).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 w-12 h-12 group-hover:w-full rounded-lg transition-colors",
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* System */}
            <div>
              <div className="px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">System</div>
              </div>
              {navItems.slice(9).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 w-12 h-12 group-hover:w-full rounded-lg transition-colors",
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              className="w-12 h-12 p-0 text-muted-foreground group-hover:w-full justify-start gap-3 transition-all duration-300"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Log Out
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-14">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground mt-4"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-16 pt-14 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
      <TooltipProvider delayDuration={100}>
        <aside className="hidden lg:fixed lg:top-14 lg:bottom-0 lg:left-0 lg:z-40 lg:block">
          <div className="h-full w-16 bg-card border-r border-border flex flex-col">
            {/* Navigation */}
            <nav className="flex-1 flex flex-col p-2 gap-1 overflow-y-auto overflow-x-hidden">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-105'
                        )}
                      >
                        <item.icon className="w-6 h-6" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-105 transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-6 h-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>Log Out</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>
      </TooltipProvider>

      {/* Mobile Menu - Smooth Sliding Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0 pt-14">
          <SheetHeader className="px-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>TeenVest</span>
            </SheetTitle>
          </SheetHeader>
          
          <nav className="flex-1 p-4 space-y-1">
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground px-3 mb-2">Navigation</p>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </Link>
                );
              })}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground px-3 mb-2">Account</p>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02]"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </Button>
            </div>
          </nav>
          
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Need help?</p>
              <p className="text-sm font-medium">Check out our Learn section</p>
              <Link 
                to="/learn"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="lg:pl-16 pt-14 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

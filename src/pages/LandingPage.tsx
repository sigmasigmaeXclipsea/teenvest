import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, Sparkles, Zap, Flame, Rocket, User, LogOut, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useSpring } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useMemo, memo, useRef, useCallback, type ReactNode, type ElementType, type FC, type MouseEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple marquee for stock ticker
const Marquee = ({ children, direction = 'left', speed = 25 }: { children: ReactNode; direction?: 'left' | 'right'; speed?: number }) => (
  <div className="overflow-hidden whitespace-nowrap">
    <motion.div
      className="inline-flex"
      animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    >
      {children}
      {children}
    </motion.div>
  </div>
);

// Animated counter - simplified
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    // Skip animation if value is 0 or already animating
    if (value === 0 || isAnimating) return;
    
    setIsAnimating(true);
    const duration = 1500;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
        setIsAnimating(false);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => {
      clearInterval(timer);
      setIsAnimating(false);
    };
  }, [value]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Floating particles component
const FloatingParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// Dashboard preview with smooth cursor tracking and pulsing glow
const DashboardPreview: FC = () => {
  const [stocks, setStocks] = useState<any[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', price: 248.00, change: '+1.2%', color: 'from-blue-500 to-blue-600', isPositive: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.84, change: '-0.8%', color: 'from-red-500 to-red-600', isPositive: false },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: '+3.4%', color: 'from-green-500 to-green-600', isPositive: true },
    { symbol: 'MSFT', name: 'Microsoft', price: 429.63, change: '+0.6%', color: 'from-cyan-500 to-cyan-600', isPositive: true }
  ]);
  const [portfolioValue, setPortfolioValue] = useState(17958);
  const [totalGain, setTotalGain] = useState(2155);
  const [todayChange, setTodayChange] = useState(1.1);
  const [loading, setLoading] = useState(false);

  // Fetch real stock data using Render proxy
  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      try {
        const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT'];
        const colors = ['from-blue-500 to-blue-600', 'from-red-500 to-red-600', 'from-green-500 to-green-600', 'from-cyan-500 to-cyan-600'];
        
        const stockPromises = symbols.map(async (symbol, index) => {
          try {
            const response = await fetch(`https://finnhub-stock-api-5xrj.onrender.com/api/stock/${symbol}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            // API returns nested structure: { quote: { c, d, dp }, profile: { name } }
            const price = data.quote?.c || 0;
            const changePercent = data.quote?.dp || 0;
            const name = data.profile?.name || symbol;
            
            return {
              symbol: data.profile?.ticker || symbol,
              name: name,
              price: price,
              change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
              color: colors[index],
              isPositive: changePercent >= 0
            };
          } catch (err) {
            console.warn(`Failed to fetch ${symbol}, using fallback`);
            const fallbackData: Record<string, { symbol: string; name: string; price: number; change: string; isPositive: boolean }> = {
              'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 248.00, change: '+1.2%', isPositive: true },
              'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', price: 449.00, change: '-0.1%', isPositive: false },
              'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 187.00, change: '+1.5%', isPositive: true },
              'MSFT': { symbol: 'MSFT', name: 'Microsoft', price: 465.00, change: '+3.3%', isPositive: true }
            };
            return { ...fallbackData[symbol], color: colors[index] };
          }
        });

        const fetchedStocks = await Promise.all(stockPromises);
        setStocks(fetchedStocks);
        
        // Only update portfolio values if we successfully fetched data
        if (fetchedStocks.length > 0) {
          const totalValue = fetchedStocks.reduce((sum, stock) => sum + (stock.price * 10), 0);
          const avgChange = fetchedStocks.reduce((sum, stock) => {
            const changeValue = parseFloat(stock.change);
            return sum + (isNaN(changeValue) ? 0 : changeValue);
          }, 0) / fetchedStocks.length;
          
          setPortfolioValue(Math.round(totalValue));
          setTodayChange(Math.round(Math.abs(avgChange) * 10) / 10);
          setTotalGain(Math.round(totalValue * 0.12));
        }
        
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  
  // Spring-based mouse tracking for smooth movement
  const springConfig = { stiffness: 120, damping: 25, mass: 0.8 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const glowX = useSpring(50, springConfig);
  const glowY = useSpring(50, springConfig);
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const cursorGlowX = useSpring(0, { stiffness: 300, damping: 30 });
  const cursorGlowY = useSpring(0, { stiffness: 300, damping: 30 });

  // Pulsing animation synced with cursor
  useEffect(() => {
    if (!isHovering) return;
    
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isHovering]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Subtle 3D tilt effect
    rotateX.set((y - 0.5) * -6);
    rotateY.set((x - 0.5) * 6);
    
    // Glow position
    glowX.set(x * 100);
    glowY.set(y * 100);
    glowOpacity.set(1);
    
    // Cursor glow position (absolute pixels for the cursor follower)
    cursorGlowX.set(e.clientX);
    cursorGlowY.set(e.clientY);
  }, [rotateX, rotateY, glowX, glowY, glowOpacity, cursorGlowX, cursorGlowY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    rotateX.set(0);
    rotateY.set(0);
    glowX.set(50);
    glowY.set(50);
    glowOpacity.set(0);
  }, [rotateX, rotateY, glowX, glowY, glowOpacity]);

  const colors = useMemo(
    () => ['from-blue-500 to-blue-600', 'from-red-500 to-red-600', 'from-green-500 to-green-600', 'from-cyan-500 to-cyan-600'],
    []
  );

  // Calculate pulsing glow intensity
  const pulseIntensity = Math.sin(pulsePhase * Math.PI / 180) * 0.3 + 0.7;
  
  return (
    <div className="relative w-full max-w-xl mx-auto" style={{ perspective: '1000px' }}>
      {/* Floating particles behind */}
      <FloatingParticles />
      
      {/* Cursor glow follower - fixed position */}
      {isHovering && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            x: cursorGlowX,
            y: cursorGlowY,
            translateX: '-50%',
            translateY: '-50%',
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 80,
              height: 80,
              left: -40,
              top: -40,
              background: `radial-gradient(circle, hsl(var(--primary) / ${0.15 * pulseIntensity}), transparent 70%)`,
              boxShadow: `0 0 ${30 * pulseIntensity}px ${10 * pulseIntensity}px hsl(var(--primary) / ${0.2 * pulseIntensity})`,
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Inner bright core */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              left: -10,
              top: -10,
              background: `radial-gradient(circle, hsl(var(--primary) / ${0.6 * pulseIntensity}), hsl(var(--accent) / ${0.3 * pulseIntensity}), transparent 80%)`,
            }}
          />
        </motion.div>
      )}
      
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative will-change-transform group"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Pulsing glow layer - on the same plane as dashboard */}
        <motion.div
          className="absolute -inset-4 rounded-3xl pointer-events-none"
          style={{
            opacity: glowOpacity,
            background: `radial-gradient(ellipse 60% 50% at ${glowX.get()}% ${glowY.get()}%, hsl(var(--primary) / ${0.25 * pulseIntensity}), transparent 60%)`,
            filter: `blur(${8 + 4 * pulseIntensity}px)`,
            transform: 'translateZ(-1px)',
          }}
        />
        
        {/* Secondary ambient glow */}
        <motion.div
          className="absolute -inset-8 rounded-3xl pointer-events-none"
          style={{
            opacity: glowOpacity,
            background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, hsl(var(--accent) / ${0.15 * pulseIntensity}), transparent 50%)`,
            filter: 'blur(20px)',
            transform: 'translateZ(-2px)',
          }}
        />
        
        <div className="rounded-2xl overflow-hidden bg-card border border-border/60 shadow-xl relative">
          {/* Inner glow effect that follows cursor */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              opacity: glowOpacity,
              background: `radial-gradient(circle 150px at ${glowX.get()}% ${glowY.get()}%, hsl(var(--primary) / ${0.12 * pulseIntensity}), transparent)`,
            }}
          />
          
          {/* Border glow effect */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl pointer-events-none"
            style={{
              opacity: glowOpacity,
              background: `conic-gradient(from ${pulsePhase}deg at ${glowX.get()}% ${glowY.get()}%, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.4))`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
          
          {/* Window controls */}
          <div className="flex items-center gap-2 p-3 border-b border-border/50 bg-muted/30 relative z-10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-lg bg-background/80 text-xs text-muted-foreground">
                🔒 teenvests.com/dashboard
              </div>
            </div>
          </div>
          
          {/* Dashboard content */}
          <div className="p-4 space-y-4 relative z-10">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Portfolio Value</p>
                <p className="text-lg font-bold">${portfolioValue.toLocaleString()}</p>
                <p className="text-xs text-success font-medium">+{todayChange}%</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Total Gain</p>
                <p className="text-lg font-bold text-success">+${totalGain.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">📈 Today</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Streak</p>
                <p className="text-lg font-bold">7 days</p>
                <p className="text-xs text-warning">🔥</p>
              </div>
            </div>
            
            {/* Chart placeholder */}
            <div className="h-24 rounded-xl bg-gradient-to-t from-primary/10 to-transparent border border-border/30 relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                <path
                  d="M0,80 Q50,70 100,75 T200,50 T300,40 T400,25"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0,80 Q50,70 100,75 T200,50 T300,40 T400,25 L400,100 L0,100 Z"
                  fill="url(#chartGradient)"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Stocks list */}
            <div className="space-y-2">
              {stocks.map((stock, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stock.color} flex items-center justify-center text-xs font-bold text-white`}>
                      {stock.symbol[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${stock.price.toFixed(2)}</p>
                    <p className={`text-xs font-semibold ${stock.isPositive ? 'text-success' : 'text-destructive'}`}>
                      {stock.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Feature card - simplified
type FeatureCardProps = {
  icon: ElementType;
  title: string;
  desc: string;
  gradient: string;
  delay?: number;
};

const FeatureCard: FC<FeatureCardProps> = ({ icon: Icon, title, desc, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, delay }}
    className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
  >
    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary))_0%,transparent_55%)]" />
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-300`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </motion.div>
);

const LandingPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tickerStocks, setTickerStocks] = useState<any[]>([
    { symbol: 'AAPL', price: '$248.00', change: '+1.2%' },
    { symbol: 'TSLA', price: '$242.84', change: '-0.8%' },
    { symbol: 'GOOGL', price: '$168.50', change: '+0.5%' },
    { symbol: 'MSFT', price: '$429.63', change: '+0.6%' },
    { symbol: 'AMZN', price: '$178.35', change: '+1.1%' },
    { symbol: 'NVDA', price: '$875.28', change: '+3.4%' },
    { symbol: 'META', price: '$512.75', change: '+0.9%' },
    { symbol: 'NFLX', price: '$486.23', change: '-0.3%' },
    { symbol: 'AMD', price: '$124.58', change: '+2.1%' },
    { symbol: 'DIS', price: '$91.45', change: '+0.2%' }
  ]);

  // Fetch ticker data using Render proxy
  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const symbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META', 'NFLX', 'AMD', 'DIS'];
        
        const stockPromises = symbols.map(async (symbol) => {
          try {
            const response = await fetch(`https://finnhub-stock-api-5xrj.onrender.com/api/stock/${symbol}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            // API returns nested structure: { quote: { c, d, dp }, profile: { name } }
            const price = data.quote?.c || 0;
            const changePercent = data.quote?.dp || 0;
            
            return {
              symbol: data.profile?.ticker || symbol,
              price: `$${price.toFixed(2)}`,
              change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
            };
          } catch (err) {
            console.warn(`Failed to fetch ${symbol} for ticker, using fallback`);
            const fallbackData: Record<string, { price: string; change: string }> = {
              'AAPL': { price: '$248.00', change: '+1.2%' },
              'TSLA': { price: '$449.00', change: '-0.1%' },
              'GOOGL': { price: '$327.00', change: '-0.8%' },
              'MSFT': { price: '$465.00', change: '+3.3%' },
              'AMZN': { price: '$260.00', change: '+1.1%' },
              'NVDA': { price: '$187.00', change: '+1.5%' },
              'META': { price: '$740.00', change: '+0.9%' },
              'NFLX': { price: '$1050.00', change: '+0.5%' },
              'AMD': { price: '$259.00', change: '+2.3%' },
              'DIS': { price: '$110.00', change: '-2.0%' }
            };
            return { symbol, ...fallbackData[symbol] };
          }
        });

        const fetchedStocks = await Promise.all(stockPromises);
        setTickerStocks(fetchedStocks);
      } catch (error) {
        console.error('Failed to fetch ticker data:', error);
        setTickerStocks([
          { symbol: 'AAPL', price: '$248.00', change: '+1.2%' },
          { symbol: 'TSLA', price: '$449.00', change: '-0.1%' },
          { symbol: 'GOOGL', price: '$327.00', change: '-0.8%' },
          { symbol: 'MSFT', price: '$465.00', change: '+3.3%' },
          { symbol: 'AMZN', price: '$260.00', change: '+1.1%' },
          { symbol: 'NVDA', price: '$187.00', change: '+1.5%' },
          { symbol: 'META', price: '$740.00', change: '+0.9%' },
          { symbol: 'NFLX', price: '$1050.00', change: '+0.5%' },
          { symbol: 'AMD', price: '$259.00', change: '+2.3%' },
          { symbol: 'DIS', price: '$110.00', change: '-2.0%' },
        ]);
      }
    };

    fetchTickerData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background gradient - static for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight gradient-text">TeenVest</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {['Learn', 'Screener', 'Leaderboard'].map((label) => (
              <Link 
                key={label} 
                to={user ? `/${label.toLowerCase()}` : '/login'} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="font-medium">
                    <User className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="font-medium">
                  <LogOut className="w-4 h-4 mr-1" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="font-bold bg-gradient-to-r from-primary to-accent shadow-md">
                    <Zap className="w-4 h-4 mr-1" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 left-6 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground px-3 py-1.5 rounded-full text-xs font-medium mb-6 border border-primary/20">
              <Flame className="w-3 h-3 text-warning" />
              <span>Start Building Wealth Today</span>
              <Star className="w-3 h-3 text-warning" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
              <span className="block">Build Your</span>
              <span className="gradient-text">Financial Empire</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Master investing with <span className="text-primary font-semibold">zero risk</span>. 
              Trade stocks, crush the leaderboard, and build skills that'll set you apart.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Link to={user ? "/dashboard" : "/signup"}>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent shadow-lg font-bold px-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
                  <Play className="w-4 h-4 fill-current" />
                  {user ? "Go to Dashboard" : "Start Free Today"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/learn">
                <Button size="lg" variant="outline" className="gap-2 font-medium">
                  <BookOpen className="w-4 h-4" />
                  Explore Lessons
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-success" /> 100% Free</span>
              <span className="flex items-center gap-1"><Target className="w-4 h-4 text-primary" /> Zero Risk</span>
              <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-warning" /> Real Learning</span>
            </div>
          </motion.div>
          
          {/* Right - Dashboard Preview */}
          <div className="relative">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Stock Ticker */}
      <section className="py-6 border-y border-border/30 bg-card/30 backdrop-blur-sm">
        <Marquee speed={30}>
          {tickerStocks.map((stock, i) => {
            const changeStr = stock.change || '+0%';
            const isPositive = changeStr.startsWith('+');
            return (
              <div key={i} className="mx-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 border border-border/30">
                <span className="font-bold">{stock.symbol || 'N/A'}</span>
                <span className="text-sm text-muted-foreground">{stock.price || '$0.00'}</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                  {changeStr}
                </span>
              </div>
            );
          })}
        </Marquee>
      </section>

      {/* Time Is Your Superpower */}
      <section className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">The Math Doesn't Lie</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Time Is Your <span className="gradient-text">Superpower</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every year you wait costs you thousands. Start at <strong className="text-primary">15</strong> vs <strong className="text-muted-foreground">25</strong>—same $100/month—could mean <strong className="text-primary">~2× more</strong> by retirement.
              </p>
              
              <div className="space-y-4">
                {[
                  { emoji: '💰', title: 'Compound Growth', desc: 'Watch your money multiply while you sleep' },
                  { emoji: '🧠', title: 'Build Skills Early', desc: 'Learn to read markets before your peers' },
                  { emoji: '🛡️', title: 'Zero Risk Practice', desc: 'Make mistakes with fake money, not real' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-xl">
                <h4 className="text-lg font-bold mb-6 text-center text-muted-foreground">
                  $100/month · 7% return
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <p className="text-3xl md:text-4xl font-black text-primary mb-1">
                      $<AnimatedCounter value={500} />K+
                    </p>
                    <p className="text-sm font-bold">Start at 15</p>
                    <p className="text-xs text-primary/70 mt-1">45 years</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-3xl md:text-4xl font-black text-muted-foreground mb-1">
                      $<AnimatedCounter value={250} />K
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">Start at 25</p>
                    <p className="text-xs text-muted-foreground mt-1">35 years</p>
                  </div>
                </div>
                <div className="text-center py-3 px-4 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-sm font-bold text-success flex items-center justify-center gap-2">
                    <Flame className="w-4 h-4" />
                    10 years earlier ≈ 2× the wealth
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">What You Get</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Everything You Need to <span className="gradient-text">Start Investing</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { value: 10, suffix: 'K', label: 'Virtual Cash', icon: '💰', prefix: '$' },
              { value: 5000, suffix: '+', label: 'Real Stocks', icon: '📈' },
              { value: 500, suffix: '', label: 'Real Risk', icon: '🛡️' },
              { value: 100, suffix: '%', label: 'Free Forever', icon: '⭐' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center p-6 rounded-2xl bg-card/60 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <span className="text-4xl mb-3 block">{stat.icon}</span>
                <p className="text-3xl font-black gradient-text mb-1">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Trading Coach */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-accent/10 text-foreground px-3 py-1.5 rounded-full text-xs font-medium mb-4 border border-accent/20">
                <Bot className="w-3 h-3" />
                <span>Powered by AI</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Your Personal <span className="gradient-text">Trading Coach</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get real-time AI explanations for every market move. No confusing jargon—just clear, 
                actionable insights written for teens.
              </p>
              
              <div className="space-y-3">
                {[
                  '📊 Real-time market analysis',
                  '💡 Personalized learning tips',
                  '🎯 Trade recommendations',
                  '📈 Portfolio health checks',
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold">AI Trading Coach</p>
                    <p className="text-xs text-muted-foreground">Online • Ready to help</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium mb-1">📈 NVDA is up 4.5% today!</p>
                    <p className="text-muted-foreground text-xs">
                      NVIDIA's stock is rising after announcing new AI chip partnerships. This could be a good time to research the company!
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 text-sm border border-primary/20">
                    <p className="font-medium mb-1">💡 Pro Tip</p>
                    <p className="text-muted-foreground text-xs">
                      Diversify your portfolio across different sectors to reduce risk. You're heavy on tech stocks!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Everything You Need
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: BarChart3, title: 'Stock Screener', desc: 'Filter 5,000+ stocks by price, sector, and risk.', gradient: 'from-primary to-primary-glow' },
              { icon: Briefcase, title: 'Paper Trading', desc: 'Trade with $10K virtual cash. Real data, zero losses.', gradient: 'from-accent to-chart-5' },
              { icon: Trophy, title: 'Leaderboards', desc: 'Compete globally and track your ranking.', gradient: 'from-warning to-chart-5' },
              { icon: BookOpen, title: 'Bite-Sized Lessons', desc: 'Learn investing in 5-minute lessons.', gradient: 'from-chart-3 to-primary' },
              { icon: Rocket, title: 'Level Up System', desc: 'Earn XP, unlock achievements, track progress.', gradient: 'from-chart-5 to-destructive' },
              { icon: Sparkles, title: 'AI Explanations', desc: 'Every market move explained simply.', gradient: 'from-primary to-accent' },
            ].map((feature, i) => (
              <FeatureCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
                gradient={feature.gradient}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">What Teens Say</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Real Stories, <span className="gradient-text">Real Growth</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { name: 'Alex M.', age: '16', avatar: '🧑‍💻', quote: "I went from knowing nothing about stocks to having a $15K virtual portfolio. TeenVest made it easy!" },
              { name: 'Sarah K.', age: '17', avatar: '👩‍🎓', quote: "The AI coach is like having a finance teacher 24/7. My parents are impressed!" },
              { name: 'Jordan T.', age: '15', avatar: '🎮', quote: "Competing on the leaderboard made learning investing actually fun. Top 100 now!" },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{testimonial.avatar}</span>
                  <div>
                    <p className="font-bold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">Age {testimonial.age}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl mx-auto mb-6">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Ready to <span className="gradient-text">Level Up</span>?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of teens building their financial future. 
              Start with <span className="text-primary font-bold">$10K virtual cash</span>—zero risk, all gains.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to={user ? "/dashboard" : "/signup"}>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent shadow-xl font-bold px-8 py-6 text-lg">
                  <Zap className="w-5 h-5" />
                  {user ? "Go to Dashboard" : "Start Your Journey"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">✨ No credit card required</p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {['🚀', '💎', '📈', '🔥', '⭐'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">Free forever</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black gradient-text">TeenVest</span>
            </Link>
            
            <p className="text-sm text-muted-foreground">
              © 2025 TeenVest <span className="font-bold text-primary">v1.2</span>. Building the next generation of investors. 🚀
            </p>
            
            <div className="flex items-center gap-6">
              {['Terms', 'Privacy', 'Contact'].map((link) => (
                <a key={link} href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
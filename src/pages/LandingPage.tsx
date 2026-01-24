import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, Zap, Flame, Rocket, User, LogOut, Play, Star, ChevronRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useMultipleStockQuotes } from '@/hooks/useStockAPI';

// Cursor follower component with trail - memoized and throttled for performance
const CursorFollower = memo(() => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const hoverElementsRef = useRef<Set<Element>>(new Set());
  const lastUpdateRef = useRef(0);
  
  useEffect(() => {
    // Only enable on desktop
    if (window.innerWidth < 768) return;
    
    // Throttle mouse moves to 60fps max
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return; // ~60fps
      lastUpdateRef.current = now;
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleHoverStart = () => setIsHovering(true);
    const handleHoverEnd = () => setIsHovering(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Use event delegation instead of adding listeners to each element
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a')) {
        setIsHovering(true);
      }
    };
    
    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('button, a')) {
        setIsHovering(false);
      }
    };
    
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      hoverElementsRef.current.clear();
    };
  }, []);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mousePos.x - 16, springConfig);
  const y = useSpring(mousePos.y - 16, springConfig);
  
  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="fixed w-8 h-8 rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{ x, y }}
        animate={{
          scale: isHovering ? 2 : 1,
          backgroundColor: isHovering ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
        }}
        transition={{ type: 'spring', damping: 20 }}
      />
      {/* Trail particles - reduced for performance */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed w-2 h-2 rounded-full bg-primary/40 pointer-events-none z-[9998] hidden md:block"
          style={{
            x: useSpring(mousePos.x - 4, { damping: 30 + i * 5, stiffness: 150 - i * 20 }),
            y: useSpring(mousePos.y - 4, { damping: 30 + i * 5, stiffness: 150 - i * 20 }),
            scale: 1 - i * 0.15,
            opacity: 0.6 - i * 0.1,
          }}
        />
      ))}
    </>
  );
});

// Infinite scrolling marquee
const Marquee = ({ children, direction = 'left', speed = 20 }: { children: React.ReactNode; direction?: 'left' | 'right'; speed?: number }) => {
  return (
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
};

// Dashboard card wrapper - no cursor tracking, static lighting
const DashboardCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {/* Static subtle glow - aligned with dashboard, no cursor tracking */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.3) 0%, transparent 60%)`,
        }}
      />
    </div>
  );
};

// 3D Tilt card component - used for feature cards only
const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRotateX((y - 0.5) * -20);
    setRotateY((x - 0.5) * 20);
    setGlare({ x: x * 100, y: y * 100 });
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlare({ x: 50, y: 50 });
  }, []);
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
      {/* Glare effect */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
        }}
      />
    </motion.div>
  );
};

// Morphing blob shape - scroll-triggered
const MorphingBlob = ({ className }: { className?: string }) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{
        borderRadius: [
          '60% 40% 30% 70%/60% 30% 70% 40%',
          '30% 60% 70% 40%/50% 60% 30% 60%',
          '60% 40% 30% 70%/60% 30% 70% 40%',
        ],
        scale: [1, 1.05, 1],
        rotate: [0, 180, 360],
        opacity: 1,
      }}
      viewport={{ once: true }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
  );
};

// Text scramble effect
const ScrambleText = ({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  
  useEffect(() => {
    if (!isHovered) {
      setDisplayText(text);
      return;
    }
    
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (i < iteration) return text[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      
      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1/3;
    }, 30);
    
    return () => clearInterval(interval);
  }, [isHovered, text]);
  
  return (
    <span
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayText}
    </span>
  );
};

// Floating interactive orb with 3D support
const InteractiveOrb = ({ className, delay = 0, style }: { className?: string; delay?: number; style?: React.CSSProperties }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`absolute rounded-full cursor-pointer ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isHovered ? 1.3 : 1,
        opacity: 1,
        y: isHovered ? 0 : [0, -20, 0],
        x: isHovered ? 0 : [0, 10, 0],
        rotateX: [0, 360],
        rotateY: [0, 360],
      }}
      transition={{
        scale: { type: 'spring', stiffness: 300 },
        opacity: { delay, duration: 1 },
        y: { duration: 6 + delay, repeat: Infinity, ease: 'easeInOut' },
        x: { duration: 8 + delay, repeat: Infinity, ease: 'easeInOut' },
        rotateX: { duration: 20, repeat: Infinity, ease: 'linear' },
        rotateY: { duration: 15, repeat: Infinity, ease: 'linear' },
      }}
    >
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.5 }}
          style={{ boxShadow: '0 0 60px 20px hsl(var(--primary) / 0.5)' }}
        />
      )}
    </motion.div>
  );
};

// Magnetic button with enhanced effects
const MagneticButton = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.2);
    y.set((e.clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  return (
    <motion.div 
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="overflow-visible"
    >
      <Button
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        <motion.span
          className="absolute inset-0 bg-white/20"
          initial={{ x: '-100%', opacity: 0 }}
          animate={isHovered ? { x: '100%', opacity: [0, 1, 0] } : {}}
          transition={{ duration: 0.5 }}
        />
        {children}
      </Button>
    </motion.div>
  );
};

// Parallax section wrapper
const ParallaxSection = ({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
  
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// Animated counter with spring physics
const SpringCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [isInView, setIsInView] = useState(false);
  const springValue = useSpring(0, { damping: 30, stiffness: 100 });
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, value, springValue]);
  
  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [springValue]);
  
  return (
    <motion.span
      onViewportEnter={() => setIsInView(true)}
      viewport={{ once: true }}
    >
      {prefix}{display.toLocaleString()}{suffix}
    </motion.span>
  );
};

// Staggered text reveal - simplified for better rendering
const RevealText = ({ text, className }: { text: string; className?: string }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// Floating particles background - optimized for performance
const FloatingParticles = memo(() => {
  const particleCount = typeof window !== 'undefined' && window.innerWidth >= 768 ? 8 : 4; // Further reduced for performance
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          animate={{
            y: [null, -dimensions.height - 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
});

// Interactive grid background - throttled for performance
const GridBackground = memo(() => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const lastUpdateRef = useRef(0);
  
  useEffect(() => {
    // Only enable on desktop
    if (window.innerWidth < 768) return;
    
    setIsVisible(true);
    // Throttle mouse moves to reduce re-renders
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 100) return; // Update max 10x per second
      lastUpdateRef.current = now;
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 md:opacity-30">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.2) 0%, transparent 25%),
            linear-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
          willChange: 'background-image',
        }}
      />
    </div>
  );
});

// Scroll velocity text
const VelocityText = ({ text }: { text: string }) => {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skewX = useSpring(useTransform(scrollVelocity, [-1000, 1000], [-15, 15]), {
    stiffness: 100,
    damping: 30,
  });
  
  return (
    <motion.div style={{ skewX }} className="whitespace-nowrap">
      <span className="text-8xl md:text-[12rem] font-black text-transparent stroke-text opacity-10">
        {text}
      </span>
    </motion.div>
  );
};

// Glowing ring animation
const GlowingRing = ({ size = 200, delay = 0 }: { size?: number; delay?: number }) => (
  <motion.div
    className="absolute rounded-full border-2 border-primary/30"
    style={{ width: size, height: size }}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ 
      scale: [0.8, 1.2, 0.8], 
      opacity: [0, 0.6, 0],
      rotate: [0, 180, 360],
    }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

// Floating notification component
const FloatingNotification = ({ children, delay = 0, position }: { 
  children: React.ReactNode; 
  delay?: number; 
  position: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    whileHover={{ scale: 1.1, zIndex: 50 }}
    className={`absolute ${position} p-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl cursor-pointer z-20`}
  >
    {children}
  </motion.div>
);

// Enhanced Mock Dashboard - BIGGER AND SHARPER
const AnimatedDashboard = () => {
  const [activeStock, setActiveStock] = useState(0);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  
  // Fetch real stock data from API
  const stockSymbols = useMemo(() => ['AAPL', 'TSLA', 'NVDA', 'MSFT'], []);
  const { data: stockQuotes, isLoading, error } = useMultipleStockQuotes(stockSymbols);
  
  const stocks = useMemo(() => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-red-500 to-red-600', 
      'from-green-500 to-green-600',
      'from-cyan-500 to-cyan-600',
    ];
    
    if (stockQuotes && stockQuotes.length > 0) {
      return stockQuotes.map((quote, i) => ({
        symbol: quote.symbol,
        name: quote.companyName,
        price: quote.price,
        change: `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%`,
        color: colors[i] || colors[0],
      }));
    }
    
    // Fallback with realistic prices while loading
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 178.25, change: '+2.4%', color: colors[0] },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.50, change: '+5.1%', color: colors[1] },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 890.20, change: '+4.5%', color: colors[2] },
      { symbol: 'MSFT', name: 'Microsoft', price: 378.90, change: '+0.8%', color: colors[3] },
    ];
  }, [stockQuotes]);
  
  // Calculate portfolio value from real stock prices with realistic fallback
  const portfolioValue = useMemo(() => {
    // Simulate holdings: 15 AAPL, 8 TSLA, 5 NVDA, 12 MSFT
    const holdings = { AAPL: 15, TSLA: 8, NVDA: 5, MSFT: 12 };
    const fallbackPrices = { AAPL: 178.25, TSLA: 245.50, NVDA: 890.20, MSFT: 378.90 };
    
    if (stockQuotes && stockQuotes.length > 0) {
      try {
        return stockQuotes.reduce((total, quote) => {
          if (!quote || !quote.symbol) return total;
          const shares = holdings[quote.symbol as keyof typeof holdings] || 0;
          const price = quote.price && quote.price > 0 ? Number(quote.price) : (fallbackPrices[quote.symbol as keyof typeof fallbackPrices] || 0);
          return total + (price * shares);
        }, 0);
      } catch (err) {
        console.error('Error calculating portfolio value:', err);
      }
    }
    
    // Fallback calculation with realistic prices
    return Object.entries(holdings).reduce((total, [symbol, shares]) => {
      return total + (fallbackPrices[symbol as keyof typeof fallbackPrices] * shares);
    }, 0);
  }, [stockQuotes, error]);
  
  // Starting investment is calculated to always show ~+12% gain for demo
  const startingInvestment = useMemo(() => {
    return portfolioValue / 1.12;
  }, [portfolioValue]);
  
  // Calculate total gain from starting investment (shows overall portfolio performance)
  const totalGain = useMemo(() => {
    return portfolioValue - startingInvestment;
  }, [portfolioValue, startingInvestment]);
  
  const totalGainPercent = useMemo(() => {
    return ((portfolioValue - startingInvestment) / startingInvestment) * 100;
  }, [portfolioValue, startingInvestment]);
  
  // Calculate today's gain from real data with realistic fallback
  const todaysGain = useMemo(() => {
    const holdings = { AAPL: 15, TSLA: 8, NVDA: 5, MSFT: 12 };
    const fallbackChanges = { AAPL: 4.18, TSLA: 12.25, NVDA: 38.25, MSFT: 2.83 }; // Realistic dollar changes
    
    if (stockQuotes && stockQuotes.length > 0) {
      try {
        return stockQuotes.reduce((total, quote) => {
          if (!quote || !quote.symbol) return total;
          const shares = holdings[quote.symbol as keyof typeof holdings] || 0;
          const change = quote.change !== undefined ? Number(quote.change) : (fallbackChanges[quote.symbol as keyof typeof fallbackChanges] || 0);
          return total + (change * shares);
        }, 0);
      } catch (err) {
        console.error('Error calculating today\'s gain:', err);
      }
    }
    
    // Fallback calculation
    return Object.entries(holdings).reduce((total, [symbol, shares]) => {
      return total + (fallbackChanges[symbol as keyof typeof fallbackChanges] * shares);
    }, 0);
  }, [stockQuotes, error]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStock((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <DashboardCard className="w-full max-w-2xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/10 border-2 border-border/60 shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.4)]">
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--primary)) 100%)',
            backgroundSize: '200% 100%',
            padding: 2,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Window controls with enhanced styling */}
        <div className="flex items-center gap-2 p-5 border-b border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm">
          <motion.div className="flex gap-2">
            {[
              { color: 'bg-red-500', hoverColor: 'bg-red-400' },
              { color: 'bg-yellow-500', hoverColor: 'bg-yellow-400' },
              { color: 'bg-green-500', hoverColor: 'bg-green-400' },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className={`w-3.5 h-3.5 rounded-full ${dot.color} shadow-lg`}
                whileHover={{ scale: 1.2, backgroundColor: dot.hoverColor }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </motion.div>
          <div className="flex-1 flex justify-center">
            <motion.div 
              className="px-6 py-1.5 rounded-xl bg-background/80 text-sm text-muted-foreground font-medium border border-border/50"
              whileHover={{ scale: 1.02 }}
            >
              <span>
                🔒 teenvests.com/dashboard
              </span>
            </motion.div>
          </div>
        </div>
        
        {/* Dashboard content - LARGER */}
        <div className="p-6 space-y-5">
          {/* Stats with enhanced interactions */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Portfolio Value', value: Math.round(portfolioValue), prefix: '$', change: totalGainPercent >= 0 ? `+${totalGainPercent.toFixed(1)}%` : `${totalGainPercent.toFixed(1)}%`, icon: '💰' },
              { label: 'Total Gain', value: Math.abs(Math.round(totalGain)), prefix: totalGain >= 0 ? '+$' : '-$', change: todaysGain >= 0 ? '📈 Today' : '📉 Today', icon: '📊' },
              { label: 'Login Streak', value: 7, suffix: ' days', change: '🔥', icon: '⚡' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.08, y: -5, boxShadow: '0 20px 40px -15px hsl(var(--primary) / 0.3)' }}
                onHoverStart={() => setHoveredStat(i)}
                onHoverEnd={() => setHoveredStat(null)}
                className="relative p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 cursor-pointer overflow-hidden group"
              >
                {/* Hover glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <motion.span
                      animate={hoveredStat === i ? { rotate: [0, 15, -15, 0], scale: 1.2 } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {stat.icon}
                    </motion.span>
                  </div>
                  <p className="text-xl font-black">
                    <SpringCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <motion.p 
                    className="text-sm text-success font-semibold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {stat.change}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Enhanced animated chart */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="h-36 rounded-2xl bg-gradient-to-t from-primary/20 via-primary/5 to-transparent border border-border/50 relative overflow-hidden"
          >
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-border/50" style={{ top: `${(i + 1) * 20}%` }} />
              ))}
            </div>
            
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 120">
              {/* Area fill */}
              <motion.path
                d="M0,100 Q50,80 100,85 T200,60 T300,50 T400,30 L400,120 L0,120 Z"
                fill="url(#chartGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1.5 }}
              />
              {/* Main line */}
              <motion.path
                d="M0,100 Q50,80 100,85 T200,60 T300,50 T400,30"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, delay: 1, ease: 'easeOut' }}
              />
              {/* Animated glow line */}
              <motion.path
                d="M0,100 Q50,80 100,85 T200,60 T300,50 T400,30"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                filter="blur(8px)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2.5, delay: 1, ease: 'easeOut' }}
              />
              {/* Animated dot */}
              <motion.circle
                r="8"
                fill="hsl(var(--primary))"
                animate={{
                  cx: [0, 100, 200, 300, 400, 300, 200, 100, 0],
                  cy: [100, 85, 60, 50, 30, 50, 60, 85, 100],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
              {/* Pulse ring around dot */}
              <motion.circle
                r="8"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                animate={{
                  cx: [0, 100, 200, 300, 400, 300, 200, 100, 0],
                  cy: [100, 85, 60, 50, 30, 50, 60, 85, 100],
                  r: [8, 20, 8],
                  opacity: [1, 0, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Floating price tag */}
            <motion.div
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-card/90 border border-border/50 text-xs font-bold"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : error ? (
                <span className="text-muted-foreground">+2.1%</span>
              ) : (
                <>
                  <span className={todaysGain >= 0 ? 'text-success' : 'text-destructive'}>
                    {todaysGain >= 0 ? '+' : ''}{portfolioValue > 0 ? ((todaysGain / portfolioValue) * 100).toFixed(1) : '2.1'}%
                  </span> today
                </>
              )}
            </motion.div>
          </motion.div>
          
          {/* Stock list with enhanced animations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-muted-foreground">Top Holdings</p>
              <motion.span 
                className="text-xs text-primary font-medium cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                View All →
              </motion.span>
            </div>
            <AnimatePresence mode="popLayout">
              {stocks.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: activeStock === i ? 1.03 : 1,
                  }}
                  transition={{ delay: 1.2 + i * 0.1, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.05, x: 5 }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    activeStock === i 
                      ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10' 
                      : 'bg-muted/20 border-border/30 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stock.color} flex items-center justify-center text-sm font-black text-white shadow-lg`}
                      animate={activeStock === i ? { rotate: [0, -10, 10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {stock.symbol[0]}
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${stock.price.toFixed(2)}
                    </p>
                    <motion.p 
                      className={`text-xs font-bold ${
                        stock.change.startsWith('+') ? 'text-success' : 
                        stock.change.startsWith('-') ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}
                      animate={activeStock === i ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {stock.change}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Multiple shimmer overlays */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
    </DashboardCard>
  );
};

// Feature card with micro-interactions
const FeatureCard = ({ icon: Icon, title, desc, gradient, delay = 0 }: { 
  icon: React.ElementType; 
  title: string; 
  desc: string; 
  gradient: string;
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, type: 'spring' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 md:p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
    >
      {/* Animated background gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Icon */}
      <motion.div 
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg relative z-10`}
        animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-7 h-7 text-white" />
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))` }}
          />
        )}
      </motion.div>
      
      {/* Content */}
      <h3 className="text-xl font-bold mb-2 relative z-10">{title}</h3>
      <p className="text-muted-foreground relative z-10">{desc}</p>
      
      {/* Hover shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full"
        animate={isHovered ? { translateX: '200%' } : {}}
        transition={{ duration: 0.8 }}
      />
    </motion.div>
  );
};

const LandingPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -150]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroRotate = useTransform(scrollYProgress, [0, 0.3], [0, -5]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };


  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-background relative overflow-x-hidden"
      style={{
        perspective: '2000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Custom cursor - disabled for performance, can re-enable if needed */}
      {false && typeof window !== 'undefined' && window.innerWidth >= 768 && <CursorFollower />}
      
      {/* Floating particles disabled for performance */}
      {/* Grid background disabled for performance */}
      
      {/* Simplified static gradient background - removed 3D blobs for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </div>
      
      {/* Simplified orbs - reduced for performance */}
      {false && (
        <motion.div
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <InteractiveOrb 
            className="w-20 h-20 bg-gradient-to-br from-primary/40 to-accent/40 top-[20%] left-[10%] blur-sm" 
            delay={0}
            style={{ transform: 'translateZ(100px)' }}
          />
        </motion.div>
      )}
      
      {/* Energy waves disabled for performance */}
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="border-b border-primary/10 bg-background/80 backdrop-blur-2xl sticky top-0 z-50 supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-2xl glow-primary"
            >
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <ScrambleText text="TeenVest" className="text-2xl font-black tracking-tight gradient-text" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {['Learn', 'Screener', 'Leaderboard'].map((label, i) => (
              <Link 
                key={label} 
                to={user ? `/${label.toLowerCase()}` : '/login'} 
                className="relative group"
                aria-label={`Navigate to ${label}`}
              >
                <motion.span 
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all duration-300"
                  whileHover={{ y: -2 }}
                >
                  {label}
                </motion.span>
                <motion.span 
                  className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-primary to-accent rounded-full w-0 group-hover:w-full transition-all duration-300"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="font-semibold hover:bg-primary/10 hover:text-primary">
                    <User className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="font-semibold border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="font-semibold hover:bg-primary/10 hover:text-primary">Log In</Button>
                </Link>
                <Link to="/signup">
                  <MagneticButton className="font-bold bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-xl transition-all duration-300 shadow-lg glow-primary">
                    <Zap className="w-4 h-4 mr-1" />
                    Get Started
                  </MagneticButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section - 3D FUTURISTIC */}
      <motion.section 
        style={{ 
          y: heroY, 
          scale: heroScale, 
          opacity: heroOpacity, 
          rotateX: heroRotate,
          perspective: '1000px',
        }}
        className="container mx-auto px-4 pt-12 pb-20 md:pt-16 md:pb-28 relative min-h-[90vh] flex items-center overflow-hidden"
      >
        {/* Static gradient mesh - no animation for performance */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.08) 0%, transparent 70%)
            `,
          }}
        />
        
        {/* Static ring - no animation for performance */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,600px)] h-[min(90vw,600px)] rounded-full border border-primary/10 pointer-events-none" />
        
        {/* 3D Container with flowing middle section */}
        <motion.div 
          className="grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center max-w-[90rem] mx-auto w-full relative"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1500px',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0 }}
        >
          {/* Flowing particles disabled for performance */}
          {/* Left Content - 3D TRANSFORMED */}
          <motion.div 
            initial={{ opacity: 0, x: -50, rotateY: -20, z: -100 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              rotateY: 0,
              z: 0,
            }}
            transition={{ duration: 1, type: 'spring' }}
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px',
            }}
            className="relative z-10 lg:col-span-1"
            whileHover={{
              rotateY: 5,
              z: 20,
              transition: { duration: 0.3 }
            }}
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 text-foreground px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-primary/20 backdrop-blur-sm cursor-pointer"
            >
              <motion.span
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Flame className="w-3.5 h-3.5 text-warning" />
              </motion.span>
              <span className="uppercase tracking-widest">Start Building Wealth Today</span>
              <motion.span
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <Star className="w-3.5 h-3.5 text-warning" />
              </motion.span>
            </motion.div>
            
            {/* Main Headline - 3D FUTURISTIC */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter mb-6 leading-[0.95] relative"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1200px',
              }}
            >
              <motion.span 
                className="block text-foreground relative z-10"
                initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -20, z: -50 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  rotateX: 0,
                  z: 0,
                }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{
                  rotateY: 5,
                  z: 30,
                  scale: 1.02,
                }}
              >
                Build Your
                {/* 3D Glow effect behind text */}
                <motion.span
                  className="absolute inset-0 blur-2xl text-primary/30 -z-10"
                  style={{
                    transform: 'translateZ(-50px)',
                  }}
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Build Your
                </motion.span>
              </motion.span>
              <motion.span 
                className="block gradient-text relative z-10"
                initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -20, z: -50 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  rotateX: 0,
                  z: 0,
                }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{
                  rotateY: -5,
                  z: 30,
                  scale: 1.02,
                }}
              >
                {/* Solid text - no flashing */}
                <span className="inline relative z-10">Financial Empire</span>
                {/* Single static sparkle */}
                <motion.span 
                  className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 z-20"
                  animate={{ 
                    rotate: [0, 20, -20, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                >
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-warning drop-shadow-lg" />
                </motion.span>
              </motion.span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed"
            >
              Master investing with <motion.span 
                className="text-primary font-semibold"
                whileHover={{ scale: 1.1 }}
                style={{ display: 'inline-block' }}
              >zero risk</motion.span>. 
              Trade stocks, crush the leaderboard, and build skills that'll set you apart.
            </motion.p>
            
            {/* CTA Buttons - ULTRA ENHANCED */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10 relative z-10"
            >
              <Link to={user ? "/dashboard" : "/signup"}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative overflow-visible"
                >
                  {/* Glow effect behind button - reduced intensity */}
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-xl opacity-30"
                    whileHover={{
                      opacity: [0.3, 0.5, 0.3],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <MagneticButton 
                    size="lg" 
                    className="gap-3 bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-2xl transition-all duration-500 shadow-xl glow-primary font-bold px-8 py-6 rounded-2xl text-lg group relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {/* Animated background gradient - only on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      whileHover={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      style={{ backgroundSize: '200% 100%' }}
                    />
                    {/* Shimmer effect - only on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                      whileHover={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                    <span className="relative z-10 flex items-center">
                      <Play className="w-5 h-5 fill-current mr-2" />
                    </span>
                    <span className="relative z-10">
                      {user ? "Go to Dashboard" : "Start Free Today"}
                    </span>
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: [0, 4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </MagneticButton>
                </motion.div>
              </Link>
              <Link to={user ? "/learn" : "/login"}>
                <motion.div 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.99 }}
                  className="overflow-visible"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-primary/40 hover:bg-primary/10 hover:border-primary font-semibold px-8 py-6 rounded-2xl transition-all duration-300 group whitespace-nowrap"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Explore Lessons
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-6"
            >
              <div className="flex -space-x-2">
                {['🚀', '💎', '📈', '🔥', '⭐'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1 + i * 0.1, type: 'spring' }}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.05 }}
                    >
                      <Star className="w-4 h-4 fill-warning text-warning" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Loved by teens everywhere</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right - Dashboard Preview - 3D FLOATING */}
          <motion.div
            initial={{ opacity: 0, x: 80, rotateY: -30, rotateX: 10, scale: 0.9, z: -200 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              rotateY: 0, 
              rotateX: 0,
              scale: 1,
              z: 0,
            }}
            transition={{ duration: 1.2, delay: 0.2, type: 'spring', stiffness: 100 }}
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1500px',
            }}
            className="relative lg:col-span-1"
            whileHover={{
              rotateY: 5,
              rotateX: -2,
              z: 50,
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
          >
            {/* Static glow layers behind dashboard - aligned with dashboard, no cursor tracking */}
            <div 
              className="absolute -inset-20 bg-gradient-radial from-primary/30 via-primary/10 to-transparent blur-3xl pointer-events-none"
            />
            <div 
              className="absolute -inset-10 bg-gradient-radial from-accent/20 via-transparent to-transparent blur-2xl pointer-events-none"
            />
            {/* Single static ring for depth */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 pointer-events-none"
              style={{ width: '500px', height: '500px' }}
            />
            
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotateX: [0, 5, 0],
                rotateY: [-3, 3, -3],
                z: [0, 30, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ 
                perspective: '1500px',
                transformStyle: 'preserve-3d',
              }}
              className="w-full hidden lg:block"
            >
              <motion.div
                style={{
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  rotateY: [0, 2, 0],
                  rotateX: [0, 1, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <AnimatedDashboard />
              </motion.div>
            </motion.div>
            
            {/* Mobile-friendly simplified dashboard */}
            <div className="lg:hidden mt-8">
              <AnimatedDashboard />
            </div>
            
            {/* Enhanced floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 1.5, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="absolute -top-6 -right-6 p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl cursor-pointer hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-muted-foreground">Today's Gain</p>
                  <p className="text-lg font-bold text-success">
                    +$245.00
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: 20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 1.8, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl cursor-pointer hidden lg:block"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Flame className="w-6 h-6 text-warning" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold">7 Day Streak! 🔥</p>
                  <p className="text-xs text-muted-foreground">Keep it going!</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            whileInView={{ y: [0, 10, 0] }}
            viewport={{ once: true }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <MousePointer2 className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Live Stock Ticker - MEDIUM SIZE (Educational - Shows Real Data) */}
      <section className="py-8 md:py-10 relative overflow-hidden" aria-label="Live stock ticker">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, 
                transparent 0%, 
                hsl(var(--primary) / 0.05) 25%, 
                hsl(var(--accent) / 0.05) 50%, 
                hsl(var(--primary) / 0.05) 75%, 
                transparent 100%
              )
            `,
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        {/* Top border glow - enhanced */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary via-accent to-transparent"
          animate={{ 
            opacity: [0.3, 1, 0.3],
            boxShadow: [
              '0 0 10px hsl(var(--primary) / 0.3)',
              '0 0 20px hsl(var(--primary) / 0.6)',
              '0 0 10px hsl(var(--primary) / 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-hidden="true"
        />
        
        <div className="bg-gradient-to-r from-card/80 via-muted/50 to-card/80 backdrop-blur-sm border-y border-border/30 supports-[backdrop-filter]:from-card/60 overflow-hidden">
          <div className="py-5 overflow-hidden">
            <Marquee speed={25}>
              {[
                { symbol: 'AAPL', change: '+2.4%', price: '$178.25' },
                { symbol: 'TSLA', change: '+5.1%', price: '$245.50' },
                { symbol: 'GOOGL', change: '+1.2%', price: '$140.80' },
                { symbol: 'MSFT', change: '+0.8%', price: '$378.90' },
                { symbol: 'AMZN', change: '+3.2%', price: '$185.30' },
                { symbol: 'NVDA', change: '+4.5%', price: '$890.20' },
                { symbol: 'META', change: '+2.8%', price: '$505.60' },
                { symbol: 'NFLX', change: '+1.9%', price: '$628.40' },
              ].map((stock, i) => (
                <motion.div 
                  key={i} 
                  className="mx-4 md:mx-6 flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 rounded-xl bg-card/50 border border-border/30 cursor-pointer group flex-shrink-0"
                  whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  <span className="text-base md:text-lg font-black text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{stock.symbol}</span>
                  <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{stock.price}</span>
                  <span 
                    className="text-xs md:text-sm font-bold text-success flex items-center gap-1 whitespace-nowrap"
                  >
                    <TrendingUp className="w-3 h-3" />
                    {stock.change}
                  </span>
                </motion.div>
              ))}
            </Marquee>
          </div>
          
          {/* Reverse direction ticker */}
          <div className="py-5 border-t border-border/20 overflow-hidden">
            <Marquee speed={30} direction="right">
              {['🚀 NVDA hits all-time high', '📈 Markets rally on earnings', '💎 Diamond hands win again', '🔥 Tech sector on fire', '⭐ Best month for retail traders', '🎯 AI stocks surge 15%', '💰 Record trading volume'].map((news, i) => (
                <motion.span 
                  key={i} 
                  className="mx-6 md:mx-8 text-xs md:text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                >
                  {news}
                </motion.span>
              ))}
            </Marquee>
          </div>
        </div>
        
        {/* Bottom border glow - scroll-triggered */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0.2, 0.6, 0.2] }}
          viewport={{ once: true }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      </section>

      {/* Why Start Early - TIME IS YOUR SUPERPOWER - BIGGER (Most Important Educational Content) */}
      <section className="py-32 md:py-40 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">The Math Doesn't Lie</p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8">
                Time Is Your <span className="gradient-text">Superpower</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10">
                Every year you wait costs you thousands. Start at <strong className="text-primary">15</strong> vs <strong className="text-muted-foreground">25</strong>—same $100/month—could mean <strong className="text-primary">~2× more</strong> by retirement.
              </p>
              
              <div className="space-y-5">
                {[
                  { emoji: '💰', title: 'Compound Growth', desc: 'Watch your money multiply while you sleep' },
                  { emoji: '🧠', title: 'Build Skills Early', desc: 'Learn to read markets before your peers' },
                  { emoji: '🛡️', title: 'Zero Risk Practice', desc: 'Make mistakes with fake money, not real' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    whileHover={{ x: 6, scale: 1.02 }}
                    className="flex items-start gap-5 p-6 rounded-2xl bg-card/50 border-2 border-border/50 hover:border-primary/40 transition-colors cursor-pointer shadow-lg"
                  >
                    <span className="text-4xl">{item.emoji}</span>
                    <div>
                      <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                      <p className="text-base text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
              <motion.div
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' }}
              className="relative"
            >
              <div className="bg-card rounded-3xl p-8 md:p-10 border-2 border-border/50 shadow-2xl relative overflow-hidden">
                <div className="relative">
                  <h4 className="text-xl md:text-2xl font-bold mb-6 text-center text-muted-foreground">
                    $100/month · 7% return
                  </h4>
                  <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
                    <motion.div 
                      className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/40 shadow-lg"
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <p className="text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-1">
                        $<SpringCounter value={500} />K+
                      </p>
                      <p className="text-sm font-bold text-foreground">Start at 15</p>
                      <p className="text-xs text-primary/80 mt-1">45 years · compound growth</p>
                    </motion.div>
                    <motion.div 
                      className="text-center p-5 md:p-6 rounded-2xl bg-muted/50 border-2 border-border/50"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <p className="text-3xl md:text-4xl lg:text-5xl font-black text-muted-foreground mb-1">
                        $<SpringCounter value={250} />K
                      </p>
                      <p className="text-sm font-semibold text-muted-foreground">Start at 25</p>
                      <p className="text-xs text-muted-foreground mt-1">35 years</p>
                    </motion.div>
                  </div>
                  <div className="text-center py-4 px-4 rounded-xl bg-success/10 border border-success/30">
                    <p className="text-base md:text-lg font-bold text-success flex items-center justify-center gap-2 flex-wrap">
                      <Flame className="w-5 h-5 shrink-0" />
                      10 years earlier ≈ 2× the wealth
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section with Enhanced Interactions - MEDIUM SIZE */}
      <section className="py-16 md:py-20 relative">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: [1, 1.3, 1], x: [-20, 20, -20] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], x: [20, -20, 20] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.p 
              className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3"
              animate={{ letterSpacing: ['0.2em', '0.4em', '0.2em'] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              What You Get
            </motion.p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Everything You Need to <span className="gradient-text">Start Investing</span>
            </h2>
          </motion.div>
          
          <motion.div
            initial="visible"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {[
              { value: 10, suffix: 'K', label: 'Virtual Cash', icon: '💰', color: 'from-primary to-primary-glow', prefix: '$' },
              { value: 5000, suffix: '+', label: 'Real Stocks', icon: '📈', color: 'from-accent to-chart-5' },
              { value: 0, suffix: '', label: 'Real Risk', icon: '🛡️', color: 'from-chart-3 to-primary' },
              { value: 100, suffix: '%', label: 'Free Forever', icon: '⭐', color: 'from-warning to-chart-5' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0, rotateX: 0 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.08, y: -15, rotateY: 5 }}
                className="relative text-center p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 cursor-pointer group overflow-hidden"
              >
                {/* Animated gradient background on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                
                {/* Floating icon */}
                <motion.span 
                  className="text-5xl mb-4 block relative z-10"
                  animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                >
                  {stat.icon}
                </motion.span>
                
                <p className="text-4xl md:text-5xl font-black gradient-text mb-2 relative z-10">
                  <SpringCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider relative z-10">{stat.label}</p>
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Assistant Bento - BIGGER (Key Educational Tool) */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        <ParallaxSection speed={0.3}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <motion.p 
                className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3"
                initial={{ opacity: 0, letterSpacing: '0.1em' }}
                whileInView={{ opacity: 1, letterSpacing: '0.3em' }}
                viewport={{ once: true }}
              >
                AI-Powered Learning
              </motion.p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
                Your <span className="gradient-text">24/7</span> Trading Coach
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Get instant answers, personalized insights, and expert guidance—written for teens, not Wall Street.
              </p>
            </motion.div>
            
            {/* Bento Grid - BIGGER AI CARD */}
            <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* Large Card - ENHANCED SIZE */}
              <TiltCard className="md:col-span-2 md:row-span-2">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="h-full rounded-3xl bg-card border-2 border-border/50 p-8 md:p-10 shadow-2xl"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <motion.div 
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-xl glow-primary"
                      >
                        <Bot className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="flex gap-2">
                        <motion.span 
                          className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Live
                        </motion.span>
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">Free</span>
                      </div>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-bold mb-5">Ask Anything About Investing</h3>
                    <p className="text-lg text-muted-foreground mb-8 flex-grow">
                      No question is too basic. Our AI coach explains complex concepts in simple terms, 
                      analyzes your portfolio, and helps you make smarter decisions.
                    </p>
                    
                    {/* Mock chat interface */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start gap-3 mb-3">
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        >
                          <Bot className="w-4 h-4 text-white" />
                        </motion.div>
                        <motion.div 
                          className="flex-1 bg-card rounded-xl p-3 text-sm"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                        >
                          Great question! A P/E ratio shows how much investors pay per dollar of earnings. 
                          Lower = potentially undervalued, higher = growth expectations. For teens, focus on companies you understand first! 📊
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Ask about stocks, strategies, anything..."
                          className="flex-1 bg-background rounded-lg px-4 py-2 text-sm border border-border/50 focus:border-primary/50 focus:outline-none transition-colors"
                          disabled
                        />
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button size="sm" className="rounded-lg">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
              
              {/* Small Cards */}
              <FeatureCard
                icon={Target}
                title="Smart Insights"
                desc="Get personalized recommendations based on your trading style and goals."
                gradient="from-accent to-chart-5"
                delay={0.1}
              />
              
              <FeatureCard
                icon={Shield}
                title="Risk Analysis"
                desc="Understand your portfolio's risk level with easy-to-understand breakdowns."
                gradient="from-chart-3 to-primary"
                delay={0.2}
              />
            </div>
          </div>
        </ParallaxSection>
      </section>

      {/* Velocity scroll text - SMALLER (Decorative) */}
      <section className="py-6 overflow-hidden">
        <VelocityText text="LEARN • TRADE • DOMINATE • " />
      </section>

      {/* Features Bento Grid - MEDIUM SIZE */}
      <section className="py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">Your Arsenal</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Tools That <span className="gradient-text">Dominate</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to learn, trade, and compete. No fluff, just power.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {[
              { icon: BarChart3, title: 'Stock Screener', desc: 'Filter 1,500+ stocks by price, sector, and risk. Find your next winner.', gradient: 'from-primary to-primary-glow', span: 'lg:col-span-2' },
              { icon: Briefcase, title: 'Paper Trading', desc: 'Trade with $10K virtual cash. Real market data, zero losses.', gradient: 'from-accent to-chart-5', span: '' },
              { icon: Trophy, title: 'Leaderboards', desc: 'Compete globally. Flex on friends.', gradient: 'from-warning to-chart-5', span: '' },
              { icon: BookOpen, title: 'Bite-Sized Lessons', desc: 'Learn investing in 5-minute lessons. No boring lectures.', gradient: 'from-chart-3 to-primary', span: '' },
              { icon: Rocket, title: 'Level Up System', desc: 'Earn XP, unlock achievements, and track your progress.', gradient: 'from-chart-5 to-destructive', span: '' },
              { icon: Sparkles, title: 'AI Explanations', desc: 'Every market move explained in teen-friendly language.', gradient: 'from-primary to-accent', span: 'lg:col-span-2' },
            ].map((feature, i) => (
              <motion.div key={i} className={feature.span}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  desc={feature.desc}
                  gradient={feature.gradient}
                  delay={i * 0.05}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Testimonials Section - SMALLER (Social Proof, Less Educational) */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">What Teens Say</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Real Stories, <span className="gradient-text">Real Growth</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { name: 'Alex M.', age: '16', avatar: '🧑‍💻', quote: "I went from knowing nothing about stocks to having a $15K virtual portfolio. TeenVest made it so easy to learn!", rating: 5 },
              { name: 'Sarah K.', age: '17', avatar: '👩‍🎓', quote: "The AI coach is like having a finance teacher available 24/7. My parents are impressed with how much I've learned.", rating: 5 },
              { name: 'Jordan T.', age: '15', avatar: '🎮', quote: "Competing on the leaderboard with friends made learning investing actually fun. I'm ranked top 100 now!", rating: 5 },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring' }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 cursor-pointer group"
              >
                {/* Quote mark */}
                <motion.div 
                  className="absolute -top-4 -left-2 text-6xl text-primary/20 font-serif"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  "
                </motion.div>
                
                <p className="text-muted-foreground mb-6 relative z-10">{testimonial.quote}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-3xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    >
                      {testimonial.avatar}
                    </motion.span>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">Age {testimonial.age}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5 + j * 0.1 }}
                      >
                        <Star className="w-4 h-4 fill-warning text-warning" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Hover glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - BIGGEST (Most Important Conversion Point) */}
      <section className="py-40 md:py-52 relative overflow-hidden">
        {/* Animated background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/10 to-background"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/30 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-accent/30 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        {/* Confetti-like particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, (Math.random() - 0.5) * 100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            {/* Animated rocket */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <motion.div
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <Rocket className="w-12 h-12 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Ready to <span className="gradient-text">Level Up</span>?
            </motion.h2>
            
            <motion.p 
              className="text-2xl md:text-3xl text-muted-foreground mb-16 max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Join thousands of teens building their financial future. 
              Start with <span className="text-primary font-bold">$10K virtual cash</span>—zero risk, all gains.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to={user ? "/dashboard" : "/signup"}>
                <MagneticButton 
                  size="lg" 
                  className="gap-4 bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)] transition-all duration-500 shadow-xl glow-primary font-bold px-16 py-10 rounded-3xl text-2xl md:text-3xl"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6" />
                  </motion.span>
                  {user ? "Go to Dashboard" : "Start Your Journey"}
                  <motion.span
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.span>
                </MagneticButton>
              </Link>
              
              <p className="text-sm text-muted-foreground">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨ No credit card required
                </motion.span>
              </p>
            </motion.div>
            
            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex items-center justify-center gap-4"
            >
              <div className="flex -space-x-3">
                {['🚀', '💎', '📈', '🔥', '⭐', '💰'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 + i * 0.1, type: 'spring' }}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-card to-muted border-2 border-background flex items-center justify-center text-sm cursor-pointer"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">Free forever</span> — no credit card required
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="border-t border-border/50 py-16 bg-card/50 relative overflow-hidden z-10" 
        role="contentinfo"
      >
        {/* Footer background animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          aria-hidden="true"
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-black gradient-text">TeenVest</span>
            </Link>
            
            <p className="text-sm text-foreground text-center md:text-left whitespace-nowrap px-4 py-2 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
              © 2025 TeenVest <span className="font-bold text-primary text-base">v1.2</span>. Building the next generation of investors. 🚀
            </p>
            
            <div className="flex items-center gap-8">
              {['Terms', 'Privacy', 'Contact'].map((link, i) => (
                <motion.a 
                  key={link}
                  href="#" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
                  whileHover={{ y: -3 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {link}
                  <motion.span 
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform"
                  />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add enhanced 3D styles */}
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px hsl(var(--primary) / 0.3);
        }
        .gradient-text {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)));
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .glow-primary {
          box-shadow: 0 0 20px hsl(var(--primary) / 0.5),
                      0 0 40px hsl(var(--primary) / 0.3),
                      0 0 60px hsl(var(--primary) / 0.2);
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
        /* 3D Transform utilities - only apply to specific elements */
        .preserve-3d {
          transform-style: preserve-3d;
        }
        @keyframes float-3d {
          0%, 100% { 
            transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg);
          }
          25% { 
            transform: translate3d(10px, -10px, 20px) rotateX(5deg) rotateY(5deg);
          }
          50% { 
            transform: translate3d(-10px, 10px, -20px) rotateX(-5deg) rotateY(-5deg);
          }
          75% { 
            transform: translate3d(5px, -5px, 10px) rotateX(3deg) rotateY(-3deg);
          }
        }
        @keyframes flow-around {
          0% { 
            transform: translate3d(0, 0, 0) rotateY(0deg);
          }
          33% { 
            transform: translate3d(50px, -30px, 50px) rotateY(120deg);
          }
          66% { 
            transform: translate3d(-50px, 30px, -50px) rotateY(240deg);
          }
          100% { 
            transform: translate3d(0, 0, 0) rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

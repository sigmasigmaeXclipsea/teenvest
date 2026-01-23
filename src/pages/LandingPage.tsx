import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, Zap, Flame, Rocket, User, LogOut, Play, Star, ChevronRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMultipleStockQuotes } from '@/hooks/useStockAPI';

// Cursor follower component with trail
const CursorFollower = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleHoverStart = () => setIsHovering(true);
    const handleHoverEnd = () => setIsHovering(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    document.querySelectorAll('button, a').forEach(el => {
      el.addEventListener('mouseenter', handleHoverStart);
      el.addEventListener('mouseleave', handleHoverEnd);
    });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
      {/* Trail particles */}
      {[...Array(5)].map((_, i) => (
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
};

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

// 3D Tilt card component
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

// Morphing blob shape
const MorphingBlob = ({ className }: { className?: string }) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        borderRadius: [
          '60% 40% 30% 70%/60% 30% 70% 40%',
          '30% 60% 70% 40%/50% 60% 30% 60%',
          '60% 40% 30% 70%/60% 30% 70% 40%',
        ],
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
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

// Floating interactive orb
const InteractiveOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`absolute rounded-full cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isHovered ? 1.3 : 1,
        opacity: 1,
        y: isHovered ? 0 : [0, -20, 0],
        x: isHovered ? 0 : [0, 10, 0],
      }}
      transition={{
        scale: { type: 'spring', stiffness: 300 },
        opacity: { delay, duration: 1 },
        y: { duration: 6 + delay, repeat: Infinity, ease: 'easeInOut' },
        x: { duration: 8 + delay, repeat: Infinity, ease: 'easeInOut' },
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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

// Floating particles background
const FloatingParticles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, Math.random() * -500],
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
};

// Interactive grid background
const GridBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.3) 0%, transparent 25%),
            linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}
      />
    </div>
  );
};

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
  const { data: stockQuotes, isLoading } = useMultipleStockQuotes(stockSymbols);
  
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
    
    // Fallback while loading
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: '...', color: colors[0] },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 0, change: '...', color: colors[1] },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 0, change: '...', color: colors[2] },
      { symbol: 'MSFT', name: 'Microsoft', price: 0, change: '...', color: colors[3] },
    ];
  }, [stockQuotes]);
  
  // Calculate portfolio value from real stock prices
  const portfolioValue = useMemo(() => {
    if (!stockQuotes || stockQuotes.length === 0) return 10000;
    // Simulate holdings: 10 AAPL, 5 TSLA, 2 NVDA, 8 MSFT
    const holdings = { AAPL: 10, TSLA: 5, NVDA: 2, MSFT: 8 };
    return stockQuotes.reduce((total, quote) => {
      const shares = holdings[quote.symbol as keyof typeof holdings] || 0;
      return total + (quote.price * shares);
    }, 0);
  }, [stockQuotes]);
  
  // Calculate today's gain from real data
  const todaysGain = useMemo(() => {
    if (!stockQuotes || stockQuotes.length === 0) return 0;
    const holdings = { AAPL: 10, TSLA: 5, NVDA: 2, MSFT: 8 };
    return stockQuotes.reduce((total, quote) => {
      const shares = holdings[quote.symbol as keyof typeof holdings] || 0;
      return total + (quote.change * shares);
    }, 0);
  }, [stockQuotes]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStock((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <TiltCard className="w-full">
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
                whileHover={{ scale: 1.4, backgroundColor: dot.hoverColor }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ delay: i * 0.15, duration: 2, repeat: Infinity }}
              />
            ))}
          </motion.div>
          <div className="flex-1 flex justify-center">
            <motion.div 
              className="px-6 py-1.5 rounded-xl bg-background/80 text-sm text-muted-foreground font-medium border border-border/50"
              whileHover={{ scale: 1.02 }}
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔒 teenvests.com/dashboard
              </motion.span>
            </motion.div>
          </div>
        </div>
        
        {/* Dashboard content - LARGER */}
        <div className="p-6 space-y-5">
          {/* Stats with enhanced interactions */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Portfolio Value', value: Math.round(portfolioValue), prefix: '$', change: todaysGain >= 0 ? `+${((todaysGain / portfolioValue) * 100).toFixed(1)}%` : `${((todaysGain / portfolioValue) * 100).toFixed(1)}%`, icon: '💰' },
              { label: "Today's Gain", value: Math.abs(Math.round(todaysGain)), prefix: todaysGain >= 0 ? '+$' : '-$', change: todaysGain >= 0 ? '📈' : '📉', icon: '📊' },
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
              ) : (
                <>
                  <span className={todaysGain >= 0 ? 'text-success' : 'text-destructive'}>
                    {todaysGain >= 0 ? '+' : ''}{((todaysGain / portfolioValue) * 100).toFixed(1)}%
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
                    <p className="text-sm font-semibold">${stock.price}</p>
                    <motion.p 
                      className="text-xs text-success font-bold"
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
    </TiltCard>
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
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Custom cursor */}
      <CursorFollower />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Interactive grid */}
      <GridBackground />
      
      {/* Morphing background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <MorphingBlob className="w-[800px] h-[800px] bg-primary/10 -top-[300px] -left-[300px]" />
        <MorphingBlob className="w-[600px] h-[600px] bg-accent/10 bottom-[-200px] right-[-200px]" />
        <MorphingBlob className="w-[400px] h-[400px] bg-chart-3/10 top-1/2 left-1/3" />
      </div>
      
      {/* Interactive orbs */}
      <InteractiveOrb className="w-20 h-20 bg-gradient-to-br from-primary/40 to-accent/40 top-[20%] left-[10%] blur-sm" delay={0} />
      <InteractiveOrb className="w-16 h-16 bg-gradient-to-br from-accent/40 to-chart-3/40 top-[40%] right-[15%] blur-sm" delay={1} />
      <InteractiveOrb className="w-12 h-12 bg-gradient-to-br from-warning/40 to-destructive/40 bottom-[30%] left-[20%] blur-sm" delay={2} />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="border-b border-primary/10 bg-background/60 backdrop-blur-2xl sticky top-0 z-50"
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
          
          <nav className="hidden md:flex items-center gap-8">
            {['Learn', 'Screener', 'Leaderboard'].map((label, i) => (
              <Link 
                key={label} 
                to={user ? `/${label.toLowerCase()}` : '/login'} 
                className="relative group"
              >
                <motion.span 
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all duration-300"
                  whileHover={{ y: -2 }}
                >
                  {label}
                </motion.span>
                <motion.span 
                  className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-primary to-accent rounded-full w-0 group-hover:w-full transition-all duration-300"
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

      {/* Hero Section - ENHANCED */}
      <motion.section 
        style={{ y: heroY, scale: heroScale, opacity: heroOpacity, rotateX: heroRotate }}
        className="container mx-auto px-4 pt-12 pb-20 md:pt-16 md:pb-28 relative min-h-[90vh] flex items-center"
      >
        {/* Glowing rings behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <GlowingRing size={400} delay={0} />
          <GlowingRing size={600} delay={1} />
          <GlowingRing size={800} delay={2} />
        </div>
        
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center max-w-[90rem] mx-auto w-full">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, type: 'spring' }}
            className="relative z-10"
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
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Flame className="w-3.5 h-3.5 text-warning" />
              </motion.span>
              <span className="uppercase tracking-widest">Start Building Wealth Today</span>
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Star className="w-3.5 h-3.5 text-warning" />
              </motion.span>
            </motion.div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.95]">
              <motion.span 
                className="block text-foreground"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Build Your
              </motion.span>
              <motion.span 
                className="block gradient-text relative"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <RevealText text="Financial Empire" className="inline" />
                <motion.span 
                  className="absolute -right-4 -top-4"
                  animate={{ 
                    rotate: [0, 20, 0],
                    scale: [1, 1.2, 1],
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-warning" />
                </motion.span>
              </motion.span>
            </h1>
            
            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed"
            >
              Master investing with <motion.span 
                className="text-primary font-semibold"
                whileHover={{ scale: 1.1 }}
                style={{ display: 'inline-block' }}
              >zero risk</motion.span>. 
              Trade stocks, crush the leaderboard, and build skills that'll set you apart.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <Link to={user ? "/dashboard" : "/signup"}>
                <MagneticButton 
                  size="lg" 
                  className="gap-3 bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-2xl transition-all duration-500 shadow-xl glow-primary font-bold px-8 py-6 rounded-2xl text-lg group"
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </motion.span>
                  {user ? "Go to Dashboard" : "Start Free Today"}
                  <motion.span
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </MagneticButton>
              </Link>
              <Link to={user ? "/learn" : "/login"}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-primary/40 hover:bg-primary/10 hover:border-primary font-semibold px-8 py-6 rounded-2xl transition-all duration-300 group"
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
          
          {/* Right - Dashboard Preview - BIGGER AND MORE PROMINENT */}
          <motion.div
            initial={{ opacity: 0, x: 80, rotateY: -15, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, type: 'spring', stiffness: 100 }}
            className="relative"
          >
            {/* Multiple glow layers behind dashboard */}
            <motion.div 
              className="absolute -inset-20 bg-gradient-radial from-primary/40 via-primary/15 to-transparent blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -inset-10 bg-gradient-radial from-accent/30 via-transparent to-transparent blur-2xl"
              animate={{ scale: [1.1, 1.3, 1.1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
            
            {/* Orbiting elements */}
            <motion.div
              className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg"
              animate={{
                rotate: 360,
                x: [0, 50, 0, -50, 0],
                y: [-50, 0, 50, 0, -50],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ top: '10%', left: '5%' }}
            />
            <motion.div
              className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-warning to-destructive shadow-lg"
              animate={{
                rotate: -360,
                x: [0, -40, 0, 40, 0],
                y: [40, 0, -40, 0, 40],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{ bottom: '15%', right: '0%' }}
            />
            
            <motion.div
              animate={{ 
                y: [0, -12, 0],
                rotateX: [0, 2, 0],
                rotateY: [-2, 2, -2],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ perspective: 1200 }}
            >
              <AnimatedDashboard />
            </motion.div>
            
            {/* Enhanced floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 1.5, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="absolute -top-6 -right-6 p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-muted-foreground">Today's Gain</p>
                  <motion.p 
                    className="text-lg font-bold text-success"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    +$245.00
                  </motion.p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: 20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 1.8, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
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
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
            whileHover={{ scale: 1.1 }}
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <MousePointer2 className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Live Stock Ticker - Enhanced */}
      <section className="py-6 relative overflow-hidden">
        {/* Top border glow */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <div className="bg-gradient-to-r from-card/80 via-muted/50 to-card/80 backdrop-blur-sm border-y border-border/30">
          <div className="py-5">
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
                  className="mx-6 flex items-center gap-3 px-5 py-2.5 rounded-xl bg-card/50 border border-border/30 cursor-pointer group"
                  whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{stock.symbol}</span>
                  <span className="text-sm text-muted-foreground">{stock.price}</span>
                  <motion.span 
                    className="text-sm font-bold text-success flex items-center gap-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {stock.change}
                  </motion.span>
                </motion.div>
              ))}
            </Marquee>
          </div>
          
          {/* Reverse direction ticker */}
          <div className="py-5 border-t border-border/20">
            <Marquee speed={30} direction="right">
              {['🚀 NVDA hits all-time high', '📈 Markets rally on earnings', '💎 Diamond hands win again', '🔥 Tech sector on fire', '⭐ Best month for retail traders', '🎯 AI stocks surge 15%', '💰 Record trading volume'].map((news, i) => (
                <motion.span 
                  key={i} 
                  className="mx-8 text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  {news}
                </motion.span>
              ))}
            </Marquee>
          </div>
        </div>
        
        {/* Bottom border glow */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </section>

      {/* Why Start Early - TIME IS YOUR SUPERPOWER */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">The Math Doesn't Lie</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Time Is Your <span className="gradient-text">Superpower</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every year you wait costs you thousands. Starting at 15 instead of 25 could mean 
                <motion.span 
                  className="text-primary font-bold"
                  whileHover={{ scale: 1.1 }}
                  style={{ display: 'inline-block' }}
                > 2X more wealth</motion.span> by retirement.
              </p>
              
              <div className="space-y-4">
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
                    transition={{ delay: i * 0.15, type: 'spring' }}
                    whileHover={{ x: 10, scale: 1.02 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <motion.span 
                      className="text-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    >
                      {item.emoji}
                    </motion.span>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring' }}
              className="relative"
            >
              <TiltCard>
                <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-2xl relative overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative">
                    <h4 className="text-lg font-bold mb-6 text-center">$100/month invested</h4>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <motion.div 
                        className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30"
                        whileHover={{ scale: 1.05 }}
                      >
                        <p className="text-4xl font-black gradient-text mb-2">
                          $<SpringCounter value={500} />K+
                        </p>
                        <p className="text-sm text-muted-foreground">Start at 15</p>
                        <p className="text-xs text-primary font-semibold mt-1">45 years of growth</p>
                      </motion.div>
                      <motion.div 
                        className="text-center p-6 rounded-2xl bg-muted/50 border border-border/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        <p className="text-4xl font-black text-muted-foreground mb-2">
                          $<SpringCounter value={250} />K
                        </p>
                        <p className="text-sm text-muted-foreground">Start at 25</p>
                        <p className="text-xs text-muted-foreground mt-1">35 years of growth</p>
                      </motion.div>
                    </div>
                    <motion.div 
                      className="text-center p-4 rounded-xl bg-success/10 border border-success/20"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <p className="text-success font-bold flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Flame className="w-4 h-4" />
                        </motion.div>
                        10 extra years = 2X more money
                        <motion.div
                          animate={{ rotate: [0, -360] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Flame className="w-4 h-4" />
                        </motion.div>
                      </p>
                    </motion.div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section with Enhanced Interactions */}
      <section className="py-24 relative">
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {[
              { value: 10, suffix: 'K', label: 'Virtual Cash', icon: '💰', color: 'from-primary to-primary-glow', prefix: '$' },
              { value: 1500, suffix: '+', label: 'Real Stocks', icon: '📈', color: 'from-accent to-chart-5' },
              { value: 0, suffix: '', label: 'Real Risk', icon: '🛡️', color: 'from-chart-3 to-primary' },
              { value: 100, suffix: '%', label: 'Free Forever', icon: '⭐', color: 'from-warning to-chart-5' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
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

      {/* AI Assistant Bento */}
      <section className="py-20 relative overflow-hidden">
        <ParallaxSection speed={0.3}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Your <span className="gradient-text">24/7</span> Trading Coach
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get instant answers, personalized insights, and expert guidance—written for teens, not Wall Street.
              </p>
            </motion.div>
            
            {/* Bento Grid */}
            <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {/* Large Card */}
              <TiltCard className="md:col-span-2 md:row-span-2">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="h-full rounded-3xl bg-card border border-border/50 p-6 md:p-8"
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
                    
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">Ask Anything About Investing</h3>
                    <p className="text-muted-foreground mb-6 flex-grow">
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

      {/* Velocity scroll text */}
      <section className="py-10 overflow-hidden">
        <VelocityText text="LEARN • TRADE • DOMINATE • " />
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 relative">
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
      {/* Testimonials Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">What Teens Say</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Real Stories, <span className="gradient-text">Real Growth</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 cursor-pointer group"
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

      {/* Final CTA - ENHANCED */}
      <section className="py-32 relative overflow-hidden">
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
              className="text-5xl md:text-7xl font-black tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Ready to <span className="gradient-text">Level Up</span>?
            </motion.h2>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
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
                  className="gap-3 bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)] transition-all duration-500 shadow-xl glow-primary font-bold px-12 py-8 rounded-3xl text-xl"
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
      <footer className="border-t border-border/50 py-16 bg-card/30 relative overflow-hidden">
        {/* Footer background animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
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
            
            <p className="text-sm text-muted-foreground text-center">
              © 2025 TeenVest. Building the next generation of investors. 🚀
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
      
      {/* Add stroke text styles */}
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px hsl(var(--primary) / 0.3);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

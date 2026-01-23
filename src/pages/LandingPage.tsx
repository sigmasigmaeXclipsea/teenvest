import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, Zap, Flame, Rocket, User, LogOut, Play, Star, ChevronRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useState, useEffect, useCallback } from 'react';

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

// Staggered text reveal
const RevealText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.03, duration: 0.5 }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
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

// Mock Dashboard with more animations
const AnimatedDashboard = () => {
  const [activeStock, setActiveStock] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStock((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const stocks = [
    { symbol: 'AAPL', price: 178.25, change: '+2.4%' },
    { symbol: 'TSLA', price: 245.50, change: '+5.1%' },
    { symbol: 'GOOGL', price: 140.80, change: '+1.2%' },
    { symbol: 'MSFT', price: 378.90, change: '+0.8%' },
  ];
  
  return (
    <TiltCard className="w-full">
      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-2xl">
        {/* Window controls */}
        <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-muted/30">
          <motion.div className="flex gap-1.5">
            {['destructive', 'warning', 'success'].map((color, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full bg-${color}/70`}
                whileHover={{ scale: 1.3 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ delay: i * 0.1, duration: 2, repeat: Infinity }}
              />
            ))}
          </motion.div>
          <div className="flex-1 flex justify-center">
            <motion.div 
              className="px-4 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              teenvest.app/dashboard
            </motion.div>
          </div>
        </div>
        
        {/* Dashboard content */}
        <div className="p-4 space-y-3">
          {/* Animated stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Portfolio', value: 12450, prefix: '$', change: '+12.4%' },
              { label: 'Today', value: 245, prefix: '+$', change: '+1.9%' },
              { label: 'Streak', value: 7, suffix: ' days', change: '🔥' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-3 rounded-xl bg-muted/30 border border-border/30 cursor-pointer"
              >
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-bold">
                  <SpringCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <motion.p 
                  className="text-[10px] text-success"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                >
                  {stat.change}
                </motion.p>
              </motion.div>
            ))}
          </div>
          
          {/* Animated chart */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.8 }}
            className="h-24 rounded-xl bg-gradient-to-t from-primary/20 via-primary/10 to-transparent border border-border/30 relative overflow-hidden"
          >
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <motion.path
                d="M0,80 Q50,60 100,70 T200,50 T300,40 T400,30"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 1 }}
              />
              {/* Animated dot on line */}
              <motion.circle
                cx="0"
                cy="80"
                r="5"
                fill="hsl(var(--primary))"
                animate={{
                  cx: [0, 100, 200, 300, 400],
                  cy: [80, 70, 50, 40, 30],
                }}
                transition={{ duration: 3, delay: 1.5, repeat: Infinity }}
              />
            </svg>
            {/* Glow effect */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          {/* Animated stock ticker */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {stocks.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: activeStock === i ? 1.02 : 1,
                    backgroundColor: activeStock === i ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.2)',
                  }}
                  transition={{ delay: 1.2 + i * 0.1, type: 'spring' }}
                  className="flex items-center justify-between p-2 rounded-lg border border-border/20"
                >
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold"
                      animate={activeStock === i ? { rotate: [0, 360] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {stock.symbol[0]}
                    </motion.div>
                    <div>
                      <p className="text-xs font-semibold">{stock.symbol}</p>
                      <p className="text-[9px] text-muted-foreground">${stock.price}</p>
                    </div>
                  </div>
                  <motion.span 
                    className="text-xs text-success font-semibold"
                    animate={activeStock === i ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {stock.change}
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
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

      {/* Hero Section */}
      <motion.section 
        style={{ y: heroY, scale: heroScale, opacity: heroOpacity, rotateX: heroRotate }}
        className="container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32 relative"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
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
              <span className="uppercase tracking-widest">Join 10,000+ Teen Investors</span>
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
          
          {/* Right - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3, type: 'spring' }}
            className="relative lg:pl-8"
          >
            {/* Glow behind dashboard */}
            <motion.div 
              className="absolute inset-0 bg-gradient-radial from-primary/30 via-primary/10 to-transparent blur-3xl scale-150"
              animate={{ scale: [1.5, 1.7, 1.5], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotateX: [0, 3, 0],
                rotateY: [-3, 3, -3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{ perspective: 1000 }}
            >
              <AnimatedDashboard />
            </motion.div>
            
            {/* Floating elements */}
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

      {/* Infinite Marquee */}
      <section className="py-8 border-y border-border/30 bg-muted/20 overflow-hidden">
        <Marquee speed={30}>
          {['AAPL +2.4%', 'TSLA +5.1%', 'GOOGL +1.2%', 'MSFT +0.8%', 'AMZN +3.2%', 'NVDA +4.5%', 'META +2.8%', 'NFLX +1.9%'].map((stock, i) => (
            <span key={i} className="mx-8 text-xl font-bold text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer">
              {stock} <span className="text-success">●</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* Stats Section with Spring Counters */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {[
              { value: 10000, suffix: '+', label: 'Active Traders', icon: '👥' },
              { value: 50, prefix: '$', suffix: 'M+', label: 'Traded Volume', icon: '📊' },
              { value: 1500, suffix: '+', label: 'Stocks Available', icon: '📈' },
              { value: 4.9, label: 'User Rating', icon: '⭐', suffix: '/5' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
              >
                <motion.span 
                  className="text-3xl mb-2 block"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                  {stat.icon}
                </motion.span>
                <p className="text-3xl md:text-4xl font-black gradient-text mb-1">
                  <SpringCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
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

      {/* Why Start Early */}
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

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring' }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Rocket className="w-16 h-16 text-primary" />
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Ready to <span className="gradient-text">Level Up</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of teens building their financial future. 
              Start with $10K virtual cash—zero risk, all gains.
            </p>
            
            <Link to={user ? "/dashboard" : "/signup"}>
              <MagneticButton 
                size="lg" 
                className="gap-3 bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-2xl transition-all duration-500 shadow-xl glow-primary font-bold px-12 py-8 rounded-2xl text-xl"
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
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
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold gradient-text">TeenVest</span>
            </Link>
            
            <p className="text-sm text-muted-foreground">
              © 2025 TeenVest. Building the next generation of investors.
            </p>
            
            <div className="flex items-center gap-6">
              {['Terms', 'Privacy', 'Contact'].map((link) => (
                <motion.a 
                  key={link}
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  whileHover={{ y: -2 }}
                >
                  {link}
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

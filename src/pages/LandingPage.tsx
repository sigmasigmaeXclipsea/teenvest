import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, Zap, Flame, Rocket, User, LogOut, Play, Star, ChevronRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame, type Variants } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useState } from 'react';

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const scaleRotate: Variants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -5 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
};

// Magnetic Button Component
const MagneticButton = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Button
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={className}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
};

// Floating Orb Component
const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = '' }: { value: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  
  useAnimationFrame((t) => {
    const progress = Math.min(t / 2000, 1);
    setDisplayValue(Math.floor(numericValue * progress));
  });
  
  return <span>{value.includes('$') ? '$' : ''}{displayValue.toLocaleString()}{suffix}</span>;
};

// Bento Card Component
const BentoCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
    className={`group relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 md:p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 ${className}`}
  >
    {/* Shimmer effect on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </div>
    {children}
  </motion.div>
);

// Mock Dashboard Component
const MockDashboard = () => (
  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-2xl">
    {/* Window controls */}
    <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-muted/30">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-destructive/70" />
        <div className="w-3 h-3 rounded-full bg-warning/70" />
        <div className="w-3 h-3 rounded-full bg-success/70" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="px-4 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">teenvest.app/dashboard</div>
      </div>
    </div>
    
    {/* Dashboard content */}
    <div className="p-4 space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Portfolio', value: '$12,450', change: '+12.4%', positive: true },
          { label: 'Today', value: '+$245', change: '+1.9%', positive: true },
          { label: 'Streak', value: '7 days', change: '🔥', positive: true },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="p-3 rounded-xl bg-muted/30 border border-border/30"
          >
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-bold">{stat.value}</p>
            <p className={`text-[10px] ${stat.positive ? 'text-success' : 'text-destructive'}`}>{stat.change}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Chart placeholder */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0.8 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.8 }}
        className="h-24 rounded-xl bg-gradient-to-t from-primary/20 via-primary/10 to-transparent border border-border/30 relative overflow-hidden"
      >
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M0,80 Q50,60 100,70 T200,50 T300,60 T400,30"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1 }}
          />
        </svg>
      </motion.div>
      
      {/* Holdings */}
      <div className="space-y-2">
        {[
          { symbol: 'AAPL', name: 'Apple Inc', change: '+2.4%' },
          { symbol: 'TSLA', name: 'Tesla Inc', change: '+5.1%' },
        ].map((stock, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.1 }}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold">{stock.symbol[0]}</div>
              <div>
                <p className="text-xs font-semibold">{stock.symbol}</p>
                <p className="text-[9px] text-muted-foreground">{stock.name}</p>
              </div>
            </div>
            <span className="text-xs text-success font-semibold">{stock.change}</span>
          </motion.div>
        ))}
      </div>
    </div>
    
    {/* Shimmer overlay */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
    />
  </div>
);

const LandingPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 animated-gradient opacity-40" />
        <div className="absolute inset-0 noise" />
        <FloatingOrb className="w-[600px] h-[600px] bg-primary/20 top-[-200px] left-[-200px]" />
        <FloatingOrb className="w-[500px] h-[500px] bg-accent/15 bottom-[-100px] right-[-100px]" delay={2} />
        <FloatingOrb className="w-[300px] h-[300px] bg-chart-3/10 top-1/2 left-1/3" delay={4} />
      </div>
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="border-b border-primary/10 bg-background/60 backdrop-blur-2xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-2xl glow-primary"
            >
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-2xl font-black tracking-tight gradient-text">TeenVest</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {[
              { to: user ? '/learn' : '/login', label: 'Learn' },
              { to: user ? '/screener' : '/login', label: 'Screener' },
              { to: user ? '/leaderboard' : '/login', label: 'Leaderboard' }
            ].map((link) => (
              <Link key={link.label} to={link.to} className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all duration-300 relative group">
                {link.label}
                <motion.span 
                  className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
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
        style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
        className="container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32 relative"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10"
          >
            {/* Badge */}
            <motion.div 
              variants={fadeIn}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 text-foreground px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-primary/20 backdrop-blur-sm"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-3.5 h-3.5 text-warning" />
              </motion.span>
              <span className="uppercase tracking-widest">Join 10,000+ Teen Investors</span>
              <Star className="w-3.5 h-3.5 text-warning" />
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.95]"
            >
              <span className="block text-foreground">Build Your</span>
              <motion.span 
                className="block gradient-text relative"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Financial Empire
                <motion.span 
                  className="absolute -right-4 -top-4"
                  animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-warning" />
                </motion.span>
              </motion.span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed"
            >
              Master investing with <span className="text-primary font-semibold">zero risk</span>. 
              Trade stocks, crush the leaderboard, and build skills that'll set you apart.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <Link to={user ? "/dashboard" : "/signup"}>
                <MagneticButton 
                  size="lg" 
                  className="gap-3 bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-2xl transition-all duration-500 shadow-xl glow-primary font-bold px-8 py-6 rounded-2xl text-lg group"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {user ? "Go to Dashboard" : "Start Free Today"}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </MagneticButton>
              </Link>
              <Link to={user ? "/learn" : "/login"}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-primary/40 hover:bg-primary/10 hover:border-primary font-semibold px-8 py-6 rounded-2xl transition-all duration-300 group"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explore Lessons
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
            
            {/* Trust Badges */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center gap-6"
            >
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-xs font-bold"
                  >
                    {['🚀', '💎', '📈', '🔥', '⭐'][i-1]}
                  </motion.div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Loved by teens everywhere</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right - Dashboard Preview */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="relative lg:pl-8"
          >
            {/* Glow behind dashboard */}
            <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-primary/10 to-transparent blur-3xl scale-150" />
            
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotateX: [0, 2, 0],
                rotateY: [-2, 2, -2],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ perspective: 1000 }}
            >
              <MockDashboard />
            </motion.div>
            
            {/* Floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute -top-6 -right-6 p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Today's Gain</p>
                  <p className="text-lg font-bold text-success">+$245.00</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8 }}
              className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-warning" />
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
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <MousePointer2 className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {[
              { value: '10,000+', label: 'Active Traders', icon: '👥' },
              { value: '$50M+', label: 'Traded Volume', icon: '📊' },
              { value: '1,500+', label: 'Stocks Available', icon: '📈' },
              { value: '4.9/5', label: 'User Rating', icon: '⭐' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <span className="text-3xl mb-2 block">{stat.icon}</span>
                <p className="text-3xl md:text-4xl font-black gradient-text mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Assistant Bento */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">AI-Powered Learning</p>
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
            <BentoCard className="md:col-span-2 md:row-span-2">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-xl glow-primary"
                  >
                    <Bot className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold">Live</span>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-card rounded-xl p-3 text-sm">
                      <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Great question! A P/E ratio shows how much investors pay per dollar of earnings. 
                        Lower = potentially undervalued, higher = growth expectations. For teens, focus on companies you understand first! 📊
                      </motion.span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask about stocks, strategies, anything..."
                      className="flex-1 bg-background rounded-lg px-4 py-2 text-sm border border-border/50 focus:border-primary/50 focus:outline-none transition-colors"
                      disabled
                    />
                    <Button size="sm" className="rounded-lg">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </BentoCard>
            
            {/* Small Cards */}
            <BentoCard delay={0.1}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-chart-5 flex items-center justify-center mb-4 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold mb-2">Smart Insights</h4>
              <p className="text-sm text-muted-foreground">
                Get personalized recommendations based on your trading style and goals.
              </p>
            </BentoCard>
            
            <BentoCard delay={0.2}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-3 to-primary flex items-center justify-center mb-4 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold mb-2">Risk Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Understand your portfolio's risk level with easy-to-understand breakdowns.
              </p>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
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
              { 
                icon: BarChart3, 
                title: 'Stock Screener', 
                desc: 'Filter 1,500+ stocks by price, sector, and risk. Find your next winner.',
                gradient: 'from-primary to-primary-glow',
                span: 'lg:col-span-2'
              },
              { 
                icon: Briefcase, 
                title: 'Paper Trading', 
                desc: 'Trade with $10K virtual cash. Real market data, zero losses.',
                gradient: 'from-accent to-chart-5',
                span: ''
              },
              { 
                icon: Trophy, 
                title: 'Leaderboards', 
                desc: 'Compete globally. Flex on friends.',
                gradient: 'from-warning to-chart-5',
                span: ''
              },
              { 
                icon: BookOpen, 
                title: 'Bite-Sized Lessons', 
                desc: 'Learn investing in 5-minute lessons. No boring lectures.',
                gradient: 'from-chart-3 to-primary',
                span: ''
              },
              { 
                icon: Rocket, 
                title: 'Level Up System', 
                desc: 'Earn XP, unlock achievements, and track your progress.',
                gradient: 'from-chart-5 to-destructive',
                span: ''
              },
              { 
                icon: Sparkles, 
                title: 'AI Explanations', 
                desc: 'Every market move explained in teen-friendly language.',
                gradient: 'from-primary to-accent',
                span: 'lg:col-span-2'
              },
            ].map((feature, i) => (
              <BentoCard key={i} delay={i * 0.05} className={feature.span}>
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* Why Start Early */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInLeft}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">The Math Doesn't Lie</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Time Is Your <span className="gradient-text">Superpower</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every year you wait costs you thousands. Starting at 15 instead of 25 could mean 
                <span className="text-primary font-bold"> 2X more wealth</span> by retirement.
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
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInRight}
              className="relative"
            >
              {/* Growth comparison chart */}
              <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="relative">
                  <h4 className="text-lg font-bold mb-6 text-center">$100/month invested</h4>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                      <p className="text-4xl font-black gradient-text mb-2">$500K+</p>
                      <p className="text-sm text-muted-foreground">Start at 15</p>
                      <p className="text-xs text-primary font-semibold mt-1">45 years of growth</p>
                    </div>
                    <div className="text-center p-6 rounded-2xl bg-muted/50 border border-border/50">
                      <p className="text-4xl font-black text-muted-foreground mb-2">$250K</p>
                      <p className="text-sm text-muted-foreground">Start at 25</p>
                      <p className="text-xs text-muted-foreground mt-1">35 years of growth</p>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-success font-bold flex items-center justify-center gap-2">
                      <Flame className="w-4 h-4" />
                      10 extra years = 2X more money
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
        className="relative py-24 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-accent" />
        <div className="absolute inset-0 noise opacity-20" />
        
        {/* Animated orbs */}
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        />
        
        <motion.div 
          variants={staggerContainer}
          className="container mx-auto px-4 text-center relative"
        >
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-5 py-2 rounded-full mb-6"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Rocket className="w-5 h-5 text-white" />
            </motion.span>
            <span className="text-white font-bold uppercase tracking-wider text-sm">Your Future Starts Now</span>
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            Stop Watching.<br />Start Building.
          </motion.h2>
          
          <motion.p 
            variants={fadeInUp}
            className="text-white/80 mb-10 max-w-2xl mx-auto text-lg md:text-xl"
          >
            Join 10,000+ teens who are already learning to invest. 
            100% free, zero risk, infinite potential.
          </motion.p>
          
          <motion.div variants={fadeInUp}>
            <Link to="/signup">
              <MagneticButton 
                size="lg" 
                className="gap-3 bg-white text-primary hover:bg-white/90 font-black px-10 py-7 rounded-2xl shadow-2xl text-lg group"
              >
                Create Free Account
                <motion.span
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </MagneticButton>
            </Link>
            <p className="text-white/60 text-sm mt-4">No credit card required • Takes 30 seconds</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-lg"
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-black text-lg gradient-text">TeenVest</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TeenVest. Paper trading for educational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

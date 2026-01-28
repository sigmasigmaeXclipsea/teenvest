import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, Sparkles, Zap, Flame, Rocket, User, LogOut, Play, Star, Sprout, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useSpring, useTransform, animate, AnimatePresence, useScroll } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useMemo, memo, useRef, useCallback, type ReactNode, type ElementType, type FC, type MouseEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GardenGameScreenshot, BeanstalkGameScreenshot, AIPodcastScreenshot } from '@/components/FeatureScreenshots';

type DashboardStock = {
  symbol: string;
  name: string;
  price: number;
  change: string;
  color: string;
  isPositive: boolean;
};

type TickerStock = {
  symbol: string;
  price: string;
  change: string;
};

type FinnhubResponse = {
  error?: string;
  quote?: { c?: number; dp?: number };
  profile?: { name?: string; ticker?: string };
};

// Infinite recycling carousel component - like an airport carousel
const InfiniteCarousel = ({ children, direction = 'left', speed = 1 }: { children: React.ReactNode[], direction?: 'left' | 'right', speed?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const positionRef = useRef(0);
  const animationRef = useRef<number>();
  const totalWidthRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    if (track.scrollWidth === 0) return;
    totalWidthRef.current = track.scrollWidth / 2;
    positionRef.current = direction === 'right' ? -totalWidthRef.current : 0;

    const animate = () => {
      if (!isPausedRef.current) {
        if (direction === 'left') {
          positionRef.current -= speed;
          if (positionRef.current <= -totalWidthRef.current) {
            positionRef.current = 0;
          }
        } else {
          positionRef.current += speed;
          if (positionRef.current >= 0) {
            positionRef.current = -totalWidthRef.current;
          }
        }
        track.style.transform = `translateX(${positionRef.current}px)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [direction, speed]); // Note: isPaused is read via ref pattern in animation loop

  return (
    <div 
      ref={containerRef}
      className="relative w-screen overflow-hidden -ml-48 -mr-4"
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
    >
      <div ref={trackRef} className="flex gap-6">
        {React.Children.toArray(children).concat(React.Children.toArray(children)).map((child, index) => (
          <div key={`carousel-item-${index}`} className="flex-shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

// Global cursor effect - continuously morphing blob that never holds one form
const GlobalCursorEffect = memo(() => {
  const blobRef = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let blobX = mouseX;
    let blobY = mouseY;
    let blob2X = mouseX;
    let blob2Y = mouseY;
    let blob3X = mouseX;
    let blob3Y = mouseY;
    let velocityX = 0;
    let velocityY = 0;
    let rotation = 0;
    let scaleX = 1;
    let scaleY = 1;
    let morphTime = 0;
    let morphTime2 = 0;
    let morphTime3 = 0;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const prevX = mouseX;
      const prevY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      velocityX = mouseX - prevX;
      velocityY = mouseY - prevY;
    };

    let animationId: number;
    const animate = () => {
      // Main blob - follows cursor with smoother easing
      const dx = mouseX - blobX;
      const dy = mouseY - blobY;
      blobX += dx * 0.06;
      blobY += dy * 0.06;
      
      // Second blob - slower, more flowy follow
      const dx2 = mouseX - blob2X;
      const dy2 = mouseY - blob2Y;
      blob2X += dx2 * 0.03;
      blob2Y += dy2 * 0.03;
      
      // Third blob - slowest, most flowy follow
      const dx3 = mouseX - blob3X;
      const dy3 = mouseY - blob3Y;
      blob3X += dx3 * 0.015;
      blob3Y += dy3 * 0.015;
      
      // Calculate morph based on velocity
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      const targetScaleX = 1 + Math.min(speed * 0.02, 0.5);
      const targetScaleY = 1 - Math.min(speed * 0.01, 0.3);
      scaleX += (targetScaleX - scaleX) * 0.1;
      scaleY += (targetScaleY - scaleY) * 0.1;
      
      // Rotation based on movement direction
      if (speed > 1) {
        const targetRotation = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
        const diff = targetRotation - rotation;
        rotation += diff * 0.15;
      }
      
      // Continuous morphing animation - very smooth and flowy
      morphTime += 0.002;
      morphTime2 += 0.0025;
      morphTime3 += 0.0015;
      
      // Generate gentle border-radius values with minimal changes
      const r1 = 45 + Math.sin(morphTime) * 8;
      const r2 = 55 + Math.cos(morphTime * 1.1) * 8;
      const r3 = 55 + Math.sin(morphTime * 0.9) * 8;
      const r4 = 45 + Math.cos(morphTime * 1.0) * 8;
      const r5 = 45 + Math.cos(morphTime * 0.95) * 5;
      const r6 = 45 + Math.sin(morphTime * 1.05) * 5;
      const r7 = 55 + Math.cos(morphTime * 0.9) * 5;
      const r8 = 50 + Math.sin(morphTime * 1.1) * 5;
      
      const r1_2 = 48 + Math.sin(morphTime2) * 6;
      const r2_2 = 52 + Math.cos(morphTime2 * 1.0) * 6;
      const r3_2 = 48 + Math.sin(morphTime2 * 0.9) * 6;
      const r4_2 = 52 + Math.cos(morphTime2 * 1.1) * 6;
      const r5_2 = 48 + Math.cos(morphTime2 * 0.95) * 4;
      const r6_2 = 48 + Math.sin(morphTime2 * 1.05) * 4;
      const r7_2 = 52 + Math.cos(morphTime2 * 0.9) * 4;
      const r8_2 = 50 + Math.sin(morphTime2 * 1.1) * 4;
      
      const r1_3 = 47 + Math.sin(morphTime3) * 4;
      const r2_3 = 53 + Math.cos(morphTime3 * 1.0) * 4;
      const r3_3 = 53 + Math.sin(morphTime3 * 0.9) * 4;
      const r4_3 = 47 + Math.cos(morphTime3 * 1.1) * 4;
      const r5_3 = 47 + Math.cos(morphTime3 * 0.95) * 3;
      const r6_3 = 47 + Math.sin(morphTime3 * 1.05) * 3;
      const r7_3 = 53 + Math.cos(morphTime3 * 0.9) * 3;
      const r8_3 = 50 + Math.sin(morphTime3 * 1.1) * 3;
      
      // Decay velocity
      velocityX *= 0.95;
      velocityY *= 0.95;
      
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${blobX}px, ${blobY}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
        blobRef.current.style.borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate(${blob2X}px, ${blob2Y}px) translate(-50%, -50%) rotate(${rotation * 0.7}deg) scale(${1 + (scaleX - 1) * 0.6}, ${1 + (scaleY - 1) * 0.6})`;
        blob2Ref.current.style.borderRadius = `${r1_2}% ${r2_2}% ${r3_2}% ${r4_2}% / ${r5_2}% ${r6_2}% ${r7_2}% ${r8_2}%`;
      }
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate(${blob3X}px, ${blob3Y}px) translate(-50%, -50%) rotate(${rotation * 0.4}deg) scale(${1 + (scaleX - 1) * 0.3}, ${1 + (scaleY - 1) * 0.3})`;
        blob3Ref.current.style.borderRadius = `${r1_3}% ${r2_3}% ${r3_3}% ${r4_3}% / ${r5_3}% ${r6_3}% ${r7_3}% ${r8_3}%`;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Outer blob - green/cyan, largest, slowest */}
      <div
        ref={blob3Ref}
        className="absolute"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.06) 0%, rgba(6, 182, 212, 0.04) 40%, transparent 70%)',
          filter: 'blur(60px',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
        }}
      />
      {/* Middle blob - purple */}
      <div
        ref={blob2Ref}
        className="absolute"
        style={{
          width: '350px',
          height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.07) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)',
          filter: 'blur(40px',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        }}
      />
      {/* Inner blob - bright center */}
      <div
        ref={blobRef}
        className="absolute"
        style={{
          width: '200px',
          height: '200px',
          background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08) 0%, rgba(168, 85, 247, 0.06) 50%, transparent 70%)',
          filter: 'blur(25px',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        }}
      />
    </div>
  );
});

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

const MiniQuizPreview = () => {
  const [choice, setChoice] = useState<number | null>(null);
  const correctIndex = 1;
  const isCorrect = choice === correctIndex;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary">Quick Quiz</span>
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <p className="text-sm font-semibold mb-3">What does diversification reduce?</p>
      <div className="grid gap-2 text-xs">
        {['Fees', 'Risk', 'Time', 'Taxes'].map((option, index) => {
          const isSelected = choice === index;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setChoice(index)}
              className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {choice !== null && (
        <p className={`mt-3 text-xs ${isCorrect ? 'text-emerald-600' : 'text-destructive'}`}>
          {isCorrect ? 'Correct. Diversification reduces risk.' : 'Not quite. It reduces risk.'}
        </p>
      )}
    </div>
  );
};

const MiniChartPreview = () => {
  const [years, setYears] = useState(10);
  const result = 100 * Math.pow(1 + 0.08, years);
  const maxResult = 100 * Math.pow(1 + 0.08, 30);
  const percent = Math.min(100, (result / maxResult) * 100);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-emerald-600">Compounding</span>
        <BarChart3 className="w-4 h-4 text-emerald-500" />
      </div>
      <p className="text-sm font-semibold mb-2">Drag to see growth</p>
      <input
        type="range"
        min={1}
        max={30}
        step={1}
        value={years}
        onChange={(event) => setYears(Number(event.target.value))}
        className="w-full accent-emerald-500"
      />
      <div className="mt-3">
        <p className="text-xs text-muted-foreground">After {years} years</p>
        <p className="text-lg font-bold">${result.toFixed(0)}</p>
        <div className="mt-2 h-2 w-full rounded-full bg-emerald-500/10">
          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
};

const TradeSimPreview = () => {
  const changes = [0.015, -0.012, 0.02, -0.01];
  const [price, setPrice] = useState(100);
  const [step, setStep] = useState(0);
  const change = changes[step % changes.length];

  return (
    <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-accent">Trade Sim</span>
        {change >= 0 ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-destructive" />
        )}
      </div>
      <p className="text-sm font-semibold mb-2">AAPL live ticks</p>
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2">
        <span className="text-xs text-muted-foreground">Price</span>
        <span className="text-lg font-bold">${price.toFixed(2)}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          const nextPrice = price * (1 + change);
          setPrice(Number(nextPrice.toFixed(2)));
          setStep((prev) => prev + 1);
        }}
        className="mt-3 w-full rounded-lg border border-accent/30 bg-accent/10 py-2 text-xs font-semibold text-accent hover:bg-accent/20"
      >
        Run next tick
      </button>
    </div>
  );
};

const LessonProgressPreview = () => {
  const [completed, setCompleted] = useState(12);
  const total = 30;
  const percent = Math.min(100, Math.round((completed / total) * 100));

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary">Lesson Progress</span>
        <BookOpen className="w-4 h-4 text-primary" />
      </div>
      <p className="text-sm font-semibold mb-2">Foundations track</p>
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2">
        <span className="text-xs text-muted-foreground">Completed</span>
        <span className="text-lg font-bold">
          {completed}/{total}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-primary/10">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <button
        type="button"
        onClick={() => setCompleted((prev) => Math.min(prev + 1, total))}
        className="mt-3 w-full rounded-lg border border-primary/30 bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
      >
        Complete next lesson
      </button>
    </div>
  );
};

const LessonSkillsPreview = () => {
  const skills = ['Risk control', 'Charts', 'Diversification', 'Compounding'];

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-emerald-600">Skill Builder</span>
        <Sparkles className="w-4 h-4 text-emerald-500" />
      </div>
      <p className="text-sm font-semibold mb-3">Unlock core investing skills</p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        Finish the next lesson to earn a new badge.
      </div>
    </div>
  );
};

const LessonPodcastPreview = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sampleScript =
    'Welcome to the TeenVest lesson podcast. In this short recap, we cover compounding, diversification, and risk control in under six minutes.';

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setIsPlaying(false);
      return;
    }
    if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sampleScript);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    synth.cancel();
    synth.speak(utterance);
  };

  return (
    <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-card to-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-purple-600">Lesson Podcast</span>
        <Headphones className="w-4 h-4 text-purple-500" />
      </div>
      <p className="text-sm font-semibold mb-2">Listen to a quick recap</p>
      <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        6 min recap • Portfolio basics
      </div>
      <button
        type="button"
        onClick={togglePlayback}
        className="mt-3 w-full rounded-lg border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-500/20"
      >
        {isPlaying ? 'Pause podcast' : 'Play podcast'}
      </button>
    </div>
  );
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

// Dashboard preview with smooth cursor tracking, pulsing glow, and 3D scroll effects
const DashboardPreview: FC = () => {
  const [stocks, setStocks] = useState<DashboardStock[]>([
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
            const data = (await response.json()) as FinnhubResponse;
            
            if (data?.error) throw new Error(data.error);
            
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
            const fallbackData: Record<string, Omit<DashboardStock, 'color'>> = {
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  
  // Scroll-based 3D parallax effects
  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start end", "end start"]
  });
  
  // Transform scroll progress into 3D effects
  const scrollRotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);
  const scrollRotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-10, 0, 10]);
  const scrollY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scrollScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.85, 1, 1, 0.85]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);
  
  // Floating elements parallax (different speeds for depth)
  const floatY1 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const floatY2 = useTransform(scrollYProgress, [0, 1], [200, -200]);
  const floatY3 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const floatX1 = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const floatX2 = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const floatRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  
  // Bottom glow scroll effects - synced with dashboard, scale and intensity changes
  const glowScale = useTransform(scrollYProgress, [0, 0.3, 0.5, 0.7, 1], [0.7, 1, 1.2, 1, 0.7]);
  const glowIntensity = useTransform(scrollYProgress, [0, 0.3, 0.5, 0.7, 1], [0.3, 0.7, 1, 0.7, 0.3]);
  
  // Spring-based mouse tracking - snappy response, smooth return
  const responsiveConfig = { stiffness: 200, damping: 25, mass: 0.5 }; // Fast, responsive interaction
  const glowConfig = { stiffness: 150, damping: 20, mass: 0.6 }; // Slightly smoother glow follow
  const rotateX = useSpring(0, responsiveConfig);
  const rotateY = useSpring(0, responsiveConfig);
  const glowX = useSpring(50, glowConfig);
  const glowY = useSpring(50, glowConfig);
  const glowOpacity = useSpring(0, { stiffness: 120, damping: 20, mass: 0.8 });
  const cursorGlowX = useSpring(0, { stiffness: 400, damping: 30 });
  const cursorGlowY = useSpring(0, { stiffness: 400, damping: 30 });

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
    
    // 3D tilt effect - more pronounced for better feedback
    rotateX.set((y - 0.5) * -12);
    rotateY.set((x - 0.5) * 12);
    
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
    // Use set() for immediate updates, then spring will animate
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
    <div ref={scrollContainerRef} className="relative w-full max-w-2xl mx-auto" style={{ perspective: '1200px' }}>
      {/* Floating particles behind */}
      <FloatingParticles />
      
      {/* 3D Floating elements that respond to scroll - creates depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ perspective: '800px' }}>
        {/* Floating coin/chart icons */}
        <motion.div
          className="absolute -left-16 top-1/4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm flex items-center justify-center shadow-lg"
          style={{ y: floatY1, x: floatX1, rotateY: floatRotate }}
        >
          <span className="text-2xl">📈</span>
        </motion.div>
        
        <motion.div
          className="absolute -right-12 top-1/3 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm flex items-center justify-center shadow-lg"
          style={{ y: floatY2, x: floatX2 }}
        >
          <span className="text-xl">💰</span>
        </motion.div>
        
        <motion.div
          className="absolute -left-8 bottom-1/4 w-8 h-8 rounded-full bg-gradient-to-br from-warning/20 to-orange-500/20 border border-warning/30 backdrop-blur-sm flex items-center justify-center shadow-lg"
          style={{ y: floatY3, rotate: floatRotate }}
        >
          <span className="text-sm">⭐</span>
        </motion.div>
        
        <motion.div
          className="absolute -right-16 bottom-1/3 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/30 backdrop-blur-sm flex items-center justify-center shadow-lg"
          style={{ y: floatY1, x: floatX2 }}
        >
          <span className="text-2xl">🚀</span>
        </motion.div>
        
        {/* Decorative geometric shapes */}
        <motion.div
          className="absolute -left-20 top-1/2 w-6 h-6 border-2 border-primary/40 rounded-md"
          style={{ y: floatY2, rotate: floatRotate }}
        />
        <motion.div
          className="absolute -right-20 top-1/4 w-4 h-4 bg-accent/30 rounded-full"
          style={{ y: floatY3, x: floatX1 }}
        />
        <motion.div
          className="absolute left-1/4 -top-8 w-3 h-3 bg-primary/40 rotate-45"
          style={{ y: floatY1 }}
        />
        <motion.div
          className="absolute right-1/4 -top-12 w-5 h-5 border border-green-500/40 rounded-full"
          style={{ y: floatY2, rotate: floatRotate }}
        />
      </div>
      
      {/* Outer ambient glow rings - synced with dashboard scroll */}
      <motion.div 
        className="absolute -inset-20 pointer-events-none"
        style={{ 
          y: scrollY,  // Synced with dashboard movement
          scale: glowScale,  // Grows when dashboard is centered
          opacity: glowIntensity,  // Intensifies when in focus
        }}
      >
        <motion.div 
          className="absolute inset-0 rounded-full blur-3xl"
          animate={{
            background: [
              'radial-gradient(ellipse at 30% 30%, hsl(var(--primary) / 0.25), transparent 60%)',
              'radial-gradient(ellipse at 70% 30%, hsl(var(--accent) / 0.2), transparent 60%)',
              'radial-gradient(ellipse at 70% 70%, hsl(var(--primary) / 0.25), transparent 60%)',
              'radial-gradient(ellipse at 30% 70%, hsl(var(--accent) / 0.2), transparent 60%)',
              'radial-gradient(ellipse at 30% 30%, hsl(var(--primary) / 0.25), transparent 60%)',
            ],
            scale: [1, 1.05, 1, 0.95, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute inset-8 rounded-full blur-2xl"
          animate={{
            background: [
              'radial-gradient(ellipse at 60% 40%, hsl(var(--accent) / 0.2), transparent 50%)',
              'radial-gradient(ellipse at 40% 60%, hsl(var(--primary) / 0.15), transparent 50%)',
              'radial-gradient(ellipse at 60% 60%, hsl(var(--accent) / 0.2), transparent 50%)',
              'radial-gradient(ellipse at 40% 40%, hsl(var(--primary) / 0.15), transparent 50%)',
              'radial-gradient(ellipse at 60% 40%, hsl(var(--accent) / 0.2), transparent 50%)',
            ],
            scale: [1, 0.95, 1, 1.05, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </motion.div>
      
      {/* Circle light effect under dashboard - synced with dashboard scroll */}
      <motion.div
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[120%] h-32 pointer-events-none"
        style={{ 
          y: scrollY,  // Synced with dashboard movement
          scale: glowScale,  // Grows when dashboard is centered
          opacity: glowIntensity,  // Intensifies when in focus
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute inset-4 bg-gradient-to-t from-accent/20 via-transparent to-transparent rounded-full blur-xl" />
      </motion.div>
      
      {/* Orbiting particles - smoother with fade */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-primary/60 blur-sm"
          animate={{
            x: [0, 100, 200, 100, 0],
            y: [-20, 50, 0, -50, -20],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '0%' }}
        />
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-accent/60 blur-sm"
          animate={{
            x: [0, -80, -160, -80, 0],
            y: [20, -40, 20, 80, 20],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ top: '80%', right: '0%' }}
        />
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-primary/40 blur-md"
          animate={{
            x: [0, 50, 0, -50, 0],
            y: [0, -30, -60, -30, 0],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ top: '50%', left: '-5%' }}
        />
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-green-400/60 blur-sm"
          animate={{
            x: [0, -60, 0, 60, 0],
            y: [0, 40, 80, 40, 0],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{ bottom: '10%', left: '20%' }}
        />
      </div>
      
      {/* Glowing border effect */}
      <motion.div
        className="absolute -inset-1 rounded-3xl pointer-events-none"
        animate={{
          background: [
            'linear-gradient(0deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--accent) / 0.3))',
            'linear-gradient(90deg, hsl(var(--accent) / 0.3), transparent, hsl(var(--primary) / 0.3))',
            'linear-gradient(180deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--accent) / 0.3))',
            'linear-gradient(270deg, hsl(var(--accent) / 0.3), transparent, hsl(var(--primary) / 0.3))',
            'linear-gradient(360deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--accent) / 0.3))',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ filter: 'blur(8px)' }}
      />
      
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
        animate={{ 
          opacity: 1, 
          y: 0,
        }}
        transition={{ 
          opacity: { delay: 0.3, duration: 0.5 },
          y: { delay: 0.3, duration: 0.5 },
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative will-change-transform group"
        style={{
          // Combine scroll-based and hover-based transforms
          rotateX: isHovering ? rotateX : scrollRotateX,
          rotateY: isHovering ? rotateY : scrollRotateY,
          y: scrollY,
          scale: scrollScale,
          opacity: scrollOpacity,
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
          <div className="p-6 space-y-5 relative z-10">
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

// Simple feature card with screenshot on hover
type FeatureCardProps = {
  icon: ElementType;
  title: string;
  desc: string;
  gradient: string;
  delay?: number;
  screenshot?: ReactNode;
};

const FeatureCard: FC<FeatureCardProps> = ({ icon: Icon, title, desc, gradient, screenshot }) => {
  const [isHovering, setIsHovering] = useState(false);
  const screenshotNode =
    typeof screenshot === 'string' ? (
      <img
        src={screenshot}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    ) : (
      screenshot
    );
  
  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl cursor-pointer h-full"
      style={{ minHeight: '420px' }}
    >
      {/* Icon - no glow effect */}
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg relative z-10 mb-5`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-bold text-xl mb-3">{title}</h3>
        <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      
      {/* Screenshot overlay on hover - black backdrop, bigger screenshots */}
      {screenshot && (
        <div 
          className={`absolute inset-0 bg-black rounded-2xl p-5 flex flex-col z-20 transition-all duration-500 ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{title}</h3>
              <p className="text-sm text-white/80">{desc}</p>
            </div>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden bg-gray-900 shadow-2xl border border-white/10 min-h-[300px]">
            {screenshotNode}
          </div>
        </div>
      )}
    </div>
  );
};

const LandingPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tickerStocks, setTickerStocks] = useState<TickerStock[]>([
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
            const data = (await response.json()) as FinnhubResponse;
            
            if (data?.error) throw new Error(data.error);
            
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
      {/* Global cursor effect */}
      <GlobalCursorEffect />
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
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Interactive quests, XP, and streaks</span>
              <Flame className="w-3 h-3 text-warning" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight relative">
              {/* Star particles - appear and disappear */}
              <motion.span
                className="absolute -left-4 -top-4 text-warning"
                animate={{ rotate: [0, 360], scale: [0, 1.2, 1, 1.2, 0], opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Star className="w-5 h-5 fill-warning" />
              </motion.span>
              <motion.span
                className="absolute -right-4 top-2 text-primary"
                animate={{ rotate: [360, 0], scale: [0, 1.3, 1, 1.3, 0], opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <Star className="w-4 h-4 fill-primary" />
              </motion.span>
              <motion.span
                className="absolute -left-2 bottom-0 text-accent"
                animate={{ rotate: [0, -360], scale: [0, 1.4, 1, 1.4, 0], opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              >
                <Star className="w-3 h-3 fill-current" />
              </motion.span>
              <motion.span
                className="absolute right-2 -bottom-2 text-warning"
                animate={{ rotate: [0, 360], scale: [0, 1.2, 1, 1.2, 0], opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <Star className="w-4 h-4 fill-warning" />
              </motion.span>
              <motion.span
                className="absolute -right-6 bottom-4 text-green-400"
                animate={{ rotate: [180, -180], scale: [0, 1.3, 1, 1.3, 0], opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.span>
              <span className="block">Build Your</span>
              <span className="gradient-text">Financial Empire</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-lg">
              Master investing with <span className="text-primary font-semibold">zero risk</span>.
              Trade stocks, complete challenges, and rank up your money skills.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md mb-8">
              <div className="rounded-xl bg-card/70 border border-primary/20 px-3 py-2 backdrop-blur">
                <p className="text-[11px] text-muted-foreground">XP Earned</p>
                <p className="text-lg font-bold text-primary">1,200</p>
              </div>
              <div className="rounded-xl bg-card/70 border border-accent/20 px-3 py-2 backdrop-blur">
                <p className="text-[11px] text-muted-foreground">Streak</p>
                <p className="text-lg font-bold text-warning">7 days</p>
              </div>
              <div className="rounded-xl bg-card/70 border border-emerald-500/20 px-3 py-2 backdrop-blur">
                <p className="text-[11px] text-muted-foreground">Rank</p>
                <p className="text-lg font-bold text-emerald-500">3</p>
              </div>
            </div>
            
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

      {/* Interactive Learning Path */}
      <section className="py-16 md:py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Hands-on Learning</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Your Interactive <span className="gradient-text">Learning Path</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Short lessons, quick quizzes, and mini trading sims to build real skill fast.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-4 max-w-6xl mx-auto">
            {[
              { step: '01', title: 'Learn', desc: 'Bite-sized lessons you can finish in minutes.', icon: BookOpen, color: 'from-primary/20 to-primary/5' },
              { step: '02', title: 'Practice', desc: 'Interactive quizzes and charts to test ideas.', icon: Sparkles, color: 'from-accent/20 to-accent/5' },
              { step: '03', title: 'Trade', desc: 'Simulated trades to learn with zero risk.', icon: Briefcase, color: 'from-emerald-500/20 to-emerald-500/5' },
              { step: '04', title: 'Rank Up', desc: 'Earn XP, streaks, and new achievements.', icon: Trophy, color: 'from-warning/20 to-warning/5' },
            ].map((step) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className={`rounded-2xl border border-border/50 bg-gradient-to-br ${step.color} p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">{step.step}</span>
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-8 rounded-full border border-primary/20 bg-card/60 backdrop-blur px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-primary/10">
                <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <span className="text-xs text-muted-foreground">Path progress preview</span>
            </div>
          </div>
        </div>
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
              { value: 0, suffix: '%', label: 'Real Risk', icon: '🛡️' },
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

          <div className="grid gap-4 md:grid-cols-3 max-w-6xl mx-auto mb-10">
            <MiniQuizPreview />
            <MiniChartPreview />
            <TradeSimPreview />
            <LessonProgressPreview />
            <LessonSkillsPreview />
            <LessonPodcastPreview />
          </div>

          {/* First Carousel - First 3 Features */}
          <div className="mb-8">
            <InfiniteCarousel direction="left" speed={1.5}>
              {[
                { icon: BarChart3, title: 'Stock Screener', desc: 'Filter 5,000+ stocks by price, sector, and risk.', gradient: 'from-primary to-primary-glow', screenshot: '/screenshots/stock-screener.png' },
                { icon: Briefcase, title: 'Paper Trading', desc: 'Trade with $10K virtual cash. Real data, zero losses.', gradient: 'from-accent to-chart-5', screenshot: '/screenshots/paper-trading.png' },
                { icon: Trophy, title: 'Leaderboards', desc: 'Compete globally and track your ranking.', gradient: 'from-warning to-chart-5', screenshot: '/screenshots/leaderboards.png' },
                { icon: BarChart3, title: 'Stock Screener', desc: 'Filter 5,000+ stocks by price, sector, and risk.', gradient: 'from-primary to-primary-glow', screenshot: '/screenshots/stock-screener.png' },
                { icon: Briefcase, title: 'Paper Trading', desc: 'Trade with $10K virtual cash. Real data, zero losses.', gradient: 'from-accent to-chart-5', screenshot: '/screenshots/paper-trading.png' },
                { icon: Trophy, title: 'Leaderboards', desc: 'Compete globally and track your ranking.', gradient: 'from-warning to-chart-5', screenshot: '/screenshots/leaderboards.png' },
              ].map((feature, i) => (
                <div key={i} className="flex-shrink-0 w-[600px]">
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    desc={feature.desc}
                    gradient={feature.gradient}
                    screenshot={feature.screenshot}
                    delay={0}
                  />
                </div>
              ))}
            </InfiniteCarousel>
          </div>

          {/* Second Carousel - New Garden & Learning Features */}
          <InfiniteCarousel direction="right" speed={1.5}>
            {[
              { icon: Sprout, title: 'Garden Game', desc: 'Grow plants, earn rewards, and learn investing through gamification!', gradient: 'from-green-500 to-emerald-600', screenshot: <GardenGameScreenshot /> },
              { icon: Play, title: 'Beanstalk Adventure', desc: 'Climb the beanstalk by answering questions in this interactive learning game!', gradient: 'from-green-600 to-teal-600', screenshot: <BeanstalkGameScreenshot /> },
              { icon: Headphones, title: 'AI Podcasts', desc: 'Listen to AI-generated podcasts about investing and financial topics!', gradient: 'from-purple-500 to-pink-600', screenshot: <AIPodcastScreenshot /> },
              { icon: Sprout, title: 'Garden Game', desc: 'Grow plants, earn rewards, and learn investing through gamification!', gradient: 'from-green-500 to-emerald-600', screenshot: <GardenGameScreenshot /> },
              { icon: Play, title: 'Beanstalk Adventure', desc: 'Climb the beanstalk by answering questions in this interactive learning game!', gradient: 'from-green-600 to-teal-600', screenshot: <BeanstalkGameScreenshot /> },
              { icon: Headphones, title: 'AI Podcasts', desc: 'Listen to AI-generated podcasts about investing and financial topics!', gradient: 'from-purple-500 to-pink-600', screenshot: <AIPodcastScreenshot /> },
            ].map((feature, i) => (
              <div key={i} className="flex-shrink-0 w-[600px]">
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  desc={feature.desc}
                  gradient={feature.gradient}
                  screenshot={feature.screenshot}
                  delay={0}
                />
              </div>
            ))}
          </InfiniteCarousel>
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
              Ready to <span className="gradient-text">Rank Up</span>?
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
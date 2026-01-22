import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, ChevronDown, Zap, Flame, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, type Variants } from 'framer-motion';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const LandingPage = () => {
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 animated-gradient opacity-60 pointer-events-none" />
      <div className="fixed inset-0 noise pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-primary/20 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-2xl glow-primary group-hover:scale-110 transition-all duration-300">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tight gradient-text">TeenVest</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { to: '/learn', label: 'Learn' },
              { to: '/screener', label: 'Screener' },
              { to: '/leaderboard', label: 'Leaderboard' }
            ].map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all duration-300 relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold hover:bg-primary/10 hover:text-primary">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button className="font-bold bg-gradient-to-r from-primary via-primary-glow to-accent hover:scale-105 transition-all duration-300 shadow-xl glow-primary">
                <Zap className="w-4 h-4 mr-1" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24 relative">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-24 h-24 bg-primary/15 rounded-full blur-2xl float" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/15 rounded-full blur-2xl float" style={{ animationDelay: '2s' }} />
        
        <motion.div 
          className="max-w-4xl mx-auto text-center relative"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div 
            variants={fadeIn}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 text-foreground px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-primary/20"
          >
            <Flame className="w-3.5 h-3.5 text-warning animate-pulse" />
            <span className="uppercase tracking-widest">The Future Starts Now</span>
            <Rocket className="w-3.5 h-3.5 text-primary animate-bounce-subtle" />
          </motion.div>
          
          {/* Main Headline */}
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-tight"
          >
            <span className="block text-foreground">Build Your</span>
            <span className="block gradient-text mt-1">Empire</span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            variants={fadeInUp}
            className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Master investing with <span className="text-primary font-semibold">zero risk</span>. Trade stocks, crush the leaderboard, 
            and stack skills that'll make your future self proud.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/signup">
              <Button size="default" className="gap-2 bg-gradient-to-r from-primary via-primary-glow to-accent hover:scale-105 transition-all duration-300 shadow-lg glow-primary font-semibold px-6 py-5 rounded-xl group">
                Start Trading Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button size="default" variant="outline" className="border border-primary/40 hover:bg-primary/10 hover:border-primary font-semibold px-6 py-5 rounded-xl transition-all duration-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Level Up First
              </Button>
            </Link>
          </motion.div>
          
          {/* Stats Bar */}
          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-12"
          >
            {[
              { value: '1,500+', label: 'Stocks to Trade' },
              { value: '$10K', label: 'Virtual Cash' },
              { value: '0%', label: 'Risk' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            variants={fadeIn}
            className="mt-12"
          >
            <div className="inline-flex flex-col items-center gap-1 text-muted-foreground">
              <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
              <ChevronDown className="w-4 h-4 scroll-indicator" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* AI Assistant Banner */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
        className="border-y border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background py-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 noise opacity-50" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* AI Bot */}
              <motion.div 
                variants={scaleIn}
                className="relative"
              >
                <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-xl glow-primary rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Bot className="w-14 h-14 lg:w-18 lg:h-18 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-chart-5 flex items-center justify-center animate-bounce-subtle shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-lg bg-gradient-to-br from-chart-3 to-accent flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </motion.div>
              
              {/* Content */}
              <motion.div 
                variants={fadeInUp}
                className="flex-1 text-center lg:text-left"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 tracking-tight">
                  Your <span className="gradient-text">24/7</span> AI Coach
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-lg">
                  No dumb questions. Get instant answers, portfolio breakdowns, and 
                  investing wisdom — written for teens, not Wall Street bros.
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {[
                    { icon: MessageCircle, text: 'Instant Answers', color: 'from-primary to-primary-glow' },
                    { icon: Target, text: 'Smart Insights', color: 'from-accent to-chart-5' },
                    { icon: TrendingUp, text: 'Portfolio Tips', color: 'from-chart-3 to-primary' }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 bg-gradient-to-r ${item.color} px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow hover:scale-105 transition-transform`}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Why Invest Early Section */}
      <section className="bg-background py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">Why Start Early?</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Time Is <span className="gradient-text">Money</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Every year you wait costs you thousands. The math doesn't lie.
            </p>
          </motion.div>
          
          {/* Featured Cards */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-10"
          >
            {/* Compound Growth Card */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden group hover:scale-[1.02] transition-all duration-500 rounded-2xl h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center mb-5 shadow-lg glow-primary group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">Compound Growth</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Your biggest flex? Starting early. Watch your money stack while others sleep.
                  </p>
                  <div className="bg-gradient-to-br from-primary/15 to-accent/10 rounded-xl p-5 border border-primary/20">
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-2xl md:text-3xl font-bold gradient-text">$500K+</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">Start at 15</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-2xl md:text-3xl font-bold text-muted-foreground/50">$250K</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">Start at 25</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>2X more by starting 10 years earlier</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Literacy Card */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-accent/5 overflow-hidden group hover:scale-[1.02] transition-all duration-500 rounded-2xl h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-chart-5 to-primary flex items-center justify-center mb-5 shadow-lg glow-accent group-hover:scale-110 transition-transform duration-500">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">Level Up Your Brain</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Skills that separate winners from the rest. This is your cheat code.
                  </p>
                  <div className="space-y-2">
                    {[
                      { skill: 'Master Your Money', icon: '💰' },
                      { skill: 'Read Markets Like a Pro', icon: '📈' },
                      { skill: 'Manage Risk Like a Boss', icon: '🛡️' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-accent/15 to-primary/10 rounded-lg p-3 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:scale-[1.01] cursor-default">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-semibold text-sm">{item.skill}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Risk-Free Badge */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-chart-3/15 via-primary/15 to-chart-3/15 px-5 py-3 rounded-xl border border-chart-3/20 shadow-lg">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-3 to-primary flex items-center justify-center shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">100% Risk-Free</p>
                <p className="text-muted-foreground text-xs">Paper trade with fake money. Real skills.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 relative bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">Your Arsenal</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Tools That <span className="gradient-text">Dominate</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Everything you need to crush it. No fluff, just power.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          >
            {[
              { icon: BarChart3, title: 'Stock Screener', desc: 'Filter stocks like a pro. Price, sector, risk — you control it.', gradient: 'from-primary to-primary-glow' },
              { icon: Briefcase, title: 'Paper Trading', desc: 'Trade with fake money. Real market vibes, zero losses.', gradient: 'from-accent to-chart-5' },
              { icon: BookOpen, title: 'Power Lessons', desc: 'Bite-sized wisdom. Get smarter in minutes, not hours.', gradient: 'from-chart-3 to-primary' },
              { icon: Trophy, title: 'Leaderboards', desc: 'Compete. Dominate. Flex on your friends.', gradient: 'from-warning to-chart-5' }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="group border-0 shadow-md bg-gradient-to-br from-card to-card hover:to-primary/5 overflow-hidden hover:scale-[1.03] transition-all duration-500 rounded-xl cursor-default h-full">
                  <CardContent className="p-5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-base mb-1.5 tracking-tight">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
        className="relative py-16 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-accent" />
        <div className="absolute inset-0 noise opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <motion.div 
          variants={fadeInUp}
          className="container mx-auto px-4 text-center relative"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full mb-5">
            <Flame className="w-4 h-4 text-white animate-pulse" />
            <span className="text-white font-semibold uppercase tracking-wider text-xs">Join the Movement</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Stop Watching. Start Winning.
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-sm md:text-base">
            Your friends are already building wealth. What are you waiting for?
          </p>
          <Link to="/signup">
            <Button size="default" className="gap-2 bg-white text-primary hover:bg-white/90 font-bold px-8 py-5 rounded-xl shadow-xl hover:scale-105 transition-all duration-300 group">
              Start Now — It's Free
              <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm gradient-text">TeenVest</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 TeenVest. Paper trading for educational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};

export default LandingPage;
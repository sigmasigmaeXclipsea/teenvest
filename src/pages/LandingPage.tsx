import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, ChevronDown, Zap, Flame, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aggressive animated background */}
      <div className="fixed inset-0 animated-gradient opacity-60 pointer-events-none" />
      <div className="fixed inset-0 noise pointer-events-none" />
      
      {/* Header - Sleek & Bold */}
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

      {/* Hero Section - MAXIMUM IMPACT */}
      <section className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-36 relative">
        {/* Dramatic background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl float" />
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-accent/20 rounded-full blur-3xl float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-40 right-20 w-32 h-32 bg-chart-3/20 rounded-full blur-3xl float" style={{ animationDelay: '4s' }} />
        
        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 text-foreground px-5 py-2.5 rounded-full text-sm font-bold mb-10 animate-fade-in border border-primary/30 shadow-lg">
            <Flame className="w-4 h-4 text-warning animate-pulse" />
            <span className="uppercase tracking-widest">The Future Starts Now</span>
            <Rocket className="w-4 h-4 text-primary animate-bounce-subtle" />
          </div>
          
          {/* Main Headline - BOLD */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 animate-fade-in-up leading-[0.9]" style={{ animationDelay: '0.1s' }}>
            <span className="block text-foreground">BUILD YOUR</span>
            <span className="block gradient-text text-glow mt-2">EMPIRE</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in-up opacity-0 font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Master investing with <span className="text-primary font-bold">zero risk</span>. Trade stocks, crush the leaderboard, 
            and stack skills that'll make your future self proud.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button size="lg" className="gap-3 bg-gradient-to-r from-primary via-primary-glow to-accent hover:scale-105 transition-all duration-300 shadow-2xl glow-primary text-lg font-bold px-10 py-7 rounded-2xl group">
                Start Trading Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button size="lg" variant="outline" className="border-2 border-primary/50 hover:bg-primary/10 hover:border-primary text-lg font-bold px-10 py-7 rounded-2xl transition-all duration-300">
                <BookOpen className="w-5 h-5 mr-2" />
                Level Up First
              </Button>
            </Link>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-8 md:gap-16 animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s' }}>
            {[
              { value: '10K+', label: 'Teen Traders' },
              { value: '$50M+', label: 'Paper Traded' },
              { value: '100%', label: 'Risk-Free' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-black gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          
          {/* Scroll indicator */}
          <div className="mt-20 animate-fade-in opacity-0" style={{ animationDelay: '0.7s' }}>
            <div className="inline-flex flex-col items-center gap-2 text-muted-foreground">
              <span className="text-xs uppercase tracking-widest font-semibold">Scroll</span>
              <ChevronDown className="w-5 h-5 scroll-indicator" />
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Banner - BOLD */}
      <section className="border-y-2 border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background py-20 relative overflow-hidden">
        <div className="absolute inset-0 noise" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* AI Bot - More Aggressive */}
              <div className="relative">
                <div className="w-40 h-40 lg:w-52 lg:h-52 rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-2xl glow-primary animate-scale-in rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Bot className="w-20 h-20 lg:w-28 lg:h-28 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-warning to-chart-5 flex items-center justify-center animate-bounce-subtle shadow-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-chart-3 to-accent flex items-center justify-center shadow-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Content - Punchy Copy */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
                  Your <span className="gradient-text">24/7</span>
                  <br />AI Coach
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl font-medium">
                  No dumb questions. Get instant answers, portfolio breakdowns, and 
                  investing wisdom — written for teens, not Wall Street bros.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  {[
                    { icon: MessageCircle, text: 'Instant Answers', color: 'from-primary to-primary-glow' },
                    { icon: Target, text: 'Smart Insights', color: 'from-accent to-chart-5' },
                    { icon: TrendingUp, text: 'Portfolio Tips', color: 'from-chart-3 to-primary' }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 bg-gradient-to-r ${item.color} px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform`}>
                      <item.icon className="w-5 h-5" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Invest Early Section - AGGRESSIVE */}
      <section className="bg-background py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary mb-4">Why Start Early?</p>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              TIME IS <span className="gradient-text">MONEY</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Every year you wait costs you thousands. The math doesn't lie.
            </p>
          </div>
          
          {/* Featured Cards - BIGGER & BOLDER */}
          <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-16">
            {/* Compound Growth Card */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card via-card to-primary/10 overflow-hidden group hover:scale-[1.02] transition-all duration-500 rounded-3xl">
              <CardContent className="p-10 md:p-14">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center mb-8 shadow-xl glow-primary group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="w-12 h-12 text-primary-foreground" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Compound Growth</h3>
                <p className="text-lg text-muted-foreground mb-8 font-medium">
                  Your biggest flex? Starting early. Watch your money stack while others sleep.
                </p>
                <div className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl p-8 border border-primary/30">
                  <div className="grid grid-cols-2 gap-6 text-center mb-6">
                    <div className="p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl md:text-5xl font-black gradient-text">$500K+</p>
                      <p className="text-sm text-muted-foreground font-semibold mt-2 uppercase tracking-wider">Start at 15</p>
                    </div>
                    <div className="p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl md:text-5xl font-black text-muted-foreground/50">$250K</p>
                      <p className="text-sm text-muted-foreground font-semibold mt-2 uppercase tracking-wider">Start at 25</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-primary font-bold">
                    <Flame className="w-5 h-5" />
                    <span>2X more by starting 10 years earlier</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Literacy Card */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card via-card to-accent/10 overflow-hidden group hover:scale-[1.02] transition-all duration-500 rounded-3xl">
              <CardContent className="p-10 md:p-14">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent via-chart-5 to-primary flex items-center justify-center mb-8 shadow-xl glow-accent group-hover:scale-110 transition-transform duration-500">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Level Up Your Brain</h3>
                <p className="text-lg text-muted-foreground mb-8 font-medium">
                  Skills that separate winners from the rest. This is your cheat code.
                </p>
                <div className="space-y-4">
                  {[
                    { skill: 'Master Your Money', icon: '💰' },
                    { skill: 'Read Markets Like a Pro', icon: '📈' },
                    { skill: 'Manage Risk Like a Boss', icon: '🛡️' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gradient-to-r from-accent/20 to-primary/10 rounded-xl p-5 border border-accent/30 hover:border-accent/60 transition-all duration-300 hover:scale-[1.02] cursor-default">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-bold text-lg">{item.skill}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk-Free Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-chart-3/20 via-primary/20 to-chart-3/20 px-8 py-5 rounded-2xl border border-chart-3/30 shadow-xl">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-chart-3 to-primary flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-black text-xl">100% Risk-Free</p>
                <p className="text-muted-foreground font-medium">Paper trade with fake money. Real skills.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - POWER GRID */}
      <section className="py-24 relative bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-accent mb-4">Your Arsenal</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
              TOOLS THAT <span className="gradient-text">DOMINATE</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Everything you need to crush it. No fluff, just power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { icon: BarChart3, title: 'Stock Screener', desc: 'Filter stocks like a pro. Price, sector, risk — you control it.', gradient: 'from-primary to-primary-glow' },
              { icon: Briefcase, title: 'Paper Trading', desc: 'Trade with fake money. Real market vibes, zero losses.', gradient: 'from-accent to-chart-5' },
              { icon: BookOpen, title: 'Power Lessons', desc: 'Bite-sized wisdom. Get smarter in minutes, not hours.', gradient: 'from-chart-3 to-primary' },
              { icon: Trophy, title: 'Leaderboards', desc: 'Compete. Dominate. Flex on your friends.', gradient: 'from-warning to-chart-5' }
            ].map((feature, i) => (
              <Card key={i} className="group border-0 shadow-xl bg-gradient-to-br from-card to-card hover:to-primary/10 overflow-hidden hover:scale-105 transition-all duration-500 rounded-2xl cursor-default">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-black text-xl mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground font-medium">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - MAXIMUM URGENCY */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-accent" />
        <div className="absolute inset-0 noise opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-5 py-2 rounded-full mb-8">
            <Flame className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-bold uppercase tracking-wider text-sm">Join the Movement</span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            STOP WATCHING.
            <br />
            <span className="opacity-90">START WINNING.</span>
          </h2>
          <p className="text-white/80 mb-12 max-w-2xl mx-auto text-xl font-medium">
            Your friends are already building wealth. What are you waiting for?
          </p>
          <Link to="/signup">
            <Button size="lg" className="gap-3 bg-white text-primary hover:bg-white/90 text-xl font-black px-12 py-8 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 group">
              Start Now — It's Free
              <Rocket className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Clean */}
      <footer className="border-t border-border/50 py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg gradient-text">TeenVest</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              © 2024 TeenVest. Paper trading for educational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};

export default LandingPage;
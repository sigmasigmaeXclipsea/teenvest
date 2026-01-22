import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
const LandingPage = () => {
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 animated-gradient opacity-50 pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg glow-sm group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">TeenVest</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/learn" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              Learn
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link to="/screener" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              Screener
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              Leaderboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-primary/10">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity shadow-lg glow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in border border-primary/20">
            <Trophy className="w-4 h-4" />
            <span>Be the start of something bigger
          </span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up" style={{
          animationDelay: '0.1s'
        }}>
            Start Your Investment
            <br />
            <span className="gradient-text text-glow">Journey Today</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up opacity-0" style={{
          animationDelay: '0.2s'
        }}>
            Learn to invest with zero risk. Practice paper trading, build your portfolio, 
            and develop financial skills that will last a lifetime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{
          animationDelay: '0.3s'
        }}>
            <Link to="/signup">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shadow-xl glow-primary text-lg px-8 py-6">
                Start Trading Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button size="lg" variant="outline" className="border-2 hover:bg-primary/10 text-lg px-8 py-6">
                Explore Lessons
              </Button>
            </Link>
          </div>
          
          {/* Scroll indicator */}
          <div className="mt-16 animate-fade-in opacity-0" style={{
          animationDelay: '0.5s'
        }}>
            <ChevronDown className="w-6 h-6 mx-auto text-muted-foreground scroll-indicator" />
          </div>
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl float" style={{
        animationDelay: '0s'
      }} />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl float" style={{
        animationDelay: '2s'
      }} />
        <div className="absolute top-40 right-20 w-16 h-16 bg-primary/5 rounded-full blur-2xl float" style={{
        animationDelay: '4s'
      }} />
      </section>

      {/* AI Assistant Banner */}
      <section className="border-y border-border/50 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-16 relative overflow-hidden">
        <div className="absolute inset-0 noise" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* AI Bot Illustration */}
              <div className="relative">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-2xl glow-primary animate-scale-in">
                  <Bot className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center animate-bounce-subtle">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                {/* Orbiting ring */}
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin-slow" style={{
                margin: '-10px'
              }} />
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Meet Your <span className="gradient-text">AI Investing Buddy</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                  Got questions? Our friendly AI tutor is available 24/7 to explain concepts, 
                  analyze your portfolio, and help you become a smarter investor — all in 
                  teen-friendly language!
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {[{
                  icon: MessageCircle,
                  text: 'Instant answers'
                }, {
                  icon: BookOpen,
                  text: 'Personalized lessons'
                }, {
                  icon: TrendingUp,
                  text: 'Portfolio advice'
                }].map((item, i) => <div key={i} className="flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm hover-lift">
                      <item.icon className="w-4 h-4 text-primary" />
                      {item.text}
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Invest Early Section */}
      <section className="border-t border-border/50 bg-secondary/30 py-24 md:py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Start <span className="gradient-text">Investing</span> as a Teen?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The earlier you start, the more time your money has to grow through compound interest
            </p>
          </div>
          
          {/* Featured Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5 overflow-hidden card-interactive group">
              <CardContent className="p-8 md:p-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Compound Growth</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Time is your biggest advantage. The earlier you start, the more your money works for you.
                </p>
                <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl md:text-4xl font-bold gradient-text">$500K+</p>
                      <p className="text-sm text-muted-foreground mt-1">Start at 15</p>
                    </div>
                    <div>
                      <p className="text-3xl md:text-4xl font-bold text-muted-foreground">$250K</p>
                      <p className="text-sm text-muted-foreground mt-1">Start at 25</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    *Based on $100/month with 8% average annual return
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 shadow-xl bg-gradient-to-br from-card to-accent/5 overflow-hidden card-interactive group">
              <CardContent className="p-8 md:p-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="w-10 h-10 text-accent-foreground" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Financial Literacy</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Build essential money skills that will serve you for life. Understanding markets sets you apart.
                </p>
                <div className="space-y-3">
                  {['Budgeting & Saving', 'Market Analysis', 'Risk Management'].map((skill, i) => <div key={i} className="flex items-center gap-3 bg-accent/10 rounded-lg p-3 border border-accent/20 hover:border-accent/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-sm font-medium">{skill}</span>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk-Free Learning */}
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-xl glass-card hover-lift">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-3 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Risk-Free Learning</h3>
                <p className="text-muted-foreground">
                  Practice with paper trading — no real money involved. Make mistakes, learn 
                  strategies, and build confidence before investing real cash.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Learn Investing</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for beginner investors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="group card-interactive border-border/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Stock Screener</h3>
                <p className="text-sm text-muted-foreground">Filter stocks by price, sector, market cap, risk level, and more.</p>
              </CardContent>
            </Card>

            <Card className="group card-interactive border-border/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Briefcase className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Paper Trading</h3>
                <p className="text-sm text-muted-foreground">Practice buying and selling stocks with virtual money — no risk involved.</p>
              </CardContent>
            </Card>

            <Card className="group card-interactive border-border/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <BookOpen className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="font-semibold mb-2">Learning Modules</h3>
                <p className="text-sm text-muted-foreground">Short, engaging lessons on investing basics, risk, and portfolio building.</p>
              </CardContent>
            </Card>

            <Card className="group card-interactive border-border/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Target className="w-6 h-6 text-chart-4" />
                </div>
                <h3 className="font-semibold mb-2">Achievements</h3>
                <p className="text-sm text-muted-foreground">Earn badges and compete on leaderboards as you grow your skills.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 noise opacity-10" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
            Join thousands of teens learning to invest. It's free, fun, and risk-free.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold gradient-text">TeenVest</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TeenVest. Paper trading for educational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;
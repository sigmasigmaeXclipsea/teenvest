import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Shield, ArrowRight, BarChart3, Briefcase, Target, Bot, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TeenVest</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
              Learn
            </Link>
            <Link to="/screener" className="text-muted-foreground hover:text-foreground transition-colors">
              Screener
            </Link>
            <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Trophy className="w-4 h-4" />
            <span>Join 10,000+ teen investors</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Start Your Investment Journey{' '}
            <span className="gradient-text">Today</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Learn to invest with zero risk. Practice paper trading, build your portfolio, 
            and develop financial skills that will last a lifetime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Start Trading Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button size="lg" variant="outline">
                Explore Lessons
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Assistant Banner - NEW PROMINENT SECTION */}
      <section className="border-y border-border bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* AI Bot Illustration */}
              <div className="relative">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
                  <Bot className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Meet Your AI Investing Buddy
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                  Got questions? Our friendly AI tutor is available 24/7 to explain concepts, 
                  analyze your portfolio, and help you become a smarter investor — all in 
                  teen-friendly language!
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-full text-sm">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Instant answers
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-full text-sm">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Personalized lessons
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-full text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Portfolio advice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Invest Early Section */}
      <section className="border-t border-border bg-secondary/30 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Start Investing as a Teen?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The earlier you start, the more time your money has to grow through compound interest
            </p>
          </div>
          
          {/* Featured Cards - Compound Growth & Financial Literacy */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5 overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <TrendingUp className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Compound Growth</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Time is your biggest advantage. The earlier you start, the more your money works for you.
                </p>
                <div className="bg-primary/10 rounded-xl p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl md:text-4xl font-bold text-primary">$500K+</p>
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

            <Card className="border-2 border-accent/20 shadow-xl bg-gradient-to-br from-card to-accent/5 overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Financial Literacy</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Build essential money skills that will serve you for life. Understanding markets sets you apart.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-accent/10 rounded-lg p-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium">Budgeting & Saving</span>
                  </div>
                  <div className="flex items-center gap-3 bg-accent/10 rounded-lg p-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium">Market Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 bg-accent/10 rounded-lg p-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium">Risk Management</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk-Free Learning - Smaller card */}
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-chart-3" />
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Learn Investing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for beginner investors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Stock Screener</h3>
                <p className="text-sm text-muted-foreground">
                  Filter stocks by price, sector, market cap, risk level, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Paper Trading</h3>
                <p className="text-sm text-muted-foreground">
                  Practice buying and selling stocks with virtual money — no risk involved.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="font-semibold mb-2">Learning Modules</h3>
                <p className="text-sm text-muted-foreground">
                  Short, engaging lessons on investing basics, risk, and portfolio building.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-chart-4" />
                </div>
                <h3 className="font-semibold mb-2">Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Earn badges and compete on leaderboards as you grow your skills.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of teens learning to invest. It's free, fun, and risk-free.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">TeenVest</span>
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

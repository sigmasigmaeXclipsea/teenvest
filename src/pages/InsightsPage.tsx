import DashboardLayout from '@/components/layouts/DashboardLayout';
import PortfolioTimeline from '@/components/PortfolioTimeline';
import MistakeFeed from '@/components/MistakeFeed';
import MarketNewsExplained from '@/components/MarketNewsExplained';
import GameLayer from '@/components/GameLayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Sparkles, 
  Newspaper, 
  Trophy,
  Lightbulb
} from 'lucide-react';

const InsightsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Insights & Challenges
          </h1>
          <p className="text-muted-foreground">
            Learn from your trades, track your progress, and stay informed
          </p>
        </div>

        {/* Mobile-first tabs */}
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="challenges" className="gap-1 text-xs sm:text-sm">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-1 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Patterns</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1 text-xs sm:text-sm">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            <GameLayer />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <PortfolioTimeline />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <MistakeFeed />
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <MarketNewsExplained />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InsightsPage;

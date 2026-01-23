import { Flame, Trophy, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';

const DashboardStreakWidget = () => {
  const { streak } = useSettings();
  
  // Calculate XP and level based on activity
  const baseXP = streak.totalActiveDays * 50;
  const streakBonus = streak.currentStreak * 10;
  const totalXP = baseXP + streakBonus;
  const level = Math.floor(totalXP / 500) + 1;
  const xpInCurrentLevel = totalXP % 500;
  const xpToNextLevel = 500;
  
  // Determine next streak milestone
  const getNextMilestone = () => {
    if (streak.currentStreak < 3) return { target: 3, label: '3-day streak' };
    if (streak.currentStreak < 7) return { target: 7, label: '7-day streak' };
    if (streak.currentStreak < 14) return { target: 14, label: '14-day streak' };
    if (streak.currentStreak < 30) return { target: 30, label: '30-day streak' };
    return { target: 100, label: '100-day streak' };
  };
  
  const milestone = getNextMilestone();
  const milestoneProgress = (streak.currentStreak / milestone.target) * 100;

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="w-5 h-5 text-amber-500" />
            Daily Streak & Progress
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Level {level}
          </Badge>
        </div>
        <CardDescription>Keep your streak alive to earn bonus XP!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak and Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-amber-500 flex items-center justify-center gap-1">
              {streak.currentStreak}
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold">{streak.longestStreak}</div>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold flex items-center justify-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              {totalXP}
            </div>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="font-medium">{xpInCurrentLevel} / {xpToNextLevel} XP</span>
          </div>
          <Progress value={(xpInCurrentLevel / xpToNextLevel) * 100} className="h-2" />
        </div>

        {/* Next Milestone */}
        <div className="p-3 rounded-lg bg-background/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Next: {milestone.label}
            </span>
            <span className="font-medium">{streak.currentStreak} / {milestone.target} days</span>
          </div>
          <Progress value={milestoneProgress} className="h-1.5" />
        </div>

        {/* CTA */}
        <Link to="/insights" className="block">
          <Button variant="outline" size="sm" className="w-full">
            <Trophy className="w-4 h-4 mr-2" />
            View All Challenges
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default DashboardStreakWidget;

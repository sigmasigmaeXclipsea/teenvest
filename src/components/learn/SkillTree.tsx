import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lock, CheckCircle2, Compass, Trophy, Brain, Shield, Activity, Star } from 'lucide-react';
import { useSkillTreeProgress } from '@/hooks/useSkillTreeProgress';
import { getBranchModules, skillTreeBranches, type SkillBranchId } from '@/lib/skillTree';
import { useLessonAccess } from '@/hooks/useLessonAccess';

const branchIconMap: Record<SkillBranchId, React.ElementType> = {
  foundation: Compass,
  technician: Activity,
  fundamentalist: Brain,
  riskManager: Shield,
  psychologist: Trophy,
};

const SkillTree = () => {
  const {
    modules,
    unlocks,
    progressByBranch,
    unmetCriteria,
  } = useSkillTreeProgress();
  const { canAccessLesson } = useLessonAccess();
  const [expandedBranches, setExpandedBranches] = useState<Record<SkillBranchId, boolean>>({
    foundation: true,
    technician: false,
    fundamentalist: false,
    riskManager: false,
    psychologist: false,
  });

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl">Skill Tree</CardTitle>
          <CardDescription>
            Choose a trading archetype and unlock rewards as you progress.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {skillTreeBranches.map((branch) => {
          const Icon = branchIconMap[branch.id];
          const branchModules = getBranchModules(modules, branch.id);
          const progress = progressByBranch[branch.id];
          const isUnlocked = unlocks[branch.id];
          const criteria = unmetCriteria[branch.id];
          const isExpanded = expandedBranches[branch.id];

          return (
            <Card key={branch.id} className={isUnlocked ? 'border-primary/30' : 'border-dashed'}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      <CardDescription>{branch.focus}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isUnlocked ? 'default' : 'outline'}>
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                    Reward: {branch.reward}
                  </Badge>
                  <span className="text-muted-foreground">{branch.description}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {progress.completed}/{progress.total} lessons complete
                    </span>
                    <span>{Math.round(progress.percent)}%</span>
                  </div>
                  <Progress value={progress.percent} className="h-2" />
                </div>

                {!isUnlocked && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>{criteria}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {branchModules.length} lessons
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedBranches((prev) => ({
                        ...prev,
                        [branch.id]: !prev[branch.id],
                      }))
                    }
                  >
                    {isExpanded ? 'Hide lessons' : 'Show lessons'}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="grid gap-2">
                    {branchModules.length === 0 && (
                      <div className="text-xs text-muted-foreground">
                        No lessons mapped to this branch yet.
                      </div>
                    )}
                    {branchModules.map((module) => {
                      const canAccess = canAccessLesson(module);
                      return (
                        <div key={module.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                          <span className="truncate flex items-center gap-2">
                            {module.title}
                            {module.order_index === 15 && (
                              <Star className="w-3 h-3 text-amber-500" />
                            )}
                          </span>
                          {isUnlocked && canAccess ? (
                            <Link to={`/learn/${module.id}`} className="text-primary hover:underline">
                              Open
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">Locked</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isUnlocked && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    Branch rewards active.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTree;

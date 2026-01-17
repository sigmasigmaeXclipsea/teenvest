import { useState } from 'react';
import { BookOpen, Clock, CheckCircle, ChevronRight, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLearningModules, useUserProgress, useCompleteModule } from '@/hooks/useLearning';
import { useToast } from '@/hooks/use-toast';

const LearnPage = () => {
  const { data: modules, isLoading: modulesLoading } = useLearningModules();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const completeModule = useCompleteModule();
  const { toast } = useToast();
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const isCompleted = (moduleId: string) => {
    return progress?.some(p => p.module_id === moduleId && p.completed);
  };

  const completedCount = progress?.filter(p => p.completed).length || 0;
  const totalModules = modules?.length || 0;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const handleCompleteModule = async (moduleId: string) => {
    try {
      await completeModule.mutateAsync(moduleId);
      toast({
        title: 'Module completed! 🎉',
        description: 'Great job! Keep learning to become a better investor.',
      });
      setSelectedModule(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark module as complete',
        variant: 'destructive',
      });
    }
  };

  const currentModule = modules?.find(m => m.id === selectedModule);

  if (modulesLoading || progressLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading lessons...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Learn to Invest</h1>
            <p className="text-muted-foreground">
              Master the basics of investing with our beginner-friendly lessons
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold">{completedCount}/{totalModules} Completed</span>
          </div>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              {progressPercent.toFixed(0)}% complete • {totalModules - completedCount} lessons remaining
            </p>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules && modules.length > 0 ? (
            modules.map((module, index) => {
              const completed = isCompleted(module.id);
              return (
                <Card 
                  key={module.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    completed ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedModule(module.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant={completed ? 'default' : 'outline'}>
                        Lesson {index + 1}
                      </Badge>
                      {completed && <CheckCircle className="w-5 h-5 text-primary" />}
                    </div>
                    <CardTitle className="text-lg mt-2">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {module.duration_minutes} min
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        {completed ? 'Review' : 'Start'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No lessons available yet</h3>
                <p className="text-muted-foreground">
                  New lessons are being added. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Module Detail Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {currentModule && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={isCompleted(currentModule.id) ? 'default' : 'outline'}>
                    Lesson {(modules?.findIndex(m => m.id === currentModule.id) || 0) + 1}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {currentModule.duration_minutes} min read
                  </span>
                </div>
                <DialogTitle className="text-xl">{currentModule.title}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="prose prose-sm dark:prose-invert">
                  {currentModule.content.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 text-foreground/90 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedModule(null)}>
                  Close
                </Button>
                {!isCompleted(currentModule.id) && (
                  <Button 
                    onClick={() => handleCompleteModule(currentModule.id)}
                    disabled={completeModule.isPending}
                  >
                    {completeModule.isPending ? 'Saving...' : 'Mark as Complete'}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default LearnPage;

import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, ChevronRight, GraduationCap, Award, Bot, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLearningModules, useUserProgress } from '@/hooks/useLearning';
import { useQuizResults } from '@/hooks/useQuiz';
import LearningAI from '@/components/LearningAI';
import AIAssistantCard from '@/components/AIAssistantCard';

const LearnPage = () => {
  const { data: modules, isLoading: modulesLoading } = useLearningModules();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { data: quizResults } = useQuizResults();

  const isCompleted = (moduleId: string) => {
    return progress?.some(p => p.module_id === moduleId && p.completed);
  };

  const getQuizScore = (moduleId: string) => {
    return quizResults?.find(r => r.module_id === moduleId);
  };

  const completedCount = progress?.filter(p => p.completed).length || 0;
  const totalModules = modules?.length || 0;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Learn to Invest</h1>
            <p className="text-muted-foreground text-lg">
              Master the basics of investing with interactive lessons and quizzes
            </p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold">{completedCount}/{totalModules} Completed</span>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-lg">Your Learning Progress</CardTitle>
            <CardDescription>Keep learning to unlock achievements and climb the leaderboard!</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} className="h-4 mb-3" />
            <p className="text-sm text-muted-foreground">
              {progressPercent.toFixed(0)}% complete • {totalModules - completedCount} lessons remaining
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Lessons */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Lessons
            </h2>

            {modules && modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module, index) => {
                  const completed = isCompleted(module.id);
                  const quizScore = getQuizScore(module.id);
                  return (
                    <Link key={module.id} to={`/learn/${module.id}`}>
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] ${
                          completed ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Lesson Number */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                              completed 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-foreground'
                            }`}>
                              {completed ? <CheckCircle className="w-6 h-6" /> : index + 1}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant={completed ? 'default' : 'outline'} className="text-xs">
                                  Lesson {index + 1}
                                </Badge>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {module.duration_minutes} min
                                </span>
                                {quizScore && (
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Award className="w-3 h-3" />
                                    Quiz: {quizScore.score}/{quizScore.total_questions}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold mb-1">{module.title}</h3>
                              <p className="text-muted-foreground line-clamp-2">{module.description}</p>
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant - Prominent */}
            <AIAssistantCard 
              title="AI Learning Tutor"
              description="Ask me anything about investing!"
              suggestedQuestions={[
                "What's the difference between stocks and bonds?",
                "How do I know if a stock is a good investment?",
                "Explain diversification like I'm 15"
              ]}
            />

            {/* AI Learning Coach */}
            <LearningAI
              quizResults={quizResults?.map(r => ({
                ...r,
                module_title: modules?.find(m => m.id === r.module_id)?.title,
              })) || []}
              completedModules={progress?.filter(p => p.completed) || []}
              allModules={modules || []}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearnPage;

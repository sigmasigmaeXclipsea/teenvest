import { useState } from 'react';
import { BookOpen, Clock, CheckCircle, ChevronRight, GraduationCap, Award, HelpCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLearningModules, useUserProgress, useCompleteModule } from '@/hooks/useLearning';
import { useQuizQuestions, useQuizResults, useSaveQuizResult } from '@/hooks/useQuiz';
import { useToast } from '@/hooks/use-toast';

const LearnPage = () => {
  const { data: modules, isLoading: modulesLoading } = useLearningModules();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { data: quizResults } = useQuizResults();
  const completeModule = useCompleteModule();
  const saveQuizResult = useSaveQuizResult();
  const { toast } = useToast();
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'content' | 'quiz'>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const { data: quizQuestions } = useQuizQuestions(selectedModule);

  const isCompleted = (moduleId: string) => {
    return progress?.some(p => p.module_id === moduleId && p.completed);
  };

  const getQuizScore = (moduleId: string) => {
    return quizResults?.find(r => r.module_id === moduleId);
  };

  const completedCount = progress?.filter(p => p.completed).length || 0;
  const totalModules = modules?.length || 0;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const handleCompleteModule = async (moduleId: string) => {
    try {
      await completeModule.mutateAsync(moduleId);
      toast({
        title: 'Module completed! 🎉',
        description: 'Great job! Take the quiz to test your knowledge.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark module as complete',
        variant: 'destructive',
      });
    }
  };

  const handleStartQuiz = () => {
    setActiveView('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizQuestions || !selectedModule) return;
    
    const score = quizQuestions.reduce((acc, q, index) => {
      return acc + (selectedAnswers[index] === q.correct_answer ? 1 : 0);
    }, 0);

    try {
      await saveQuizResult.mutateAsync({
        moduleId: selectedModule,
        score,
        totalQuestions: quizQuestions.length,
      });
      setShowResults(true);
      
      if (score === quizQuestions.length) {
        toast({
          title: 'Perfect Score! 🏆',
          description: 'You answered all questions correctly!',
        });
      } else if (score >= quizQuestions.length * 0.7) {
        toast({
          title: 'Great job! 🎉',
          description: `You scored ${score}/${quizQuestions.length}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save quiz result',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setSelectedModule(null);
    setActiveView('content');
    setShowResults(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  const currentModule = modules?.find(m => m.id === selectedModule);
  const currentQuestion = quizQuestions?.[currentQuestionIndex];

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
              Master the basics of investing with interactive lessons and quizzes
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
              const quizScore = getQuizScore(module.id);
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
                      <div className="flex items-center gap-1">
                        {quizScore && (
                          <Badge variant="secondary" className="gap-1">
                            <Award className="w-3 h-3" />
                            {quizScore.score}/{quizScore.total_questions}
                          </Badge>
                        )}
                        {completed && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
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
      <Dialog open={!!selectedModule} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          {currentModule && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={isCompleted(currentModule.id) ? 'default' : 'outline'}>
                    Lesson {(modules?.findIndex(m => m.id === currentModule.id) || 0) + 1}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {currentModule.duration_minutes} min
                  </span>
                  {quizQuestions && quizQuestions.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <HelpCircle className="w-3 h-3" />
                      {quizQuestions.length} Questions
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{currentModule.title}</DialogTitle>
                
                {/* Tab buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={activeView === 'content' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('content')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Article
                  </Button>
                  <Button
                    variant={activeView === 'quiz' ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleStartQuiz}
                    disabled={!quizQuestions || quizQuestions.length === 0}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Quiz
                  </Button>
                </div>
              </DialogHeader>

              {activeView === 'content' ? (
                <>
                  <ScrollArea className="max-h-[50vh] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {currentModule.content.split('\n').map((paragraph, i) => {
                        // Handle bold headers
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          return (
                            <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
                              {paragraph.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }
                        // Handle list items
                        if (paragraph.startsWith('- ')) {
                          return (
                            <li key={i} className="ml-4 mb-1 text-foreground/90">
                              {paragraph.substring(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, j) => {
                                if (part.includes('</strong>')) {
                                  const [bold, rest] = part.split('</strong>');
                                  return <span key={j}><strong>{bold}</strong>{rest}</span>;
                                }
                                return part;
                              })}
                            </li>
                          );
                        }
                        // Handle numbered items
                        if (/^\d+\./.test(paragraph)) {
                          return (
                            <li key={i} className="ml-4 mb-1 text-foreground/90 list-decimal">
                              {paragraph.replace(/^\d+\.\s*/, '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, j) => {
                                if (part.includes('</strong>')) {
                                  const [bold, rest] = part.split('</strong>');
                                  return <span key={j}><strong>{bold}</strong>{rest}</span>;
                                }
                                return part;
                              })}
                            </li>
                          );
                        }
                        // Regular paragraph
                        if (paragraph.trim()) {
                          return (
                            <p key={i} className="mb-3 text-foreground/90 leading-relaxed">
                              {paragraph}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </ScrollArea>
                  <div className="flex justify-between gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Close
                    </Button>
                    <div className="flex gap-2">
                      {!isCompleted(currentModule.id) && (
                        <Button 
                          variant="secondary"
                          onClick={() => handleCompleteModule(currentModule.id)}
                          disabled={completeModule.isPending}
                        >
                          {completeModule.isPending ? 'Saving...' : 'Mark as Read'}
                        </Button>
                      )}
                      {quizQuestions && quizQuestions.length > 0 && (
                        <Button onClick={handleStartQuiz}>
                          Take Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {showResults ? (
                    <div className="py-6">
                      <div className="text-center mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Award className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
                        <p className="text-lg text-muted-foreground">
                          You scored {Object.values(selectedAnswers).filter((ans, i) => 
                            quizQuestions && ans === quizQuestions[i]?.correct_answer
                          ).length} out of {quizQuestions?.length}
                        </p>
                      </div>
                      
                      <ScrollArea className="max-h-[40vh]">
                        <div className="space-y-4">
                          {quizQuestions?.map((q, index) => {
                            const isCorrect = selectedAnswers[index] === q.correct_answer;
                            return (
                              <Card key={q.id} className={isCorrect ? 'border-primary/50' : 'border-destructive/50'}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start gap-2 mb-2">
                                    {isCorrect ? (
                                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                                    )}
                                    <div>
                                      <p className="font-medium">{q.question}</p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {isCorrect ? 'Correct!' : `Correct answer: ${q.options[q.correct_answer]}`}
                                      </p>
                                      <p className="text-sm text-foreground/80 mt-2 p-2 bg-secondary/50 rounded">
                                        {q.explanation}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={handleCloseDialog}>
                          Close
                        </Button>
                        <Button onClick={handleStartQuiz}>
                          Retake Quiz
                        </Button>
                      </div>
                    </div>
                  ) : currentQuestion ? (
                    <div className="py-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">
                          Question {currentQuestionIndex + 1} of {quizQuestions?.length}
                        </Badge>
                        <Progress 
                          value={((currentQuestionIndex + 1) / (quizQuestions?.length || 1)) * 100} 
                          className="w-32 h-2"
                        />
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                      
                      <RadioGroup
                        value={selectedAnswers[currentQuestionIndex]?.toString()}
                        onValueChange={(val) => handleAnswerSelect(currentQuestionIndex, parseInt(val))}
                        className="space-y-3"
                      >
                        {currentQuestion.options.map((option, optIndex) => (
                          <div 
                            key={optIndex}
                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedAnswers[currentQuestionIndex] === optIndex 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:bg-secondary/50'
                            }`}
                            onClick={() => handleAnswerSelect(currentQuestionIndex, optIndex)}
                          >
                            <RadioGroupItem value={optIndex.toString()} id={`option-${optIndex}`} />
                            <Label htmlFor={`option-${optIndex}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      <div className="flex justify-between gap-3 pt-6 border-t mt-6">
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous
                        </Button>
                        <div className="flex gap-2">
                          {currentQuestionIndex < (quizQuestions?.length || 0) - 1 ? (
                            <Button 
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                              disabled={selectedAnswers[currentQuestionIndex] === undefined}
                            >
                              Next
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleSubmitQuiz}
                              disabled={Object.keys(selectedAnswers).length !== quizQuestions?.length}
                            >
                              Submit Quiz
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No quiz questions available for this lesson.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default LearnPage;

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, BookOpen, HelpCircle, Award, ChevronLeft, ChevronRight, XCircle, CheckCircle2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLearningModules, useUserProgress, useCompleteModule } from '@/hooks/useLearning';
import { useQuizQuestions, useQuizResults, useSaveQuizResult } from '@/hooks/useQuiz';
import { useToast } from '@/hooks/use-toast';
import AIAssistantCard from '@/components/AIAssistantCard';

const LessonPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: modules, isLoading: modulesLoading } = useLearningModules();
  const { data: progress } = useUserProgress();
  const { data: quizResults } = useQuizResults();
  const { data: quizQuestions } = useQuizQuestions(moduleId || null);
  const completeModule = useCompleteModule();
  const saveQuizResult = useSaveQuizResult();

  const [activeView, setActiveView] = useState<'content' | 'quiz'>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const currentModule = modules?.find(m => m.id === moduleId);
  const moduleIndex = modules?.findIndex(m => m.id === moduleId) ?? -1;
  const isCompleted = progress?.some(p => p.module_id === moduleId && p.completed);
  const quizScore = quizResults?.find(r => r.module_id === moduleId);
  const currentQuestion = quizQuestions?.[currentQuestionIndex];

  const nextModule = modules?.[moduleIndex + 1];
  const prevModule = modules?.[moduleIndex - 1];

  const handleCompleteModule = async () => {
    if (!moduleId) return;
    try {
      await completeModule.mutateAsync(moduleId);
      toast({
        title: 'Lesson completed! 🎉',
        description: 'Great job! Take the quiz to test your knowledge.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark lesson as complete',
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

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizQuestions || !moduleId) return;
    
    const score = quizQuestions.reduce((acc, q, index) => {
      return acc + (selectedAnswers[index] === q.correct_answer ? 1 : 0);
    }, 0);

    try {
      await saveQuizResult.mutateAsync({
        moduleId,
        score,
        totalQuestions: quizQuestions.length,
      });
      setShowResults(true);
      
      if (score === quizQuestions.length) {
        toast({ title: 'Perfect Score! 🏆', description: 'You answered all questions correctly!' });
      } else if (score >= quizQuestions.length * 0.7) {
        toast({ title: 'Great job! 🎉', description: `You scored ${score}/${quizQuestions.length}` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save quiz result', variant: 'destructive' });
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Handle headers with **
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-foreground border-b pb-2">
            {line.replace(/\*\*/g, '')}
          </h2>
        );
      }
      // Handle inline bold headers
      if (line.includes('**') && line.includes(':')) {
        const parts = line.split('**').filter(Boolean);
        return (
          <h3 key={i} className="text-xl font-semibold mt-6 mb-3 text-foreground">
            {parts.join('')}
          </h3>
        );
      }
      // Handle list items
      if (line.trim().startsWith('- ')) {
        const content = line.substring(2);
        return (
          <div key={i} className="flex items-start gap-3 mb-3 ml-4">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <p className="text-lg text-foreground/90 leading-relaxed">
              {content.split('**').map((part, j) => 
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          </div>
        );
      }
      // Handle numbered items
      if (/^\d+\./.test(line.trim())) {
        const num = line.match(/^(\d+)\./)?.[1];
        const content = line.replace(/^\d+\.\s*/, '');
        return (
          <div key={i} className="flex items-start gap-3 mb-3 ml-4">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0 text-sm">
              {num}
            </span>
            <p className="text-lg text-foreground/90 leading-relaxed pt-0.5">
              {content.split('**').map((part, j) => 
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          </div>
        );
      }
      // Regular paragraph
      if (line.trim()) {
        return (
          <p key={i} className="text-lg text-foreground/90 leading-relaxed mb-4">
            {line}
          </p>
        );
      }
      return <div key={i} className="h-2" />;
    });
  };

  if (modulesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading lesson...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentModule) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-6">This lesson doesn't exist or has been removed.</p>
          <Link to="/learn">
            <Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Lessons</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/learn">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Lessons
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {prevModule && (
              <Link to={`/learn/${prevModule.id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
              </Link>
            )}
            {nextModule && (
              <Link to={`/learn/${nextModule.id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Lesson Header */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={isCompleted ? 'default' : 'outline'} className="text-sm">
                Lesson {moduleIndex + 1}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {currentModule.duration_minutes} min read
              </div>
              {quizQuestions && quizQuestions.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <HelpCircle className="w-3 h-3" />
                  {quizQuestions.length} Quiz Questions
                </Badge>
              )}
              {quizScore && (
                <Badge variant="outline" className="gap-1 bg-primary/10">
                  <Award className="w-3 h-3 text-primary" />
                  Score: {quizScore.score}/{quizScore.total_questions}
                </Badge>
              )}
              {isCompleted && (
                <Badge className="gap-1 bg-primary">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </Badge>
              )}
            </div>
            <CardTitle className="text-3xl">{currentModule.title}</CardTitle>
            <CardDescription className="text-lg">{currentModule.description}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeView === 'content' ? 'default' : 'outline'}
                onClick={() => setActiveView('content')}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Lesson Content
              </Button>
              <Button
                variant={activeView === 'quiz' ? 'default' : 'outline'}
                onClick={handleStartQuiz}
                disabled={!quizQuestions || quizQuestions.length === 0}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Take Quiz
              </Button>
            </div>

            {activeView === 'content' ? (
              <Card>
                <CardContent className="p-8">
                  <article className="prose prose-lg dark:prose-invert max-w-none">
                    {renderContent(currentModule.content)}
                  </article>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-10 pt-6 border-t">
                    {!isCompleted && (
                      <Button 
                        size="lg"
                        onClick={handleCompleteModule}
                        disabled={completeModule.isPending}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completeModule.isPending ? 'Saving...' : 'Mark as Complete'}
                      </Button>
                    )}
                    {quizQuestions && quizQuestions.length > 0 && (
                      <Button size="lg" variant="secondary" onClick={handleStartQuiz} className="gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Take the Quiz
                      </Button>
                    )}
                    {nextModule && (
                      <Link to={`/learn/${nextModule.id}`}>
                        <Button size="lg" variant="outline" className="gap-2">
                          Next Lesson
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : showResults ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Award className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                    <p className="text-xl text-muted-foreground">
                      You scored {Object.values(selectedAnswers).filter((ans, i) => 
                        quizQuestions && ans === quizQuestions[i]?.correct_answer
                      ).length} out of {quizQuestions?.length}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {quizQuestions?.map((q, index) => {
                      const isCorrect = selectedAnswers[index] === q.correct_answer;
                      return (
                        <Card key={q.id} className={isCorrect ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-lg">{q.question}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {isCorrect ? '✓ Correct!' : `✗ Correct answer: ${(q.options as string[])[q.correct_answer]}`}
                                </p>
                                <p className="text-sm mt-3 p-3 bg-secondary/50 rounded-lg">{q.explanation}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button variant="outline" onClick={() => setActiveView('content')}>
                      Review Lesson
                    </Button>
                    <Button onClick={handleStartQuiz}>Retake Quiz</Button>
                    {nextModule && (
                      <Link to={`/learn/${nextModule.id}`}>
                        <Button variant="secondary" className="gap-2">
                          Next Lesson
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : currentQuestion ? (
              <Card>
                <CardContent className="p-8">
                  {/* Progress */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-medium">
                      Question {currentQuestionIndex + 1} of {quizQuestions?.length}
                    </span>
                    <Progress 
                      value={((currentQuestionIndex + 1) / (quizQuestions?.length || 1)) * 100} 
                      className="w-32 h-2" 
                    />
                  </div>

                  {/* Question */}
                  <h3 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h3>

                  {/* Options */}
                  <RadioGroup
                    value={selectedAnswers[currentQuestionIndex]?.toString()}
                    onValueChange={(v) => handleAnswerSelect(parseInt(v))}
                    className="space-y-3"
                  >
                    {(currentQuestion.options as string[]).map((option, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                          selectedAnswers[currentQuestionIndex] === index 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <RadioGroupItem value={index.toString()} id={`q${currentQuestionIndex}-${index}`} />
                        <Label htmlFor={`q${currentQuestionIndex}-${index}`} className="text-lg cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Navigation */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    {currentQuestionIndex < (quizQuestions?.length || 1) - 1 ? (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        disabled={selectedAnswers[currentQuestionIndex] === undefined}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length < (quizQuestions?.length || 0)}
                      >
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Quiz Available</h3>
                  <p className="text-muted-foreground">This lesson doesn't have a quiz yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <AIAssistantCard 
              context={`lesson about "${currentModule.title}"`}
              suggestedQuestions={[
                `Explain ${currentModule.title} in simpler terms`,
                "Give me a real-world example",
                "What are common mistakes beginners make?"
              ]}
            />

            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Other Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {modules?.map((mod, i) => {
                      const completed = progress?.some(p => p.module_id === mod.id && p.completed);
                      return (
                        <Link 
                          key={mod.id} 
                          to={`/learn/${mod.id}`}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                            mod.id === moduleId 
                              ? 'bg-primary/10 text-primary' 
                              : 'hover:bg-secondary'
                          }`}
                        >
                          {completed ? (
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{mod.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonPage;

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, BookOpen, HelpCircle, Award, ChevronLeft, ChevronRight, XCircle, CheckCircle2, MessageCircle, Sparkles, Trophy } from 'lucide-react';
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
import InteractiveBlockRenderer, { type InteractiveBlock } from '@/components/learn/InteractiveBlockRenderer';
import LessonPodcast from '@/components/LessonPodcast';
import BeanstalkGameModal from '@/components/BeanstalkGameModal';

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

  const [activeView, setActiveView] = useState<'content' | 'quiz' | 'game'>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentModule = modules?.find(m => m.id === moduleId);
  const moduleIndex = modules?.findIndex(m => m.id === moduleId) ?? -1;
  const isCompleted = progress?.some(p => p.module_id === moduleId && p.completed);
  const quizScore = quizResults?.find(r => r.module_id === moduleId);
  const currentQuestion = quizQuestions?.[currentQuestionIndex];
  const interactiveBlocks = Array.isArray(currentModule?.interactive_blocks)
    ? (currentModule?.interactive_blocks as InteractiveBlock[])
    : [];

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

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      // Standalone **header** (section title)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <h2 key={i} className="text-xl font-bold mt-8 mb-3 text-foreground border-b border-border/50 pb-2 first:mt-0">
            {trimmed.replace(/\*\*/g, '')}
          </h2>
        );
      }
      // List items: - **Bold**: rest or - item
      if (trimmed.startsWith('- ')) {
        const inner = line.substring(line.indexOf('- ') + 2);
        return (
          <div key={i} className="flex items-start gap-3 mb-2 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p className="text-base text-foreground/90 leading-relaxed">
              {parseBold(inner)}
            </p>
          </div>
        );
      }
      // Numbered items: 1. **Bold** rest
      if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\./)?.[1];
        const inner = trimmed.replace(/^\d+\.\s*/, '');
        return (
          <div key={i} className="flex items-start gap-3 mb-2 ml-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0 text-xs">
              {num}
            </span>
            <p className="text-base text-foreground/90 leading-relaxed pt-0.5">
              {parseBold(inner)}
            </p>
          </div>
        );
      }
      // Regular paragraph (may contain **bold**)
      if (trimmed) {
        return (
          <p key={i} className="text-base text-foreground/90 leading-relaxed mb-4">
            {parseBold(line)}
          </p>
        );
      }
      return <div key={i} className="h-1" />;
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
              {interactiveBlocks.length > 0 && (
                <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  Interactive
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
              <Button
                variant={activeView === 'game' ? 'default' : 'outline'}
                onClick={() => setActiveView('game')}
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                Play Game
              </Button>
            </div>

            {activeView === 'content' ? (
              <Card>
                <CardContent className="p-8">
                  <article className="prose prose-lg dark:prose-invert max-w-none">
                    {renderContent(currentModule.content)}
                  </article>

                  {interactiveBlocks.length > 0 && (
                    <div className="mt-10 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Sparkles className="w-4 h-4" />
                        Hands-on practice
                      </div>
                      <InteractiveBlockRenderer blocks={interactiveBlocks} />
                    </div>
                  )}

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
            ) : activeView === 'game' ? (
              <Card className="text-center p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                    Beanstalk Adventure
                  </h3>
                  <p className="text-green-600 dark:text-green-300 mb-6 max-w-md mx-auto">
                    Test your knowledge with our interactive climbing game! Answer questions correctly to climb the beanstalk and reach the golden castle.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setIsGameModalOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-8 py-3 text-lg"
                  size="lg"
                >
                  🎮 Start Adventure
                </Button>
                
                <div className="mt-6 text-sm text-green-500 dark:text-green-400">
                  <div className="flex items-center justify-center gap-4">
                    <span>✨ Interactive Questions</span>
                    <span>🏆 Score Points</span>
                    <span>🎯 Reach the Top</span>
                  </div>
                </div>
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
            {/* Lesson Podcast */}
            <LessonPodcast
              moduleId={moduleId || ''}
              title={currentModule?.title || ''}
              content={currentModule?.content || ''}
            />

            {/* Beanstalk Game */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🌱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                    Beanstalk Adventure
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                    Test your knowledge with our interactive climbing game! Answer questions to reach the top.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setIsGameModalOpen(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium"
                  size="lg"
                >
                  🎮 Play Game
                </Button>
                
                <div className="mt-3 text-xs text-green-500 dark:text-green-400">
                  ✨ Interactive learning experience
                </div>
              </CardContent>
            </Card>

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
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">All Lessons</CardTitle>
                <CardDescription className="text-xs">
                  {modules?.length ?? 0} total • jump to any lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-3">
                  <div className="space-y-1">
                    {modules?.map((mod, i) => {
                      const completed = progress?.some(p => p.module_id === mod.id && p.completed);
                      return (
                        <Link
                          key={mod.id}
                          to={`/learn/${mod.id}`}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                            mod.id === moduleId
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-secondary'
                          }`}
                        >
                          <span className="w-6 text-xs tabular-nums text-muted-foreground flex-shrink-0">
                            {i + 1}
                          </span>
                          {completed ? (
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted flex-shrink-0" />
                          )}
                          <span className="text-sm truncate flex-1">{mod.title}</span>
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

      {/* Beanstalk Game Modal */}
      <BeanstalkGameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        moduleId={moduleId || ''}
        title={currentModule?.title || ''}
        content={currentModule?.content || ''}
        onComplete={(score, height) => {
          toast({
            title: '🎉 Game Complete!',
            description: `You scored ${score} points and reached ${height}m!`,
          });
        }}
      />
    </DashboardLayout>
  );
};

export default LessonPage;

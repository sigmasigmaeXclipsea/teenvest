import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Pause, RotateCcw, Trophy, Loader2, Zap, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BeanstalkGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  title: string;
  content: string;
  onComplete?: (score: number, height: number) => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Player {
  y: number;
  velocity: number;
  isJumping: boolean;
}

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const BEANSTALK_SPEED = 2;
const QUESTION_TIME_LIMIT = 15; // seconds

const BeanstalkGameModal = ({ 
  isOpen, 
  onClose, 
  moduleId, 
  title, 
  content, 
  onComplete 
}: BeanstalkGameModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nextQuestionAtRef = useRef<number>(300);
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'question' | 'gameover' | 'completed'>('idle');
  const [score, setScore] = useState(0);
  const [height, setHeight] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [player, setPlayer] = useState<Player>({ y: 200, velocity: 0, isJumping: false });
  const [beanstalkOffset, setBeanstalkOffset] = useState(0);
  const [clouds, setClouds] = useState<Array<{ x: number; y: number; size: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate questions using Lovable AI edge function
  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      if (!moduleId) {
        throw new Error('Missing lesson id');
      }
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('question, options, correct_answer')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const parsedQuestions: Question[] = (data || [])
        .map((q: any) => {
          let options: any = q.options;
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch {
              options = [];
            }
          }

          if (!Array.isArray(options)) return null;

          return {
            question: q.question,
            options,
            correctAnswer: q.correct_answer,
          } as Question;
        })
        .filter(Boolean) as Question[];

      if (!parsedQuestions || parsedQuestions.length === 0) {
        throw new Error('No quiz questions found for this lesson');
      }

      setQuestions(parsedQuestions);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate questions',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  // Initialize clouds
  useEffect(() => {
    setClouds([
      { x: 100, y: 50, size: 30 },
      { x: 300, y: 80, size: 40 },
      { x: 500, y: 40, size: 35 },
      { x: 200, y: 120, size: 25 },
      { x: 400, y: 100, size: 45 },
    ]);
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    clouds.forEach(cloud => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x - cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw beanstalk
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 8;
    ctx.beginPath();
    
    for (let y = canvas.height; y > -beanstalkOffset; y -= 20) {
      const x = canvas.width / 2 + Math.sin(y * 0.05) * 30;
      if (y === canvas.height) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw leaves on beanstalk
    for (let y = canvas.height; y > -beanstalkOffset; y -= 60) {
      const x = canvas.width / 2 + Math.sin(y * 0.05) * 30;
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.ellipse(x + 20, y, 15, 8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 20, y - 20, 15, 8, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update player physics
    setPlayer(prev => {
      let newY = prev.y + prev.velocity;
      let newVelocity = prev.velocity + GRAVITY;
      let newIsJumping = prev.isJumping;

      // Ground collision
      if (newY >= canvas.height - 50) {
        newY = canvas.height - 50;
        newVelocity = 0;
        newIsJumping = false;
      }

      return { y: newY, velocity: newVelocity, isJumping: newIsJumping };
    });

    // Draw player (character)
    const playerX = canvas.width / 2;
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(playerX - 15, player.y - 30, 30, 30);
    
    // Draw player face
    ctx.fillStyle = '#000';
    ctx.fillRect(playerX - 10, player.y - 20, 5, 5);
    ctx.fillRect(playerX + 5, player.y - 20, 5, 5);
    ctx.fillRect(playerX - 5, player.y - 10, 10, 3);

    setBeanstalkOffset(prev => {
      const nextOffset = prev + BEANSTALK_SPEED;
      setHeight(Math.floor(nextOffset / 10));

      if (questions.length > 0 && nextOffset >= nextQuestionAtRef.current) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        nextQuestionAtRef.current = nextQuestionAtRef.current + 300;
        setCurrentQuestion(randomQuestion);
        setSelectedAnswer(null);
        setTimeLeft(QUESTION_TIME_LIMIT);
        setGameState('question');
      }

      if (nextOffset > 2000) {
        setGameState('completed');
        onComplete?.(score, Math.floor(nextOffset / 10));
      }

      return nextOffset;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, clouds, beanstalkOffset, questions, score, height, onComplete]);

  // Start game loop when playing
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Handle jump
  const handleJump = useCallback(() => {
    if (gameState === 'playing' && !player.isJumping) {
      setPlayer(prev => ({ ...prev, velocity: JUMP_FORCE, isJumping: true }));
    }
  }, [gameState, player.isJumping]);

  // Start game
  const startGame = async () => {
    if (questions.length === 0) {
      const ok = await generateQuestions();
      if (!ok) return;
    }
    setGameState('playing');
    setScore(0);
    setHeight(0);
    setBeanstalkOffset(0);
    nextQuestionAtRef.current = 300;
    setPlayer({ y: 200, velocity: 0, isJumping: false });
  };

  // Submit answer
  const submitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 100);
      toast({
        title: 'Correct! 🎉',
        description: '+100 points',
      });
    } else {
      toast({
        title: 'Incorrect',
        description: 'Keep trying!',
        variant: 'destructive',
      });
    }

    setGameState('playing');
    setCurrentQuestion(null);
    setSelectedAnswer(null);
  };

  // Reset game
  const resetGame = () => {
    setGameState('idle');
    setScore(0);
    setHeight(0);
    setBeanstalkOffset(0);
    setPlayer({ y: 200, velocity: 0, isJumping: false });
    setCurrentQuestion(null);
    setSelectedAnswer(null);
  };

  // Timer for questions
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'question' && timeLeft === 0) {
      // Time's up - wrong answer
      setGameState('playing');
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      toast({
        title: "Time's up!",
        description: 'No points awarded',
        variant: 'destructive',
      });
    }
  }, [gameState, timeLeft]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Beanstalk Adventure: {title}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{score}</div>
                <div className="text-xs text-blue-600/70">Score</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{height}m</div>
                <div className="text-xs text-green-600/70">Height</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{gameState}</div>
                <div className="text-xs text-purple-600/70">Status</div>
              </CardContent>
            </Card>
          </div>

          {/* Game Canvas */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full cursor-pointer"
                onClick={handleJump}
              />
              
              {/* Question Overlay */}
              {gameState === 'question' && currentQuestion && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                  <Card className="max-w-md w-full">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Quick Question!</CardTitle>
                        <div className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-green-500'}`}>
                          {timeLeft}s
                        </div>
                      </div>
                      <Progress value={(timeLeft / QUESTION_TIME_LIMIT) * 100} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-medium">{currentQuestion.question}</p>
                      
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedAnswer === index ? "default" : "outline"}
                            className="w-full text-left justify-start"
                            onClick={() => setSelectedAnswer(index)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        onClick={submitAnswer}
                        disabled={selectedAnswer === null}
                        className="w-full"
                      >
                        Submit Answer
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Game Over Overlay */}
              {gameState === 'completed' && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                  <Card className="max-w-md w-full text-center">
                    <CardHeader>
                      <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <CardTitle className="text-2xl">🎉 Victory!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-lg">You reached the top of the beanstalk!</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{score}</div>
                          <div className="text-sm text-muted-foreground">Final Score</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{height}m</div>
                          <div className="text-sm text-muted-foreground">Max Height</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={resetGame} className="flex-1">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Play Again
                        </Button>
                        <Button onClick={onClose} variant="outline" className="flex-1">
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Controls */}
          <div className="flex gap-2">
            {gameState === 'idle' && (
              <Button onClick={startGame} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Game
              </Button>
            )}
            
            {gameState === 'playing' && (
              <Button onClick={() => setGameState('paused')} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            
            {gameState === 'paused' && (
              <Button onClick={() => setGameState('playing')} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            
            {(gameState === 'playing' || gameState === 'paused') && (
              <Button onClick={resetGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-lg">
            💡 <strong>How to play:</strong> Click on the game to make your character jump! Answer questions correctly to earn points. Reach the top to win!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeanstalkGameModal;

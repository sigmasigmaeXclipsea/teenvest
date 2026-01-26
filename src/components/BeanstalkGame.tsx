import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Trophy, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BeanstalkGameProps {
  moduleId: string;
  title: string;
  content: string;
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

const BeanstalkGame = ({ moduleId, title, content }: BeanstalkGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
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
      const { data, error } = await supabase.functions.invoke('learning-ai', {
        body: {
          prompt: `Create 5 multiple choice questions based on this lesson. Each question should have 4 options with one correct answer.

Title: ${title}
Content: ${content}

Return the response as a JSON array in this exact format:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Make sure the JSON is valid and properly formatted.`,
          context: 'quiz_generation'
        }
      });

      if (error) throw error;

      const text = data?.response || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]);
        setQuestions(parsedQuestions);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate questions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize clouds
  useEffect(() => {
    setClouds([
      { x: 100, y: 50, size: 30 },
      { x: 300, y: 100, size: 40 },
      { x: 500, y: 80, size: 35 },
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
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    clouds.forEach(cloud => {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x - cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update beanstalk offset
    setBeanstalkOffset(prev => prev + BEANSTALK_SPEED);

    // Draw beanstalk
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, canvas.height);
    ctx.stroke();

    // Draw beanstalk leaves
    for (let i = 0; i < 20; i++) {
      const leafY = (i * 50 + beanstalkOffset) % (canvas.height + 100) - 50;
      if (leafY > 0 && leafY < canvas.height) {
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(130, leafY, 20, 10, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(70, leafY + 25, 20, 10, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Update player physics
    setPlayer(prev => {
      let newY = prev.y + prev.velocity;
      let newVelocity = prev.velocity + GRAVITY;
      let newIsJumping = prev.isJumping;

      // Ground collision
      if (newY > 200) {
        newY = 200;
        newVelocity = 0;
        newIsJumping = false;
      }

      return { y: newY, velocity: newVelocity, isJumping: newIsJumping };
    });

    // Draw player (cartoon character)
    ctx.fillStyle = '#FFD700'; // Gold/yellow color
    ctx.beginPath();
    ctx.arc(100, player.y, 15, 0, Math.PI * 2); // Head
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#4169E1'; // Blue
    ctx.fillRect(85, player.y + 15, 30, 25);
    
    // Eyes
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(93, player.y - 5, 2, 0, Math.PI * 2);
    ctx.arc(107, player.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile
    ctx.beginPath();
    ctx.arc(100, player.y, 8, 0, Math.PI);
    ctx.stroke();

    // Update height and score
    setHeight(Math.floor(beanstalkOffset / 10));
    setScore(Math.floor(beanstalkOffset / 5));

    // Trigger question every 200 pixels
    if (beanstalkOffset > 0 && beanstalkOffset % 200 === 0 && questions.length > 0) {
      const questionIndex = Math.floor((beanstalkOffset / 200) - 1) % questions.length;
      setCurrentQuestion(questions[questionIndex]);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setGameState('question');
    }

    // Check win condition
    if (beanstalkOffset > 2000) {
      setGameState('completed');
      toast({
        title: '🎉 Congratulations!',
        description: `You reached the top! Score: ${score}`,
      });
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, beanstalkOffset, clouds, questions, score, toast]);

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
  const handleJump = () => {
    if (gameState === 'playing' && !player.isJumping) {
      setPlayer(prev => ({ ...prev, velocity: JUMP_FORCE, isJumping: true }));
    }
  };

  // Start game
  const startGame = async () => {
    if (questions.length === 0) {
      await generateQuestions();
    }
    setGameState('playing');
    setScore(0);
    setHeight(0);
    setBeanstalkOffset(0);
    setPlayer({ y: 200, velocity: 0, isJumping: false });
  };

  // Handle answer submission
  const submitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    if (selectedAnswer === currentQuestion.correctAnswer) {
      toast({
        title: '✅ Correct!',
        description: '+100 points',
      });
      setScore(prev => prev + 100);
    } else {
      toast({
        title: '❌ Wrong Answer',
        description: 'Keep climbing and try again!',
        variant: 'destructive',
      });
    }

    setSelectedAnswer(null);
    setCurrentQuestion(null);
    setGameState('playing');
  };

  // Timer for questions
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'question' && timeLeft === 0) {
      // Time's up - wrong answer
      toast({
        title: '⏰ Time\'s Up!',
        description: 'Wrong answer - keep climbing!',
        variant: 'destructive',
      });
      setSelectedAnswer(null);
      setCurrentQuestion(null);
      setGameState('playing');
    }
  }, [gameState, timeLeft, toast]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Beanstalk Climber Game
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Height</p>
            <p className="text-2xl font-bold text-green-600">{height}m</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Questions</p>
            <p className="text-2xl font-bold text-purple-600">{questions.length}</p>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="w-full"
            onClick={handleJump}
          />
          
          {/* Question Overlay */}
          {gameState === 'question' && currentQuestion && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Quick Question!</p>
                    <p className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-green-500'}`}>
                      {timeLeft}s
                    </p>
                  </div>
                  <Progress value={(timeLeft / QUESTION_TIME_LIMIT) * 100} className="mb-4" />
                </div>
                
                <p className="font-medium mb-4">{currentQuestion.question}</p>
                
                <div className="space-y-2 mb-4">
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
              </div>
            </div>
          )}
          
          {/* Game Over Overlay */}
          {gameState === 'completed' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">🎉 Victory!</h3>
                <p className="text-muted-foreground mb-4">You reached the top of the beanstalk!</p>
                <p className="text-3xl font-bold text-primary mb-4">Score: {score}</p>
                <Button onClick={startGame} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>

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
            <Button onClick={startGame} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          💡 Click on the game to jump! Answer questions correctly to earn points.
        </div>
      </CardContent>
    </Card>
  );
};

export default BeanstalkGame;

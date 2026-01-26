import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MiniQuizBlockProps = {
  prompt: string;
  options: string[];
  correctIndex: number;
  feedback?: { correct?: string; incorrect?: string };
};

const MiniQuizBlock = ({ prompt, options, correctIndex, feedback }: MiniQuizBlockProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isCorrect = selectedIndex === correctIndex;
  const showFeedback = selectedIndex !== null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base font-medium">{prompt}</p>
        <div className="grid gap-2">
          {options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isAnswer = showFeedback && index === correctIndex;
            const isWrong = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                  isAnswer
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : isWrong
                      ? 'border-destructive bg-destructive/10'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
              isCorrect ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isCorrect ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
            <div>
              <p className="font-semibold">{isCorrect ? 'Correct' : 'Try again'}</p>
              <p>
                {isCorrect
                  ? feedback?.correct ?? 'Nice work. You picked the right answer.'
                  : feedback?.incorrect ?? 'That is not quite right yet. Review and try again.'}
              </p>
            </div>
          </div>
        )}

        {showFeedback && !isCorrect && (
          <Button size="sm" variant="secondary" onClick={() => setSelectedIndex(null)}>
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MiniQuizBlock;

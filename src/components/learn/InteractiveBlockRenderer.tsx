import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MiniQuizBlock from '@/components/learn/MiniQuizBlock';
import TradeSimBlock from '@/components/learn/TradeSimBlock';
import ScenarioChartBlock from '@/components/learn/ScenarioChartBlock';

export type InteractiveBlock =
  | {
      type: 'mini_quiz';
      prompt: string;
      options: string[];
      correctIndex: number;
      feedback?: { correct?: string; incorrect?: string };
    }
  | {
      type: 'trade_sim';
      symbol: string;
      startPrice: number;
      volatility?: number;
      steps?: number;
      headline?: string;
      summary?: string;
      stat?: string;
      sentiment?: 'bullish' | 'bearish' | 'neutral';
      biasStrength?: number;
      newsImpactPrompted?: boolean;
    }
  | {
      type: 'interactive_chart';
      title: string;
      sliderLabel: string;
      sliderRange: { min: number; max: number; step?: number };
      seriesFormula?: 'compound' | 'linear';
    };

type InteractiveBlockRendererProps = {
  blocks?: InteractiveBlock[] | null;
};

const InteractiveBlockRenderer = ({ blocks }: InteractiveBlockRendererProps) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'mini_quiz') {
          return <MiniQuizBlock key={`mini-quiz-${index}`} {...block} />;
        }

        if (block.type === 'trade_sim') {
          return <TradeSimBlock key={`trade-sim-${index}`} {...block} />;
        }

        if (block.type === 'interactive_chart') {
          return <ScenarioChartBlock key={`chart-${index}`} {...block} />;
        }

        return (
          <Card key={`unknown-${index}`} className="border-dashed">
            <CardHeader>
              <CardTitle>Unsupported interactive block</CardTitle>
            </CardHeader>
            <CardContent>
              This lesson includes a block type that is not supported yet.
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default InteractiveBlockRenderer;

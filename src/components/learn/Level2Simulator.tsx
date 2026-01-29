import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type LevelRow = {
  price: number;
  size: number;
  isWhale?: boolean;
};

const ROWS = 10;
const TICK_MS = 280;
const WHALE_MULTIPLIER = 50;
const WHALE_WINDOW_MS = 1600;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const buildSide = (mid: number, direction: 1 | -1, whaleActive: boolean, whaleOnBid: boolean): LevelRow[] => {
  const base = direction === 1 ? mid + 0.05 : mid - 0.05;
  return Array.from({ length: ROWS }, (_, index) => {
    const price = base + direction * (index * 0.05 + rand(0, 0.02));
    const size = Math.round(rand(20, 120) * (index < 3 ? 1.2 : 1));
    return {
      price: Number(price.toFixed(2)),
      size,
      isWhale: whaleActive && ((whaleOnBid && direction === -1) || (!whaleOnBid && direction === 1)) && index === 1,
    };
  });
};

const symbolList = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'AMD', 'NFLX', 'GOOGL', 'SPY'];

const pickSymbol = (moduleId: string) => {
  if (!moduleId) return symbolList[0];
  let hash = 0;
  for (let i = 0; i < moduleId.length; i += 1) {
    hash = (hash * 33 + moduleId.charCodeAt(i)) % 100000;
  }
  return symbolList[hash % symbolList.length];
};

const Level2Simulator = ({
  moduleId,
  lessonIndex,
}: {
  moduleId: string;
  lessonIndex: number;
}) => {
  const [bids, setBids] = useState<LevelRow[]>([]);
  const [asks, setAsks] = useState<LevelRow[]>([]);
  const [mid, setMid] = useState(120);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState<'neutral' | 'win' | 'reject'>('neutral');
  const [rejected, setRejected] = useState(false);

  const midRef = useRef(120);
  const whaleUntilRef = useRef(0);
  const whaleSideRef = useRef<'asks' | 'bids'>('asks');

  const symbol = useMemo(() => pickSymbol(moduleId), [moduleId]);
  const difficulty = useMemo(() => Math.min(1, Math.max(0, (lessonIndex - 1) / 25)), [lessonIndex]);
  const tickMs = Math.max(140, TICK_MS - Math.round(difficulty * 120));

  useEffect(() => {
    const interval = setInterval(() => {
      const drift = 0.25 + difficulty * 0.35;
      const nextMid = Math.max(60, Math.min(180, midRef.current + rand(-drift, drift)));
      midRef.current = nextMid;
      setMid(nextMid);

      const now = Date.now();
      const spawnWhale = Math.random() < 0.12 + difficulty * 0.12;
      if (spawnWhale) {
        whaleUntilRef.current = now + WHALE_WINDOW_MS + difficulty * 400;
        whaleSideRef.current = Math.random() < 0.5 ? 'asks' : 'bids';
      }
      const whaleActive = now < whaleUntilRef.current;
      const whaleOnBid = whaleSideRef.current === 'bids';

      const nextBids = buildSide(nextMid, -1, whaleActive, whaleOnBid);
      const nextAsks = buildSide(nextMid, 1, whaleActive, whaleOnBid);
      if (whaleActive) {
        if (whaleOnBid) {
          nextBids[1].size = nextBids[1].size * WHALE_MULTIPLIER;
          nextBids[1].isWhale = true;
        } else {
          nextAsks[1].size = nextAsks[1].size * WHALE_MULTIPLIER;
          nextAsks[1].isWhale = true;
        }
      }

      setBids(nextBids);
      setAsks(nextAsks);
    }, tickMs);

    return () => clearInterval(interval);
  }, [tickMs, difficulty]);

  const whaleActive = useMemo(() => Date.now() < whaleUntilRef.current, [bids, asks]);
  const whaleSide = whaleSideRef.current;
  const bidPressure = useMemo(() => bids.reduce((sum, row) => sum + row.size, 0), [bids]);
  const askPressure = useMemo(() => asks.reduce((sum, row) => sum + row.size, 0), [asks]);
  const pressureSide = bidPressure > askPressure ? 'bids' : 'asks';

  const handleAction = (action: 'buy' | 'sell') => {
    if (whaleActive) {
      const correctAction = whaleSide === 'asks' ? 'sell' : 'buy';
      if (action === correctAction) {
        setPoints((prev) => prev + 15);
        setFeedback('win');
      } else {
        setFeedback('reject');
        setRejected(true);
        setTimeout(() => setRejected(false), 800);
      }
      return;
    }

    if ((pressureSide === 'bids' && action === 'buy') || (pressureSide === 'asks' && action === 'sell')) {
      setPoints((prev) => prev + 5);
      setFeedback('win');
    } else {
      setFeedback('reject');
      setRejected(true);
      setTimeout(() => setRejected(false), 800);
    }
  };

  return (
    <Card className="border-border/60 bg-[#0b0f14] text-white font-mono">
      <CardHeader>
        <CardTitle className="text-lg">Level 2 Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span>Mid: {mid.toFixed(2)}</span>
          <span>Pressure: {pressureSide === 'bids' ? 'Bid wall' : 'Ask wall'}</span>
          <div className="flex items-center gap-3">
            <span>{symbol} • Level {lessonIndex}</span>
            <span>Points: {points}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 text-slate-200 hover:bg-white/10"
                  aria-label="Level 2 help"
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-slate-900 text-slate-100 border-slate-700">
                <p className="text-xs leading-relaxed">
                  Watch the tape for pressure. Whale on Asks → Sell into resistance. Whale on Bids →
                  Buy the support. Clicking into the wall triggers a rejection.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
            <div className="mb-2 text-xs font-semibold text-emerald-400">Bids</div>
            <div className="space-y-1">
              {bids.map((row, index) => (
                <div
                  key={`bid-${index}`}
                  className="flex items-center justify-between rounded-md bg-emerald-500/10 px-2 py-1 text-xs transition-opacity"
                  style={{ opacity: 0.6 + Math.random() * 0.4 }}
                >
                  <span>{row.price.toFixed(2)}</span>
                  <span className="text-emerald-200">{row.size}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-3">
            <div className="mb-2 text-xs font-semibold text-rose-400">Asks</div>
            <div className="space-y-1">
              {asks.map((row, index) => (
                <div
                  key={`ask-${index}`}
                  className={`flex items-center justify-between rounded-md px-2 py-1 text-xs transition-opacity ${
                    row.isWhale ? 'bg-rose-500/30 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-rose-500/10'
                  }`}
                  style={{ opacity: 0.6 + Math.random() * 0.4 }}
                >
                  <span>{row.price.toFixed(2)}</span>
                  <span className={row.isWhale ? 'font-bold' : 'text-rose-200'}>
                    {row.size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleAction('buy')}>
            Buy
          </Button>
          <Button className="bg-rose-500 hover:bg-rose-600" onClick={() => handleAction('sell')}>
            Sell
          </Button>
          <div className="text-xs text-slate-400 flex items-center">
            {feedback === 'win' ? 'Good read ✅' : feedback === 'reject' ? 'Rejected ⛔' : 'Read the tape'}
          </div>
        </div>

        {rejected && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 animate-pulse">
            Rejected — you hit the wall.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Level2Simulator;

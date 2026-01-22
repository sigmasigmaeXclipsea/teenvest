import { useMemo } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StockCandlestickChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

const StockCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: StockCandlestickChartProps) => {
  // Generate simulated historical daily candles
  const candleData = useMemo(() => {
    const candles: CandleData[] = [];
    const days = 20;
    const today = new Date();
    
    let prevClose = currentPrice * (1 - (Math.random() * 0.15 - 0.05)); // Start from roughly similar price
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (i === 0) {
        // Today's candle uses actual data
        candles.push({
          date: 'Today',
          open,
          high,
          low,
          close: currentPrice
        });
      } else {
        // Generate realistic candle
        const volatility = 0.025;
        const change = (Math.random() - 0.48) * volatility * prevClose;
        const dailyOpen = prevClose + (Math.random() - 0.5) * volatility * prevClose * 0.3;
        const dailyClose = prevClose + change;
        const dailyHigh = Math.max(dailyOpen, dailyClose) * (1 + Math.random() * volatility * 0.5);
        const dailyLow = Math.min(dailyOpen, dailyClose) * (1 - Math.random() * volatility * 0.5);
        
        candles.push({
          date: dateStr,
          open: Number(dailyOpen.toFixed(2)),
          high: Number(dailyHigh.toFixed(2)),
          low: Number(dailyLow.toFixed(2)),
          close: Number(dailyClose.toFixed(2))
        });
        
        prevClose = dailyClose;
      }
    }
    
    return candles;
  }, [open, high, low, currentPrice]);

  // Calculate data for rendering
  const chartData = useMemo(() => {
    return candleData.map(candle => {
      const isGreen = candle.close >= candle.open;
      return {
        date: candle.date,
        // For the body
        bodyBottom: Math.min(candle.open, candle.close),
        bodyHeight: Math.abs(candle.close - candle.open),
        // For wicks
        wickHigh: candle.high,
        wickLow: candle.low,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        isGreen
      };
    });
  }, [candleData]);

  const allPrices = candleData.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]?.payload) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{data.date}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Open:</span>
          <span>${data.open.toFixed(2)}</span>
          <span className="text-muted-foreground">High:</span>
          <span>${data.high.toFixed(2)}</span>
          <span className="text-muted-foreground">Low:</span>
          <span>${data.low.toFixed(2)}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className={data.isGreen ? 'text-primary' : 'text-destructive'}>
            ${data.close.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          20-Day Price History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                interval={Math.floor(chartData.length / 5)}
              />
              <YAxis 
                domain={[minPrice, maxPrice]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(val) => `$${val.toFixed(0)}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={previousClose} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              {/* Render candle bodies as bars */}
              <Bar 
                dataKey="bodyHeight" 
                stackId="candle"
                barSize={8}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.isGreen ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Green = price went up • Red = price went down
        </p>
      </CardContent>
    </Card>
  );
};

export default StockCandlestickChart;

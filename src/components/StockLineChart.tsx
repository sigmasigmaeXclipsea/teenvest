import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockLineChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

const StockLineChart = ({ symbol, currentPrice, previousClose, high, low, open }: StockLineChartProps) => {
  // Generate simulated intraday data points based on OHLC
  const chartData = useMemo(() => {
    const points: { time: string; price: number }[] = [];
    const numPoints = 78; // ~6.5 hours of trading, one point per 5 min
    
    // Create realistic-looking price movement
    const range = high - low;
    const volatility = range / currentPrice;
    
    let price = open;
    const target = currentPrice;
    
    for (let i = 0; i <= numPoints; i++) {
      const hour = Math.floor(9.5 + (i / numPoints) * 6.5);
      const minute = Math.floor((i % 12) * 5);
      const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;
      
      if (i === numPoints) {
        price = target;
      } else if (i === 0) {
        price = open;
      } else {
        // Move toward target with some randomness
        const progress = i / numPoints;
        const targetAtPoint = open + (target - open) * progress;
        const randomFactor = (Math.random() - 0.5) * range * 0.3;
        price = targetAtPoint + randomFactor;
        
        // Keep within bounds
        price = Math.max(low, Math.min(high, price));
      }
      
      points.push({ time: timeStr, price: Number(price.toFixed(2)) });
    }
    
    return points;
  }, [open, currentPrice, high, low]);

  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;
  const isPositive = change >= 0;

  const minPrice = Math.min(...chartData.map(d => d.price)) * 0.999;
  const maxPrice = Math.max(...chartData.map(d => d.price)) * 1.001;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Performance</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                interval={12}
              />
              <YAxis 
                domain={[minPrice, maxPrice]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(val) => `$${val.toFixed(0)}`}
                width={50}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <ReferenceLine 
                y={previousClose} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Open: ${open.toFixed(2)}</span>
          <span>Prev Close: ${previousClose.toFixed(2)}</span>
          <span>Current: ${currentPrice.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockLineChart;

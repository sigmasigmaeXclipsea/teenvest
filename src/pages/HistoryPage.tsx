import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useTrades } from '@/hooks/useTrades';

const HistoryPage = () => {
  const { data: trades, isLoading } = useTrades();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading trade history...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trade History</h1>
          <p className="text-muted-foreground">View all your past trades</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Trades ({trades?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {trades && trades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Stock</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Order</th>
                      <th className="pb-3 font-medium">Shares</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b last:border-0">
                        <td className="py-4 text-sm">
                          {format(new Date(trade.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {trade.trade_type === 'buy' ? (
                              <ArrowDownCircle className="w-5 h-5 text-primary" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 text-destructive" />
                            )}
                            <div>
                              <p className="font-semibold">{trade.symbol}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                                {trade.company_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}>
                            {trade.trade_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline">{trade.order_type}</Badge>
                        </td>
                        <td className="py-4 font-medium">
                          {Number(trade.shares).toFixed(2)}
                        </td>
                        <td className="py-4">
                          ${Number(trade.price).toFixed(2)}
                        </td>
                        <td className="py-4 font-semibold">
                          ${Number(trade.total_amount).toFixed(2)}
                        </td>
                        <td className="py-4">
                          {trade.status === 'completed' ? (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {trade.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
                <p className="text-muted-foreground">
                  Your trade history will appear here once you make your first trade.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;

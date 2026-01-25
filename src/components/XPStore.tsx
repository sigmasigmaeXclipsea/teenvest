import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Trophy, Star, Zap, Crown, Shield, Target, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface XPStoreProps {
  currentXP: number;
  onPurchase: (itemCost: number) => void;
}

const XPStore = ({ currentXP, onPurchase }: XPStoreProps) => {
  const { toast } = useToast();
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  const items = [
    {
      id: 'badge-starter',
      name: 'Starter Badge',
      description: 'Show you’re on your way',
      cost: 150,
      icon: Star,
      benefit: 'Cosmetic badge on profile',
    },
    {
      id: 'badge-explorer',
      name: 'Explorer Badge',
      description: 'For the curious',
      cost: 300,
      icon: Target,
      benefit: 'Cosmetic badge on profile',
    },
    {
      id: 'shield-boost',
      name: 'Shield Boost',
      description: 'Extra hint on next quiz',
      cost: 400,
      icon: Shield,
      benefit: 'One extra quiz hint (single use)',
    },
    {
      id: 'crown',
      name: 'Gold Crown',
      description: 'Stand out in the community',
      cost: 750,
      icon: Crown,
      benefit: 'Golden profile border for 7 days',
    },
    {
      id: 'title-master',
      name: 'Master Title',
      description: 'Earn a title',
      cost: 1200,
      icon: Trophy,
      benefit: '“Investing Master” title on profile',
    },
  ];

  const handlePurchase = (item: typeof items[0]) => {
    if (purchased.has(item.id)) {
      toast({ title: 'Already purchased', description: 'You already own this item.' });
      return;
    }
    if (currentXP < item.cost) {
      toast({ title: 'Not enough XP', description: `You need ${item.cost} XP to buy this.` });
      return;
    }
    setPurchased(prev => new Set(prev).add(item.id));
    onPurchase(item.cost);
    toast({ title: 'Purchased!', description: `${item.name} is now yours.` });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-lg">XP Store</CardTitle>
          <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-600">
            <Zap className="w-3 h-3" />
            {currentXP} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const canAfford = currentXP >= item.cost;
          const alreadyOwned = purchased.has(item.id);
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: canAfford && !alreadyOwned ? 1.02 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                <div className={`p-2 rounded-lg ${alreadyOwned ? 'bg-muted' : canAfford ? 'bg-amber-500/10' : 'bg-muted'}`}>
                  <item.icon className={`w-5 h-5 ${alreadyOwned ? 'text-muted-foreground' : canAfford ? 'text-amber-500' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm ${alreadyOwned ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {item.name}
                    </span>
                    {alreadyOwned && <Check className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.benefit}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={alreadyOwned ? 'secondary' : canAfford ? 'default' : 'secondary'} className="text-xs gap-1">
                    <Zap className="w-3 h-3" />
                    {item.cost}
                  </Badge>
                  {!alreadyOwned && (
                    <Button
                      size="sm"
                      variant={canAfford ? 'default' : 'secondary'}
                      disabled={!canAfford}
                      onClick={() => handlePurchase(item)}
                      className="h-7 px-2 text-xs"
                    >
                      {canAfford ? 'Buy' : 'Need XP'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default XPStore;

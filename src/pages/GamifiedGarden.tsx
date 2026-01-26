import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Sprout, Coins, Clock, Package, Wrench, Zap, Lightbulb, ArrowRightLeft, Grid3X3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Garden2D from '@/components/Garden2D';

// Types
interface Plant {
  id: string;
  seedType: string;
  plantedAt: number;
  growthTimeMs: number;
  lastWateredAt: number;
  isWilted: boolean;
  variant: 'normal' | 'golden' | 'rainbow';
  sizeKg: number;
  sellPrice: number;
  icon?: string;
}

interface Plot {
  id: string;
  plant?: Plant;
}

interface Seed {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';
  baseGrowthTime: number; // minutes
  baseSizeKg: number;
  price: number;
  sellPrice: number;
  icon: string;
}

interface Gear {
  id: string;
  name: string;
  type: 'wateringCan' | 'sprinkler' | 'plotUpgrade';
  effect: string;
  price: number;
  quantity?: number;
}

const MIN_POTS = 3;
const MAX_POTS = 9;
const WILT_THRESHOLD = 10 * 60 * 1000; // 10 minutes without water
const WATER_REDUCTION = 0.5; // watering cuts remaining time by 50%
const XP_TO_MONEY_RATE = 2; // 1 XP = 2 coins

// Exponential plot upgrade pricing: starts cheap, grows moderately
// Prices: 50, 75, 115, 175, 260, 400 (for upgrades 4→5, 5→6, etc.)
function getPlotUpgradePrice(currentPots: number): number {
  const basePrice = 50;
  const exponent = 1.5; // Moderate exponential growth
  const upgradeIndex = currentPots - MIN_POTS; // 0, 1, 2, 3, 4, 5
  return Math.round(basePrice * Math.pow(exponent, upgradeIndex));
}

// 10 different seeds ordered by price (cheapest to most expensive)
const SEED_TEMPLATES: Omit<Seed, 'id'>[] = [
  { name: 'Radish', rarity: 'common', baseGrowthTime: 1, baseSizeKg: 0.2, price: 10, sellPrice: 18, icon: '🌱' },
  { name: 'Lettuce', rarity: 'common', baseGrowthTime: 2, baseSizeKg: 0.3, price: 20, sellPrice: 35, icon: '🥬' },
  { name: 'Carrot', rarity: 'common', baseGrowthTime: 3, baseSizeKg: 0.5, price: 35, sellPrice: 60, icon: '🥕' },
  { name: 'Tomato', rarity: 'uncommon', baseGrowthTime: 4, baseSizeKg: 0.8, price: 50, sellPrice: 90, icon: '🍅' },
  { name: 'Potato', rarity: 'uncommon', baseGrowthTime: 5, baseSizeKg: 1.0, price: 75, sellPrice: 140, icon: '🥔' },
  { name: 'Corn', rarity: 'rare', baseGrowthTime: 6, baseSizeKg: 1.5, price: 120, sellPrice: 220, icon: '🌽' },
  { name: 'Pumpkin', rarity: 'rare', baseGrowthTime: 8, baseSizeKg: 4.0, price: 200, sellPrice: 380, icon: '🎃' },
  { name: 'Strawberry', rarity: 'epic', baseGrowthTime: 10, baseSizeKg: 0.4, price: 350, sellPrice: 700, icon: '🍓' },
  { name: 'Golden Apple', rarity: 'epic', baseGrowthTime: 14, baseSizeKg: 0.5, price: 600, sellPrice: 1200, icon: '🍎' },
  { name: 'Dragon Fruit', rarity: 'mythic', baseGrowthTime: 18, baseSizeKg: 2.0, price: 1000, sellPrice: 2500, icon: '🐉' },
];

// Base gear templates - plot upgrade price is dynamic
const GEAR_TEMPLATES: Omit<Gear, 'id'>[] = [
  { name: 'Watering Can', type: 'wateringCan', effect: 'Reduces growth time by 50%', price: 150 },
  { name: 'Sprinkler', type: 'sprinkler', effect: 'Increases golden/rainbow chance', price: 400 },
];

// Utility
function generateId() { return Math.random().toString(36).slice(2); }
function formatTime(ms: number) {
  if (ms <= 0) return 'Ready!';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}
function calculateVariant(sprinklerActive: boolean): 'normal' | 'golden' | 'rainbow' {
  const baseGolden = 0.1;
  const baseRainbow = 0.02;
  const boost = sprinklerActive ? 1.5 : 1;
  const rand = Math.random();
  if (rand < baseRainbow * boost) return 'rainbow';
  if (rand < baseGolden * boost) return 'golden';
  return 'normal';
}
function calculateSize(base: number): number {
  const variance = 0.3;
  const factor = 1 + (Math.random() - 0.5) * variance * 2;
  return Math.round(base * factor * 10) / 10;
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    case 'uncommon': return 'text-green-600 bg-green-100 dark:bg-green-900';
    case 'rare': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
    case 'epic': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
    case 'mythic': return 'text-orange-500 bg-orange-100 dark:bg-orange-900';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export default function GamifiedGarden() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [money, setMoney] = useState(50);
  const [numPots, setNumPots] = useState(MIN_POTS);
  const [plots, setPlots] = useState<Plot[]>(() => Array.from({ length: MIN_POTS }, (_, i) => ({ id: `plot-${i}` })));
  const [inventory, setInventory] = useState({ seeds: [] as Seed[], gear: [] as Gear[] });
  const [shopSeeds, setShopSeeds] = useState<Seed[]>([]);
  const [shopGear, setShopGear] = useState<Gear[]>([]);
  const [hasSprinkler, setHasSprinkler] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  
  // Restock timers
  const [seedRestockTime, setSeedRestockTime] = useState(Date.now() + 60 * 60 * 1000);
  const [gearRestockTime, setGearRestockTime] = useState(Date.now() + 15 * 60 * 1000);
  const [now, setNow] = useState(Date.now());
  
  // XP exchange
  const [exchangeAmount, setExchangeAmount] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('garden-state-v4');
    if (saved) {
      const parsed = JSON.parse(saved);
      setXp(parsed.xp ?? 0);
      setMoney(parsed.money ?? 50);
      const savedNumPots = parsed.numPots ?? MIN_POTS;
      setNumPots(savedNumPots);
      setPlots(parsed.plots ?? Array.from({ length: savedNumPots }, (_, i) => ({ id: `plot-${i}` })));
      setInventory(parsed.inventory ?? { seeds: [], gear: [] });
      setHasSprinkler(parsed.hasSprinkler ?? false);
      setSeedRestockTime(parsed.seedRestockTime ?? Date.now() + 60 * 60 * 1000);
      setGearRestockTime(parsed.gearRestockTime ?? Date.now() + 15 * 60 * 1000);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const state = { xp, money, numPots, plots, inventory, hasSprinkler, seedRestockTime, gearRestockTime };
    localStorage.setItem('garden-state-v4', JSON.stringify(state));
  }, [xp, money, numPots, plots, inventory, hasSprinkler, seedRestockTime, gearRestockTime]);

  // Timer tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and manage shop restocks
  useEffect(() => {
    restockSeeds();
    restockGear();
  }, []);

  // Check for restock
  useEffect(() => {
    if (now >= seedRestockTime) {
      restockSeeds();
      setSeedRestockTime(Date.now() + 60 * 60 * 1000); // 1 hour
    }
    if (now >= gearRestockTime) {
      restockGear();
      setGearRestockTime(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
  }, [now, seedRestockTime, gearRestockTime]);

  function restockSeeds() {
    // Show all 10 seeds sorted by price
    const seeds = SEED_TEMPLATES.map(template => ({ ...template, id: generateId() }));
    setShopSeeds(seeds);
  }
  
  function restockGear() {
    const gear = GEAR_TEMPLATES.map(template => ({ ...template, id: generateId() }));
    // Add dynamic plot upgrade with current price
    gear.push({
      id: generateId(),
      name: 'Plot Upgrade',
      type: 'plotUpgrade',
      effect: `Adds one more pot (${numPots}/${MAX_POTS})`,
      price: getPlotUpgradePrice(numPots),
    });
    setShopGear(gear);
  }
  
  // Update gear shop when numPots changes to reflect new price
  useEffect(() => {
    restockGear();
  }, [numPots]);

  // Plant seed
  function plantSeed(plotId: string, seed: Seed) {
    setPlots(p => p.map(plot => {
      if (plot.id === plotId && !plot.plant) {
        const plant: Plant = {
          id: generateId(),
          seedType: seed.name,
          plantedAt: Date.now(),
          growthTimeMs: seed.baseGrowthTime * 60 * 1000,
          lastWateredAt: Date.now(),
          isWilted: false,
          variant: 'normal',
          sizeKg: calculateSize(seed.baseSizeKg),
          sellPrice: seed.sellPrice,
        };
        setInventory(inv => ({ ...inv, seeds: inv.seeds.filter(s => s.id !== seed.id) }));
        return { ...plot, plant };
      }
      return plot;
    }));
    setSelectedSeed(null);
  }

  // Water plant
  function waterPlant(plotId: string) {
    setPlots(p => p.map(plot => {
      if (plot.id === plotId && plot.plant) {
        const plant = plot.plant;
        const elapsed = Date.now() - plant.plantedAt;
        const remaining = Math.max(0, plant.growthTimeMs - elapsed);
        const newRemaining = remaining * WATER_REDUCTION;
        return {
          ...plot,
          plant: {
            ...plant,
            plantedAt: Date.now() - (plant.growthTimeMs - newRemaining),
            lastWateredAt: Date.now(),
            isWilted: false,
          },
        };
      }
      return plot;
    }));
  }

  // Harvest plant - now gives money instead of XP
  function harvestPlant(plotId: string) {
    const plot = plots.find(p => p.id === plotId);
    if (!plot?.plant) return;
    const plant = plot.plant;
    if (Date.now() - plant.plantedAt < plant.growthTimeMs) return;
    
    const finalVariant = plant.variant === 'normal' ? calculateVariant(hasSprinkler) : plant.variant;
    const multiplier = finalVariant === 'rainbow' ? 5 : finalVariant === 'golden' ? 2 : 1;
    const seedTemplate = SEED_TEMPLATES.find(s => s.name === plant.seedType);
    const basePrice = seedTemplate?.sellPrice || plant.sellPrice || 100;
    const sizeMultiplier = plant.sizeKg / (seedTemplate?.baseSizeKg || 1);
    const earnings = Math.round(basePrice * multiplier * sizeMultiplier);
    
    setMoney(m => m + earnings);
    
    const variantText = finalVariant !== 'normal' ? ` (${finalVariant}!)` : '';
    toast({ title: 'Harvested!', description: `+${earnings} coins${variantText}` });
    setPlots(p => p.map(pl => (pl.id === plotId ? { ...pl, plant: undefined } : pl)));
  }

  // Buy from shop - uses money
  function buySeed(seed: Seed) {
    if (money >= seed.price) {
      setMoney(m => m - seed.price);
      setInventory(inv => ({ ...inv, seeds: [...inv.seeds, seed] }));
      toast({ title: 'Purchased', description: `${seed.name} seed` });
    } else {
      toast({ title: 'Not enough coins', description: `Need ${seed.price} coins`, variant: 'destructive' });
    }
  }
  
  function buyGear(gear: Gear) {
    if (money >= gear.price) {
      setMoney(m => m - gear.price);
      
      if (gear.type === 'sprinkler') {
        setHasSprinkler(true);
      } else if (gear.type === 'plotUpgrade') {
        if (numPots < MAX_POTS) {
          const newNumPots = numPots + 1;
          setNumPots(newNumPots);
          setPlots(p => [...p, { id: `plot-${newNumPots - 1}` }]);
          toast({ title: 'Plot Upgraded!', description: `You now have ${newNumPots} pots` });
        } else {
          toast({ title: 'Max pots reached', description: 'You already have 9 pots', variant: 'destructive' });
          setMoney(m => m + gear.price); // Refund
          return;
        }
      }
      
      setInventory(inv => ({ ...inv, gear: [...inv.gear, gear] }));
      if (gear.type !== 'plotUpgrade') {
        toast({ title: 'Purchased', description: gear.name });
      }
    } else {
      toast({ title: 'Not enough coins', description: `Need ${gear.price} coins`, variant: 'destructive' });
    }
  }

  // XP to Money exchange
  function exchangeXpForMoney() {
    const amount = parseInt(exchangeAmount) || 0;
    if (amount <= 0) return;
    if (amount > xp) {
      toast({ title: 'Not enough XP', variant: 'destructive' });
      return;
    }
    const coinsReceived = amount * XP_TO_MONEY_RATE;
    setXp(x => x - amount);
    setMoney(m => m + coinsReceived);
    setExchangeAmount('');
    toast({ title: 'Exchanged!', description: `${amount} XP → ${coinsReceived} coins` });
  }

  // Auto-wilt check
  useEffect(() => {
    const interval = setInterval(() => {
      setPlots(p => p.map(plot => {
        if (!plot.plant) return plot;
        const plant = plot.plant;
        const timeSinceWater = Date.now() - plant.lastWateredAt;
        if (timeSinceWater > WILT_THRESHOLD && !plant.isWilted) {
          return { ...plot, plant: { ...plant, isWilted: true } };
        }
        return plot;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const seedRestockRemaining = Math.max(0, seedRestockTime - now);
  const gearRestockRemaining = Math.max(0, gearRestockTime - now);

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm p-4 border flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="w-6 h-6 text-green-600" /> Learning Garden
          </h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-sm text-foreground">{xp} XP</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-sm text-foreground">{money.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Grid3X3 className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-sm text-foreground">{numPots}/{MAX_POTS}</span>
            </div>
          </div>
        </div>

        {/* XP Exchange */}
        <div className="bg-card rounded-xl shadow-sm p-4 border">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-foreground">
            <ArrowRightLeft className="w-5 h-5" /> XP Exchange
            <span className="text-xs font-normal text-muted-foreground ml-2">(1 XP = {XP_TO_MONEY_RATE} coins)</span>
          </h3>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              type="number"
              placeholder="Amount of XP"
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(e.target.value)}
              className="w-32"
              min="1"
              max={xp}
            />
            <Button 
              onClick={exchangeXpForMoney} 
              disabled={!exchangeAmount || parseInt(exchangeAmount) <= 0 || parseInt(exchangeAmount) > xp}
              size="sm"
            >
              Exchange for {(parseInt(exchangeAmount) || 0) * XP_TO_MONEY_RATE} coins
            </Button>
            <span className="text-xs text-muted-foreground">Available: {xp} XP</span>
          </div>
        </div>

        {/* 2D Garden */}
        <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border">
          <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-500" />
            Garden ({numPots} Pots)
          </h2>
          <Garden2D 
            plots={plots}
            selectedSeed={selectedSeed}
            onPlotClick={(plotId, action) => {
              if (action === 'plant' && selectedSeed) {
                plantSeed(plotId, selectedSeed);
              } else if (action === 'water') {
                waterPlant(plotId);
              } else if (action === 'harvest') {
                harvestPlant(plotId);
              }
            }}
            formatTime={formatTime}
          />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Click pots to plant, water, or harvest
          </p>
        </div>

        {/* Seed Inventory */}
        <div className="bg-card rounded-xl shadow-sm p-4 border">
          <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground">
            <Package className="w-5 h-5" /> My Seeds ({inventory.seeds.length})
          </h3>
          {inventory.seeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No seeds. Buy some from the shop!</p>
          ) : (
            <ScrollArea className="h-20">
              <div className="flex gap-2 flex-wrap pr-4">
                {inventory.seeds.map(seed => (
                  <button
                    key={seed.id}
                    onClick={() => setSelectedSeed(seed)}
                    className={`px-3 py-1.5 rounded border text-xs flex items-center gap-1 transition-colors ${
                      selectedSeed?.id === seed.id 
                        ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-400' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <span>{seed.icon}</span>
                    <span>{seed.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          {selectedSeed && (
            <p className="mt-2 text-xs text-muted-foreground">
              Selected: {selectedSeed.icon} {selectedSeed.name} - Click an empty pot to plant
            </p>
          )}
        </div>

        {/* Shops */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Seed Shop */}
          <div className="bg-card rounded-xl shadow-sm p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2 text-foreground">
                <Package className="w-5 h-5" /> Seed Shop
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                <span>Restocks in {formatTime(seedRestockRemaining)}</span>
              </div>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {shopSeeds.map(seed => (
                  <div key={seed.id} className="flex items-center justify-between p-2 border rounded bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{seed.icon}</span>
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {seed.name}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold ${getRarityColor(seed.rarity)}`}>
                            {seed.rarity}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {seed.baseGrowthTime}m • {seed.baseSizeKg}kg • Sells: {seed.sellPrice}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => buySeed(seed)} 
                      disabled={money < seed.price} 
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      {seed.price}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Gear Shop */}
          <div className="bg-card rounded-xl shadow-sm p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2 text-foreground">
                <Wrench className="w-5 h-5" /> Gear Shop
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                <span>Restocks in {formatTime(gearRestockRemaining)}</span>
              </div>
            </div>
            <div className="space-y-2">
              {shopGear.map(gear => {
                const isOwned = gear.type === 'sprinkler' && hasSprinkler;
                const isMaxPlots = gear.type === 'plotUpgrade' && numPots >= MAX_POTS;
                const disabled = money < gear.price || isOwned || isMaxPlots;
                
                return (
                  <div key={gear.id} className="flex items-center justify-between p-2 border rounded bg-secondary/30">
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {gear.name}
                        {gear.type === 'plotUpgrade' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-600">
                            {numPots}/{MAX_POTS}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{gear.effect}</div>
                    </div>
                    <Button 
                      onClick={() => buyGear(gear)} 
                      disabled={disabled} 
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                    >
                      {isOwned ? 'Owned' : isMaxPlots ? 'Maxed' : (
                        <>
                          <Coins className="w-3 h-3 mr-1" />
                          {gear.price}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

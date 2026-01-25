import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Sprout, Coins, Clock, Package, Wrench, Trees, Star, Zap, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

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
}

interface Plot {
  id: string;
  plant?: Plant;
}

interface Seed {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'mythic';
  baseGrowthTime: number; // minutes
  baseSizeKg: number;
  price: number;
  sellPrice: number;
}

interface Gear {
  id: string;
  name: string;
  type: 'wateringCan' | 'sprinkler' | 'plotUpgrade';
  effect: string;
  price: number;
  quantity?: number;
}

const GRID_SIZE = 3;
const WILT_THRESHOLD = 10 * 60 * 1000; // 10 minutes without water
const WATER_REDUCTION = 0.5; // watering cuts remaining time by 50%

const SEED_TEMPLATES: Omit<Seed, 'id'>[] = [
  { name: 'Tomato', rarity: 'common', baseGrowthTime: 5, baseSizeKg: 1.2, price: 50, sellPrice: 75 },
  { name: 'Carrot', rarity: 'common', baseGrowthTime: 4, baseSizeKg: 0.8, price: 40, sellPrice: 60 },
  { name: 'Lettuce', rarity: 'common', baseGrowthTime: 3, baseSizeKg: 0.6, price: 30, sellPrice: 45 },
  { name: 'Potato', rarity: 'common', baseGrowthTime: 6, baseSizeKg: 1.5, price: 60, sellPrice: 90 },
  { name: 'Strawberry', rarity: 'common', baseGrowthTime: 4, baseSizeKg: 0.5, price: 45, sellPrice: 68 },
  { name: 'Corn', rarity: 'rare', baseGrowthTime: 8, baseSizeKg: 2.0, price: 120, sellPrice: 180 },
  { name: 'Pumpkin', rarity: 'rare', baseGrowthTime: 10, baseSizeKg: 3.5, price: 150, sellPrice: 225 },
  { name: 'Watermelon', rarity: 'rare', baseGrowthTime: 12, baseSizeKg: 5.0, price: 200, sellPrice: 300 },
  { name: 'Blueberry', rarity: 'rare', baseGrowthTime: 7, baseSizeKg: 0.8, price: 110, sellPrice: 165 },
  { name: 'Pineapple', rarity: 'mythic', baseGrowthTime: 15, baseSizeKg: 2.5, price: 350, sellPrice: 525 },
];

const GEAR_TEMPLATES: Omit<Gear, 'id'>[] = [
  { name: 'Watering Can', type: 'wateringCan', effect: 'Reduces growth time by 50%', price: 150 },
  { name: 'Sprinkler', type: 'sprinkler', effect: 'Increases golden/rainbow chance', price: 500 },
  { name: 'Plot Upgrade', type: 'plotUpgrade', effect: 'Expands garden grid', price: 750 },
];

// Utility
function generateId() { return Math.random().toString(36).slice(2); }
function formatTime(ms: number) {
  if (ms <= 0) return 'Ready!';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
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

export default function GamifiedGarden() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [gridSize, setGridSize] = useState(GRID_SIZE);
  const [plots, setPlots] = useState<Plot[]>(() => Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({ id: `plot-${i}` })));
  const [inventory, setInventory] = useState({ seeds: [] as Seed[], gear: [] as Gear[] });
  const [shopSeeds, setShopSeeds] = useState<Seed[]>([]);
  const [shopGear, setShopGear] = useState<Gear[]>([]);
  const [hasSprinkler, setHasSprinkler] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('garden-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      setXp(parsed.xp ?? 0);
      setGridSize(parsed.gridSize ?? GRID_SIZE);
      setPlots(parsed.plots ?? Array.from({ length: (parsed.gridSize ?? GRID_SIZE) * (parsed.gridSize ?? GRID_SIZE) }, (_, i) => ({ id: `plot-${i}` })));
      setInventory(parsed.inventory ?? { seeds: [], gear: [] });
      setHasSprinkler(parsed.hasSprinkler ?? false);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const state = { xp, gridSize, plots, inventory, hasSprinkler };
    localStorage.setItem('garden-state', JSON.stringify(state));
  }, [xp, gridSize, plots, inventory, hasSprinkler]);

  // Initialize shops
  useEffect(() => {
    restockShops();
    const seedInterval = setInterval(restockShops, 60 * 60 * 1000); // 1 hour
    const gearInterval = (() => {
      restockGear();
      return setInterval(restockGear, 15 * 60 * 1000); // 15 minutes
    })();
    return () => { clearInterval(seedInterval); clearInterval(gearInterval); };
  }, []);

  function restockShops() {
    // Show all 10 unique seeds, no repeats
    const seeds = SEED_TEMPLATES.map(template => ({ ...template, id: generateId() }));
    setShopSeeds(seeds);
  }
  function restockGear() {
    const gear = Array.from({ length: 3 }, () => {
      const template = GEAR_TEMPLATES[Math.floor(Math.random() * GEAR_TEMPLATES.length)];
      return { ...template, id: generateId() };
    });
    setShopGear(gear);
  }

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

  // Harvest plant
  function harvestPlant(plotId: string) {
    const plot = plots.find(p => p.id === plotId);
    if (!plot?.plant) return;
    const plant = plot.plant;
    if (Date.now() - plant.plantedAt < plant.growthTimeMs) return;
    const finalVariant = plant.variant === 'normal' ? calculateVariant(hasSprinkler) : plant.variant;
    const multiplier = finalVariant === 'rainbow' ? 5 : finalVariant === 'golden' ? 2 : 1;
    const seedTemplate = SEED_TEMPLATES.find(s => s.name === plant.seedType);
    const xpGain = Math.round((seedTemplate?.sellPrice || 100) * multiplier * (plant.sizeKg / (seedTemplate?.baseSizeKg || 1)));
    setXp(x => x + xpGain);
    toast({ title: 'Harvested!', description: `+${xpGain} XP` });
    setPlots(p => p.map(pl => (pl.id === plotId ? { ...pl, plant: undefined } : pl)));
  }

  // Buy from shop
  function buySeed(seed: Seed) {
    if (xp >= seed.price) {
      setXp(x => x - seed.price);
      setInventory(inv => ({ ...inv, seeds: [...inv.seeds, seed] }));
      toast({ title: 'Purchased', description: `${seed.name} seed` });
    } else {
      toast({ title: 'Not enough XP', description: `Need ${seed.price} XP` });
    }
  }
  function buyGear(gear: Gear) {
    if (xp >= gear.price) {
      setXp(x => x - gear.price);
      if (gear.type === 'sprinkler') setHasSprinkler(true);
      if (gear.type === 'plotUpgrade' && gridSize < 6) {
        const newSize = gridSize + 1;
        setGridSize(newSize);
        setPlots(Array.from({ length: newSize * newSize }, (_, i) => ({ id: `plot-${i}` })));
      }
      setInventory(inv => ({ ...inv, gear: [...inv.gear, gear] }));
      toast({ title: 'Purchased', description: gear.name });
    } else {
      toast({ title: 'Not enough XP', description: `Need ${gear.price} XP` });
    }
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

  const isDark = settings.darkMode;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm p-4 border flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Sprout className="w-7 h-7 text-green-600" /> Learning Garden</h1>
          <div className="flex gap-4">
            <div className="flex items-center gap-1"><Zap className="w-5 h-5 text-yellow-500" /><span className="font-semibold text-foreground">{xp} XP</span></div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2 border">
          <Lightbulb className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Study lessons to earn XP and buy seeds!</span>
        </div>

        {/* Garden Grid */}
        <div className="bg-card rounded-xl shadow-sm p-6 border">
          <h2 className="text-xl font-bold mb-4 text-foreground">Garden ({gridSize}x{gridSize})</h2>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {plots.map(plot => {
              const plant = plot.plant;
              const isReady = plant && Date.now() - plant.plantedAt >= plant.growthTimeMs;
              const timeLeft = plant ? Math.max(0, plant.growthTimeMs - (Date.now() - plant.plantedAt)) : 0;
              const color = plant ? (plant.variant === 'rainbow' ? 'bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400' : plant.variant === 'golden' ? 'bg-gradient-to-br from-yellow-300 to-amber-400' : 'bg-green-600') : 'bg-muted';
              return (
                <div
                  key={plot.id}
                  className={`aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition ${plant ? (isReady ? color : 'bg-green-600') : 'bg-muted'}`}
                  onClick={() => {
                    if (!plant && selectedSeed) plantSeed(plot.id, selectedSeed);
                    if (plant && !isReady) waterPlant(plot.id);
                    if (plant && isReady) harvestPlant(plot.id);
                  }}
                >
                  {plant ? (
                    <>
                      <Trees className={`w-6 h-6 ${isReady ? 'text-white' : 'text-green-100'}`} />
                      <span className="text-xs text-white mt-1 text-center">
                        {isReady ? 'Harvest!' : formatTime(timeLeft)}
                      </span>
                      {plant.isWilted && <span className="text-xs text-red-200">Wilted</span>}
                      <span className="text-xs text-white">{plant.sizeKg}kg</span>
                    </>
                  ) : (
                    <span className={isDark ? 'text-muted-foreground' : 'text-gray-600'}>Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Seed Inventory */}
        <div className="bg-card rounded-xl shadow-sm p-4 border">
          <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Package className="w-5 h-5" /> Seeds</h3>
          <div className="flex gap-2 flex-wrap">
            {inventory.seeds.map(seed => (
              <button
                key={seed.id}
                onClick={() => setSelectedSeed(seed)}
                className={`px-3 py-1 rounded border text-xs ${selectedSeed?.id === seed.id ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-400' : 'bg-secondary'}`}
              >
                {seed.name} ({seed.rarity})
              </button>
            ))}
          </div>
        </div>

        {/* Shops */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Seed Shop */}
          <div className="bg-card rounded-xl shadow-sm p-4 border">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Package className="w-5 h-5" /> Seed Shop (restocks hourly)</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {shopSeeds.map(seed => (
                <div key={seed.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{seed.name} ({seed.rarity})</div>
                    <div className="text-xs text-muted-foreground">Growth: {seed.baseGrowthTime}m | Size: {seed.baseSizeKg}kg</div>
                  </div>
                  <button onClick={() => buySeed(seed)} disabled={xp < seed.price} className="px-2 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50">{seed.price} XP</button>
                </div>
              ))}
            </div>
          </div>

          {/* Gear Shop */}
          <div className="bg-card rounded-xl shadow-sm p-4 border">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Wrench className="w-5 h-5" /> Gear Shop (restocks 15m)</h3>
            <div className="space-y-2">
              {shopGear.map(gear => (
                <div key={gear.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{gear.name}</div>
                    <div className="text-xs text-muted-foreground">{gear.effect}</div>
                  </div>
                  <button onClick={() => buyGear(gear)} disabled={xp < gear.price || (gear.type === 'sprinkler' && hasSprinkler)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50">{gear.price} XP</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

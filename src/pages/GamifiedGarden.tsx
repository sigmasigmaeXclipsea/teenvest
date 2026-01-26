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
  basePrice: number; // Store base price for tooltip display
  icon?: string;
}

interface Plot {
  id: string;
  plant?: Plant;
}

interface Seed {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'exotic';
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
  quantity?: number; // For consumable items like watering cans
  uses?: number; // Number of uses remaining for consumables
}

const MIN_POTS = 3;
const MAX_POTS = 20; // Increased from 9 to 20 for more progression
const WILT_THRESHOLD = 90 * 60 * 1000; // 90 minutes without water (increased from 60 min)
const WATER_REDUCTION_TIME = 20 * 60 * 1000; // Fixed 20 minutes reduction per watering
const XP_TO_MONEY_RATE = 2; // 1 XP = 2 coins (reduced from 5 to make progression harder)

// Exponential plot upgrade pricing: more expensive for longer progression
// Prices: 50, 75, 115, 175, 260, 400, 620, 960, 1480, 2280, 3520, 5440, 8400, 13000, 20000, 31000
function getPlotUpgradePrice(currentPots: number): number {
  const basePrice = 50;
  const exponent = 1.6; // Increased exponent for faster growth
  const upgradeIndex = currentPots - MIN_POTS; // 0, 1, 2, 3, 4, 5, etc.
  return Math.round(basePrice * Math.pow(exponent, upgradeIndex));
}

// 40 different seeds ordered by price (cheapest to most expensive) with slower progression and balanced sell prices
const SEED_TEMPLATES: Omit<Seed, 'id'>[] = [
  // Common (10 seeds) - Much slower growth and lower sell prices
  { name: 'Radish', rarity: 'common', baseGrowthTime: 30, baseSizeKg: 0.2, price: 10, sellPrice: 12, icon: '🌱' },
  { name: 'Lettuce', rarity: 'common', baseGrowthTime: 40, baseSizeKg: 0.3, price: 20, sellPrice: 25, icon: '🥬' },
  { name: 'Carrot', rarity: 'common', baseGrowthTime: 50, baseSizeKg: 0.5, price: 35, sellPrice: 40, icon: '🥕' },
  { name: 'Spinach', rarity: 'common', baseGrowthTime: 35, baseSizeKg: 0.3, price: 25, sellPrice: 30, icon: '🍃' },
  { name: 'Cabbage', rarity: 'common', baseGrowthTime: 60, baseSizeKg: 0.8, price: 40, sellPrice: 45, icon: '🥬' },
  { name: 'Peas', rarity: 'common', baseGrowthTime: 45, baseSizeKg: 0.4, price: 30, sellPrice: 35, icon: '🟢' },
  { name: 'Onion', rarity: 'common', baseGrowthTime: 55, baseSizeKg: 0.6, price: 38, sellPrice: 42, icon: '🧅' },
  { name: 'Garlic', rarity: 'common', baseGrowthTime: 70, baseSizeKg: 0.2, price: 45, sellPrice: 50, icon: '🧄' },
  { name: 'Potato', rarity: 'common', baseGrowthTime: 80, baseSizeKg: 1.0, price: 50, sellPrice: 55, icon: '🥔' },
  { name: 'Turnip', rarity: 'common', baseGrowthTime: 65, baseSizeKg: 0.7, price: 42, sellPrice: 48, icon: '⚪' },
  
  // Uncommon (8 seeds) - Slower growth and balanced sell prices
  { name: 'Tomato', rarity: 'uncommon', baseGrowthTime: 90, baseSizeKg: 0.8, price: 75, sellPrice: 85, icon: '🍅' },
  { name: 'Bell Pepper', rarity: 'uncommon', baseGrowthTime: 100, baseSizeKg: 0.6, price: 85, sellPrice: 95, icon: '🫑' },
  { name: 'Cucumber', rarity: 'uncommon', baseGrowthTime: 85, baseSizeKg: 0.9, price: 80, sellPrice: 90, icon: '🥒' },
  { name: 'Broccoli', rarity: 'uncommon', baseGrowthTime: 95, baseSizeKg: 0.7, price: 90, sellPrice: 100, icon: '🥦' },
  { name: 'Eggplant', rarity: 'uncommon', baseGrowthTime: 110, baseSizeKg: 0.8, price: 100, sellPrice: 110, icon: '🍆' },
  { name: 'Zucchini', rarity: 'uncommon', baseGrowthTime: 75, baseSizeKg: 1.2, price: 70, sellPrice: 80, icon: '🥒' },
  { name: 'Green Bean', rarity: 'uncommon', baseGrowthTime: 70, baseSizeKg: 0.5, price: 65, sellPrice: 75, icon: '🟩' },
  { name: 'Chili Pepper', rarity: 'uncommon', baseGrowthTime: 105, baseSizeKg: 0.3, price: 95, sellPrice: 105, icon: '🌶️' },
  
  // Rare (8 seeds) - Much slower growth with better sell prices
  { name: 'Corn', rarity: 'rare', baseGrowthTime: 120, baseSizeKg: 1.5, price: 150, sellPrice: 180, icon: '🌽' },
  { name: 'Pumpkin', rarity: 'rare', baseGrowthTime: 150, baseSizeKg: 4.0, price: 200, sellPrice: 240, icon: '🎃' },
  { name: 'Watermelon', rarity: 'rare', baseGrowthTime: 160, baseSizeKg: 8.0, price: 250, sellPrice: 300, icon: '🍉' },
  { name: 'Cauliflower', rarity: 'rare', baseGrowthTime: 130, baseSizeKg: 1.2, price: 175, sellPrice: 210, icon: '🥦' },
  { name: 'Asparagus', rarity: 'rare', baseGrowthTime: 140, baseSizeKg: 0.4, price: 190, sellPrice: 225, icon: '🥬' },
  { name: 'Brussels Sprouts', rarity: 'rare', baseGrowthTime: 135, baseSizeKg: 0.8, price: 185, sellPrice: 220, icon: '🥦' },
  { name: 'Artichoke', rarity: 'rare', baseGrowthTime: 145, baseSizeKg: 0.6, price: 195, sellPrice: 230, icon: '🌿' },
  { name: 'Mushroom', rarity: 'rare', baseGrowthTime: 90, baseSizeKg: 0.3, price: 160, sellPrice: 190, icon: '🍄' },
  
  // Epic (8 seeds) - Long growth times with good returns
  { name: 'Strawberry', rarity: 'epic', baseGrowthTime: 180, baseSizeKg: 0.4, price: 350, sellPrice: 420, icon: '🍓' },
  { name: 'Pineapple', rarity: 'epic', baseGrowthTime: 240, baseSizeKg: 2.0, price: 500, sellPrice: 600, icon: '🍍' },
  { name: 'Avocado', rarity: 'epic', baseGrowthTime: 200, baseSizeKg: 0.5, price: 450, sellPrice: 540, icon: '🥑' },
  { name: 'Mango', rarity: 'epic', baseGrowthTime: 220, baseSizeKg: 1.0, price: 475, sellPrice: 570, icon: '🥭' },
  { name: 'Papaya', rarity: 'epic', baseGrowthTime: 190, baseSizeKg: 1.5, price: 425, sellPrice: 510, icon: '🍈' },
  { name: 'Coconut', rarity: 'epic', baseGrowthTime: 260, baseSizeKg: 2.5, price: 550, sellPrice: 660, icon: '🥥' },
  { name: 'Durian', rarity: 'epic', baseGrowthTime: 280, baseSizeKg: 3.0, price: 650, sellPrice: 780, icon: '🦥' },
  { name: 'Jackfruit', rarity: 'epic', baseGrowthTime: 320, baseSizeKg: 4.0, price: 750, sellPrice: 900, icon: '🟡' },
  
  // Mythic (1 seed) - High tier but not the best
  { name: 'Dragon Fruit', rarity: 'mythic', baseGrowthTime: 360, baseSizeKg: 3.0, price: 2000, sellPrice: 2400, icon: '🐉' },
  
  // Legendary (3 seeds) - Above Dragon Fruit
  { name: 'Phoenix Feather', rarity: 'legendary', baseGrowthTime: 400, baseSizeKg: 2.0, price: 3000, sellPrice: 3600, icon: '🔥' },
  { name: 'Unicorn Tear', rarity: 'legendary', baseGrowthTime: 440, baseSizeKg: 1.5, price: 4000, sellPrice: 4800, icon: '🦄' },
  { name: 'Thunder Crystal', rarity: 'legendary', baseGrowthTime: 480, baseSizeKg: 4.0, price: 5000, sellPrice: 6000, icon: '⚡' },
  
  // Exotic (2 seeds) - The absolute best!
  { name: 'Cosmic Melon', rarity: 'exotic', baseGrowthTime: 600, baseSizeKg: 10.0, price: 10000, sellPrice: 12000, icon: '🌌' },
  { name: 'Infinity Star', rarity: 'exotic', baseGrowthTime: 720, baseSizeKg: 5.0, price: 20000, sellPrice: 24000, icon: '⭐' },
];

// Base gear templates - plot upgrade price is dynamic
const GEAR_TEMPLATES: Omit<Gear, 'id'>[] = [
  { name: 'Watering Can', type: 'wateringCan', effect: '10 uses - Reduces growth time by 20 minutes', price: 150 },
  { name: 'Basic Sprinkler', type: 'sprinkler', effect: 'Increases golden chance by 10%', price: 400 },
  { name: 'Advanced Sprinkler', type: 'sprinkler', effect: 'Increases golden chance by 20%', price: 800 },
  { name: 'Deluxe Sprinkler', type: 'sprinkler', effect: 'Increases golden chance by 30%', price: 1500 },
  { name: 'Magic Sprinkler', type: 'sprinkler', effect: 'Increases golden chance by 50%', price: 3000 },
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
function calculateVariant(sprinklerType: string | null): 'normal' | 'golden' | 'rainbow' {
  const baseGolden = 0.1;
  const baseRainbow = 0.02;
  
  let boost = 1;
  switch (sprinklerType) {
    case 'Basic Sprinkler':
      boost = 1.1; // 10% increase
      break;
    case 'Advanced Sprinkler':
      boost = 1.2; // 20% increase
      break;
    case 'Deluxe Sprinkler':
      boost = 1.3; // 30% increase
      break;
    case 'Magic Sprinkler':
      boost = 1.5; // 50% increase
      break;
    default:
      boost = 1; // No sprinkler
  }
  
  const rand = Math.random();
  if (rand < baseRainbow * boost) return 'rainbow';
  if (rand < baseGolden * boost) return 'golden';
  return 'normal';
}
function calculateSize(base: number): number {
  // Much more dramatic RNG based on luck
  // 50% chance of small (0.3x - 0.8x)
  // 35% chance of normal (0.8x - 1.2x) 
  // 13% chance of large (1.2x - 2.0x)
  // 2% chance of giant (2.0x - 3.5x) - JACKPOT!
  
  const rand = Math.random();
  let factor: number;
  
  if (rand < 0.02) {
    // 2% jackpot - GIANT!
    factor = 2.0 + Math.random() * 1.5; // 2.0x to 3.5x
  } else if (rand < 0.15) {
    // 13% large harvest
    factor = 1.2 + Math.random() * 0.8; // 1.2x to 2.0x
  } else if (rand < 0.5) {
    // 35% normal harvest
    factor = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
  } else {
    // 50% small harvest
    factor = 0.3 + Math.random() * 0.5; // 0.3x to 0.8x
  }
  
  return Math.round(base * factor * 10) / 10;
}

function calculateSellPrice(basePrice: number, actualSize: number, baseSize: number): number {
  // Calculate sell price based on actual size compared to base size
  // RNG size should only increase value, never decrease below base price
  const sizeRatio = Math.max(1, actualSize / baseSize); // Minimum 1x multiplier
  const dynamicPrice = Math.round(basePrice * sizeRatio);
  
  return dynamicPrice; // Always at least base price
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    case 'uncommon': return 'text-green-600 bg-green-100 dark:bg-green-900';
    case 'rare': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
    case 'epic': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
    case 'mythic': return 'text-red-600 bg-red-100 dark:bg-red-900 border-2 border-red-400 shadow-lg shadow-red-500/50';
    case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse';
    case 'exotic': return 'text-cyan-600 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 animate-pulse';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export default function GamifiedGarden() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [money, setMoney] = useState(0); // Start with 0 coins to make progression harder
  const [numPots, setNumPots] = useState(MIN_POTS);
  const [plots, setPlots] = useState<Plot[]>(() => Array.from({ length: MIN_POTS }, (_, i) => ({ id: `plot-${i}` })));
  const [inventory, setInventory] = useState({ seeds: [] as Seed[], gear: [] as Gear[] });
  const [shopSeeds, setShopSeeds] = useState<Seed[]>([]);
  const [shopGear, setShopGear] = useState<Gear[]>([]);
  const [hasSprinkler, setHasSprinkler] = useState<string | null>(null); // null = none, or name of sprinkler
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [selectedItem, setSelectedItem] = useState<Gear | null>(null); // For consumable items
  const [selectedPlant, setSelectedPlant] = useState<Plot | null>(null); // For plant info display
  const [isWateringMode, setIsWateringMode] = useState(false); // When watering can is selected
  
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
      try {
        const parsed = JSON.parse(saved);
        setXp(parsed.xp ?? 0);
        setMoney(parsed.money ?? 0); // Default to 0 coins
        const savedNumPots = parsed.numPots ?? MIN_POTS;
        setNumPots(savedNumPots);
        setPlots(parsed.plots ?? Array.from({ length: savedNumPots }, (_, i) => ({ id: `plot-${i}` })));
        setInventory(parsed.inventory ?? { seeds: [], gear: [] });
        setHasSprinkler(parsed.hasSprinkler ?? null);
        setSeedRestockTime(parsed.seedRestockTime ?? Date.now() + 60 * 60 * 1000);
        setGearRestockTime(parsed.gearRestockTime ?? Date.now() + 15 * 60 * 1000);
        setSelectedSeed(parsed.selectedSeed ?? null);
        setSelectedItem(parsed.selectedItem ?? null);
      } catch (e) {
        console.error('Failed to load garden state:', e);
      }
    }
  }, []);

  // Listen for admin garden updates
  useEffect(() => {
    const handleAdminUpdate = (event: CustomEvent) => {
      const { money, xp } = event.detail;
      setMoney(money);
      setXp(xp);
      toast.success('Admin updated your garden state!');
    };

    window.addEventListener('adminGardenUpdate', handleAdminUpdate as EventListener);
    return () => window.removeEventListener('adminGardenUpdate', handleAdminUpdate as EventListener);
  }, []);

  // Save to localStorage
  useEffect(() => {
    const state = { xp, money, numPots, plots, inventory, hasSprinkler, seedRestockTime, gearRestockTime, selectedSeed, selectedItem };
    localStorage.setItem('garden-state-v4', JSON.stringify(state));
  }, [xp, money, numPots, plots, inventory, hasSprinkler, seedRestockTime, gearRestockTime, selectedSeed, selectedItem]);

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
    restockGear(); // Force refresh on mount to get updated templates
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
    // Show all 40 seeds sorted by price
    const seeds = SEED_TEMPLATES.map(template => ({ ...template, id: generateId() }));
    setShopSeeds(seeds);
  }
  
  function restockGear() {
    const gear = GEAR_TEMPLATES.map(template => ({ ...template, id: generateId() }));
    console.log('Restocking gear with templates:', GEAR_TEMPLATES); // Debug log
    // Add dynamic plot upgrade with current price
    gear.push({
      id: generateId(),
      name: 'Plot Upgrade',
      type: 'plotUpgrade',
      effect: `Adds one more pot (${numPots}/${MAX_POTS})`,
      price: getPlotUpgradePrice(numPots),
    });
    console.log('Setting shop gear:', gear); // Debug log
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
        const actualSize = calculateSize(seed.baseSizeKg);
        const plant: Plant = {
          id: generateId(),
          seedType: seed.name,
          plantedAt: Date.now(),
          growthTimeMs: seed.baseGrowthTime * 60 * 1000,
          lastWateredAt: Date.now(),
          isWilted: false,
          variant: 'normal',
          sizeKg: actualSize,
          sellPrice: calculateSellPrice(seed.sellPrice, actualSize, seed.baseSizeKg),
          basePrice: seed.sellPrice, // Store base price for tooltip
          icon: seed.icon,
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
        const newRemaining = Math.max(0, remaining - WATER_REDUCTION_TIME); // Fixed 20 minutes reduction
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
    
    // Check for jackpot giant harvest
    const expectedSize = seedTemplate?.baseSizeKg || 1;
    const sizeRatio = plant.sizeKg / expectedSize;
    
    let variantText = finalVariant !== 'normal' ? ` (${finalVariant}!)` : '';
    let title = 'Harvested!';
    let description = `+${earnings} coins${variantText}`;
    
    if (sizeRatio >= 2.0) {
      // JACKPOT! Giant harvest
      title = '🎉 JACKPOT! GIANT HARVEST! 🎉';
      description = `+${earnings} coins${variantText} - ${plant.sizeKg}kg (${Math.round(sizeRatio * 100)}% size!)`;
      toast({ title, description, duration: 5000 });
    } else if (sizeRatio >= 1.5) {
      // Large harvest
      title = '🌟 Large Harvest!';
      description = `+${earnings} coins${variantText} - ${plant.sizeKg}kg`;
      toast({ title, description });
    } else {
      toast({ title, description });
    }
    
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
        setHasSprinkler(gear.name);
      } else if (gear.type === 'plotUpgrade') {
        if (numPots < MAX_POTS) {
          const newNumPots = numPots + 1;
          setNumPots(newNumPots);
          setPlots(p => [...p, { id: `plot-${newNumPots - 1}` }]);
          toast({ title: 'Plot Upgraded!', description: `You now have ${newNumPots} pots` });
        } else {
          toast({ title: 'Max pots reached', description: `You already have ${MAX_POTS} pots`, variant: 'destructive' });
          setMoney(m => m + gear.price); // Refund
          return;
        }
      } else if (gear.type === 'wateringCan') {
        // Add consumable watering can with uses
        const wateringCanWithUses = { ...gear, uses: 10 }; // 10 uses per watering can
        setInventory(inv => ({ ...inv, gear: [...inv.gear, wateringCanWithUses] }));
        toast({ title: 'Purchased', description: `${gear.name} (10 uses)` });
        return;
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
              const plot = plots.find(p => p.id === plotId);
              
              if (action === 'plant' && selectedSeed) {
                plantSeed(plotId, selectedSeed);
              } else if (action === 'water') {
                if (isWateringMode && selectedItem?.type === 'wateringCan' && selectedItem.uses && selectedItem.uses > 0) {
                  // Actually water the plant when in watering mode
                  waterPlant(plotId);
                  // Use one watering can
                  setInventory(inv => ({
                    ...inv,
                    gear: inv.gear.map(g => 
                      g.id === selectedItem.id 
                        ? { ...g, uses: (g.uses || 1) - 1 }
                        : g
                    ).filter(g => g.uses === undefined || g.uses > 0)
                  }));
                  setSelectedItem(null);
                  setIsWateringMode(false);
                } else {
                  // Show plant info if not in watering mode
                  if (plot?.plant) {
                    setSelectedPlant(plot);
                  }
                }
              } else if (action === 'harvest') {
                harvestPlant(plotId);
              } else if (!plot?.plant) {
                // Click on empty plot - show plant info if available
                setSelectedPlant(null);
              }
            }}
            formatTime={formatTime}
          />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {isWateringMode ? '🚿 Click a plant to water it' : 'Hover over plants to see info • Click pots to plant/harvest'}
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

        {/* Items Inventory */}
        <div className="bg-card rounded-xl shadow-sm p-4 border">
          <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground">
            <Wrench className="w-5 h-5" /> My Items ({inventory.gear.filter(g => g.type === 'wateringCan').length})
          </h3>
          {inventory.gear.filter(g => g.type === 'wateringCan').length === 0 ? (
            <p className="text-sm text-muted-foreground">No items. Buy some from the shop!</p>
          ) : (
            <ScrollArea className="h-20">
              <div className="flex gap-2 flex-wrap pr-4">
                {inventory.gear.filter(g => g.type === 'wateringCan').map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isWateringMode && selectedItem?.id === item.id) {
                        // Deselect if already selected
                        setSelectedItem(null);
                        setIsWateringMode(false);
                      } else {
                        // Select item for use
                        setSelectedItem(item);
                        setIsWateringMode(true);
                        setSelectedSeed(null); // Deselect seed when selecting item
                      }
                    }}
                    className={`px-3 py-1.5 rounded border text-xs flex items-center gap-1 transition-colors ${
                      selectedItem?.id === item.id && isWateringMode
                        ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <Droplets className="w-3 h-3" />
                    <span>{item.name}</span>
                    {item.uses && (
                      <span className="text-xs text-muted-foreground">({item.uses})</span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          {isWateringMode && selectedItem && (
            <p className="mt-2 text-xs text-blue-600">
              🚿 Watering can selected - Click a plant to water it
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
            <ScrollArea className="h-96">
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
                const isOwned = gear.type === 'sprinkler' && hasSprinkler === gear.name;
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

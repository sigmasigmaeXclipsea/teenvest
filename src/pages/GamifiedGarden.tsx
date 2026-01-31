import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Sprout, Coins, Clock, Package, Wrench, Zap, Lightbulb, ArrowRightLeft, Grid3X3, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useXP } from '@/contexts/XPContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FreeFormGarden from '@/components/FreeFormGarden';

// Types
interface Plant {
  id: string;
  seedType: string;
  plantedAt: number;
  growthTimeMs: number;
  lastWateredAt: number;
  isWilted: boolean;
  variant: 'normal' | 'golden' | 'rainbow' | 'frost' | 'candy' | 'thunder' | 'lunar';
  sizeKg: number;
  sellPrice: number;
  basePrice: number; // Store base price for tooltip display
  icon?: string;
  x: number; // Position in garden
  y: number; // Position in garden
}

interface Garden {
  plants: Plant[];
  width: number;
  height: number;
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
  stockRate: number; // 0-1 probability of being in stock
  inStock: boolean; // Whether currently in stock
  stockQuantity: number; // How many available this restock
}

interface Gear {
  id: string;
  name: string;
  type: 'wateringCan' | 'sprinkler';
  effect: string;
  price: number;
  quantity?: number; // For consumable items like watering cans
  uses?: number; // Number of uses remaining for consumables
}

interface HarvestedPlant {
  id: string;
  seedType: string;
  variant: 'normal' | 'golden' | 'rainbow' | 'frost' | 'candy' | 'thunder' | 'lunar';
  sizeKg: number;
  sellPrice: number;
  icon: string;
  harvestedAt: number;
}

type Weather = 'normal' | 'rainy' | 'frozen' | 'candy' | 'thunder' | 'lunar';

const MIN_POTS = 3;
const WILT_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours without water (much slower death)
const WATER_REDUCTION_TIME = 20 * 60 * 1000; // Fixed 20 minutes reduction per watering
const QUIZ_POINTS_TO_MONEY_RATE = 2; // 1 Quiz Point = 2 coins

// 40 different seeds ordered by price (cheapest to most expensive) with scaled stock rates
const SEED_TEMPLATES: Omit<Seed, 'id' | 'inStock' | 'stockQuantity'>[] = [
  // Common (10 seeds) - High availability
  { name: 'Radish', rarity: 'common', baseGrowthTime: 30, baseSizeKg: 0.2, price: 10, sellPrice: 12, icon: '🌱', stockRate: 0.6 },
  { name: 'Lettuce', rarity: 'common', baseGrowthTime: 40, baseSizeKg: 0.3, price: 20, sellPrice: 25, icon: '🥬', stockRate: 0.55 },
  { name: 'Carrot', rarity: 'common', baseGrowthTime: 50, baseSizeKg: 0.5, price: 35, sellPrice: 40, icon: '🥕', stockRate: 0.6 },
  { name: 'Spinach', rarity: 'common', baseGrowthTime: 35, baseSizeKg: 0.3, price: 25, sellPrice: 30, icon: '🍃', stockRate: 0.5 },
  { name: 'Cabbage', rarity: 'common', baseGrowthTime: 60, baseSizeKg: 0.8, price: 40, sellPrice: 45, icon: '🥬', stockRate: 0.55 },
  { name: 'Peas', rarity: 'common', baseGrowthTime: 45, baseSizeKg: 0.4, price: 30, sellPrice: 35, icon: '🟢', stockRate: 0.6 },
  { name: 'Onion', rarity: 'common', baseGrowthTime: 55, baseSizeKg: 0.6, price: 38, sellPrice: 42, icon: '🧅', stockRate: 0.55 },
  { name: 'Garlic', rarity: 'common', baseGrowthTime: 70, baseSizeKg: 0.2, price: 45, sellPrice: 50, icon: '🧄', stockRate: 0.5 },
  { name: 'Potato', rarity: 'common', baseGrowthTime: 80, baseSizeKg: 1.0, price: 50, sellPrice: 55, icon: '🥔', stockRate: 0.6 },
  { name: 'Turnip', rarity: 'common', baseGrowthTime: 65, baseSizeKg: 0.7, price: 42, sellPrice: 48, icon: '⚪', stockRate: 0.55 },
  
  // Uncommon (8 seeds) - Moderate availability
  { name: 'Tomato', rarity: 'uncommon', baseGrowthTime: 90, baseSizeKg: 0.8, price: 75, sellPrice: 85, icon: '🍅', stockRate: 0.35 },
  { name: 'Bell Pepper', rarity: 'uncommon', baseGrowthTime: 100, baseSizeKg: 0.6, price: 85, sellPrice: 95, icon: '🫑', stockRate: 0.4 },
  { name: 'Cucumber', rarity: 'uncommon', baseGrowthTime: 85, baseSizeKg: 0.9, price: 80, sellPrice: 90, icon: '🥒', stockRate: 0.35 },
  { name: 'Broccoli', rarity: 'uncommon', baseGrowthTime: 95, baseSizeKg: 0.7, price: 90, sellPrice: 100, icon: '🥦', stockRate: 0.3 },
  { name: 'Eggplant', rarity: 'uncommon', baseGrowthTime: 110, baseSizeKg: 0.8, price: 100, sellPrice: 110, icon: '🍆', stockRate: 0.35 },
  { name: 'Zucchini', rarity: 'uncommon', baseGrowthTime: 75, baseSizeKg: 1.2, price: 70, sellPrice: 80, icon: '🥒', stockRate: 0.4 },
  { name: 'Green Bean', rarity: 'uncommon', baseGrowthTime: 70, baseSizeKg: 0.5, price: 65, sellPrice: 75, icon: '🟩', stockRate: 0.35 },
  { name: 'Chili Pepper', rarity: 'uncommon', baseGrowthTime: 105, baseSizeKg: 0.3, price: 95, sellPrice: 105, icon: '🌶️', stockRate: 0.3 },
  
  // Rare (8 seeds) - Lower availability
  { name: 'Corn', rarity: 'rare', baseGrowthTime: 120, baseSizeKg: 1.5, price: 150, sellPrice: 180, icon: '🌽', stockRate: 0.15 },
  { name: 'Pumpkin', rarity: 'rare', baseGrowthTime: 150, baseSizeKg: 4.0, price: 200, sellPrice: 240, icon: '🎃', stockRate: 0.15 },
  { name: 'Watermelon', rarity: 'rare', baseGrowthTime: 160, baseSizeKg: 8.0, price: 250, sellPrice: 300, icon: '🍉', stockRate: 0.15 },
  { name: 'Cauliflower', rarity: 'rare', baseGrowthTime: 130, baseSizeKg: 1.2, price: 175, sellPrice: 210, icon: '🥦', stockRate: 0.15 },
  { name: 'Asparagus', rarity: 'rare', baseGrowthTime: 140, baseSizeKg: 0.4, price: 190, sellPrice: 225, icon: '🥬', stockRate: 0.15 },
  { name: 'Brussels Sprouts', rarity: 'rare', baseGrowthTime: 135, baseSizeKg: 0.8, price: 185, sellPrice: 220, icon: '🥦', stockRate: 0.15 },
  { name: 'Artichoke', rarity: 'rare', baseGrowthTime: 145, baseSizeKg: 0.6, price: 195, sellPrice: 230, icon: '🌿', stockRate: 0.15 },
  { name: 'Mushroom', rarity: 'rare', baseGrowthTime: 90, baseSizeKg: 0.3, price: 160, sellPrice: 190, icon: '🍄', stockRate: 0.15 },
  
  // Epic (8 seeds) - Rare availability
  { name: 'Strawberry', rarity: 'epic', baseGrowthTime: 180, baseSizeKg: 0.4, price: 350, sellPrice: 420, icon: '🍓', stockRate: 0.08 },
  { name: 'Pineapple', rarity: 'epic', baseGrowthTime: 240, baseSizeKg: 2.0, price: 500, sellPrice: 600, icon: '🍍', stockRate: 0.08 },
  { name: 'Avocado', rarity: 'epic', baseGrowthTime: 200, baseSizeKg: 0.5, price: 450, sellPrice: 540, icon: '🥑', stockRate: 0.08 },
  { name: 'Mango', rarity: 'epic', baseGrowthTime: 220, baseSizeKg: 1.0, price: 475, sellPrice: 570, icon: '🥭', stockRate: 0.08 },
  { name: 'Papaya', rarity: 'epic', baseGrowthTime: 190, baseSizeKg: 1.5, price: 425, sellPrice: 510, icon: '🍈', stockRate: 0.08 },
  { name: 'Coconut', rarity: 'epic', baseGrowthTime: 260, baseSizeKg: 2.5, price: 550, sellPrice: 660, icon: '🥥', stockRate: 0.08 },
  { name: 'Durian', rarity: 'epic', baseGrowthTime: 280, baseSizeKg: 3.0, price: 650, sellPrice: 780, icon: '🦥', stockRate: 0.08 },
  { name: 'Jackfruit', rarity: 'epic', baseGrowthTime: 320, baseSizeKg: 4.0, price: 750, sellPrice: 900, icon: '🟡', stockRate: 0.08 },
  
  // Mythic (1 seed) - Very rare
  { name: 'Dragon Fruit', rarity: 'mythic', baseGrowthTime: 360, baseSizeKg: 3.0, price: 2000, sellPrice: 2400, icon: '🐉', stockRate: 0.03 },
  
  // Legendary (3 seeds) - Extremely rare
  { name: 'Phoenix Feather', rarity: 'legendary', baseGrowthTime: 400, baseSizeKg: 2.0, price: 3000, sellPrice: 3600, icon: '🔥', stockRate: 0.015 },
  { name: 'Unicorn Tear', rarity: 'legendary', baseGrowthTime: 440, baseSizeKg: 1.5, price: 4000, sellPrice: 4800, icon: '🦄', stockRate: 0.015 },
  { name: 'Thunder Crystal', rarity: 'legendary', baseGrowthTime: 480, baseSizeKg: 4.0, price: 5000, sellPrice: 6000, icon: '⚡', stockRate: 0.015 },
  
  // Exotic (2 seeds) - The absolute best! 1% stock rate
  { name: 'Cosmic Melon', rarity: 'exotic', baseGrowthTime: 600, baseSizeKg: 10.0, price: 10000, sellPrice: 12000, icon: '🌌', stockRate: 0.01 },
  { name: 'Infinity Star', rarity: 'exotic', baseGrowthTime: 720, baseSizeKg: 5.0, price: 20000, sellPrice: 24000, icon: '⭐', stockRate: 0.01 },
];

// Base gear templates - plot upgrade price is dynamic
const GEAR_TEMPLATES: Omit<Gear, 'id'>[] = [
  { name: 'Watering Can', type: 'wateringCan', effect: '10 uses - Reduces growth time by 20 minutes', price: 150 },
  { name: 'Basic Sprinkler', type: 'sprinkler', effect: 'Waters plants in 100px radius - 10% golden chance boost', price: 400 },
  { name: 'Advanced Sprinkler', type: 'sprinkler', effect: 'Waters plants in 100px radius - 20% golden chance boost', price: 800 },
  { name: 'Deluxe Sprinkler', type: 'sprinkler', effect: 'Waters plants in 100px radius - 30% golden chance boost', price: 1500 },
  { name: 'Magic Sprinkler', type: 'sprinkler', effect: 'Waters plants in 100px radius - 50% golden chance boost', price: 3000 },
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
  const baseGolden = 0.02; // Reduced from 0.1 to 0.02 (2% base chance)
  const baseRainbow = 0.005; // Reduced from 0.02 to 0.005 (0.5% base chance)
  
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

function getWeatherMultiplier(weather: Weather): number {
  switch (weather) {
    case 'frozen': return 2; // 2x price multiplier
    case 'candy': return 3; // 3x price multiplier  
    case 'thunder': return 5; // 5x price multiplier
    case 'rainy': return 1.5; // 1.5x price multiplier
    case 'lunar': return 4; // 4x price multiplier
    default: return 1;
  }
}

function getWeatherMutationChance(weather: Weather): number {
  switch (weather) {
    case 'rainy': return 0.5; // 50% chance for frost mutation when rainy
    case 'frozen': return 0.5; // 50% chance for frost mutation when frozen
    case 'candy': return 0.25; // 25% chance for candy mutation when candy weather
    case 'thunder': return 0.15; // 15% chance for thunder mutation when thunder weather
    case 'lunar': return 0.1; // 10% chance for lunar mutation when lunar weather
    default: return 0;
  }
}

function getWeatherIcon(weather: Weather): string {
  switch (weather) {
    case 'frozen': return '❄️';
    case 'candy': return '🍬';
    case 'thunder': return '⚡';
    case 'rainy': return '🌧️';
    case 'lunar': return '🌙';
    default: return '☀️';
  }
}

function getWeatherName(weather: Weather): string {
  switch (weather) {
    case 'frozen': return 'Frozen';
    case 'candy': return 'Candy';
    case 'thunder': return 'Thunder';
    case 'rainy': return 'Rainy';
    case 'lunar': return 'Lunar';
    default: return 'Normal';
  }
}

function getVariantColor(variant: string) {
  switch (variant) {
    case 'frost': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900 border-2 border-cyan-400';
    case 'candy': return 'text-pink-600 bg-pink-100 dark:bg-pink-900 border-2 border-pink-400';
    case 'thunder': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 shadow-lg shadow-yellow-500/50';
    case 'golden': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 shadow-lg shadow-yellow-500/50';
    case 'rainbow': return 'text-cyan-600 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 animate-pulse';
    case 'lunar': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 border-2 border-purple-400 shadow-lg shadow-purple-500/50 animate-pulse';
    default: return '';
  }
}

export default function GamifiedGarden() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { xp, quizPoints, addXP, setXP, spendQuizPoints, loading: xpLoading } = useXP();
  const [money, setMoney] = useState(0); // Start with 0 coins to make progression harder
  const [garden, setGarden] = useState<Garden>({ plants: [], width: 800, height: 600 });
  const [inventory, setInventory] = useState({ seeds: [] as Seed[], gear: [] as Gear[] });
  const [harvestedPlants, setHarvestedPlants] = useState<HarvestedPlant[]>([]); // New harvested plants inventory
  const [shopSeeds, setShopSeeds] = useState<Seed[]>([]);
  const [shopGear, setShopGear] = useState<Gear[]>([]);
  const [hasSprinkler, setHasSprinkler] = useState<string | null>(null); // null = none, or name of sprinkler
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [selectedItem, setSelectedItem] = useState<Gear | null>(null); // For consumable items
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null); // For plant info display
  const [isWateringMode, setIsWateringMode] = useState(false); // When watering can is selected
  const [isSprinklerMode, setIsSprinklerMode] = useState(false); // When placing sprinkler
  const [sprinklerPositions, setSprinklerPositions] = useState<{x: number, y: number, gear: Gear, placedAt: number, timeLimit: number}[]>([]); // Track placed sprinklers with time limits
  const [achievements, setAchievements] = useState<string[]>([]); // Achievement tracking
  const [currentWeather, setCurrentWeather] = useState<Weather>('normal');
  
  // Restock timers
  const [seedRestockTime, setSeedRestockTime] = useState(Date.now() + 60 * 60 * 1000);
  const [gearRestockTime, setGearRestockTime] = useState(Date.now() + 15 * 60 * 1000);
  const [now, setNow] = useState(Date.now());
  
  // Quiz Points exchange
  const [exchangeAmount, setExchangeAmount] = useState('');

  // Load from localStorage and migrate old XP to database
  useEffect(() => {
    // Try v5 first (new garden system)
    let saved = localStorage.getItem('garden-state-v5');
    let version = 'v5';
    
    // If v5 doesn't exist, try v4 (old plot system) and migrate
    if (!saved) {
      saved = localStorage.getItem('garden-state-v4');
      version = 'v4';
    }
    
    // Check for XP in older localStorage versions and migrate to database
    const migrateOldXP = async () => {
      // Check v4, v3, v2, v1 for old XP data
      const oldVersions = ['garden-state-v4', 'garden-state-v3', 'garden-state-v2', 'garden-state'];
      for (const key of oldVersions) {
        const oldData = localStorage.getItem(key);
        if (oldData) {
          try {
            const parsed = JSON.parse(oldData);
            if (parsed.xp && parsed.xp > 0 && !xpLoading && xp === 0) {
              await setXP(parsed.xp);
              // Remove old XP from localStorage to prevent duplicate migrations
              const updated = { ...parsed };
              delete updated.xp;
              localStorage.setItem(key, JSON.stringify(updated));
              break;
            }
          } catch (e) {
            console.error(`Failed to parse ${key}:`, e);
          }
        }
      }
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migrate XP from localStorage to database if exists
        if (parsed.xp && parsed.xp > 0 && !xpLoading && xp === 0) {
          setXP(parsed.xp);
        }
        
        // XP is now managed by XPContext, not localStorage
        setMoney(parsed.money ?? 0); // Default to 0 coins
        
        if (version === 'v5') {
          // New garden system
          setGarden(parsed.garden ?? { plants: [], width: 800, height: 600 });
          // Migrate sprinkler positions to include time limits
          const oldSprinklers = parsed.sprinklerPositions ?? [];
          const migratedSprinklers = oldSprinklers.map((s: any) => ({
            ...s,
            placedAt: Date.now() - (10 * 60 * 1000), // Assume placed 10 minutes ago for existing sprinklers
            timeLimit: 30 * 60 * 1000 // 30 minutes time limit
          }));
          setSprinklerPositions(migratedSprinklers);
        } else {
          // Migrate from old plot system to new garden system
          setGarden({ plants: [], width: 800, height: 600 });
        }
        
        setInventory(parsed.inventory ?? { seeds: [], gear: [] });
        setHarvestedPlants(parsed.harvestedPlants ?? []);
        setHasSprinkler(parsed.hasSprinkler ?? null);
        setCurrentWeather(parsed.currentWeather ?? 'normal');
        setSeedRestockTime(parsed.seedRestockTime ?? Date.now() + 60 * 60 * 1000);
        setGearRestockTime(parsed.gearRestockTime ?? Date.now() + 15 * 60 * 1000);
        setSelectedSeed(parsed.selectedSeed ?? null);
        setSelectedItem(parsed.selectedItem ?? null);
      } catch (e) {
        console.error('Failed to load garden state:', e);
        // Reset to defaults on error
        setGarden({ plants: [], width: 800, height: 600 });
        setInventory({ seeds: [], gear: [] });
      }
    } else {
      // No saved state, use defaults
      setGarden({ plants: [], width: 800, height: 600 });
      // Check older versions for XP migration
      migrateOldXP();
    }
  }, [xpLoading]);

  // Listen for admin garden updates
  useEffect(() => {
    const handleAdminUpdate = (event: CustomEvent) => {
      const { xp, garden } = event.detail;
      setXP(xp);
      setGarden(garden);
      toast({ title: 'Admin updated your garden state!' });
    };

    window.addEventListener('adminGardenUpdate', handleAdminUpdate as EventListener);
    return () => window.removeEventListener('adminGardenUpdate', handleAdminUpdate as EventListener);
  }, [toast]);

  // Save to localStorage (but not XP - that's managed by XPContext)
  useEffect(() => {
    const state = { money, garden, inventory, harvestedPlants, sprinklerPositions, hasSprinkler, currentWeather, seedRestockTime, gearRestockTime, selectedSeed, selectedItem };
    localStorage.setItem('garden-state-v5', JSON.stringify(state));
  }, [money, garden, inventory, harvestedPlants, sprinklerPositions, hasSprinkler, currentWeather, seedRestockTime, gearRestockTime, selectedSeed, selectedItem]);

  // Timer tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Weather changing system - changes every 45-90 minutes (much rarer)
  useEffect(() => {
    const changeWeather = () => {
      const random = Math.random();
      let newWeather: Weather = 'normal';
      
      // Much rarer weather system:
      // 70% normal, 15% rainy, 8% frozen, 4% candy, 2% thunder, 1% lunar
      if (random < 0.70) {
        newWeather = 'normal';
      } else if (random < 0.85) {
        newWeather = 'rainy';
      } else if (random < 0.93) {
        newWeather = 'frozen';
      } else if (random < 0.97) {
        newWeather = 'candy';
      } else if (random < 0.99) {
        newWeather = 'thunder';
      } else {
        newWeather = 'lunar';
      }
      
      if (newWeather !== currentWeather) {
        const mutationChance = getWeatherMutationChance(newWeather);
        const multiplier = getWeatherMultiplier(newWeather);
        
        setCurrentWeather(newWeather);
        
        if (newWeather !== 'normal') {
          toast({ 
            title: `🌦️ Weather Change!`, 
            description: `${getWeatherName(newWeather)} weather is now active! ${mutationChance > 0 ? `${Math.round(mutationChance * 100)}% mutation chance` : 'Growth boost'} with ${multiplier}x value multiplier!` 
          });
        } else {
          toast({ 
            title: '☀️ Weather Normal', 
            description: 'Normal growing conditions have returned' 
          });
        }
      }
    };

    // Initial weather change
    const initialDelay = Math.random() * (30 * 60 * 1000 - 15 * 60 * 1000) + 15 * 60 * 1000; // 15-30 minutes
    const initialTimer = setTimeout(changeWeather, initialDelay);
    
    // Subsequent weather changes every 15-30 minutes
    const interval = setInterval(() => {
      changeWeather();
    }, Math.random() * (30 * 60 * 1000 - 15 * 60 * 1000) + 15 * 60 * 1000); // 15-30 minutes

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [currentWeather]);

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
  
  // Update gear shop periodically
  useEffect(() => {
    restockGear();
  }, []);

  function restockSeeds() {
    // Show seeds based on stock rates with limited quantities
    const seeds = SEED_TEMPLATES.map(template => { 
      const isInStock = Math.random() < template.stockRate;
      let quantity = 0;
      
      if (isInStock) {
        // Set stock quantity based on rarity - reduced amounts
        switch (template.rarity) {
          case 'common':
            quantity = Math.floor(Math.random() * 3) + 1; // 1-3 seeds (was 3-7)
            break;
          case 'uncommon':
            quantity = Math.floor(Math.random() * 2) + 1; // 1-2 seeds (was 3-7)
            break;
          case 'rare':
            quantity = 1; // Always 1 seed (was 1-3)
            break;
          case 'epic':
            quantity = 1; // Always 1 seed (was 1-2)
            break;
          case 'mythic':
          case 'legendary':
            quantity = 1; // Only 1 seed available
            break;
          case 'exotic':
            quantity = 1; // Only 1 seed available
            break;
        }
      }
      
      return { 
        ...template, 
        id: generateId(),
        inStock: isInStock,
        stockQuantity: quantity
      };
    });
    setShopSeeds(seeds);
  }
  
  function restockGear() {
    const gear = GEAR_TEMPLATES.map(template => ({ ...template, id: generateId() }));
    setShopGear(gear);
  }

  // Plant seed
  function plantSeed(x: number, y: number, seed: Seed) {
    const actualSize = calculateSize(seed.baseSizeKg);
    
    // Check for weather-based mutations first (rarest)
    let variant: 'normal' | 'golden' | 'rainbow' | 'frost' | 'candy' | 'thunder' | 'lunar' = 'normal';
    
    if (currentWeather !== 'normal') {
      const mutationChance = getWeatherMutationChance(currentWeather);
      if (Math.random() < mutationChance) {
        // Apply weather-specific mutation
        switch (currentWeather) {
          case 'rainy':
          case 'frozen':
            variant = 'frost';
            break;
          case 'candy':
            variant = 'candy';
            break;
          case 'thunder':
            variant = 'thunder';
            break;
          case 'lunar':
            variant = 'lunar';
            break;
        }
      }
    }
    
    // If no weather mutation, check for normal golden/rainbow variants
    if (variant === 'normal') {
      variant = calculateVariant(hasSprinkler);
    }
    
    const plant: Plant = {
      id: generateId(),
      seedType: seed.name,
      plantedAt: Date.now(),
      growthTimeMs: seed.baseGrowthTime * 60 * 1000,
      lastWateredAt: Date.now(),
      isWilted: false,
      variant: variant,
      sizeKg: actualSize,
      sellPrice: calculateSellPrice(seed.sellPrice, actualSize, seed.baseSizeKg),
      basePrice: seed.sellPrice, // Store base price for tooltip
      icon: seed.icon,
      x: x,
      y: y,
    };
    
    setGarden(g => ({ ...g, plants: [...g.plants, plant] }));
    setInventory(inv => ({ ...inv, seeds: inv.seeds.filter(s => s.id !== seed.id) }));
    setSelectedSeed(null);
    
    // Show mutation notification if applicable
    if (variant !== 'normal' && variant !== 'golden' && variant !== 'rainbow') {
      toast({
        title: '🌟 Weather Mutation!',
        description: `${seed.name} mutated into ${variant} variant due to ${getWeatherName(currentWeather)} weather!`
      });
    }
  }

  // Water plant
  function waterPlant(plantId: string) {
    setGarden(g => ({
      ...g,
      plants: g.plants.map(plant => {
        if (plant.id === plantId) {
          const elapsed = Date.now() - plant.plantedAt;
          const remaining = Math.max(0, plant.growthTimeMs - elapsed);
          const newRemaining = Math.max(0, remaining - WATER_REDUCTION_TIME);
          const newGrowthTimeMs = elapsed + newRemaining;
          
          return { 
            ...plant, 
            lastWateredAt: Date.now(), 
            growthTimeMs: newGrowthTimeMs,
            isWilted: false 
          };
        }
        return plant;
      })
    }));
  }

  // Achievement system
  function checkAchievements(plant: Plant) {
    const newAchievements: string[] = [];
    
    // Check for rare plant harvests
    if (plant.variant === 'golden' && !achievements.includes('first_golden')) {
      newAchievements.push('first_golden');
    }
    
    if (plant.variant === 'rainbow' && !achievements.includes('first_rainbow')) {
      newAchievements.push('first_rainbow');
    }
    
    // Check for rare seed harvests
    const seedTemplate = SEED_TEMPLATES.find(s => s.name === plant.seedType);
    if (seedTemplate) {
      if (seedTemplate.rarity === 'rare' && !achievements.includes('first_rare_harvest')) {
        newAchievements.push('first_rare_harvest');
      }
      
      if (seedTemplate.rarity === 'epic' && !achievements.includes('first_epic_harvest')) {
        newAchievements.push('first_epic_harvest');
      }
      
      if (seedTemplate.rarity === 'mythic' && !achievements.includes('first_mythic_harvest')) {
        newAchievements.push('first_mythic_harvest');
      }
      
      if (seedTemplate.rarity === 'legendary' && !achievements.includes('first_legendary_harvest')) {
        newAchievements.push('first_legendary_harvest');
      }
      
      if (seedTemplate.rarity === 'exotic' && !achievements.includes('first_exotic_harvest')) {
        newAchievements.push('first_exotic_harvest');
      }
    }
    
    // Award new achievements
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      newAchievements.forEach(achievement => {
        const achievementNames = {
          first_golden: '🌟 Golden Touch',
          first_rainbow: '🌈 Rainbow Harvester',
          first_rare_harvest: '💎 Rare Collector',
          first_epic_harvest: '🏆 Epic Harvester',
          first_mythic_harvest: '⚡ Mythic Finder',
          first_legendary_harvest: '👑 Legendary Farmer',
          first_exotic_harvest: '🌌 Exotic Explorer'
        };
        
        toast({ 
          title: '🏆 Achievement Unlocked!',
          description: achievementNames[achievement as keyof typeof achievementNames] 
        });
      });
    }
  }

  // Harvest plant - now gives money instead of XP
  function harvestPlant(plantId: string) {
    const plant = garden.plants.find(p => p.id === plantId);
    if (!plant) return;
    if (Date.now() - plant.plantedAt < plant.growthTimeMs) return;
    
    // Apply weather mutations with specific percentages
    let finalVariant = plant.variant === 'normal' ? calculateVariant(hasSprinkler) : plant.variant;
    let weatherMultiplier = 1;
    
    if (currentWeather !== 'normal' && finalVariant === 'normal') {
      const mutationChance = getWeatherMutationChance(currentWeather);
      if (Math.random() < mutationChance) {
        switch (currentWeather) {
          case 'frozen':
            finalVariant = 'frost';
            weatherMultiplier = getWeatherMultiplier('frozen');
            break;
          case 'candy':
            finalVariant = 'candy';
            weatherMultiplier = getWeatherMultiplier('candy');
            break;
          case 'thunder':
            finalVariant = 'thunder';
            weatherMultiplier = getWeatherMultiplier('thunder');
            break;
          case 'lunar':
            finalVariant = 'lunar';
            weatherMultiplier = getWeatherMultiplier('lunar');
            break;
          case 'rainy':
            // Rainy weather gives growth boost but no special mutation
            weatherMultiplier = getWeatherMultiplier('rainy');
            break;
        }
      }
    }
    
    const seedTemplate = SEED_TEMPLATES.find(s => s.name === plant.seedType);
    const basePrice = seedTemplate?.sellPrice || plant.sellPrice || 100;
    const finalPrice = Math.round(basePrice * weatherMultiplier);
    
    // Check for achievements before harvesting
    checkAchievements({ ...plant, variant: finalVariant });
    
    // Add to harvested plants inventory instead of auto-selling
    const harvestedPlant: HarvestedPlant = {
      id: generateId(),
      seedType: plant.seedType,
      variant: finalVariant,
      sizeKg: plant.sizeKg,
      sellPrice: finalPrice,
      icon: plant.icon || '🌱',
      harvestedAt: Date.now(),
    };
    
    setHarvestedPlants(prev => [...prev, harvestedPlant]);
    
    // Show harvest notification
    let variantText = finalVariant !== 'normal' ? ` (${finalVariant}!)` : '';
    let title = 'Harvested!';
    let description = `Added to inventory: ${plant.sizeKg}kg${variantText}`;
    
    if (weatherMultiplier > 1) {
      title = `🌦️ Weather Mutation! ${finalVariant}!`;
      description = `${plant.sizeKg}kg harvested with ${weatherMultiplier}x value multiplier!`;
    }
    
    toast({ title, description });
    
    setGarden(g => ({ ...g, plants: g.plants.filter(p => p.id !== plantId) }));
  }

  // Sell harvested plant
  function sellHarvestedPlant(plantId: string) {
    const plant = harvestedPlants.find(p => p.id === plantId);
    if (!plant) return;
    
    setMoney(m => m + plant.sellPrice);
    setHarvestedPlants(prev => prev.filter(p => p.id !== plantId));
    
    let variantText = plant.variant !== 'normal' ? ` (${plant.variant})` : '';
    toast({ 
      title: 'Sold!', 
      description: `+${plant.sellPrice} coins for ${plant.sizeKg}kg ${plant.seedType}${variantText}` 
    });
  }

  // Sell all harvested plants
  function sellAllHarvestedPlants() {
    if (harvestedPlants.length === 0) {
      toast({ title: 'No plants to sell', variant: 'destructive' });
      return;
    }
    
    const totalValue = harvestedPlants.reduce((sum, plant) => sum + plant.sellPrice, 0);
    setMoney(m => m + totalValue);
    setHarvestedPlants([]);
    
    toast({ 
      title: 'Sold All Plants!', 
      description: `+${totalValue} coins for ${harvestedPlants.length} plants` 
    });
  }

  // Buy from shop - uses money and checks stock
  function buySeed(seed: Seed) {
    if (!seed.inStock) {
      toast({ title: 'Out of Stock', description: `${seed.name} is not available`, variant: 'destructive' });
      return;
    }
    
    if (seed.stockQuantity <= 0) {
      toast({ title: 'Out of Stock', description: `${seed.name} is sold out`, variant: 'destructive' });
      return;
    }
    
    if (money < seed.price) {
      toast({ title: 'Not enough coins', description: `Need ${seed.price} coins`, variant: 'destructive' });
      return;
    }
    
    // Purchase the seed
    setMoney(m => m - seed.price);
    // Create a unique seed object for the inventory with a new ID
    const uniqueSeed = {
      ...seed,
      id: generateId(), // Generate unique ID for this specific seed
    };
    setInventory(inv => ({ ...inv, seeds: [...inv.seeds, uniqueSeed] }));
    
    // Decrease stock quantity
    setShopSeeds(seeds => 
      seeds.map(s => 
        s.id === seed.id 
          ? { ...s, stockQuantity: s.stockQuantity - 1, inStock: s.stockQuantity - 1 > 0 }
          : s
      )
    );
    
    toast({ title: 'Purchased', description: `${seed.name} seed` });
  }
  
  function buyGear(gear: Gear) {
    if (money >= gear.price) {
      setMoney(m => m - gear.price);
      
      if (gear.type === 'wateringCan') {
        // Stack watering cans - find existing watering can (any watering can)
        const existingCanIndex = inventory.gear.findIndex(g => g.type === 'wateringCan');
        if (existingCanIndex !== -1) {
          // Add 10 uses to existing watering can
          const currentUses = inventory.gear[existingCanIndex].uses || 10;
          setInventory(inv => {
            const newGear = [...inv.gear];
            newGear[existingCanIndex] = { ...newGear[existingCanIndex], uses: currentUses + 10 };
            return { ...inv, gear: newGear };
          });
          toast({ title: 'Watering Can Refilled!', description: `+10 uses (Total: ${currentUses + 10} uses)` });
        } else {
          // Create new watering can with 10 uses
          const wateringCanWithUses = { 
            ...gear, 
            id: generateId(),
            uses: 10 
          };
          setInventory(inv => ({ ...inv, gear: [...inv.gear, wateringCanWithUses] }));
          toast({ title: 'Purchased', description: `${gear.name} (10 uses)` });
        }
        return;
      }
      
      // For sprinklers and other gear, add to inventory
      const uniqueGear = {
        ...gear,
        id: generateId(),
      };
      setInventory(inv => ({ ...inv, gear: [...inv.gear, uniqueGear] }));
      toast({ title: 'Purchased', description: `${gear.name} - Click to place in garden` });
    } else {
      toast({ title: 'Not enough coins', description: `Need ${gear.price} coins`, variant: 'destructive' });
    }
  }

  // Place sprinkler in garden
  function placeSprinkler(x: number, y: number, sprinkler: Gear) {
    // Check if sprinkler already exists nearby
    const minDistance = 100;
    const tooClose = sprinklerPositions.some(s => {
      const distance = Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2));
      return distance < minDistance;
    });
    
    if (tooClose) {
      toast({ 
        title: 'Too Close', 
        description: 'Sprinklers need more space between them', 
        variant: 'destructive' 
      });
      return;
    }
    
    // Place the sprinkler
    setSprinklerPositions(prev => [...prev, { x, y, gear: sprinkler, placedAt: Date.now(), timeLimit: 30 * 60 * 1000 }]); // 30 minutes time limit
    setInventory(inv => ({
      ...inv,
      gear: inv.gear.filter(g => g.id !== sprinkler.id)
    }));
    setSelectedItem(null);
    setIsSprinklerMode(false);
    
    toast({ 
      title: 'Sprinkler Placed!', 
      description: `${sprinkler.name} is now watering nearby plants` 
    });
  }

  // Quiz Points to Money exchange
  async function exchangeQuizPointsForMoney() {
    const amount = parseInt(exchangeAmount) || 0;
    if (amount <= 0) return;
    if (amount > quizPoints) {
      toast({ title: 'Not enough Quiz Points', variant: 'destructive' });
      return;
    }
    const success = await spendQuizPoints(amount);
    if (success) {
      const coinsReceived = amount * QUIZ_POINTS_TO_MONEY_RATE;
      setMoney(m => m + coinsReceived);
      setExchangeAmount('');
      toast({ title: 'Exchanged!', description: `${amount} Quiz Points → ${coinsReceived} coins` });
    }
  }

  // Auto-wilt check and sprinkler expiration
  useEffect(() => {
    const interval = setInterval(() => {
      // Check for expired sprinklers
      setSprinklerPositions(prev => {
        const now = Date.now();
        const activeSprinklers = prev.filter(sprinkler => {
          const timeElapsed = now - sprinkler.placedAt;
          if (timeElapsed > sprinkler.timeLimit) {
            toast({
              title: 'Sprinkler Expired',
              description: `${sprinkler.gear.name} has run out of water and disappeared`,
              variant: 'destructive'
            });
            return false; // Remove expired sprinkler
          }
          return true; // Keep active sprinkler
        });
        return activeSprinklers;
      });

      // Check for wilted plants (much slower now)
      setGarden(g => ({
        ...g,
        plants: g.plants.map(plant => {
          const timeSinceWater = Date.now() - plant.lastWateredAt;
          if (timeSinceWater > WILT_THRESHOLD && !plant.isWilted) {
            return { ...plant, isWilted: true };
          }
          return plant;
        })
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
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-sm text-foreground">{xp} XP</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Star className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-sm text-foreground">{quizPoints} pts</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-sm text-foreground">{money.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Grid3X3 className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-sm text-foreground">{garden.plants.length} Plants</span>
            </div>
          </div>
        </div>

        {/* Weather Display */}
        <div className="bg-card rounded-xl shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getWeatherIcon(currentWeather)}</span>
              <div>
                <h3 className="font-bold text-foreground">Current Weather: {getWeatherName(currentWeather)}</h3>
                <p className="text-xs text-muted-foreground">
                  {currentWeather === 'normal' ? 'Normal growing conditions' : `${getWeatherMultiplier(currentWeather)}x plant value multiplier active!`}
                </p>
              </div>
            </div>
            {currentWeather !== 'normal' && (
              <div className="text-xs px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full font-semibold">
                {getWeatherMultiplier(currentWeather)}x Value
              </div>
            )}
          </div>
        </div>

        {/* Quiz Points Exchange - Simple clean design */}
        <div className="bg-card rounded-xl shadow-sm p-4 border">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-foreground">
            <ArrowRightLeft className="w-5 h-5 text-purple-600" /> Quiz Points Exchange
            <span className="text-xs font-normal text-muted-foreground ml-2">(1 pt = 2 coins)</span>
          </h3>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              type="number"
              placeholder="Amount of pts"
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(e.target.value)}
              className="w-32"
              min="1"
              max={quizPoints}
            />
            <Button 
              onClick={exchangeQuizPointsForMoney} 
              disabled={!exchangeAmount || parseInt(exchangeAmount) <= 0 || parseInt(exchangeAmount) > quizPoints}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Exchange for {(parseInt(exchangeAmount) || 0) * QUIZ_POINTS_TO_MONEY_RATE} coins
            </Button>
            <span className="text-xs text-muted-foreground">Available: {quizPoints} pts</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Earn Quiz Points by taking quizzes in the Learning section!
          </p>
        </div>

        {/* Free-Form Garden */}
        <FreeFormGarden 
          garden={garden}
          selectedSeed={selectedSeed}
          selectedItem={selectedItem}
          isWateringMode={isWateringMode}
          isSprinklerMode={isSprinklerMode}
          currentWeather={currentWeather}
          onPlantSeed={(x, y, seed) => {
            plantSeed(x, y, seed);
          }}
          onWaterPlant={(plantId) => {
            if (isWateringMode && selectedItem?.type === 'wateringCan' && selectedItem.uses && selectedItem.uses > 0) {
              waterPlant(plantId);
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
            }
          }}
          onHarvestPlant={(plantId) => {
            harvestPlant(plantId);
          }}
          onSelectPlant={(plant) => {
            setSelectedPlant(plant);
          }}
          onPlaceSprinkler={(x, y, sprinkler) => {
            placeSprinkler(x, y, sprinkler);
          }}
          formatTime={formatTime}
          sprinklerPositions={sprinklerPositions}
        />


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
            <Wrench className="w-5 h-5" /> My Items ({inventory.gear.filter(g => !g.name.includes('Plot')).length})
          </h3>
          {inventory.gear.filter(g => !g.name.includes('Plot')).length === 0 ? (
            <p className="text-sm text-muted-foreground">No items. Buy some from the shop!</p>
          ) : (
            <ScrollArea className="h-20">
              <div className="flex gap-2 flex-wrap pr-4">
                {inventory.gear.filter(g => !g.name.includes('Plot')).map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'wateringCan') {
                        if (isWateringMode && selectedItem?.id === item.id) {
                          // Deselect if already selected
                          setSelectedItem(null);
                          setIsWateringMode(false);
                        } else {
                          // Select watering can for use
                          setSelectedItem(item);
                          setIsWateringMode(true);
                          setIsSprinklerMode(false);
                          setSelectedSeed(null); // Deselect seed when selecting item
                        }
                      } else if (item.type === 'sprinkler') {
                        if (isSprinklerMode && selectedItem?.id === item.id) {
                          // Deselect if already selected
                          setSelectedItem(null);
                          setIsSprinklerMode(false);
                        } else {
                          // Select sprinkler for placement
                          setSelectedItem(item);
                          setIsSprinklerMode(true);
                          setIsWateringMode(false);
                          setSelectedSeed(null); // Deselect seed when selecting item
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded border text-xs flex items-center gap-1 transition-colors ${
                      (item.type === 'wateringCan' && selectedItem?.id === item.id && isWateringMode) ||
                      (item.type === 'sprinkler' && selectedItem?.id === item.id && isSprinklerMode)
                        ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {item.type === 'wateringCan' ? (
                      <Droplets className="w-3 h-3" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    <span>{item.name}</span>
                    {item.uses && (
                      <span className="text-xs text-muted-foreground">({item.uses})</span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          {isWateringMode && selectedItem && selectedItem.type === 'wateringCan' && (
            <p className="mt-2 text-xs text-blue-600">
              🚿 Watering can selected - Click a plant to water it
            </p>
          )}
          {isSprinklerMode && selectedItem && selectedItem.type === 'sprinkler' && (
            <p className="mt-2 text-xs text-purple-600">
              ⚡ Sprinkler selected - Click empty space to place it (100px radius)
            </p>
          )}
        </div>

        {/* Harvested Plants Inventory & Sell Area */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Harvested Plants Inventory */}
          <div className="bg-card rounded-xl shadow-sm p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2 text-foreground">
                <Package className="w-5 h-5" /> Harvested Plants ({harvestedPlants.length})
              </h3>
            </div>
            {harvestedPlants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No harvested plants. Grow and harvest some plants!</p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {harvestedPlants.map(plant => (
                    <div 
                      key={plant.id} 
                      className={`
                        flex items-center justify-between p-2 border rounded bg-secondary/30 transition-all
                        ${plant.variant !== 'normal' ? getVariantColor(plant.variant) : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{plant.icon}</span>
                        <div>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {plant.seedType}
                            {plant.variant !== 'normal' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                                {plant.variant}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plant.sizeKg}kg • {plant.sellPrice} coins
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sellHarvestedPlant(plant.id)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Sell
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Sell All Area */}
          <div className="bg-card rounded-xl shadow-sm p-4 border">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-foreground">
              <Coins className="w-5 h-5" /> Quick Sell
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-semibold text-foreground mb-2">Inventory Value</div>
                <div className="text-2xl font-bold text-green-600">
                  {harvestedPlants.reduce((sum, plant) => sum + plant.sellPrice, 0)} coins
                </div>
                <div className="text-xs text-muted-foreground">
                  {harvestedPlants.length} plants • {harvestedPlants.reduce((sum, plant) => sum + plant.sizeKg, 0).toFixed(1)}kg total
                </div>
              </div>
              <Button
                onClick={sellAllHarvestedPlants}
                disabled={harvestedPlants.length === 0}
                className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                <Coins className="w-4 h-4 mr-2" />
                Sell All Plants
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Plants don't spoil - sell them when you need coins!
              </div>
            </div>
          </div>
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
                {shopSeeds.map(seed => {
                  const canAfford = money >= seed.price;
                  const isAvailable = seed.inStock && seed.stockQuantity > 0 && canAfford;
                  
                  return (
                    <div 
                      key={seed.id} 
                      className={`
                        flex items-center justify-between p-2 border rounded bg-secondary/30 transition-all
                        ${seed.inStock && seed.stockQuantity > 0 && canAfford ? 'ring-1 ring-gray-400/50 shadow-md shadow-gray-400/10' : ''}
                        ${!seed.inStock || seed.stockQuantity <= 0 ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{seed.icon}</span>
                        <div>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {seed.name}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold ${getRarityColor(seed.rarity)}`}>
                              {seed.rarity}
                            </span>
                            {(!seed.inStock || seed.stockQuantity <= 0) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
                                OUT OF STOCK
                              </span>
                            )}
                            {seed.inStock && seed.stockQuantity > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                                {seed.stockQuantity} left
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {seed.baseGrowthTime}m • {seed.baseSizeKg}kg • Sells: {seed.sellPrice}
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => buySeed(seed)} 
                        disabled={!isAvailable} 
                        size="sm"
                        variant={isAvailable ? "default" : "secondary"}
                        className="text-xs"
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        {seed.price}
                      </Button>
                    </div>
                  );
                })}
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
                const disabled = money < gear.price;
                
                return (
                  <div key={gear.id} className="flex items-center justify-between p-2 border rounded bg-secondary/30">
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {gear.type === 'wateringCan' ? '💧' : '⚡'} {gear.name}
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
                      <Coins className="w-3 h-3 mr-1" />
                      {gear.price}
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

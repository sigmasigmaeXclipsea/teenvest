import React, { useState } from 'react';
import { Droplets } from 'lucide-react';

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
  basePrice: number;
  icon?: string;
  x: number;
  y: number;
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
  baseGrowthTime: number;
  baseSizeKg: number;
  price: number;
  sellPrice: number;
  icon: string;
  stockRate: number;
  inStock: boolean;
  stockQuantity: number;
}

interface Gear {
  id: string;
  name: string;
  type: 'wateringCan' | 'sprinkler';
  effect: string;
  price: number;
  quantity?: number;
  uses?: number;
}

interface FreeFormGardenProps {
  garden: Garden;
  selectedSeed: Seed | null;
  selectedItem: Gear | null;
  isWateringMode: boolean;
  isSprinklerMode: boolean;
  currentWeather: 'normal' | 'rainy' | 'frozen' | 'candy' | 'thunder' | 'lunar';
  onPlantSeed: (x: number, y: number, seed: Seed) => void;
  onWaterPlant: (plantId: string) => void;
  onHarvestPlant: (plantId: string) => void;
  onSelectPlant: (plant: Plant | null) => void;
  onPlaceSprinkler: (x: number, y: number, sprinkler: Gear) => void;
  formatTime: (ms: number) => string;
  sprinklerPositions: {x: number, y: number, gear: Gear}[];
}

export default function FreeFormGarden({
  garden,
  selectedSeed,
  selectedItem,
  isWateringMode,
  isSprinklerMode,
  currentWeather,
  onPlantSeed,
  onWaterPlant,
  onHarvestPlant,
  onSelectPlant,
  onPlaceSprinkler,
  formatTime,
  sprinklerPositions
}: FreeFormGardenProps) {
  const [hoveredPosition, setHoveredPosition] = useState<{x: number, y: number} | null>(null);

  const now = Date.now();

  // Get weather display info
  const getWeatherInfo = () => {
    switch (currentWeather) {
      case 'rainy': return { icon: '🌧️', name: 'Rainy', color: 'text-blue-500' };
      case 'frozen': return { icon: '❄️', name: 'Frozen', color: 'text-cyan-400' };
      case 'candy': return { icon: '🍬', name: 'Candy', color: 'text-pink-400' };
      case 'thunder': return { icon: '⚡', name: 'Thunder', color: 'text-yellow-400' };
      case 'lunar': return { icon: '🌙', name: 'Lunar', color: 'text-purple-400' };
      default: return { icon: '☀️', name: 'Normal', color: 'text-yellow-500' };
    }
  };

  // Check if position is valid for planting (not too close to other plants)
  const isValidPlantingPosition = (x: number, y: number) => {
    const minDistance = 60; // Minimum distance between plants
    return !garden.plants.some(plant => {
      const distance = Math.sqrt(Math.pow(plant.x - x, 2) + Math.pow(plant.y - y, 2));
      return distance < minDistance;
    });
  };

  const handleGardenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isSprinklerMode && selectedItem?.type === 'sprinkler') {
      onPlaceSprinkler(x, y, selectedItem);
      return;
    }

    if (selectedSeed && !isWateringMode) {
      if (isValidPlantingPosition(x, y)) {
        onPlantSeed(x, y, selectedSeed);
      } else {
        // Show feedback that position is too close
        console.log('Too close to other plants!');
      }
      return;
    }

    // Check if clicking on a plant
    const clickedPlant = garden.plants.find(plant => {
      const distance = Math.sqrt(Math.pow(plant.x - x, 2) + Math.pow(plant.y - y, 2));
      return distance < 30; // Click radius for plants
    });

    if (clickedPlant) {
      if (isWateringMode && selectedItem?.type === 'wateringCan') {
        onWaterPlant(clickedPlant.id);
      } else {
        const isReady = now - clickedPlant.plantedAt >= clickedPlant.growthTimeMs;
        if (isReady) {
          onHarvestPlant(clickedPlant.id);
        } else {
          onSelectPlant(clickedPlant);
        }
      }
    } else {
      onSelectPlant(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoveredPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setHoveredPosition(null);
  };

  // Get plant visual based on growth stage - unique aesthetic emojis per stage
  const getPlantVisual = (plant: Plant) => {
    const progress = Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs);
    const stage = progress < 0.25 ? 'seed' : progress < 0.5 ? 'sprout' : progress < 0.75 ? 'growing' : progress < 1 ? 'mature' : 'ready';
    const isReady = progress >= 1;

    // Size grows with stage
    const baseSize = stage === 'seed' ? 24 : stage === 'sprout' ? 32 : stage === 'growing' ? 44 : stage === 'mature' ? 54 : 64;

    // Unique emojis for each stage with plant-specific final stage
    const getStageEmoji = () => {
      const seedType = plant.seedType.toLowerCase();
      
      if (stage === 'seed') return '🫘'; // Small bean/seed
      if (stage === 'sprout') return '🌱'; // Sprout
      
      // Growing stage - small leafy plant
      if (stage === 'growing') {
        if (seedType.includes('tomato') || seedType.includes('pepper') || seedType.includes('chili')) return '🌿';
        if (seedType.includes('corn') || seedType.includes('wheat')) return '🌾';
        if (seedType.includes('flower') || seedType.includes('rose') || seedType.includes('orchid')) return '🌷';
        if (seedType.includes('tree') || seedType.includes('apple') || seedType.includes('cherry')) return '🌳';
        return '☘️';
      }
      
      // Mature stage - fuller plant showing type
      if (stage === 'mature') {
        if (seedType.includes('tomato')) return '🍅';
        if (seedType.includes('carrot')) return '🥕';
        if (seedType.includes('corn')) return '🌽';
        if (seedType.includes('pumpkin')) return '🎃';
        if (seedType.includes('strawberry')) return '🍓';
        if (seedType.includes('grape')) return '🍇';
        if (seedType.includes('apple')) return '🍎';
        if (seedType.includes('cherry')) return '🍒';
        if (seedType.includes('peach')) return '🍑';
        if (seedType.includes('watermelon')) return '🍉';
        if (seedType.includes('pepper') || seedType.includes('chili')) return '🌶️';
        if (seedType.includes('eggplant')) return '🍆';
        if (seedType.includes('broccoli')) return '🥦';
        if (seedType.includes('lettuce') || seedType.includes('cabbage')) return '🥬';
        if (seedType.includes('potato')) return '🥔';
        if (seedType.includes('onion')) return '🧅';
        if (seedType.includes('garlic')) return '🧄';
        if (seedType.includes('cucumber') || seedType.includes('zucchini')) return '🥒';
        if (seedType.includes('mushroom')) return '🍄';
        if (seedType.includes('flower') || seedType.includes('rose')) return '🌹';
        if (seedType.includes('sunflower')) return '🌻';
        if (seedType.includes('tulip')) return '🌷';
        if (seedType.includes('cactus')) return '🌵';
        return '🌿';
      }
      
      // Ready stage - use the plant icon or best match
      return plant.icon || '🌻';
    };

    // Variant glow effects
    const getVariantGlow = () => {
      switch (plant.variant) {
        case 'golden': return '0 0 12px rgba(255, 215, 0, 0.9), 0 0 24px rgba(255, 215, 0, 0.5)';
        case 'rainbow': return '0 0 12px rgba(255, 0, 128, 0.7), 0 0 24px rgba(0, 255, 128, 0.5)';
        case 'frost': return '0 0 12px rgba(135, 206, 250, 0.9), 0 0 24px rgba(135, 206, 250, 0.5)';
        case 'candy': return '0 0 12px rgba(255, 105, 180, 0.9), 0 0 24px rgba(255, 182, 193, 0.5)';
        case 'thunder': return '0 0 12px rgba(255, 255, 0, 0.9), 0 0 24px rgba(255, 215, 0, 0.5)';
        case 'lunar': return '0 0 12px rgba(138, 43, 226, 0.9), 0 0 24px rgba(75, 0, 130, 0.5)';
        default: return '';
      }
    };

    // Variant color filter for the emoji
    const getVariantFilter = () => {
      switch (plant.variant) {
        case 'golden': return 'drop-shadow(0 0 4px gold)';
        case 'rainbow': return 'saturate(1.5) hue-rotate(45deg)';
        case 'frost': return 'drop-shadow(0 0 4px cyan) brightness(1.1)';
        case 'candy': return 'drop-shadow(0 0 4px hotpink) saturate(1.3)';
        case 'thunder': return 'drop-shadow(0 0 4px yellow) brightness(1.2)';
        case 'lunar': return 'drop-shadow(0 0 4px purple) brightness(0.95)';
        default: return '';
      }
    };

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${plant.isWilted ? 'opacity-40 grayscale' : ''}`}
        style={{
          left: plant.x,
          top: plant.y,
          width: baseSize,
          height: baseSize,
        }}
      >
        {/* Glow background for variants */}
        {plant.variant !== 'normal' && (
          <div 
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: getVariantGlow() }}
          />
        )}
        
        {/* Plant emoji */}
        <span 
          className={`text-center select-none z-10 ${isReady ? 'animate-pulse' : ''}`}
          style={{ 
            fontSize: baseSize * 0.75,
            filter: getVariantFilter()
          }}
        >
          {getStageEmoji()}
        </span>

        {/* Ready sparkle */}
        {isReady && (
          <div className="absolute -top-1 -right-1 text-xs animate-bounce">✨</div>
        )}

        {/* Variant indicator dot */}
        {plant.variant !== 'normal' && (
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white/50 ${
              plant.variant === 'golden' ? 'bg-yellow-400' :
              plant.variant === 'rainbow' ? 'bg-gradient-to-r from-red-400 via-green-400 to-blue-400' :
              plant.variant === 'frost' ? 'bg-cyan-300' :
              plant.variant === 'candy' ? 'bg-pink-400' :
              plant.variant === 'thunder' ? 'bg-yellow-300' :
              'bg-purple-400'
            }`}
          />
        )}

        {/* Wilt indicator */}
        {plant.isWilted && (
          <div className="absolute -top-1 -left-1 text-xs">💀</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-card rounded-xl shadow-sm border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          🌻 Garden ({garden.plants.length} plants)
        </h3>
        <div className="text-sm text-muted-foreground">
          {isWateringMode ? '🚿 Watering mode' : isSprinklerMode ? '⚡ Placing sprinkler' : selectedSeed ? `🌱 Planting ${selectedSeed.name}` : 'Click to interact'}
        </div>
      </div>

      {/* Garden area - flat brown with subtle dots */}
      <div 
        className="relative rounded-lg overflow-hidden cursor-crosshair shadow-inner"
        style={{ 
          width: garden.width, 
          height: garden.height, 
          maxWidth: '100%', 
          margin: '0 auto',
          backgroundColor: '#5D4037',
          backgroundImage: `
            radial-gradient(circle, #4E342E 1px, transparent 1px),
            radial-gradient(circle, #6D4C41 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 35px 35px',
          backgroundPosition: '0 0, 10px 10px',
          position: 'relative'
        }}
        onClick={handleGardenClick}
      >
        {/* Weather corner display */}
        {currentWeather !== 'normal' && (
          <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2 pointer-events-none z-10">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getWeatherInfo().icon}</span>
              <span className={`text-xs font-medium ${getWeatherInfo().color}`}>
                {getWeatherInfo().name}
              </span>
            </div>
          </div>
        )}

        {/* Soil patches for planted seeds */}
        {garden.plants.map(plant => {
          const progress = Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs);
          const isSprout = progress < 0.33;
          
          if (!isSprout) return null;
          
          return (
            <div
              key={`soil-${plant.id}`}
              className="absolute rounded-full shadow-lg"
              style={{
                left: plant.x - 30,
                top: plant.y - 20,
                width: 60,
                height: 40,
                background: `
                  radial-gradient(ellipse at center, #2E1A17 0%, #4A3018 40%, #3E2723 70%, #2E1A17 100%)
                `,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                border: '1px solid rgba(62, 39, 35, 0.5)'
              }}
            />
          );
        })}

        {/* Sprinklers with radius visualization */}
        {sprinklerPositions.map((sprinkler, index) => (
          <div key={`sprinkler-${index}`}>
            {/* Blue radius circle */}
            <div
              className="absolute rounded-full border-2 border-blue-400 bg-blue-100/20 pointer-events-none"
              style={{
                left: sprinkler.x - 100,
                top: sprinkler.y - 100,
                width: 200,
                height: 200,
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}
            />
            {/* Sprinkler icon */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse drop-shadow-lg z-10"
              style={{
                left: sprinkler.x,
                top: sprinkler.y,
                filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.6))'
              }}
            >
              ⚡
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[8px] px-1 rounded whitespace-nowrap shadow-md">
                {sprinkler.gear.name}
              </div>
            </div>
          </div>
        ))}

        {/* Plants */}
        {garden.plants.map(plant => (
          <div key={plant.id}>
            {getPlantVisual(plant)}
          </div>
        ))}

        {/* Hover indicator for planting */}
        {hoveredPosition && selectedSeed && !isWateringMode && !isSprinklerMode && (
          <div
            className={`absolute rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ${
              isValidPlantingPosition(hoveredPosition.x, hoveredPosition.y)
                ? 'border-green-600 bg-green-900/40 shadow-lg shadow-green-500/50'
                : 'border-red-600 bg-red-900/40 shadow-lg shadow-red-500/50'
            }`}
            style={{
              left: hoveredPosition.x,
              top: hoveredPosition.y,
              width: 40,
              height: 40,
            }}
          />
        )}

        {/* Hover indicator for sprinkler placement */}
        {hoveredPosition && isSprinklerMode && selectedItem?.type === 'sprinkler' && (
          <div
            className="absolute rounded-full border-2 border-purple-500 bg-purple-900/40 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse shadow-lg shadow-purple-500/50"
            style={{
              left: hoveredPosition.x,
              top: hoveredPosition.y,
              width: 50,
              height: 50,
            }}
          />
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Click empty space to plant • Click plants to water/harvest • Plants need space to grow
      </div>
    </div>
  );
}

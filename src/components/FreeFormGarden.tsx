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

  // Get plant visual based on growth stage
  const getPlantVisual = (plant: Plant) => {
    const progress = Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs);
    const stage = progress < 0.25 ? 'seed' : progress < 0.5 ? 'sprout' : progress < 0.75 ? 'growing' : progress < 1 ? 'mature' : 'ready';
    const scale = 0.3 + progress * 1.2; // More dramatic scaling
    const isReady = progress >= 1;

    // Get variant colors
    const getVariantStyle = () => {
      switch (plant.variant) {
        case 'golden': return 'filter: sepia(100%) saturate(300%) hue-rotate(10deg) brightness(1.2) drop-shadow(0 0 12px rgba(255, 215, 0, 0.6));';
        case 'rainbow': return 'filter: saturate(200%) hue-rotate(90deg) drop-shadow(0 0 12px rgba(147, 51, 234, 0.6));';
        case 'frost': return 'filter: hue-rotate(180deg) saturate(150%) brightness(1.3) drop-shadow(0 0 12px rgba(135, 206, 235, 0.6));';
        case 'candy': return 'filter: hue-rotate(320deg) saturate(200%) brightness(1.2) drop-shadow(0 0 12px rgba(255, 105, 180, 0.6));';
        case 'thunder': return 'filter: sepia(50%) saturate(300%) hue-rotate(45deg) brightness(1.4) drop-shadow(0 0 12px rgba(255, 255, 0, 0.6));';
        case 'lunar': return 'filter: hue-rotate(270deg) saturate(180%) brightness(1.3) contrast(1.1) drop-shadow(0 0 12px rgba(147, 51, 234, 0.6));';
        default: return '';
      }
    };

    const baseSize = stage === 'seed' ? 15 : stage === 'sprout' ? 25 : stage === 'growing' ? 40 : stage === 'mature' ? 55 : 70;
    const size = baseSize * scale;

    // Different visual for each growth stage
    const getStageVisual = () => {
      switch (stage) {
        case 'seed':
          return (
            <div className="relative w-full h-full">
              {/* Small dark brown seed */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #4A3018, #2E1A17)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'
                }}
              />
            </div>
          );
        case 'sprout':
          return (
            <div className="relative w-full h-full">
              {/* Small green sprout */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-green-500"
                  style={{ fontSize: size * 0.6 }}
                >
                  🌱
                </span>
              </div>
              {/* Small soil mound */}
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 rounded-t-full"
                style={{
                  background: 'radial-gradient(ellipse at center, #3E2723, #2E1A17)',
                  opacity: 0.8
                }}
              />
            </div>
          );
        case 'growing':
          return (
            <div className="relative w-full h-full">
              {/* Medium plant */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-green-600"
                  style={{ fontSize: size * 0.7 }}
                >
                  🌿
                </span>
              </div>
              {/* Leaves effect */}
              <div 
                className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-500 rounded-full opacity-60"
                style={{ filter: 'blur(1px)' }}
              />
              <div 
                className="absolute top-1/3 right-1/4 w-2 h-2 bg-green-500 rounded-full opacity-60"
                style={{ filter: 'blur(1px)' }}
              />
            </div>
          );
        case 'mature':
          return (
            <div className="relative w-full h-full">
              {/* Large plant */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-green-700"
                  style={{ fontSize: size * 0.8 }}
                >
                  🌾
                </span>
              </div>
              {/* More leaves */}
              <div 
                className="absolute top-1/5 left-1/5 w-3 h-3 bg-green-600 rounded-full opacity-50"
                style={{ filter: 'blur(1px)' }}
              />
              <div 
                className="absolute top-1/4 right-1/5 w-3 h-3 bg-green-600 rounded-full opacity-50"
                style={{ filter: 'blur(1px)' }}
              />
              <div 
                className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-green-500 rounded-full opacity-40"
                style={{ filter: 'blur(1px)' }}
              />
            </div>
          );
        case 'ready':
          return (
            <div className="relative w-full h-full">
              {/* Ready to harvest - full grown */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-green-800"
                  style={{ fontSize: size * 0.9 }}
                >
                  {plant.icon || '🌻'}
                </span>
              </div>
              {/* Glowing effect for ready plants */}
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.3), transparent 70%)',
                  filter: 'blur(8px)'
                }}
              />
              {/* Decorative elements */}
              <div 
                className="absolute top-1/6 left-1/6 w-4 h-4 bg-green-600 rounded-full opacity-40"
                style={{ filter: 'blur(2px)' }}
              />
              <div 
                className="absolute top-1/5 right-1/6 w-4 h-4 bg-green-600 rounded-full opacity-40"
                style={{ filter: 'blur(2px)' }}
              />
              <div 
                className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-green-500 rounded-full opacity-30"
                style={{ filter: 'blur(1px)' }}
              />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${isReady ? 'animate-pulse' : ''} ${plant.isWilted ? 'opacity-60' : ''}`}
        style={{
          left: plant.x,
          top: plant.y,
          width: size,
          height: size,
          transform: `translate(-50%, -50%) ${plant.isWilted ? 'rotate(-15deg) scale(0.9)' : ''}`,
          filter: getVariantStyle()
        }}
      >
        {getStageVisual()}
        
        {/* Ready indicator */}
        {isReady && (
          <div className="absolute -top-3 -right-3 w-4 h-4 bg-green-500 rounded-full animate-ping shadow-lg shadow-green-500/50" />
        )}
        
        {/* Wilt indicator */}
        {plant.isWilted && (
          <div className="absolute -top-2 -right-2 text-xs drop-shadow-md">💀</div>
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

      {/* Garden area */}
      <div 
        className="relative rounded-lg overflow-hidden cursor-crosshair shadow-inner"
        style={{ 
          width: garden.width, 
          height: garden.height, 
          maxWidth: '100%', 
          margin: '0 auto',
          background: `
            radial-gradient(ellipse at 20% 30%, #8B4513 0%, #654321 25%, #4A3018 50%, #3E2723 75%, #2E1A17 100%),
            linear-gradient(135deg, #6B4423 0%, #8B5A3C 25%, #704214 50%, #5C3317 75%, #4A2C17 100%)
          `,
          position: 'relative'
        }}
        onClick={handleGardenClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Soil texture specks */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 20%, #2E1A17 1px, transparent 1px),
              radial-gradient(circle at 35% 40%, #3E2723 2px, transparent 2px),
              radial-gradient(circle at 55% 15%, #4A3018 1px, transparent 1px),
              radial-gradient(circle at 75% 35%, #2E1A17 1px, transparent 1px),
              radial-gradient(circle at 25% 60%, #3E2723 2px, transparent 2px),
              radial-gradient(circle at 45% 80%, #4A3018 1px, transparent 1px),
              radial-gradient(circle at 65% 55%, #2E1A17 2px, transparent 2px),
              radial-gradient(circle at 85% 75%, #3E2723 1px, transparent 1px),
              radial-gradient(circle at 10% 85%, #4A3018 1px, transparent 1px),
              radial-gradient(circle at 90% 10%, #2E1A17 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 150px 150px, 80px 80px, 120px 120px, 90px 90px, 110px 110px, 70px 70px, 130px 130px, 100px 100px, 140px 140px'
          }}
        />

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

        {/* Sprinklers */}
        {sprinklerPositions.map((sprinkler, index) => (
          <div
            key={`sprinkler-${index}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse drop-shadow-lg"
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

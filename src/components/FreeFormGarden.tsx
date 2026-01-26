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
  icon: string;
}

interface Gear {
  id: string;
  name: string;
  type: 'wateringCan' | 'sprinkler' | 'plotUpgrade';
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
    const stage = progress < 0.33 ? 'sprout' : progress < 0.66 ? 'growing' : progress < 1 ? 'mature' : 'ready';
    const scale = 0.5 + progress * 0.8; // Larger scale for bigger plants
    const isReady = progress >= 1;

    // Get variant colors
    const getVariantStyle = () => {
      switch (plant.variant) {
        case 'golden': return 'filter: sepia(100%) saturate(300%) hue-rotate(10deg) brightness(1.1);';
        case 'rainbow': return 'filter: saturate(200%) hue-rotate(90deg);';
        case 'frost': return 'filter: hue-rotate(180deg) saturate(150%) brightness(1.2);';
        case 'candy': return 'filter: hue-rotate(320deg) saturate(200%) brightness(1.1);';
        case 'thunder': return 'filter: sepia(50%) saturate(300%) hue-rotate(45deg) brightness(1.3);';
        case 'lunar': return 'filter: hue-rotate(270deg) saturate(180%) brightness(1.2) contrast(1.1);';
        default: return '';
      }
    };

    const baseSize = stage === 'sprout' ? 20 : stage === 'growing' ? 35 : stage === 'mature' ? 50 : 60;
    const size = baseSize * scale;

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isReady ? 'animate-pulse' : ''} ${plant.isWilted ? 'opacity-70' : ''}`}
        style={{
          left: plant.x,
          top: plant.y,
          width: size,
          height: size,
          transform: `translate(-50%, -50%) ${plant.isWilted ? 'rotate(-15deg)' : ''}`,
          style: getVariantStyle()
        }}
      >
        <div className="relative w-full h-full">
          {/* Plant emoji */}
          <span 
            className="absolute inset-0 flex items-center justify-center text-2xl"
            style={{ fontSize: size * 0.8 }}
          >
            {plant.icon || '🌱'}
          </span>
          
          {/* Ready indicator */}
          {isReady && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          )}
          
          {/* Wilt indicator */}
          {plant.isWilted && (
            <div className="absolute -top-1 -right-1 text-xs">💀</div>
          )}
        </div>
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
        className="relative bg-gradient-to-b from-amber-100 to-green-100 dark:from-amber-900 dark:to-green-900 rounded-lg overflow-hidden cursor-crosshair"
        style={{ width: garden.width, height: garden.height, maxWidth: '100%', margin: '0 auto' }}
        onClick={handleGardenClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Soil patches for planted seeds */}
        {garden.plants.map(plant => {
          const progress = Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs);
          const isSprout = progress < 0.33;
          
          if (!isSprout) return null;
          
          return (
            <div
              key={`soil-${plant.id}`}
              className="absolute rounded-full bg-amber-700 dark:bg-amber-900"
              style={{
                left: plant.x - 25,
                top: plant.y - 15,
                width: 50,
                height: 30,
              }}
            />
          );
        })}

        {/* Sprinklers */}
        {sprinklerPositions.map((sprinkler, index) => (
          <div
            key={`sprinkler-${index}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse"
            style={{
              left: sprinkler.x,
              top: sprinkler.y,
            }}
          >
            ⚡
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[8px] px-1 rounded whitespace-nowrap">
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
            className={`absolute w-8 h-8 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
              isValidPlantingPosition(hoveredPosition.x, hoveredPosition.y)
                ? 'border-green-500 bg-green-200/50'
                : 'border-red-500 bg-red-200/50'
            }`}
            style={{
              left: hoveredPosition.x,
              top: hoveredPosition.y,
            }}
          />
        )}

        {/* Hover indicator for sprinkler placement */}
        {hoveredPosition && isSprinklerMode && selectedItem?.type === 'sprinkler' && (
          <div
            className="absolute w-12 h-12 rounded-full border-2 border-purple-500 bg-purple-200/50 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse"
            style={{
              left: hoveredPosition.x,
              top: hoveredPosition.y,
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

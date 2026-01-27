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

  // Get plant visual based on growth stage
  const getPlantVisual = (plant: Plant) => {
    const progress = Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs);
    const stage = progress < 0.25 ? 'seed' : progress < 0.5 ? 'sprout' : progress < 0.75 ? 'growing' : progress < 1 ? 'mature' : 'ready';
    const scale = 0.3 + progress * 1.2; // More dramatic scaling
    const isReady = progress >= 1;

    // Get variant colors and effects
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

    // Different visual for each growth stage with variant effects
    const getStageVisual = () => {
      switch (stage) {
        case 'seed':
          return (
            <div className="relative w-full h-full">
              {/* Small dark brown seed with variant effects */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: plant.variant === 'frost' 
                    ? 'radial-gradient(circle at 30% 30%, #E0F2FE, #BAE6FD)'
                    : plant.variant === 'candy'
                    ? 'radial-gradient(circle at 30% 30%, #FCE7F3, #FBCFE8)'
                    : plant.variant === 'thunder'
                    ? 'radial-gradient(circle at 30% 30%, #FEF3C7, #FDE68A)'
                    : plant.variant === 'lunar'
                    ? 'radial-gradient(circle at 30% 30%, #E9D5FF, #D8B4FE)'
                    : plant.variant === 'golden'
                    ? 'radial-gradient(circle at 30% 30%, #FEF3C7, #FCD34D)'
                    : 'radial-gradient(circle at 30% 30%, #4A3018, #2E1A17)',
                  boxShadow: plant.variant !== 'normal' 
                    ? 'inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.3)'
                    : 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'
                }}
              />
            </div>
          );
        case 'sprout':
          return (
            <div className="relative w-full h-full">
              {/* Small sprout with variant colors */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className={plant.variant === 'frost' ? 'text-cyan-300' : 
                         plant.variant === 'candy' ? 'text-pink-300' :
                         plant.variant === 'thunder' ? 'text-yellow-300' :
                         plant.variant === 'lunar' ? 'text-purple-300' :
                         plant.variant === 'golden' ? 'text-yellow-200' :
                         plant.variant === 'rainbow' ? 'text-purple-300' :
                         'text-green-500'}
                  style={{ fontSize: size * 0.6 }}
                >
                  {plant.variant === 'frost' ? '❄️' :
                   plant.variant === 'candy' ? '🍬' :
                   plant.variant === 'thunder' ? '⚡' :
                   plant.variant === 'lunar' ? '🌙' :
                   plant.variant === 'golden' ? '✨' :
                   plant.variant === 'rainbow' ? '🌈' :
                   '🌱'}
                </span>
              </div>
              {/* Variant soil mound */}
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 rounded-t-full"
                style={{
                  background: plant.variant === 'frost' 
                    ? 'radial-gradient(ellipse at center, #E0F2FE, #BAE6FD)'
                    : plant.variant === 'candy'
                    ? 'radial-gradient(ellipse at center, #FCE7F3, #FBCFE8)'
                    : 'radial-gradient(ellipse at center, #3E2723, #2E1A17)',
                  opacity: 0.8
                }}
              />
            </div>
          );
        case 'growing':
          return (
            <div className="relative w-full h-full">
              {/* Medium plant with variant effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className={plant.variant === 'frost' ? 'text-cyan-400' : 
                         plant.variant === 'candy' ? 'text-pink-400' :
                         plant.variant === 'thunder' ? 'text-yellow-400' :
                         plant.variant === 'lunar' ? 'text-purple-400' :
                         plant.variant === 'golden' ? 'text-yellow-300' :
                         plant.variant === 'rainbow' ? 'text-purple-400' :
                         'text-green-600'}
                  style={{ fontSize: size * 0.7 }}
                >
                  {plant.variant === 'frost' ? '🌨️' :
                   plant.variant === 'candy' ? '🧁' :
                   plant.variant === 'thunder' ? '⚡' :
                   plant.variant === 'lunar' ? '🌙' :
                   plant.variant === 'golden' ? '✨' :
                   plant.variant === 'rainbow' ? '🌈' :
                   '🌿'}
                </span>
              </div>
              {/* Variant leaves */}
              {[...Array(2)].map((_, i) => (
                <div 
                  key={i}
                  className={`absolute w-2 h-2 rounded-full opacity-60`}
                  style={{
                    top: `${25 + i * 15}%`,
                    left: `${25 + i * 10}%`,
                    background: plant.variant === 'frost' ? '#67E8F9' :
                             plant.variant === 'candy' ? '#F472B6' :
                             plant.variant === 'thunder' ? '#FCD34D' :
                             plant.variant === 'lunar' ? '#C084FC' :
                             plant.variant === 'golden' ? '#FCD34D' :
                             plant.variant === 'rainbow' ? '#C084FC' :
                             '#22C55E',
                    filter: 'blur(1px)'
                  }}
                />
              ))}
            </div>
          );
        case 'mature':
          return (
            <div className="relative w-full h-full">
              {/* Large plant with variant effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className={plant.variant === 'frost' ? 'text-cyan-500' : 
                         plant.variant === 'candy' ? 'text-pink-500' :
                         plant.variant === 'thunder' ? 'text-yellow-500' :
                         plant.variant === 'lunar' ? 'text-purple-500' :
                         plant.variant === 'golden' ? 'text-yellow-400' :
                         plant.variant === 'rainbow' ? 'text-purple-500' :
                         'text-green-700'}
                  style={{ fontSize: size * 0.8 }}
                >
                  {plant.variant === 'frost' ? '❄️' :
                   plant.variant === 'candy' ? '🍭' :
                   plant.variant === 'thunder' ? '⚡' :
                   plant.variant === 'lunar' ? '🌙' :
                   plant.variant === 'golden' ? '⭐' :
                   plant.variant === 'rainbow' ? '🌈' :
                   '🌾'}
                </span>
              </div>
              {/* More variant leaves */}
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={`absolute w-3 h-3 rounded-full opacity-50`}
                  style={{
                    top: `${20 + i * 10}%`,
                    left: `${20 + i * 8}%`,
                    background: plant.variant === 'frost' ? '#06B6D4' :
                             plant.variant === 'candy' ? '#EC4899' :
                             plant.variant === 'thunder' ? '#F59E0B' :
                             plant.variant === 'lunar' ? '#9333EA' :
                             plant.variant === 'golden' ? '#F59E0B' :
                             plant.variant === 'rainbow' ? '#9333EA' :
                             '#16A34A',
                    filter: 'blur(1px)'
                  }}
                />
              ))}
            </div>
          );
        case 'ready':
          return (
            <div className="relative w-full h-full">
              {/* Ready to harvest - full grown with variant effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className={plant.variant === 'frost' ? 'text-cyan-600' : 
                         plant.variant === 'candy' ? 'text-pink-600' :
                         plant.variant === 'thunder' ? 'text-yellow-600' :
                         plant.variant === 'lunar' ? 'text-purple-600' :
                         plant.variant === 'golden' ? 'text-yellow-500' :
                         plant.variant === 'rainbow' ? 'text-purple-600' :
                         'text-green-800'}
                  style={{ fontSize: size * 0.9 }}
                >
                  {plant.variant === 'frost' ? '🧊' :
                   plant.variant === 'candy' ? '🍬' :
                   plant.variant === 'thunder' ? '⚡' :
                   plant.variant === 'lunar' ? '🌙' :
                   plant.variant === 'golden' ? '⭐' :
                   plant.variant === 'rainbow' ? '🌈' :
                   (plant.icon || '🌻')}
                </span>
              </div>
              {/* Glowing effect for ready plants */}
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: plant.variant === 'frost' ? 'radial-gradient(circle at center, rgba(6, 182, 212, 0.3), transparent 70%)' :
                           plant.variant === 'candy' ? 'radial-gradient(circle at center, rgba(236, 72, 153, 0.3), transparent 70%)' :
                           plant.variant === 'thunder' ? 'radial-gradient(circle at center, rgba(245, 158, 11, 0.3), transparent 70%)' :
                           plant.variant === 'lunar' ? 'radial-gradient(circle at center, rgba(147, 51, 234, 0.3), transparent 70%)' :
                           plant.variant === 'golden' ? 'radial-gradient(circle at center, rgba(245, 158, 11, 0.3), transparent 70%)' :
                           plant.variant === 'rainbow' ? 'radial-gradient(circle at center, rgba(147, 51, 234, 0.3), transparent 70%)' :
                           'radial-gradient(circle at center, rgba(34, 197, 94, 0.3), transparent 70%)',
                  filter: 'blur(8px)'
                }}
              />
              {/* Decorative elements */}
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={`absolute w-4 h-4 rounded-full opacity-40`}
                  style={{
                    top: `${15 + i * 8}%`,
                    left: `${15 + i * 6}%`,
                    background: plant.variant === 'frost' ? '#0891B2' :
                             plant.variant === 'candy' ? '#DB2777' :
                             plant.variant === 'thunder' ? '#D97706' :
                             plant.variant === 'lunar' ? '#7C3AED' :
                             plant.variant === 'golden' ? '#D97706' :
                             plant.variant === 'rainbow' ? '#7C3AED' :
                             '#15803D',
                    filter: 'blur(2px)'
                  }}
                />
              ))}
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Weather effects overlay */}
        {currentWeather !== 'normal' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {currentWeather === 'rainy' && (
              <>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`rain-${i}`}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
                    style={{
                      left: `${10 + (i * 12)}%`,
                      animation: `fall ${3 + Math.random() * 2}s linear infinite`,
                      animationDelay: `${Math.random() * 3}s`
                    }}
                  />
                ))}
              </>
            )}
            {currentWeather === 'frozen' && (
              <>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`frost-${i}`}
                    className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-40"
                    style={{
                      left: `${15 + (i * 15)}%`,
                      animation: `fall ${4 + Math.random() * 2}s linear infinite`,
                      animationDelay: `${Math.random() * 4}s`
                    }}
                  />
                ))}
              </>
            )}
            {currentWeather === 'candy' && (
              <>
                {[...Array(7)].map((_, i) => (
                  <div
                    key={`candy-${i}`}
                    className="absolute w-1 h-1 bg-pink-400 rounded-full opacity-50"
                    style={{
                      left: `${12 + (i * 13)}%`,
                      animation: `fall ${3.5 + Math.random() * 2}s linear infinite`,
                      animationDelay: `${Math.random() * 3.5}s`
                    }}
                  />
                ))}
              </>
            )}
            {currentWeather === 'thunder' && (
              <>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={`thunder-${i}`}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-60"
                    style={{
                      left: `${20 + (i * 16)}%`,
                      animation: `fall ${2 + Math.random() * 1.5}s linear infinite`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </>
            )}
            {currentWeather === 'lunar' && (
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={`lunar-${i}`}
                    className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-40"
                    style={{
                      left: `${25 + (i * 18)}%`,
                      animation: `fall ${5 + Math.random() * 2}s linear infinite`,
                      animationDelay: `${Math.random() * 5}s`
                    }}
                  />
                ))}
              </>
            )}
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes fall {
                  from {
                    transform: translateY(-20px);
                  }
                  to {
                    transform: translateY(${garden.height + 20}px);
                  }
                }
              `
            }} />
          </div>
        )}

        {/* Weather corner display */}
        {currentWeather !== 'normal' && (
          <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getWeatherInfo().icon}</span>
              <span className={`text-xs font-medium ${getWeatherInfo().color}`}>
                {getWeatherInfo().name}
              </span>
            </div>
          </div>
        )}

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

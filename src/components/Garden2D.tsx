import React from 'react';
import { Droplets } from 'lucide-react';

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

interface Garden2DProps {
  plots: Plot[];
  selectedSeed: { id: string; name: string; icon: string } | null;
  onPlotClick: (plotId: string, action: 'plant' | 'water' | 'harvest') => void;
  formatTime: (ms: number) => string;
}

// Cartoonish plant SVG components for each seed type at different growth stages
const PlantVisual = ({ 
  seedType, 
  progress, 
  variant, 
  isWilted 
}: { 
  seedType: string; 
  progress: number; 
  variant: 'normal' | 'golden' | 'rainbow';
  isWilted: boolean;
}) => {
  const stage = progress < 0.33 ? 'sprout' : progress < 0.66 ? 'growing' : progress < 1 ? 'mature' : 'ready';
  const scale = 0.5 + progress * 0.5;
  
  // Get variant colors
  const getVariantFilter = () => {
    if (variant === 'golden') return 'sepia(100%) saturate(300%) hue-rotate(10deg) brightness(1.1)';
    if (variant === 'rainbow') return 'saturate(200%) hue-rotate(90deg)';
    return 'none';
  };
  
  const wiltRotate = isWilted ? 'rotate(-15deg)' : '';
  const wiltOpacity = isWilted ? 0.7 : 1;

  const renderPlant = () => {
    switch (seedType) {
      case 'Radish':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="70" rx="8" ry="4" fill="#8B4513" />
                <path d="M30 70 Q30 60 28 55 Q32 60 30 70" fill="#22c55e" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="70" rx="10" ry="5" fill="#8B4513" />
                <ellipse cx="30" cy="65" rx="8" ry="12" fill="#ef4444" />
                <path d="M25 50 Q30 35 35 50" fill="#22c55e" strokeWidth="2" />
                <path d="M28 45 Q22 30 18 35" fill="#22c55e" />
                <path d="M32 45 Q38 30 42 35" fill="#22c55e" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="72" rx="12" ry="6" fill="#8B4513" />
                <ellipse cx="30" cy="58" rx="12" ry="18" fill="#ef4444" />
                <ellipse cx="28" cy="52" rx="3" ry="4" fill="#fca5a5" opacity="0.5" />
                <path d="M22 40 Q30 20 38 40" fill="#22c55e" />
                <path d="M26 35 Q18 15 12 25" fill="#22c55e" />
                <path d="M34 35 Q42 15 48 25" fill="#22c55e" />
                {stage === 'ready' && <circle cx="45" cy="25" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );
      
      case 'Lettuce':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="8" ry="4" fill="#8B4513" />
                <ellipse cx="30" cy="65" rx="6" ry="8" fill="#86efac" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="72" rx="12" ry="5" fill="#8B4513" />
                <ellipse cx="30" cy="55" rx="15" ry="18" fill="#86efac" />
                <ellipse cx="25" cy="50" rx="8" ry="12" fill="#4ade80" />
                <ellipse cx="35" cy="50" rx="8" ry="12" fill="#4ade80" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="74" rx="14" ry="6" fill="#8B4513" />
                <ellipse cx="30" cy="50" rx="22" ry="25" fill="#86efac" />
                <ellipse cx="22" cy="45" rx="10" ry="15" fill="#4ade80" />
                <ellipse cx="38" cy="45" rx="10" ry="15" fill="#4ade80" />
                <ellipse cx="30" cy="40" rx="8" ry="12" fill="#22c55e" />
                <path d="M20 35 Q30 20 40 35" fill="#bbf7d0" opacity="0.6" />
                {stage === 'ready' && <circle cx="45" cy="25" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Carrot':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="70" rx="8" ry="4" fill="#8B4513" />
                <path d="M28 70 L28 60 M30 70 L30 58 M32 70 L32 60" stroke="#22c55e" strokeWidth="2" fill="none" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="68" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 70 L30 75 L28 80" stroke="#f97316" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M25 55 Q30 40 35 55 M22 50 Q30 30 38 50" stroke="#22c55e" strokeWidth="2" fill="#22c55e" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="55" rx="12" ry="6" fill="#8B4513" />
                <path d="M30 55 Q32 70 30 85 Q28 70 30 55" fill="#f97316" />
                <ellipse cx="30" cy="58" rx="8" ry="5" fill="#fb923c" />
                <path d="M20 40 Q30 15 40 40" fill="#22c55e" />
                <path d="M22 35 Q25 20 30 25 Q35 20 38 35" fill="#4ade80" />
                <path d="M25 30 Q20 15 15 20" fill="#22c55e" />
                <path d="M35 30 Q40 15 45 20" fill="#22c55e" />
                {stage === 'ready' && <circle cx="45" cy="20" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Tomato':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="8" ry="4" fill="#8B4513" />
                <path d="M30 72 L30 58" stroke="#22c55e" strokeWidth="3" />
                <ellipse cx="26" cy="56" rx="5" ry="3" fill="#22c55e" />
                <ellipse cx="34" cy="56" rx="5" ry="3" fill="#22c55e" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 72 L30 50" stroke="#22c55e" strokeWidth="3" />
                <circle cx="30" cy="60" r="8" fill="#fca5a5" />
                <path d="M25 48 Q30 38 35 48" fill="#22c55e" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="74" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 74 L30 48" stroke="#22c55e" strokeWidth="3" />
                <circle cx="30" cy="55" r="14" fill="#ef4444" />
                <ellipse cx="26" cy="50" rx="4" ry="3" fill="#fca5a5" opacity="0.5" />
                <path d="M24 42 L30 38 L36 42 M27 40 L30 35 L33 40" fill="#22c55e" />
                {stage === 'ready' && <circle cx="48" cy="45" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Potato':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="70" rx="12" ry="6" fill="#8B4513" />
                <path d="M28 68 L28 60 M32 68 L32 58" stroke="#22c55e" strokeWidth="2" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="68" rx="14" ry="8" fill="#8B4513" />
                <ellipse cx="32" cy="72" rx="8" ry="6" fill="#d4a574" />
                <path d="M25 55 Q30 40 35 55" fill="#22c55e" />
                <path d="M22 50 L28 45 M32 45 L38 50" stroke="#22c55e" strokeWidth="2" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="65" rx="16" ry="10" fill="#8B4513" />
                <ellipse cx="28" cy="70" rx="10" ry="8" fill="#d4a574" />
                <ellipse cx="35" cy="72" rx="8" ry="6" fill="#c9956c" />
                <circle cx="25" cy="68" r="2" fill="#8B4513" />
                <circle cx="32" cy="73" r="1.5" fill="#8B4513" />
                <path d="M20 45 Q30 25 40 45" fill="#22c55e" />
                <path d="M24 40 Q30 30 36 40" fill="#4ade80" />
                {stage === 'ready' && <circle cx="45" cy="35" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Corn':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="8" ry="4" fill="#8B4513" />
                <path d="M30 72 L30 55 L25 50 M30 55 L35 50" stroke="#22c55e" strokeWidth="2" fill="none" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 72 L30 35" stroke="#22c55e" strokeWidth="4" />
                <path d="M30 50 Q15 45 10 50 M30 40 Q45 35 50 40" stroke="#22c55e" strokeWidth="2" fill="none" />
                <ellipse cx="32" cy="55" rx="5" ry="10" fill="#fde047" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="74" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 74 L30 20" stroke="#22c55e" strokeWidth="5" />
                <path d="M30 55 Q10 50 5 55 M30 40 Q50 35 55 40 M30 25 Q10 20 5 25" stroke="#22c55e" strokeWidth="3" fill="none" />
                <ellipse cx="35" cy="50" rx="8" ry="15" fill="#fde047" />
                <path d="M30 35 Q38 33 40 38 Q42 33 35 30" fill="#22c55e" />
                {[0,1,2,3,4,5].map(i => (
                  <circle key={i} cx={33 + (i % 2) * 4} cy={42 + i * 4} r="2" fill="#eab308" />
                ))}
                {stage === 'ready' && <circle cx="48" cy="35" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Pumpkin':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 72 Q28 65 30 60 Q32 55 28 50" stroke="#22c55e" strokeWidth="3" fill="none" />
                <ellipse cx="25" cy="50" rx="6" ry="4" fill="#22c55e" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="70" rx="14" ry="6" fill="#8B4513" />
                <ellipse cx="30" cy="62" rx="12" ry="10" fill="#fb923c" />
                <path d="M30 52 L30 45 Q25 40 20 42" stroke="#22c55e" strokeWidth="2" fill="none" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="72" rx="16" ry="7" fill="#8B4513" />
                <ellipse cx="30" cy="58" rx="20" ry="16" fill="#f97316" />
                <path d="M20 58 Q18 50 20 42 Q22 50 20 58" fill="#ea580c" />
                <path d="M30 58 Q28 48 30 40 Q32 48 30 58" fill="#ea580c" />
                <path d="M40 58 Q38 50 40 42 Q42 50 40 58" fill="#ea580c" />
                <rect x="28" y="38" width="4" height="8" rx="1" fill="#22c55e" />
                <path d="M32 42 Q40 38 45 42" stroke="#22c55e" strokeWidth="2" fill="none" />
                {stage === 'ready' && <circle cx="50" cy="45" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Strawberry':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="8" ry="4" fill="#8B4513" />
                <path d="M30 72 L30 60" stroke="#22c55e" strokeWidth="2" />
                <circle cx="30" cy="58" r="4" fill="#86efac" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 72 L30 55" stroke="#22c55e" strokeWidth="2" />
                <path d="M30 45 Q22 50 22 60 Q30 68 38 60 Q38 50 30 45" fill="#fca5a5" />
                <path d="M26 43 L30 38 L34 43" fill="#22c55e" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="74" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 74 L30 52" stroke="#22c55e" strokeWidth="2" />
                <path d="M30 40 Q18 48 18 62 Q30 75 42 62 Q42 48 30 40" fill="#ef4444" />
                <path d="M23 38 L30 30 L37 38 M26 36 L30 32 L34 36" fill="#22c55e" />
                {[0,1,2,3,4,5,6].map(i => (
                  <ellipse key={i} cx={25 + (i % 3) * 5} cy={50 + Math.floor(i / 3) * 8} rx="1.5" ry="2" fill="#fde047" />
                ))}
                {stage === 'ready' && <circle cx="45" cy="40" r="5" fill="#fbbf24" className="animate-pulse" />}
              </>
            )}
          </svg>
        );

      case 'Golden Apple':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="8" ry="4" fill="#8B4513" />
                <path d="M30 72 L30 60" stroke="#92400e" strokeWidth="3" />
                <ellipse cx="26" cy="58" rx="5" ry="3" fill="#22c55e" />
                <ellipse cx="34" cy="58" rx="5" ry="3" fill="#22c55e" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 72 L30 55" stroke="#92400e" strokeWidth="3" />
                <circle cx="30" cy="60" r="10" fill="#fde047" />
                <ellipse cx="33" cy="48" rx="4" ry="3" fill="#22c55e" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="74" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 74 L30 50" stroke="#92400e" strokeWidth="3" />
                <circle cx="30" cy="55" r="14" fill="#fbbf24" />
                <ellipse cx="25" cy="50" rx="5" ry="3" fill="#fef08a" opacity="0.6" />
                <rect x="29" y="38" width="3" height="6" rx="1" fill="#92400e" />
                <ellipse cx="36" cy="42" rx="5" ry="3" fill="#22c55e" />
                {stage === 'ready' && (
                  <>
                    <circle cx="48" cy="45" r="6" fill="#fbbf24" className="animate-pulse" />
                    <circle cx="30" cy="55" r="16" fill="none" stroke="#fef08a" strokeWidth="2" className="animate-pulse" opacity="0.5" />
                  </>
                )}
              </>
            )}
          </svg>
        );

      case 'Dragon Fruit':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            {stage === 'sprout' && (
              <>
                <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
                <path d="M30 72 L30 58 M25 70 L25 62 M35 70 L35 62" stroke="#22c55e" strokeWidth="2" />
              </>
            )}
            {stage === 'growing' && (
              <>
                <ellipse cx="30" cy="72" rx="12" ry="5" fill="#8B4513" />
                <ellipse cx="30" cy="58" rx="10" ry="14" fill="#ec4899" />
                <path d="M22 55 L20 45 M30 48 L30 38 M38 55 L40 45" stroke="#22c55e" strokeWidth="2" />
              </>
            )}
            {(stage === 'mature' || stage === 'ready') && (
              <>
                <ellipse cx="30" cy="74" rx="12" ry="6" fill="#8B4513" />
                <ellipse cx="30" cy="55" rx="14" ry="20" fill="#ec4899" />
                <path d="M18 58 L12 42" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
                <path d="M24 48 L20 32" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
                <path d="M30 45 L30 25" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
                <path d="M36 48 L40 32" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
                <path d="M42 58 L48 42" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="26" cy="52" rx="3" ry="4" fill="#f9a8d4" opacity="0.5" />
                {stage === 'ready' && (
                  <>
                    <circle cx="50" cy="40" r="5" fill="#fbbf24" className="animate-pulse" />
                    <circle cx="30" cy="55" r="16" fill="none" stroke="#f472b6" strokeWidth="2" className="animate-pulse" opacity="0.5" />
                  </>
                )}
              </>
            )}
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 60 80" className="w-full h-full" style={{ filter: getVariantFilter(), opacity: wiltOpacity, transform: wiltRotate }}>
            <ellipse cx="30" cy="72" rx="10" ry="5" fill="#8B4513" />
            <path d="M30 72 L30 50" stroke="#22c55e" strokeWidth="3" />
            <circle cx="30" cy="45" r="10" fill="#22c55e" />
          </svg>
        );
    }
  };

  return (
    <div className="relative" style={{ transform: `scale(${scale})`, transition: 'transform 0.3s ease' }}>
      {renderPlant()}
    </div>
  );
};

// Single pot component
function PlotPot({
  plot,
  selectedSeed,
  onPlotClick,
  formatTime,
  index,
}: {
  plot: Plot;
  selectedSeed: Garden2DProps['selectedSeed'];
  onPlotClick: Garden2DProps['onPlotClick'];
  formatTime: (ms: number) => string;
  index: number;
}) {
  const now = Date.now();
  const plant = plot.plant;
  const isReady = plant && now - plant.plantedAt >= plant.growthTimeMs;
  const progress = plant ? Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs) : 0;
  const timeLeft = plant ? Math.max(0, plant.growthTimeMs - (now - plant.plantedAt)) : 0;

  const handleClick = () => {
    if (!plant && selectedSeed) {
      onPlotClick(plot.id, 'plant');
    } else if (plant && !isReady) {
      onPlotClick(plot.id, 'water');
    } else if (plant && isReady) {
      onPlotClick(plot.id, 'harvest');
    }
  };

  const getPotBorderColor = () => {
    if (isReady) return 'border-green-400 shadow-green-400/30';
    if (plant) return 'border-amber-700';
    if (selectedSeed) return 'border-green-500 shadow-green-500/20';
    return 'border-stone-500';
  };

  const getPotBgColor = () => {
    if (isReady) return 'from-green-900/40 to-green-800/20';
    if (plant) return 'from-amber-900/40 to-amber-800/20';
    if (selectedSeed) return 'from-green-900/30 to-green-800/10';
    return 'from-stone-800/40 to-stone-700/20';
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex flex-col items-center justify-end
        w-28 h-36 sm:w-32 sm:h-40 md:w-36 md:h-44
        rounded-[2rem] rounded-b-[3rem]
        border-4 ${getPotBorderColor()}
        bg-gradient-to-b ${getPotBgColor()}
        cursor-pointer
        transition-all duration-300
        hover:scale-105 hover:shadow-xl
        ${isReady ? 'animate-pulse shadow-lg' : ''}
      `}
    >
      {/* Pot label */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Pot {index + 1}
      </div>

      {/* Plant area */}
      <div className="flex-1 flex items-end justify-center pb-2 w-full overflow-hidden">
        {plant ? (
          <div className="w-20 h-24 sm:w-24 sm:h-28">
            <PlantVisual
              seedType={plant.seedType}
              progress={progress}
              variant={plant.variant}
              isWilted={plant.isWilted}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground/50">
            {selectedSeed ? (
              <div className="text-2xl animate-bounce">{selectedSeed.icon}</div>
            ) : (
              <span className="text-xs">Empty</span>
            )}
          </div>
        )}
      </div>

      {/* Soil effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 rounded-b-[2.5rem] bg-gradient-to-t from-amber-900/60 to-transparent" />

      {/* Wilt indicator */}
      {plant?.isWilted && (
        <div className="absolute top-4 right-2 text-blue-400 animate-bounce">
          <Droplets className="w-5 h-5" />
        </div>
      )}

      {/* Progress bar */}
      {plant && !isReady && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 sm:w-24">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="text-center text-[10px] text-muted-foreground mt-0.5">
            {formatTime(timeLeft)}
          </div>
        </div>
      )}

      {/* Ready indicator */}
      {isReady && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center">
          <span className="text-xs font-bold text-green-400 animate-pulse">
            ✓ Ready!
          </span>
        </div>
      )}

      {/* Plant info tooltip on hover */}
      {plant && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3 w-48 text-xs">
            <div className="font-bold mb-2 flex items-center gap-1">
              <span>{plant.icon}</span>
              <span>{plant.seedType}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Growth:</span>
                <span>{formatTime(timeLeft)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{plant.sizeKg.toFixed(1)}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value:</span>
                <span>{plant.sellPrice} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className={`capitalize ${plant.variant === 'golden' ? 'text-yellow-500' : plant.variant === 'rainbow' ? 'text-purple-500' : ''}`}>
                  {plant.variant}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={plant.isWilted ? 'text-red-500' : 'text-green-500'}>
                  {plant.isWilted ? 'Wilting' : 'Healthy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click hint for empty + selected */}
      {!plant && selectedSeed && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-green-400">
          Click to plant
        </div>
      )}
    </div>
  );
}

export default function Garden2D({ plots, selectedSeed, onPlotClick, formatTime }: Garden2DProps) {
  // Calculate grid layout based on number of plots
  const gridCols = plots.length <= 3 ? plots.length : plots.length <= 6 ? 3 : 4;
  
  return (
    <div className="w-full py-6 px-4">
      <div 
        className="flex flex-wrap justify-center gap-6 sm:gap-8"
        style={{ maxWidth: `${gridCols * 160}px`, margin: '0 auto' }}
      >
        {plots.map((plot, index) => (
          <PlotPot
            key={plot.id}
            plot={plot}
            selectedSeed={selectedSeed}
            onPlotClick={onPlotClick}
            formatTime={formatTime}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

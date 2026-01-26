import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

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

interface Garden3DProps {
  plots: Plot[];
  selectedSeed: { id: string; name: string; icon: string } | null;
  onPlotClick: (plotId: string, action: 'plant' | 'water' | 'harvest') => void;
  formatTime: (ms: number) => string;
}

function PlantPot({ 
  position, 
  plot, 
  selectedSeed, 
  onPlotClick, 
  formatTime,
  index 
}: { 
  position: [number, number, number]; 
  plot: Plot; 
  selectedSeed: Garden3DProps['selectedSeed'];
  onPlotClick: Garden3DProps['onPlotClick'];
  formatTime: (ms: number) => string;
  index: number;
}) {
  const potRef = useRef<THREE.Group>(null);
  const plantRef = useRef<THREE.Group>(null);
  const now = Date.now();
  
  const plant = plot.plant;
  const isReady = plant && now - plant.plantedAt >= plant.growthTimeMs;
  const progress = plant ? Math.min(1, (now - plant.plantedAt) / plant.growthTimeMs) : 0;
  const timeLeft = plant ? Math.max(0, plant.growthTimeMs - (now - plant.plantedAt)) : 0;

  // Animate plant growth
  useFrame((state) => {
    if (plantRef.current && plant) {
      const scale = 0.3 + progress * 0.7;
      plantRef.current.scale.setScalar(scale);
      
      // Gentle sway animation
      plantRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
    }
    
    // Hover effect for pot
    if (potRef.current) {
      potRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index * 0.5) * 0.02;
    }
  });

  const handleClick = () => {
    if (!plant && selectedSeed) {
      onPlotClick(plot.id, 'plant');
    } else if (plant && !isReady) {
      onPlotClick(plot.id, 'water');
    } else if (plant && isReady) {
      onPlotClick(plot.id, 'harvest');
    }
  };

  // Get plant color based on variant
  const plantColor = useMemo(() => {
    if (!plant) return '#22c55e';
    if (plant.variant === 'rainbow') return '#f472b6';
    if (plant.variant === 'golden') return '#fbbf24';
    return '#22c55e';
  }, [plant?.variant]);

  const potColor = useMemo(() => {
    if (isReady) return '#22c55e';
    if (plant) return '#92400e';
    if (selectedSeed) return '#65a30d';
    return '#78716c';
  }, [isReady, plant, selectedSeed]);

  return (
    <group ref={potRef} position={position} onClick={handleClick}>
      {/* Pot base */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.4, 0.6, 32]} />
        <meshStandardMaterial color={potColor} roughness={0.8} />
      </mesh>
      
      {/* Pot rim */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.5, 0.1, 32]} />
        <meshStandardMaterial color={potColor} roughness={0.7} />
      </mesh>
      
      {/* Soil */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.2, 32]} />
        <meshStandardMaterial color="#3d2914" roughness={1} />
      </mesh>

      {/* Plant */}
      {plant && (
        <group ref={plantRef} position={[0, 0.5, 0]}>
          {/* Stem */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#166534" />
          </mesh>
          
          {/* Leaves / Top */}
          <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={plantColor} />
          </mesh>
          
          {/* Additional leaves */}
          <mesh position={[-0.15, 0.5, 0]} rotation={[0, 0, -0.5]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={plantColor} />
          </mesh>
          <mesh position={[0.15, 0.5, 0]} rotation={[0, 0, 0.5]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={plantColor} />
          </mesh>

          {/* Ready indicator */}
          {isReady && (
            <mesh position={[0, 1.1, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
            </mesh>
          )}
        </group>
      )}

      {/* Empty pot indicator */}
      {!plant && selectedSeed && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#65a30d" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Wilt indicator */}
      {plant?.isWilted && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.3}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
        >
          💧
        </Text>
      )}

      {/* Progress bar background */}
      {plant && !isReady && (
        <group position={[0, -0.5, 0.6]}>
          <RoundedBox args={[0.8, 0.1, 0.05]} radius={0.02}>
            <meshStandardMaterial color="#374151" />
          </RoundedBox>
          <RoundedBox 
            args={[0.75 * progress, 0.08, 0.06]} 
            radius={0.02}
            position={[(0.75 * progress - 0.75) / 2, 0, 0.01]}
          >
            <meshStandardMaterial color="#22c55e" />
          </RoundedBox>
        </group>
      )}

      {/* Status text */}
      <Text
        position={[0, -0.7, 0.5]}
        fontSize={0.15}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        {plant ? (isReady ? '✓ Ready!' : formatTime(timeLeft)) : (selectedSeed ? 'Click to plant' : 'Empty')}
      </Text>

      {/* Pot label */}
      <Text
        position={[0, -0.9, 0.5]}
        fontSize={0.12}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Pot {index + 1}
      </Text>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#1a1a2e" />
    </mesh>
  );
}

function Scene({ plots, selectedSeed, onPlotClick, formatTime }: Garden3DProps) {
  // Position 3 pots evenly spaced
  const potPositions: [number, number, number][] = [
    [-2.5, 0, 0],
    [0, 0, 0],
    [2.5, 0, 0],
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#60a5fa" />
      
      <Ground />
      
      {plots.slice(0, 3).map((plot, index) => (
        <PlantPot
          key={plot.id}
          position={potPositions[index]}
          plot={plot}
          selectedSeed={selectedSeed}
          onPlotClick={onPlotClick}
          formatTime={formatTime}
          index={index}
        />
      ))}
      
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
      />
    </>
  );
}

export default function Garden3D({ plots, selectedSeed, onPlotClick, formatTime }: Garden3DProps) {
  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas
        shadows
        camera={{ position: [0, 4, 6], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene 
          plots={plots} 
          selectedSeed={selectedSeed} 
          onPlotClick={onPlotClick}
          formatTime={formatTime}
        />
      </Canvas>
    </div>
  );
}

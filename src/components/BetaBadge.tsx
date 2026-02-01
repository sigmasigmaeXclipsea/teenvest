import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BetaBadgeProps {
  variant?: 'default' | 'subtle' | 'prominent';
  className?: string;
}

export default function BetaBadge({ variant = 'subtle', className = '' }: BetaBadgeProps) {
  const baseClasses = "font-medium";
  
  const variants = {
    default: "bg-yellow-100 text-yellow-800 border-yellow-200",
    subtle: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 transition-colors",
    prominent: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg"
  };

  return (
    <Badge 
      variant="outline" 
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
      BETA
    </Badge>
  );
}

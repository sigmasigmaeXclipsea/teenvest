<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const BetaBadge = () => {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('teenvest-beta-dismissed');
    if (!wasDismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('teenvest-beta-dismissed', 'true');
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div 
      className={cn(
        "fixed top-20 right-4 z-40 transition-all duration-300",
        dismissed ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
      )}
    >
      <div className="flex items-center gap-2 bg-muted/90 backdrop-blur-sm text-muted-foreground border border-border px-3 py-1.5 rounded-md shadow-sm text-xs">
        <span className="font-medium">Beta Version</span>
        <button
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-accent transition-colors"
          aria-label="Dismiss beta badge"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default BetaBadge;
=======
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
>>>>>>> 633b361 (Add beta badge, VS tournament sidebar, and feedback system)

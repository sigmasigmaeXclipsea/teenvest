import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function BetaBadge() {
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
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        dismissed ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
      }`}
    >
      <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-md shadow-sm text-xs font-medium hover:bg-yellow-100 transition-colors">
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>BETA</span>
        <button
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-yellow-200 transition-colors"
          aria-label="Dismiss beta badge"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

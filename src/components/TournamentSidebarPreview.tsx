import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TournamentSidebarPreview({ sidebarExpanded }: { sidebarExpanded: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Tournament Preview Section */}
      <div className="px-2 py-2">
        <div
          onClick={() => setShowModal(true)}
          className={cn(
            "relative overflow-hidden rounded-xl cursor-pointer",
            "transform transition-all duration-200 hover:scale-[1.02]",
            "bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600",
            "hover:shadow-lg group"
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -mr-8 -mt-8" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full -ml-6 -mb-6" />
          </div>
          
          <div className="relative z-10 p-3">
            {/* VS Symbol and Icon */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-black text-white tracking-wider">
                    VS
                  </span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                    "bg-white/20 text-white",
                    sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                  )}>
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                    SOON
                  </span>
                </div>
                
                <p className={cn(
                  "text-white/90 text-sm font-medium truncate",
                  sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}>
                  Tournaments
                </p>
              </div>
            </div>
            
            {/* Hover Hint - Only show when expanded */}
            {sidebarExpanded && (
              <div className="mt-2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                Click for details →
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Content */}
            <div className="text-center">
              {/* Large VS Symbol */}
              <div className="text-6xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                ⚡ VS
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                Trading Tournaments
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Compete against friends and other traders in exciting tournaments! 
                Win prizes and prove your trading skills.
              </p>
              
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-sm font-medium">Private Tournaments</div>
                  <div className="text-xs text-muted-foreground">
                    Play with friends
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-sm font-medium">Public Competitions</div>
                  <div className="text-xs text-muted-foreground">
                    Win amazing prizes
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-sm font-medium">Custom Balances</div>
                  <div className="text-xs text-muted-foreground">
                    $5K to $100K tournaments
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-sm font-medium">Real-Time Trading</div>
                  <div className="text-xs text-muted-foreground">
                    Live leaderboards
                  </div>
                </div>
              </div>
              
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 rounded-full px-4 py-2 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                COMING SOON
              </div>
              
              <p className="text-xs text-muted-foreground">
                Be the first to know when tournaments launch!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TournamentSidebarPreview({ sidebarExpanded }: { sidebarExpanded: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Tournament Preview Section - Matches sidebar style exactly */}
      <div className="px-2 py-2">
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            "flex items-center h-11 rounded-xl overflow-hidden w-full",
            "transition-colors duration-150",
            "px-3 min-w-[44px]",
            "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700",
            "transform transition-all duration-200 hover:scale-[1.02]"
          )}
        >
          <Zap className="w-5 h-5 shrink-0" />
          <span 
            className={cn(
              "ml-3 text-sm font-medium whitespace-nowrap overflow-hidden",
              "transition-opacity duration-150",
              sidebarExpanded ? "opacity-100" : "opacity-0 w-0 ml-0"
            )}
          >
            VS Tournaments
          </span>
          {sidebarExpanded && (
            <span className="ml-auto">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                SOON
              </span>
            </span>
          )}
        </button>
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

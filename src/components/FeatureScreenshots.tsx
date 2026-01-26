import React from 'react';
import { Sprout, Play, Headphones, Coins, Zap, BookOpen } from 'lucide-react';

export const GardenGameScreenshot = () => (
  <div className="w-full h-64 bg-gradient-to-b from-sky-100 to-green-50 rounded-lg overflow-hidden border-2 border-green-200">
    <div className="p-4 bg-white/80 backdrop-blur border-b border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-600" />
          <span className="font-bold text-sm">Learning Garden</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-600" />
            <span className="font-semibold">250</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="font-semibold">150</span>
          </div>
        </div>
      </div>
    </div>
    <div className="p-4">
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`aspect-square rounded-lg border-2 ${i % 3 === 0 ? 'bg-green-100 border-green-400' : i % 3 === 1 ? 'bg-yellow-100 border-yellow-400' : 'bg-blue-100 border-blue-400'} flex items-center justify-center`}>
            {i % 3 === 0 && <span className="text-2xl">🌱</span>}
            {i % 3 === 1 && <span className="text-2xl">🌻</span>}
            {i % 3 === 2 && <span className="text-2xl">🍅</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs font-semibold text-green-600 mb-1">🌱 Radish</div>
          <div className="text-xs text-gray-600">Ready to harvest!</div>
        </div>
        <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs font-semibold text-blue-600 mb-1">💧 Water</div>
          <div className="text-xs text-gray-600">5 uses left</div>
        </div>
      </div>
    </div>
  </div>
);

export const BeanstalkGameScreenshot = () => (
  <div className="w-full h-64 bg-gradient-to-b from-blue-100 to-green-50 rounded-lg overflow-hidden border-2 border-blue-200">
    <div className="p-4 bg-white/80 backdrop-blur border-b border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-green-600" />
          <span className="font-bold text-sm">Beanstalk Adventure</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Score: 300</div>
          <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Height: 45m</div>
        </div>
      </div>
    </div>
    <div className="p-4">
      <div className="relative h-32 bg-gradient-to-t from-green-300 to-sky-200 rounded-lg mb-3 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 bg-green-600 rounded-t-lg" style={{ height: '60%' }}>
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xl">🌱</div>
        </div>
        <div className="absolute top-2 left-2 bg-white rounded-lg p-2 shadow-lg">
          <div className="text-xs font-bold text-gray-800 mb-1">📚 Question</div>
          <div className="text-xs text-gray-600">What is diversification?</div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-green-100 border border-green-300 rounded-lg p-2 text-center">
          <div className="text-xs font-semibold text-green-700">A) Spread risk</div>
        </div>
        <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-center">
          <div className="text-xs font-semibold text-gray-700">B) Buy high</div>
        </div>
        <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-center">
          <div className="text-xs font-semibold text-gray-700">C) One stock</div>
        </div>
      </div>
    </div>
  </div>
);

export const AIPodcastScreenshot = () => (
  <div className="w-full h-64 bg-gradient-to-b from-purple-100 to-pink-50 rounded-lg overflow-hidden border-2 border-purple-200">
    <div className="p-4 bg-white/80 backdrop-blur border-b border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-purple-600" />
          <span className="font-bold text-sm">AI Investment Podcast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Live</span>
        </div>
      </div>
    </div>
    <div className="p-4">
      <div className="bg-white rounded-lg p-3 mb-3 border border-purple-200">
        <div className="text-sm font-bold text-gray-800 mb-2">🎙️ Episode: "Investing Basics for Teens"</div>
        <div className="text-xs text-gray-600 mb-3">Learn the fundamentals of investing in this AI-generated podcast episode designed specifically for teenage investors.</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-purple-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }}></div>
          </div>
          <span className="text-xs text-gray-600">2:45 / 8:00</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 bg-purple-500 text-white rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1">
          <Play className="w-3 h-3" />
          Play
        </button>
        <button className="bg-gray-200 text-gray-700 rounded-lg py-2 px-3 text-xs font-semibold">
          ⏸️
        </button>
        <button className="bg-gray-200 text-gray-700 rounded-lg py-2 px-3 text-xs font-semibold">
          ⏭️
        </button>
      </div>
    </div>
  </div>
);

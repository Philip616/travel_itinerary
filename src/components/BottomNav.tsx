'use client';

import React from 'react';
import { Calendar, Plane, Building2, Settings } from 'lucide-react';

export type TabType = 'itinerary' | 'flights' | 'accommodations' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export function BottomNav({ currentTab, onSelectTab }: BottomNavProps) {
  const tabs = [
    { id: 'itinerary' as TabType, label: '每日行程', icon: Calendar },
    { id: 'flights' as TabType, label: '航班對照', icon: Plane },
    { id: 'accommodations' as TabType, label: '住宿資訊', icon: Building2 },
    { id: 'settings' as TabType, label: '旅程設定', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

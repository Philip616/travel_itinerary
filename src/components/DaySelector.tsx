'use client';

import React from 'react';
import { ItineraryDay, SpotItem } from '@/types/travel';
import { Calendar } from 'lucide-react';

interface DaySelectorProps {
  days: (ItineraryDay & { spots?: SpotItem[] })[];
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
}

export function DaySelector({ days, selectedDayId, onSelectDay }: DaySelectorProps) {
  return (
    <div className="w-full bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2 shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>行程天數：</span>
          </div>
          {days.map((day) => {
            const isSelected = day.id === selectedDayId;
            const displayDate = day.date ? day.date.slice(5).replace('-', '/') : '';
            const customTheme = day.theme && day.theme !== `第 ${day.day_number} 天行程` ? day.theme : '';

            return (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold scale-[1.02]'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wider">
                  Day {day.day_number}
                </span>

                {customTheme && (
                  <span className={`text-[11px] font-bold max-w-[100px] sm:max-w-[140px] truncate ${
                    isSelected ? 'text-blue-100' : 'text-slate-700'
                  }`}>
                    {customTheme}
                  </span>
                )}

                {displayDate && (
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {displayDate}
                  </span>
                )}

                {day.spots && day.spots.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {day.spots.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

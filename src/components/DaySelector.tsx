'use client';

import React from 'react';
import { ItineraryDay } from '@/types/travel';

interface DaySelectorProps {
  days: ItineraryDay[];
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
}

export function DaySelector({ days, selectedDayId, onSelectDay }: DaySelectorProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 px-4 bg-white border-b border-slate-200 sticky top-14 z-30 shadow-xs">
      <div className="flex gap-2 min-w-max">
        {days.map((day) => {
          const isSelected = day.id === selectedDayId;
          const displayDate = day.date ? day.date.slice(5).replace('-', '/') : '';
          return (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-medium scale-[1.02]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                Day {day.day_number}
              </span>
              <span className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {displayDate}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

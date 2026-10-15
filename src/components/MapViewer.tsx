'use client';

import React from 'react';
import { SpotItem } from '@/types/travel';
import { MapPin, ExternalLink, Compass, DollarSign, Layers, Navigation, Sparkles } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '@/lib/maps';

interface MapViewerProps {
  activeLocation: string;
  activeTitle: string;
  spots: SpotItem[];
  selectedSpotId?: string;
  onSelectSpot?: (spotId: string) => void;
  accommodationName?: string;
  accommodationAddress?: string;
}

export function MapViewer({
  activeLocation,
  activeTitle,
  spots,
  selectedSpotId,
  onSelectSpot,
  accommodationName,
  accommodationAddress,
}: MapViewerProps) {
  const searchQuery = activeLocation || (spots.length > 0 ? spots[0].title : 'Tokyo');
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const externalMapsUrl = getGoogleMapsSearchUrl(searchQuery);

  const totalCost = spots.reduce((sum, spot) => {
    const cost = spot.cost_estimate ? parseInt(spot.cost_estimate.replace(/[^0-9]/g, ''), 10) : 0;
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-20">
      {/* 頂部導航資訊列 */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/30 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
              即時地圖定位
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate tracking-tight">
            {activeTitle || '當日行程分佈'}
          </h3>
        </div>

        <a
          href={externalMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-2xl transition-all shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>開啟大圖</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {/* 嵌入式互動地圖主體 */}
      <div className="relative flex-1 bg-slate-100 min-h-[340px]">
        <iframe
          title="Google Map Live Companion"
          width="100%"
          height="100%"
          className="w-full h-full border-0"
          loading="lazy"
          src={embedUrl}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* 底部快速切換晶片與即時預算面板 */}
      <div className="p-4 border-t border-slate-100 bg-white/95 space-y-3.5">
        {/* 當日景點導航晶片列 */}
        {spots.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span>點擊地點切換定位視角 ({spots.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
              {spots.map((spot, idx) => {
                const isSelected = spot.id === selectedSpotId;
                return (
                  <button
                    key={spot.id}
                    onClick={() => onSelectSpot && onSelectSpot(spot.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                        : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="max-w-[110px] truncate">{spot.title}</span>
                  </button>
                );
              })}

              {accommodationName && (
                <button
                  onClick={() => onSelectSpot && onSelectSpot('acc')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="max-w-[120px] truncate">🏨 {accommodationName}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 底部數據與費用統計 */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100 text-xs">
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日規劃站點</p>
              <p className="text-sm font-black text-slate-900">{spots.length} 個地點</p>
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">預估總計花費</p>
              <p className="text-sm font-black text-slate-900">
                {totalCost > 0 ? `約 ${totalCost.toLocaleString()} 元` : '未登記費用'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

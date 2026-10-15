'use client';

import React, { useState } from 'react';
import { CategoryType, SpotItem } from '@/types/travel';
import { X, Plus, MapPin } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '@/lib/maps';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayId: string;
  currentMember: string;
  onAddSpot: (spot: Partial<SpotItem>) => void;
}

export function AddSpotModal({
  isOpen,
  onClose,
  dayId,
  currentMember,
  onAddSpot,
}: AddSpotModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('ATTRACTION');
  const [timeSlot, setTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [costEstimate, setCostEstimate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const mapsUrl = getGoogleMapsSearchUrl(`${title.trim()} ${address.trim()}`);

    onAddSpot({
      day_id: dayId,
      title: title.trim(),
      category,
      time_slot: timeSlot.trim() || undefined,
      address: address.trim() || undefined,
      google_map_url: mapsUrl,
      cost_estimate: costEstimate.trim() || undefined,
      created_by: currentMember || '匿名成員',
      votes: [],
      comments: []
    });

    setTitle('');
    setTimeSlot('');
    setAddress('');
    setCostEstimate('');
    onClose();
  };

  const categories: { key: CategoryType; label: string }[] = [
    { key: 'ATTRACTION', label: '景點' },
    { key: 'FOOD', label: '美食' },
    { key: 'SHOPPING', label: '購物' },
    { key: 'TRANSPORT', label: '交通' },
    { key: 'OTHER', label: '其他' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            新增行程景點
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 景點名稱 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              景點／地點名稱 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：SHIBUYA SKY、一蘭拉麵"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 類別選擇 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">類別</label>
            <div className="flex gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    category === c.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 時段與費用預估 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">預估時段</label>
              <input
                type="text"
                placeholder="例如：10:00 - 12:00"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">費用預估 (選填)</label>
              <input
                type="text"
                placeholder="例如：¥2,500 或 $500"
                value={costEstimate}
                onChange={(e) => setCostEstimate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              地址或大地標 (自動產生導航)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="例如：東京都澀谷區2-24-12"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 active:scale-[0.98] transition-all"
            >
              加入當日行程
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

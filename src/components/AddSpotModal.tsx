'use client';

import React, { useState, useEffect } from 'react';
import { CategoryType, SpotItem } from '@/types/travel';
import { X, Plus, MapPin, Camera, Utensils, ShoppingBag, Bus, Sparkles, DollarSign, Clock, Pencil } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '@/lib/maps';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayId: string;
  currentMember: string;
  initialSpot?: SpotItem | null;
  onAddSpot?: (spot: Partial<SpotItem>) => void;
  onUpdateSpot?: (spotId: string, spot: Partial<SpotItem>) => void;
}

export function AddSpotModal({
  isOpen,
  onClose,
  dayId,
  currentMember,
  initialSpot,
  onAddSpot,
  onUpdateSpot,
}: AddSpotModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('ATTRACTION');
  const [timeSlot, setTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [costEstimate, setCostEstimate] = useState('');

  const isEditMode = !!initialSpot;

  useEffect(() => {
    if (initialSpot) {
      setTitle(initialSpot.title || '');
      setCategory(initialSpot.category || 'ATTRACTION');
      setTimeSlot(initialSpot.time_slot || '');
      setAddress(initialSpot.address || '');
      setCostEstimate(initialSpot.cost_estimate || '');
    } else {
      setTitle('');
      setCategory('ATTRACTION');
      setTimeSlot('');
      setAddress('');
      setCostEstimate('');
    }
  }, [initialSpot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const mapsUrl = getGoogleMapsSearchUrl(`${title.trim()} ${address.trim()}`);

    if (isEditMode && initialSpot && onUpdateSpot) {
      onUpdateSpot(initialSpot.id, {
        title: title.trim(),
        category,
        time_slot: timeSlot.trim() || undefined,
        address: address.trim() || undefined,
        google_map_url: mapsUrl,
        cost_estimate: costEstimate.trim() || undefined,
      });
    } else if (onAddSpot) {
      onAddSpot({
        day_id: dayId,
        title: title.trim(),
        category,
        time_slot: timeSlot.trim() || undefined,
        address: address.trim() || undefined,
        google_map_url: mapsUrl,
        cost_estimate: costEstimate.trim() || undefined,
        created_by: currentMember || '匿名旅伴',
        votes: [],
        comments: [],
      });
    }

    onClose();
  };

  const categories: { key: CategoryType; label: string; icon: any; color: string }[] = [
    { key: 'ATTRACTION', label: '熱門景點', icon: Camera, color: 'hover:bg-emerald-50 hover:text-emerald-700' },
    { key: 'FOOD', label: '美食餐廳', icon: Utensils, color: 'hover:bg-amber-50 hover:text-amber-700' },
    { key: 'SHOPPING', label: '購物採買', icon: ShoppingBag, color: 'hover:bg-pink-50 hover:text-pink-700' },
    { key: 'TRANSPORT', label: '交通移動', icon: Bus, color: 'hover:bg-indigo-50 hover:text-indigo-700' },
    { key: 'OTHER', label: '其他備註', icon: Sparkles, color: 'hover:bg-slate-50 hover:text-slate-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
              isEditMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
            }`}>
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {isEditMode ? '修改行程地點資訊' : '新增行程地點'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEditMode ? '更新景點名稱、類別、時間或預算' : '安排當日動線、時段與預估預算'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 景點名稱 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              地點名稱 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：SHIBUYA SKY、一蘭拉麵、淺草寺"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 類別選擇晶片 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">地點類別</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : `bg-slate-50 text-slate-700 border-slate-200/80 ${cat.color}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 時段與預估費用 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                預計時段 <span className="text-slate-400 font-normal">(選填)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="如 14:00 - 16:30"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-medium pl-8"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                預估花費 <span className="text-slate-400 font-normal">(選填)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="如 2,500 日圓"
                  value={costEstimate}
                  onChange={(e) => setCostEstimate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-medium pl-8"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* 地址 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              地址或大地標 <span className="text-slate-400 font-normal">(供地圖精確定位)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="例如：東京都渋谷区渋谷2丁目24-12"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-medium pl-8"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
            </div>
          </div>

          {/* 動作按鈕 */}
          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              {isEditMode ? '儲存修改' : '加入本日行程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

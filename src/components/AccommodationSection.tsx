'use client';

import React, { useState } from 'react';
import { Accommodation } from '@/types/travel';
import { Building2, Plus, Trash2, MapPin, Phone, KeyRound, Calendar, ExternalLink, Moon, Copy, Check } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '@/lib/maps';

interface AccommodationSectionProps {
  accommodations: Accommodation[];
  onAddAccommodation: (acc: Partial<Accommodation>) => void;
  onDeleteAccommodation: (accId: string) => void;
}

export function AccommodationSection({
  accommodations,
  onAddAccommodation,
  onDeleteAccommodation,
}: AccommodationSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [address, setAddress] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const calculateNights = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCopyBooking = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !checkIn || !checkOut) return;

    const mapsUrl = getGoogleMapsSearchUrl(`${name.trim()} ${address.trim()}`);

    onAddAccommodation({
      name: name.trim(),
      check_in: checkIn,
      check_out: checkOut,
      address: address.trim() || undefined,
      google_map_url: mapsUrl,
      booking_ref: bookingRef.trim() || undefined,
      phone: phone.trim() || undefined,
      note: note.trim() || undefined,
    });

    setName('');
    setCheckIn('');
    setCheckOut('');
    setAddress('');
    setBookingRef('');
    setPhone('');
    setNote('');
    setShowAddModal(false);
  };

  return (
    <div className="py-4 space-y-6">
      {/* 頂部介紹列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] tracking-wider uppercase">
              Stay & Lodging
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">旅程住宿預訂管理</h2>
          <p className="text-xs text-slate-500 mt-1">登記每日入住飯店、訂房憑證代號、聯絡電話與一鍵導航地圖</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          登記住宿資訊
        </button>
      </div>

      {/* 飯店卡片網格 */}
      {accommodations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {accommodations.map((acc) => {
            const mapsUrl = acc.google_map_url || getGoogleMapsSearchUrl(`${acc.name} ${acc.address || ''}`);
            const nights = calculateNights(acc.check_in, acc.check_out);

            return (
              <div 
                key={acc.id} 
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3.5">
                      <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                        <Building2 className="w-6 h-6" />
                      </span>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{acc.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {acc.check_in} ~ {acc.check_out}
                          </span>
                          {nights > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full text-xs font-black">
                              <Moon className="w-3 h-3" />
                              {nights} 晚住宿
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteAccommodation(acc.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl transition-colors hover:bg-rose-50 cursor-pointer"
                      title="刪除住宿"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {acc.address && (
                    <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-100 my-3 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{acc.address}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 text-xs">
                    {acc.booking_ref && (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">訂房代號</span>
                          <span className="font-mono font-black text-slate-800 text-xs truncate block">{acc.booking_ref}</span>
                        </div>
                        <button
                          onClick={() => handleCopyBooking(acc.id, acc.booking_ref!)}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="複製訂房代號"
                        >
                          {copiedId === acc.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    {acc.phone && (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">飯店電話</span>
                        <a href={`tel:${acc.phone}`} className="font-bold text-blue-600 hover:underline text-xs block">
                          {acc.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {acc.note && (
                    <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200/70 p-3 rounded-2xl mt-2 leading-relaxed">
                      <span className="font-bold text-amber-800">入住備忘：</span>
                      {acc.note}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-4 py-2 rounded-2xl transition-all shadow-2xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>在 Google 地圖導航</span>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
          目前尚未登記任何住宿飯店，點擊上方按鈕立即新增！
        </div>
      )}

      {/* 新增住宿彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">新增住宿資訊</h3>
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  飯店 / 民宿名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：東京新宿燦路都廣場大飯店"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">入住日期 (Check-in)</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">退房日期 (Check-out)</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">飯店地址</label>
                <input
                  type="text"
                  placeholder="例如：東京都渋谷区代々木2-3-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">訂房代號 (選填)</label>
                  <input
                    type="text"
                    placeholder="Agoda / Booking ID"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">飯店電話</label>
                  <input
                    type="tel"
                    placeholder="+81 3-3375-3211"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">備註資訊 (門禁、行李寄放等)</label>
                <input
                  type="text"
                  placeholder="例如：下午兩點後可寄放行李、附免費早餐"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  儲存住宿
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

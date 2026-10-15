'use client';

import React, { useState } from 'react';
import { Accommodation } from '@/types/travel';
import { Building2, Plus, Trash2, MapPin, Phone, KeyRound, Calendar } from 'lucide-react';
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
  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [address, setAddress] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

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
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">住宿資訊管理</h2>
          <p className="text-xs text-slate-500">入住飯店、訂房代號與一鍵地圖導航</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          新增住宿
        </button>
      </div>

      {accommodations.length > 0 ? (
        accommodations.map((acc) => {
          const mapsUrl = acc.google_map_url || getGoogleMapsSearchUrl(`${acc.name} ${acc.address || ''}`);

          return (
            <div key={acc.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{acc.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{acc.check_in} ~ {acc.check_out}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteAccommodation(acc.id)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {acc.address && (
                <p className="text-xs text-slate-600 my-2 flex items-start gap-1">
                  <span className="font-semibold text-slate-400 shrink-0">地址:</span>
                  <span>{acc.address}</span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl my-2">
                {acc.booking_ref && (
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>訂單號：{acc.booking_ref}</span>
                  </div>
                )}
                {acc.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${acc.phone}`} className="text-blue-600 underline">
                      {acc.phone}
                    </a>
                  </div>
                )}
              </div>

              {acc.note && (
                <p className="text-xs text-slate-500 bg-amber-50 text-amber-900 border border-amber-200/60 p-2 rounded-xl mb-3">
                  備註：{acc.note}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  開啟 Google 地圖導航
                </a>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
          尚未建立住宿地點，點擊右上角新增
        </div>
      )}

      {/* 新增住宿彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">新增住宿資訊</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  飯店／民宿名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：東京新宿燦路都廣場大飯店"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">入住日期</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">退房日期</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">詳細地址</label>
                <input
                  type="text"
                  placeholder="例如：東京都渋谷区代々木2-3-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">訂單編號 / 代碼</label>
                  <input
                    type="text"
                    placeholder="Agoda / Booking ID"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">聯絡電話</label>
                  <input
                    type="text"
                    placeholder="+81 3-3375-3211"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">入住提醒 / 門鎖密碼備註</label>
                <input
                  type="text"
                  placeholder="大門密碼 1234#，可於下午 3 點前寄放行李"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
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

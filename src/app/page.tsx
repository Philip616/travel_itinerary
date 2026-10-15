'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createNewTrip } from '@/lib/supabase';
import { 
  Plane, 
  Plus, 
  ArrowRight, 
  Compass, 
  MapPin, 
  Users, 
  Wifi, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pin, setPin] = useState('');
  const [joinSlug, setJoinSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentTrips, setRecentTrips] = useState<{ slug: string; title: string; date: string }[]>([]);

  useEffect(() => {
    // 預設日期為一週後的五天旅程
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() + 7);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultStart.getDate() + 4);

    setStartDate(defaultStart.toISOString().split('T')[0]);
    setEndDate(defaultEnd.toISOString().split('T')[0]);

    // 讀取最近開啟過的旅程
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('travel_trip_cache_'));
      const list = keys.map((k) => {
        const item = JSON.parse(localStorage.getItem(k) || '{}');
        return {
          slug: item.trip?.slug || k.replace('travel_trip_cache_', ''),
          title: item.trip?.title || '未命名旅程',
          date: item.trip?.start_date ? `${item.trip.start_date} ~ ${item.trip.end_date}` : '',
        };
      }).filter((t) => t.slug);
      setRecentTrips(list);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || pin.length < 4) return;

    setLoading(true);
    const { trip, error } = await createNewTrip(title.trim(), startDate, endDate, pin);

    if (trip) {
      router.push(`/trip/${trip.slug}`);
    } else {
      alert('建立旅程失敗：' + (error || '未知錯誤'));
      setLoading(false);
    }
  };

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSlug.trim()) return;

    // 清理網址，若使用者貼入完整 URL 則提取 slug
    let cleanSlug = joinSlug.trim();
    if (cleanSlug.includes('/trip/')) {
      cleanSlug = cleanSlug.split('/trip/')[1].split('?')[0].split('/')[0];
    }
    router.push(`/trip/${cleanSlug}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 頂部 Hero 區塊 */}
      <header className="bg-gradient-to-b from-blue-600 to-indigo-700 text-white px-6 pt-10 pb-14 rounded-b-[2.5rem] shadow-lg">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Travel Planner</h1>
          <p className="text-blue-100 text-xs leading-relaxed max-w-xs mx-auto">
            免註冊帳號・多人即時協同・手機超省流量・Google 地圖一鍵導航
          </p>
        </div>
      </header>

      {/* 主要操作卡片區 */}
      <main className="max-w-md w-full mx-auto px-4 -mt-8 flex-1 space-y-5 pb-12">
        {/* 建立新旅程卡片 */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-800">建立全新旅程</h2>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                旅程名稱 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例如：2026 東京春櫻漫步五日遊"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">出發日期</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">回程日期</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">主辦人防呆 PIN 碼 (4 位數)</label>
                <span className="text-[10px] text-slate-400">刪除或重大修改時使用</span>
              </div>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="例如：1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-widest font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !title.trim() || pin.length < 4}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>建立中...</span>
              ) : (
                <>
                  <span>立即建立並產生專屬房間連結</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 輸入代碼加入現有旅程 */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80">
          <h3 className="text-xs font-bold text-slate-700 mb-2">加入好友的旅程房間</h3>
          <form onSubmit={handleJoinTrip} className="flex gap-2">
            <input
              type="text"
              placeholder="貼上專屬連結或代碼 (如 tokyo-4x7)"
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
            />
            <button
              type="submit"
              disabled={!joinSlug.trim()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-opacity shrink-0"
            >
              進入
            </button>
          </form>
        </div>

        {/* 最近瀏覽過的旅程快取清單 */}
        {recentTrips.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              最近開啟的旅程 ({recentTrips.length})
            </h3>
            <div className="space-y-2">
              {recentTrips.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => router.push(`/trip/${item.slug}`)}
                  className="w-full bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-blue-400 flex items-center justify-between transition-all text-left group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    {item.date && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.date}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 核心特色微簡介 */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          <div className="bg-white/60 p-3 rounded-2xl border border-slate-200/50">
            <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <h5 className="text-[11px] font-bold text-slate-700">免註冊協同</h5>
            <p className="text-[9px] text-slate-400 mt-0.5">專屬網址點入即用</p>
          </div>
          <div className="bg-white/60 p-3 rounded-2xl border border-slate-200/50">
            <Wifi className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <h5 className="text-[11px] font-bold text-slate-700">離線超省流量</h5>
            <p className="text-[9px] text-slate-400 mt-0.5">弱網斷網依然可讀</p>
          </div>
          <div className="bg-white/60 p-3 rounded-2xl border border-slate-200/50">
            <MapPin className="w-4 h-4 text-rose-500 mx-auto mb-1" />
            <h5 className="text-[11px] font-bold text-slate-700">Google 地圖</h5>
            <p className="text-[9px] text-slate-400 mt-0.5">原生 App 一鍵導航</p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[10px] text-slate-400">
        Travel Planner PWA &copy; 2026 ・ 專為好友出遊設計
      </footer>
    </div>
  );
}

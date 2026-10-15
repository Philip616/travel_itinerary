

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewTrip, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Plus, 
  ArrowRight, 
  Compass, 
  MapPin, 
  Users, 
  Wifi, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  Plane,
  Clock,
  Layers,
  Heart,
  Luggage,
  Building2
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

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

  const handleApplyTemplate = (sampleTitle: string, daysCount: number) => {
    setTitle(sampleTitle);
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + (daysCount - 1));

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    if (!pin) setPin('1234');
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || pin.length < 4) return;

    setLoading(true);
    const { trip, error, isOfflineOnly } = await createNewTrip(title.trim(), startDate, endDate, pin);

    if (trip) {
      if (isOfflineOnly) {
        alert('【重要提醒】目前專案尚未配置 Supabase 雲端資料庫（.env.local 為 placeholder 金鑰）。此房間僅儲存於您當前瀏覽器中，其他裝置或好友無法透過代碼存取！若需多人連線同步，請先配置資料庫金鑰。');
      }
      navigate(`/trip/${trip.slug}`);
    } else {
      alert('建立旅程失敗：' + (error || '未知錯誤'));
      setLoading(false);
    }
  };

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSlug.trim()) return;

    let cleanSlug = joinSlug.trim();
    if (cleanSlug.includes('/trip/')) {
      cleanSlug = cleanSlug.split('/trip/')[1].split('?')[0].split('/')[0];
    }
    navigate(`/trip/${cleanSlug}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-between selection:bg-blue-100">
      {/* 頂部沉浸式 Hero 區塊 */}
      <header className="bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-700 text-white px-6 pt-12 pb-24 sm:pb-28 shadow-lg relative overflow-hidden">
        {/* 背景環境光暈 */}
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-1/4 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl mb-4 shadow-lg ring-1 ring-white/30">
            <Compass className="w-9 h-9 text-white" />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-blue-100 text-xs font-bold backdrop-blur-md border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>2026 好友出遊即時協同規劃利器</span>
            </div>
            {isSupabaseConfigured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-bold backdrop-blur-md border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>雲端資料庫：已連線</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/25 text-amber-200 text-xs font-bold backdrop-blur-md border border-amber-400/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>雲端資料庫：未連線 (離線單機模式)</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-xs">
            Travel Planner
          </h1>

          <p className="text-blue-100 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            免註冊專屬房間・好友即時同步・雙欄互動地圖・航班與住宿一站掌握
          </p>

          {/* 熱門靈感範本快速晶片 */}
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap max-w-2xl">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block sm:inline">
              點擊快速套用靈感：
            </span>
            {[
              { label: '🌸 東京櫻花 5 日遊', days: 5 },
              { label: '🍁 京都古都漫遊 6 日', days: 6 },
              { label: '🏝️ 曼谷放鬆美食 5 日', days: 5 },
              { label: '❄️ 冰島追極光自駕 8 日', days: 8 },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyTemplate(tmpl.label, tmpl.days)}
                className="text-xs bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 主要操作卡片區 */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 flex-1 space-y-8 pb-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左側：建立新旅程 (佔 7 格) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">建立全新旅程</h2>
                <p className="text-xs text-slate-400 mt-0.5">填寫旅程天數，立即獲取專屬免註冊協同房間</p>
              </div>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  旅程主題名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：2026 東京春櫻漫步五日遊"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 text-xs">出發日期</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 text-xs">回程日期</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-800 text-xs">
                    主辦人防呆 PIN 碼 (4 位數字)
                  </label>
                  <span className="text-[11px] text-slate-400">刪除或修改天數時使用</span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="例如：1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-center tracking-widest font-mono text-lg font-black text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim() || pin.length < 4}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>正在建立專屬房間...</span>
                ) : (
                  <>
                    <span>立即建立旅程房間</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 右側：加入旅程 + 最近記錄 (佔 5 格) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 加入好友旅程卡片 */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-md border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">加入好友的旅程房間</h3>
                  <p className="text-xs text-slate-400">輸入專屬短代碼或貼上分享網址即可進入</p>
                </div>
              </div>

              <form onSubmit={handleJoinTrip} className="flex gap-2.5 mt-4">
                <input
                  type="text"
                  placeholder="如 tokyo-4x7 或完整網址"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-bold"
                />
                <button
                  type="submit"
                  disabled={!joinSlug.trim()}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black rounded-2xl text-xs transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  進入
                </button>
              </form>
            </div>

            {/* 本機最近開啟記錄 */}
            {recentTrips.length > 0 && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-md border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>最近在本機瀏覽過的旅程 ({recentTrips.length})</span>
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                  {recentTrips.map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => navigate(`/trip/${item.slug}`)}
                      className="w-full bg-slate-50 hover:bg-blue-50/70 p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400 flex items-center justify-between transition-all text-left group cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                        {item.date && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.date}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 核心特色 4 欄精緻展示 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
              <Users className="w-6 h-6" />
            </span>
            <h5 className="text-sm font-black text-slate-900">免註冊即時協同</h5>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              建立旅程後丟入 LINE 群組，每位成員輸入暱稱即可排定行程與票選。
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
              <MapPin className="w-6 h-6" />
            </span>
            <h5 className="text-sm font-black text-slate-900">雙欄互動地圖</h5>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              電腦網頁版左側時間軸、右側常駐互動地圖；手機版支援一鍵導航。
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
              <Plane className="w-6 h-6" />
            </span>
            <h5 className="text-sm font-black text-slate-900">航班住宿看板</h5>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              機票式去回程對照表，當晚入住飯店自動於每日行程置頂呈現。
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h5 className="text-sm font-black text-slate-900">主辦人安全防呆</h5>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              4 位數專屬 PIN 碼，保護核心日期與房間資料，防止群組好友誤刪。
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
        Travel Planner &copy; 2026 ・ 專為好友群組出遊打造的高效協同規劃平台
      </footer>
    </div>
  );
}

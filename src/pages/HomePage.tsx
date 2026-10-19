

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createNewTrip, 
  isSupabaseConfigured, 
  validateExistingSlugs, 
  getUserJoinedTrips 
} from '@/lib/supabase';
import { pruneInvalidTripCaches, getStoredNickname, setStoredNickname } from '@/lib/storage';
import { UserJoinedTrip } from '@/types/travel';
import { useAuth } from '@/context/AuthContext';
import { UserNav } from '@/components/UserNav';
import { AuthModal } from '@/components/AuthModal';
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
  Building2,
  Cloud,
  Smartphone,
  User as UserIcon
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, userName } = useAuth();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pin, setPin] = useState('');
  const [creatorNickname, setCreatorNickname] = useState('');
  const [joinSlug, setJoinSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentTrips, setRecentTrips] = useState<{ slug: string; title: string; date: string }[]>([]);
  const [cloudTrips, setCloudTrips] = useState<UserJoinedTrip[]>([]);
  const [loadingCloudTrips, setLoadingCloudTrips] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // 預設日期為一週後的五天旅程
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() + 7);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultStart.getDate() + 4);

    setStartDate(defaultStart.toISOString().split('T')[0]);
    setEndDate(defaultEnd.toISOString().split('T')[0]);

    // 1. 立即讀取本機已快取的旅程清單呈現
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

      // 2. 若有雲端資料庫且處於在線狀態，背景自動校驗旅程是否存在，修剪線上已刪除的殭屍快取
      if (isSupabaseConfigured && list.length > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
        const cachedSlugs = list.map((t) => t.slug);
        validateExistingSlugs(cachedSlugs).then((validSlugs) => {
          if (validSlugs.length < cachedSlugs.length) {
            pruneInvalidTripCaches(validSlugs);
            const validSet = new Set(validSlugs);
            setRecentTrips((prev) => prev.filter((t) => validSet.has(t.slug)));
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 當使用者登入身分確立時，預填建立者暱稱建議
  useEffect(() => {
    if (userName && !creatorNickname) {
      setCreatorNickname(userName);
    } else if (!creatorNickname) {
      const stored = getStoredNickname();
      if (stored) setCreatorNickname(stored);
    }
  }, [user, userName]);

  // 當使用者帳號變更時，抓取該使用者於雲端已加入的所有旅程清單（跨裝置同步）
  useEffect(() => {
    if (user?.id && isSupabaseConfigured) {
      setLoadingCloudTrips(true);
      getUserJoinedTrips(user.id)
        .then((trips) => {
          setCloudTrips(trips);
        })
        .finally(() => {
          setLoadingCloudTrips(false);
        });
    } else {
      setCloudTrips([]);
    }
  }, [user?.id]);

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
    const finalNickname = creatorNickname.trim() || userName || '主辦人';
    if (finalNickname) setStoredNickname(finalNickname);

    const { trip, error, isOfflineOnly } = await createNewTrip(
      title.trim(), 
      startDate, 
      endDate, 
      pin,
      user?.id,
      finalNickname
    );

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
      <header className="bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-700 text-white px-6 pt-6 sm:pt-8 pb-14 sm:pb-16 shadow-md relative z-10">
        {/* 背景環境光暈 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute right-0 top-1/4 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>

        {/* 頂部右上角使用者登入 / 選單 */}
        <div className="absolute top-4 sm:top-5 right-4 sm:right-6 z-40">
          <UserNav
            variant="dark"
            onViewMyTrips={() => {
              document.getElementById('my-trips-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl mb-2.5 shadow-md ring-1 ring-white/30">
            <Compass className="w-6 h-6 text-white" />
          </div>

          <div className="flex items-center gap-2 mb-2.5 flex-wrap justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold backdrop-blur-md border border-white/20 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>2026 好友出遊即時協同規劃利器</span>
            </div>
            {isSupabaseConfigured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-bold backdrop-blur-md border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>雲端資料庫：已連線</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 text-amber-200 text-xs font-bold backdrop-blur-md border border-amber-400/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>雲端資料庫：未連線 (離線單機模式)</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 drop-shadow-xs">
            Travel Planner
          </h1>

          <p className="text-blue-100 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto font-medium">
            跨裝置登入同步・專屬房間協同・雙欄互動地圖・航班與住宿一站掌握
          </p>

          {/* 熱門靈感範本快速晶片 */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap max-w-2xl">
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
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 flex-1 space-y-8 pb-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左側：建立新旅程 (佔 7 格) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">建立全新旅程</h2>
                <p className="text-xs text-slate-400 mt-0.5">填寫旅程資訊，立即獲取專屬房間並支援跨設備同步</p>
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

              {/* 綁定建立者在此旅程的專屬暱稱 */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-800 text-xs">
                    你在本旅程的專屬暱稱
                  </label>
                  {user ? (
                    <span className="text-[11px] text-blue-600 font-bold">已連結至 {user.app_metadata?.provider || '帳號'}</span>
                  ) : (
                    <span className="text-[11px] text-slate-400">進入房間後亦可隨時更改</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={userName ? `例如：${userName}` : '例如：小明、阿瑋、Alice'}
                  value={creatorNickname}
                  onChange={(e) => setCreatorNickname(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

          {/* 右側：加入旅程 + 雲端旅程 + 最近記錄 (佔 5 格) */}
          <div className="lg:col-span-5 space-y-5" id="my-trips-section">
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

            {/* 若已登入：展示我加入的雲端旅程 (跨設備同步) */}
            {user && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-md border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>我的雲端旅程 ({cloudTrips.length})</span>
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    已跨設備同步
                  </span>
                </div>

                {loadingCloudTrips ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">同步雲端旅程中...</span>
                  </div>
                ) : cloudTrips.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                    {cloudTrips.map((item) => (
                      <button
                        key={item.slug}
                        onClick={() => navigate(`/trip/${item.slug}`)}
                        className="w-full bg-slate-50 hover:bg-blue-50/70 p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400 flex items-center justify-between transition-all text-left group cursor-pointer"
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h4>
                          {item.start_date && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {item.start_date} ~ {item.end_date}
                            </p>
                          )}
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                            <UserIcon className="w-3 h-3" />
                            <span>你的暱稱：{item.my_nickname}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs font-bold text-slate-600">尚未加入任何雲端旅程</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      建立新旅程或輸入上方好友房間短碼，即可在此帳號永久同步！
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 若未登入：展示第三方登入引導卡片 */}
            {!user && (
              <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white backdrop-blur-md rounded-3xl p-6 shadow-sm border border-blue-100/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/30">
                    <Smartphone className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">跨手機與電腦同步出遊行程</h4>
                    <p className="text-[11px] text-slate-500">不再受限於單一設備快取</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  使用 Google 或 Facebook 第三方登入，不同裝置都能隨時查看已加入的旅程，並為每個旅程獨立綁定暱稱！
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-400 text-slate-800 font-bold rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>使用 Google / Facebook 登入</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            )}

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

      {/* 登入彈窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

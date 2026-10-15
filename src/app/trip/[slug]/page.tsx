'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FullTripData, 
  SpotItem, 
  Flight, 
  Accommodation 
} from '@/types/travel';
import { fetchFullTrip, supabase } from '@/lib/supabase';
import { 
  getStoredNickname, 
  setStoredNickname, 
  setLocalTripCache, 
  getDeviceId 
} from '@/lib/storage';
import { getGoogleMapsSearchUrl } from '@/lib/maps';
import { BottomNav, TabType } from '@/components/BottomNav';
import { DaySelector } from '@/components/DaySelector';
import { SpotCard } from '@/components/SpotCard';
import { AddSpotModal } from '@/components/AddSpotModal';
import { FlightSection } from '@/components/FlightSection';
import { AccommodationSection } from '@/components/AccommodationSection';
import { NicknameModal } from '@/components/NicknameModal';
import { ShareModal } from '@/components/ShareModal';
import { AdminPinModal } from '@/components/AdminPinModal';
import { 
  Share2, 
  Plus, 
  Building2, 
  MapPin, 
  User, 
  Trash2, 
  ShieldAlert, 
  WifiOff, 
  Calendar,
  Sparkles 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TripDetailPage({ params }: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">載入行程中...</p>
          </div>
        </div>
      }
    >
      <TripDetailInner params={params} />
    </React.Suspense>
  );
}

function TripDetailInner({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [fullData, setFullData] = useState<FullTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('itinerary');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [currentMember, setCurrentMember] = useState<string>('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // 彈窗狀態
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<{ title: string; onConfirm: () => void } | null>(null);

  // 初始化載入
  useEffect(() => {
    const savedName = getStoredNickname();
    if (savedName) {
      setCurrentMember(savedName);
    } else {
      setShowNicknameModal(true);
    }

    async function loadData() {
      setLoading(true);
      const data = await fetchFullTrip(slug);
      if (data) {
        setFullData(data);
        if (data.days.length > 0) {
          setSelectedDayId(data.days[0].id);
        }
      } else {
        setIsOfflineMode(true);
      }
      setLoading(false);
    }

    loadData();

    // 監聽網路連線狀態
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [slug]);

  // 更新完整資料與本地快取
  const updateData = (newData: FullTripData) => {
    setFullData(newData);
    setLocalTripCache(slug, newData);
  };

  // 1. 投票切換處理
  const handleVote = async (spotId: string) => {
    if (!fullData) return;
    const member = currentMember || '匿名成員';

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;

        const currentVotes = spot.votes || [];
        const existingVoteIndex = currentVotes.findIndex((v) => v.member_name === member);
        let updatedVotes = [...currentVotes];

        if (existingVoteIndex >= 0) {
          // 取消投票
          updatedVotes.splice(existingVoteIndex, 1);
        } else {
          // 新增按讚
          updatedVotes.push({
            id: 'vote_' + Math.random().toString(36).substring(2, 9),
            spot_id: spotId,
            member_name: member,
            vote_type: 'UP',
            created_at: new Date().toISOString(),
          });
        }

        return { ...spot, votes: updatedVotes };
      });
      return { ...day, spots: newSpots };
    });

    const updatedTripData = { ...fullData, days: newDays };
    updateData(updatedTripData);

    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('spot_votes')
          .select('id')
          .eq('spot_id', spotId)
          .eq('member_name', member)
          .maybeSingle();

        if (existing) {
          await supabase.from('spot_votes').delete().eq('id', existing.id);
        } else {
          await supabase.from('spot_votes').insert([{ spot_id: spotId, member_name: member, vote_type: 'UP' }]);
        }
      } catch (err) {
        console.warn('雲端投票同步失敗:', err);
      }
    }
  };

  // 2. 留言處理
  const handleAddComment = async (spotId: string, content: string) => {
    if (!fullData || !content.trim()) return;
    const member = currentMember || '匿名成員';

    const newComment = {
      id: 'cmt_' + Math.random().toString(36).substring(2, 9),
      spot_id: spotId,
      member_name: member,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;
        return {
          ...spot,
          comments: [...(spot.comments || []), newComment],
        };
      });
      return { ...day, spots: newSpots };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_comments').insert([
          { spot_id: spotId, member_name: member, content: content.trim() },
        ]);
      } catch (err) {
        console.warn('雲端留言同步失敗:', err);
      }
    }
  };

  // 3. 新增景點處理
  const handleAddSpot = async (spotData: Partial<SpotItem>) => {
    if (!fullData || !selectedDayId) return;

    const newSpot: SpotItem = {
      id: 'spot_' + Math.random().toString(36).substring(2, 10),
      day_id: selectedDayId,
      title: spotData.title || '',
      category: spotData.category || 'ATTRACTION',
      time_slot: spotData.time_slot,
      address: spotData.address,
      google_map_url: spotData.google_map_url,
      cost_estimate: spotData.cost_estimate,
      sort_order: 0,
      created_by: currentMember || '匿名成員',
      created_at: new Date().toISOString(),
      votes: [],
      comments: [],
    };

    const newDays = fullData.days.map((day) => {
      if (day.id !== selectedDayId) return day;
      return {
        ...day,
        spots: [...day.spots, newSpot],
      };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_items').insert([{
          day_id: selectedDayId,
          title: newSpot.title,
          category: newSpot.category,
          time_slot: newSpot.time_slot,
          address: newSpot.address,
          google_map_url: newSpot.google_map_url,
          cost_estimate: newSpot.cost_estimate,
          created_by: newSpot.created_by,
        }]);
      } catch (err) {
        console.warn('雲端新增景點失敗:', err);
      }
    }
  };

  // 4. 刪除景點
  const handleDeleteSpot = async (spotId: string) => {
    if (!fullData) return;
    const newDays = fullData.days.map((day) => ({
      ...day,
      spots: day.spots.filter((s) => s.id !== spotId),
    }));

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_items').delete().eq('id', spotId);
      } catch (err) {
        console.warn('雲端刪除景點失敗:', err);
      }
    }
  };

  // 5. 航班管理
  const handleAddFlight = async (flightData: Partial<Flight>) => {
    if (!fullData) return;

    const newFlight: Flight = {
      id: 'fl_' + Math.random().toString(36).substring(2, 9),
      trip_id: fullData.trip.id,
      member_name: flightData.member_name || currentMember || '旅伴',
      flight_type: flightData.flight_type || 'DEPARTURE',
      flight_number: flightData.flight_number,
      departure_airport: flightData.departure_airport,
      arrival_airport: flightData.arrival_airport,
      departure_time: flightData.departure_time,
      arrival_time: flightData.arrival_time,
      terminal: flightData.terminal,
      note: flightData.note,
      created_at: new Date().toISOString(),
    };

    updateData({ ...fullData, flights: [...fullData.flights, newFlight] });

    if (supabase) {
      try {
        await supabase.from('flights').insert([{
          trip_id: fullData.trip.id,
          member_name: newFlight.member_name,
          flight_type: newFlight.flight_type,
          flight_number: newFlight.flight_number,
          departure_airport: newFlight.departure_airport,
          arrival_airport: newFlight.arrival_airport,
          departure_time: newFlight.departure_time,
          arrival_time: newFlight.arrival_time,
          terminal: newFlight.terminal,
          note: newFlight.note,
        }]);
      } catch (err) {
        console.warn('雲端新增航班失敗:', err);
      }
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (!fullData) return;
    updateData({
      ...fullData,
      flights: fullData.flights.filter((f) => f.id !== flightId),
    });

    if (supabase) {
      try {
        await supabase.from('flights').delete().eq('id', flightId);
      } catch (err) {
        console.warn('雲端刪除航班失敗:', err);
      }
    }
  };

  // 6. 住宿管理
  const handleAddAccommodation = async (accData: Partial<Accommodation>) => {
    if (!fullData) return;

    const newAcc: Accommodation = {
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      trip_id: fullData.trip.id,
      name: accData.name || '',
      check_in: accData.check_in || '',
      check_out: accData.check_out || '',
      address: accData.address,
      google_map_url: accData.google_map_url,
      booking_ref: accData.booking_ref,
      phone: accData.phone,
      note: accData.note,
      created_at: new Date().toISOString(),
    };

    updateData({
      ...fullData,
      accommodations: [...fullData.accommodations, newAcc],
    });

    if (supabase) {
      try {
        await supabase.from('accommodations').insert([{
          trip_id: fullData.trip.id,
          name: newAcc.name,
          check_in: newAcc.check_in,
          check_out: newAcc.check_out,
          address: newAcc.address,
          google_map_url: newAcc.google_map_url,
          booking_ref: newAcc.booking_ref,
          phone: newAcc.phone,
          note: newAcc.note,
        }]);
      } catch (err) {
        console.warn('雲端新增住宿失敗:', err);
      }
    }
  };

  const handleDeleteAccommodation = async (accId: string) => {
    if (!fullData) return;
    updateData({
      ...fullData,
      accommodations: fullData.accommodations.filter((a) => a.id !== accId),
    });

    if (supabase) {
      try {
        await supabase.from('accommodations').delete().eq('id', accId);
      } catch (err) {
        console.warn('雲端刪除住宿失敗:', err);
      }
    }
  };

  // 7. 防呆操作：刪除整趟旅程 (需輸入 PIN)
  const triggerDeleteTrip = () => {
    setPendingAdminAction({
      title: '刪除整趟旅程',
      onConfirm: async () => {
        if (supabase && fullData) {
          await supabase.from('trips').delete().eq('id', fullData.trip.id);
        }
        router.push('/');
      },
    });
    setShowAdminPinModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">載入行程中...</p>
        </div>
      </div>
    );
  }

  if (!fullData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">找不到此旅程</h2>
        <p className="text-xs text-slate-500 mb-6">請確認分享連結代碼是否正確</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          返回首頁
        </button>
      </div>
    );
  }

  // 取得當前選取的日期與景點
  const currentDay = fullData.days.find((d) => d.id === selectedDayId) || fullData.days[0];
  const spotsForCurrentDay = currentDay?.spots || [];

  // 自動比對當日住宿：當天日期落在 [check_in, check_out] 之間
  const matchingAccommodation = fullData.accommodations.find((acc) => {
    if (!currentDay || !currentDay.date) return false;
    return currentDay.date >= acc.check_in && currentDay.date <= acc.check_out;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 頂部導航列 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ✈️
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 truncate">{fullData.trip.title}</h1>
            <p className="text-[10px] text-slate-400">
              {fullData.trip.start_date} ~ {fullData.trip.end_date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 離線或本地模式提醒徽章 */}
          {isOfflineMode && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              <WifiOff className="w-3 h-3" />
              離線快取
            </span>
          )}

          {/* 暱稱按鈕 */}
          <button
            onClick={() => setShowNicknameModal(true)}
            className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold max-w-[60px] truncate">{currentMember || '設定暱稱'}</span>
          </button>

          {/* 分享按鈕 */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="邀請好友"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 主要內容區域 */}
      <main className="flex-1 max-w-md w-full mx-auto">
        {/* 1. 每日行程分頁 */}
        {currentTab === 'itinerary' && (
          <div className="pb-28">
            {/* 天數滑動列 */}
            <DaySelector
              days={fullData.days}
              selectedDayId={selectedDayId}
              onSelectDay={(id) => setSelectedDayId(id)}
            />

            <div className="p-4 space-y-4">
              {/* 當日住宿頂部橫幅 (自動帶入) */}
              {matchingAccommodation && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-3.5 text-white shadow-md shadow-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-blue-100 block">今晚入住</span>
                      <h4 className="text-xs font-bold truncate">{matchingAccommodation.name}</h4>
                    </div>
                  </div>
                  <a
                    href={
                      matchingAccommodation.google_map_url ||
                      getGoogleMapsSearchUrl(`${matchingAccommodation.name} ${matchingAccommodation.address || ''}`)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    導航
                  </a>
                </div>
              )}

              {/* 景點時間軸清單 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    當日規劃景點 ({spotsForCurrentDay.length})
                  </h3>
                  <button
                    onClick={() => setShowAddSpotModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增地點
                  </button>
                </div>

                {spotsForCurrentDay.length > 0 ? (
                  spotsForCurrentDay.map((spot) => (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      currentMember={currentMember}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onDeleteSpot={handleDeleteSpot}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">今天尚未加入景點</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">點擊下方按鈕，把想去的地方或餐廳排進來吧！</p>
                    <button
                      onClick={() => setShowAddSpotModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      加入第一個景點
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 獨立航班分頁 */}
        {currentTab === 'flights' && (
          <FlightSection
            flights={fullData.flights}
            currentMember={currentMember}
            onAddFlight={handleAddFlight}
            onDeleteFlight={handleDeleteFlight}
          />
        )}

        {/* 3. 住宿資訊分頁 */}
        {currentTab === 'accommodations' && (
          <AccommodationSection
            accommodations={fullData.accommodations}
            onAddAccommodation={handleAddAccommodation}
            onDeleteAccommodation={handleDeleteAccommodation}
          />
        )}

        {/* 4. 旅程設定與成員分頁 */}
        {currentTab === 'settings' && (
          <div className="p-4 space-y-4 pb-28">
            <h2 className="text-lg font-bold text-slate-800">旅程設定與管理</h2>

            {/* 個人暱稱修改 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-1">我的暱稱</h3>
              <p className="text-xs text-slate-500 mb-3">修改在此旅程中顯示的名字</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMember}
                  onChange={(e) => setCurrentMember(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <button
                  onClick={() => setStoredNickname(currentMember)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  儲存
                </button>
              </div>
            </div>

            {/* 邀請朋友 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-1">邀請好友</h3>
              <p className="text-xs text-slate-500 mb-3">所有人憑此專屬房間網址即可免登入共同編輯</p>
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                開啟邀請分享視窗
              </button>
            </div>

            {/* 主辦人防呆危險區塊 */}
            <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4" />
                主辦人管理專區
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                執行關鍵或破壞性操作需輸入 4 位數管理 PIN 碼防呆
              </p>
              <button
                onClick={triggerDeleteTrip}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                刪除此整趟旅程
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 手機底部固定導航列 */}
      <BottomNav currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* 浮動新增景點快捷按鈕 (僅在行程分頁顯示) */}
      {currentTab === 'itinerary' && (
        <button
          onClick={() => setShowAddSpotModal(true)}
          className="fixed bottom-20 right-4 z-30 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center active:scale-95 transition-all"
          title="新增景點"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* 各彈窗組件 */}
      <NicknameModal
        isOpen={showNicknameModal}
        initialNickname={currentMember}
        onSave={(name) => {
          setCurrentMember(name);
          setShowNicknameModal(false);
        }}
        onClose={() => setShowNicknameModal(false)}
      />

      <AddSpotModal
        isOpen={showAddSpotModal}
        onClose={() => setShowAddSpotModal(false)}
        dayId={selectedDayId}
        currentMember={currentMember}
        onAddSpot={handleAddSpot}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tripTitle={fullData.trip.title}
        slug={fullData.trip.slug}
      />

      {pendingAdminAction && (
        <AdminPinModal
          isOpen={showAdminPinModal}
          pinHash={fullData.trip.pin_hash}
          actionTitle={pendingAdminAction.title}
          onSuccess={pendingAdminAction.onConfirm}
          onClose={() => {
            setShowAdminPinModal(false);
            setPendingAdminAction(null);
          }}
        />
      )}
    </div>
  );
}

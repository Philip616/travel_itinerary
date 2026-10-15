

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FullTripData, 
  SpotItem, 
  Flight, 
  Accommodation,
  CategoryType,
  TripMember
} from '@/types/travel';
import { fetchFullTrip, supabase, deleteTrip, registerTripMember } from '@/lib/supabase';
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
import { MapViewer } from '@/components/MapViewer';
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
  Users,
  Trash2, 
  ShieldAlert, 
  WifiOff, 
  Calendar,
  Sparkles,
  Plane,
  Settings,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Filter,
  Camera,
  Utensils,
  ShoppingBag,
  Bus,
  Layers
} from 'lucide-react';



export default function TripDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  return <TripDetailInner slug={slug} />;
}

function TripDetailInner({ slug }: { slug: string }) {
  const navigate = useNavigate();

  const [fullData, setFullData] = useState<FullTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('itinerary');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [activeSpotId, setActiveSpotId] = useState<string>('');
  const [currentMember, setCurrentMember] = useState<string>('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // 彈窗狀態
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [editingSpot, setEditingSpot] = useState<SpotItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<{ title: string; onConfirm: () => Promise<void> | void } | null>(null);

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
          if (data.days[0].spots.length > 0) {
            setActiveSpotId(data.days[0].spots[0].id);
          }
        }
        // 若本地已有暱稱，自動向房間登記成員
        if (savedName) {
          registerTripMember(data.trip.id, slug, savedName, getDeviceId()).then((res) => {
            if (res.member) {
              setFullData((prev) => {
                if (!prev) return prev;
                const filtered = prev.members.filter(
                  (m) => m.id !== res.member?.id && m.nickname.toLowerCase() !== res.member?.nickname.toLowerCase()
                );
                return { ...prev, members: [...filtered, res.member!] };
              });
            }
          });
        }
      } else {
        setIsOfflineMode(true);
      }
      setLoading(false);
    }

    loadData();

    // 即時協同訂閱
    if (supabase) {
      const channel = supabase
        .channel(`trip-realtime-${slug}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trip_members' },
          () => {
            fetchFullTrip(slug).then((updated) => {
              if (updated) setFullData(updated);
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'spot_items' },
          () => {
            fetchFullTrip(slug).then((updated) => {
              if (updated) setFullData(updated);
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'flights' },
          () => {
            fetchFullTrip(slug).then((updated) => {
              if (updated) setFullData(updated);
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'accommodations' },
          () => {
            fetchFullTrip(slug).then((updated) => {
              if (updated) setFullData(updated);
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'accommodation_comments' },
          () => {
            fetchFullTrip(slug).then((updated) => {
              if (updated) setFullData(updated);
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'spot_comments' },
          () => {
            fetchFullTrip(slug).then((updated) => {
              if (updated) setFullData(updated);
            });
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [slug]);

  // 更新快取並同步 state
  const updateData = (newData: FullTripData) => {
    setFullData(newData);
    setLocalTripCache(slug, newData);
  };

  // 1. 景點投票
  const handleVote = async (spotId: string) => {
    if (!fullData) return;
    const deviceId = getDeviceId();
    const voter = currentMember || '旅伴';

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;
        const existingVoteIndex = spot.votes?.findIndex((v) => v.member_name === voter) ?? -1;
        let newVotes = spot.votes ? [...spot.votes] : [];

        if (existingVoteIndex >= 0) {
          newVotes.splice(existingVoteIndex, 1);
        } else {
          newVotes.push({
            id: 'temp_' + Math.random(),
            spot_id: spotId,
            member_name: voter,
            vote_type: 'UP',
            created_at: new Date().toISOString(),
          });
        }
        return { ...spot, votes: newVotes };
      });
      return { ...day, spots: newSpots };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        const { data: currentVotes } = await supabase
          .from('spot_votes')
          .select('id')
          .eq('spot_id', spotId)
          .eq('member_name', voter);

        if (currentVotes && currentVotes.length > 0) {
          await supabase.from('spot_votes').delete().eq('id', currentVotes[0].id);
        } else {
          await supabase.from('spot_votes').insert([{
            spot_id: spotId,
            member_name: voter,
            device_id: deviceId,
            vote_type: 'UP',
          }]);
        }
      } catch (err) {
        console.warn('雲端投票同步失敗:', err);
      }
    }
  };

  // 2. 新增留言
  const handleAddComment = async (spotId: string, content: string) => {
    if (!fullData || !content.trim()) return;
    const author = currentMember || '旅伴';

    const newCommentObj = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      spot_id: spotId,
      member_name: author,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;
        return {
          ...spot,
          comments: [...(spot.comments || []), newCommentObj],
        };
      });
      return { ...day, spots: newSpots };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_comments').insert([{
          spot_id: spotId,
          member_name: author,
          content: content.trim(),
        }]);
      } catch (err) {
        console.warn('雲端留言新增失敗:', err);
      }
    }
  };

  // 2-1. 修改景點留言
  const handleEditSpotComment = async (spotId: string, commentId: string, newContent: string) => {
    if (!fullData || !newContent.trim()) return;

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;
        return {
          ...spot,
          comments: (spot.comments || []).map((c) =>
            c.id === commentId ? { ...c, content: newContent.trim() } : c
          ),
        };
      });
      return { ...day, spots: newSpots };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_comments').update({ content: newContent.trim() }).eq('id', commentId);
      } catch (err) {
        console.warn('雲端修改景點留言失敗:', err);
      }
    }
  };

  // 2-2. 刪除景點留言
  const handleDeleteSpotComment = async (spotId: string, commentId: string) => {
    if (!fullData) return;

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;
        return {
          ...spot,
          comments: (spot.comments || []).filter((c) => c.id !== commentId),
        };
      });
      return { ...day, spots: newSpots };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_comments').delete().eq('id', commentId);
      } catch (err) {
        console.warn('雲端刪除景點留言失敗:', err);
      }
    }
  };

  // 3. 新增景點
  const handleAddSpot = async (spotData: Partial<SpotItem>) => {
    if (!fullData || !selectedDayId) return;

    const currentDaySpots = fullData.days.find((d) => d.id === selectedDayId)?.spots || [];
    const newSpot: SpotItem = {
      id: 'sp_' + Math.random().toString(36).substring(2, 9),
      day_id: selectedDayId,
      title: spotData.title || '新景點',
      category: spotData.category || 'ATTRACTION',
      time_slot: spotData.time_slot,
      address: spotData.address,
      google_map_url: spotData.google_map_url,
      cost_estimate: spotData.cost_estimate,
      sort_order: currentDaySpots.length,
      created_by: currentMember || '旅伴',
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
    setActiveSpotId(newSpot.id);

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

  // 3-1. 編輯景點
  const handleEditSpot = async (spotId: string, spotData: Partial<SpotItem>) => {
    if (!fullData) return;

    const newDays = fullData.days.map((day) => {
      const newSpots = day.spots.map((spot) => {
        if (spot.id !== spotId) return spot;
        return {
          ...spot,
          ...spotData,
        };
      });
      return { ...day, spots: newSpots };
    });

    updateData({ ...fullData, days: newDays });

    if (supabase) {
      try {
        await supabase.from('spot_items').update({
          title: spotData.title,
          category: spotData.category,
          time_slot: spotData.time_slot,
          address: spotData.address,
          google_map_url: spotData.google_map_url,
          cost_estimate: spotData.cost_estimate,
        }).eq('id', spotId);
      } catch (err) {
        console.warn('雲端更新景點失敗:', err);
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
    if (activeSpotId === spotId) {
      setActiveSpotId('');
    }

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

  const handleUpdateFlight = async (flightId: string, flightData: Partial<Flight>) => {
    if (!fullData) return;

    const updatedFlights = fullData.flights.map((f) => {
      if (f.id !== flightId) return f;
      return {
        ...f,
        ...flightData,
      };
    });

    updateData({ ...fullData, flights: updatedFlights });

    if (supabase) {
      try {
        await supabase.from('flights').update({
          member_name: flightData.member_name,
          flight_type: flightData.flight_type,
          flight_number: flightData.flight_number,
          departure_airport: flightData.departure_airport,
          arrival_airport: flightData.arrival_airport,
          departure_time: flightData.departure_time,
          arrival_time: flightData.arrival_time,
          terminal: flightData.terminal,
          note: flightData.note,
        }).eq('id', flightId);
      } catch (err) {
        console.warn('雲端更新航班失敗:', err);
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

  const handleUpdateAccommodation = async (accId: string, accData: Partial<Accommodation>) => {
    if (!fullData) return;

    const updatedAccs = fullData.accommodations.map((a) => {
      if (a.id !== accId) return a;
      return {
        ...a,
        ...accData,
      };
    });

    updateData({
      ...fullData,
      accommodations: updatedAccs,
    });

    if (supabase) {
      try {
        await supabase.from('accommodations').update({
          name: accData.name,
          check_in: accData.check_in,
          check_out: accData.check_out,
          address: accData.address,
          google_map_url: accData.google_map_url,
          booking_ref: accData.booking_ref,
          phone: accData.phone,
          note: accData.note,
        }).eq('id', accId);
      } catch (err) {
        console.warn('雲端更新住宿失敗:', err);
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

  // 6-1. 住宿討論留言
  const handleAddAccommodationComment = async (accId: string, content: string) => {
    if (!fullData || !content.trim()) return;
    const author = currentMember || '旅伴';

    const newCommentObj = {
      id: 'ac_' + Math.random().toString(36).substring(2, 9),
      accommodation_id: accId,
      member_name: author,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    const newAccs = fullData.accommodations.map((acc) => {
      if (acc.id !== accId) return acc;
      return {
        ...acc,
        comments: [...(acc.comments || []), newCommentObj],
      };
    });

    updateData({ ...fullData, accommodations: newAccs });

    if (supabase) {
      try {
        await supabase.from('accommodation_comments').insert([{
          accommodation_id: accId,
          member_name: author,
          content: content.trim(),
        }]);
      } catch (err) {
        console.warn('雲端新增住宿留言失敗:', err);
      }
    }
  };

  // 6-2. 修改住宿留言
  const handleEditAccommodationComment = async (accId: string, commentId: string, newContent: string) => {
    if (!fullData || !newContent.trim()) return;

    const newAccs = fullData.accommodations.map((acc) => {
      if (acc.id !== accId) return acc;
      return {
        ...acc,
        comments: (acc.comments || []).map((c) =>
          c.id === commentId ? { ...c, content: newContent.trim() } : c
        ),
      };
    });

    updateData({ ...fullData, accommodations: newAccs });

    if (supabase) {
      try {
        await supabase.from('accommodation_comments').update({ content: newContent.trim() }).eq('id', commentId);
      } catch (err) {
        console.warn('雲端修改住宿留言失敗:', err);
      }
    }
  };

  // 6-3. 刪除住宿留言
  const handleDeleteAccommodationComment = async (accId: string, commentId: string) => {
    if (!fullData) return;

    const newAccs = fullData.accommodations.map((acc) => {
      if (acc.id !== accId) return acc;
      return {
        ...acc,
        comments: (acc.comments || []).filter((c) => c.id !== commentId),
      };
    });

    updateData({ ...fullData, accommodations: newAccs });

    if (supabase) {
      try {
        await supabase.from('accommodation_comments').delete().eq('id', commentId);
      } catch (err) {
        console.warn('雲端刪除住宿留言失敗:', err);
      }
    }
  };

  // 7. 防呆操作：刪除整趟旅程 (需輸入 PIN)
  const triggerDeleteTrip = () => {
    setPendingAdminAction({
      title: '刪除整趟旅程',
      onConfirm: async () => {
        if (!fullData) return;
        const res = await deleteTrip(slug, fullData.trip.id);
        if (!res.success) {
          throw new Error(res.error || '刪除旅程失敗，請確認資料庫狀態');
        }
        navigate('/');
      },
    });
    setShowAdminPinModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wider">載入行程中...</p>
        </div>
      </div>
    );
  }

  if (!fullData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black text-slate-900 mb-2">找不到此旅程房間</h2>
        <p className="text-xs text-slate-500 mb-6">請確認分享連結代碼是否正確，或此旅程已結束</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
        >
          返回首頁
        </button>
      </div>
    );
  }

  // 取得當前選取的日期與景點
  const currentDay = fullData.days.find((d) => d.id === selectedDayId) || fullData.days[0];
  const allSpotsForCurrentDay = currentDay?.spots || [];

  // 類別過濾
  const spotsForCurrentDay = categoryFilter === 'ALL'
    ? allSpotsForCurrentDay
    : allSpotsForCurrentDay.filter((s) => s.category === categoryFilter);

  // 自動比對當日住宿：當天日期落在 [check_in, check_out] 之間
  const matchingAccommodation = fullData.accommodations.find((acc) => {
    if (!currentDay || !currentDay.date) return false;
    return currentDay.date >= acc.check_in && currentDay.date <= acc.check_out;
  });

  // 計算桌面版當前選取的地圖定位目標
  const activeSpot = allSpotsForCurrentDay.find((s) => s.id === activeSpotId);
  const activeMapLocation = activeSpot
    ? `${activeSpot.title} ${activeSpot.address || ''}`
    : matchingAccommodation
    ? `${matchingAccommodation.name} ${matchingAccommodation.address && !matchingAccommodation.address.startsWith('http') ? matchingAccommodation.address : ''}`
    : allSpotsForCurrentDay.length > 0
    ? `${allSpotsForCurrentDay[0].title} ${allSpotsForCurrentDay[0].address || ''}`
    : fullData.trip.title;

  const activeMapTitle = activeSpot
    ? activeSpot.title
    : matchingAccommodation
    ? `🏨 ${matchingAccommodation.name}`
    : '當日景點分佈';

  const totalSpotsInTrip = fullData.days.reduce((acc, d) => acc + (d.spots?.length || 0), 0);

  // 彙整房間所有協同成員與參與動態統計
  const activeMembers = useMemo(() => {
    if (!fullData) return [];
    const map = new Map<string, {
      member: TripMember;
      isCurrent: boolean;
      flightsCount: number;
      spotsCount: number;
      commentsCount: number;
    }>();

    const currentDeviceId = getDeviceId();
    const normalizedCurrentName = currentMember.trim().toLowerCase();

    // 1. 登記於 trip_members 中的成員
    fullData.members.forEach((m) => {
      if (!m.nickname) return;
      const key = m.nickname.trim().toLowerCase();
      map.set(key, {
        member: m,
        isCurrent: key === normalizedCurrentName || (!!m.device_id && m.device_id === currentDeviceId),
        flightsCount: 0,
        spotsCount: 0,
        commentsCount: 0,
      });
    });

    // 2. 當前使用者 (如果已設定暱稱但尚未在 members 中)
    if (currentMember.trim()) {
      const key = currentMember.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          member: {
            id: 'local_current',
            trip_id: fullData.trip.id,
            nickname: currentMember.trim(),
            device_id: currentDeviceId,
            created_at: new Date().toISOString()
          },
          isCurrent: true,
          flightsCount: 0,
          spotsCount: 0,
          commentsCount: 0,
        });
      } else {
        const item = map.get(key)!;
        item.isCurrent = true;
      }
    }

    // 3. 掃描航班統計與未知成員
    fullData.flights.forEach((f) => {
      if (!f.member_name) return;
      const key = f.member_name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          member: {
            id: `flight_${f.id}`,
            trip_id: fullData.trip.id,
            nickname: f.member_name.trim(),
            device_id: '',
            created_at: f.created_at || fullData.trip.created_at
          },
          isCurrent: key === normalizedCurrentName,
          flightsCount: 1,
          spotsCount: 0,
          commentsCount: 0,
        });
      } else {
        map.get(key)!.flightsCount += 1;
      }
    });

    // 4. 掃描景點建立與留言統計
    fullData.days.forEach((day) => {
      day.spots.forEach((spot) => {
        if (spot.created_by) {
          const key = spot.created_by.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              member: {
                id: `spot_${spot.id}`,
                trip_id: fullData.trip.id,
                nickname: spot.created_by.trim(),
                device_id: '',
                created_at: spot.created_at || fullData.trip.created_at
              },
              isCurrent: key === normalizedCurrentName,
              flightsCount: 0,
              spotsCount: 1,
              commentsCount: 0,
            });
          } else {
            map.get(key)!.spotsCount += 1;
          }
        }

        spot.comments?.forEach((c) => {
          if (c.member_name) {
            const key = c.member_name.trim().toLowerCase();
            if (map.has(key)) {
              map.get(key)!.commentsCount += 1;
            }
          }
        });
      });
    });

    // 住宿留言統計
    fullData.accommodations.forEach((acc) => {
      acc.comments?.forEach((c) => {
        if (c.member_name) {
          const key = c.member_name.trim().toLowerCase();
          if (map.has(key)) {
            map.get(key)!.commentsCount += 1;
          }
        }
      });
    });

    // 排序：當前使用者置頂，其餘按加入或參與時間排序
    return Array.from(map.values()).sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return new Date(a.member.created_at).getTime() - new Date(b.member.created_at).getTime();
    });
  }, [fullData, currentMember]);

  const navTabs: { id: TabType; label: string; icon: any; count?: number }[] = [
    { id: 'itinerary', label: '每日行程', icon: Calendar, count: totalSpotsInTrip },
    { id: 'flights', label: '航班對照', icon: Plane, count: fullData.flights.length },
    { id: 'accommodations', label: '住宿資訊', icon: Building2, count: fullData.accommodations.length },
    { id: 'settings', label: '旅程設定', icon: Settings, count: activeMembers.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col selection:bg-blue-100">
      {/* 頂部沉浸式 Hero 旅遊橫幅 (Wanderlust Destination Header) */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white relative overflow-hidden shadow-lg">
        {/* 背景環境裝飾光暈 */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-72 h-72 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-7 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="space-y-3">
              {/* 頂部微標籤組 */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>所有旅程</span>
                </button>
                <span className="text-xs font-mono font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-white">
                  房間代碼：{fullData.trip.slug}
                </span>
                <span className="text-xs font-bold bg-amber-400 text-amber-950 px-2.5 py-1 rounded-xl shadow-xs">
                  共 {fullData.days.length} 天行程
                </span>
                {isOfflineMode && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-rose-500/90 text-white px-2.5 py-1 rounded-xl font-bold">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>離線快取</span>
                  </span>
                )}
              </div>

              {/* 旅程大標題 */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-xs">
                {fullData.trip.title}
              </h1>

              {/* 日期與當前成員資訊 */}
              <div className="flex items-center gap-3 text-xs text-blue-100 font-medium flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-200" />
                  {fullData.trip.start_date} ~ {fullData.trip.end_date}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-200" />
                  我的身份：<span className="font-bold text-white underline decoration-white/40">{currentMember || '未設定'}</span>
                </span>
              </div>
            </div>

            {/* 右側快速操作按鈕組 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowNicknameModal(true)}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/20"
              >
                修改暱稱
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-black rounded-2xl text-xs shadow-lg shadow-black/10 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>邀請旅伴加入</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 桌面版次級導航列 (Sticky Sub-Navigation) */}
      <nav className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            免帳號多人同步・變更自動即時儲存
          </div>
        </div>
      </nav>

      {/* 1. 每日行程分頁 */}
      {currentTab === 'itinerary' && (
        <>
          {/* 天數滑動選擇列 */}
          <DaySelector
            days={fullData.days}
            selectedDayId={selectedDayId}
            onSelectDay={(id) => {
              setSelectedDayId(id);
              const targetDay = fullData.days.find((d) => d.id === id);
              if (targetDay && targetDay.spots.length > 0) {
                setActiveSpotId(targetDay.spots[0].id);
              } else {
                setActiveSpotId('');
              }
            }}
          />

          {/* 主要雙欄內容容器 */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-16">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* 左側：行程時間軸與景點卡片清單 */}
              <div className="w-full lg:w-7/12 xl:w-3/5 space-y-4">
                {/* 當日住宿橫幅 (自動帶入) */}
                {matchingAccommodation && (
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-5 text-white shadow-md shadow-blue-500/10 flex items-center justify-between min-w-0 overflow-hidden">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                        <Building2 className="w-5 h-5 text-white" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block">今晚入住飯店</span>
                        <h4 className="text-sm sm:text-base font-black truncate">{matchingAccommodation.name}</h4>
                        {matchingAccommodation.address && (
                          <p className="text-xs text-blue-100/90 truncate mt-0.5">
                            {matchingAccommodation.address.startsWith('http') ? '（未填寫詳細地址，可至住宿分頁查看參考連結）' : matchingAccommodation.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={
                        matchingAccommodation.google_map_url ||
                        getGoogleMapsSearchUrl(`${matchingAccommodation.name} ${matchingAccommodation.address && !matchingAccommodation.address.startsWith('http') ? matchingAccommodation.address : ''}`)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-white text-blue-600 hover:bg-blue-50 text-xs font-black px-4 py-2 rounded-2xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ml-3"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>導航</span>
                    </a>
                  </div>
                )}

                {/* 景點時間軸工具列 (含分類篩選晶片) */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        本日行程時間軸 ({allSpotsForCurrentDay.length})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">點選地點卡片可在右側地圖即時聚焦</p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingSpot(null);
                        setShowAddSpotModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      新增地點
                    </button>
                  </div>

                  {/* 類別篩選標籤 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    {[
                      { key: 'ALL', label: '全部地點' },
                      { key: 'ATTRACTION', label: '熱門景點' },
                      { key: 'FOOD', label: '美食餐廳' },
                      { key: 'SHOPPING', label: '購物採買' },
                      { key: 'TRANSPORT', label: '交通移動' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setCategoryFilter(f.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          categoryFilter === f.key
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 景點列表 (帶垂直時間軸連線) */}
                {spotsForCurrentDay.length > 0 ? (
                  <div className="pt-2">
                    {spotsForCurrentDay.map((spot, idx) => (
                      <SpotCard
                        key={spot.id}
                        spot={spot}
                        index={idx}
                        currentMember={currentMember}
                        isSelected={spot.id === activeSpotId}
                        onSelectSpot={(id) => setActiveSpotId(id)}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onEditComment={handleEditSpotComment}
                        onDeleteComment={handleDeleteSpotComment}
                        onEditSpot={(spotToEdit) => {
                          setEditingSpot(spotToEdit);
                          setShowAddSpotModal(true);
                        }}
                        onDeleteSpot={handleDeleteSpot}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white/80 rounded-3xl border border-dashed border-slate-200 p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">本日尚未加入任何行程</h4>
                    <p className="text-xs text-slate-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                      點擊下方按鈕，把想去的美食店家、知名景點或轉運站點排進今天的路線吧！
                    </p>
                    <button
                      onClick={() => {
                        setEditingSpot(null);
                        setShowAddSpotModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      加入本日第一個地點
                    </button>
                  </div>
                )}
              </div>

              {/* 右側：桌面專屬互動地圖常駐區 (Sticky Companion) */}
              <div className="hidden lg:block lg:w-5/12 xl:w-2/5 sticky top-20 self-start">
                <MapViewer
                  activeLocation={activeMapLocation}
                  activeTitle={activeMapTitle}
                  spots={allSpotsForCurrentDay}
                  selectedSpotId={activeSpotId}
                  onSelectSpot={(spotId) => {
                    if (spotId === 'acc' && matchingAccommodation) {
                      setActiveSpotId('');
                    } else {
                      setActiveSpotId(spotId);
                    }
                  }}
                  accommodationName={matchingAccommodation?.name}
                  accommodationAddress={matchingAccommodation?.address}
                />
              </div>
            </div>
          </main>
        </>
      )}

      {/* 2. 獨立航班分頁 */}
      {currentTab === 'flights' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-28 md:pb-16">
          <FlightSection
            flights={fullData.flights}
            currentMember={currentMember}
            onAddFlight={handleAddFlight}
            onUpdateFlight={handleUpdateFlight}
            onDeleteFlight={handleDeleteFlight}
          />
        </main>
      )}

      {/* 3. 住宿資訊分頁 */}
      {currentTab === 'accommodations' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-28 md:pb-16">
          <AccommodationSection
            accommodations={fullData.accommodations}
            currentMember={currentMember}
            onAddAccommodation={handleAddAccommodation}
            onUpdateAccommodation={handleUpdateAccommodation}
            onDeleteAccommodation={handleDeleteAccommodation}
            onAddComment={handleAddAccommodationComment}
            onEditComment={handleEditAccommodationComment}
            onDeleteComment={handleDeleteAccommodationComment}
          />
        </main>
      )}

      {/* 4. 旅程設定與管理分頁 */}
      {currentTab === 'settings' && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">旅程設定與房間管理</h2>
              <p className="text-xs text-slate-500 mt-1">管理你的成員暱稱、邀請好友網址與主辦人安全防呆管理碼</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 個人暱稱修改卡片 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">我的成員暱稱</h3>
                    <p className="text-xs text-slate-400">在行程、機票與留言中顯示的名字</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={currentMember}
                    onChange={(e) => setCurrentMember(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                  <button
                    onClick={async () => {
                      if (!currentMember.trim()) {
                        alert('請輸入有效暱稱');
                        return;
                      }
                      setStoredNickname(currentMember);
                      if (fullData) {
                        const res = await registerTripMember(fullData.trip.id, slug, currentMember, getDeviceId());
                        if (res.member) {
                          setFullData((prev) => {
                            if (!prev) return prev;
                            const filtered = prev.members.filter(
                              (m) => m.id !== res.member?.id && m.nickname.toLowerCase() !== currentMember.toLowerCase()
                            );
                            return { ...prev, members: [...filtered, res.member!] };
                          });
                        }
                      }
                      alert('暱稱已成功更新並同步至房間成員！');
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    儲存
                  </button>
                </div>
              </div>

              {/* 邀請好友卡片 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Share2 className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">邀請好友加入編輯</h3>
                      <p className="text-xs text-slate-400">免註冊帳號，憑房間網址直接參與</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-4"
                >
                  <Share2 className="w-4 h-4" />
                  <span>開啟邀請分享面板</span>
                </button>
              </div>
            </div>

            {/* 協同成員名單卡片 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">已加入協同編輯的成員</h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        共 {activeMembers.length} 人
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      開啟此房間連結並設定暱稱的好友，皆能即時在同一張行程表上編輯與同步
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    即時協同中
                  </span>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>邀請好友</span>
                  </button>
                </div>
              </div>

              {/* 成員清單網格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {activeMembers.map((item, idx) => {
                  const { member, isCurrent, flightsCount, spotsCount, commentsCount } = item;
                  const initial = member.nickname ? member.nickname.trim().charAt(0).toUpperCase() : '?';

                  const avatarGradients = [
                    'from-blue-500 to-indigo-600',
                    'from-violet-500 to-purple-600',
                    'from-emerald-500 to-teal-600',
                    'from-rose-500 to-pink-600',
                    'from-amber-500 to-orange-600',
                    'from-cyan-500 to-blue-600'
                  ];
                  const grad = avatarGradients[idx % avatarGradients.length];

                  return (
                    <div
                      key={member.id || member.nickname}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                          : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0`}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-black text-slate-900 truncate">
                                {member.nickname}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                                  你 (目前裝置)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {member.created_at
                                ? `加入於 ${new Date(member.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                : '已在此旅程'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 成員在旅程中的參與動態標籤 */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/50 text-[10px] text-slate-600">
                        {flightsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100/70 text-sky-800 rounded-lg font-bold">
                            <Plane className="w-2.5 h-2.5" />
                            已登記 {flightsCount} 趟航班
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200/60 text-slate-500 rounded-lg font-medium">
                            航班尚未填寫
                          </span>
                        )}

                        {spotsCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100/70 text-amber-800 rounded-lg font-bold">
                            <MapPin className="w-2.5 h-2.5" />
                            排了 {spotsCount} 個景點
                          </span>
                        )}

                        {commentsCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100/70 text-indigo-800 rounded-lg font-bold">
                            留言 {commentsCount} 次
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 只有一位成員時的邀請提示 */}
              {activeMembers.length <= 1 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>目前房間只有你一人。複製房間連結傳到 LINE 群組，好友點開輸入暱稱後就會即時在此出現！</span>
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex-shrink-0"
                  >
                    複製邀請網址
                  </button>
                </div>
              )}
            </div>

            {/* 主辦人防呆危險區塊 */}
            <div className="bg-white rounded-3xl p-6 border border-rose-200/90 shadow-sm">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2 mb-1.5">
                <ShieldAlert className="w-5 h-5" />
                主辦人安全防呆管理專區
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                為防止群組好友誤觸刪除，清除整趟旅程或修改房間核心時間需要輸入建立時設定的 4 位數 PIN 碼。
              </p>
              <button
                onClick={triggerDeleteTrip}
                className="py-3 px-5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>刪除此整趟旅程房間</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 行動端底部固定導航列 (桌面版自動隱藏) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        membersCount={activeMembers.length}
      />

      {/* 行動端浮動新增按鈕 (桌面版自動隱藏) */}
      {currentTab === 'itinerary' && (
        <button
          onClick={() => {
            setEditingSpot(null);
            setShowAddSpotModal(true);
          }}
          className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-xl shadow-blue-500/35 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          title="新增景點"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}

      {/* 各彈窗組件 */}
      <NicknameModal
        isOpen={showNicknameModal}
        initialNickname={currentMember}
        onSave={async (name) => {
          setCurrentMember(name);
          setShowNicknameModal(false);
          if (fullData) {
            const res = await registerTripMember(fullData.trip.id, slug, name, getDeviceId());
            if (res.member) {
              setFullData((prev) => {
                if (!prev) return prev;
                const filtered = prev.members.filter(
                  (m) => m.id !== res.member?.id && m.nickname.toLowerCase() !== name.toLowerCase()
                );
                return { ...prev, members: [...filtered, res.member!] };
              });
            }
          }
        }}
        onClose={() => setShowNicknameModal(false)}
      />

      <AddSpotModal
        isOpen={showAddSpotModal}
        onClose={() => {
          setShowAddSpotModal(false);
          setEditingSpot(null);
        }}
        dayId={selectedDayId}
        currentMember={currentMember}
        initialSpot={editingSpot}
        onAddSpot={handleAddSpot}
        onUpdateSpot={handleEditSpot}
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

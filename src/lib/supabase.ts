import { createClient } from '@supabase/supabase-js';
import { 
  Trip, 
  TripMember, 
  ItineraryDay, 
  Accommodation, 
  Flight, 
  SpotItem, 
  FullTripData,
  SpotVote,
  SpotComment
} from '@/types/travel';
import { 
  getLocalTripCache, 
  setLocalTripCache, 
  removeLocalTripCache, 
  setRoomNickname 
} from './storage';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl.length > 0 && 
  supabaseAnonKey.length > 0 && 
  !supabaseUrl.includes('placeholder-project');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// SHA-256 PIN 雜湊輔助函式
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 產生短網址識別代碼 (如 tokyo-7a9b)
export function generateSlug(title: string): string {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return cleanTitle ? `${cleanTitle}-${randomSuffix}` : `trip-${randomSuffix}`;
}

// 建立新旅程
export async function createNewTrip(
  title: string,
  startDate: string,
  endDate: string,
  pin: string
): Promise<{ trip: Trip | null; error: string | null; isOfflineOnly?: boolean }> {
  const slug = generateSlug(title);
  const pin_hash = await hashPin(pin);
  const tripId = 'trip_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  // 計算天數以初始化每日行程
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  const newTrip: Trip = {
    id: tripId,
    slug,
    title,
    start_date: startDate,
    end_date: endDate,
    pin_hash,
    created_at: now
  };

  const initialDays: (ItineraryDay & { spots: SpotItem[] })[] = [];
  for (let i = 1; i <= diffDays; i++) {
    const curDate = new Date(start);
    curDate.setDate(start.getDate() + (i - 1));
    initialDays.push({
      id: `day_${tripId}_${i}`,
      trip_id: tripId,
      day_number: i,
      date: curDate.toISOString().split('T')[0],
      theme: `第 ${i} 天行程`,
      created_at: now,
      spots: []
    });
  }

  const initialFullData: FullTripData = {
    trip: newTrip,
    members: [],
    days: initialDays,
    accommodations: [],
    flights: []
  };

  // 若已配置 Supabase 則同步至雲端
  if (supabase) {
    try {
      const { data: tripData, error: tripErr } = await supabase
        .from('trips')
        .insert([{ slug, title, start_date: startDate, end_date: endDate, pin_hash }])
        .select()
        .single();

      if (tripErr) throw tripErr;

      const daysToInsert = initialDays.map(d => ({
        trip_id: tripData.id,
        day_number: d.day_number,
        date: d.date,
        theme: d.theme
      }));

      const { data: insertedDays, error: daysErr } = await supabase
        .from('itinerary_days')
        .insert(daysToInsert)
        .select();

      if (daysErr) throw daysErr;

      // 使用雲端產生的實際 ID 更新本地快取
      const syncedDays = (insertedDays || []).map((d: any) => ({
        ...d,
        spots: []
      }));

      setLocalTripCache(slug, {
        trip: tripData,
        members: [],
        days: syncedDays,
        accommodations: [],
        flights: []
      });

      return { trip: tripData, error: null, isOfflineOnly: false };
    } catch (err: any) {
      console.error('Supabase 雲端資料庫寫入失敗:', err);
      return { trip: null, error: `雲端資料庫寫入失敗 (${err?.message || '連線逾時'})。旅程未能保存至資料庫，請確認 Supabase 資料表已建立。` };
    }
  }

  // 未配置雲端資料庫（離線單機模式）
  setLocalTripCache(slug, initialFullData);
  return { trip: newTrip, error: null, isOfflineOnly: true };
}

// 取得完整旅程資料 (優先從雲端讀取，離線或未配置時從本地快取讀取；404 時自動清除本地快取)
export async function fetchFullTrip(slug: string): Promise<FullTripData | null> {
  const localCache = getLocalTripCache(slug);

  if (!supabase) {
    return localCache;
  }

  try {
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tripErr || !trip) {
      // PGRST116: JSON object requested, multiple (or no) rows returned -> 404 不存在
      const isNotFound = tripErr?.code === 'PGRST116' || tripErr?.message?.includes('0 rows');
      if (isNotFound) {
        // 線上資料庫確認無此旅程（已被刪除），立即清除本地快取與房間暱稱，避免殭屍資料復活
        removeLocalTripCache(slug);
        return null;
      }

      // 其他網路或連線例外時，若處於離線狀態才回傳本地快取
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return localCache;
      }
      return localCache;
    }

    const [daysRes, membersRes, flightsRes, accsRes] = await Promise.all([
      supabase.from('itinerary_days').select('*').eq('trip_id', trip.id).order('day_number'),
      supabase.from('trip_members').select('*').eq('trip_id', trip.id),
      supabase.from('flights').select('*').eq('trip_id', trip.id),
      supabase.from('accommodations').select('*').eq('trip_id', trip.id)
    ]);

    const dayIds = (daysRes.data || []).map((d: any) => d.id);
    let spotsWithExtras: SpotItem[] = [];

    if (dayIds.length > 0) {
      const { data: spots } = await supabase
        .from('spot_items')
        .select('*, votes:spot_votes(*), comments:spot_comments(*)')
        .in('day_id', dayIds)
        .order('sort_order');
      spotsWithExtras = (spots || []) as SpotItem[];
    }

    const accIds = (accsRes.data || []).map((a: any) => a.id);
    let accsWithComments: Accommodation[] = [];

    if (accIds.length > 0) {
      try {
        const { data: comments, error: commentErr } = await supabase
          .from('accommodation_comments')
          .select('*')
          .in('accommodation_id', accIds)
          .order('created_at', { ascending: true });

        if (!commentErr && comments) {
          accsWithComments = (accsRes.data || []).map((acc: any) => ({
            ...acc,
            comments: comments.filter((c: any) => c.accommodation_id === acc.id)
          }));
        } else {
          const localAccMap = new Map((localCache?.accommodations || []).map(a => [a.id, a.comments || []]));
          accsWithComments = (accsRes.data || []).map((acc: any) => ({
            ...acc,
            comments: localAccMap.get(acc.id) || []
          }));
        }
      } catch {
        const localAccMap = new Map((localCache?.accommodations || []).map(a => [a.id, a.comments || []]));
        accsWithComments = (accsRes.data || []).map((acc: any) => ({
          ...acc,
          comments: localAccMap.get(acc.id) || []
        }));
      }
    } else {
      accsWithComments = [];
    }

    const structuredDays = (daysRes.data || []).map((day: any) => ({
      ...day,
      spots: spotsWithExtras.filter(s => s.day_id === day.id)
    }));

    const fullData: FullTripData = {
      trip,
      members: membersRes.data || [],
      days: structuredDays,
      flights: flightsRes.data || [],
      accommodations: accsWithComments
    };

    // 同步更新本地離線快取
    setLocalTripCache(slug, fullData);
    return fullData;
  } catch (err) {
    console.warn('雲端資料獲取失敗，使用本地快取:', err);
    return localCache;
  }
}

// 驗證主辦人 PIN 碼
export async function verifyTripPin(currentHash: string, inputPin: string): Promise<boolean> {
  const inputHash = await hashPin(inputPin);
  return inputHash === currentHash;
}

// 修改旅程主題名稱 (同步更新雲端與本地快取)
export async function updateTripTitle(
  tripId: string,
  slug: string,
  title: string
): Promise<{ success: boolean; error: string | null }> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return { success: false, error: '旅程名稱不可為空' };

  // 1. 本地快取更新
  const localCache = getLocalTripCache(slug);
  if (localCache) {
    localCache.trip.title = cleanTitle;
    setLocalTripCache(slug, localCache);
  }

  // 2. 雲端同步
  if (supabase) {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ title: cleanTitle })
        .eq('id', tripId);
      if (error) throw error;
    } catch (err: any) {
      console.warn('雲端更新旅程標題失敗:', err);
      return { success: false, error: err?.message || '更新失敗' };
    }
  }

  return { success: true, error: null };
}

// 修改每日自訂主題名稱 (同步更新雲端與本地快取)
export async function updateDayTheme(
  dayId: string,
  slug: string,
  theme: string
): Promise<{ success: boolean; error: string | null }> {
  const cleanTheme = theme.trim();

  // 1. 本地快取更新
  const localCache = getLocalTripCache(slug);
  if (localCache) {
    const day = localCache.days.find((d) => d.id === dayId);
    if (day) {
      day.theme = cleanTheme;
      setLocalTripCache(slug, localCache);
    }
  }

  // 2. 雲端同步
  if (supabase) {
    try {
      const { error } = await supabase
        .from('itinerary_days')
        .update({ theme: cleanTheme })
        .eq('id', dayId);
      if (error) throw error;
    } catch (err: any) {
      console.warn('雲端更新每日主題失敗:', err);
      return { success: false, error: err?.message || '更新失敗' };
    }
  }

  return { success: true, error: null };
}

// 成員自行退出房間 (清除本機快取與房間暱稱，並自雲端成員表除名)
export async function leaveTripMember(
  tripId: string,
  slug: string,
  deviceId: string,
  nickname: string
): Promise<{ success: boolean; error: string | null }> {
  // 1. 清除本地此房間快取與房間專屬暱稱
  removeLocalTripCache(slug);

  // 2. 雲端移除該成員紀錄
  if (supabase) {
    try {
      let query = supabase.from('trip_members').delete().eq('trip_id', tripId);
      if (deviceId && deviceId !== 'server_device') {
        query = query.eq('device_id', deviceId);
      } else if (nickname) {
        query = query.eq('nickname', nickname.trim());
      }
      const { error } = await query;
      if (error) {
        console.warn('雲端退出成員記錄失敗:', error);
      }
    } catch (err) {
      console.warn('雲端退出旅程異常:', err);
    }
  }

  return { success: true, error: null };
}

// 主辦人強制移除成員
export async function removeTripMember(
  tripId: string,
  slug: string,
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  // 1. 本地快取更新
  const localCache = getLocalTripCache(slug);
  if (localCache && localCache.members) {
    localCache.members = localCache.members.filter((m) => m.id !== memberId);
    setLocalTripCache(slug, localCache);
  }

  // 2. 雲端刪除成員
  if (supabase) {
    try {
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId)
        .eq('trip_id', tripId);
      if (error) throw error;
    } catch (err: any) {
      console.warn('雲端踢除成員失敗:', err);
      return { success: false, error: err?.message || '踢除成員失敗' };
    }
  }

  return { success: true, error: null };
}

// 批次校驗雲端現存旅程 slugs，用於首頁自動修剪本地無效快取
export async function validateExistingSlugs(cachedSlugs: string[]): Promise<string[]> {
  if (!supabase || cachedSlugs.length === 0) {
    return cachedSlugs;
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('slug')
      .in('slug', cachedSlugs);

    if (error || !data) {
      // 網路或權限異常時保守保留本地快取
      return cachedSlugs;
    }

    return data.map((t: { slug: string }) => t.slug);
  } catch (err) {
    console.warn('校驗雲端旅程清單異常:', err);
    return cachedSlugs;
  }
}

// 刪除整趟旅程 (同步清除本地快取與雲端資料)
export async function deleteTrip(slug: string, tripId: string): Promise<{ success: boolean; error: string | null }> {
  // 1. 立即清除本地快取，確保首頁與最近清單不再顯示
  removeLocalTripCache(slug);

  // 2. 若有 Supabase 則同步自雲端刪除
  if (supabase) {
    try {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) {
        console.warn('雲端刪除旅程失敗:', error);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.warn('雲端刪除旅程異常:', err);
      return { success: false, error: err?.message || '雲端資料庫連線失敗' };
    }
  }

  return { success: true, error: null };
}

// 登記或更新成員至旅程房間 (支援離線快取與雲端同步)
export async function registerTripMember(
  tripId: string,
  slug: string,
  nickname: string,
  deviceId: string
): Promise<{ member: TripMember | null; error: string | null }> {
  const cleanName = nickname.trim();
  if (!cleanName) return { member: null, error: '暱稱不可為空' };

  // 儲存至此房間專屬暱稱
  setRoomNickname(slug, cleanName);

  const now = new Date().toISOString();
  let resultMember: TripMember = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    trip_id: tripId,
    nickname: cleanName,
    device_id: deviceId,
    created_at: now
  };

  // 1. 本地離線快取更新
  const localCache = getLocalTripCache(slug);
  if (localCache) {
    if (!localCache.members) localCache.members = [];
    const existingIndex = localCache.members.findIndex(
      (m) => (m.device_id && m.device_id === deviceId) || m.nickname.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingIndex >= 0) {
      localCache.members[existingIndex] = {
        ...localCache.members[existingIndex],
        nickname: cleanName
      };
      resultMember = localCache.members[existingIndex];
    } else {
      localCache.members.push(resultMember);
    }
    setLocalTripCache(slug, localCache);
  }

  // 2. 若配置 Supabase 則同步至雲端
  if (supabase) {
    try {
      const { data: existingList, error: queryErr } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId);

      if (queryErr) throw queryErr;

      const existing = existingList?.find(
        (m: TripMember) => (m.device_id && m.device_id === deviceId) || m.nickname.toLowerCase() === cleanName.toLowerCase()
      );

      if (existing) {
        const { data: updated, error: updateErr } = await supabase
          .from('trip_members')
          .update({ nickname: cleanName })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        return { member: updated, error: null };
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('trip_members')
          .insert([{
            trip_id: tripId,
            nickname: cleanName,
            device_id: deviceId
          }])
          .select()
          .single();

        if (insertErr) throw insertErr;
        return { member: inserted, error: null };
      }
    } catch (err: any) {
      console.warn('同步成員至雲端失敗，以本地快取優先:', err?.message || err);
    }
  }

  return { member: resultMember, error: null };
}

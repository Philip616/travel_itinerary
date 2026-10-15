import { FullTripData } from '@/types/travel';

const NICKNAME_KEY = 'travel_member_nickname';
const DEVICE_ID_KEY = 'travel_device_id';
const TRIP_CACHE_PREFIX = 'travel_trip_cache_';
const ROOM_NICKNAME_PREFIX = 'travel_nickname_';

/**
 * 取得本機上次使用過的預設暱稱（僅作為新房間輸入時的預填建議，不代表已在該房間註冊）
 */
export function getStoredNickname(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NICKNAME_KEY) || '';
}

/**
 * 記錄本機最近一次使用的預設暱稱
 */
export function setStoredNickname(nickname: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NICKNAME_KEY, nickname.trim());
}

/**
 * 取得特定房間中登記的專屬暱稱 (Room-scoped)
 */
export function getRoomNickname(slug: string): string {
  if (typeof window === 'undefined' || !slug) return '';
  return localStorage.getItem(`${ROOM_NICKNAME_PREFIX}${slug}`) || '';
}

/**
 * 設定特定房間中登記的專屬暱稱 (Room-scoped)，並同步更新全域預設建議
 */
export function setRoomNickname(slug: string, nickname: string): void {
  if (typeof window === 'undefined' || !slug) return;
  const cleanName = nickname.trim();
  localStorage.setItem(`${ROOM_NICKNAME_PREFIX}${slug}`, cleanName);
  if (cleanName) {
    setStoredNickname(cleanName);
  }
}

/**
 * 移除特定房間中登記的專屬暱稱
 */
export function removeRoomNickname(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  localStorage.removeItem(`${ROOM_NICKNAME_PREFIX}${slug}`);
}

/**
 * 取得裝置唯一識別 ID
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * 讀取本地旅程離線快取
 */
export function getLocalTripCache(slug: string): FullTripData | null {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    const raw = localStorage.getItem(`${TRIP_CACHE_PREFIX}${slug}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse local trip cache:', err);
    return null;
  }
}

/**
 * 寫入本地旅程離線快取
 */
export function setLocalTripCache(slug: string, data: FullTripData): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    localStorage.setItem(`${TRIP_CACHE_PREFIX}${slug}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save trip to local cache:', err);
  }
}

/**
 * 移除本地旅程快取與房間暱稱關聯
 */
export function removeLocalTripCache(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    localStorage.removeItem(`${TRIP_CACHE_PREFIX}${slug}`);
    localStorage.removeItem(`${ROOM_NICKNAME_PREFIX}${slug}`);
  } catch (err) {
    console.error('Failed to remove trip from local cache:', err);
  }
}

/**
 * 批次修剪無效快取：將不在 validSlugs 中的雲端已刪除旅程自 localStorage 清理
 */
export function pruneInvalidTripCaches(validSlugs: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const validSet = new Set(validSlugs);
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TRIP_CACHE_PREFIX)) {
        const slug = key.replace(TRIP_CACHE_PREFIX, '');
        if (!validSet.has(slug)) {
          keysToRemove.push(slug);
        }
      }
    }

    keysToRemove.forEach((slug) => {
      removeLocalTripCache(slug);
    });
  } catch (err) {
    console.error('Failed to prune invalid trip caches:', err);
  }
}

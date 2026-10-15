import { FullTripData } from '@/types/travel';

const NICKNAME_KEY = 'travel_member_nickname';
const DEVICE_ID_KEY = 'travel_device_id';
const TRIP_CACHE_PREFIX = 'travel_trip_cache_';

export function getStoredNickname(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NICKNAME_KEY) || '';
}

export function setStoredNickname(nickname: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NICKNAME_KEY, nickname.trim());
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getLocalTripCache(slug: string): FullTripData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${TRIP_CACHE_PREFIX}${slug}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse local trip cache:', err);
    return null;
  }
}

export function setLocalTripCache(slug: string, data: FullTripData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${TRIP_CACHE_PREFIX}${slug}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save trip to local cache:', err);
  }
}

export function removeLocalTripCache(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${TRIP_CACHE_PREFIX}${slug}`);
  } catch (err) {
    console.error('Failed to remove trip from local cache:', err);
  }
}

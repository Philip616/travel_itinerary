/**
 * Google Maps 原生 App Deep Link / Universal Link 輔助工具
 * 特點：不載入外部 Google Maps JavaScript SDK，零圖磚流量、零 API 費用，
 * 在手機端直接喚醒原生 Google Maps 應用程式啟動導航。
 */

export function getGoogleMapsSearchUrl(nameOrAddress: string): string {
  const query = encodeURIComponent(nameOrAddress.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleMapsDirectionsUrl(destination: string, origin?: string): string {
  const dest = encodeURIComponent(destination.trim());
  if (origin) {
    const orig = encodeURIComponent(origin.trim());
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&origin=${orig}&travelmode=transit`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=transit`;
}

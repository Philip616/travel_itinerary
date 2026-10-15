# Spec: 旅程協同規劃體驗與快取同步強化 (Travel Collaboration & Sync Enhancements)

## Objective
本專案為免註冊的即時好友旅遊協同規劃平台。針對目前使用者在實際使用體驗與資料一致性上的缺陷，進行系統化補強：
1. **行程名稱與每日主題自訂**：允許協同成員即時自訂修改「旅程主題名稱」與「每日自訂主題」（例如 Day 1：淺草文化巡禮），固定原始起訖日期與總天數以確保行程結構安全。
2. **協同成員退出與主辦人移除**：支援成員「自行退出」（清空本地登記與快取後返回首頁），並支援主辦人憑 4 位數 PIN 碼「強制移除成員」；皆保留該成員已建立的景點與留言以保全行程資料。
3. **房間專屬暱稱隔離**：廢除全域自動靜默註冊機制，全面實施房間級（Room-scoped）獨立暱稱管理。初次進入新房間時強制彈窗提示確認暱稱，確認後方寫入成員名單。
4. **雲端線上狀態與本地快取強同步**：建構三重同步機制（首頁背景校驗修剪、房間 404 立即淨空引導、WebSocket 常駐即時監聽刪除與踢除事件），徹底根除「線上已刪除但本機仍殘留殭屍資料」的問題。

---

## Assumptions
1. **資料表 Schema 零更動**：PostgreSQL 既有的 `trips.title`、`itinerary_days.theme`、`trip_members` 已具備所需欄位，不需進行破壞性資料庫 Migration。
2. **天數與起訖日期固定**：起訖日期與總天數保持不變，不涉及刪減天數時的景點重新分配或丟棄邏輯。
3. **既有技術棧沿用**：採用既有 React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase 架構，不引進額外大型狀態管理庫。
4. **權限劃分準則**：
   - 旅程名稱與每日主題：全體房間成員皆可編輯並即時廣播。
   - 自行退出：各裝置使用者可自行發動。
   - 強制踢除成員：僅持有建立時 4 位數 PIN 碼的主辦人可執行。

---

## Tech Stack
- **Frontend Framework**: React 19.3.0
- **Build Tool**: Vite 8.3.4
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Backend / Database / Realtime**: Supabase (PostgreSQL + Realtime WebSocket)
- **Local Persistence**: Browser `localStorage` (Scoped keys)
- **Icons**: Lucide React

---

## Commands
```bash
# 本地開發伺服器
npm run dev

# 專案型別檢查與正式建置
npm run build

# 程式碼風格與語法檢查
npm run lint

# 本地預覽建置成果
npm run preview
```

---

## Project Structure
```
src/
├── components/
│   ├── DaySelector.tsx          # 每日天數列（增加展示與編輯每日主題）
│   ├── NicknameModal.tsx        # 暱稱輸入彈窗（支援房間專屬設定）
│   ├── AdminPinModal.tsx        # 主辦人 4 位數 PIN 碼安全防呆彈窗
│   └── BottomNav.tsx            # 行動端底部導航
├── lib/
│   ├── storage.ts               # 本地快取層（改為 room-scoped 儲存與快取修剪工具）
│   └── supabase.ts              # 資料庫與即時同步層（名稱更新、成員退出/踢除、快取校驗）
├── pages/
│   ├── HomePage.tsx             # 首頁（掛載時自動校驗雲端清單並清除失效快取）
│   └── TripDetailPage.tsx       # 旅程主頁（即時主題編輯、成員退出/踢除、WebSocket 刪除監聽）
├── types/
│   └── travel.ts                # TypeScript 型別定義
docs/
└── spec-travel-improvements.md   # 本規範文件
```

---

## Code Style & Conventions
1. **純函式與明確命名**：資料存取函式必須明確區分 Room 作用域與全域作用域。
2. **錯誤防禦標準格式**：遇到不可預期錯誤時，依照「狀態 + 根本原因 + 建議修正」記錄或提示。
3. **示範樣式規範**：
```typescript
// 房間專屬暱稱存取樣式
export function getRoomNickname(slug: string): string {
  if (typeof window === 'undefined' || !slug) return '';
  return localStorage.getItem(`travel_nickname_${slug}`) || '';
}

export function setRoomNickname(slug: string, nickname: string): void {
  if (typeof window === 'undefined' || !slug) return;
  localStorage.setItem(`travel_nickname_${slug}`, nickname.trim());
}
```

---

## Testing & Verification Strategy
1. **靜態型別與語法檢驗**：執行 `npm run build` 確保 TypeScript 編譯無錯誤、無型別破壞。
2. **功能驗證清單（手動驗證情境）**：
   - **情境 1（名稱與主題）**：修改旅程名稱與 Day 1 主題，重整頁面確認資料庫與快取均同步持久化；多分頁測試 WebSocket 即時同步。
   - **情境 2（成員退出）**：使用者 A 點選「退出房間」，確認 `trip_members` 紀錄被刪除、本機快取淨空並導回首頁。
   - **情境 3（成員踢除）**：主辦人點選特定成員旁的「移除」並輸入正確 PIN 碼，確認該成員被移除；被踢除成員畫面即時反應。
   - **情境 4（新房間暱稱隔離）**：開新無痕視窗或新旅程房間，確認不會自動靜默註冊舊暱稱，必先彈窗要求確認。
   - **情境 5（刪除同步）**：線上刪除旅程後，首頁載入自動清除本機快取；正在瀏覽該旅程的客戶端透過 Realtime 收到刪除廣播後彈窗導回首頁。

---

## Boundaries
- **Always do:**
  - 修改 `trips` 與 `itinerary_days` 時，同步更新本地快取以維持離線可讀性。
  - 進入房間前必須明確驗證該房間專屬暱稱是否存在，不存在時禁止背景靜默向伺服器登記。
  - 涉及主辦人危險操作（刪除旅程、踢除成員）必須強制通過 `AdminPinModal` 驗證 PIN 碼。
- **Ask first:**
  - 修改 PostgreSQL 資料表結構（Schema DDL）。
  - 引進新的外部 npm 依賴套件。
- **Never do:**
  - 刪除成員時連帶硬刪除其景點與留言（不可破壞協同歷史）。
  - 在雲端已確認 404（不存在）時依然 fallback 到本地舊快取。
  - 將未脫敏的 PIN 碼明文寫入本地快取或傳遞給客戶端非主辦人介面。

---

## Success Criteria
1. **名稱與主題**：使用者可在 UI 上隨時變更「旅程主題名稱」與「各天主題」，並在所有協同者端無刷新即時同步。
2. **退出與踢除**：提供明確「退出此房間」按鈕；成員清單提供具備 PIN 防呆的「移除成員」功能。
3. **暱稱隔離**：開啟全新未訪問過的房間網址時，100% 觸發暱稱確認彈窗，不再暗中綁定前一房間之暱稱。
4. **狀態同步**：首頁「最近瀏覽旅程」不再顯示任何雲端已被刪除的旅程；旅程若於雲端被刪除，訪客進入或常駐時均能於 2 秒內偵測並清除本機快取導回首頁。
5. **編譯驗證**：`npm run build` 通過且零型別錯誤。

---

## Open Questions
*目前決策樹分支已於 `/grill-me` 階段全部收斂，無未決問題。*

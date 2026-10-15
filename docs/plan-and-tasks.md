# Technical Implementation Plan & Tasks: 旅程協同規劃體驗與快取同步強化

## Phase 2: Technical Implementation Plan

### 1. 系統模組相依性分析
```
[src/lib/storage.ts] (底層快取與 Room-scoped 暱稱存取)
        ▲
        │
[src/lib/supabase.ts] (API 操作、404 清除、存在性校驗)
        ▲
        ├─────────────────────────────┐
        │                             │
[src/pages/HomePage.tsx]      [src/pages/TripDetailPage.tsx]
 (首頁自動修剪殭屍快取)         (名稱主題編輯、退出/踢除、WebSocket 刪除監聽)
                                      ▲
                                      │
                              [src/components/DaySelector.tsx]
                               (天數列主題展示與編輯連動)
```

### 2. 實作順序與依賴控制
1. **第一步（儲存核心）**：`src/lib/storage.ts` —— 擴充 Room-scoped 暱稱存取與失效快取修剪工具。
2. **第二步（通訊與資料庫核心）**：`src/lib/supabase.ts` —— 實作主題更新、成員退出、主辦人踢除、有效性校驗，並修正 `fetchFullTrip` 的 404 清除邏輯。
3. **第三步（首頁修剪）**：`src/pages/HomePage.tsx` —— 引入雲端有效性校驗，清除線上已刪除的本地殭屍旅程。
4. **第四步（介面擴展）**：`src/components/DaySelector.tsx` —— 增加每日主題展示與編輯支援。
5. **第五步（主頁全面串接）**：`src/pages/TripDetailPage.tsx` —— 串接旅程標題與每日主題編輯、徹底去除靜默註冊、實作成員退出與主辦人踢除、實作 WebSocket 旅程刪除與被踢除監聽。
6. **第六步（驗證與檢查）**：執行 `npm run build` 與 TypeScript 編譯檢驗。

---

## Phase 3: Task Breakdown

- [x] **Task 1: 實作 Room-scoped 暱稱隔離與快取修剪工具**
  - **Acceptance**: `storage.ts` 提供 `getRoomNickname`、`setRoomNickname`、`removeRoomNickname` 及 `pruneInvalidTripCaches`。全域 `travel_member_nickname` 僅作為預設建議值。
  - **Verify**: 型別檢查無誤，函式單元邏輯正確。
  - **Files**: `src/lib/storage.ts`

- [x] **Task 2: 實作主題更新、成員退出/踢除與 404 快取淨空 API**
  - **Acceptance**: 
    1. `updateTripTitle`、`updateDayTheme` 可更新 Supabase 與本地快取。
    2. `leaveTripMember`、`removeTripMember` 可刪除 `trip_members` 紀錄並維護快取。
    3. `validateExistingSlugs` 可批次查驗雲端有效旅程。
    4. `fetchFullTrip` 遇到 404（PGRST116 查無此旅程）時清空本地快取並回傳 `{ notFound: true }`，不再錯誤 fallback。
  - **Verify**: `npm run build` 型別通過。
  - **Files**: `src/lib/supabase.ts`

- [x] **Task 3: 首頁自動校驗並清理線上已刪除的殭屍快取**
  - **Acceptance**: 首頁載入時若已連線 Supabase，自動向雲端核對本機快取；已被線上刪除的旅程自動自 `localStorage` 移除且不顯示於「最近瀏覽旅程」。
  - **Verify**: 啟動首頁無報錯，快取修剪邏輯正常觸發。
  - **Files**: `src/pages/HomePage.tsx`

- [x] **Task 4: 天數導航列擴充每日主題展示與編輯聯動**
  - **Acceptance**: `DaySelector.tsx` 支援呈現各天自訂主題（theme），提供直覺視覺呈現。
  - **Verify**: 元件 Props 與型別正確，畫面正常呈現。
  - **Files**: `src/components/DaySelector.tsx`

- [x] **Task 5: 旅程主頁全面整合（名稱與主題編輯、暱稱隔離、退出與踢除、Realtime 刪除監聽）**
  - **Acceptance**:
    1. 支援修改旅程主題名稱與每日行程主題，並即時廣播更新。
    2. 首次進入新房間強制跳出暱稱輸入彈窗，絕不背景靜默註冊。
    3. 設定分頁提供「退出此旅程」按鈕，點擊後清理並返回首頁。
    4. 成員清單提供「移除成員」按鈕，需驗證 4 位數 PIN 碼，驗證後從房間除名。
    5. Realtime 監聽 `trips` 與 `trip_members` 的 `DELETE` 事件，即刻連動導回首頁。
  - **Verify**: 操作流程順暢，無任何 React 運行期警告或未捕獲異常。
  - **Files**: `src/pages/TripDetailPage.tsx`

- [x] **Task 6: 專案全量建置與驗證**
  - **Acceptance**: 執行 `npm run build`，TypeScript 編譯零錯誤，Vite 生產包打包成功。
  - **Verify**: `npm run build` 退出碼為 0，`eslint .` 檢查通過。
  - **Files**: 全專案

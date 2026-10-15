# Travel Planner (旅遊行程協同規劃平台)

專為好友群組出遊打造的旅遊行程協同規劃 Web App / PWA。具備**免帳號即時協同**、**電腦與手機雙模自適應 (Responsive Dual-Mode)**、**雙欄互動地圖預覽**與**離線快取支援**。

---

## 🌟 核心特色

1. **免註冊專屬房間協同**：
   - 建立旅程後立即生成專屬短代碼與分享網址，丟到 LINE 群組點開即可加入。
   - 每位成員輸入暱稱即可新增景點、排定時程、按讚票選與登記機票。
2. **電腦網頁與手機雙模自適應**：
   - **電腦網頁版**：採用雙欄儀表板佈局，左側時間軸與景點卡片、右側常駐互動地圖與預算統計，上方整合導航列。
   - **手機行動版**：保留拇指友善的底部導航與輕量流暢操作。
3. **雙欄互動地圖即時預覽**：
   - 點擊任一景點或住宿，右側地圖自動定位並聚焦。
   - 支援快速切換景點標籤與一鍵喚醒 Google 地圖導航。
4. **主辦人 4 位數 PIN 碼防呆**：
   - 一般成員自由參與編輯與留言。
   - 刪除整趟旅程或修改核心日期需輸入主辦人管理密碼，避免群組成員誤刪。
5. **每日行程即時時間軸**：
   - 橫向滑動切換天數（Day 1, Day 2...）。
   - 支援景點類別標籤（景點、美食、購物、交通）、預估費用、時段規劃。
   - 景點按讚投票與留言討論抽屜。
6. **當晚住宿自動帶入**：
   - 登記飯店起訖日期後，系統自動於每日行程頂端顯示「當晚住宿」與導航按鈕，省去重複輸入。
7. **獨立航班對照表分頁**：
   - 清楚條列不同成員的去程與回程班機時間、航廈、航班編號，方便各路好友接送與集合。
8. **PWA + 本地快取**：
   - 支援安裝至手機主畫面（Add to Home Screen）。
   - 內建離線快取機制，弱網環境下依然能順暢開啟並查閱所有行程與航班。

---

## 🛠 技術堆疊

- **前端框架與打包**：Vite + React 19 (SPA, React Router v7)
- **樣式設計**：Tailwind CSS v4 (原生 `@tailwindcss/vite` 插件)
- **圖示庫**：Lucide React
- **資料庫與即時同步**：Supabase (PostgreSQL + Realtime WebSocket)
- **離線與快取**：PWA Web Manifest + 本地 LocalStorage 快取
- **代管部署**：Vercel / Cloudflare Pages / GitHub Pages 等靜態託管平台

---

## 🚀 快速開始

### 1. 安裝相依套件

```bash
npm install
```

### 2. 環境變數配置

複製 `.env.local.example` 為 `.env.local`：

```bash
cp .env.local.example .env.local
```

填入你的 Supabase 專案資訊：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> [!NOTE]
> 本應用內建離線/本地快取容錯機制。即使尚未配置 Supabase 金鑰，依然能以本地 LocalStorage 完整體驗所有建立、編輯、投票與導航功能。

### 3. Supabase 資料庫設定

登入 [Supabase Dashboard](https://supabase.com)，前往 **SQL Editor**，執行專案底下的 SQL 檔案：
```text
supabase/schema.sql
```
該腳本會自動建立所有必要資料表、索引、RLS 安全政策與 Realtime 推播訂閱。

### 4. 本地啟動開發伺服器

```bash
npm run dev
```

在手機或瀏覽器開啟 `http://localhost:5173` 即可預覽。

---

## 📦 部署至 Vercel

1. 將本專案 Push 至你的 GitHub Repository：
   ```bash
   git add .
   git commit -m "feat: complete travel planner app"
   git push origin main
   ```
2. 前往 [Vercel Dashboard](https://vercel.com/)，點擊 **Add New Project** 並匯入該 GitHub Repo。
3. 在 **Environment Variables** 新增：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 點擊 **Deploy**，約 1 分鐘內即可完成全自動建置與上線！

-- ============================================================
-- Migration: Add Third-Party Auth Support to Trips & Trip Members
-- ============================================================

-- 1. 於 trips 表新增建立者 user_id 關聯
alter table public.trips 
add column if not exists created_by uuid references auth.users(id) on delete set null;

-- 2. 於 trip_members 表新增使用者 user_id 關聯，以利跨設備（手機/電腦）登入同步
alter table public.trip_members 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 3. 建立索引加速「使用者加入的旅程清單」查詢
create index if not exists idx_trip_members_user on public.trip_members(user_id);
create index if not exists idx_trips_created_by on public.trips(created_by);

-- 4. 確保同一個使用者在同一趟旅程中只有一筆成員登記（允許訪客 user_id 為 null）
create unique index if not exists idx_trip_members_trip_user 
on public.trip_members (trip_id, user_id) 
where user_id is not null;

-- 5. 更新 RLS 政策以支援登入用戶與訪客共存
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

-- 確保公開讀寫政策依舊運作（避免阻斷未登入訪客協同）
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'trip_members' and policyname = 'Allow public all access on members'
  ) then
    create policy "Allow public all access on members" on public.trip_members for all using (true) with check (true);
  end if;
end $$;

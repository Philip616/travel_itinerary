-- ============================================================
-- Travel Planner Database Schema (Supabase PostgreSQL)
-- ============================================================

-- 1. Trips 表 (旅程主要資訊)
create table if not exists public.trips (
    id uuid default gen_random_uuid() primary key,
    slug text not null unique,
    title text not null,
    start_date date not null,
    end_date date not null,
    pin_hash text not null,
    created_at timestamptz default now() not null
);

-- 2. Trip Members 表 (成員暱稱與設備識別)
create table if not exists public.trip_members (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    nickname text not null,
    device_id text not null,
    created_at timestamptz default now() not null
);

-- 3. Itinerary Days 表 (行程各天)
create table if not exists public.itinerary_days (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    day_number integer not null,
    date date not null,
    theme text default '',
    created_at timestamptz default now() not null
);

-- 4. Accommodations 表 (住宿資訊)
create table if not exists public.accommodations (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    name text not null,
    check_in date not null,
    check_out date not null,
    address text default '',
    google_map_url text default '',
    booking_ref text default '',
    phone text default '',
    note text default '',
    created_at timestamptz default now() not null
);

-- 5. Flights 表 (航班資訊)
create table if not exists public.flights (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    member_name text not null,
    flight_type text not null check (flight_type in ('DEPARTURE', 'RETURN')),
    flight_number text default '',
    departure_airport text default '',
    arrival_airport text default '',
    departure_time timestamptz,
    arrival_time timestamptz,
    terminal text default '',
    note text default '',
    created_at timestamptz default now() not null
);

-- 6. Spot Items 表 (景點與每日行程時段項目)
create table if not exists public.spot_items (
    id uuid default gen_random_uuid() primary key,
    day_id uuid references public.itinerary_days(id) on delete cascade not null,
    title text not null,
    time_slot text default '',
    category text default 'ATTRACTION' check (category in ('ATTRACTION', 'FOOD', 'SHOPPING', 'TRANSPORT', 'OTHER')),
    address text default '',
    google_map_url text default '',
    cost_estimate text default '',
    sort_order integer default 0 not null,
    created_by text default '',
    created_at timestamptz default now() not null
);

-- 7. Spot Votes 表 (景點投票)
create table if not exists public.spot_votes (
    id uuid default gen_random_uuid() primary key,
    spot_id uuid references public.spot_items(id) on delete cascade not null,
    member_name text not null,
    vote_type text not null check (vote_type in ('UP', 'DOWN')),
    created_at timestamptz default now() not null,
    unique(spot_id, member_name)
);

-- 8. Spot Comments 表 (景點討論留言)
create table if not exists public.spot_comments (
    id uuid default gen_random_uuid() primary key,
    spot_id uuid references public.spot_items(id) on delete cascade not null,
    member_name text not null,
    content text not null,
    created_at timestamptz default now() not null
);

-- 9. Accommodation Comments 表 (住宿候選與心得討論留言)
create table if not exists public.accommodation_comments (
    id uuid default gen_random_uuid() primary key,
    accommodation_id uuid references public.accommodations(id) on delete cascade not null,
    member_name text not null,
    content text not null,
    created_at timestamptz default now() not null
);

-- 建立索引以確保即時查詢效能
create index if not exists idx_trips_slug on public.trips(slug);
create index if not exists idx_itinerary_days_trip on public.itinerary_days(trip_id, day_number);
create index if not exists idx_spot_items_day on public.spot_items(day_id, sort_order);
create index if not exists idx_flights_trip on public.flights(trip_id);
create index if not exists idx_accommodations_trip on public.accommodations(trip_id);
create index if not exists idx_accommodation_comments_acc on public.accommodation_comments(accommodation_id);

-- 啟用 Row Level Security (RLS) 並允許房間成員公開讀寫
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.accommodations enable row level security;
alter table public.flights enable row level security;
alter table public.spot_items enable row level security;
alter table public.spot_votes enable row level security;
alter table public.spot_comments enable row level security;
alter table public.accommodation_comments enable row level security;

-- 免帳號房間連結協同的 RLS 政策 (開放讀取與寫入)
create policy "Allow public read access" on public.trips for select using (true);
create policy "Allow public insert access" on public.trips for insert with check (true);
create policy "Allow public update access" on public.trips for update using (true);
create policy "Allow public delete access" on public.trips for delete using (true);

create policy "Allow public all access on members" on public.trip_members for all using (true) with check (true);
create policy "Allow public all access on days" on public.itinerary_days for all using (true) with check (true);
create policy "Allow public all access on accommodations" on public.accommodations for all using (true) with check (true);
create policy "Allow public all access on flights" on public.flights for all using (true) with check (true);
create policy "Allow public all access on spots" on public.spot_items for all using (true) with check (true);
create policy "Allow public all access on votes" on public.spot_votes for all using (true) with check (true);
create policy "Allow public all access on comments" on public.spot_comments for all using (true) with check (true);
create policy "Allow public all access on accommodation_comments" on public.accommodation_comments for all using (true) with check (true);

-- 啟用 Supabase Realtime 即時廣播
alter publication supabase_realtime add table public.itinerary_days;
alter publication supabase_realtime add table public.spot_items;
alter publication supabase_realtime add table public.spot_votes;
alter publication supabase_realtime add table public.spot_comments;
alter publication supabase_realtime add table public.flights;
alter publication supabase_realtime add table public.accommodations;
alter publication supabase_realtime add table public.accommodation_comments;

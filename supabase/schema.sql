-- ============================================================
-- PRODE MUNDIAL 2026 - Schema Supabase (CORREGIDO)
-- ============================================================

-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Se crea automáticamente cuando un usuario se registra
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Usuarios pueden ver todos los perfiles"
  on public.profiles for select using (true);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLA: groups
-- ============================================================
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  admin_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.groups enable row level security;

-- Para evitar recursión infinita, las políticas de groups verifican los miembros directamente de group_members
-- SIN depender de otra política SELECT en group_members.

create policy "Usuarios autenticados pueden crear grupos"
  on public.groups for insert
  with check (auth.uid() = admin_id);

create policy "Solo el admin puede actualizar el grupo"
  on public.groups for update
  using (auth.uid() = admin_id);

create policy "Miembros pueden ver su grupo"
  on public.groups for select
  using (
    auth.uid() = admin_id -- El admin siempre puede ver
    OR
    id IN (
      select gm.group_id 
      from public.group_members gm 
      where gm.user_id = auth.uid()
    )
  );

-- ============================================================
-- TABLA: group_members
-- ============================================================
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Miembros pueden ver otros miembros del grupo"
  on public.group_members for select
  using (
    group_id IN (
      select gm.group_id 
      from public.group_members gm 
      where gm.user_id = auth.uid()
    )
  );

create policy "Usuarios autenticados pueden unirse a grupos"
  on public.group_members for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- TABLA: matches (fixture hardcodeado del Mundial 2026)
-- ============================================================
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  match_number integer not null,
  phase text not null default 'group', -- 'group', 'round_of_32', etc
  group_name text, -- 'A', 'B', etc
  home_team text not null,
  away_team text not null,
  home_flag text, -- emoji de bandera
  away_flag text,
  match_date timestamptz not null,
  venue text,
  city text,
  home_score integer, -- null hasta que se juegue
  away_score integer, -- null hasta que se juegue
  status text default 'scheduled', -- 'scheduled', 'live', 'finished'
  created_at timestamptz default now()
);

alter table public.matches enable row level security;

create policy "Todos pueden ver partidos"
  on public.matches for select using (true);

-- Solo superadmin puede modificar partidos (via Supabase dashboard)
create policy "Solo service_role puede modificar partidos"
  on public.matches for all
  using (auth.role() = 'service_role');

-- ============================================================
-- TABLA: predictions
-- ============================================================
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  points integer default 0, -- se calcula cuando el partido termina
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id, group_id)
);

alter table public.predictions enable row level security;

create policy "Usuarios pueden ver predicciones de su grupo"
  on public.predictions for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = predictions.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Usuarios pueden crear sus propias predicciones"
  on public.predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches
      where matches.id = match_id
      and matches.match_date > now() + interval '7 days'
      and matches.status = 'scheduled'
    )
  );

create policy "Usuarios pueden actualizar predicciones hasta 7 días antes"
  on public.predictions for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches
      where matches.id = match_id
      and matches.match_date > now() + interval '7 days'
      and matches.status = 'scheduled'
    )
  );

-- ============================================================
-- FUNCIÓN: calcular puntos automáticamente cuando se carga resultado
-- ============================================================
create or replace function public.calculate_points()
returns trigger as $$
begin
  -- Solo calcular si el partido terminó y tiene resultado
  if new.status = 'finished' and new.home_score is not null and new.away_score is not null then
    update public.predictions
    set points = case
      -- Resultado exacto: 3 puntos
      when predicted_home_score = new.home_score 
        and predicted_away_score = new.away_score then 3
      -- Ganador/empate correcto: 1 punto
      when (
        (predicted_home_score > predicted_away_score and new.home_score > new.away_score) or
        (predicted_home_score < predicted_away_score and new.home_score < new.away_score) or
        (predicted_home_score = predicted_away_score and new.home_score = new.away_score)
      ) then 1
      -- Incorrecto: 0 puntos
      else 0
    end
    where match_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_match_result_updated
  after update on public.matches
  for each row execute procedure public.calculate_points();

-- ============================================================
-- VISTA: leaderboard por grupo
-- ============================================================
create or replace view public.leaderboard as
select
  gm.group_id,
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  coalesce(sum(pred.points), 0) as total_points,
  count(pred.id) filter (where pred.points = 3) as exact_results,
  count(pred.id) filter (where pred.points = 1) as partial_results,
  count(pred.id) filter (where pred.points = 0 and pred.id is not null) as wrong_results,
  count(pred.id) as total_predictions
from public.group_members gm
join public.profiles p on p.id = gm.user_id
left join public.predictions pred on pred.user_id = gm.user_id and pred.group_id = gm.group_id
group by gm.group_id, p.id, p.full_name, p.avatar_url
order by total_points desc;

-- RLS para la vista
create policy "Miembros pueden ver el leaderboard de su grupo"
  on public.group_members for select
  using (auth.uid() = user_id);

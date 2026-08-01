-- 류현상 키우기 v146 : 1:1 루미큐브 대전 Supabase 설정
-- 기존 커뮤니티/퀴즈 대전 DB는 건드리지 않습니다.

create table if not exists public.rummy_rooms (
  code text primary key,
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  stake integer not null default 0 check (stake between 0 and 1000000),
  turn_user_id uuid references auth.users(id) on delete set null,
  winner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rummy_players (
  room_code text not null references public.rummy_rooms(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname varchar(16) not null,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_code,user_id)
);

create table if not exists public.rummy_game_state (
  room_code text primary key references public.rummy_rooms(code) on delete cascade,
  bag integer[] not null default '{}',
  melds jsonb not null default '[]'::jsonb,
  initial_done jsonb not null default '{}'::jsonb
);

create table if not exists public.rummy_hands (
  room_code text not null references public.rummy_rooms(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tiles integer[] not null default '{}',
  primary key (room_code,user_id)
);

alter table public.rummy_rooms enable row level security;
alter table public.rummy_players enable row level security;
alter table public.rummy_game_state enable row level security;
alter table public.rummy_hands enable row level security;

create or replace function public.rummy_is_participant(p_room_code text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.rummy_players
    where room_code=upper(trim(p_room_code))
      and user_id=auth.uid()
      and left_at is null
  );
$$;

revoke all on function public.rummy_is_participant(text) from public;
grant execute on function public.rummy_is_participant(text) to authenticated;

drop policy if exists "rummy_rooms_read" on public.rummy_rooms;
drop policy if exists "rummy_players_read" on public.rummy_players;
create policy "rummy_rooms_read" on public.rummy_rooms
for select to authenticated using (public.rummy_is_participant(code));
create policy "rummy_players_read" on public.rummy_players
for select to authenticated using (public.rummy_is_participant(room_code));

grant select on public.rummy_rooms,public.rummy_players to authenticated;
revoke all on public.rummy_game_state,public.rummy_hands from anon,authenticated;
revoke insert,update,delete on public.rummy_rooms,public.rummy_players from anon,authenticated;

create or replace function public.rummy_tile_number(p_tile integer)
returns integer language sql immutable as $$
  select case when p_tile between 0 and 103 then ((p_tile % 26) / 2) + 1 else 0 end;
$$;

create or replace function public.rummy_tile_color(p_tile integer)
returns integer language sql immutable as $$
  select case when p_tile between 0 and 103 then p_tile / 26 else -1 end;
$$;

create or replace function public.rummy_valid_meld(p_tiles integer[])
returns boolean
language plpgsql
immutable
as $$
declare
  v_n integer := coalesce(cardinality(p_tiles),0);
  v_jokers integer;
  v_non integer;
  v_num_count integer;
  v_color_count integer;
  v_min integer;
  v_max integer;
  v_gap integer;
  v_extra integer;
begin
  if v_n < 3 or v_n > 13 then return false; end if;
  if (select count(*) from unnest(p_tiles) x) <> (select count(distinct x) from unnest(p_tiles) x) then return false; end if;
  if exists(select 1 from unnest(p_tiles) x where x < 0 or x > 105) then return false; end if;

  select count(*) filter(where x>=104), count(*) filter(where x<104)
  into v_jokers,v_non from unnest(p_tiles) x;

  if v_non=0 then return v_n between 3 and 4; end if;

  select count(distinct public.rummy_tile_number(x)),
         count(distinct public.rummy_tile_color(x)),
         min(public.rummy_tile_number(x)),
         max(public.rummy_tile_number(x))
  into v_num_count,v_color_count,v_min,v_max
  from unnest(p_tiles) x where x<104;

  -- 그룹: 같은 숫자, 서로 다른 색, 3~4장
  if v_n<=4 and v_num_count=1 then
    if (select count(distinct public.rummy_tile_color(x)) from unnest(p_tiles) x where x<104)=v_non then
      return true;
    end if;
  end if;

  -- 런: 같은 색, 중복 숫자 없음, 조커는 빈칸/양 끝을 채움
  if v_color_count=1 and v_num_count=v_non then
    v_gap := (v_max-v_min+1)-v_non;
    if v_gap<=v_jokers then
      v_extra := v_jokers-v_gap;
      if v_extra <= (v_min-1)+(13-v_max) then return true; end if;
    end if;
  end if;
  return false;
end;
$$;

create or replace function public.rummy_meld_score(p_tiles integer[])
returns integer
language sql
immutable
as $$
  select coalesce(sum(public.rummy_tile_number(x)),0)::integer
  from unnest(p_tiles) x where x<104;
$$;

create or replace function public.rummy_healthcheck()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  return jsonb_build_object('ok',true,'version',146);
end;
$$;

create or replace function public.rummy_create_room(p_nickname text,p_stake integer)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare v_uid uuid:=auth.uid(); v_code text; i integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if nullif(trim(p_nickname),'') is null then raise exception '닉네임이 필요합니다.'; end if;
  if p_stake is null or p_stake<0 or p_stake>1000000 then raise exception '판돈은 0원부터 100만원까지 가능합니다.'; end if;
  delete from public.rummy_rooms where created_at < now()-interval '2 hours';
  for i in 1..20 loop
    v_code:=upper(substr(md5(random()::text||clock_timestamp()::text||v_uid::text),1,8));
    exit when not exists(select 1 from public.rummy_rooms where code=v_code);
  end loop;
  if exists(select 1 from public.rummy_rooms where code=v_code) then raise exception '방을 만들지 못했습니다.'; end if;
  insert into public.rummy_rooms(code,host_id,status,stake) values(v_code,v_uid,'waiting',p_stake);
  insert into public.rummy_players(room_code,user_id,nickname,ready) values(v_code,v_uid,left(trim(p_nickname),16),false);
  return v_code;
end;
$$;

create or replace function public.rummy_list_open_rooms()
returns table(room_code text,host_nickname text,stake integer,player_count integer,is_mine boolean)
language sql
security definer
set search_path=public
as $$
  select r.code,
         coalesce((select p.nickname from public.rummy_players p where p.room_code=r.code and p.user_id=r.host_id limit 1),'익명'),
         r.stake,
         (select count(*)::integer from public.rummy_players p where p.room_code=r.code and p.left_at is null),
         (r.host_id=auth.uid())
  from public.rummy_rooms r
  where r.status='waiting'
    and (select count(*) from public.rummy_players p where p.room_code=r.code and p.left_at is null)<2
    and r.created_at>now()-interval '2 hours'
  order by r.created_at desc
  limit 30;
$$;

create or replace function public.rummy_join_room(p_code text,p_nickname text)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare v_uid uuid:=auth.uid(); v_code text:=upper(trim(p_code)); v_status text; v_count integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if nullif(trim(p_nickname),'') is null then raise exception '닉네임이 필요합니다.'; end if;
  select status into v_status from public.rummy_rooms where code=v_code for update;
  if not found then raise exception '존재하지 않는 방입니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작했거나 종료된 방입니다.'; end if;
  if exists(select 1 from public.rummy_players where room_code=v_code and user_id=v_uid) then
    update public.rummy_players set nickname=left(trim(p_nickname),16),left_at=null where room_code=v_code and user_id=v_uid;
    return v_code;
  end if;
  select count(*) into v_count from public.rummy_players where room_code=v_code and left_at is null;
  if v_count>=2 then raise exception '이미 두 명이 참가한 방입니다.'; end if;
  insert into public.rummy_players(room_code,user_id,nickname,ready) values(v_code,v_uid,left(trim(p_nickname),16),false);
  update public.rummy_rooms set updated_at=now() where code=v_code;
  return v_code;
end;
$$;

create or replace function public.rummy_set_ready(p_code text,p_ready boolean)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.rummy_is_participant(p_code) then raise exception '참가자가 아닙니다.'; end if;
  if not exists(select 1 from public.rummy_rooms where code=upper(trim(p_code)) and status='waiting') then raise exception '대기 중인 방이 아닙니다.'; end if;
  update public.rummy_players set ready=p_ready where room_code=upper(trim(p_code)) and user_id=auth.uid() and left_at is null;
  update public.rummy_rooms set updated_at=now() where code=upper(trim(p_code));
end;
$$;

create or replace function public.rummy_start_room(p_code text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text:=upper(trim(p_code)); v_uid uuid:=auth.uid(); v_host uuid; v_status text;
  v_users uuid[]; v_deck integer[]; v_initial jsonb; v_first uuid;
begin
  select host_id,status into v_host,v_status from public.rummy_rooms where code=v_code for update;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if v_host<>v_uid then raise exception '방장만 시작할 수 있습니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작된 방입니다.'; end if;
  select array_agg(user_id order by joined_at) into v_users from public.rummy_players where room_code=v_code and left_at is null;
  if coalesce(cardinality(v_users),0)<>2 then raise exception '두 명이 모두 입장해야 합니다.'; end if;
  if (select count(*) from public.rummy_players where room_code=v_code and left_at is null and ready)<>2 then raise exception '두 명 모두 준비해야 합니다.'; end if;
  select array_agg(i order by random()) into v_deck from generate_series(0,105) i;
  delete from public.rummy_hands where room_code=v_code;
  delete from public.rummy_game_state where room_code=v_code;
  insert into public.rummy_hands(room_code,user_id,tiles) values
    (v_code,v_users[1],v_deck[1:14]),(v_code,v_users[2],v_deck[15:28]);
  v_initial:=jsonb_build_object(v_users[1]::text,false,v_users[2]::text,false);
  insert into public.rummy_game_state(room_code,bag,melds,initial_done) values(v_code,v_deck[29:106],'[]'::jsonb,v_initial);
  v_first:=case when random()<0.5 then v_users[1] else v_users[2] end;
  update public.rummy_players set ready=false where room_code=v_code;
  update public.rummy_rooms set status='playing',turn_user_id=v_first,winner_id=null,updated_at=now() where code=v_code;
end;
$$;

create or replace function public.rummy_get_snapshot(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text:=upper(trim(p_room_code)); v_uid uuid:=auth.uid(); v_room public.rummy_rooms%rowtype;
  v_state public.rummy_game_state%rowtype; v_my integer[]; v_other uuid; v_other_count integer:=0;
  v_players jsonb; v_self_initial boolean:=false; v_other_initial boolean:=false;
begin
  if not public.rummy_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.rummy_rooms where code=v_code;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'nickname',p.nickname,'ready',p.ready,'joined_at',p.joined_at,'left_at',p.left_at) order by p.joined_at),'[]'::jsonb)
  into v_players from public.rummy_players p where p.room_code=v_code;
  if v_room.status='playing' or v_room.status='finished' then
    select * into v_state from public.rummy_game_state where room_code=v_code;
    select tiles into v_my from public.rummy_hands where room_code=v_code and user_id=v_uid;
    select user_id into v_other from public.rummy_players where room_code=v_code and user_id<>v_uid and left_at is null limit 1;
    if v_other is not null then
      select coalesce(cardinality(tiles),0) into v_other_count from public.rummy_hands where room_code=v_code and user_id=v_other;
    end if;
    v_self_initial:=coalesce((v_state.initial_done->>v_uid::text)::boolean,false);
    if v_other is not null then v_other_initial:=coalesce((v_state.initial_done->>v_other::text)::boolean,false); end if;
  end if;
  return jsonb_build_object(
    'code',v_room.code,'status',v_room.status,'stake',v_room.stake,'host_id',v_room.host_id,
    'turn_user_id',v_room.turn_user_id,'winner_id',v_room.winner_id,'players',v_players,
    'my_tiles',coalesce(to_jsonb(v_my),'[]'::jsonb),'opponent_count',v_other_count,
    'melds',coalesce(v_state.melds,'[]'::jsonb),'bag_count',coalesce(cardinality(v_state.bag),0),
    'initial_done_self',v_self_initial,'initial_done_opponent',v_other_initial
  );
end;
$$;

create or replace function public.rummy_play_meld(p_room_code text,p_tile_ids integer[])
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text:=upper(trim(p_room_code)); v_uid uuid:=auth.uid(); v_turn uuid; v_status text;
  v_hand integer[]; v_new integer[]; v_state public.rummy_game_state%rowtype; v_done boolean; v_other uuid;
begin
  if not public.rummy_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select status,turn_user_id into v_status,v_turn from public.rummy_rooms where code=v_code for update;
  if v_status<>'playing' then raise exception '진행 중인 대전이 아닙니다.'; end if;
  if v_turn<>v_uid then raise exception '상대방 차례입니다.'; end if;
  if coalesce(cardinality(p_tile_ids),0)<3 then raise exception '3장 이상 선택해 주세요.'; end if;
  if (select count(*) from unnest(p_tile_ids)x)<>(select count(distinct x) from unnest(p_tile_ids)x) then raise exception '같은 패를 중복 선택할 수 없습니다.'; end if;
  select tiles into v_hand from public.rummy_hands where room_code=v_code and user_id=v_uid for update;
  if not (p_tile_ids <@ v_hand) then raise exception '내 패에 없는 타일이 포함되어 있습니다.'; end if;
  if not public.rummy_valid_meld(p_tile_ids) then raise exception '올바른 그룹 또는 연속 숫자가 아닙니다.'; end if;
  select * into v_state from public.rummy_game_state where room_code=v_code for update;
  v_done:=coalesce((v_state.initial_done->>v_uid::text)::boolean,false);
  if not v_done and public.rummy_meld_score(p_tile_ids)<30 then raise exception '첫 등록은 숫자 합계 30점 이상이어야 합니다. 조커는 30점 계산에서 제외됩니다.'; end if;
  select coalesce(array_agg(x order by ord),'{}'::integer[]) into v_new from unnest(v_hand) with ordinality t(x,ord) where not (x=any(p_tile_ids));
  v_state.melds:=v_state.melds||jsonb_build_array(jsonb_build_object('tiles',to_jsonb(p_tile_ids)));
  if not v_done then v_state.initial_done:=jsonb_set(v_state.initial_done,array[v_uid::text],'true'::jsonb,true); end if;
  update public.rummy_hands set tiles=v_new where room_code=v_code and user_id=v_uid;
  update public.rummy_game_state set melds=v_state.melds,initial_done=v_state.initial_done where room_code=v_code;
  if coalesce(cardinality(v_new),0)=0 then
    update public.rummy_rooms set status='finished',winner_id=v_uid,turn_user_id=null,updated_at=now() where code=v_code;
  else
    select user_id into v_other from public.rummy_players where room_code=v_code and user_id<>v_uid and left_at is null limit 1;
    update public.rummy_rooms set turn_user_id=v_other,updated_at=now() where code=v_code;
  end if;
end;
$$;

create or replace function public.rummy_add_to_meld(p_room_code text,p_meld_index integer,p_tile_ids integer[])
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text:=upper(trim(p_room_code)); v_uid uuid:=auth.uid(); v_turn uuid; v_status text;
  v_hand integer[]; v_new integer[]; v_state public.rummy_game_state%rowtype; v_old integer[]; v_combo integer[]; v_other uuid;
begin
  if not public.rummy_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select status,turn_user_id into v_status,v_turn from public.rummy_rooms where code=v_code for update;
  if v_status<>'playing' then raise exception '진행 중인 대전이 아닙니다.'; end if;
  if v_turn<>v_uid then raise exception '상대방 차례입니다.'; end if;
  if coalesce(cardinality(p_tile_ids),0)<1 then raise exception '붙일 패를 선택해 주세요.'; end if;
  select * into v_state from public.rummy_game_state where room_code=v_code for update;
  if not coalesce((v_state.initial_done->>v_uid::text)::boolean,false) then raise exception '먼저 30점 이상 첫 등록을 완료해야 합니다.'; end if;
  if p_meld_index<0 or p_meld_index>=jsonb_array_length(v_state.melds) then raise exception '선택한 묶음을 찾을 수 없습니다.'; end if;
  select tiles into v_hand from public.rummy_hands where room_code=v_code and user_id=v_uid for update;
  if not (p_tile_ids <@ v_hand) then raise exception '내 패에 없는 타일이 포함되어 있습니다.'; end if;
  select array_agg(value::integer) into v_old from jsonb_array_elements_text(v_state.melds->p_meld_index->'tiles');
  v_combo:=v_old||p_tile_ids;
  if not public.rummy_valid_meld(v_combo) then raise exception '이 묶음에는 선택한 패를 붙일 수 없습니다.'; end if;
  select coalesce(array_agg(x order by ord),'{}'::integer[]) into v_new from unnest(v_hand) with ordinality t(x,ord) where not (x=any(p_tile_ids));
  v_state.melds:=jsonb_set(v_state.melds,array[p_meld_index::text,'tiles'],to_jsonb(v_combo),false);
  update public.rummy_hands set tiles=v_new where room_code=v_code and user_id=v_uid;
  update public.rummy_game_state set melds=v_state.melds where room_code=v_code;
  if coalesce(cardinality(v_new),0)=0 then
    update public.rummy_rooms set status='finished',winner_id=v_uid,turn_user_id=null,updated_at=now() where code=v_code;
  else
    select user_id into v_other from public.rummy_players where room_code=v_code and user_id<>v_uid and left_at is null limit 1;
    update public.rummy_rooms set turn_user_id=v_other,updated_at=now() where code=v_code;
  end if;
end;
$$;

create or replace function public.rummy_draw_tile(p_room_code text)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text:=upper(trim(p_room_code)); v_uid uuid:=auth.uid(); v_turn uuid; v_status text;
  v_state public.rummy_game_state%rowtype; v_tile integer; v_other uuid; v_me_count integer; v_other_count integer;
begin
  if not public.rummy_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select status,turn_user_id into v_status,v_turn from public.rummy_rooms where code=v_code for update;
  if v_status<>'playing' then raise exception '진행 중인 대전이 아닙니다.'; end if;
  if v_turn<>v_uid then raise exception '상대방 차례입니다.'; end if;
  select * into v_state from public.rummy_game_state where room_code=v_code for update;
  select user_id into v_other from public.rummy_players where room_code=v_code and user_id<>v_uid and left_at is null limit 1;
  if coalesce(cardinality(v_state.bag),0)=0 then
    select cardinality(tiles) into v_me_count from public.rummy_hands where room_code=v_code and user_id=v_uid;
    select cardinality(tiles) into v_other_count from public.rummy_hands where room_code=v_code and user_id=v_other;
    update public.rummy_rooms set status='finished',winner_id=case when v_me_count<v_other_count then v_uid when v_other_count<v_me_count then v_other else null end,turn_user_id=null,updated_at=now() where code=v_code;
    return null;
  end if;
  v_tile:=v_state.bag[1];
  update public.rummy_hands set tiles=array_append(tiles,v_tile) where room_code=v_code and user_id=v_uid;
  update public.rummy_game_state set bag=case when cardinality(v_state.bag)<=1 then '{}'::integer[] else v_state.bag[2:cardinality(v_state.bag)] end where room_code=v_code;
  update public.rummy_rooms set turn_user_id=v_other,updated_at=now() where code=v_code;
  return v_tile;
end;
$$;

create or replace function public.rummy_leave_room(p_room_code text)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code)); v_uid uuid:=auth.uid(); v_host uuid; v_status text; v_other uuid;
begin
  select host_id,status into v_host,v_status from public.rummy_rooms where code=v_code for update;
  if not found then return 'missing'; end if;
  if not exists(select 1 from public.rummy_players where room_code=v_code and user_id=v_uid and left_at is null) then return 'not_participant'; end if;
  if v_status='waiting' then
    if v_host=v_uid then delete from public.rummy_rooms where code=v_code;
    else delete from public.rummy_players where room_code=v_code and user_id=v_uid; update public.rummy_rooms set updated_at=now() where code=v_code; end if;
    return 'refund';
  end if;
  if v_status='playing' then
    select user_id into v_other from public.rummy_players where room_code=v_code and user_id<>v_uid and left_at is null limit 1;
    update public.rummy_players set left_at=now() where room_code=v_code and user_id=v_uid;
    update public.rummy_rooms set status='finished',winner_id=v_other,turn_user_id=null,updated_at=now() where code=v_code;
    return 'forfeit';
  end if;
  update public.rummy_players set left_at=now() where room_code=v_code and user_id=v_uid;
  return 'finished';
end;
$$;

revoke all on function public.rummy_healthcheck() from public;
revoke all on function public.rummy_create_room(text,integer) from public;
revoke all on function public.rummy_list_open_rooms() from public;
revoke all on function public.rummy_join_room(text,text) from public;
revoke all on function public.rummy_set_ready(text,boolean) from public;
revoke all on function public.rummy_start_room(text) from public;
revoke all on function public.rummy_get_snapshot(text) from public;
revoke all on function public.rummy_play_meld(text,integer[]) from public;
revoke all on function public.rummy_add_to_meld(text,integer,integer[]) from public;
revoke all on function public.rummy_draw_tile(text) from public;
revoke all on function public.rummy_leave_room(text) from public;

grant execute on function public.rummy_healthcheck() to authenticated;
grant execute on function public.rummy_create_room(text,integer) to authenticated;
grant execute on function public.rummy_list_open_rooms() to authenticated;
grant execute on function public.rummy_join_room(text,text) to authenticated;
grant execute on function public.rummy_set_ready(text,boolean) to authenticated;
grant execute on function public.rummy_start_room(text) to authenticated;
grant execute on function public.rummy_get_snapshot(text) to authenticated;
grant execute on function public.rummy_play_meld(text,integer[]) to authenticated;
grant execute on function public.rummy_add_to_meld(text,integer,integer[]) to authenticated;
grant execute on function public.rummy_draw_tile(text) to authenticated;
grant execute on function public.rummy_leave_room(text) to authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='rummy_rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rummy_rooms;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='rummy_players') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rummy_players;
  END IF;
END $$;

alter table public.rummy_rooms replica identity full;
alter table public.rummy_players replica identity full;

select '류현상 키우기 v146 루미큐브 DB 설정 완료!' as result;

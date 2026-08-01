-- 류현상 키우기 v147 : 2~4인 실시간 쿵쿵따 Supabase 설정
-- 기존 커뮤니티/퀴즈/루미큐브 DB는 건드리지 않습니다.

create table if not exists public.kung_dictionary (
  word text primary key,
  check (char_length(word)=3)
);

create table if not exists public.kung_rooms (
  code text primary key,
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  max_players integer not null default 4 check (max_players between 2 and 4),
  current_turn_seat integer,
  current_word text,
  turn_no integer not null default 0,
  turn_started_at timestamptz,
  winner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kung_players (
  room_code text not null references public.kung_rooms(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname varchar(16) not null,
  seat integer not null check (seat between 1 and 4),
  ready boolean not null default false,
  lives integer not null default 3 check (lives between 0 and 3),
  eliminated boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_code,user_id),
  unique(room_code,seat)
);

create table if not exists public.kung_used_words (
  id bigint generated always as identity primary key,
  room_code text not null references public.kung_rooms(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  turn_no integer not null,
  created_at timestamptz not null default now(),
  unique(room_code,word)
);

alter table public.kung_dictionary enable row level security;
alter table public.kung_rooms enable row level security;
alter table public.kung_players enable row level security;
alter table public.kung_used_words enable row level security;

-- 자주 쓰는 3글자 단어 사전. 필요하면 나중에 단어를 더 추가할 수 있습니다.
insert into public.kung_dictionary(word) values
('가게문'),
('가로등'),
('가방끈'),
('가위질'),
('강아지'),
('개나리'),
('개미굴'),
('거미줄'),
('거울방'),
('건널목'),
('고구마'),
('고양이'),
('고무줄'),
('골목길'),
('공기밥'),
('공원길'),
('과자통'),
('구름길'),
('구슬비'),
('국화꽃'),
('귀마개'),
('그림책'),
('기차역'),
('김치국'),
('까치발'),
('나그네'),
('나무꾼'),
('나뭇잎'),
('나침반'),
('낙엽길'),
('냉장고'),
('노래방'),
('눈사람'),
('눈송이'),
('다리미'),
('단풍잎'),
('달맞이'),
('도깨비'),
('도마뱀'),
('도서관'),
('두루미'),
('딸기밭'),
('라디오'),
('마늘쫑'),
('마당쇠'),
('마루방'),
('마스크'),
('마우스'),
('막걸리'),
('만화책'),
('머리띠'),
('메아리'),
('모래성'),
('모자끈'),
('무궁화'),
('물고기'),
('물방울'),
('미나리'),
('미끄럼'),
('바가지'),
('바구니'),
('바나나'),
('바람길'),
('박물관'),
('반딧불'),
('방울꽃'),
('배나무'),
('배추밭'),
('버스킹'),
('보리밭'),
('보조개'),
('복숭아'),
('부엌문'),
('비둘기'),
('비빔밥'),
('비행기'),
('사과밭'),
('사이다'),
('사자춤'),
('사진관'),
('산토끼'),
('삼계탕'),
('새우깡'),
('서랍장'),
('선풍기'),
('소나기'),
('소리꾼'),
('소방차'),
('손가락'),
('송아지'),
('수박밭'),
('수영장'),
('스피커'),
('시계탑'),
('신호등'),
('아기곰'),
('아리랑'),
('안경집'),
('알사탕'),
('양배추'),
('어깨춤'),
('어린이'),
('얼음물'),
('에어컨'),
('연습실'),
('오리발'),
('오징어'),
('옥수수'),
('옷걸이'),
('요리사'),
('우체국'),
('운동장'),
('운동화'),
('원숭이'),
('유리창'),
('음악실'),
('이발소'),
('이삿짐'),
('인형극'),
('자동차'),
('자전거'),
('작곡가'),
('장난감'),
('장미꽃'),
('재봉틀'),
('저금통'),
('전화기'),
('젓가락'),
('종이컵'),
('주전자'),
('주머니'),
('지우개'),
('지하철'),
('진달래'),
('짜장면'),
('찹쌀떡'),
('초가집'),
('초등생'),
('초코빵'),
('축구공'),
('치약통'),
('카메라'),
('칼국수'),
('커피잔'),
('컴퓨터'),
('코끼리'),
('콩나물'),
('타이어'),
('태극기'),
('토끼풀'),
('토마토'),
('파도길'),
('파랑새'),
('포도밭'),
('풍선껌'),
('피아노'),
('하늘길'),
('하모니'),
('햄버거'),
('호랑이'),
('호박죽'),
('화장실'),
('휴대폰'),
('흰구름'),
('류현상'),
('팬미팅'),
('무대옷'),
('긴머리'),
('검은옷')
on conflict(word) do nothing;

revoke all on public.kung_dictionary from anon,authenticated;

create or replace function public.kung_is_participant(p_room_code text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from public.kung_players
    where room_code=upper(trim(p_room_code)) and user_id=auth.uid() and left_at is null
  );
$$;

revoke all on function public.kung_is_participant(text) from public;
grant execute on function public.kung_is_participant(text) to authenticated;

-- 참여자만 실제 방 정보를 읽을 수 있습니다. 공개 로비는 RPC로만 노출합니다.
drop policy if exists "kung_rooms_read" on public.kung_rooms;
drop policy if exists "kung_players_read" on public.kung_players;
drop policy if exists "kung_words_read" on public.kung_used_words;
create policy "kung_rooms_read" on public.kung_rooms for select to authenticated using(public.kung_is_participant(code));
create policy "kung_players_read" on public.kung_players for select to authenticated using(public.kung_is_participant(room_code));
create policy "kung_words_read" on public.kung_used_words for select to authenticated using(public.kung_is_participant(room_code));
grant select on public.kung_rooms,public.kung_players,public.kung_used_words to authenticated;
revoke insert,update,delete on public.kung_rooms,public.kung_players,public.kung_used_words from anon,authenticated;

create or replace function public.kung_next_active_seat(p_room_code text,p_after integer)
returns integer
language plpgsql stable security definer set search_path=public
as $$
declare v_seat integer;
begin
  select min(seat) into v_seat from public.kung_players
  where room_code=upper(trim(p_room_code)) and left_at is null and eliminated=false and lives>0 and seat>p_after;
  if v_seat is null then
    select min(seat) into v_seat from public.kung_players
    where room_code=upper(trim(p_room_code)) and left_at is null and eliminated=false and lives>0;
  end if;
  return v_seat;
end;
$$;

revoke all on function public.kung_next_active_seat(text,integer) from public;

create or replace function public.kung_healthcheck()
returns jsonb language plpgsql security definer set search_path=public
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  return jsonb_build_object('ok',true,'version',147);
end;
$$;

create or replace function public.kung_create_room(p_nickname text,p_max_players integer)
returns text language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid();v_code text;i integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if nullif(trim(p_nickname),'') is null then raise exception '닉네임이 필요합니다.'; end if;
  if p_max_players not between 2 and 4 then raise exception '최대 인원은 2~4명입니다.'; end if;
  delete from public.kung_rooms where created_at<now()-interval '2 hours';
  for i in 1..20 loop
    v_code:=upper(substr(md5(random()::text||clock_timestamp()::text||v_uid::text),1,8));
    exit when not exists(select 1 from public.kung_rooms where code=v_code);
  end loop;
  if exists(select 1 from public.kung_rooms where code=v_code) then raise exception '방을 만들지 못했습니다.'; end if;
  insert into public.kung_rooms(code,host_id,max_players) values(v_code,v_uid,p_max_players);
  insert into public.kung_players(room_code,user_id,nickname,seat) values(v_code,v_uid,left(trim(p_nickname),16),1);
  return v_code;
end;
$$;

create or replace function public.kung_list_open_rooms()
returns table(room_code text,host_nickname text,player_count integer,max_players integer,is_mine boolean)
language sql security definer set search_path=public
as $$
  select r.code,
         coalesce((select p.nickname from public.kung_players p where p.room_code=r.code and p.user_id=r.host_id limit 1),'익명'),
         (select count(*)::integer from public.kung_players p where p.room_code=r.code and p.left_at is null),
         r.max_players,
         r.host_id=auth.uid()
  from public.kung_rooms r
  where r.status='waiting'
    and r.created_at>now()-interval '2 hours'
    and (select count(*) from public.kung_players p where p.room_code=r.code and p.left_at is null)<r.max_players
  order by r.created_at desc limit 40;
$$;

create or replace function public.kung_join_room(p_code text,p_nickname text)
returns text language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_code));v_status text;v_max integer;v_count integer;v_seat integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select status,max_players into v_status,v_max from public.kung_rooms where code=v_code for update;
  if not found then raise exception '존재하지 않는 방입니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작한 방입니다.'; end if;
  if exists(select 1 from public.kung_players where room_code=v_code and user_id=v_uid) then
    update public.kung_players set nickname=left(trim(p_nickname),16),left_at=null where room_code=v_code and user_id=v_uid;
    return v_code;
  end if;
  select count(*) into v_count from public.kung_players where room_code=v_code and left_at is null;
  if v_count>=v_max then raise exception '방이 가득 찼습니다.'; end if;
  select s into v_seat from generate_series(1,v_max)s
  where not exists(select 1 from public.kung_players p where p.room_code=v_code and p.seat=s and p.left_at is null)
  order by s limit 1;
  insert into public.kung_players(room_code,user_id,nickname,seat) values(v_code,v_uid,left(trim(p_nickname),16),v_seat);
  update public.kung_rooms set updated_at=now() where code=v_code;
  return v_code;
end;
$$;

create or replace function public.kung_set_ready(p_code text,p_ready boolean)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.kung_is_participant(p_code) then raise exception '참가자가 아닙니다.'; end if;
  if not exists(select 1 from public.kung_rooms where code=upper(trim(p_code)) and status='waiting') then raise exception '대기 중인 방이 아닙니다.'; end if;
  update public.kung_players set ready=p_ready where room_code=upper(trim(p_code)) and user_id=auth.uid() and left_at is null;
  update public.kung_rooms set updated_at=now() where code=upper(trim(p_code));
end;
$$;

create or replace function public.kung_start_room(p_code text)
returns void language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_code));v_host uuid;v_status text;v_count integer;v_ready integer;v_first integer;
begin
  select host_id,status into v_host,v_status from public.kung_rooms where code=v_code for update;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if v_host<>auth.uid() then raise exception '방장만 시작할 수 있습니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작된 방입니다.'; end if;
  select count(*),count(*) filter(where ready) into v_count,v_ready from public.kung_players where room_code=v_code and left_at is null;
  if v_count<2 then raise exception '최소 2명이 필요합니다.'; end if;
  if v_count<>v_ready then raise exception '참가자 전원이 준비해야 합니다.'; end if;
  delete from public.kung_used_words where room_code=v_code;
  update public.kung_players set ready=false,lives=3,eliminated=false where room_code=v_code and left_at is null;
  select min(seat) into v_first from public.kung_players where room_code=v_code and left_at is null;
  update public.kung_rooms set status='playing',current_turn_seat=v_first,current_word=null,turn_no=0,turn_started_at=now(),winner_id=null,updated_at=now() where code=v_code;
end;
$$;

create or replace function public.kung_get_snapshot(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code));v_room public.kung_rooms%rowtype;v_players jsonb;v_words jsonb;
begin
  if not public.kung_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.kung_rooms where code=v_code;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'nickname',p.nickname,'seat',p.seat,'ready',p.ready,'lives',p.lives,'eliminated',p.eliminated,'left_at',p.left_at) order by p.seat),'[]'::jsonb)
  into v_players from public.kung_players p where p.room_code=v_code;
  select coalesce(jsonb_agg(x.obj order by x.turn_no),'[]'::jsonb) into v_words
  from (
    select w.turn_no,jsonb_build_object('word',w.word,'user_id',w.user_id,'turn_no',w.turn_no) obj
    from public.kung_used_words w where w.room_code=v_code order by w.turn_no desc limit 20
  ) x;
  return jsonb_build_object('code',v_room.code,'status',v_room.status,'host_id',v_room.host_id,'max_players',v_room.max_players,
    'current_turn_seat',v_room.current_turn_seat,'current_word',v_room.current_word,'turn_no',v_room.turn_no,'turn_started_at',v_room.turn_started_at,
    'winner_id',v_room.winner_id,'players',v_players,'words',v_words);
end;
$$;

create or replace function public.kung_submit_word(p_room_code text,p_word text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  v_code text:=upper(trim(p_room_code));v_uid uuid:=auth.uid();v_room public.kung_rooms%rowtype;v_me public.kung_players%rowtype;
  v_word text:=trim(p_word);v_reason text:='';v_active integer;v_next integer;v_winner uuid;v_new_lives integer;
begin
  if not public.kung_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.kung_rooms where code=v_code for update;
  if v_room.status<>'playing' then raise exception '진행 중인 게임이 아닙니다.'; end if;
  select * into v_me from public.kung_players where room_code=v_code and user_id=v_uid and left_at is null for update;
  if v_me.eliminated or v_me.lives<=0 then raise exception '이미 탈락했습니다.'; end if;
  if v_room.current_turn_seat<>v_me.seat then raise exception '내 차례가 아닙니다.'; end if;

  if v_room.turn_started_at is not null and now()>v_room.turn_started_at+interval '10 seconds' then
    v_reason:='시간 초과';
  elsif char_length(v_word)<>3 or v_word!~'^[가-힣]{3}$' then
    v_reason:='한글 3글자 단어만 가능합니다.';
  elsif not exists(select 1 from public.kung_dictionary where word=v_word) then
    v_reason:='등록되지 않은 단어입니다.';
  elsif exists(select 1 from public.kung_used_words where room_code=v_code and word=v_word) then
    v_reason:='이미 나온 단어입니다.';
  elsif v_room.current_word is not null and substring(v_word from 1 for 1)<>substring(v_room.current_word from char_length(v_room.current_word) for 1) then
    v_reason='이전 단어의 마지막 글자로 시작해야 합니다.';
  end if;

  if v_reason<>'' then
    v_new_lives:=greatest(0,v_me.lives-1);
    update public.kung_players set lives=v_new_lives,eliminated=(v_new_lives=0) where room_code=v_code and user_id=v_uid;
    select count(*) into v_active from public.kung_players where room_code=v_code and left_at is null and eliminated=false and lives>0;
    if v_active<=1 then
      select user_id into v_winner from public.kung_players where room_code=v_code and left_at is null and eliminated=false and lives>0 limit 1;
      update public.kung_rooms set status='finished',winner_id=v_winner,current_turn_seat=null,updated_at=now() where code=v_code;
    else
      v_next:=public.kung_next_active_seat(v_code,v_me.seat);
      update public.kung_rooms set current_turn_seat=v_next,turn_started_at=now(),turn_no=turn_no+1,updated_at=now() where code=v_code;
    end if;
    return jsonb_build_object('ok',false,'reason',v_reason,'lives',v_new_lives);
  end if;

  insert into public.kung_used_words(room_code,user_id,word,turn_no) values(v_code,v_uid,v_word,v_room.turn_no);
  v_next:=public.kung_next_active_seat(v_code,v_me.seat);
  update public.kung_rooms set current_word=v_word,current_turn_seat=v_next,turn_no=turn_no+1,turn_started_at=now(),updated_at=now() where code=v_code;
  return jsonb_build_object('ok',true,'word',v_word);
end;
$$;

create or replace function public.kung_tick(p_room_code text)
returns text language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code));v_room public.kung_rooms%rowtype;v_uid uuid;v_lives integer;v_seat integer;v_active integer;v_next integer;v_winner uuid;
begin
  if not public.kung_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.kung_rooms where code=v_code for update;
  if not found then return 'missing'; end if;
  if v_room.status<>'playing' then return v_room.status; end if;
  if v_room.turn_started_at is null or now()<=v_room.turn_started_at+interval '10 seconds' then return 'playing'; end if;
  select user_id,lives,seat into v_uid,v_lives,v_seat from public.kung_players where room_code=v_code and seat=v_room.current_turn_seat and left_at is null for update;
  if v_uid is null then
    v_next:=public.kung_next_active_seat(v_code,coalesce(v_room.current_turn_seat,0));
    update public.kung_rooms set current_turn_seat=v_next,turn_started_at=now(),updated_at=now() where code=v_code;
    return 'playing';
  end if;
  v_lives:=greatest(0,v_lives-1);
  update public.kung_players set lives=v_lives,eliminated=(v_lives=0) where room_code=v_code and user_id=v_uid;
  select count(*) into v_active from public.kung_players where room_code=v_code and left_at is null and eliminated=false and lives>0;
  if v_active<=1 then
    select user_id into v_winner from public.kung_players where room_code=v_code and left_at is null and eliminated=false and lives>0 limit 1;
    update public.kung_rooms set status='finished',winner_id=v_winner,current_turn_seat=null,updated_at=now() where code=v_code;
    return 'finished';
  end if;
  v_next:=public.kung_next_active_seat(v_code,v_seat);
  update public.kung_rooms set current_turn_seat=v_next,turn_started_at=now(),turn_no=turn_no+1,updated_at=now() where code=v_code;
  return 'playing';
end;
$$;

create or replace function public.kung_leave_room(p_room_code text)
returns text language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code));v_uid uuid:=auth.uid();v_room public.kung_rooms%rowtype;v_me public.kung_players%rowtype;v_active integer;v_winner uuid;v_next integer;
begin
  select * into v_room from public.kung_rooms where code=v_code for update;
  if not found then return 'missing'; end if;
  select * into v_me from public.kung_players where room_code=v_code and user_id=v_uid and left_at is null;
  if not found then return 'not_participant'; end if;
  if v_room.status='waiting' then
    if v_room.host_id=v_uid then delete from public.kung_rooms where code=v_code;
    else delete from public.kung_players where room_code=v_code and user_id=v_uid; update public.kung_rooms set updated_at=now() where code=v_code; end if;
    return 'left';
  end if;
  update public.kung_players set left_at=now(),eliminated=true,lives=0 where room_code=v_code and user_id=v_uid;
  if v_room.status='playing' then
    select count(*) into v_active from public.kung_players where room_code=v_code and left_at is null and eliminated=false and lives>0;
    if v_active<=1 then
      select user_id into v_winner from public.kung_players where room_code=v_code and left_at is null and eliminated=false and lives>0 limit 1;
      update public.kung_rooms set status='finished',winner_id=v_winner,current_turn_seat=null,updated_at=now() where code=v_code;
    elsif v_room.current_turn_seat=v_me.seat then
      v_next:=public.kung_next_active_seat(v_code,v_me.seat);
      update public.kung_rooms set current_turn_seat=v_next,turn_started_at=now(),updated_at=now() where code=v_code;
    end if;
  end if;
  return 'left';
end;
$$;

revoke all on function public.kung_healthcheck() from public;
revoke all on function public.kung_create_room(text,integer) from public;
revoke all on function public.kung_list_open_rooms() from public;
revoke all on function public.kung_join_room(text,text) from public;
revoke all on function public.kung_set_ready(text,boolean) from public;
revoke all on function public.kung_start_room(text) from public;
revoke all on function public.kung_get_snapshot(text) from public;
revoke all on function public.kung_submit_word(text,text) from public;
revoke all on function public.kung_tick(text) from public;
revoke all on function public.kung_leave_room(text) from public;

grant execute on function public.kung_healthcheck() to authenticated;
grant execute on function public.kung_create_room(text,integer) to authenticated;
grant execute on function public.kung_list_open_rooms() to authenticated;
grant execute on function public.kung_join_room(text,text) to authenticated;
grant execute on function public.kung_set_ready(text,boolean) to authenticated;
grant execute on function public.kung_start_room(text) to authenticated;
grant execute on function public.kung_get_snapshot(text) to authenticated;
grant execute on function public.kung_submit_word(text,text) to authenticated;
grant execute on function public.kung_tick(text) to authenticated;
grant execute on function public.kung_leave_room(text) to authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='kung_rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kung_rooms;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='kung_players') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kung_players;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='kung_used_words') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kung_used_words;
  END IF;
END $$;

alter table public.kung_rooms replica identity full;
alter table public.kung_players replica identity full;
alter table public.kung_used_words replica identity full;

select '류현상 키우기 v147 쿵쿵따 DB 설정 완료!' as result;
-- 류현상 키우기 v147 : 2~3인 실시간 고스톱 Supabase 설정
-- 판돈 없는 게임 내 점수전입니다. 기존 커뮤니티/퀴즈/루미큐브/쿵쿵따 DB는 건드리지 않습니다.

create table if not exists public.gostop_rooms (
  code text primary key,
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  max_players integer not null default 2 check (max_players between 2 and 3),
  turn_user_id uuid references auth.users(id) on delete set null,
  decision_user_id uuid references auth.users(id) on delete set null,
  winner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gostop_players (
  room_code text not null references public.gostop_rooms(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname varchar(16) not null,
  seat integer not null check (seat between 1 and 3),
  ready boolean not null default false,
  hand integer[] not null default '{}',
  captured integer[] not null default '{}',
  score integer not null default 0,
  go_count integer not null default 0,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key(room_code,user_id),
  unique(room_code,seat)
);

create table if not exists public.gostop_game_state (
  room_code text primary key references public.gostop_rooms(code) on delete cascade,
  deck integer[] not null default '{}',
  table_cards integer[] not null default '{}',
  turn_no integer not null default 0,
  last_action text,
  last_played integer,
  last_drawn integer
);

alter table public.gostop_rooms enable row level security;
alter table public.gostop_players enable row level security;
alter table public.gostop_game_state enable row level security;

create or replace function public.gostop_is_participant(p_room_code text)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists(select 1 from public.gostop_players where room_code=upper(trim(p_room_code)) and user_id=auth.uid() and left_at is null);
$$;
revoke all on function public.gostop_is_participant(text) from public;
grant execute on function public.gostop_is_participant(text) to authenticated;

-- 방/참가자 원본 테이블은 참가자만 읽을 수 있고, 손패/덱은 직접 읽지 못하게 합니다.
drop policy if exists "gostop_rooms_read" on public.gostop_rooms;
create policy "gostop_rooms_read" on public.gostop_rooms for select to authenticated using(public.gostop_is_participant(code));
grant select on public.gostop_rooms to authenticated;
revoke all on public.gostop_players,public.gostop_game_state from anon,authenticated;
revoke insert,update,delete on public.gostop_rooms from anon,authenticated;

create or replace function public.gostop_card_month(p_card integer)
returns integer language sql immutable as $$ select case when p_card between 0 and 47 then (p_card/4)+1 else 0 end; $$;

create or replace function public.gostop_card_kind(p_card integer)
returns text language sql immutable as $$
 select case
   when p_card in (0,8,28,40,44) then 'gwang'
   when p_card in (4,12,16,20,24,29,32,36,42,45) then 'animal'
   when p_card in (1,5,9,13,17,21,25,33,37,46) then 'ribbon'
   when p_card in (41,47) then 'doublepi'
   else 'pi'
 end;
$$;

create or replace function public.gostop_score_cards(p_cards integer[],p_go integer default 0)
returns integer language plpgsql immutable as $$
declare
  v_g integer:=0;v_a integer:=0;v_r integer:=0;v_pi integer:=0;v_score integer:=0;
  v_card integer;v_red integer:=0;v_blue integer:=0;v_grass integer:=0;v_godori integer:=0;
begin
  if p_cards is null then return greatest(0,p_go); end if;
  foreach v_card in array p_cards loop
    case public.gostop_card_kind(v_card)
      when 'gwang' then v_g:=v_g+1;
      when 'animal' then v_a:=v_a+1;
      when 'ribbon' then v_r:=v_r+1;
      when 'doublepi' then v_pi:=v_pi+2;
      else v_pi:=v_pi+1;
    end case;
    if v_card in (1,5,9) then v_red:=v_red+1; end if;
    if v_card in (21,33,37) then v_blue:=v_blue+1; end if;
    if v_card in (13,17,25) then v_grass:=v_grass+1; end if;
    if v_card in (4,12,29) then v_godori:=v_godori+1; end if;
  end loop;
  if v_g=3 then v_score:=v_score+case when 44=any(p_cards) then 2 else 3 end;
  elsif v_g=4 then v_score:=v_score+4;
  elsif v_g>=5 then v_score:=v_score+15; end if;
  if v_a>=5 then v_score:=v_score+(v_a-4); end if;
  if v_r>=5 then v_score:=v_score+(v_r-4); end if;
  if v_pi>=10 then v_score:=v_score+(v_pi-9); end if;
  if v_red=3 then v_score:=v_score+3; end if;
  if v_blue=3 then v_score:=v_score+3; end if;
  if v_grass=3 then v_score:=v_score+3; end if;
  if v_godori=3 then v_score:=v_score+5; end if;
  return greatest(0,v_score+greatest(0,p_go));
end;
$$;

create or replace function public.gostop_next_active_user(p_room_code text,p_after_seat integer)
returns uuid language plpgsql stable security definer set search_path=public
as $$
declare v_uid uuid;
begin
  select user_id into v_uid from public.gostop_players
  where room_code=upper(trim(p_room_code)) and left_at is null and seat>p_after_seat order by seat limit 1;
  if v_uid is null then
    select user_id into v_uid from public.gostop_players where room_code=upper(trim(p_room_code)) and left_at is null order by seat limit 1;
  end if;
  return v_uid;
end;
$$;
revoke all on function public.gostop_next_active_user(text,integer) from public;

create or replace function public.gostop_healthcheck()
returns jsonb language plpgsql security definer set search_path=public
as $$ begin if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if; return jsonb_build_object('ok',true,'version',147); end; $$;

create or replace function public.gostop_create_room(p_nickname text,p_max_players integer)
returns text language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid();v_code text;i integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if nullif(trim(p_nickname),'') is null then raise exception '닉네임이 필요합니다.'; end if;
  if p_max_players not between 2 and 3 then raise exception '고스톱은 2~3인으로 플레이합니다.'; end if;
  delete from public.gostop_rooms where created_at<now()-interval '2 hours';
  for i in 1..20 loop v_code:=upper(substr(md5(random()::text||clock_timestamp()::text||v_uid::text),1,8)); exit when not exists(select 1 from public.gostop_rooms where code=v_code); end loop;
  if exists(select 1 from public.gostop_rooms where code=v_code) then raise exception '방을 만들지 못했습니다.'; end if;
  insert into public.gostop_rooms(code,host_id,max_players) values(v_code,v_uid,p_max_players);
  insert into public.gostop_players(room_code,user_id,nickname,seat) values(v_code,v_uid,left(trim(p_nickname),16),1);
  return v_code;
end;
$$;

create or replace function public.gostop_list_open_rooms()
returns table(room_code text,host_nickname text,player_count integer,max_players integer,is_mine boolean)
language sql security definer set search_path=public
as $$
  select r.code,
    coalesce((select p.nickname from public.gostop_players p where p.room_code=r.code and p.user_id=r.host_id limit 1),'익명'),
    (select count(*)::integer from public.gostop_players p where p.room_code=r.code and p.left_at is null),
    r.max_players,r.host_id=auth.uid()
  from public.gostop_rooms r
  where r.status='waiting' and r.created_at>now()-interval '2 hours'
    and (select count(*) from public.gostop_players p where p.room_code=r.code and p.left_at is null)<r.max_players
  order by r.created_at desc limit 40;
$$;

create or replace function public.gostop_join_room(p_code text,p_nickname text)
returns text language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_code));v_status text;v_max integer;v_count integer;v_seat integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select status,max_players into v_status,v_max from public.gostop_rooms where code=v_code for update;
  if not found then raise exception '존재하지 않는 방입니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작된 방입니다.'; end if;
  if exists(select 1 from public.gostop_players where room_code=v_code and user_id=v_uid) then
    update public.gostop_players set nickname=left(trim(p_nickname),16),left_at=null where room_code=v_code and user_id=v_uid; return v_code;
  end if;
  select count(*) into v_count from public.gostop_players where room_code=v_code and left_at is null;
  if v_count>=v_max then raise exception '방이 가득 찼습니다.'; end if;
  select s into v_seat from generate_series(1,v_max)s where not exists(select 1 from public.gostop_players p where p.room_code=v_code and p.seat=s and p.left_at is null) order by s limit 1;
  insert into public.gostop_players(room_code,user_id,nickname,seat) values(v_code,v_uid,left(trim(p_nickname),16),v_seat);
  update public.gostop_rooms set updated_at=now() where code=v_code;
  return v_code;
end;
$$;

create or replace function public.gostop_set_ready(p_code text,p_ready boolean)
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.gostop_is_participant(p_code) then raise exception '참가자가 아닙니다.'; end if;
  if not exists(select 1 from public.gostop_rooms where code=upper(trim(p_code)) and status='waiting') then raise exception '대기 중인 방이 아닙니다.'; end if;
  update public.gostop_players set ready=p_ready where room_code=upper(trim(p_code)) and user_id=auth.uid() and left_at is null;
  update public.gostop_rooms set updated_at=now() where code=upper(trim(p_code));
end; $$;

create or replace function public.gostop_start_room(p_code text)
returns void language plpgsql security definer set search_path=public
as $$
declare
 v_code text:=upper(trim(p_code));v_host uuid;v_status text;v_max integer;v_count integer;v_ready integer;v_users uuid[];v_deck integer[];v_first uuid;
begin
  select host_id,status,max_players into v_host,v_status,v_max from public.gostop_rooms where code=v_code for update;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if v_host<>auth.uid() then raise exception '방장만 시작할 수 있습니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작된 방입니다.'; end if;
  select count(*),count(*) filter(where ready) into v_count,v_ready from public.gostop_players where room_code=v_code and left_at is null;
  if v_count<>v_max then raise exception '방 설정 인원이 모두 입장해야 시작할 수 있습니다.'; end if;
  if v_ready<>v_count then raise exception '모든 참가자가 준비해야 합니다.'; end if;
  select array_agg(user_id order by seat) into v_users from public.gostop_players where room_code=v_code and left_at is null;
  select array_agg(i order by random()) into v_deck from generate_series(0,47)i;
  delete from public.gostop_game_state where room_code=v_code;
  if v_max=2 then
    update public.gostop_players set hand=case when user_id=v_users[1] then v_deck[1:10] else v_deck[11:20] end,captured='{}',score=0,go_count=0,ready=false where room_code=v_code and left_at is null;
    insert into public.gostop_game_state(room_code,deck,table_cards) values(v_code,v_deck[29:48],v_deck[21:28]);
  else
    update public.gostop_players set hand=case when user_id=v_users[1] then v_deck[1:7] when user_id=v_users[2] then v_deck[8:14] else v_deck[15:21] end,captured='{}',score=0,go_count=0,ready=false where room_code=v_code and left_at is null;
    insert into public.gostop_game_state(room_code,deck,table_cards) values(v_code,v_deck[28:48],v_deck[22:27]);
  end if;
  v_first:=v_users[1];
  update public.gostop_rooms set status='playing',turn_user_id=v_first,decision_user_id=null,winner_id=null,updated_at=now() where code=v_code;
end;
$$;

create or replace function public.gostop_get_snapshot(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code));v_uid uuid:=auth.uid();v_room public.gostop_rooms%rowtype;v_state public.gostop_game_state%rowtype;v_players jsonb;v_hand integer[];v_captured integer[];
begin
  if not public.gostop_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.gostop_rooms where code=v_code;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  select * into v_state from public.gostop_game_state where room_code=v_code;
  select hand,captured into v_hand,v_captured from public.gostop_players where room_code=v_code and user_id=v_uid;
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id',p.user_id,'nickname',p.nickname,'seat',p.seat,'ready',p.ready,'hand_count',cardinality(p.hand),'captured_count',cardinality(p.captured),
    'score',public.gostop_score_cards(p.captured,p.go_count),'go_count',p.go_count,'left_at',p.left_at) order by p.seat),'[]'::jsonb)
  into v_players from public.gostop_players p where p.room_code=v_code;
  return jsonb_build_object('code',v_room.code,'status',v_room.status,'host_id',v_room.host_id,'max_players',v_room.max_players,'turn_user_id',v_room.turn_user_id,
    'decision_user_id',v_room.decision_user_id,'winner_id',v_room.winner_id,'players',v_players,'my_hand',coalesce(to_jsonb(v_hand),'[]'::jsonb),
    'my_captured',coalesce(to_jsonb(v_captured),'[]'::jsonb),'table_cards',coalesce(to_jsonb(v_state.table_cards),'[]'::jsonb),'deck_count',coalesce(cardinality(v_state.deck),0),
    'turn_no',coalesce(v_state.turn_no,0),'last_action',v_state.last_action,'last_played',v_state.last_played,'last_drawn',v_state.last_drawn);
end;
$$;

create or replace function public.gostop_play_card(p_room_code text,p_card integer)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
 v_code text:=upper(trim(p_room_code));v_uid uuid:=auth.uid();v_room public.gostop_rooms%rowtype;v_me public.gostop_players%rowtype;v_state public.gostop_game_state%rowtype;
 v_hand integer[];v_table integer[];v_captured integer[];v_match integer;v_draw integer;v_score integer;v_threshold integer;v_next uuid;v_seat integer;v_deck integer[];v_top integer;v_count integer;v_winner uuid;v_maxscore integer;
begin
  if not public.gostop_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.gostop_rooms where code=v_code for update;
  if v_room.status<>'playing' then raise exception '진행 중인 게임이 아닙니다.'; end if;
  if v_room.decision_user_id is not null then raise exception '고/스톱 선택을 먼저 완료해야 합니다.'; end if;
  if v_room.turn_user_id<>v_uid then raise exception '내 차례가 아닙니다.'; end if;
  select * into v_me from public.gostop_players where room_code=v_code and user_id=v_uid and left_at is null for update;
  if not (p_card=any(v_me.hand)) then raise exception '내 손패에 없는 카드입니다.'; end if;
  select * into v_state from public.gostop_game_state where room_code=v_code for update;
  v_hand:=array_remove(v_me.hand,p_card);v_table:=v_state.table_cards;v_captured:=v_me.captured;v_deck:=v_state.deck;

  select x into v_match from unnest(v_table)x where public.gostop_card_month(x)=public.gostop_card_month(p_card) order by x limit 1;
  if v_match is null then v_table:=array_append(v_table,p_card);
  else v_table:=array_remove(v_table,v_match);v_captured:=v_captured||array[p_card,v_match]; end if;

  v_draw:=null;
  if coalesce(cardinality(v_deck),0)>0 then
    v_draw:=v_deck[1];
    v_deck:=case when cardinality(v_deck)<=1 then '{}'::integer[] else v_deck[2:cardinality(v_deck)] end;
    v_match:=null;
    select x into v_match from unnest(v_table)x where public.gostop_card_month(x)=public.gostop_card_month(v_draw) order by x limit 1;
    if v_match is null then v_table:=array_append(v_table,v_draw);
    else v_table:=array_remove(v_table,v_match);v_captured:=v_captured||array[v_draw,v_match]; end if;
  end if;

  v_score:=public.gostop_score_cards(v_captured,v_me.go_count);
  update public.gostop_players set hand=v_hand,captured=v_captured,score=v_score where room_code=v_code and user_id=v_uid;
  update public.gostop_game_state set deck=v_deck,table_cards=v_table,turn_no=turn_no+1,last_action='패를 냈습니다.',last_played=p_card,last_drawn=v_draw where room_code=v_code;
  v_threshold:=case when v_room.max_players=2 then 7 else 3 end;

  -- 손패 또는 더미가 끝난 경우 즉시 최고 점수로 종료합니다.
  if cardinality(v_hand)=0 or cardinality(v_deck)=0 then
    select max(public.gostop_score_cards(captured,go_count)) into v_maxscore from public.gostop_players where room_code=v_code and left_at is null;
    select user_id into v_winner from public.gostop_players where room_code=v_code and left_at is null and public.gostop_score_cards(captured,go_count)=v_maxscore order by seat limit 1;
    update public.gostop_rooms set status='finished',winner_id=v_winner,turn_user_id=null,decision_user_id=null,updated_at=now() where code=v_code;
    return jsonb_build_object('finished',true,'score',v_score);
  end if;

  if v_score>=v_threshold then
    update public.gostop_rooms set decision_user_id=v_uid,updated_at=now() where code=v_code;
    return jsonb_build_object('decision',true,'score',v_score);
  end if;

  v_next:=public.gostop_next_active_user(v_code,v_me.seat);
  update public.gostop_rooms set turn_user_id=v_next,updated_at=now() where code=v_code;
  return jsonb_build_object('ok',true,'score',v_score);
end;
$$;

create or replace function public.gostop_choose_go(p_room_code text,p_go boolean)
returns text language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code));v_uid uuid:=auth.uid();v_room public.gostop_rooms%rowtype;v_me public.gostop_players%rowtype;v_next uuid;
begin
  if not public.gostop_is_participant(v_code) then raise exception '참가자가 아닙니다.'; end if;
  select * into v_room from public.gostop_rooms where code=v_code for update;
  if v_room.status<>'playing' or v_room.decision_user_id<>v_uid then raise exception '지금은 고/스톱을 선택할 수 없습니다.'; end if;
  select * into v_me from public.gostop_players where room_code=v_code and user_id=v_uid for update;
  if p_go then
    update public.gostop_players set go_count=go_count+1,score=public.gostop_score_cards(captured,go_count+1) where room_code=v_code and user_id=v_uid;
    v_next:=public.gostop_next_active_user(v_code,v_me.seat);
    update public.gostop_rooms set decision_user_id=null,turn_user_id=v_next,updated_at=now() where code=v_code;
    update public.gostop_game_state set last_action='GO를 선택했습니다.' where room_code=v_code;
    return 'go';
  else
    update public.gostop_rooms set status='finished',winner_id=v_uid,turn_user_id=null,decision_user_id=null,updated_at=now() where code=v_code;
    update public.gostop_game_state set last_action='STOP을 선택했습니다.' where room_code=v_code;
    return 'stop';
  end if;
end;
$$;

create or replace function public.gostop_leave_room(p_room_code text)
returns text language plpgsql security definer set search_path=public
as $$
declare v_code text:=upper(trim(p_room_code));v_uid uuid:=auth.uid();v_room public.gostop_rooms%rowtype;v_me public.gostop_players%rowtype;v_active integer;v_winner uuid;v_next uuid;
begin
  select * into v_room from public.gostop_rooms where code=v_code for update;
  if not found then return 'missing'; end if;
  select * into v_me from public.gostop_players where room_code=v_code and user_id=v_uid and left_at is null;
  if not found then return 'not_participant'; end if;
  if v_room.status='waiting' then
    if v_room.host_id=v_uid then delete from public.gostop_rooms where code=v_code;
    else delete from public.gostop_players where room_code=v_code and user_id=v_uid;update public.gostop_rooms set updated_at=now() where code=v_code;end if;
    return 'left';
  end if;
  update public.gostop_players set left_at=now() where room_code=v_code and user_id=v_uid;
  if v_room.status='playing' then
    select count(*) into v_active from public.gostop_players where room_code=v_code and left_at is null;
    if v_active<=1 then
      select user_id into v_winner from public.gostop_players where room_code=v_code and left_at is null limit 1;
      update public.gostop_rooms set status='finished',winner_id=v_winner,turn_user_id=null,decision_user_id=null,updated_at=now() where code=v_code;
    elsif v_room.turn_user_id=v_uid or v_room.decision_user_id=v_uid then
      v_next:=public.gostop_next_active_user(v_code,v_me.seat);
      update public.gostop_rooms set turn_user_id=v_next,decision_user_id=null,updated_at=now() where code=v_code;
    end if;
  end if;
  return 'left';
end;
$$;

revoke all on function public.gostop_healthcheck() from public;
revoke all on function public.gostop_create_room(text,integer) from public;
revoke all on function public.gostop_list_open_rooms() from public;
revoke all on function public.gostop_join_room(text,text) from public;
revoke all on function public.gostop_set_ready(text,boolean) from public;
revoke all on function public.gostop_start_room(text) from public;
revoke all on function public.gostop_get_snapshot(text) from public;
revoke all on function public.gostop_play_card(text,integer) from public;
revoke all on function public.gostop_choose_go(text,boolean) from public;
revoke all on function public.gostop_leave_room(text) from public;

grant execute on function public.gostop_healthcheck() to authenticated;
grant execute on function public.gostop_create_room(text,integer) to authenticated;
grant execute on function public.gostop_list_open_rooms() to authenticated;
grant execute on function public.gostop_join_room(text,text) to authenticated;
grant execute on function public.gostop_set_ready(text,boolean) to authenticated;
grant execute on function public.gostop_start_room(text) to authenticated;
grant execute on function public.gostop_get_snapshot(text) to authenticated;
grant execute on function public.gostop_play_card(text,integer) to authenticated;
grant execute on function public.gostop_choose_go(text,boolean) to authenticated;
grant execute on function public.gostop_leave_room(text) to authenticated;

DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='gostop_rooms') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.gostop_rooms; END IF;
END $$;
alter table public.gostop_rooms replica identity full;

select '류현상 키우기 v147 고스톱 DB 설정 완료!' as result;

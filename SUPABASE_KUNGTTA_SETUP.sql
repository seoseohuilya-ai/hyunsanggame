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

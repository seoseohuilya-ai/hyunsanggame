-- 류현상 키우기 v155 · 2~4인 실시간 「류현상 노래 맞추기」
-- Supabase > SQL Editor > New query 에서 이 파일 전체를 한 번 실행하세요.
-- 기존 커뮤니티/게임 퀴즈/쿵쿵따/맞고·고스톱 DB는 유지합니다.

create table if not exists public.songquiz_questions (
  id bigint primary key,
  song_title text not null,
  prompt text not null,
  answer text not null
);

create table if not exists public.songquiz_rooms (
  code text primary key,
  host_id uuid not null,
  max_players integer not null check (max_players between 2 and 4),
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  current_question integer not null default 0,
  question_ids bigint[] not null default '{}',
  question_started_at timestamptz,
  winner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.songquiz_players (
  room_code text not null references public.songquiz_rooms(code) on delete cascade,
  user_id uuid not null,
  nickname text not null,
  ready boolean not null default false,
  score integer not null default 0,
  correct_count integer not null default 0,
  total_response_ms bigint not null default 0,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key(room_code,user_id)
);

create table if not exists public.songquiz_answers (
  room_code text not null references public.songquiz_rooms(code) on delete cascade,
  question_index integer not null,
  user_id uuid not null,
  answer_text text not null default '',
  is_correct boolean not null default false,
  points integer not null default 0,
  response_ms integer not null default 15000,
  submitted_at timestamptz not null default now(),
  primary key(room_code,question_index,user_id)
);

alter table public.songquiz_questions enable row level security;
alter table public.songquiz_rooms enable row level security;
alter table public.songquiz_players enable row level security;
alter table public.songquiz_answers enable row level security;
revoke all on public.songquiz_questions,public.songquiz_rooms,public.songquiz_players,public.songquiz_answers from anon,authenticated;

-- 사용자가 제공한 류현상 노래 가사에서 만든 HARD 문제은행.
-- 두 줄을 보여주고 바로 다음 한 줄을 직접 입력하는 방식입니다.
insert into public.songquiz_questions(id,song_title,prompt,answer) values
(1,'천도박멸','고요 속에 번진 목소리
지워지지 않는 그림자','발걸음마다 스며드는'),
(2,'천도박멸','지워지지 않는 그림자
발걸음마다 스며드는','잊혀진자 들의 기도'),
(3,'천도박멸','발걸음마다 스며드는
잊혀진자 들의 기도','살아있는 시간과'),
(4,'천도박멸','잊혀진자 들의 기도
살아있는 시간과','머물지 못한 영혼 사이'),
(5,'천도박멸','살아있는 시간과
머물지 못한 영혼 사이','Call my name through the dark I will hear you'),
(6,'천도박멸','머물지 못한 영혼 사이
Call my name through the dark I will hear you','세상이 잊어도 난 곁에 있어'),
(7,'천도박멸','Call my name through the dark I will hear you
세상이 잊어도 난 곁에 있어','Bound by fate through the dark I will I can''t turn away'),
(8,'천도박멸','세상이 잊어도 난 곁에 있어
Bound by fate through the dark I will I can''t turn away','침묵 속에 I remain'),
(9,'천도박멸','침묵 속에 I remain
눈에 보이지 않는 진실','가슴 깊이 짊어진 슬픔'),
(10,'천도박멸','눈에 보이지 않는 진실
가슴 깊이 짊어진 슬픔','꿈과 현실 사이 어딘가'),
(11,'천도박멸','가슴 깊이 짊어진 슬픔
꿈과 현실 사이 어딘가','나는 여전히 서 있어'),
(12,'천도박멸','꿈과 현실 사이 어딘가
나는 여전히 서 있어','Call my name through the dark I will hear you'),
(13,'천도박멸','나는 여전히 서 있어
Call my name through the dark I will hear you','세상이 잊어도 난 곁에 있어'),
(14,'천도박멸','침묵 속에 I remain
어둠이 날 삼켜도','I will rise never fall'),
(15,'천도박멸','어둠이 날 삼켜도
I will rise never fall','눈물 속에서 피어나'),
(16,'천도박멸','I will rise never fall
눈물 속에서 피어나','I will answer when you call'),
(17,'천도박멸','눈물 속에서 피어나
I will answer when you call','Call my name through the dark I will hear you'),
(18,'천도박멸','I will answer when you call
Call my name through the dark I will hear you','세상이 널 잊어도 난 곁에 있어'),
(19,'천도박멸','Call my name through the dark I will hear you
세상이 널 잊어도 난 곁에 있어','Bound by fate I can''t turn away'),
(20,'천도박멸','세상이 널 잊어도 난 곁에 있어
Bound by fate I can''t turn away','침묵 속에 I remain'),
(21,'For me','안녕이라는 말로
뒤돌아가는 너','떨리는 입술에 맴돌던'),
(22,'For me','뒤돌아가는 너
떨리는 입술에 맴돌던','가지 말라는 말'),
(23,'For me','떨리는 입술에 맴돌던
가지 말라는 말','억지로 삼켜 내고 비워 내고'),
(24,'For me','가지 말라는 말
억지로 삼켜 내고 비워 내고','혼자 아파하는 사랑이어도 난'),
(25,'For me','억지로 삼켜 내고 비워 내고
혼자 아파하는 사랑이어도 난','괜찮을 텐데'),
(26,'For me','혼자 아파하는 사랑이어도 난
괜찮을 텐데','사랑했던 시간이'),
(27,'For me','괜찮을 텐데
사랑했던 시간이','멀어져 가고'),
(28,'For me','사랑했던 시간이
멀어져 가고','다시는 꺼낼 수 없게 된'),
(29,'For me','멀어져 가고
다시는 꺼낼 수 없게 된','미안하다는 말'),
(30,'For me','다시는 꺼낼 수 없게 된
미안하다는 말','모질게 날 밀어내 날 미워해'),
(31,'For me','미안하다는 말
모질게 날 밀어내 날 미워해','되돌릴 수 없는 사랑이어야 난'),
(32,'For me','모질게 날 밀어내 날 미워해
되돌릴 수 없는 사랑이어야 난','비워 버릴 텐데'),
(33,'For me','되돌릴 수 없는 사랑이어야 난
비워 버릴 텐데','For me 나를 한 번쯤 돌아봐 줘'),
(34,'For me','비워 버릴 텐데
For me 나를 한 번쯤 돌아봐 줘','너를 잊을 수 있게'),
(35,'For me','For me 나를 한 번쯤 돌아봐 줘
너를 잊을 수 있게','For me 가끔 떠오르는 그리움'),
(36,'For me','For me 가끔 떠오르는 그리움
지워 버릴 수 있게','가슴속에 남겨 둔'),
(37,'For me','지워 버릴 수 있게
가슴속에 남겨 둔','너의 한마디'),
(38,'For me','가슴속에 남겨 둔
너의 한마디','심장이 멎을 것 같았던'),
(39,'For me','너의 한마디
심장이 멎을 것 같았던','안녕이라는 말'),
(40,'For me','심장이 멎을 것 같았던
안녕이라는 말','이제는 지나버린 흘러버린'),
(41,'For me','안녕이라는 말
이제는 지나버린 흘러버린','계절을 얼마나 더 견뎌야만 널'),
(42,'For me','이제는 지나버린 흘러버린
계절을 얼마나 더 견뎌야만 널','보낼 수 있을까'),
(43,'For me','계절을 얼마나 더 견뎌야만 널
보낼 수 있을까','For me 나를 한 번쯤 돌아봐 줘'),
(44,'For me','보낼 수 있을까
For me 나를 한 번쯤 돌아봐 줘','너를 잊을 수 있게'),
(45,'For me','For me 가끔 떠오르는 그리움
지워 낼 수 없다면','I pray'),
(46,'For me','지워 낼 수 없다면
I pray','For me 문득 차오르는 추억에'),
(47,'For me','I pray
For me 문득 차오르는 추억에','눈물 흘리지 않게'),
(48,'For me','For me 문득 차오르는 추억에
눈물 흘리지 않게','For me 나의 기억을 가져가 줘'),
(49,'For me','눈물 흘리지 않게
For me 나의 기억을 가져가 줘','다시 사랑 못 하게'),
(50,'For me','For me 나의 기억을 가져가 줘
다시 사랑 못 하게','안녕 안녕 안녕'),
(51,'나의 마음속에','사랑한다는 말은
오 나에겐 너무 커다란 바램','나의 모자람이 널 슬프게 해서'),
(52,'나의 마음속에','오 나에겐 너무 커다란 바램
나의 모자람이 널 슬프게 해서','그저 바램으로 남겨 둔 말'),
(53,'나의 마음속에','나의 모자람이 널 슬프게 해서
그저 바램으로 남겨 둔 말','미안하단 말밖에'),
(54,'나의 마음속에','그저 바램으로 남겨 둔 말
미안하단 말밖에','할 수 없는 내가 바보 같아서'),
(55,'나의 마음속에','미안하단 말밖에
할 수 없는 내가 바보 같아서','나의 모든 것을'),
(56,'나의 마음속에','할 수 없는 내가 바보 같아서
나의 모든 것을','너에게 주고 싶지만'),
(57,'나의 마음속에','나의 모든 것을
너에게 주고 싶지만','너 빼곤 아무것도 없는 나라서'),
(58,'나의 마음속에','너에게 주고 싶지만
너 빼곤 아무것도 없는 나라서','그런 내가 이 세상 누구보다'),
(59,'나의 마음속에','너 빼곤 아무것도 없는 나라서
그런 내가 이 세상 누구보다','널 위해 살고 있는 걸'),
(60,'나의 마음속에','그런 내가 이 세상 누구보다
널 위해 살고 있는 걸','그런 내가 너의 곁에서'),
(61,'나의 마음속에','널 위해 살고 있는 걸
그런 내가 너의 곁에서','너를 지킬 수 있게'),
(62,'나의 마음속에','그런 내가 너의 곁에서
너를 지킬 수 있게','나의 마음속에 그 누구보다'),
(63,'나의 마음속에','너를 지킬 수 있게
나의 마음속에 그 누구보다','너를 사랑한다는 걸'),
(64,'나의 마음속에','나의 마음속에 그 누구보다
너를 사랑한다는 걸','말하지 않아도 너에게'),
(65,'나의 마음속에','너를 사랑한다는 걸
말하지 않아도 너에게','내 마음 전해지길 바라고 있는 나야'),
(66,'나의 마음속에','말하지 않아도 너에게
내 마음 전해지길 바라고 있는 나야','기다리라는 말은'),
(67,'나의 마음속에','내 마음 전해지길 바라고 있는 나야
기다리라는 말은','오 나에겐 지킬 수 없는 약속'),
(68,'나의 마음속에','기다리라는 말은
오 나에겐 지킬 수 없는 약속','나의 하루는 오직 너만 있어서'),
(69,'나의 마음속에','오 나에겐 지킬 수 없는 약속
나의 하루는 오직 너만 있어서','너 없인 아무것도 아닌 난데'),
(70,'나의 마음속에','나의 하루는 오직 너만 있어서
너 없인 아무것도 아닌 난데','사랑한다는 말을'),
(71,'나의 마음속에','너 없인 아무것도 아닌 난데
사랑한다는 말을','하고 싶어도 할 수 없는 그런 난데'),
(72,'나의 마음속에','사랑한다는 말을
하고 싶어도 할 수 없는 그런 난데','나의 모든 것을'),
(73,'나의 마음속에','하고 싶어도 할 수 없는 그런 난데
나의 모든 것을','다 버려도 너만 있다면'),
(74,'나의 마음속에','나의 모든 것을
다 버려도 너만 있다면','평생을 널 바라보며 살 텐데'),
(75,'나의 마음속에','다 버려도 너만 있다면
평생을 널 바라보며 살 텐데','그런 내가 이 세상 누구보다'),
(76,'나의 마음속에','평생을 널 바라보며 살 텐데
그런 내가 이 세상 누구보다','널 위해 살고 있는 걸'),
(77,'상처','널 사랑했던 내가 바보였나 봐
널 위해서 내 모든 걸 버렸는데','너만을 위해 살았던 내 시간은'),
(78,'상처','널 위해서 내 모든 걸 버렸는데
너만을 위해 살았던 내 시간은','어떻게 해야 하니'),
(79,'상처','너만을 위해 살았던 내 시간은
어떻게 해야 하니','사랑한다고 내게 말했었잖아'),
(80,'상처','어떻게 해야 하니
사랑한다고 내게 말했었잖아','나만 사랑한다고 약속했었잖아'),
(81,'상처','사랑한다고 내게 말했었잖아
나만 사랑한다고 약속했었잖아','그 말만 믿고 살았던 내 시간은'),
(82,'상처','나만 사랑한다고 약속했었잖아
그 말만 믿고 살았던 내 시간은','어떻게 해야 하니'),
(83,'상처','그 말만 믿고 살았던 내 시간은
어떻게 해야 하니','이대로 널 지우기가 힘들어'),
(84,'상처','어떻게 해야 하니
이대로 널 지우기가 힘들어','난 내일을 어떻게 살아가니'),
(85,'상처','이대로 널 지우기가 힘들어
난 내일을 어떻게 살아가니','그리운 내 마음은 너를 향하고 있어'),
(86,'상처','난 내일을 어떻게 살아가니
그리운 내 마음은 너를 향하고 있어','어디 있을지 모를 곳으로'),
(87,'상처','그리운 내 마음은 너를 향하고 있어
어디 있을지 모를 곳으로','날카롭게 파고든 상처들이 널 놓지 못하게'),
(88,'상처','어디 있을지 모를 곳으로
날카롭게 파고든 상처들이 널 놓지 못하게','또 우연히 만들어 낸 너에 대한 기억들이'),
(89,'상처','날카롭게 파고든 상처들이 널 놓지 못하게
또 우연히 만들어 낸 너에 대한 기억들이','가슴 깊이 스며든 내 눈물이'),
(90,'상처','또 우연히 만들어 낸 너에 대한 기억들이
가슴 깊이 스며든 내 눈물이','널 놓지 말라고 또 방황하는 나의 사랑이'),
(91,'상처','가슴 깊이 스며든 내 눈물이
널 놓지 말라고 또 방황하는 나의 사랑이','미련이라 말하고 있어 가슴 깊은 곳에'),
(92,'상처','널 놓지 말라고 또 방황하는 나의 사랑이
미련이라 말하고 있어 가슴 깊은 곳에','다신 사랑할 수 없을 것 같아'),
(93,'상처','미련이라 말하고 있어 가슴 깊은 곳에
다신 사랑할 수 없을 것 같아','난 하루를 어떻게 견뎌야 해'),
(94,'상처','다신 사랑할 수 없을 것 같아
난 하루를 어떻게 견뎌야 해','그리운 내 마음은 너를 찾고 있어'),
(95,'상처','난 하루를 어떻게 견뎌야 해
그리운 내 마음은 너를 찾고 있어','어디 있을지 모를 너를'),
(96,'상처','그리운 내 마음은 너를 찾고 있어
어디 있을지 모를 너를','날카롭게 파고든 상처들이 널 놓지 못하게'),
(97,'상처','어디 있을지 모를 너를
날카롭게 파고든 상처들이 널 놓지 못하게','또 우연히 만들어 낸 너에 대한 기억들이'),
(98,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','잘 지내는지 그냥
가끔 궁금했어','그렇게도 널 울렸는데 말야'),
(99,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','가끔 궁금했어
그렇게도 널 울렸는데 말야','참 고마웠어 나는'),
(100,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','그렇게도 널 울렸는데 말야
참 고마웠어 나는','너를 만나서'),
(101,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','참 고마웠어 나는
너를 만나서','아주 조금 더'),
(102,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','너를 만나서
아주 조금 더','좋은 사람이 됐지만'),
(103,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','아주 조금 더
좋은 사람이 됐지만','날 지워'),
(104,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','좋은 사람이 됐지만
날 지워','네 마음에 엉켜 있는나를 지워'),
(105,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','날 지워
네 마음에 엉켜 있는나를 지워','날 버려'),
(106,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','네 마음에 엉켜 있는나를 지워
날 버려','남보다 더 못하게'),
(107,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','날 버려
남보다 더 못하게','외면하고 미워해 줘'),
(108,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','남보다 더 못하게
외면하고 미워해 줘','아무 일도 없던 것처럼'),
(109,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','외면하고 미워해 줘
아무 일도 없던 것처럼','사랑하지 않은 것처럼'),
(110,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','사랑하지 않은 것처럼
잘 지내라는 말은','하고 싶었어'),
(111,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','잘 지내라는 말은
하고 싶었어','이미 너무 늦었는데 말야'),
(112,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','하고 싶었어
이미 너무 늦었는데 말야','이런 미련도 너에 대한'),
(113,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','이미 너무 늦었는데 말야
이런 미련도 너에 대한','사소한 기억들로'),
(114,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','이런 미련도 너에 대한
사소한 기억들로','하루를 버티는 일조차 못하게'),
(115,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','사소한 기억들로
하루를 버티는 일조차 못하게','날 지워'),
(116,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','하루를 버티는 일조차 못하게
날 지워','네 마음에 엉켜 있는나를 지워'),
(117,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','사랑하지 않은 것처럼
더 이상 스치는 일조차','기대하지 않게'),
(118,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','더 이상 스치는 일조차
기대하지 않게','혹시 너일까 봐'),
(119,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','기대하지 않게
혹시 너일까 봐','뒤돌아보는 일조차 없게'),
(120,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','혹시 너일까 봐
뒤돌아보는 일조차 없게','너의 하루는 어땠는지 묻거나'),
(121,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','뒤돌아보는 일조차 없게
너의 하루는 어땠는지 묻거나','너의 속상함을 그랬구나'),
(122,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','너의 하루는 어땠는지 묻거나
너의 속상함을 그랬구나','위로하는 일도 이젠 못하게'),
(123,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','너의 속상함을 그랬구나
위로하는 일도 이젠 못하게','날 지워'),
(124,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','위로하는 일도 이젠 못하게
날 지워','네 마음에 엉켜 있는 나를 지워'),
(125,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','날 지워
네 마음에 엉켜 있는 나를 지워','날 버려'),
(126,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','네 마음에 엉켜 있는 나를 지워
날 버려','남보다 더 못하게'),
(127,'아무 일도 없던 것처럼 사랑하지 않은 것처럼','사랑하지 않은 것처럼
날 지워','네 마음에 엉켜 있는 나를 지워'),
(128,'나는 너의 노래가 되어','이제야 네 앞에 서서
하고 싶은 말이 있어','오늘은 우리라는'),
(129,'나는 너의 노래가 되어','하고 싶은 말이 있어
오늘은 우리라는','이름으로 너와 약속하고 싶어'),
(130,'나는 너의 노래가 되어','오늘은 우리라는
이름으로 너와 약속하고 싶어','너라는 사람을 만나'),
(131,'나는 너의 노래가 되어','이름으로 너와 약속하고 싶어
너라는 사람을 만나','나는 사랑을 배웠어'),
(132,'나는 너의 노래가 되어','너라는 사람을 만나
나는 사랑을 배웠어','I promise with you'),
(133,'나는 너의 노래가 되어','나는 사랑을 배웠어
I promise with you','언제나 너의 곁에서'),
(134,'나는 너의 노래가 되어','I promise with you
언제나 너의 곁에서','변하지 않을 나니까'),
(135,'나는 너의 노래가 되어','언제나 너의 곁에서
변하지 않을 나니까','지치고 힘들 때'),
(136,'나는 너의 노래가 되어','변하지 않을 나니까
지치고 힘들 때','I promise with you'),
(137,'나는 너의 노래가 되어','I promise with you
내게 기대도 돼','언제나 네가 부를 수 있게'),
(138,'나는 너의 노래가 되어','내게 기대도 돼
언제나 네가 부를 수 있게','나는 너의 노래가 되어'),
(139,'나는 너의 노래가 되어','나는 너의 노래가 되어
나라는 사람은 항상','너라는 행복에 사니까'),
(140,'나는 너의 노래가 되어','나라는 사람은 항상
너라는 행복에 사니까','I promise with you'),
(141,'나는 너의 노래가 되어','너라는 행복에 사니까
I promise with you','언제나 너의 곁에서'),
(142,'나는 너의 노래가 되어','나는 너의 노래가 되어
네가 내게 준 사랑만큼','나도 널 사랑할게'),
(143,'나는 너의 노래가 되어','네가 내게 준 사랑만큼
나도 널 사랑할게','아니 더 사랑할게'),
(144,'나는 너의 노래가 되어','나도 널 사랑할게
아니 더 사랑할게','너도 그래줄래'),
(145,'나는 너의 노래가 되어','아니 더 사랑할게
너도 그래줄래','I promise with you'),
(146,'나는 너의 노래가 되어','너도 그래줄래
I promise with you','언제나 서로의 곁에서'),
(147,'나는 너의 노래가 되어','I promise with you
언제나 서로의 곁에서','변하지 않기로 해'),
(148,'나는 너의 노래가 되어','언제나 서로의 곁에서
변하지 않기로 해','지치고 힘들 때'),
(149,'나는 너의 노래가 되어','변하지 않기로 해
지치고 힘들 때','I promise with you'),
(150,'나는 너의 노래가 되어','I promise with you
이젠 약속할래','언제나 처음 같은 마음으로'),
(151,'나는 너의 노래가 되어','이젠 약속할래
언제나 처음 같은 마음으로','서로가 서로의 노래가 되어')
on conflict(id) do update set song_title=excluded.song_title,prompt=excluded.prompt,answer=excluded.answer;

drop function if exists public.songquiz_healthcheck();
create function public.songquiz_healthcheck()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  select count(*) into v_count from public.songquiz_questions;
  return jsonb_build_object('ok',v_count>=10,'question_count',v_count);
end $$;

drop function if exists public.songquiz_create_room(text,integer);
create function public.songquiz_create_room(p_nickname text,p_max_players integer)
returns text language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text;v_try integer:=0;v_max integer:=greatest(2,least(4,coalesce(p_max_players,2)));
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if nullif(trim(p_nickname),'') is null then raise exception '닉네임을 입력해 주세요.'; end if;
  delete from public.songquiz_rooms where updated_at < now()-interval '3 hours';
  loop
    v_try:=v_try+1;v_code:=upper(substr(md5(random()::text||clock_timestamp()::text||v_uid::text),1,6));
    exit when not exists(select 1 from public.songquiz_rooms where code=v_code) or v_try>20;
  end loop;
  if exists(select 1 from public.songquiz_rooms where code=v_code) then raise exception '방 코드를 만들지 못했습니다.'; end if;
  insert into public.songquiz_rooms(code,host_id,max_players,status) values(v_code,v_uid,v_max,'waiting');
  insert into public.songquiz_players(room_code,user_id,nickname,ready) values(v_code,v_uid,left(trim(p_nickname),16),false);
  return v_code;
end $$;

drop function if exists public.songquiz_join_room(text,text);
create function public.songquiz_join_room(p_code text,p_nickname text)
returns text language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_code));v_status text;v_max integer;v_count integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select status,max_players into v_status,v_max from public.songquiz_rooms where code=v_code for update;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if exists(select 1 from public.songquiz_players where room_code=v_code and user_id=v_uid) then
    update public.songquiz_players set nickname=left(trim(p_nickname),16),left_at=null where room_code=v_code and user_id=v_uid;
    return v_code;
  end if;
  if v_status<>'waiting' then raise exception '이미 시작된 방입니다.'; end if;
  select count(*) into v_count from public.songquiz_players where room_code=v_code and left_at is null;
  if v_count>=v_max then raise exception '방이 가득 찼습니다.'; end if;
  insert into public.songquiz_players(room_code,user_id,nickname,ready) values(v_code,v_uid,left(trim(p_nickname),16),false);
  update public.songquiz_rooms set updated_at=now() where code=v_code;
  return v_code;
end $$;

drop function if exists public.songquiz_set_ready(text,boolean);
create function public.songquiz_set_ready(p_code text,p_ready boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_code));
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if not exists(select 1 from public.songquiz_rooms where code=v_code and status='waiting') then raise exception '대기 중인 방이 아닙니다.'; end if;
  update public.songquiz_players set ready=coalesce(p_ready,false) where room_code=v_code and user_id=v_uid and left_at is null;
  if not found then raise exception '참가자가 아닙니다.'; end if;
  update public.songquiz_rooms set updated_at=now() where code=v_code;
end $$;

drop function if exists public.songquiz_start_room(text);
create function public.songquiz_start_room(p_code text)
returns void language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_code));v_host uuid;v_status text;v_max integer;v_count integer;v_ready integer;v_ids bigint[];
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select host_id,status,max_players into v_host,v_status,v_max from public.songquiz_rooms where code=v_code for update;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if v_host<>v_uid then raise exception '방장만 시작할 수 있습니다.'; end if;
  if v_status<>'waiting' then raise exception '이미 시작된 방입니다.'; end if;
  select count(*),count(*) filter(where ready) into v_count,v_ready from public.songquiz_players where room_code=v_code and left_at is null;
  if v_count<>v_max then raise exception '선택한 참가 인원이 모두 모여야 합니다.'; end if;
  if v_ready<>v_count then raise exception '모든 참가자가 준비해야 합니다.'; end if;
  select array_agg(id order by rnd) into v_ids from (select id,random() rnd from public.songquiz_questions order by rnd limit 10) q;
  if coalesce(array_length(v_ids,1),0)<10 then raise exception '노래 문제 수가 부족합니다.'; end if;
  delete from public.songquiz_answers where room_code=v_code;
  update public.songquiz_players set score=0,correct_count=0,total_response_ms=0,ready=false,left_at=null where room_code=v_code;
  update public.songquiz_rooms set status='playing',current_question=0,question_ids=v_ids,question_started_at=clock_timestamp(),winner_id=null,updated_at=now() where code=v_code;
end $$;

drop function if exists public.songquiz_get_snapshot(text);
create function public.songquiz_get_snapshot(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_room_code));v_room public.songquiz_rooms%rowtype;v_players jsonb;v_answers jsonb;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select * into v_room from public.songquiz_rooms where code=v_code;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if not exists(select 1 from public.songquiz_players where room_code=v_code and user_id=v_uid) then raise exception '참가자가 아닙니다.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'nickname',nickname,'ready',ready,'score',score,'correct_count',correct_count,'total_response_ms',total_response_ms,'joined_at',joined_at,'left_at',left_at) order by joined_at),'[]'::jsonb) into v_players from public.songquiz_players where room_code=v_code;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'is_correct',is_correct,'points',points,'response_ms',response_ms,'submitted_at',submitted_at) order by submitted_at),'[]'::jsonb) into v_answers from public.songquiz_answers where room_code=v_code and question_index=v_room.current_question;
  return jsonb_build_object('code',v_room.code,'host_id',v_room.host_id,'max_players',v_room.max_players,'status',v_room.status,'current_question',v_room.current_question,'question_started_at',v_room.question_started_at,'winner_id',v_room.winner_id,'players',v_players,'answers',v_answers);
end $$;

drop function if exists public.songquiz_get_current_question(text);
create function public.songquiz_get_current_question(p_room_code text)
returns table(question_text text,question_number integer,total_questions integer)
language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_room_code));v_room public.songquiz_rooms%rowtype;v_qid bigint;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select * into v_room from public.songquiz_rooms where code=v_code;
  if not found or v_room.status<>'playing' then raise exception '진행 중인 대전이 아닙니다.'; end if;
  if not exists(select 1 from public.songquiz_players where room_code=v_code and user_id=v_uid and left_at is null) then raise exception '참가자가 아닙니다.'; end if;
  v_qid:=v_room.question_ids[v_room.current_question+1];
  return query select q.prompt,v_room.current_question+1,10 from public.songquiz_questions q where q.id=v_qid;
end $$;

drop function if exists public.songquiz_submit_answer(text,integer,text);
create function public.songquiz_submit_answer(p_room_code text,p_question_index integer,p_answer text)
returns table(result_correct boolean,result_points integer,result_answer text,result_song text,result_response_ms integer)
language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_room_code));v_room public.songquiz_rooms%rowtype;v_qid bigint;v_answer text;v_song text;v_norm_input text;v_norm_answer text;v_elapsed integer;v_correct boolean:=false;v_points integer:=0;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select * into v_room from public.songquiz_rooms where code=v_code for update;
  if not found or v_room.status<>'playing' then raise exception '진행 중인 대전이 아닙니다.'; end if;
  if p_question_index<>v_room.current_question then raise exception '이미 다음 문제로 넘어갔습니다.'; end if;
  if not exists(select 1 from public.songquiz_players where room_code=v_code and user_id=v_uid and left_at is null) then raise exception '참가자가 아닙니다.'; end if;
  if exists(select 1 from public.songquiz_answers where room_code=v_code and question_index=p_question_index and user_id=v_uid) then raise exception '이미 답변했습니다.'; end if;
  v_qid:=v_room.question_ids[v_room.current_question+1];
  select answer,song_title into v_answer,v_song from public.songquiz_questions where id=v_qid;
  v_elapsed:=greatest(0,least(15000,floor(extract(epoch from (clock_timestamp()-v_room.question_started_at))*1000)::integer));
  v_norm_input:=regexp_replace(lower(coalesce(p_answer,'')),'[[:space:][:punct:]]+','','g');
  v_norm_answer:=regexp_replace(lower(coalesce(v_answer,'')),'[[:space:][:punct:]]+','','g');
  if clock_timestamp()<=v_room.question_started_at+interval '15 seconds' and length(v_norm_input)>0 and v_norm_input=v_norm_answer then
    v_correct:=true;v_points:=100+greatest(0,floor((15000-v_elapsed)/100.0)::integer);
  else
    v_correct:=false;v_points:=0;
  end if;
  insert into public.songquiz_answers(room_code,question_index,user_id,answer_text,is_correct,points,response_ms) values(v_code,p_question_index,v_uid,left(coalesce(p_answer,''),200),v_correct,v_points,v_elapsed);
  update public.songquiz_players set score=score+v_points,correct_count=correct_count+case when v_correct then 1 else 0 end,total_response_ms=total_response_ms+v_elapsed where room_code=v_code and user_id=v_uid;
  update public.songquiz_rooms set updated_at=now() where code=v_code;
  return query select v_correct,v_points,v_answer,v_song,v_elapsed;
end $$;

drop function if exists public.songquiz_advance_room(text);
create function public.songquiz_advance_room(p_room_code text)
returns integer language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_room_code));v_room public.songquiz_rooms%rowtype;v_players integer;v_answered integer;v_winner uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  select * into v_room from public.songquiz_rooms where code=v_code for update;
  if not found then raise exception '방을 찾을 수 없습니다.'; end if;
  if v_room.status<>'playing' then return v_room.current_question; end if;
  if not exists(select 1 from public.songquiz_players where room_code=v_code and user_id=v_uid and left_at is null) then raise exception '참가자가 아닙니다.'; end if;
  select count(*) into v_players from public.songquiz_players where room_code=v_code and left_at is null;
  select count(*) into v_answered from public.songquiz_answers a join public.songquiz_players p on p.room_code=a.room_code and p.user_id=a.user_id where a.room_code=v_code and a.question_index=v_room.current_question and p.left_at is null;
  if v_answered<v_players and clock_timestamp()<v_room.question_started_at+interval '15 seconds' then return v_room.current_question; end if;
  if v_room.current_question>=9 then
    select user_id into v_winner from public.songquiz_players where room_code=v_code and left_at is null order by score desc,correct_count desc,total_response_ms asc,joined_at asc limit 1;
    update public.songquiz_rooms set status='finished',winner_id=v_winner,updated_at=now() where code=v_code;
    return 10;
  end if;
  update public.songquiz_rooms set current_question=current_question+1,question_started_at=clock_timestamp(),updated_at=now() where code=v_code;
  return v_room.current_question+1;
end $$;

drop function if exists public.songquiz_leave_room(text);
create function public.songquiz_leave_room(p_room_code text)
returns void language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_room_code));v_room public.songquiz_rooms%rowtype;v_remaining integer;v_next_host uuid;
begin
  if v_uid is null then return; end if;
  select * into v_room from public.songquiz_rooms where code=v_code for update;
  if not found then return; end if;
  if not exists(select 1 from public.songquiz_players where room_code=v_code and user_id=v_uid) then return; end if;
  if v_room.status='waiting' then
    delete from public.songquiz_players where room_code=v_code and user_id=v_uid;
    select count(*) into v_remaining from public.songquiz_players where room_code=v_code and left_at is null;
    if v_remaining=0 then delete from public.songquiz_rooms where code=v_code;return;end if;
    if v_room.host_id=v_uid then select user_id into v_next_host from public.songquiz_players where room_code=v_code and left_at is null order by joined_at limit 1;update public.songquiz_rooms set host_id=v_next_host,updated_at=now() where code=v_code;end if;
    return;
  end if;
  update public.songquiz_players set left_at=coalesce(left_at,now()) where room_code=v_code and user_id=v_uid;
  if v_room.status='playing' then
    select count(*) into v_remaining from public.songquiz_players where room_code=v_code and left_at is null;
    if v_remaining<2 then select user_id into v_next_host from public.songquiz_players where room_code=v_code and left_at is null order by score desc,correct_count desc,total_response_ms asc limit 1;update public.songquiz_rooms set status='finished',winner_id=v_next_host,updated_at=now() where code=v_code;end if;
  end if;
end $$;

drop function if exists public.songquiz_list_open_rooms();
create function public.songquiz_list_open_rooms()
returns table(room_code text,host_nickname text,player_count integer,max_players integer,is_mine boolean,created_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  return query
  select r.code,coalesce(h.nickname,'익명'),count(p.user_id) filter(where p.left_at is null)::integer,r.max_players,exists(select 1 from public.songquiz_players me where me.room_code=r.code and me.user_id=v_uid and me.left_at is null),r.created_at
  from public.songquiz_rooms r
  left join public.songquiz_players p on p.room_code=r.code
  left join public.songquiz_players h on h.room_code=r.code and h.user_id=r.host_id
  where r.status='waiting'
  group by r.code,h.nickname,r.max_players,r.created_at
  having count(p.user_id) filter(where p.left_at is null)<r.max_players or exists(select 1 from public.songquiz_players me where me.room_code=r.code and me.user_id=v_uid and me.left_at is null)
  order by r.created_at desc limit 30;
end $$;

revoke all on function public.songquiz_healthcheck() from public;
revoke all on function public.songquiz_create_room(text,integer) from public;
revoke all on function public.songquiz_join_room(text,text) from public;
revoke all on function public.songquiz_set_ready(text,boolean) from public;
revoke all on function public.songquiz_start_room(text) from public;
revoke all on function public.songquiz_get_snapshot(text) from public;
revoke all on function public.songquiz_get_current_question(text) from public;
revoke all on function public.songquiz_submit_answer(text,integer,text) from public;
revoke all on function public.songquiz_advance_room(text) from public;
revoke all on function public.songquiz_leave_room(text) from public;
revoke all on function public.songquiz_list_open_rooms() from public;

grant execute on function public.songquiz_healthcheck() to authenticated;
grant execute on function public.songquiz_create_room(text,integer) to authenticated;
grant execute on function public.songquiz_join_room(text,text) to authenticated;
grant execute on function public.songquiz_set_ready(text,boolean) to authenticated;
grant execute on function public.songquiz_start_room(text) to authenticated;
grant execute on function public.songquiz_get_snapshot(text) to authenticated;
grant execute on function public.songquiz_get_current_question(text) to authenticated;
grant execute on function public.songquiz_submit_answer(text,integer,text) to authenticated;
grant execute on function public.songquiz_advance_room(text) to authenticated;
grant execute on function public.songquiz_leave_room(text) to authenticated;
grant execute on function public.songquiz_list_open_rooms() to authenticated;

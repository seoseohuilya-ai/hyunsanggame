const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const locations={home:{name:'자취방',cls:'home'},store:{name:'편의점',cls:'store'},practice:{name:'연습실',cls:'practice'},park:{name:'공원',cls:'park'},stage:{name:'공연장',cls:'stage'}};
const baseState={day:1,slot:0,time:0,location:'home',level:1,exp:0,rank:'무명 가수',weather:'sun',housing:0,endingPrompted:{},pendingEnding:null,stats:{hp:80,vocal:22,compose:16,looks:35,fame:0,fans:0,money:800000,stress:10},equipment:{mic:false,amp:false,battery:false},equipmentDamage:{mic:false,amp:false},instruments:{acousticGuitar:false,keyboard:false,audioInterface:false,studioMic:false,monitorHeadphones:false},fanGroups:{regular:0,enthusiast:0,gay:0,overseas:0},sns:{lastPostDay:-99,totalPosts:0,controversy:0,lastEventDay:-99},rival:{met:false,stage:0,respect:0,lastEventDay:-99},items:{bakcas:1,bakcasUsedToday:0,mealsToday:0},economy:{workStreak:0,lastWorkDay:-99,debt:0,totalDebtRepaid:0,lastDebtNoticeDay:-99},equippedInstruments:[],career:{peakFame:0,totalWork:0,totalConcerts:0,totalBroadcasts:0,totalBusking:0},manager:{hired:false,bond:0,wedding:false},band:{formed:false,bond:60,members:{guitar:null,bass:null,piano:null,drums:null}},albums:[],endings:[],history:[],dialogue:null,seenEvents:[],soloStreak:0,outfit:0,ownedOutfits:[0],performanceCount:0,stalker:{active:false,resolved:false,encounters:0,safety:0},arrogance:{lastDay:-99,count:0,lesson:0},specialEvents:{iziViral:false,waitedMoreViral:false,day30Hair:false,day60Workout:false,day90Live:false,day120Chat:false,day150Birthday:false,day180Archive:false,day210Demo:false,day240Meme:false,day300Promise:false,hiddenGameOst:false,hiddenRadioDj:false,hiddenDingo:false,mysteriousMerchantPurchased:false},specialScene:{active:false,key:null},preparation:{stageReady:false,stageReadyDay:-99,buskingInsight:false,buskingInsightDay:-99},cooldowns:{managerTalk:-99,recruit:-99,audition:-99,concert:-99,broadcast:-99,fanmeeting:-99,album:-99,fanEvent:-99,snsPost:-99},milestones:{firstAudition:false,firstConcert:false,firstBroadcast:false,firstFanmeeting:false,firstAlbum:false,managerHired:false,bandFormed:false,stalkerResolved:false,randomSeen:[]},historyKeys:[],lastAction:null,prologueSeen:false};
let state=structuredClone(baseState);let deferredPrompt=null;let audioCtx=null;let motionTimer=null;let burstTimer=null;let memoryGameActive=false;let activeTrainingAbort=null;
let audioMaster=null,bgmGain=null,sfxGain=null,bgmTimer=null,bgmStep=0;
let choiceLock=false,endingMusicMode=false,endingMusicName='';
let audioSettings={bgm:true,sfx:true,volume:.42};
const actions={
 home:[['깊은 휴식','집 등급에 따라 체력·스트레스 회복','rest'],['식사','체력 +12 / 8천원 / 하루 2회','meal'],['옷장','의상 변경·스타일 관리','wardrobe'],['이사','더 좋은 집으로 이동','moveHome'],['가계부·채무','보유금으로 채무 직접 상환','finance']],
 store:[['편의점 알바','급여 4.5만원 / 연속근무 피로','work'],['야간 진열 보조','급여 2.5만원 / 낮은 체력 소모','stockWork'],['박칵스 구입','1.5만원','buyBakcas'],['삼각김밥','체력 +8 / 2,500원','snack'],['매장 홍보 방송','팬·인지도 증가','storePromo'],['단골 손님 응대','소액 팁·팬 증가','customerPractice']],
 practice:[['보컬 연습','보컬 훈련','vocal'],['작곡 연습','작곡 훈련','compose'],['멤버 오디션','조건 충족 파트만 영입','recruit'],['밴드 합주','완전체 밴드 결속력 상승','rehearse'],['신곡 편곡','완전체 밴드 편곡 훈련','arrange'],['장비 점검','마이크·앰프 고장 수리','repair'],['앨범 제작','싱글·미니·정규앨범 발매','album']],
 park:[['버스킹','요일·날씨 영향','busking'],['밴드 버스킹','완전체 밴드 공연','bandBusking'],['산책','스트레스 감소','walk'],['라이벌 관찰','보컬 분석 훈련','observe'],['공연 전단 홍보','비용·체력 소모 / 팬 증가','flyerPromo'],['관객 반응 조사','다음 버스킹 성공률 상승','audienceResearch']],
 stage:[['무대 리허설','다음 오디션·공연·방송 보너스','stageRehearsal'],['오디션','데뷔 기회','audition'],['공연','팬·수익 증가','concert'],['방송 출연','인지도 증가','broadcast'],['팬미팅','팬 증가','fanmeeting'],['대형 콘서트','월드 스타 엔딩 도전','national']]
};
const dialogues={
 home:[
  '방 안은 조용했다. 창문 틈으로 들어온 빛이 기타 케이스 위에 길게 누웠다. 오늘도 누군가 알아주지 않는 노래를 만들겠지만, 적어도 어제보다 한 줄은 더 솔직하게 쓸 수 있을 것 같다.',
  '냉장고를 열어 보니 물과 반쯤 남은 김치뿐이었다. 류현상은 잠시 고민하다 문을 닫았다. 배고픔보다 먼저 떠오른 건 어젯밤 완성하지 못한 후렴구였다.',
  '벽이 얇아 큰 소리로 노래할 수 없었다. 그는 이불을 뒤집어쓰고 작은 목소리로 고음을 확인했다. 옆집에서는 재채기 소리가 들렸다. 적어도 항의는 아니었다.',
  '책상 위에는 구겨진 가사 종이가 쌓여 있었다. “사랑”이라는 단어를 지우고 “미련”을 썼다가, 다시 지웠다. 좋은 가사보다 솔직한 가사가 더 어려웠다.',
  '현상은 거울 속 긴 머리를 한참 바라봤다. 자르면 편할 것 같았지만, 이상하게도 이 머리까지 잘라 버리면 무명 시절의 자신도 함께 사라질 것 같았다.',
  '휴대전화에는 조회수 17회의 영상이 떠 있었다. 그중 세 번은 후라보노, 두 번은 본인이 눌렀다는 사실을 그는 굳이 계산하지 않기로 했다.',
  '아랫집에서 천장을 두드리는 소리가 났다. 류현상은 기타를 내려놓고 조용히 중얼거렸다. “이번에는 내가 아니라 냉장고인데.” 냉장고는 억울하다는 듯 다시 웅웅거렸다.',
  '비싼 집으로 이사하는 상상을 하다가 월세 자동이체 문자를 확인했다. 상상은 정확히 4초 만에 끝났다.'
 ],
 store:[
  '형광등 아래에서 보면 누구나 조금 피곤해 보인다. 류현상은 유리문에 비친 자신의 얼굴을 보고 안경을 고쳐 썼다. 손님이 아니라 야간 근무자처럼 보이는 데 성공했다.',
  '계산대 앞 손님이 류현상을 빤히 보더니 물었다. “혹시 그 공원에서 노래하는 분 맞죠?” 그는 잠시 고민하다 영수증을 건네며 말했다. “오늘은 계산하는 사람입니다.”',
  '박칵스를 바라보는 시간이 길어졌다. 음료 냉장고 안에서 작은 병들이 마치 합창단처럼 줄을 맞추고 있었다. 문제는 한 병으로 피로가 사라지지 않는다는 점이었다.',
  '삼각김밥 포장을 뜯으며 그는 유통기한과 자신의 가수 인생을 비교하지 않기로 했다. 적어도 삼각김밥은 오늘 안에 누군가 선택해 줄 것이다.',
  '편의점 스피커에서 유행곡이 흘러나왔다. 류현상은 음료를 진열하면서 무심코 화음을 넣었다. 손님 한 명이 놀라 돌아봤지만, 그는 아무 일도 없었다는 듯 생수 가격표를 정리했다.',
  '손님이 “박칵스 어디 있어요?”라고 묻자 류현상은 너무 빠르게 위치와 효능과 가격까지 설명했다. 손님은 잠시 침묵하다 두 병을 샀다. 본인도 한 병 살까 고민했다.',
  '새벽 두 시, 아무도 없는 매장에 전자레인지 완료음이 울렸다. 류현상은 그 네 음을 듣고 괜찮은 멜로디라고 생각했다. 피곤하면 무엇이든 곡이 된다.',
  '진상 손님이 봉투값 100원을 두고 십 분째 항의했다. 류현상은 무대보다 계산대가 더 강한 멘탈을 요구한다는 사실을 배웠다.'
 ],
 practice:[
  'P군은 기타 줄을 닦는 데 합주 시간의 절반을 썼고, L군은 그 모습을 말없이 바라봤다. J군은 이미 다른 키로 편곡을 시작했고, R군은 스틱으로 의자를 두드렸다. 아직 한 음도 맞추지 않았는데 밴드다웠다.',
  '“다시.” 류현상이 짧게 말하자 네 명이 동시에 한숨을 쉬었다. 그래도 누구도 악기를 내려놓지 않았다. 그 작은 사실이 오늘 연습의 가장 좋은 부분이었다.',
  'P군이 기타 볼륨을 올리자 L군이 조용히 베이스 볼륨을 더 올렸다. R군은 경쟁에 참가했고 J군은 귀마개를 찾았다. 류현상은 마이크를 내려놓고 말했다. “이건 합주가 아니라 음량 경매야.”',
  'J군이 새 편곡을 들려줬다. 원곡은 잔잔한 발라드였는데 결과물은 우주선 출발 음악처럼 들렸다. 모두가 침묵하자 J군은 진지하게 말했다. “미래지향적이죠?”',
  'R군은 필인 한 번을 멋지게 성공한 뒤 같은 필인을 모든 마디에 넣기 시작했다. 류현상이 세 번째 반복에서 멈추자 R군은 아쉬운 표정으로 스틱을 내려놨다.',
  'L군은 말이 거의 없었지만 틀린 음이 나오면 정확히 그 사람을 바라봤다. 오늘은 류현상과 눈이 세 번 마주쳤다. 말보다 효과적인 피드백이었다.',
  '합주가 끝난 뒤 멤버들은 아무도 먼저 나가지 않았다. 음악 이야기를 하다가 배달 메뉴 이야기로 넘어갔고, 결국 가장 오래 논의한 것은 탕수육 소스를 붓느냐 찍느냐였다.',
  '후라보노가 문을 열고 들어오더니 연습실을 한 바퀴 둘러봤다. “형, 음악은 좋은데 전기세가 무대급이에요.” 모두가 조용히 앰프 볼륨을 한 칸 내렸다.'
 ],
 park:[
  '공원에는 운동하는 사람, 산책하는 사람, 아무 이유 없이 벤치에 앉아 있는 사람이 있었다. 류현상은 그중 단 한 명이라도 노래를 듣기 위해 멈춰 주길 바라며 마이크를 세웠다.',
  '바람이 불 때마다 긴 머리카락이 입술에 붙었다. 세 번째 곡에서 그는 노래를 멈추고 머리를 묶었다. 관객 한 명이 박수를 쳤다. 노래보다 실용적인 선택에 대한 박수 같았다.',
  '첫 곡이 끝났지만 아무도 박수치지 않았다. 류현상은 두 번째 곡을 시작했다. 무명가수의 장점은 침묵에 익숙하다는 것이고, 단점도 정확히 그것이었다.',
  '벤치 끝에 늘 오는 중년 남자가 앉아 있었다. 그는 한 번도 박수치지 않았지만 항상 마지막 곡까지 듣고 갔다. 오늘은 작은 캔커피 하나를 무대 앞에 두고 떠났다.',
  '강아지 한 마리가 스피커 앞에 앉아 고개를 갸웃거렸다. 주인이 끌고 가려 했지만 강아지는 버텼다. 오늘 가장 열성적인 관객은 사람보다 네 발이 많았다.',
  '아이들이 류현상의 긴 머리를 보고 “마법사다”라고 속삭였다. 류현상은 마이크를 잡고 낮게 말했다. “노래만 하는 마법사야.” 아이들은 기대보다 크게 웃었다.',
  '비가 올 듯 구름이 내려앉았다. 관객은 줄었지만 소리가 공기 속에서 더 선명하게 퍼졌다. 나쁜 날씨가 항상 나쁜 무대를 만드는 것은 아니었다.',
  '멀리서 누군가 휴대전화로 촬영하고 있었다. 조회수가 오를 기회인지, 또 다른 흑역사의 시작인지 알 수 없었다.'
 ],
 stage:[
  '무대 뒤에서는 모든 사람이 평소보다 조용했다. 케이블을 정리하는 스태프의 발소리까지 크게 들렸다. 류현상은 손바닥의 땀을 셔츠에 닦고 첫 음을 머릿속으로 반복했다.',
  '관객석은 어두워 얼굴이 보이지 않았다. 이상하게도 그 편이 편했다. 수백 명의 낯선 사람은 한 명의 냉정한 심사위원보다 덜 무서울 때가 있었다.',
  '후라보노가 큐시트를 들고 다가왔다. “형, 긴장돼요?” 류현상이 대답하지 않자 후라보노는 고개를 끄덕였다. “네. 평소랑 똑같다는 뜻이군요.”',
  'P군은 기타 튜닝을 확인했고 L군은 말없이 손가락을 풀었다. J군은 마지막 순간까지 코드를 바꾸려 했고 R군은 스틱을 한 번 떨어뜨렸다. 완벽하지 않아서 오히려 익숙한 팀이었다.',
  '조명이 켜지는 순간, 생활비와 악성 댓글과 월세가 잠시 머릿속에서 사라졌다. 무대 위에서는 노래 하나만 제대로 끝내면 됐다.',
  '대기실 거울에는 출연자들의 이름표가 줄지어 붙어 있었다. 가장 아래에 적힌 류현상의 이름이 낯설게 보였다. 언젠가는 가장 큰 글씨로 적힐 수 있을까.',
  '관객이 류현상의 이름을 외쳤다. 처음에는 몇 명뿐이었지만 곧 더 많은 목소리가 섞였다. 그는 안경을 고쳐 쓰며 그 소리를 오래 기억하려 했다.',
  '무대 감독이 30초 남았다고 손가락으로 신호했다. 후라보노는 “형, 가사 잊어도 표정으로 버티세요”라고 속삭였다. 전혀 도움이 되지 않았지만 웃음은 났다.'
 ]
};
const actionDialogue={
 rest:[
  '눈을 감자 멀리서 자동차 소리와 냉장고 모터 소리가 겹쳐 들렸다. 이상하게도 일정한 박자였다. 류현상은 쉬면서도 그 리듬을 기억해 뒀다.',
  '소파에 눕자마자 잠들 줄 알았지만 머릿속에서는 후렴구가 계속 반복됐다. 그는 결국 휴대전화에 허밍을 녹음한 뒤에야 편하게 숨을 내쉬었다.',
  '아무것도 하지 않는 시간이 불안했지만, 목과 어깨의 힘이 풀리는 걸 느끼자 조금은 납득할 수 있었다. 쉬는 것도 다음 노래를 위한 준비였다.',
  '후라보노가 보내온 메시지에는 “형, 쉬세요”라는 문장이 세 번 적혀 있었다. 류현상은 답장 대신 휴대전화를 뒤집어 놓았다. 말은 안 들어도 메시지는 읽었다.'
 ],
 compose:[
  '첫 줄은 쉽게 나왔지만 두 번째 줄에서 한 시간이 멈췄다. 류현상은 “영원”을 썼다가 너무 흔해 지우고, “내일”을 썼다가 너무 밝아 다시 지웠다.',
  '후렴구를 녹음해 밴드 채팅방에 올리자 P군은 불꽃 이모티콘, J군은 코드 진행표, R군은 드럼 이모티콘 18개를 보냈다. L군은 “괜찮음”이라고 썼다. 최고의 칭찬이었다.',
  '멜로디는 좋았지만 가사가 문제였다. 솔직하게 쓰면 부끄럽고, 숨기면 아무 감정도 남지 않았다. 결국 가장 지우고 싶었던 문장을 첫 소절에 넣었다.',
  '전자레인지 완료음에서 시작한 멜로디가 생각보다 근사하게 이어졌다. 명곡의 탄생 배경을 나중에 인터뷰에서 솔직히 말할지는 고민해 보기로 했다.'
 ],
 vocal:[
  '고음에서 힘이 들어가자 류현상은 다시 처음부터 불렀다. 더 크게가 아니라 더 편하게. 열 번째 시도에서야 목소리가 억지로 밀어 올리지 않아도 떠올랐다.',
  '녹음된 자신의 목소리는 언제나 낯설었다. 잘한 부분보다 부족한 부분이 먼저 들렸지만, 오늘은 어제보다 숨소리가 안정적이었다.',
  'P군이 문밖에서 “형, 그 부분만 스물일곱 번째예요”라고 말했다. 류현상은 잠시 멈췄다가 “세고 있었냐”고 물었다. P군은 대답하지 않았다.',
  '음정은 맞았지만 감정이 비어 있었다. 그는 눈을 감고 가장 듣고 싶었던 말을 떠올린 뒤 다시 노래했다. 이번에는 기계의 숫자보다 본인의 귀가 먼저 반응했다.'
 ],
 busking:[
  '첫 곡에서는 세 명이 멈췄고, 두 번째 곡에서는 일곱 명이 남았다. 마지막 곡이 끝났을 때 낯선 사람들이 서로 눈치를 보다가 동시에 박수를 쳤다.',
  '한 관객이 신청곡을 외쳤지만 류현상이 모르는 곡이었다. 그는 잠시 침묵한 뒤 “다음 주까지 배워 오겠습니다”라고 답했다. 관객은 정말 다음 주에 오겠다고 했다.',
  '노래 도중 아이가 무대 앞 모금함에 과자 한 봉지를 넣었다. 현금은 아니었지만 류현상은 오늘 받은 것 중 가장 비싼 응원처럼 느꼈다.',
  '바람 때문에 악보가 날아갔다. 류현상은 가사를 기억하는 척 계속 노래했지만 2절 대부분은 즉흥이었다. 이상하게도 관객 반응은 평소보다 좋았다.'
 ],
 bandBusking:[
  'R군의 첫 드럼이 울리자 지나가던 사람들이 동시에 고개를 돌렸다. P군이 웃으며 기타를 들어 올렸고, L군의 베이스가 바닥을 울렸다. 혼자서는 만들 수 없는 시작이었다.',
  'J군이 예정에 없던 간주를 시작했다. 모두가 당황했지만 P군이 바로 따라붙었고 R군이 박자를 받쳤다. 끝나고 보니 오늘 가장 좋은 부분이었다.',
  '마지막 곡에서 멤버들이 서로 눈을 마주쳤다. 누구도 말하지 않았지만 엔딩을 한 번 더 늘렸다. 관객은 그것을 계획된 연출이라고 믿어 줬다.',
  '공연 후 모금함을 열자 돈보다 밴드 이름을 적은 쪽지가 더 많았다. R군은 쪽지를 하나씩 읽었고 L군은 조용히 사진을 찍어 단체방에 올렸다.'
 ],
 rehearse:[
  '첫 합주는 엉망이었다. P군은 빨랐고 R군은 더 빨랐으며 J군은 다른 곡처럼 연주했다. L군만 정확했지만 그래서 더 눈에 띄게 혼자였다.',
  '세 번째 반복에서 드디어 네 악기가 같은 곳을 향했다. 곡이 끝나자 아무도 말하지 않았다. 잘됐다는 걸 모두 알고 있을 때 나오는 침묵이었다.',
  'R군이 “이번엔 완벽했죠?”라고 묻자 L군이 조용히 “두 번째 마디 틀림”이라고 답했다. R군은 억울해했지만 녹음 파일은 L군의 편이었다.',
  '후라보노가 합주를 듣고 박수를 쳤다. “좋네요. 그런데 곡이 일곱 분이면 방송에서는 1절 시작 전에 잘려요.” 감동은 정확히 3초 만에 현실로 돌아왔다.'
 ],
 audition:['대기 번호가 불리자 입안이 바짝 말랐다. 류현상은 안경을 고쳐 쓰고 무대 중앙으로 걸었다. 심사위원의 표정보다 마이크의 높이를 맞추는 데 집중했다.','첫 소절에서 목소리가 조금 떨렸지만 두 번째 문장부터는 관객석이 보이지 않았다. 노래가 끝난 뒤 찾아온 정적이 실패인지 집중인지 알 수 없었다.'],
 concert:['객석의 불이 꺼지고 수백 개의 응원봉이 떠올랐다. 류현상은 첫 음을 내기 전 그 풍경을 한 번 더 눈에 담았다.','앙코르 요청이 계속되자 후라보노가 무대 옆에서 손가락 하나를 들어 보였다. 한 곡만 더 하라는 뜻이었지만, R군은 이미 세 곡 할 표정이었다.'],
 broadcast:['카메라 감독이 “자연스럽게 해주세요”라고 말했다. 카메라 세 대와 스태프 열 명 앞에서 자연스러운 사람이 되는 것은 노래보다 어려웠다.','생방송 표시등이 켜지자 후라보노가 멀리서 입 모양으로 “웃어요”라고 말했다. 류현상은 아주 조금 입꼬리를 올렸다. 방송 후 팬들은 그 장면을 희귀 영상이라 불렀다.'],
 walk:['이어폰 없이 걸으니 도시의 소리가 그대로 들렸다. 횡단보도 신호음, 자전거 벨, 아이들의 웃음이 서로 다른 리듬으로 겹쳤다.','공원 한 바퀴를 돌고 나니 머릿속을 꽉 채우던 생각들이 조금씩 자리를 비켰다. 돌아가는 길에는 새 가사의 첫 문장이 떠올랐다.'],
 observe:['라이벌은 고음을 힘으로 밀지 않았다. 류현상은 질투하는 대신 호흡 위치와 입 모양을 유심히 봤다. 배울 수 있다면 자존심은 잠시 미뤄도 됐다.','잘하는 사람의 무대는 간단해 보였다. 하지만 자세히 볼수록 작은 선택이 수십 개 쌓여 있었다. 류현상은 휴대전화 메모장에 관찰한 내용을 적었다.'],
 meal:['따뜻한 국물이 목을 지나자 몸이 조금 풀렸다. 류현상은 너무 빨리 먹다가 혀를 데었고, 무대보다 식사가 더 위험할 수 있다는 사실을 배웠다.','오랜만에 제대로 된 식사를 했다. 밥을 먹는 동안만큼은 팬 수와 인지도와 월세를 생각하지 않으려 했지만, 계산서가 나오자 다시 현실로 돌아왔다.'],
 snack:['삼각김밥 포장을 뜯다가 김이 반으로 찢어졌다. 류현상은 무너진 모양을 잠시 바라본 뒤 그냥 먹었다. 맛에는 큰 지장이 없었다.','간단히 배를 채웠다. 배고픔은 사라졌지만 편의점 신제품 디저트에 대한 미련은 남았다.'],
 work:['새벽 배송 상자를 정리하고 계산대를 지켰다. 손님이 몰릴 때마다 무대보다 빠른 판단력이 필요했다. 그래도 근무가 끝나자 통장 잔고는 확실히 늘었다.','한 손님이 류현상을 알아보고 사인을 부탁했다. 점장은 계산부터 하라고 눈짓했고, 류현상은 영수증 뒷면에 아주 빠르게 이름을 적었다.','컵라면 물을 세 번 쏟은 손님과 봉투값을 항의하는 손님이 동시에 왔다. 류현상은 오늘 얻은 것은 70,000원과 강한 정신력이라고 생각했다.','매장 음악으로 자신의 버스킹 영상이 재생됐다. 손님들은 아무도 눈치채지 못했지만 류현상은 노래가 끝날 때까지 진열대 뒤에서 나오지 않았다.'],
 bakcas:['박칵스를 마시자 정신이 번쩍 들었다. 효과인지 플라시보인지 중요하지 않았다. 지금 필요한 것은 다시 움직일 이유였다.','병뚜껑을 열자 익숙한 향이 올라왔다. 류현상은 “이 정도면 공식 스폰서가 연락할 때도 됐는데”라고 혼잣말했다. 아무 연락도 오지 않았다.'],
 sleep:['내일은 오늘보다 조금 더 나아질 수 있을까. 정답은 없었지만 알람은 정확히 맞춰 두었다.']
};
const storyEvents=[
 {id:'lost-wallet',place:'park',condition:()=>['busking','bandBusking'].includes(state.lastAction)&&state.equipment.mic&&state.equipment.amp,title:'벤치 위의 지갑',text:'버스킹 준비를 하던 중 벤치 위에서 두꺼운 지갑을 발견했다.',choices:[['주인을 기다린다',()=>{stat('fame',8);stat('stress',-4);return '잠시 뒤 달려온 주인이 연신 고개를 숙였다. 그는 지역 공연기획자였다.'}],['경찰서에 맡긴다',()=>{stat('fame',3);return '연습 시간은 줄었지만 마음은 편했다.'}]]},
 {id:'rain-busking',place:'park',condition:()=>['busking','bandBusking'].includes(state.lastAction)&&state.weather==='rain'&&state.equipment.mic&&state.equipment.amp,title:'갑작스러운 소나기',text:'첫 곡이 끝나기도 전에 비가 쏟아졌다. 관객들은 하나둘 뛰어가기 시작했다.',choices:[['끝까지 노래한다',()=>{if(state.stats.hp<12){stat('stress',8);return '목이 잠기고 감기에 걸릴 뻔했다.'}stat('hp',-12);stat('fans',40);stat('fame',12);return '몇 명의 관객이 우산을 들고 끝까지 자리를 지켰다. 영상은 밤새 퍼졌다.'}],['장비부터 지킨다',()=>{stat('stress',-2);return '공연은 중단했지만 장비는 무사했다.'}]]},
 {id:'child-request',place:'park',condition:()=>['busking','bandBusking'].includes(state.lastAction)&&state.equipment.mic&&state.equipment.amp,title:'어린 관객의 신청곡',text:'어린아이가 동전 몇 개를 내밀며 세상을 떠난 강아지가 좋아하던 노래를 불러 달라고 했다.',choices:[['정성껏 불러준다',()=>{stat('fans',25);stat('stress',-5);return '아이와 보호자가 눈물을 훔겼다. 돈보다 오래 남는 공연이었다.'}],['자작곡을 들려준다',()=>{gainSkill('compose',2,'event');stat('fans',10);return '아이는 이해하지 못한 듯했지만 끝까지 자리를 지켰다.'}]]},
 {id:'viral-comment',place:'home',condition:()=>state.performanceCount>0&&state.stats.fans>=50,title:'댓글 1,247개',text:'잠에서 깨 보니 어젯밤 영상에 댓글이 폭발적으로 달려 있었다. 칭찬만큼 악성 댓글도 많았다.',choices:[['모두 읽는다',()=>{stat('fame',25);stat('stress',14);return '사람들의 반응을 알게 됐지만 마음은 무거워졌다.'}],['휴대전화를 끈다',()=>{stat('stress',-8);return '오늘은 음악만 생각하기로 했다.'}]]},
 {id:'neighbor',place:'home',condition:()=>state.lastAction==='compose'&&state.time>=2,title:'벽 너머의 항의',text:'밤늦게 작곡하다가 이웃이 문을 두드렸다. 생각보다 몹시 화가 나 있다.',choices:[['진심으로 사과한다',()=>{stat('money',-30000);stat('stress',-2);return '작은 선물을 건네고 연습 시간을 조정했다.'}],['방음재를 설치한다',()=>{if(state.stats.money<120000){stat('stress',8);return '돈이 부족해 임시로 이불을 벽에 붙였다.'}stat('money',-120000);gainSkill('compose',2,'event');return '집에서도 더 편하게 작업할 수 있게 됐다.'}]]},
 {id:'old-guitar',place:'home',title:'낡은 기타의 편지',text:'중고 기타 케이스 안쪽에서 이전 주인이 남긴 짧은 편지를 발견했다. “포기하지 말 것.”',choices:[['책상 앞에 붙인다',()=>{stat('stress',-12);gainSkill('compose',2,'event');return '짧은 문장이 이상할 만큼 오래 마음에 남았다.'}],['곡의 소재로 쓴다',()=>{gainSkill('compose',4,'event');return '새 노래의 첫 문장이 완성됐다.'}]]},
 {id:'store-fan',place:'store',condition:()=>state.lastAction==='work'&&state.stats.fans>=100,title:'알아본 손님',text:'편의점 손님이 계산을 마치고도 떠나지 않더니 조심스럽게 사인을 부탁했다.',choices:[['친절하게 해준다',()=>{stat('fans',15);stat('looks',1);return '손님은 소중히 간직하겠다며 환하게 웃었다.'}],['무뚝뚝하게 거절한다',()=>{stat('fans',-10);stat('stress',-2);return '짧은 거절 장면이 온라인에 올라가 일부 팬이 실망해 떠났다.'}]]},
 {id:'store-manager',place:'store',title:'새벽의 후라보노',text:'새벽 근무 중 후라보노가 따뜻한 캔커피를 들고 나타났다.',condition:()=>state.lastAction==='work'&&state.manager.hired&&state.time===3,choices:[['고맙다고 한다',()=>{state.manager.bond=clamp(state.manager.bond+8);return '후라보노는 형이 고맙다는 말을 할 줄도 아냐며 웃었다.'}],['왜 왔냐고 묻는다',()=>{state.manager.bond=clamp(state.manager.bond+3);return '일정 확인하러 왔다면서도 그는 한참 자리를 지켰다.'}]]},
 {id:'member-solo-offer',place:'practice',title:'솔로 제안',text:'기타리스트가 유명 세션팀에서 함께하자는 제안을 받았다고 털어놓았다.',condition:()=>state.band.formed,choices:[['진심으로 응원한다',()=>{state.band.bond=clamp(state.band.bond+12);return '멤버는 제안을 거절하고 밴드에 남겠다고 했다.'}],['팀을 먼저 생각하라고 한다',()=>{state.band.bond=clamp(state.band.bond-18);return '연습실 분위기가 싸늘해졌다.'}]]},
 {id:'late-member',place:'practice',title:'지각한 드러머',text:'드러머가 두 시간 늦게 도착했다. 아무 설명도 하지 않은 채 드럼 앞에 앉았다.',condition:()=>state.band.members.drums,choices:[['이유를 묻는다',()=>{state.band.bond=clamp(state.band.bond+5);return '가족 문제로 정신이 없었다는 사실을 알게 됐다.'}],['그냥 연습을 시작한다',()=>{state.band.bond=clamp(state.band.bond-6);return '합주는 끝났지만 서로의 마음은 멀어졌다.'}]]},
 {id:'broken-mic',place:'practice',condition:()=>state.equipment.mic,title:'마이크 파손',text:'연습 도중 마이크가 바닥에 떨어졌다. 누가 건드렸는지는 아무도 보지 못했다.',choices:[['공동 비용으로 수리한다',()=>{stat('money',-50000);if(state.band.formed)state.band.bond=clamp(state.band.bond+5);return '누구의 잘못인지 따지지 않자 분위기가 누그러졌다.'}],['범인을 찾는다',()=>{stat('stress',8);if(state.band.formed)state.band.bond=clamp(state.band.bond-8);return '마이크보다 더 큰 균열이 생겼다.'}]]},
 {id:'rival',place:'stage',condition:()=>state.lastAction==='audition'&&state.stats.vocal>=40&&state.stats.fame>=30,title:'라이벌의 도발',text:'오디션 대기실에서 유명 연습생이 장발과 안경을 훑어보며 콘셉트가 과하다고 비웃었다.',choices:[['무시한다',()=>{gainSkill('vocal',2,'event');return '무대에서 증명하는 편이 더 빠르다.'}],['차분하게 받아친다',()=>{stat('looks',2);stat('fame',5);return '주변 참가자들이 웃음을 터뜨렸다.'}]]},
 {id:'lyric-forgot',place:'stage',title:'사라진 가사',text:'생방송 도중 갑자기 다음 가사가 떠오르지 않았다.',condition:()=>state.lastAction==='broadcast'&&state.milestones.firstBroadcast,choices:[['즉흥으로 이어간다',()=>{const ok=state.stats.compose+Math.random()*40>45;if(ok){stat('fame',35);stat('fans',120);return '즉흥 가사는 오히려 전설적인 장면이 됐다.'}stat('fans',-80);stat('fame',-8);stat('stress',12);return '방송 사고 장면이 확산되며 일부 팬이 실망했다.'}],['관객에게 마이크를 넘긴다',()=>{stat('fans',60);return '관객의 합창이 빈 가사를 채웠다.'}]]},
 {id:'fan-gift',place:'stage',title:'너무 비싼 선물',text:'팬이 고가의 시계를 선물로 보냈다. 편지에는 답장을 꼭 달라는 말이 적혀 있다.',condition:()=>['concert','fanmeeting'].includes(state.lastAction)&&state.stats.fans>=1000,choices:[['정중히 돌려보낸다',()=>{stat('fame',12);stat('fans',10);return '원칙 있는 대응이라는 평가를 받았다.'}],['감사히 받는다',()=>{stat('money',300000);stat('fans',-40);stat('fame',-5);stat('stress',8);return '선물을 받은 사실이 알려져 특혜 논란이 생기고 일부 팬이 떠났다.'}]]},
 {id:'hurabono-sick',place:'stage',title:'후라보노의 과로',text:'공연 직전 후라보노가 계단에서 휘청거렸다. 며칠째 제대로 잠을 자지 못한 얼굴이다.',condition:()=>state.lastAction==='concert'&&state.manager.hired&&state.milestones.firstConcert,choices:[['공연을 미루고 병원에 간다',()=>{state.manager.bond=clamp(state.manager.bond+18);stat('money',-150000);return '공연은 손해를 봤지만 후라보노는 오래도록 그 선택을 기억했다.'}],['스태프에게 맡긴다',()=>{state.manager.bond=clamp(state.manager.bond-12);stat('fame',10);return '공연은 예정대로 진행됐지만 후라보노와의 거리가 멀어졌다.'}]]},
 {id:'fan-letter',place:'home',title:'한 통의 긴 편지',text:'노래 덕분에 힘든 시기를 버텼다는 팬의 편지가 도착했다.',condition:()=>state.stats.fans>=300,choices:[['직접 답장을 쓴다',()=>{stat('fans',20);stat('stress',-10);return '답장을 쓰며 내가 노래하는 이유를 다시 생각했다.'}],['새 노래로 답한다',()=>{gainSkill('compose',3,'event');return '편지를 책상 위에 두고 곡을 쓰기 시작했다.'}]]},
 {id:'band-dinner',place:'store',title:'편의점 회식',text:'돈이 부족한 밴드는 편의점 테이블에 둘러앉아 컵라면으로 첫 회식을 열었다.',condition:()=>state.band.formed,choices:[['내가 계산한다',()=>{stat('money',-25000);state.band.bond=clamp(state.band.bond+14);return '값싼 식사였지만 누구도 먼저 자리를 뜨지 않았다.'}],['각자 계산한다',()=>{state.band.bond=clamp(state.band.bond+4);return '소박하지만 편안한 밤이었다.'}]]},
 {id:'wedding-song',place:'practice',title:'후라보노의 축가 부탁',text:'후라보노가 결혼식 축가로 어떤 노래가 좋을지 조심스럽게 물었다. 평소 계약 이야기만 하던 얼굴이 오늘따라 유난히 어색해 보였다.',condition:()=>state.manager.wedding,choices:[['새 곡을 써준다',()=>{gainSkill('compose',5,'event');state.manager.bond=clamp(state.manager.bond+15);return '류현상은 며칠 동안 잠을 줄여 축가를 완성했다. 후라보노는 첫 소절을 듣고 웃으려다 눈시울을 붉혔다. “형, 결혼식에서 저 울면 책임지세요.”'}],['대표곡을 부른다',()=>{state.manager.bond=clamp(state.manager.bond+8);return '후라보노는 고개를 끄덕였다. “형 노래면 뭐든 좋아요. 단, 결혼식에서 애드리브 5분은 안 됩니다.”'}]]},
 {id:'p-string',place:'practice',title:'P군의 기타 줄 장례식',text:'P군이 끊어진 기타 줄을 휴지 위에 가지런히 올려두고 있었다. R군이 왜 버리지 않느냐고 묻자 P군은 “세 번의 공연을 함께한 줄”이라고 진지하게 답했다.',condition:()=>!!state.band.members.guitar,choices:[['조용히 묵념한다',()=>{state.band.bond=clamp(state.band.bond+7);return '밴드 전원이 10초 동안 침묵했다. L군은 마지막에 “새 줄 필요함”이라고 말했다. 감동은 짧고 현실은 정확했다.'}],['당장 버리라고 한다',()=>{state.band.bond=clamp(state.band.bond-4);return 'P군은 말없이 줄을 케이스 안쪽에 넣었다. 그날 기타 솔로는 평소보다 20초 길었다.'}]]},
 {id:'l-one-word',place:'practice',title:'L군의 긴 연설',text:'합주가 끝난 뒤 L군이 “할 말 있음”이라고 말했다. 모두가 긴장해 둘러앉았다. L군은 잠시 생각하더니 입을 열었다.',condition:()=>!!state.band.members.bass,choices:[['끝까지 기다린다',()=>{state.band.bond=clamp(state.band.bond+6);return 'L군은 30초 침묵한 뒤 말했다. “오늘 좋았음.” 네 글자에 멤버들은 이상할 정도로 기뻐했다.'}],['먼저 무슨 일이냐고 재촉한다',()=>{state.band.bond=clamp(state.band.bond-2);return 'L군은 “됐음”이라고 답하고 베이스를 챙겼다. 방금 전보다 대화가 더 짧아졌다.'}]]},
 {id:'j-space-remix',place:'practice',title:'J군의 우주 편곡',text:'J군이 새 편곡 파일을 재생했다. 잔잔한 발라드는 신시사이저와 효과음이 가득한 우주 탐사 음악으로 변해 있었다. 파일명은 final_진짜최종_우주버전이었다.',condition:()=>!!state.band.members.piano,choices:[['한 번 공연해 본다',()=>{gainSkill('compose',3,'event');state.band.bond=clamp(state.band.bond+5);return '관객 반응은 반으로 갈렸지만 영상 댓글은 폭발했다. “이별했는데 화성까지 간 노래”라는 댓글이 가장 많은 추천을 받았다.'}],['원래 편곡으로 돌린다',()=>{state.band.bond=clamp(state.band.bond-2);return 'J군은 아쉬워했지만 파일을 닫았다. 다만 final_진짜최종_우주버전2가 새로 생긴 것을 아무도 눈치채지 못했다.'}]]},
 {id:'r-noise',place:'practice',title:'R군과 소음 측정기',text:'연습실 관리자가 소음 측정기를 들고 찾아왔다. R군이 연주할 때마다 기계 숫자가 위험 구간까지 치솟았다. R군은 기계가 예민하다고 주장했다.',condition:()=>!!state.band.members.drums,choices:[['전자드럼을 빌린다',()=>{stat('money',-60000);state.band.bond=clamp(state.band.bond+4);return 'R군은 타격감이 부족하다며 투덜댔지만, 이웃 연습실에서 처음으로 박수가 들렸다. 아마 감사의 박수였을 것이다.'}],['R군에게 살살 치라고 한다',()=>{state.band.bond=clamp(state.band.bond-3);return 'R군은 정말 살살 쳤다. 문제는 곡 전체가 자장가처럼 변했다는 것이었다.'}]]},
 {id:'manager-hair',place:'home',title:'후라보노의 머리 관리 제안',text:'후라보노가 긴 머리를 한참 보더니 작은 빗과 헤어 오일을 내밀었다. “형, 콘셉트는 좋은데 바람 불면 얼굴이 안 보여요. 가수인지 커튼인지 구분이 안 됩니다.”',condition:()=>state.manager.hired,choices:[['관리를 맡긴다',()=>{stat('looks',3);state.manager.bond=clamp(state.manager.bond+5);return '후라보노는 능숙하게 머리를 정리했다. 류현상이 어디서 배웠냐고 묻자 그는 관리 영상 백 개를 봤다고 짧게 답했다.'}],['내버려 두라고 한다',()=>{state.manager.bond=clamp(state.manager.bond-2);return '후라보노는 오일을 책상 위에 두고 갔다. 다음 버스킹에서 바람이 불자 류현상은 조용히 그 오일을 떠올렸다.'}]]},
 {id:'wrong-delivery',place:'home',title:'잘못 배달된 마이크',text:'문 앞에 주문하지 않은 고급 마이크가 놓여 있었다. 송장에는 옆 동 이름과 비슷한 이름이 적혀 있었다. 지금 장비보다 몇 배는 비싸 보였다.',choices:[['바로 돌려준다',()=>{stat('fame',5);stat('stress',-3);return '주인은 근처 녹음실 엔지니어였다. 그는 고마움의 표시로 다음 녹음 때 한 번 도와주겠다고 약속했다.'}],['하루만 테스트한다',()=>{gainSkill('vocal',2,'event');stat('stress',7);return '소리는 놀라울 만큼 좋았다. 그러나 초인종이 울릴 때마다 심장이 더 크게 뛰었다. 결국 밤이 되기 전에 돌려줬다.'}]]},
 {id:'store-lottery',place:'store',title:'당첨 복권의 주인',text:'손님이 버리고 간 영수증 사이에서 당첨된 즉석복권이 발견됐다. 금액은 크지 않았지만 현재 생활비에는 충분히 의미가 있었다.',choices:[['CCTV로 손님을 찾는다',()=>{stat('fame',7);return '며칠 뒤 주인이 다시 찾아왔다. 그는 감사하다며 버스킹 공연을 회사 단체 채팅방에 공유했다.'}],['매장 분실물로 보관한다',()=>{stat('stress',-2);return '복권은 분실물 봉투 안에 들어갔다. 류현상은 계산대 아래에서 복권보다 자신의 통장 잔고를 더 오래 바라봤다.'}]]},
 {id:'store-idol-fan',place:'store',title:'다른 가수의 열성 팬',text:'한 손님이 계산대 앞에서 유명 아이돌의 장점을 15분 동안 설명했다. 마지막에는 류현상에게도 그 가수처럼 머리를 자르면 어떻겠냐고 조언했다.',choices:[['끝까지 친절하게 듣는다',()=>{stat('stress',4);stat('fans',5);return '손님은 친절한 직원이라며 매장 후기에 별 다섯 개를 남겼다. 류현상 이야기는 한 줄도 없었다.'}],['나는 가수라고 말한다',()=>{stat('fame',5);return '손님은 놀라 휴대전화로 검색했다. 조회수 23회의 영상이 화면에 떴고, 두 사람은 잠시 말이 없어졌다.'}]]},
 {id:'park-magician',place:'park',condition:()=>['busking','bandBusking'].includes(state.lastAction)&&state.equipment.mic&&state.equipment.amp,title:'마술사와 자리 경쟁',text:'늘 공연하던 자리에 거리 마술사가 먼저 장비를 펼쳐 놓았다. 그는 비둘기 두 마리와 큰 상자를 데려왔다. 류현상의 앰프보다 훨씬 눈에 띄었다.',choices:[['합동 공연을 제안한다',()=>{stat('fans',35);stat('fame',8);return '류현상이 노래하는 동안 마술사는 카드와 비둘기를 날렸다. 무슨 공연인지는 설명하기 어려웠지만 관객은 많이 모였다.'}],['다른 자리로 이동한다',()=>{stat('stress',-2);return '조용한 나무 아래에서 노래했다. 관객은 적었지만 마지막까지 듣는 사람은 더 오래 머물렀다.'}]]},
 {id:'park-grandma',place:'park',condition:()=>['busking','bandBusking'].includes(state.lastAction)&&state.equipment.mic&&state.equipment.amp,title:'할머니의 평가',text:'노래가 끝나자 산책하던 할머니가 다가왔다. “얼굴은 잘생겼는데 노래가 너무 슬퍼. 젊은 사람이 왜 맨날 헤어져?” 매우 정확한 질문이었다.',choices:[['밝은 노래를 즉석에서 부른다',()=>{gainSkill('compose',2,'event');stat('fans',15);return '류현상은 급하게 밝은 코드를 만들었다. 가사는 여전히 조금 슬펐지만 할머니는 박수를 쳤다.'}],['원래 감성이라고 설명한다',()=>{stat('looks',1);return '할머니는 고개를 저으며 귤 두 개를 건넸다. “그래도 밥은 먹고 다녀.” 오늘의 출연료였다.'}]]},
 {id:'stage-makeup',place:'stage',condition:()=>['audition','concert','broadcast'].includes(state.lastAction)&&state.manager.hired&&state.stats.fame>=150,title:'처음 받는 무대 화장',text:'메이크업 아티스트가 류현상의 얼굴을 가까이 들여다보며 말했다. “피부는 좋은데 표정이 너무 어두워요.” 후라보노가 옆에서 “원래 저 표정입니다”라고 설명했다.',choices:[['웃는 연습을 한다',()=>{stat('looks',2);return '거울 앞에서 여러 번 웃어 봤지만 대부분 수상해 보였다. 마지막에 아주 조금 올라간 입꼬리만 남기기로 했다.'}],['평소 표정대로 간다',()=>{stat('fame',5);return '방송 후 팬들은 무표정이 콘셉트라며 좋아했다. 류현상은 콘셉트가 아니라는 말을 굳이 하지 않았다.'}]]},
 {id:'stage-name',place:'stage',condition:()=>['audition','concert','broadcast'].includes(state.lastAction)&&state.manager.hired&&state.stats.fame>=200,title:'예명 제안',text:'방송 작가가 류현상이라는 이름이 조금 무겁다며 짧은 예명을 제안했다. 후보는 “류”, “현”, 그리고 “블랙롱”이었다. 마지막 후보를 누가 적었는지는 모두 모른 척했다.',choices:[['본명을 지킨다',()=>{stat('fame',8);return '류현상은 이름을 바꾸지 않겠다고 말했다. 후라보노는 고개를 끄덕이며 블랙롱이라고 적힌 종이를 조용히 찢었다.'}],['류로 활동해 본다',()=>{stat('looks',2);stat('fame',4);return '하루 동안 류라고 불렸지만 스태프 절반이 누굴 부르는지 몰랐다. 다음 날 다시 류현상으로 돌아왔다.'}]]},
 {id:'band-group-photo',place:'stage',title:'밴드 단체 사진',text:'공연 후 단체 사진을 찍으려는데 누구도 자연스럽게 포즈를 취하지 못했다. P군은 기타만 보고, L군은 카메라를 피하고, J군은 손가락 하트를 만들었고, R군은 점프하려 했다.',condition:()=>state.lastAction==='concert'&&state.band.formed&&state.milestones.firstConcert,choices:[['각자 하고 싶은 대로 찍는다',()=>{state.band.bond=clamp(state.band.bond+8);stat('fans',30);return '사진은 통일감이 전혀 없었지만 이상하게 밴드의 성격이 그대로 담겼다. 팬들은 역대 최고의 단체 사진이라고 불렀다.'}],['정돈된 포즈를 시킨다',()=>{stat('looks',2);return '깔끔한 사진이 완성됐다. 다만 촬영이 끝나자 R군이 혼자 점프한 사진을 따로 올렸고 그 사진이 더 많이 공유됐다.'}]]},
 {id:'manager-first-pay',place:'home',title:'첫 정산표',text:'후라보노가 두꺼운 파일을 책상 위에 내려놓았다. 공연 수익보다 교통비와 장비비가 더 길게 적혀 있었다. “형, 매출과 수익은 다른 말입니다. 오늘부터는 제가 둘을 구분해서 보여드릴게요.”',condition:()=>state.manager.hired&&state.manager.bond<40,choices:[['차근차근 설명을 듣는다',()=>{state.manager.bond=clamp(state.manager.bond+8);stat('stress',-3);return '류현상은 숫자를 피하지 않고 끝까지 들었다. 후라보노는 마지막 장을 덮으며 말했다. “좋아요. 망하지 않는 가수의 첫 수업이었습니다.”'}],['음악만 알면 된다고 한다',()=>{state.manager.bond=clamp(state.manager.bond-5);return '후라보노는 한동안 말이 없었다. 그러다 정산표 첫 장에 굵은 글씨로 적었다. “그래서 지난번에 망함.” 류현상은 반박하지 못했다.'}]]},
 {id:'manager-midnight-call',place:'home',title:'새벽 두 시의 전화',text:'새벽 두 시, 후라보노에게 전화가 왔다. 급한 공연 연락인 줄 알았지만 그는 한참 침묵하다가 말했다. “형, 오늘 무대 좋았어요. 그 말 안 하면 잠이 안 올 것 같아서요.”',condition:()=>state.manager.hired&&state.manager.bond>=35&&state.time===3,choices:[['고맙다고 솔직히 말한다',()=>{state.manager.bond=clamp(state.manager.bond+10);stat('stress',-6);return '전화기 너머가 잠시 조용해졌다. 후라보노는 헛기침한 뒤 “이런 말 자주 하시면 제가 적응 못 합니다”라고 말했다.'}],['내일 말해도 됐다고 한다',()=>{state.manager.bond=clamp(state.manager.bond+2);return '후라보노는 역시 형답다며 전화를 끊었다. 다음 날 일정표 맨 아래에는 작은 글씨로 “칭찬 유효기간: 당일”이라고 적혀 있었다.'}]]},
 {id:'manager-old-office',place:'practice',title:'사라진 기획사 앞에서',text:'연습실로 가던 길, 두 사람은 우연히 류현상이 예전에 운영하던 기획사 건물 앞을 지나게 됐다. 간판은 바뀌었고 창문 안에는 전혀 다른 회사가 들어와 있었다.',condition:()=>state.manager.hired&&state.manager.bond>=55,choices:[['그때 이야기를 들려준다',()=>{state.manager.bond=clamp(state.manager.bond+12);stat('stress',-8);return '류현상은 폐업 날까지 혼자 숨겨 두었던 이야기를 처음으로 꺼냈다. 후라보노는 조언하지 않고 끝까지 들었다. “이번에는 형 혼자 문 닫게 두지 않을게요.”'}],['그냥 지나간다',()=>{state.manager.bond=clamp(state.manager.bond+3);return '후라보노는 아무것도 묻지 않고 보폭을 맞췄다. 건물이 보이지 않을 때쯤 그는 일부러 다음 공연의 우스운 실수담을 꺼냈다.'}]]},
 {id:'manager-day-off',place:'park',title:'강제 휴무일',text:'후라보노가 버스킹 장비 가방을 빼앗아 벤치 아래에 내려놓았다. “오늘은 공연 금지입니다. 형은 쉬는 법을 잊었고, 저는 그걸 다시 가르칠 책임이 있어요.”',condition:()=>['busking','bandBusking'].includes(state.lastAction)&&state.manager.hired&&state.stats.stress>=65,choices:[['한 시간만 쉰다',()=>{state.manager.bond=clamp(state.manager.bond+8);stat('stress',-20);stat('hp',15);return '두 사람은 말없이 편의점 음료를 마셨다. 류현상이 슬쩍 장비 가방을 보자 후라보노가 발로 가방을 더 멀리 밀었다.'}],['몰래 한 곡만 부른다',()=>{state.manager.bond=clamp(state.manager.bond-7);stat('stress',-4);stat('hp',-8);return '첫 소절이 끝나기도 전에 후라보노가 전원을 껐다. “형, 매니저를 고용했으면 가끔은 매니저 말을 들으세요.” 관객 두 명이 웃으며 박수를 쳤다.'}]]},
 {id:'fan-sign-mistake',place:'stage',title:'팬 사인회 이름 실수',text:'팬의 이름을 여러 번 잘못 부른 장면이 짧은 영상으로 퍼졌다.',condition:()=>['fanmeeting','concert'].includes(state.lastAction)&&state.stats.fans>=1500,choices:[['즉시 공개 사과한다',()=>{stat('fans',-scaledFanLoss(.012,15,60));stat('stress',5);return '빠르게 사과해 논란은 줄었지만 일부 팬은 서운함을 감추지 못했다.'}],['별일 아니라고 넘긴다',()=>{stat('fans',-scaledFanLoss(.05,60,240));stat('fame',-10);stat('stress',8);return '무성의한 대응이라는 평가가 퍼지며 팬덤이 눈에 띄게 줄었다.'}]]},
 {id:'setlist-repeat',place:'stage',title:'반복되는 공연 세트리스트',text:'최근 공연의 곡 순서가 거의 똑같다는 불만이 팬 커뮤니티에 쌓였다.',condition:()=>state.lastAction==='concert'&&state.career.totalConcerts>=3&&state.stats.fans>=1000,choices:[['다음 공연을 새로 준비한다',()=>{gainSkill('compose',1,'event');stat('fans',-scaledFanLoss(.01,10,50));return '불만을 인정하고 새 무대를 약속해 이탈을 최소화했다.'}],['대표곡이면 충분하다고 한다',()=>{stat('fans',-scaledFanLoss(.04,40,180));stat('fame',-6);return '변화를 원하던 팬들이 조용히 떠났다.'}]]},
 {id:'manager-wedding-invite',place:'home',title:'후라보노의 청첩장',text:'후라보노가 청첩장을 건넸다. 류현상이 한참 말없이 읽자 후라보노가 불안한 얼굴로 물었다. “형, 날짜에 공연 잡혀 있어요?”',condition:()=>state.manager.wedding,choices:[['무조건 참석한다고 한다',()=>{state.manager.bond=clamp(state.manager.bond+12);return '후라보노는 안도하며 웃었다. “형이 늦으면 신랑 대기실에서 직접 전화할 겁니다.”'}],['스케줄부터 확인한다',()=>{state.manager.bond=clamp(state.manager.bond-4);return '후라보노는 이해한다고 했지만 청첩장 모서리를 괜히 여러 번 만졌다. 류현상은 결국 그날 밤 일정을 비웠다.'}]]}
];

const prologueScenes=[
 {chapter:'PROLOGUE 01',title:'스물여섯, 너무 이른 대표님',speaker:'내레이션',text:`류현상은 스물여섯 살에 작은 기획사를 차렸다.\n\n사무실이라고 부르기에는 민망한 반지하 방 하나, 중고 책상 두 개, 녹음할 때마다 잡음이 섞이는 낡은 오디오 인터페이스가 전부였다. 계약된 가수도 없었고, 직원이라고 해 봐야 현상 자신과 가끔 포스터를 도와주는 친구 한 명뿐이었다.\n\n하지만 현상은 진심으로 믿었다. 좋은 노래를 만들고, 무대를 마련하고, 끝까지 버티기만 하면 언젠가 누군가 자신들의 음악을 알아봐 줄 거라고.`},
 {chapter:'PROLOGUE 02',title:'대표이자 가수, 청소 담당자',speaker:'류현상',text:`“대표라는 사람이 바닥 청소하고, 홈페이지 고치고, 가이드 보컬까지 다 하는 게 맞나.”\n\n현상은 투덜거리면서도 매일 가장 먼저 사무실 문을 열었다. 낮에는 공연장을 찾아다니며 명함을 돌렸고, 저녁에는 곡을 썼다. 새벽에는 연습생을 구한다는 게시글을 올리고, 아무도 보지 않는 회사 SNS에 공연 영상을 편집해 올렸다.\n\n통장 잔액은 빠르게 줄었지만, 이상하게도 그때의 현상은 행복했다. 실패할 가능성보다 아직 시작하지 않은 일들이 더 많았기 때문이다.`},
 {chapter:'PROLOGUE 03',title:'예고 없이 닫힌 무대',speaker:'내레이션',text:`그러던 어느 날, 뉴스에서 처음 보는 바이러스 이야기가 흘러나왔다. 며칠이면 지나갈 거라는 말도 있었고, 공연 몇 개쯤 취소되는 정도일 거라는 낙관도 있었다.\n\n하지만 취소 문자는 하루에 하나씩, 곧 열 개씩 쌓였다. 잡아 두었던 소극장 공연이 사라졌고, 준비 중이던 쇼케이스도 무기한 연기됐다. 만날 수 있는 관객이 없으니 수익도 없었다.\n\n사무실 월세와 장비 할부금, 이미 지불한 공연 대관료는 그대로 남았다. 음악을 하려고 빌린 돈은 음악을 하지 못하는 동안에도 정확한 날짜에 빠져나갔다.`},
 {chapter:'PROLOGUE 04',title:'폭삭 망했다는 말',speaker:'류현상',text:`“조금만 더 버티면 돼.”\n\n현상은 몇 달 동안 같은 말을 반복했다. 장비를 하나씩 팔았고, 새벽 배송과 창고 정리 일을 하며 월세를 냈다. 마지막에는 회사 이름이 적힌 작은 간판마저 직접 떼어 냈다.\n\n친구들은 조심스럽게 “잠시 쉬어도 된다”고 말했다. 가족은 돌아오라고 했다. 그러나 현상에게 그 말들은 모두 “네가 실패했다”는 뜻처럼 들렸다.\n\n결국 기획사는 폐업했다. 남은 것은 빚과 폐업 신고서, 그리고 어디에도 발표하지 못한 노래 파일 수십 개였다.`},
 {chapter:'PROLOGUE 05',title:'군대로 도피하다',speaker:'내레이션',text:`현상은 입대를 선택했다. 늦은 나이에 군대로 가는 것이 새 출발이라고 생각해서가 아니었다. 더 솔직히 말하면 도피였다.\n\n정해진 시간에 일어나고, 정해진 옷을 입고, 정해진 일을 하면 되는 곳. 누구도 그에게 회사가 왜 망했는지 묻지 않는 곳. 음악을 하지 않아도 이상하지 않은 곳.\n\n입대 전날 그는 결국 규정에 맞게 긴 머리를 잘랐다. 미용실 바닥에 떨어진 머리카락을 바라보며, 회사 간판에 이어 자신을 설명하던 마지막 흔적까지 사라지는 기분을 느꼈다. 그래도 음악을 좋아했던 기억만큼은 억지로 잘라낼 수 없었다.`},
 {chapter:'PROLOGUE 06',title:'노래하지 않는 시간',speaker:'류현상',text:`군 생활 동안 현상은 한동안 노래하지 않았다. 누군가 노래를 부탁하면 목이 안 좋다고 둘러댔다. 음악 이야기가 나오면 모르는 척했다.\n\n그러나 불침번을 서던 어느 겨울밤, 멀리서 누군가 작게 흥얼거리는 소리가 들렸다. 아주 평범한 노래였는데도 현상은 한참 동안 그 자리에 서 있었다.\n\n음악을 그만둔 것이 아니라, 실패한 기억 때문에 음악을 쳐다보지 못하고 있었다는 사실을 그날 처음 인정했다.`},
 {chapter:'PROLOGUE 07',title:'전역일',speaker:'내레이션',text:`전역하는 날, 현상의 손에는 작은 가방 하나와 군 생활 동안 모은 돈이 전부였다. 기다리는 기획사도, 복귀를 알릴 팬도, 연락해 올 방송국도 없었다.\n\n친구들은 취업 준비를 권했고, 가족은 안정적인 일을 찾으라고 말했다. 모두 틀린 말은 아니었다. 현상 역시 다시 실패할 자신은 없었다.\n\n하지만 음악을 완전히 포기한 채 사는 자신을 상상하면, 실패했을 때보다 더 숨이 막혔다.`},
 {chapter:'PROLOGUE 08',title:'다시, 거리에서',speaker:'류현상',text:`“회사를 다시 만들 돈은 없다. 앨범을 낼 돈도 없다. 무대를 빌릴 돈은 더더욱 없다.”\n\n현상은 통장 잔액을 확인한 뒤 오랫동안 휴대전화를 내려다봤다. 그러다 중고 거래 목록에 올라온 낡은 마이크를 발견했다. 흠집이 많았고 설명에는 ‘가끔 잡음 있음’이라고 적혀 있었다.\n\n그는 헛웃음을 지었다. 예전 같았으면 쳐다보지도 않았을 장비였다. 이제는 그것조차 바로 살 수 없었다.\n\n그래도 거리라면 대관료가 들지 않았다. 관객이 한 명도 없더라도 쫓겨나지만 않으면 노래할 수 있었다.`},
 {chapter:'PROLOGUE 09',title:'첫 번째 목표',speaker:'류현상',text:`현상은 오래된 검은 와이셔츠를 꺼내 입었다. 안경을 닦고, 허리까지 내려온 머리를 정리했다. 거울 속 남자는 예전보다 지쳐 보였지만 완전히 낯선 사람은 아니었다.\n\n“유명해지겠다는 말은 아직 하지 말자.”\n“오늘은 단 한 명만 멈춰 세우자.”\n\n거창한 회사도, 화려한 데뷔 계획도 없었다. 이번에는 가장 작은 곳에서 시작하기로 했다. 노래 한 곡, 마이크 하나, 그리고 자신을 모르는 사람들 앞에서.`},
 {chapter:'PROLOGUE 10',title:'류현상 키우기',speaker:'내레이션',text:`26세에 세운 기획사는 코로나 이후 무너졌다. 군대로 도피한 시간은 실패를 지워 주지 못했지만, 다시 시작할 용기를 조금 남겨 주었다.\n\n이제 류현상은 무명가수다. 돈도, 팬도, 제대로 된 장비도 없다. 앞으로 만날 사람들은 그를 돕기도 하고 떠나기도 할 것이다. 밴드는 결성될 수도, 갈등 끝에 해체될 수도 있다. 동생 매니저 후라보노는 언젠가 그의 옆에 서게 될 것이다.\n\n거리에서 시작한 노래가 어디까지 닿을지는 아직 아무도 모른다.\n\n다만 이번에는 도망치지 않는다. 노래가 끝날 때까지, 류현상은 무대에 남아 있을 것이다.`}
];
let prologueIndex=0;
function renderPrologue(){
 const scene=prologueScenes[prologueIndex];
 const modal=$('#modal');
 modal.classList.add('prologue-modal');
 $('#modalTitle').textContent=scene.chapter;
 $('#modalBody').innerHTML=`<article class="prologue-card"><p class="prologue-kicker">${scene.title}</p><h3>${scene.speaker}</h3><div class="prologue-text">${scene.text.split('\n').map(line=>line?`<p>${line}</p>`:'<div class="prologue-gap"></div>').join('')}</div><div class="prologue-progress"><span style="width:${((prologueIndex+1)/prologueScenes.length)*100}%"></span></div><div class="prologue-actions"><button id="prologueBack" ${prologueIndex===0?'disabled':''}>이전</button><button id="prologueSkip">프롤로그 건너뛰기</button><button id="prologueNext" class="primary">${prologueIndex===prologueScenes.length-1?'버스킹을 시작한다':'다음'}</button></div></article>`;
 if(!modal.open)modal.showModal();
 $('#prologueBack').onclick=()=>{if(prologueIndex>0){prologueIndex--;renderPrologue()}};
 $('#prologueSkip').onclick=beginGameAfterPrologue;
 $('#prologueNext').onclick=()=>{if(prologueIndex<prologueScenes.length-1){prologueIndex++;renderPrologue()}else beginGameAfterPrologue()};
}
function startPrologue(){prologueIndex=0;renderPrologue()}
function beginGameAfterPrologue(){
 const modal=$('#modal');
 modal.classList.remove('prologue-modal');
 if(modal.open)modal.close();
 state.prologueSeen=true;
 state.dialogue={name:'류현상',text:'유명해지겠다는 말은 아직 하지 말자. 오늘은 단 한 명만 멈춰 세우면 된다.'};
 addHistory('🎬 프롤로그 · 기획사 폐업과 군 복무를 지나 다시 버스킹을 시작했다.','prologue');
 save(false);
 $('#titleScreen').classList.remove('active');
 $('#gameScreen').classList.add('active');
 render();
}

function deepMerge(base,saved){if(Array.isArray(base))return Array.isArray(saved)?saved:structuredClone(base);if(base&&typeof base==='object'){const out=structuredClone(base);if(saved&&typeof saved==='object')for(const k of Object.keys(saved))out[k]=k in base?deepMerge(base[k],saved[k]):saved[k];return out}return saved===undefined?base:saved}
function getStorage(){try{const key='__ryu_test__';localStorage.setItem(key,'1');localStorage.removeItem(key);return localStorage}catch(err){console.warn('브라우저 저장소를 사용할 수 없습니다.',err);return null}}
function migrateEndingName(name){return name==='가수 엔딩'?'월드 스타 엔딩':name}
function loadMetaEndings(){const storage=getStorage();if(!storage)return [];try{const raw=JSON.parse(storage.getItem('ryuGameMeta')||'{}');return Array.isArray(raw.endings)?[...new Set(raw.endings.map(migrateEndingName))]:[]}catch{return []}}
function saveMetaEndings(endings){const storage=getStorage();if(!storage)return;try{storage.setItem('ryuGameMeta',JSON.stringify({endings:[...new Set(endings.map(migrateEndingName))]}))}catch(err){console.warn('엔딩 컬렉션 저장 실패',err)}}
function syncEndingCollection(){state.endings=[...new Set([...(state.endings||[]),...loadMetaEndings()])];saveMetaEndings(state.endings)}
function normalizeState(){
 delete state.stats.stamina;
 state.stats.fame=Math.max(0,Math.min(10000,Number(state.stats.fame)||0));
 state.housing=Math.max(0,Math.min(4,Number(state.housing)||0));
 state.weather=['sun','rain','snow'].includes(state.weather)?state.weather:'sun';
 state.equipment={mic:!!state.equipment?.mic,amp:!!state.equipment?.amp,battery:!!state.equipment?.battery};
 state.equipmentDamage={mic:!!state.equipmentDamage?.mic,amp:!!state.equipmentDamage?.amp};
 state.instruments={acousticGuitar:!!state.instruments?.acousticGuitar,keyboard:!!state.instruments?.keyboard,audioInterface:!!state.instruments?.audioInterface,studioMic:!!state.instruments?.studioMic,monitorHeadphones:!!state.instruments?.monitorHeadphones};
 state.equippedInstruments=(Array.isArray(state.equippedInstruments)?state.equippedInstruments:[]).filter(k=>state.instruments[k]).slice(0,3);
 state.items={bakcas:Math.max(0,Number(state.items?.bakcas)||0),bakcasUsedToday:Math.max(0,Number(state.items?.bakcasUsedToday)||0),mealsToday:Math.max(0,Number(state.items?.mealsToday)||0)};
 state.economy={workStreak:Math.max(0,Number(state.economy?.workStreak)||0),lastWorkDay:Number(state.economy?.lastWorkDay??-99),debt:Math.max(0,Number(state.economy?.debt)||0),totalDebtRepaid:Math.max(0,Number(state.economy?.totalDebtRepaid)||0),lastDebtNoticeDay:Number(state.economy?.lastDebtNoticeDay??-99)};
 state.career={peakFame:Math.max(Number(state.career?.peakFame)||0,Number(state.stats.fame)||0),totalWork:Math.max(0,Number(state.career?.totalWork)||0),totalConcerts:Math.max(0,Number(state.career?.totalConcerts)||0),totalBroadcasts:Math.max(0,Number(state.career?.totalBroadcasts)||0),totalBusking:Math.max(0,Number(state.career?.totalBusking)||0)};
 const fg=state.fanGroups||{};state.fanGroups={regular:Math.max(0,Number(fg.regular)||0),enthusiast:Math.max(0,Number(fg.enthusiast)||0),gay:Math.max(0,Number(fg.gay)||0),overseas:Math.max(0,Number(fg.overseas)||0)};
 let grouped=Object.values(state.fanGroups).reduce((a,b)=>a+b,0);if(grouped===0&&state.stats.fans>0){state.fanGroups.regular=state.stats.fans;grouped=state.stats.fans}if(grouped>state.stats.fans&&grouped>0){const r=state.stats.fans/grouped;for(const k of Object.keys(state.fanGroups))state.fanGroups[k]=Math.floor(state.fanGroups[k]*r)}
 state.sns={lastPostDay:Number(state.sns?.lastPostDay??-99),totalPosts:Math.max(0,Number(state.sns?.totalPosts)||0),controversy:Math.max(0,Number(state.sns?.controversy)||0),lastEventDay:Number(state.sns?.lastEventDay??-99)};
 state.rival={met:!!state.rival?.met,stage:Math.max(0,Math.min(5,Number(state.rival?.stage)||0)),respect:Number(state.rival?.respect)||0,lastEventDay:Number(state.rival?.lastEventDay??-99)};
 state.band.members={guitar:state.band.members?.guitar||null,bass:state.band.members?.bass||null,piano:state.band.members?.piano||null,drums:state.band.members?.drums||null};
 state.band.formed=Object.values(state.band.members).every(Boolean);
 if(!state.endingPrompted)state.endingPrompted={};
 if(state.pendingEnding===undefined)state.pendingEnding=null;
 state.outfit=Math.max(0,Math.min(6,Number(state.outfit)||0));
 state.ownedOutfits=[...new Set([0,...((Array.isArray(state.ownedOutfits)?state.ownedOutfits:[]).map(Number).filter(x=>x>=0&&x<=6))])];
 if(!state.ownedOutfits.includes(state.outfit))state.outfit=0;
 state.performanceCount=Math.max(0,Number(state.performanceCount)||0);
 state.stalker={active:!!state.stalker?.active,resolved:!!state.stalker?.resolved,encounters:Math.max(0,Number(state.stalker?.encounters)||0),safety:Number(state.stalker?.safety)||0};
 state.arrogance={lastDay:Number(state.arrogance?.lastDay??-99),count:Math.max(0,Number(state.arrogance?.count)||0),lesson:Number(state.arrogance?.lesson)||0};
 const defaultCooldowns={managerTalk:-99,recruit:-99,audition:-99,concert:-99,broadcast:-99,fanmeeting:-99,album:-99,fanEvent:-99,snsPost:-99};
 state.cooldowns={...defaultCooldowns,...(state.cooldowns||{})};
 const defaultMilestones={firstAudition:false,firstConcert:false,firstBroadcast:false,firstFanmeeting:false,firstAlbum:false,managerHired:false,bandFormed:false,stalkerResolved:false,randomSeen:[]};
 state.milestones={...defaultMilestones,...(state.milestones||{})};
 state.milestones.randomSeen=Array.isArray(state.milestones.randomSeen)?state.milestones.randomSeen:[];
 state.historyKeys=Array.isArray(state.historyKeys)?state.historyKeys:[];
 state.lastAction=typeof state.lastAction==='string'?state.lastAction:null;
 state.history=(Array.isArray(state.history)?state.history:[]).filter(x=>!/(자취방|편의점|연습실|공원|공연장)으로 이동$/.test(x));
 state.endings=[...new Set((state.endings||[]).map(migrateEndingName))];
 if(state.pendingEnding?.name==='가수 엔딩')state.pendingEnding.name='월드 스타 엔딩';
 if(state.endingPrompted['가수 엔딩']){state.endingPrompted['월드 스타 엔딩']=true;delete state.endingPrompted['가수 엔딩'];}if(state.endingPrompted.year){state.endingPrompted['year:1']=true;delete state.endingPrompted.year;}
 state.specialEvents={iziViral:!!state.specialEvents?.iziViral,waitedMoreViral:!!state.specialEvents?.waitedMoreViral,day30Hair:!!state.specialEvents?.day30Hair,day60Workout:!!state.specialEvents?.day60Workout,day90Live:!!state.specialEvents?.day90Live,day120Chat:!!state.specialEvents?.day120Chat,day150Birthday:!!state.specialEvents?.day150Birthday,day180Archive:!!state.specialEvents?.day180Archive,day210Demo:!!state.specialEvents?.day210Demo,day240Meme:!!state.specialEvents?.day240Meme,day300Promise:!!state.specialEvents?.day300Promise,hiddenGameOst:!!state.specialEvents?.hiddenGameOst,hiddenRadioDj:!!state.specialEvents?.hiddenRadioDj,hiddenDingo:!!state.specialEvents?.hiddenDingo,mysteriousMerchantPurchased:!!state.specialEvents?.mysteriousMerchantPurchased};
 state.specialScene={active:false,key:null};
 const prep=state.preparation||{};state.preparation={stageReady:!!prep.stageReady,stageReadyDay:Number(prep.stageReadyDay??-99),buskingInsight:!!prep.buskingInsight,buskingInsightDay:Number(prep.buskingInsightDay??-99)};
 if(state.day-state.preparation.stageReadyDay>7)state.preparation.stageReady=false;if(state.day-state.preparation.buskingInsightDay>3)state.preparation.buskingInsight=false;
 state.level=fameLevel();
 delete state.romance;
 syncEndingCollection();
}
function load(){const storage=getStorage();if(!storage)return false;const raw=storage.getItem('ryuGame');if(raw){try{state=deepMerge(baseState,JSON.parse(raw));normalizeState();return true}catch(err){console.warn('저장 데이터 복구 실패',err)}}return false}
function save(show=true){const storage=getStorage();if(!storage){if(show)toast('이 브라우저에서는 저장 기능을 사용할 수 없습니다.');return false}try{storage.setItem('ryuGame',JSON.stringify(state));if(show){toast('게임을 저장했습니다.');playSfx('save')}return true}catch(err){console.warn('게임 저장 실패',err);if(show)toast('저장 공간이 부족하거나 차단되어 있습니다.');return false}}
function loadAudioSettings(){try{const raw=localStorage.getItem('ryuAudioSettings');if(raw)audioSettings={...audioSettings,...JSON.parse(raw)}}catch{}updateAudioButton()}
function saveAudioSettings(){try{localStorage.setItem('ryuAudioSettings',JSON.stringify(audioSettings))}catch{}updateAudioButton()}
function updateAudioButton(){const b=$('#audioBtn');if(!b)return;const on=audioSettings.bgm||audioSettings.sfx;b.textContent=on?'♪':'♩';b.classList.toggle('audio-on',on);b.classList.toggle('audio-off',!on);b.setAttribute('aria-label',on?'음악 및 효과음 켜짐':'음악 및 효과음 꺼짐')}
function ensureAudio(){if(!audioCtx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return false;audioCtx=new Ctx();audioMaster=audioCtx.createGain();bgmGain=audioCtx.createGain();sfxGain=audioCtx.createGain();audioMaster.gain.value=audioSettings.volume;bgmGain.gain.value=audioSettings.bgm ? .23 : 0;sfxGain.gain.value=audioSettings.sfx ? .5 : 0;bgmGain.connect(audioMaster);sfxGain.connect(audioMaster);audioMaster.connect(audioCtx.destination)}if(audioCtx.state==='suspended')audioCtx.resume();syncAudioGains();if(audioSettings.bgm&&!bgmTimer)startBgm();return true}
function syncAudioGains(){if(!audioCtx)return;const t=audioCtx.currentTime;audioMaster.gain.setTargetAtTime(audioSettings.volume,t,.04);bgmGain.gain.setTargetAtTime(audioSettings.bgm ? (endingMusicMode?.19:.23) : 0,t,.08);sfxGain.gain.setTargetAtTime(audioSettings.sfx ? .5 : 0,t,.04);if(audioSettings.bgm&&!bgmTimer)startBgm();if(!audioSettings.bgm&&bgmTimer){clearInterval(bgmTimer);bgmTimer=null}}
const bgmScales={home:[48,52,55,59,55,52,50,55],store:[50,53,57,60,57,53,52,57],practice:[45,52,57,60,57,52,48,55],park:[48,55,59,62,59,55,52,59],stage:[45,52,56,59,64,59,56,52]};
function midiHz(n){return 440*Math.pow(2,(n-69)/12)}
function softNote(freq,start,duration,gain=.045,type='sine',target=bgmGain){if(!audioCtx||!target)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.08);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(target);o.start(start);o.stop(start+duration+.04)}
const endingScales={
 '무명 가수 엔딩':[45,48,52,55,52,48,47,52],
 '인디 가수 엔딩':[48,52,55,59,55,52,50,55],
 '스타 가수 엔딩':[50,53,57,60,57,53,52,57],
 '월드 스타 엔딩':[48,55,60,64,60,55,52,59],
 '스토커 살해 엔딩':[45,48,52,48,45,43,45,48],
 '재기 엔딩':[45,50,52,57,52,50,48,52]
};
function scheduleBgmBar(){
 if(!audioCtx||!audioSettings.bgm)return;
 const now=audioCtx.currentTime+.08;
 if(endingMusicMode){
  const notes=endingScales[endingMusicName]||endingScales['무명 가수 엔딩'];
  for(let i=0;i<6;i++){
   const n=notes[(bgmStep+i)%notes.length];
   softNote(midiHz(n+12),now+i*1.05,.9,.019,'sine');
   if(i%2===0)softNote(midiHz(n),now+i*1.05,2.0,.012,'triangle');
  }
  const root=notes[0];softNote(midiHz(root-12),now,6.1,.009,'sine');
  bgmStep=(bgmStep+1)%notes.length;return;
 }
 const notes=bgmScales[state.location]||bgmScales.home;
 for(let i=0;i<8;i++){const n=notes[(bgmStep+i)%notes.length];softNote(midiHz(n+12),now+i*.75,.62,.027,'triangle');if(i%2===0)softNote(midiHz(n),now+i*.75,1.35,.018,'sine')}
 const root=notes[0];softNote(midiHz(root-12),now,5.8,.012,'sine');softNote(midiHz(root-5),now,5.8,.009,'sine');bgmStep=(bgmStep+2)%notes.length
}
function restartBgmScheduler(){if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null}bgmStep=0;if(audioSettings.bgm&&audioCtx){scheduleBgmBar();bgmTimer=setInterval(scheduleBgmBar,6000)}}
function enterEndingMusic(name){endingMusicMode=true;endingMusicName=name;ensureAudio();if(audioCtx&&bgmGain){const t=audioCtx.currentTime;bgmGain.gain.cancelScheduledValues(t);bgmGain.gain.setValueAtTime(bgmGain.gain.value,t);bgmGain.gain.linearRampToValueAtTime(0,t+.75);setTimeout(()=>{restartBgmScheduler();syncAudioGains()},780)}else restartBgmScheduler()}
function exitEndingMusic(){if(!endingMusicMode)return;endingMusicMode=false;endingMusicName='';if(audioCtx&&bgmGain){const t=audioCtx.currentTime;bgmGain.gain.cancelScheduledValues(t);bgmGain.gain.setValueAtTime(bgmGain.gain.value,t);bgmGain.gain.linearRampToValueAtTime(0,t+.55);setTimeout(()=>{restartBgmScheduler();syncAudioGains()},580)}else restartBgmScheduler()}

function startBgm(){if(!audioCtx||bgmTimer||!audioSettings.bgm)return;scheduleBgmBar();bgmTimer=setInterval(scheduleBgmBar,6000)}
function playSfx(type='tap'){if(!audioSettings.sfx||!ensureAudio()||!sfxGain)return;const now=audioCtx.currentTime+.01;const note=(n,d=.12,g=.12,w='sine',delay=0)=>softNote(midiHz(n),now+delay,d,g,w,sfxGain);switch(type){case'move':note(60,.12,.09,'triangle');note(67,.18,.08,'triangle',.1);break;case'coin':note(76,.1,.12,'square');note(83,.16,.09,'triangle',.08);break;case'save':note(64,.12,.08,'sine');note(69,.15,.08,'sine',.09);note(76,.22,.07,'sine',.18);break;case'success':note(60,.12,.09,'triangle');note(64,.15,.09,'triangle',.1);note(67,.2,.09,'triangle',.2);note(72,.3,.08,'sine',.3);break;case'fail':note(55,.2,.08,'sawtooth');note(50,.3,.07,'triangle',.15);break;case'busking':note(57,.11,.08,'triangle');note(64,.11,.08,'triangle',.09);note(69,.2,.08,'triangle',.18);break;case'drink':note(72,.08,.07,'sine');note(79,.12,.06,'sine',.08);break;case'event':note(48,.18,.07,'sine');note(60,.24,.08,'triangle',.13);break;case'click':case'tap':default:note(69,.07,.035,'sine');}}
function toggleBgm(){audioSettings.bgm=!audioSettings.bgm;saveAudioSettings();ensureAudio();syncAudioGains();playSfx('tap');renderAudioSettingsIfOpen()}
function toggleSfx(){audioSettings.sfx=!audioSettings.sfx;saveAudioSettings();ensureAudio();syncAudioGains();if(audioSettings.sfx)playSfx('success');renderAudioSettingsIfOpen()}
function setAudioVolume(v){audioSettings.volume=Math.max(0,Math.min(1,Number(v)||0));saveAudioSettings();ensureAudio();syncAudioGains()}
function audioSettingsHtml(){return `<div class="audio-settings"><div class="audio-row"><div><label>잔잔한 배경음악</label><small>장소마다 코드 분위기가 조금씩 달라집니다.</small></div><button id="toggleBgm" class="audio-toggle ${audioSettings.bgm?'on':''}">${audioSettings.bgm?'켜짐':'꺼짐'}</button></div><div class="audio-row"><div><label>효과음</label><small>이동, 구매, 버스킹, 저장 등에 재생됩니다.</small></div><button id="toggleSfx" class="audio-toggle ${audioSettings.sfx?'on':''}">${audioSettings.sfx?'켜짐':'꺼짐'}</button></div><div><label for="audioVolume">전체 볼륨 ${Math.round(audioSettings.volume*100)}%</label><input id="audioVolume" class="audio-volume" type="range" min="0" max="1" step="0.05" value="${audioSettings.volume}"></div><p class="audio-hint">휴대전화 브라우저 정책 때문에 첫 화면 터치 후 음악이 시작됩니다. 이어폰 사용 시 볼륨을 낮게 설정해 주세요.</p></div>`}
function openAudioSettings(){ensureAudio();showModal('음악·효과음 설정',audioSettingsHtml());bindAudioSettings()}
function bindAudioSettings(){const bgm=$('#toggleBgm'),sfx=$('#toggleSfx'),vol=$('#audioVolume');if(bgm)bgm.onclick=toggleBgm;if(sfx)sfx.onclick=toggleSfx;if(vol)vol.oninput=e=>{setAudioVolume(e.target.value);const label=e.target.previousElementSibling;if(label)label.textContent=`전체 볼륨 ${Math.round(audioSettings.volume*100)}%`}}
function renderAudioSettingsIfOpen(){if($('#modal')?.open&&$('#modalTitle')?.textContent==='음악·효과음 설정'){ $('#modalBody').innerHTML=audioSettingsHtml();bindAudioSettings()}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900)}
function clamp(v,min=0,max=100){return Math.max(min,Math.min(max,v))}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function addHistory(text,key=null){if(key&&state.historyKeys.includes(key))return false;if(key)state.historyKeys.push(key);state.history.push(`${state.day}일차 · ${text}`);if(state.history.length>80)state.history.shift();return true}
function cooldownReady(key,days,label){const last=Number(state.cooldowns?.[key]??-99);const elapsed=state.day-last;if(elapsed<days){toast(`${label}까지 ${days-elapsed}일 남았습니다.`);return false}return true}
function markCooldown(key){state.cooldowns[key]=state.day}
function distributeFanGrowth(delta){if(delta<=0)return;const lv=fameLevel();let overseas=lv>=55?.12:lv>=35?.05:.01;let gay=.08;let enthusiast=lv>=30?.18:.10;const amounts={overseas:Math.floor(delta*overseas),gay:Math.floor(delta*gay),enthusiast:Math.floor(delta*enthusiast)};amounts.regular=Math.max(0,Math.floor(delta)-amounts.overseas-amounts.gay-amounts.enthusiast);for(const [k,v] of Object.entries(amounts))state.fanGroups[k]=(state.fanGroups[k]||0)+v}
function stat(name,delta){
 if(name==='fame'){state.stats.fame=Math.max(0,Math.min(10000,state.stats.fame+delta));if(state.career)state.career.peakFame=Math.max(state.career.peakFame||0,state.stats.fame);return delta}
 if(name==='money'){
  if(delta>0&&state.economy?.debt>0){const repay=Math.min(state.economy.debt,Math.max(1,Math.floor(delta*.5)));state.economy.debt-=repay;state.economy.totalDebtRepaid=(state.economy.totalDebtRepaid||0)+repay;state.stats.money=Math.max(0,state.stats.money+delta-repay);if(repay>0)toast(`수입 중 ${repay.toLocaleString()}원이 채무 상환에 사용되었습니다.`);return delta-repay}
  state.stats.money=Math.max(0,state.stats.money+delta);return delta
 }
 if(name==='fans'){
  const before=state.stats.fans;state.stats.fans=Math.max(0,state.stats.fans+delta);const actual=state.stats.fans-before;
  if(actual>0)distributeFanGrowth(actual);
  if(actual<0){const total=Object.values(state.fanGroups||{}).reduce((a,b)=>a+(Number(b)||0),0);if(total>0){const target=state.stats.fans;let assigned=0;const keys=['overseas','gay','enthusiast','regular'];for(const k of keys){const next=k==='regular'?Math.max(0,target-assigned):Math.max(0,Math.floor((state.fanGroups[k]||0)/total*target));state.fanGroups[k]=next;assigned+=next}}}
  return actual
 }
 state.stats[name]=clamp(state.stats[name]+delta);return delta
}
function addDebt(amount,reason='미납금'){amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return 0;state.economy.debt=(state.economy.debt||0)+amount;state.economy.lastDebtNoticeDay=state.day;addHistory(`💳 채무 발생 · ${reason} ${amount.toLocaleString()}원`,`debt:${state.day}:${state.economy.debt}`);return amount}
function chargeMonthlyUpkeep(){let upkeep=500000;if(state.manager.hired)upkeep+=250000;if(state.band.formed)upkeep+=400000;const paid=Math.min(state.stats.money,upkeep);state.stats.money-=paid;const unpaid=upkeep-paid;if(unpaid>0)addDebt(unpaid,'월 고정비 미납');toast(unpaid>0?`월 고정비 ${upkeep.toLocaleString()}원 중 ${unpaid.toLocaleString()}원이 채무로 남았습니다.`:`월 고정비 ${upkeep.toLocaleString()}원이 빠져나갔습니다.`)}
function debtBlocked(label='이 활동'){if((state.economy?.debt||0)<=0)return false;toast(`채무 ${state.economy.debt.toLocaleString()}원을 먼저 줄여야 ${label}을 진행할 수 있습니다.`);return true}
function costHp(n){if(state.stats.hp<n){toast('체력이 부족합니다.');return false}stat('hp',-n);return true}
function scaledFanLoss(rate=.03,min=10,max=180){return Math.min(max,Math.max(min,Math.floor(state.stats.fans*rate)))}
const weatherInfo={sun:{label:'☀ 햇빛',success:.10,hp:0,breakChance:0},rain:{label:'🌧 비',success:-.20,hp:6,breakChance:.06},snow:{label:'🌨 눈',success:-.15,hp:9,breakChance:.04}};
const housingInfo=[['지하 단칸방',0],['1층 원룸',10000000],['복층 오피스텔',30000000],['아파트',50000000],['펜트하우스',100000000]];
function fameLevel(){return Math.max(1,Math.min(100,Math.floor(state.stats.fame/100)+1))}
function dayType(){const y=((state.day-1)%365)+1;if([1,15,50,100,150,200,250,300,365].includes(y))return '공휴일';const w=(state.day-1)%7;return w===5||w===6?'주말':'평일'}
function rollWeather(){const r=Math.random();state.weather=r<.58?'sun':r<.82?'rain':'snow'}
function weatherLabel(){return weatherInfo[state.weather].label}
function restAmount(){return 25+state.housing*5}
function equipmentBreakCheck(){const info=weatherInfo[state.weather];if(info.breakChance<=0)return '';const protection=state.equipment.battery?.035:0;const chance=Math.max(0,info.breakChance-protection);const broken=[];if(state.equipment.amp&&!state.equipmentDamage.amp&&Math.random()<chance){state.equipmentDamage.amp=true;broken.push('앰프')}if(state.equipment.mic&&!state.equipmentDamage.mic&&Math.random()<chance*.55){state.equipmentDamage.mic=true;broken.push('마이크')}if(broken.length){save(false);return ` ${broken.join('·')}가 ${state.weather==='rain'?'빗물':'추위'} 때문에 고장 났다.`}return ''}
function moveHome(){
 if(debtBlocked('이사'))return;
 if(state.housing>=housingInfo.length-1)return toast('이미 펜트하우스에 살고 있습니다.');
 const next=housingInfo[state.housing+1];
 if(state.stats.money<next[1])return toast(`${next[0]} 이사 비용 ${next[1].toLocaleString()}원이 필요합니다.`);
 stat('money',-next[1]);state.housing++;
 addHistory(`🏠 주거 업그레이드 · ${next[0]}에 새 보금자리를 마련했다.`);
 showDialogue('류현상',`${next[0]}으로 이사했다. 이제 휴식할 때 체력을 ${restAmount()} 회복한다.`);save(false);advance(1)
}
function advance(hours=1){state.time+=hours;while(state.time>=4){state.time-=4;state.day++;dailyTick()}save(false);checkProgress();render();setTimeout(()=>maybeStoryEvent(),180)}
function dailyTick(){rollWeather();stat('hp',8);stat('stress',-4);state.items.bakcasUsedToday=0;state.items.mealsToday=0;if(state.economy.lastWorkDay!==state.day-1)state.economy.workStreak=0;if(state.day%30===0)chargeMonthlyUpkeep();randomEvent()}
function randomEvent(){
 if(Math.random()>.22)return;
 const candidates=[
  {id:'daily-viral',title:'바이럴 영상',text:'어젯밤 버스킹 영상이 짧은 영상 플랫폼에서 화제가 됐다.',condition:()=>state.performanceCount>0,effect:()=>{stat('fans',45);stat('fame',12)}},
  {id:'daily-gear',title:'장비 고장',text:'앰프에서 갑자기 잡음이 나기 시작했다.',condition:()=>state.equipment.amp&&!state.equipmentDamage.amp&&Math.random()<.18,effect:()=>{state.equipmentDamage.amp=true;stat('stress',8)}},
  {id:'daily-comment',title:'악성 댓글 확산',text:'외모만 믿고 노래한다는 댓글이 퍼지며 일부 팬이 구독을 취소했다.',condition:()=>state.stats.fans>=100,effect:()=>{stat('fans',-scaledFanLoss(.025,8,90));stat('stress',12)}},
  {id:'daily-cancel',title:'공연 지각 논란',text:'교통 문제로 무대 시작이 늦어졌고 기다리던 관객 일부가 실망했다.',condition:()=>state.stats.fans>=500&&state.career.totalConcerts>0,effect:()=>{stat('fans',-scaledFanLoss(.035,20,160));stat('fame',-5);stat('stress',8)}},
  {id:'daily-overwork',title:'무성의한 팬 응대',text:'지친 상태에서 팬에게 건넨 짧은 대답이 차갑게 편집되어 퍼졌다.',condition:()=>state.stats.fans>=800&&state.stats.stress>=60,effect:()=>{stat('fans',-scaledFanLoss(.045,30,220));stat('fame',-8);stat('stress',6)}},
  {id:'daily-singer',title:'유명 가수의 공유',text:'이전 버스킹 영상을 본 유명 가수가 SNS에 짧은 칭찬을 남겼다.',condition:()=>state.performanceCount>0,effect:()=>stat('fame',30)},
  {id:'daily-band',title:'멤버 갈등',text:'최근 솔로 활동이 이어지자 멤버들이 서운함을 드러냈다.',condition:()=>state.band.formed&&state.soloStreak>=2,effect:()=>{state.band.bond=clamp(state.band.bond-14)}}
 ];
 const pool=candidates.filter(x=>x.condition());if(!pool.length)return;
 const e=pick(pool),before=snapshotStats();e.effect();const changes=describeStatChanges(before);
 showDialogue('돌발 사건',`${e.title} — ${e.text}`);playSfx('event');
 addHistory(`⚡ 돌발 사건 · ${e.title}`,`random:${e.id}`);
 $('#eventBadge').classList.remove('hidden');setTimeout(()=>$('#eventBadge').classList.add('hidden'),2500);
 if(changes)setTimeout(()=>toast(changes),250);
}
function memberLeave(){const keys=Object.keys(state.band.members).filter(k=>state.band.members[k]);if(!keys.length)return '';const k=pick(keys),n=state.band.members[k];state.band.members[k]=null;state.band.formed=false;state.band.bond=35;state.soloStreak=0;addHistory(`🎸 밴드 이탈 · ${n}이(가) 팀을 떠났다.`);return `${n}이(가) 반복되는 솔로 활동에 서운함을 느껴 밴드를 떠났다.`}
function setChoiceLock(locked){
 choiceLock=!!locked;
 const screen=$('#gameScreen');if(screen)screen.classList.toggle('choice-lock',choiceLock);
 if(choiceLock){const menu=$('#menuBtn');if(menu)menu.title='선택지를 고르기 전에는 수동 저장과 타이틀 이동만 가능합니다.'}
}
function displayDialogue(name,text,choices=[]){
 const wrap=$('#characterWrap'),art=$('#characterArt'),box=document.querySelector('.dialogue-box'),plate=$('#speakerName');
 plate.textContent=name;$('#dialogueText').textContent=text;
 const isManager=name==='후라보노';const outfitImages=['outfit-black.png','outfit-white.png','outfit-check.png','outfit-leather.png','outfit-hoodie.png','outfit-stage.png','outfit-mystery.png'];const src=isManager?'assets/images/hurabono.png':`assets/images/${outfitImages[state.outfit||0]}`;
 if(art.getAttribute('src')!==src){art.setAttribute('src',src);wrap.classList.add('speaker-enter');$('#scene').classList.add('character-switch');setTimeout(()=>{wrap.classList.remove('speaker-enter');$('#scene').classList.remove('character-switch')},560)}
 wrap.classList.toggle('manager-mode',isManager);art.alt=isManager?'후라보노':'류현상';
 box.classList.remove('dialogue-pop');plate.classList.remove('speaker-pop');void box.offsetWidth;box.classList.add('dialogue-pop');plate.classList.add('speaker-pop');
 const area=$('#choiceArea');area.innerHTML='';area.classList.toggle('hidden',!choices.length);setChoiceLock(choices.length>0);choices.forEach(c=>{const b=document.createElement('button');b.textContent=c[0];b.onclick=()=>{area.classList.add('hidden');setChoiceLock(false);try{const before=snapshotStats();const result=c[1]();const changes=describeStatChanges(before);showDialogue(result&&result.name?result.name:name,result&&result.text?result.text:(typeof result==='string'?result:'선택을 마쳤다.'));save(false);render();checkProgress();if(changes)setTimeout(()=>toast(changes),250)}catch(err){console.error(err);setChoiceLock(true);toast('이벤트 처리 중 오류가 발생했습니다.')}};area.appendChild(b)});
}
function showDialogue(name,text,choices=[]){state.dialogue={name,text};displayDialogue(name,text,choices)}
const motionLabels={stockWork:'진열 보조',finance:'가계부',flyerPromo:'전단 홍보',audienceResearch:'관객 조사',stageRehearsal:'리허설',storePromo:'홍보 방송',customerPractice:'응대 연습',rest:'휴식',sleep:'SLEEP',compose:'작곡',vocal:'보컬',work:'ALBA',busking:'BUSKING',bandBusking:'BAND LIVE',rehearse:'합주',recruit:'멤버 영입',arrange:'편곡',audition:'오디션',concert:'LIVE',broadcast:'ON AIR',fanmeeting:'팬미팅',date:'DATE',walk:'산책',observe:'관찰',repair:'CHECK',meal:'식사',snack:'간식',buyBakcas:'박칵스',bakcas:'BOOST'};
const motionClassMap={stockWork:'work',finance:'rest',flyerPromo:'walk',audienceResearch:'observe',stageRehearsal:'concert',rest:'rest',sleep:'sleep',compose:'compose',vocal:'vocal',work:'work',busking:'busking',bandBusking:'band',rehearse:'band',recruit:'band',arrange:'compose',audition:'audition',concert:'concert',broadcast:'concert',fanmeeting:'concert',date:'date',walk:'walk',observe:'observe',repair:'repair',meal:'rest',snack:'rest',buyBakcas:'rest',bakcas:'rest'};
function spawnMusicNotes(count=7){const layer=$('#musicNotes');if(!layer)return;for(let i=0;i<count;i++){const n=document.createElement('span');n.className='music-note';n.textContent=['♪','♫','♬'][Math.floor(Math.random()*3)];n.style.left=`${15+Math.random()*70}%`;n.style.setProperty('--drift',`${-70+Math.random()*140}px`);n.style.animationDelay=`${Math.random()*.45}s`;layer.appendChild(n);setTimeout(()=>n.remove(),3000)}}
function spawnAudienceLights(count=18){const layer=$('#audienceLights');if(!layer)return;layer.innerHTML='';for(let i=0;i<count;i++){const l=document.createElement('i');l.className='audience-light';l.style.left=`${3+Math.random()*94}%`;l.style.bottom=`${2+Math.random()*19}%`;l.style.animationDelay=`${Math.random()*1.5}s`;layer.appendChild(l)}setTimeout(()=>layer.innerHTML='',2800)}
function pulseScene(actionKey){const scene=$('#scene'),burst=$('#actionBurst'),wrap=$('#characterWrap');if(!scene||!burst)return;const motion=motionClassMap[actionKey]||'rest';scene.className=scene.className.replace(/\bmotion-[^\s]+/g,'').trim();void scene.offsetWidth;scene.classList.add(`motion-${motion}`);burst.textContent=motionLabels[actionKey]||'ACTION';burst.classList.remove('show');void burst.offsetWidth;burst.classList.add('show');wrap.classList.add('blink');setTimeout(()=>wrap.classList.remove('blink'),430);if(['busking','bandBusking','concert','audition','broadcast','fanmeeting'].includes(actionKey)){spawnMusicNotes(actionKey==='concert'?12:8);spawnAudienceLights(actionKey==='concert'?28:16)}clearTimeout(motionTimer);clearTimeout(burstTimer);motionTimer=setTimeout(()=>scene.className=scene.className.replace(/\bmotion-[^\s]+/g,'').trim(),1500);burstTimer=setTimeout(()=>burst.classList.remove('show'),1400)}
function bindScenePointer(){const scene=$('#scene');if(!scene||scene.dataset.boundMotion)return;scene.dataset.boundMotion='1';const move=e=>{const r=scene.getBoundingClientRect();const px=((e.clientX-r.left)/r.width)-.5;const py=((e.clientY-r.top)/r.height)-.5;scene.style.setProperty('--mouse-x',`${px*16}px`);scene.style.setProperty('--mouse-y',`${py*10}px`);scene.style.setProperty('--mouse-r',`${px*1.6}deg`)};scene.addEventListener('mousemove',move);scene.addEventListener('mouseleave',()=>{scene.style.setProperty('--mouse-x','0px');scene.style.setProperty('--mouse-y','0px');scene.style.setProperty('--mouse-r','0deg')});}
const arroganceScenes=[
 {title:'시청률은 내가 올리는 거지',text:'생방송 대기실. 제작진이 오늘 시청률이 걱정된다고 말하자 류현상이 안경을 고쳐 쓰며 말했다. “내가 나가면 알아서 오르겠지. 요즘 내 이름 검색량 봤어?”\n\n방 안이 잠시 조용해졌다. 후라보노가 큐시트를 접으며 끼어들었다. “형, 시청률은 방송국이 올리고 형은 음정이나 올리세요. 리허설에서 두 번째 후렴 반음 낮았습니다.”',choices:[['농담이었다고 수습한다',()=>{state.manager.bond=clamp(state.manager.bond+5);state.arrogance.lesson++;stat('stress',-2);return '류현상은 헛기침을 했다. “알아. 분위기 풀려고 한 말이야.” 후라보노는 무표정으로 대답했다. “분위기가 더 얼었습니다. 그래도 수습하려는 노력은 인정할게요.”'}],['틀린 말은 아니라고 버틴다',()=>{state.manager.bond=clamp(state.manager.bond-7);state.arrogance.lesson--;stat('stress',5);return '류현상은 팔짱을 끼고 끝까지 고개를 들었다. 후라보노는 큐시트에 크게 적었다. “오늘의 금지어: 내가 나가면.” 방송 직전까지 둘 사이에는 싸늘한 침묵이 흘렀다.'}]]},
 {title:'팬들이 나 보러 온 거잖아',text:'공연장 입구에 긴 줄이 생기자 류현상이 창밖을 보며 중얼거렸다. “저 사람들 전부 나 보러 온 거잖아. 이 정도면 입장할 때 내 사진에 절이라도 해야 하는 거 아니야?”\n\n후라보노가 물병을 건넸다. “형, 절은커녕 입장 지연 때문에 화나서 매표소를 찾는 중이에요. 그리고 팬은 형을 높이려고 오는 사람이 아니라 음악을 같이 들으려고 오는 사람입니다.”',choices:[['팬들에게 직접 사과한다',()=>{state.manager.bond=clamp(state.manager.bond+6);state.arrogance.lesson++;stat('fans',120);stat('fame',6);return '류현상은 예정 시간보다 늦어진 이유를 직접 설명하고 기다려 준 팬들에게 고개를 숙였다. 팬들은 그의 어색하지만 진심 어린 사과에 더 큰 박수를 보냈다.'}],['스타는 기다리게 하는 법이라고 말한다',()=>{state.manager.bond=clamp(state.manager.bond-9);state.arrogance.lesson--;stat('fans',-180);stat('fame',-5);return '후라보노는 즉시 마이크를 빼앗았다. “그 말 한 번 더 하면 오늘 공연 제목을 ‘초심 찾기’로 바꿀 겁니다.” 온라인에는 지각보다 류현상의 태도를 지적하는 글이 더 많이 올라왔다.'}]]},
 {title:'멤버들이 나를 따라와야지',text:'합주가 끝난 뒤 류현상은 녹음 파일을 들으며 말했다. “이제 내 인지도가 이 정도인데 멤버들이 내 수준을 따라오려면 좀 더 연습해야겠어.”\n\nP군이 기타 줄을 닦던 손을 멈췄고, L군은 말없이 류현상을 바라봤다. 후라보노가 재생 버튼을 다시 눌렀다. “형, 방금 두 번째 마디 박자 놓친 사람이 누구인지 같이 들어볼까요?”',choices:[['내 실수부터 인정한다',()=>{state.manager.bond=clamp(state.manager.bond+5);state.band.bond=clamp(state.band.bond+8);state.arrogance.lesson++;gainSkill('vocal',1,'event');return '류현상은 문제의 마디를 세 번 다시 들은 뒤 짧게 사과했다. “내가 틀렸네. 다시 맞춰 보자.” 멤버들의 굳었던 표정이 풀렸고, 합주는 한 시간 더 이어졌다.'}],['가수의 감각은 다르다고 우긴다',()=>{state.manager.bond=clamp(state.manager.bond-6);state.band.bond=clamp(state.band.bond-12);state.arrogance.lesson--;stat('stress',7);return 'L군이 아주 짧게 말했다. “박자는 감각 아님.” 후라보노는 고개를 끄덕였다. 그날 합주는 평소보다 일찍 끝났고, 단체 채팅방은 밤까지 조용했다.'}]]},
 {title:'편의점도 이제 날 알아봐야지',text:'오랜만에 편의점에 들른 류현상은 계산대 직원이 자신을 알아보지 못하자 작게 투덜거렸다. “인지도 레벨이 몇인데 아직도 멤버십 있으세요부터 묻네.”\n\n뒤에서 듣던 후라보노가 바로 말했다. “형, 인지도 레벨은 주민등록증이 아닙니다. 그리고 멤버십은 있으시잖아요. 포인트 4,820점.”',choices:[['조용히 멤버십 바코드를 낸다',()=>{state.manager.bond=clamp(state.manager.bond+4);state.arrogance.lesson++;stat('stress',-3);return '류현상은 말없이 휴대전화를 내밀었다. 직원이 뒤늦게 그를 알아보고 놀라자 오히려 먼저 말했다. “편하게 계산해 주세요. 저도 그냥 손님입니다.” 후라보노는 작게 엄지를 들었다.'}],['사인을 먼저 해주겠다고 한다',()=>{state.manager.bond=clamp(state.manager.bond-5);state.arrogance.lesson--;stat('looks',-1);return '직원은 당황해서 영수증만 내밀었다. 후라보노가 류현상의 팔을 끌고 나오며 말했다. “요청받지 않은 사인은 낙서예요, 형.” 류현상은 집에 돌아갈 때까지 아무 말도 하지 않았다.'}]]},
 {title:'대기실은 더 큰 곳으로',text:'공연장 대기실이 좁고 소파가 낡아 있자 류현상이 미간을 찌푸렸다. “이제 내 급이면 최소한 단독 대기실에 소파도 가죽이어야 하는 거 아닌가?”\n\n후라보노는 방 안을 둘러본 뒤 침착하게 말했다. “형이 26살에 기획사 차렸을 때 첫 소속 가수에게 해 주고 싶었던 말이 그거였어요? 아니면 좋은 무대만 만들어 주면 된다고 했어요?” 류현상은 바로 대답하지 못했다.',choices:[['초심을 떠올리고 스태프를 돕는다',()=>{state.manager.bond=clamp(state.manager.bond+8);state.arrogance.lesson+=2;stat('fame',10);stat('stress',-5);return '류현상은 말없이 소매를 걷고 케이블 정리를 도왔다. 공연이 끝난 뒤 현장 스태프가 “요즘 보기 드문 가수”라며 고마워했고, 후라보노는 그제야 웃었다.'}],['성공했으니 대우도 달라야 한다고 한다',()=>{state.manager.bond=clamp(state.manager.bond-10);state.arrogance.lesson-=2;stat('fame',-12);stat('stress',8);return '후라보노는 요구 사항을 전달하는 대신 류현상을 복도로 불러냈다. “정당한 대우와 사람 무시하는 태도는 다릅니다.” 현장 분위기는 끝까지 불편했고, 공연 후 관계자 평가에도 태도 문제가 남았다.'}]]}
];
function maybeArroganceEvent(){
 const lv=fameLevel();
 if(lv<=30||!state.manager.hired)return false;
 if(state.day-state.arrogance.lastDay<5)return false;
 if(Math.random()>.18)return false;
 const scene=arroganceScenes[state.arrogance.count%arroganceScenes.length];
 state.arrogance.lastDay=state.day;state.arrogance.count++;
 playSfx('event');$('#eventBadge').classList.remove('hidden');setTimeout(()=>$('#eventBadge').classList.add('hidden'),2600);
 const choices=scene.choices.map(([label,fn])=>[label,()=>{const result=fn();addHistory(`🎭 후라보노 제지 · ${scene.title} — ${label}`);return result}]);showDialogue('돌발 스토리 · 후라보노',`【${scene.title}】\n\n${scene.text}`,choices);
 return true;
}
function pickContextual(pool){
 const safePool=(pool||[]).filter(line=>{
  if(!state.manager.hired&&/후라보노/.test(line))return false;
  const members=state.band?.members||{};
  if(!members.guitar&&/P군/.test(line))return false;
  if(!members.bass&&/L군/.test(line))return false;
  if(!members.piano&&/J군/.test(line))return false;
  if(!members.drums&&/R군/.test(line))return false;
  return true;
 });
 return pick(safePool.length?safePool:pool);
}
function maybeFanCommunityEvent(){
 if(state.stats.fans<300||state.day-state.cooldowns.fanEvent<7||Math.random()>=.10)return false;
 const events=[
  {min:300,title:'열혈 팬의 공연 지도',speaker:'열혈 팬',text:'초기 버스킹부터 공연 장소와 선곡을 정리해 온 팬이 직접 만든 지도를 보내왔다. “가수님이 어디서부터 여기까지 왔는지 잊지 않았으면 좋겠어요.”',gain:()=>{stat('fans',180);stat('stress',-5)}},
  {min:800,title:'게이 팬의 스타일 피드백',speaker:'게이 팬',text:'패션 일을 하는 한 팬이 무대 의상과 조명 조합을 정리한 긴 메시지를 보냈다. 성적 지향을 농담거리로 삼지 않고, 전문성과 애정으로 류현상의 무대를 돕는 팬이었다. “형의 매력은 숨기는 것보다 정확히 보여 주는 게 좋아요.”',gain:()=>{stat('looks',2);stat('fans',220)}},
  {min:1500,title:'해외 팬의 번역 계정',speaker:'해외 팬',text:'해외 팬들이 자발적으로 가사와 인터뷰를 번역하는 계정을 만들었다. 완벽하지 않은 번역도 있었지만, 노래의 감정을 전하려는 마음은 분명했다.',gain:()=>{stat('fans',500);stat('fame',25)}},
  {min:3000,title:'팬덤의 선행 프로젝트',speaker:'팬카페 운영진',text:'생일 광고 대신 류현상의 이름으로 유기동물 보호소에 기부하자는 제안이 올라왔다. 팬들은 가수의 이미지를 과장하기보다 좋은 영향력을 함께 만들고 싶다고 말했다.',gain:()=>{stat('fans',700);stat('fame',35);stat('stress',-4)}}
 ].filter(x=>state.stats.fans>=x.min);
 if(!events.length)return false;const ev=pick(events);state.cooldowns.fanEvent=state.day;const before=snapshotStats();ev.gain();addHistory(`👥 팬 커뮤니티 · ${ev.title}`,`fan:${state.day}:${ev.title}`);showDialogue(ev.speaker,`【${ev.title}】\n\n${ev.text}`);const changes=describeStatChanges(before);if(changes)setTimeout(()=>toast(changes),250);return true;
}
const snsScenarios=[
 {title:'연습실 15초 라이브',text:'완성되지 않은 후렴구 15초를 올렸다. 팬들은 짧은 영상 속 숨소리와 기타 소리까지 분석하며 정식 발매를 기다렸다.',fans:180,fame:8,stress:1},
 {title:'무표정 셀카 논쟁',text:'평소와 똑같은 무표정 셀카를 올렸는데 팬들은 “오늘은 입꼬리가 1mm 올라갔다”와 “아니다”로 진지하게 토론했다.',fans:130,fame:5,stress:-1},
 {title:'디지몬 진화 취향 공개',text:'좋아하는 진화 장면을 이야기하자 음악 계정이던 댓글창이 갑자기 디지몬 토론장이 됐다. 류현상은 평소보다 답글을 세 배나 많이 달았다.',fans:220,fame:7,stress:-3},
 {title:'새벽 가사 메모',text:'새벽에 쓴 가사 한 줄을 올렸다. 누군가는 이별을 예감했고 누군가는 다음 앨범의 세계관을 추리했다.',fans:160,fame:10,stress:2},
 {title:'팬아트 리그램',text:'해외 팬의 팬아트를 공유하며 짧게 “고맙습니다”라고 남겼다. 작가는 여러 언어로 축하를 받았고 번역 계정도 함께 성장했다.',fans:300,fame:15,stress:-2},
 {title:'음정 실수 밈',text:'라이브 중 음정이 살짝 흔들린 장면이 밈이 됐다. 숨기지 않고 본인이 좋아요를 누르자 오히려 반응이 부드러워졌다.',fans:250,fame:16,stress:1},
 {title:'너무 솔직한 장비 리뷰',text:'협찬이 아닌 장비에 대해 “좋긴 한데 이 가격이면 고민된다”고 솔직히 말했다. 신뢰는 올랐지만 브랜드 담당자는 조금 긴장했다.',fans:180,fame:12,stress:2},
 {title:'악플에 직접 답할 뻔한 밤',text:'악성 댓글에 긴 답글을 쓰다가 전송 직전에 지웠다. 매니저가 있다면 검토를 맡겼고, 없다면 휴대전화를 뒤집어 놓았다.',fans:40,fame:3,stress:state.manager.hired?-2:5},
 {title:'팬 추천곡 투표',text:'다음 버스킹 커버곡을 투표로 정했다. 예상과 전혀 다른 곡이 1위를 차지해 새 연습 과제가 생겼다.',fans:260,fame:9,stress:2},
 {title:'연습 실패 영상 공개',text:'완벽한 테이크 대신 웃으며 실패하는 장면을 올렸다. 팬들은 완벽함보다 실제 연습 과정을 볼 수 있어 좋다고 말했다.',fans:320,fame:14,stress:-1},
 {title:'공연 비하인드 사진',text:'조명 뒤에서 혼자 가사를 확인하는 사진이 올라왔다. 화려한 무대보다 준비하는 뒷모습이 더 오래 공유됐다.',fans:400,fame:20,stress:1},
 {title:'댓글 오해 소동',text:'짧게 쓴 “알겠습니다.”가 화난 말투로 오해받았다. 류현상은 결국 “화난 거 아닙니다. 원래 이렇습니다.”라고 해명했다.',fans:120,fame:8,stress:3}
];
function maybePassiveSnsEvent(){
 if(state.stats.fans<200||state.day-state.sns.lastEventDay<6||Math.random()>=.08)return false;
 const ev=pick(snsScenarios);state.sns.lastEventDay=state.day;const before=snapshotStats();stat('fans',ev.fans);stat('fame',ev.fame);stat('stress',ev.stress);addHistory(`📱 SNS · ${ev.title}`,`sns:${state.day}:${ev.title}`);showDialogue('SNS 반응',`【${ev.title}】\n\n${ev.text}`);const changes=describeStatChanges(before);if(changes)setTimeout(()=>toast(changes),250);return true;
}
const rivalStories=[
 {lv:30,title:'첫 만남 — 카인',scenes:[['나레이션','오디션 대기실 한쪽에서 검은 단발의 남자가 조용히 이어폰을 빼고 있었다. 그는 최근 인디 신에서 이름이 오르기 시작한 싱어송라이터 카인이었다. 류현상과 비슷한 시기에 무대에 서기 시작했지만, 정돈된 이미지와 정확한 라이브로 먼저 주목받고 있었다.'],['카인','“류현상 씨죠? 버스킹 영상 봤습니다. 감정은 좋은데, 고음에서 힘으로 버티는 습관이 있더군요.” 칭찬인지 지적인지 모를 말투였다. 류현상은 표정이 굳었지만 틀린 말은 아니라는 걸 알았다.'],['류현상','“남의 영상 분석할 시간에 본인 노래나 더 하시죠.” 말은 까칠하게 나갔지만, 카인이 지적한 호흡 위치는 머릿속에 남았다. 카인은 기분 나빠하기보다 짧게 웃었다. “그 성격이면 오래 기억되긴 하겠네요.”'],['나레이션','둘은 같은 오디션 무대에 올랐다. 카인은 정교했고 류현상은 거칠지만 절박했다. 결과는 둘 다 다음 단계 진출. 경쟁은 아직 시작에 불과했지만, 서로의 이름은 분명하게 기억됐다.']]},
 {lv:45,title:'음악방송 복도',scenes:[['나레이션','첫 음악방송 리허설 날, 류현상은 복도에서 카인과 다시 마주쳤다. 카인의 무대는 실수 없이 끝났고 스태프들의 칭찬이 이어졌다. 류현상은 괜히 이어폰 볼륨을 높였다.'],['카인','“수원역 영상, 잘 봤습니다. 운이라고 말하는 사람도 있던데 운만으로 그 후렴을 끝까지 끌고 가진 못하죠.” 처음과 달리 노골적인 비꼼은 없었다. 대신 경쟁자를 인정하는 사람의 경계심이 느껴졌다.'],['류현상','“칭찬하려면 그냥 칭찬하세요. 사람 헷갈리게 하지 말고.” 카인은 잠시 웃더니 대답했다. “그럼 솔직히 말하죠. 다음 무대에서는 제가 더 잘할 겁니다.”'],['나레이션','그날 두 사람의 직캠은 나란히 올라왔다. 팬들은 누가 더 낫냐며 경쟁했지만, 류현상은 비교 댓글을 닫고 카인의 무대를 다시 보았다. 질투는 불편했지만 배울 점을 찾게 만드는 감정이기도 했다.']]},
 {lv:60,title:'합동 인터뷰의 불씨',scenes:[['기자','“두 분은 라이벌로 자주 언급됩니다. 서로에게 부족한 점을 하나씩 말해 주시겠어요?” 질문은 분명 논란을 만들기 위한 것이었다.'],['카인','카인은 잠시 생각한 뒤 말했다. “류현상 씨는 감정이 앞서서 무대를 위험하게 만들 때가 있습니다. 하지만 그 위험 때문에 사람들이 멈춰 보는 것도 사실입니다.”'],['류현상','류현상은 반박하려다 말을 골랐다. 사회성을 가지려고 노력하는 순간이었다. “카인은 너무 정확해서 가끔 사람이 아니라 기준표 같아요. 대신 무너지지 않는 법은 저보다 잘 압니다.”'],['나레이션','기사는 자극적인 제목으로 나갔지만 영상 전체를 본 팬들은 두 사람이 서로를 깎아내린 것이 아니라 정확히 이해하고 있다는 걸 알아차렸다. 라이벌 구도는 싸움보다 성장의 이야기로 바뀌기 시작했다.']]},
 {lv:75,title:'라이브 대결',scenes:[['나레이션','연말 특집 방송에서 두 사람은 같은 곡을 각자의 방식으로 편곡해 부르게 됐다. 제작진은 승자를 정하겠다고 했지만, 실제로 중요한 것은 누가 더 오래 기억될 무대를 만드는가였다.'],['카인','“오늘은 봐주지 않겠습니다.” 카인은 평소처럼 침착했지만 손끝에는 긴장이 보였다. 류현상은 그 모습을 보고 오히려 마음이 차분해졌다. 자신만 떨고 있는 게 아니었다.'],['류현상','“봐준 적도 없으면서.” 류현상은 밴드와 눈을 맞췄다. 완벽함으로 카인을 이길 수 없다면 자신의 상처와 실패를 숨기지 않는 무대를 만들기로 했다.'],['나레이션','카인의 무대는 완벽했고 류현상의 무대는 한 번 흔들렸지만 마지막 고음에서 관객 전체가 숨을 멈췄다. 투표 결과는 근소한 차이였다. 승패보다 두 무대가 함께 화제가 되며 두 사람 모두 더 큰 무대로 올라갔다.']]},
 {lv:90,title:'시상식 뒤편의 약속',scenes:[['나레이션','시상식 후보 발표 뒤, 류현상과 카인은 무대 뒤 비상계단에서 마주쳤다. 수많은 카메라와 팬덤 경쟁에서 벗어난 조용한 공간이었다.'],['카인','“처음엔 당신이 금방 사라질 줄 알았습니다. 감정만 앞서는 사람이라고 생각했어요. 그런데 계속 살아남더군요.”'],['류현상','“나도 당신이 재미없는 완벽주의자인 줄 알았어요. 지금도 절반은 맞는 것 같고.” 카인은 웃었고, 류현상도 아주 조금 웃었다.'],['나레이션','둘은 언젠가 경쟁이 아니라 공동 앨범으로 다시 만나자고 약속했다. 라이벌은 상대를 쓰러뜨리기 위한 존재가 아니라, 혼자였다면 도달하지 못할 높이를 보여 주는 사람이 되었다.']]}
];
function runLinearStory(title,scenes,onFinish){let page=0,finished=false;const draw=()=>{const [name,text]=scenes[page];showModal(title,`<div class="ending-story"><div class="ending-count">STORY · ${page+1} / ${scenes.length}</div><h3>${name}</h3><p>${text}</p><div class="ending-nav"><button id="linearPrev" ${page===0?'disabled':''}>이전 장면</button><button id="linearNext" class="primary">${page===scenes.length-1?'이야기를 마친다':'다음 장면'}</button></div></div>`);$('#linearPrev').onclick=()=>{if(page>0){page--;draw()}};$('#linearNext').onclick=()=>{if(finished)return;if(page<scenes.length-1){page++;draw();return}finished=true;closeModal();onFinish&&onFinish()}};draw()}
function maybeRivalStory(){const next=rivalStories[state.rival.stage];if(!next||fameLevel()<next.lv||state.day-state.rival.lastEventDay<5)return false;state.rival.met=true;runLinearStory(next.title,next.scenes,()=>{state.rival.stage++;state.rival.respect+=10;state.rival.lastEventDay=state.day;gainSkill('vocal',2,'rival');stat('fame',15);addHistory(`⚔️ 라이벌 카인 · ${next.title}`,`rival:${state.rival.stage}`);save(false);render();toast('라이벌 스토리 완료 · 보컬 +2 / 인지도 +15')});return true}
function maybeStoryEvent(){if(state.skipNextStory){state.skipNextStory=false;return false}if(maybeFixedDaySpecialEvent())return true;if(maybeMysteriousMerchantEvent())return true;if(maybeHiddenRandomSpecialEvent())return true;if(maybeRivalStory())return true;if(maybeFanCommunityEvent())return true;if(maybePassiveSnsEvent())return true;if(maybeArroganceEvent())return true;if(Math.random()>.52)return false;const pool=storyEvents.filter(ev=>ev.id!=='secret-date'&&ev.id!=='rival'&&(!ev.place||ev.place===state.location)&&(!ev.condition||ev.condition())&&!state.seenEvents.includes(ev.id));if(!pool.length)return false;const ev=pool[Math.floor(Math.random()*pool.length)];state.seenEvents.push(ev.id);if(state.seenEvents.length>28)state.seenEvents.shift();playSfx('event');$('#eventBadge').classList.remove('hidden');setTimeout(()=>$('#eventBadge').classList.add('hidden'),2600);const choices=ev.choices.map(([label,fn])=>[label,()=>{const result=fn();addHistory(`📖 특별 이야기 · ${ev.title} — ${label}`,`story:${ev.id}`);return result}]);showDialogue('돌발 스토리',`【${ev.title}】\n\n${ev.text}`,choices);return true}
function openFinance(){
 const debt=Math.max(0,state.economy?.debt||0);
 if(debt<=0)return showModal('가계부·채무','<p>현재 채무가 없습니다. 월 고정비와 다음 달 지출을 확인하며 현금을 관리하세요.</p>');
 const options=[100000,500000,debt].filter((v,i,a)=>v<=debt&&v<=state.stats.money&&a.indexOf(v)===i);
 showModal('가계부·채무',`<p>현재 채무 <b>${debt.toLocaleString()}원</b> · 보유금 <b>${state.stats.money.toLocaleString()}원</b></p><p>수입 발생 시 50%가 자동 상환되며, 여기서 원하는 금액을 즉시 상환할 수 있습니다.</p>${options.length?options.map(v=>`<button class="wide" data-repay-debt="${v}">${v===debt?'전액 ':''}${v.toLocaleString()}원 상환</button>`).join(''):'<p>현재 보유금으로 상환할 수 없습니다.</p>'}`);
 $$('[data-repay-debt]').forEach(b=>b.onclick=()=>{const amount=Math.min(Number(b.dataset.repayDebt)||0,state.stats.money,state.economy.debt);if(amount<=0)return;state.stats.money-=amount;state.economy.debt-=amount;state.economy.totalDebtRepaid=(state.economy.totalDebtRepaid||0)+amount;addHistory(`💳 직접 채무 상환 · ${amount.toLocaleString()}원`,`debt:manual:${state.day}:${state.economy.debt}`);save(false);render();openFinance();toast(`${amount.toLocaleString()}원을 상환했습니다.`)})
}
function stageRehearsal(){
 if(state.preparation?.stageReady)return toast('이미 다음 무대를 위한 리허설을 마쳤습니다.');
 if(state.stats.money<50000)return toast('공연장 리허설 대관비 5만원이 필요합니다.');
 if(!costHp(10))return;stat('money',-50000);stat('stress',-4);state.preparation.stageReady=true;state.preparation.stageReadyDay=state.day;showDialogue('류현상','공연장의 실제 동선과 음향을 확인했다. 다음 오디션·공연·방송에서 준비 보너스를 받는다.');advance(1)
}
function useBakcas(fromItemMenu=false){
 if(state.items.bakcas<1){toast('박칵스가 없습니다.');if(fromItemMenu)openItemMenu();return false}
 if(state.items.bakcasUsedToday>=2){toast('오늘은 박칵스를 더 마실 수 없습니다.');if(fromItemMenu)openItemMenu();return false}
 if(state.stats.hp>=100){toast('체력이 이미 최대입니다.');if(fromItemMenu)openItemMenu();return false}
 state.items.bakcas--;
 state.items.bakcasUsedToday++;
 stat('hp',state.items.bakcasUsedToday===1?25:20);
 if(state.items.bakcasUsedToday===2)stat('stress',4);
 showDialogue('류현상',state.items.bakcasUsedToday===1?pickContextual(actionDialogue.bakcas):'두 번째 박칵스를 마셨다. 정신은 들었지만 심장이 빠르게 뛰고 스트레스가 조금 쌓였다.');
 toast(`박칵스 사용 ${state.items.bakcasUsedToday}/2`);
 save(false);render();
 if(fromItemMenu)openItemMenu();
 return true
}
function doAction(key){
 const s=state.stats;
 const f={
 rest:()=>{const atHome=state.location==='home',gain=atHome?restAmount():15;stat('hp',gain);stat('stress',atHome?-10:-6);showDialogue('류현상',atHome?`${pickContextual(actionDialogue.rest)} 현재 집에서는 체력 ${gain}을 회복했다.`:`잠깐 앉아 호흡을 고르고 체력 ${gain}을 회복했다. 집이 아니어서 깊게 쉬지는 못했다.`);advance(1)},
 compose:()=>trainingAction('compose',10),
 meal:()=>{if((state.items.mealsToday||0)>=2)return toast('오늘은 더 이상 식사할 수 없습니다.');if(s.hp>=90)return toast('체력이 충분합니다.');if(s.money<8000)return toast('돈이 부족합니다.');state.items.mealsToday=(state.items.mealsToday||0)+1;stat('money',-8000);stat('hp',12);showDialogue('류현상',`${pickContextual(actionDialogue.meal)} 식사를 마치며 시간이 흘렀다.`);advance(1)},
 wardrobe:()=>openWardrobe(),
 bakcas:()=>useBakcas(false),
 moveHome:()=>moveHome(),finance:()=>openFinance(),
 
 stockWork:()=>{if(!costHp(12))return;stat('money',25000);stat('stress',4);state.career.totalWork++;showDialogue('류현상','야간 진열 보조를 맡아 물건을 채우고 25,000원을 받았다. 정식 근무보다 수입은 적지만 체력 부담도 낮았다.');advance(1)},
 work:()=>{const continuous=state.economy.lastWorkDay===state.day||state.economy.lastWorkDay===state.day-1;state.economy.workStreak=continuous?state.economy.workStreak+1:1;state.economy.lastWorkDay=state.day;const hpCost=Math.min(36,22+Math.max(0,state.economy.workStreak-1)*2);if(!costHp(hpCost)){state.economy.workStreak=Math.max(0,state.economy.workStreak-1);return}stat('money',45000);stat('stress',8+(state.economy.workStreak>=3?5:0));state.career.totalWork++;state.exp+=4;showDialogue('류현상',`${pickContextual(actionDialogue.work)} 급여 45,000원을 받았다. ${state.economy.workStreak>=3?'연속 근무로 피로가 크게 쌓였다.':''}`);advance(1)},
 buyBakcas:()=>{if(s.money<15000)return toast('돈이 부족합니다.');stat('money',-15000);state.items.bakcas++;showDialogue('류현상','박칵스 하나를 가방에 넣었다. 오늘은 조금 더 버틸 수 있겠다.');toast('박칵스 1개를 샀습니다.');save(false);render()},
 snack:()=>{if(s.money<2500)return toast('돈이 부족합니다.');stat('money',-2500);stat('hp',8);showDialogue('류현상',pickContextual(actionDialogue.snack));advance(1)},
 storePromo:()=>{if(!costHp(8))return;const fanGain=8+Math.floor(Math.random()*13);stat('fans',fanGain);stat('fame',2);stat('stress',3);showDialogue('류현상',`점장의 허락을 받아 매장 안내 방송 끝에 오늘의 버스킹 일정을 짧게 홍보했다. 무심한 척했지만 목소리를 알아본 손님들이 휴대전화를 꺼냈다. 팬 ${fanGain}명이 늘었다.`);toast(`팬 +${fanGain} / 인지도 +2`);advance(1)},
 customerPractice:()=>{if(!costHp(6))return;const tips=3000+Math.floor(Math.random()*5001);const fanGain=2+Math.floor(Math.random()*5);stat('money',tips);stat('fans',fanGain);stat('stress',1);showDialogue('류현상',`자주 오던 손님의 부탁을 차분히 해결했다. 손님은 고맙다며 작은 팁을 남기고 버스킹 일정도 물었다. 팁 ${tips.toLocaleString()}원, 팬 ${fanGain}명이 늘었다.`);advance(1)},
 gear:()=>openGear(),vocal:()=>trainingAction('vocal',12),
 rehearse:()=>{if(!state.band.formed)return toast('먼저 밴드를 결성해야 합니다.');if(!costHp(18))return;state.band.bond=clamp(state.band.bond+12);state.soloStreak=0;const gain=gainSkill('vocal',2,'rehearse');showDialogue('류현상',`${pickContextual(actionDialogue.rehearse)}${gain===0?' 보컬은 일반 성장 한계인 95에 도달해 더 오르지 않았다.':''}`);if(gain>0)toast(`보컬 +${gain}`);advance(1)},
 recruit:()=>recruit(),arrange:()=>{if(!state.band.formed)return toast('밴드가 필요합니다.');if(!costHp(15))return;const gain=gainSkill('compose',2,'arrange');state.band.bond=clamp(state.band.bond+5);showDialogue('류현상',`각 악기의 빈자리를 줄이자 곡이 훨씬 선명해졌다.${gain===0?' 작곡은 일반 성장 한계인 95에 도달해 더 오르지 않았다.':''}`);if(gain>0)toast(`작곡 +${gain}`);advance(1)},
 album:()=>openAlbum(),busking:()=>busking(false),bandBusking:()=>busking(true),walk:()=>{stat('stress',-15);showDialogue('류현상',pickContextual(actionDialogue.walk));advance(1)},flyerPromo:()=>{if(state.stats.money<20000)return toast('전단 제작비 2만원이 필요합니다.');if(!costHp(8))return;stat('money',-20000);const fanGain=15+Math.floor(Math.random()*21);stat('fans',fanGain);stat('fame',2);showDialogue('류현상',`공원 주변에 다음 버스킹 일정을 알리는 전단을 나눠 줬다. 팬 ${fanGain}명이 새로 관심을 보였다.`);advance(1)},audienceResearch:()=>{if(state.preparation?.buskingInsight)return toast('이미 다음 버스킹을 위한 관객 조사를 마쳤습니다.');if(!costHp(6))return;stat('stress',-3);state.preparation.buskingInsight=true;state.preparation.buskingInsightDay=state.day;showDialogue('류현상','공원 관객이 멈춰 서는 곡과 시간대를 살폈다. 다음 버스킹은 성공률과 팬 증가량이 상승한다.');advance(1)},observe:()=>{if(state.stats.vocal>=95)return toast('보컬 95 이상은 특별 이벤트·앨범·대형 무대로만 성장할 수 있습니다.');const gain=gainSkill('vocal',1,'observe');showDialogue('류현상',pickContextual(actionDialogue.observe));if(gain>0)toast(`보컬 +${gain}`);advance(1)},repair:()=>{if(!state.equipment.mic&&!state.equipment.amp)return toast('먼저 장비를 구입해야 합니다.');if(s.money<30000)return toast('점검비가 부족합니다.');stat('money',-30000);state.equipmentDamage.mic=false;state.equipmentDamage.amp=false;showDialogue('류현상','마이크와 앰프를 점검해 고장 상태를 모두 해결했다.');toast('장비 점검을 완료했습니다.');save(false);advance(1)},
 stageRehearsal:()=>stageRehearsal(),audition:()=>audition(),concert:()=>concert(),broadcast:()=>broadcast(),fanmeeting:()=>fanmeeting(),national:()=>national()
 };state.lastAction=key;if(key!=='wardrobe'&&key!=='gear'&&key!=='album'&&key!=='manager')pulseScene(key);const soundMap={stockWork:'coin',finance:'coin',flyerPromo:'tap',audienceResearch:'tap',stageRehearsal:'busking',work:'coin',buyBakcas:'coin',snack:'drink',meal:'drink',storePromo:'tap',customerPractice:'tap',bakcas:'drink',busking:'busking',bandBusking:'busking',concert:'busking',audition:'busking',repair:'coin'};playSfx(soundMap[key]||'tap');f[key]?.();
}
function startIziViralStory(hpCost){
 const scenes=[
  {name:'내레이션',text:'인지도 Lv.35에 도달한 어느 저녁, 류현상은 평소의 공원이 아닌 수원역 근처에 장비를 펼쳤다. 비가 막 그친 거리에는 젖은 보도블록과 카페 불빛이 길게 번지고 있었다. 사람들은 퇴근길을 재촉했고, 누구도 오래 머물 것 같지 않았다.\n\n류현상은 마이크 높이를 다시 맞춘 뒤, 오늘 마지막 곡으로 오래된 밴드곡 〈응급실〉을 선택했다.'},
  {name:'류현상',text:'첫 소절이 시작되자 흩어지던 발걸음 몇 개가 느려졌다. 류현상은 눈을 감고 후렴을 향해 목소리를 밀어 올렸다.\n\n“너 하나만 사랑하는데↑♬”\n\n평소보다 거칠고 절박한 고음이 수원역 앞 거리를 가로질렀다.'},
  {name:'내레이션',text:'두 번째 후렴에 들어서자 카페 앞에 서 있던 행인이 휴대전화를 꺼냈다. 처음에는 짧게 찍고 지나가려던 영상이었다. 하지만 류현상이 몸을 숙이며 마지막 음을 붙잡는 순간, 촬영자는 녹화 버튼에서 손을 떼지 못했다.\n\n“이대로 나를 두고 가지마하~”\n\n노래가 끝났을 때 작은 박수와 함께 몇 명의 사람들이 동시에 휴대전화를 확인했다.'},
  {name:'지나가던 관객',text:'“이 사람 누구지? 수원역에서 그냥 찍은 건데 목소리가 너무 절박해서 못 지나가겠어요.”\n\n관객은 그날 밤 영상을 짧은 영상 플랫폼과 인스타그램에 올렸다. 제목은 단순했다.\n\n〈수원역에서 응급실 부르는 장발 안경남〉'},
  {name:'내레이션',text:'처음 한 시간 동안 조회 수는 몇백 회에 불과했다. 자정이 지나자 숫자가 천 단위를 넘었고, 새벽에는 추천 알고리즘에 연달아 노출되기 시작했다. 댓글에는 원곡을 떠올렸다는 사람, 목소리 때문에 영상을 반복해서 봤다는 사람, 류현상의 이름을 묻는 사람이 빠르게 늘어났다.\n\n다음 날 아침, 휴대전화 알림은 화면을 켤 때마다 수십 개씩 쌓였다.'},
  state.manager.hired?{name:'후라보노',text:'후라보노는 통계 화면을 한참 바라보다 류현상에게 휴대전화를 내밀었다.\n\n“형, 밤사이에 인스타그램 팔로워가 1만 5천 명 늘었어요. 홍보비도 없고 방송도 아니었는데, 영상 하나가 전부 끌고 왔습니다.”\n\n류현상은 기쁜 표정을 숨기려 안경을 고쳐 썼다. “노래를 잘했으니까 그렇겠지.”\n\n후라보노는 고개를 저었다. “네. 바로 그 말 때문에 제가 계속 옆에 있어야겠네요.”'}:{name:'류현상',text:'다음 날 아침, 류현상은 알림이 멈추지 않는 휴대전화를 들고 한참 화면을 바라봤다. 밤사이에 인스타그램 팔로워가 1만 5천 명 늘어 있었다. 홍보비도, 방송 출연도 없었다. 수원역에서 찍힌 영상 하나가 모든 숫자를 끌고 왔다.\n\n그는 기쁜 표정을 숨기려 안경을 고쳐 썼다. “노래를 잘했으니까 그렇겠지.” 아무도 듣지 않았지만, 스스로 말하고도 조금 꺼드럭거린 것 같아 헛기침을 했다.'},
  {name:'내레이션',text:'영상은 며칠 동안 계속 퍼졌다. 사람들은 류현상을 ‘응급실 버스킹 가수’라고 부르기 시작했고, 다음 버스킹 장소에는 이전보다 훨씬 많은 관객이 모였다.\n\n한 곡의 커버 영상은 류현상의 이름을 처음으로 대중의 알고리즘 위에 올려놓았다. 그러나 그는 영상 속 마지막 고음을 다시 들으며 조용히 중얼거렸다.\n\n“다음에는 내 노래로 저 숫자를 만들 거야.”'}
 ];
 let page=0;
 state.specialScene={active:true,key:'iziViral'};
 const draw=()=>{
  const scene=scenes[page];
  state.dialogue={name:scene.name,text:scene.text};
  render();
  const area=$('#choiceArea');
  area.innerHTML='';area.classList.remove('hidden');
  const button=document.createElement('button');
  button.className='primary';
  button.textContent=page===scenes.length-1?'특별 스토리 마치기':'다음 장면';
  button.onclick=()=>{
   if(page<scenes.length-1){page++;draw();return}
   const before=snapshotStats();
   stat('fans',1500);stat('fame',350);stat('stress',3);
   state.specialEvents.iziViral=true;state.performanceCount++;
   state.specialScene={active:false,key:null};
   addHistory('🔥 수원역 특별 이벤트 · 응급실 커버 영상 바이럴, 인스타그램 팔로워 15,000명 증가','special:izi');
   state.dialogue={name:state.manager.hired?'후라보노':'류현상',text:state.manager.hired?'영상 하나로 팔로워 1만 5천 명이 늘었어요. 지금부터가 더 중요합니다. 다음에는 형의 노래로 사람들을 멈춰 세워요.':'팔로워가 1만 5천 명이나 늘었다. 기쁘지만, 다음에는 내 노래로 사람들을 멈춰 세우고 싶다.'};
   state.skipNextStory=true;
   const changes=describeStatChanges(before);
   playSfx('success');
   if(changes)setTimeout(()=>toast(changes),280);
   if(checkStalkerEvent())return;
   advance(1);
  };
  area.appendChild(button);
 };
 draw();
}
function maybeStartIziViralEvent(band,hpCost){
 if(band||state.specialEvents?.iziViral||fameLevel()<35)return false;
 if(!costHp(hpCost))return true;
 startIziViralStory(hpCost);
 return true;
}
function startWaitedMoreViralStory(){
 state.specialScene={active:true,key:'waitedMoreViral'};
 const before={...state.stats};
 const scenes=[
  {name:'나레이션',text:'명동 거리는 늦은 오후의 열기로 가득했다. 유동 인구가 많은 사거리 앞에서 류현상은 마이크 높이를 조절하며 숨을 골랐다. 평소보다 사람이 많았다. 웅성거림 사이로 누군가 “저 사람 공원에서 노래하던 분 아니야?” 하고 속삭였다.'},
  {name:'류현상',text:'오늘은 이상하게 목이 덜 떨린다. 명동은 시끄럽고, 사람들은 바쁘고, 그래서 오히려 노래가 더 멀리 갈 것 같은 기분이 들었다. 그는 천천히 반주를 맞추고 검정치마의 “기다린만큼, 더”를 시작했다.'},
  {name:'류현상',text:'“그대가 숨겨놨던 아픈 상처들 다 내게 옮겨주세요~ 오오오....” 후렴 첫 줄이 길게 퍼지자 지나가던 커플이 발을 멈췄다. 몇몇은 휴대전화를 들었고, 건너편 가게 앞 학생 두 명도 소리를 따라 낮게 흥얼거렸다.'},
  {name:'류현상',text:'“지치지 않고 슬퍼할 수 있게 나를 좀 더 가까이 둬요~~~ 허~~워!!!!” 고음을 밀어 올리는 순간, 앞줄 관객들 사이에서 작은 탄성이 터졌다. 손에 든 컵을 멈춘 사람, 사진을 찍다가 아예 영상을 눌러 버린 사람, 아무 말 없이 끝까지 서서 듣는 사람까지 하나둘 늘어났다.'},
  {name:'나레이션',text:'버스킹이 끝난 뒤에도 휴대전화 카메라는 쉽게 내려가지 않았다. 명동 한복판에서 찍힌 그 영상은 류현상의 손에도 들어갔고, 그는 잠시 망설이다 자신의 인스타그램에 직접 올렸다. 별생각 없이 올린 한 개의 릴스였다.'},
  state.manager.hired?{name:'후라보노',text:'새벽이 되기 전 후라보노의 메시지가 폭격처럼 쏟아졌다. “형, 지금 그 영상 조회수 이상하게 올라가요. 명동 버스킹 영상이 추천 알고리즘을 탔어요. 잠깐만요… 55만, 120만, 300만… 아니, 555만 찍었어요.” 류현상은 침대에서 벌떡 일어나 화면을 다시 확인했다.'}:{name:'류현상',text:'새벽이 되기 전부터 휴대전화 알림이 폭격처럼 쏟아졌다. 명동 버스킹 영상은 55만, 120만, 300만을 지나 결국 555만 조회를 찍었다. 류현상은 침대에서 벌떡 일어나 통계 화면을 몇 번이나 새로고침했다.'},
  {name:'나레이션',text:'하룻밤 사이에 영상 조회수는 555만을 넘겼고, 인스타그램 팔로워는 3만 명이 늘었다. 댓글에는 “이 사람 누구냐”, “라이브가 음원보다 좋다”, “명동에서 이걸 공짜로 들었다고?” 같은 반응이 쏟아졌다. 류현상은 뜨거운 화면을 내려다보다가, 조용히 숨을 삼켰다. 이번에는 정말로 더 많은 사람들이 그의 이름을 기억했다.'}
 ];
 let page=0;
 const area=$('#choiceArea');
 const draw=()=>{
  const scene=scenes[page];
  state.dialogue={name:scene.name,text:scene.text};
  render();
  area.innerHTML='';
  const prev=document.createElement('button');prev.textContent='이전 장면';prev.disabled=page===0;
  const next=document.createElement('button');next.textContent=page===scenes.length-1?'특별 스토리 마치기':'다음 장면';
  area.append(prev,next);area.classList.remove('hidden');
  prev.onclick=()=>{if(page>0){page--;draw()}};
  next.onclick=()=>{
   if(page<scenes.length-1){page++;draw();return;}
   stat('fans',3000);stat('fame',555);stat('stress',4);
   state.specialEvents.waitedMoreViral=true;state.performanceCount++;
   state.specialScene={active:false,key:null};
   addHistory('🔥 명동 특별 이벤트 · 기다린만큼, 더 커버 555만 조회, 인스타그램 팔로워 30,000명 증가','special:waitedMore');
   state.dialogue={name:state.manager.hired?'후라보노':'류현상',text:state.manager.hired?'명동 버스킹 영상 조회수가 555만이에요. 팔로워도 3만이나 늘었고요. 형, 이제 다들 형 이름을 그냥 스쳐 지나가지 않을 거예요.':'명동 버스킹 영상 조회수가 555만을 찍었다. 팔로워도 3만이 늘었다. 어쩌면 오늘의 노래가, 내 이름을 더 멀리 데려다줄지도 모른다.'};
   state.skipNextStory=true;
   const changes=describeStatChanges(before);
   playSfx('success');
   if(changes)setTimeout(()=>toast(changes),280);
   if(checkStalkerEvent())return;
   advance(1);
  };
 };
 draw();
}
function maybeStartWaitedMoreViralEvent(band,hpCost){
 if(band||state.specialEvents?.waitedMoreViral||fameLevel()<55)return false;
 if(!costHp(hpCost))return true;
 startWaitedMoreViralStory();
 return true;
}
const MYSTERY_OUTFIT_PRICE=44444444;
function finishMysteriousMerchantEvent(message){
 state.specialScene={active:false,key:null};
 state.dialogue={name:'류현상',text:message};
 setChoiceLock(false);save(false);render();
}
function runMysteriousMerchantEvent(){
 state.specialScene={active:true,key:'mysteriousMerchant'};
 const scenes=[
  {name:'나레이션',text:'해가 완전히 저문 뒤였다. 류현상이 다음 일정을 위해 골목을 지나던 순간, 분명 조금 전까지 비어 있던 길 한가운데에 낯선 상인이 서 있었다. 넓은 삿갓과 여러 겹의 검은 로프가 얼굴을 전부 가리고 있었고, 등에 멘 커다란 보따리에서는 금속이 맞부딪히는 듯한 희미한 소리가 들렸다.'},
  {name:'이름 모를 상인',text:'“자네… 이거 하나 사지 않겠나?” 상인은 인사도, 자기소개도 없이 낮게 말했다. 류현상이 대답하기도 전에 그는 보따리 깊숙한 곳으로 손을 넣었다. 이상하게도 보따리 안쪽에서는 밤의 골목과 어울리지 않는 눈부신 빛이 새어 나왔다.'},
  {name:'나레이션',text:'상인이 꺼낸 것은 옷처럼 보였다. 그러나 천인지 금속인지조차 구분할 수 없었다. 검은 표면 위로 금빛과 푸른빛이 물결처럼 지나갔고, 움직이지 않는데도 별가루 같은 빛이 계속 흘러내렸다. 옷깃 안쪽에 붙은 표찰에는 이름 대신 물음표 세 개만 적혀 있었다. 「???」.'},
  {name:'이름 모를 상인',text:'“다시 오지 않을 기회야….” 상인은 가격이 적힌 낡은 나무패를 내밀었다. 44,444,444원. 장난이라고 보기에는 눈앞의 옷이 너무 선명했고, 믿기에는 모든 것이 지나치게 수상했다. 류현상은 빛나는 옷과 얼굴 없는 상인을 번갈아 바라봤다.'},
  {name:'류현상',text:'“옷 한 벌에 사천사백사십사만 사천사백사십사 원… 미친 가격인데.” 그는 그렇게 말하면서도 쉽게 시선을 떼지 못했다. 이 옷을 입고 무대에 오르면 누구든 자신을 바라볼 것 같은 불길하고도 강렬한 확신이 들었다. 수상해 보이지만… 정말 살까?'}
 ];
 let page=0;const area=$('#choiceArea');
 const draw=()=>{
  const scene=scenes[page];state.dialogue={name:scene.name,text:scene.text};render();area.innerHTML='';area.classList.remove('hidden');
  const prev=document.createElement('button');prev.textContent='이전 장면';prev.disabled=page===0;area.appendChild(prev);
  prev.onclick=()=>{if(page>0){page--;draw()}};
  if(page<scenes.length-1){
   const next=document.createElement('button');next.textContent='다음 장면';area.appendChild(next);next.onclick=()=>{page++;draw()};setChoiceLock(false);return;
  }
  const buy=document.createElement('button');buy.textContent=`산다 · ${MYSTERY_OUTFIT_PRICE.toLocaleString()}원`;
  const refuse=document.createElement('button');refuse.textContent='안 산다';area.append(buy,refuse);setChoiceLock(true);
  buy.onclick=()=>{
   if(state.stats.money<MYSTERY_OUTFIT_PRICE){
    toast(`돈이 부족합니다. ${(MYSTERY_OUTFIT_PRICE-state.stats.money).toLocaleString()}원이 더 필요합니다.`);
    state.dialogue={name:'이름 모를 상인',text:'“값을 치를 수 있을 때 다시 만나게 될지도 모르지….” 상인은 옷을 다시 보따리 속으로 넣었다. 아직 구매하지 않았으므로, 이 수상한 상인은 언젠가 다시 나타날 수 있다.'};render();draw();return;
   }
   const before=snapshotStats();stat('money',-MYSTERY_OUTFIT_PRICE);stat('fame',1000);
   if(!state.ownedOutfits.includes(6))state.ownedOutfits.push(6);
   state.specialEvents.mysteriousMerchantPurchased=true;
   addHistory('🕯 수상한 상인 · 44,444,444원을 지불하고 이름 없는 의상 「???」을 구매했다. 인지도가 10레벨 상승했다.','special:mysteriousMerchantPurchased');
   playSfx('success');
   const changes=describeStatChanges(before);
   finishMysteriousMerchantEvent('상인은 돈을 세어 보지도 않고 보따리를 닫았다. “좋은 선택이었는지는 무대가 알려 줄 걸세.” 다음 순간 골목의 불빛이 한 번 깜빡였고, 상인은 흔적도 없이 사라졌다. 옷장에는 이름 없는 의상 「???」만이 남았다.');
   if(changes)setTimeout(()=>toast(changes),280);
  };
  refuse.onclick=()=>{
   finishMysteriousMerchantEvent('류현상은 고개를 저었다. “아무리 봐도 사기잖아.” 상인은 낮게 웃으며 빛나는 옷을 다시 보따리 속에 넣었다. “후회하면… 다시 만날 수도 있겠지.” 구매하지 않았으므로 이 상인은 훗날 다시 나타날 수 있다.');
  };
 };
 playSfx('event');draw();
}
function maybeMysteriousMerchantEvent(){
 if(state.specialEvents?.mysteriousMerchantPurchased||Math.random()>=.01)return false;
 runMysteriousMerchantEvent();return true;
}
const hiddenRandomSpecialEvents=[
 {key:'hiddenGameOst',sceneKey:'hiddenGameOst',title:'🎮 게임 OST 제안 · 천도박멸',condition:()=>state.day>=50,history:'🎮 숨겨진 특별 이벤트 · 판타지 웹툰 「천도박멸」의 OST 제작과 녹음 제안을 받아 새로운 영역에 도전했다.',reward:()=>{gainSkill('compose',5,'specialEvent');gainSkill('vocal',3,'specialEvent');stat('fame',45);stat('fans',90);stat('money',800000);stat('stress',3)},scenes:[
  {name:'나레이션',text:'쉰 날이 지난 어느 저녁, 류현상에게 낯선 계정으로 장문의 메시지가 도착했다. 처음에는 흔한 홍보나 협찬 문의라고 생각해 대충 넘기려 했지만, 메시지에는 그가 올린 자작곡과 버스킹 영상의 특정 구간을 정확히 언급한 감상이 적혀 있었다. 보낸 사람은 판타지 웹툰을 연재 중인 남자 작가였다.'},
  {name:'웹툰 작가',text:'“안녕하세요. 저는 판타지 웹툰 「천도박멸」을 그리고 있습니다. 작품의 다음 대형 에피소드에 사용할 OST를 준비 중인데, 류현상 님의 목소리가 주인공의 분위기와 아주 잘 맞는다고 생각했습니다. 단순히 노래만 부르는 것이 아니라, 작품에 맞는 곡을 직접 제작하고 녹음해 주실 수 있을까요?”'},
  {name:'류현상',text:'현상은 제목부터 여러 번 읽었다. “천도박멸… 제목이 세긴 하네.” 웹툰은 인간계와 천계의 균형이 무너진 뒤, 봉인된 힘을 가진 주인공이 운명에 맞서는 이야기였다. 검과 마법, 배신과 구원, 멸망 직전의 세계가 이어지는 무거운 판타지였다. 평소 자신이 쓰던 사랑 노래와는 완전히 다른 결이었다.'},
  {name:'나레이션',text:'며칠 뒤 두 사람은 카페에서 만났다. 작가는 인물 설정표와 전투 장면 콘티, 다음 화의 감정선을 펼쳐 놓고 설명했다. 류현상은 처음에는 팔짱을 낀 채 조용히 듣기만 했지만, 주인공이 모든 것을 잃고도 다시 검을 드는 장면에서 눈빛이 달라졌다. 실패한 뒤 다시 시작한 자신의 기억과 묘하게 겹쳐 보였기 때문이다.'},
  {name:'류현상',text:'“웅장한 곡으로만 가면 흔해질 것 같아요. 초반에는 거의 속삭이듯 시작하고, 후렴에서 세계가 무너지는 느낌으로 확 커지게 하죠. 주인공이 강해서 싸우는 게 아니라, 무서운데도 다시 일어나는 사람처럼 들려야 해요.” 작가는 잠시 놀란 표정으로 바라보다가 빠르게 메모를 시작했다.'},
  {name:'나레이션',text:'현상은 밤마다 작품을 다시 읽으며 멜로디를 만들었다. 검이 부딪히는 장면에는 날카로운 리듬을, 주인공이 동료를 떠올리는 장면에는 길게 남는 피아노 선율을 넣었다. 가이드 보컬을 녹음할 때는 평소보다 낮고 거친 음색을 사용했고, 마지막 고음에서는 마치 봉인이 깨지는 것처럼 감정을 밀어 올렸다.'},
  {name:'웹툰 작가',text:'최종 녹음이 끝난 뒤 작가는 헤드폰을 벗지 못한 채 한동안 침묵했다. “제가 그리려던 장면이 노래로 먼저 완성된 것 같아요.” 현상은 쑥스러운 듯 시선을 피하며 대답했다. “과장은 됐고, 독자들이 장면에 집중할 수 있으면 됐어요.” 말은 까칠했지만 입가에는 만족스러운 미소가 남아 있었다.'},
  {name:'나레이션',text:'「천도박멸」 OST 공개 소식은 웹툰 독자와 기존 팬들 사이에서 빠르게 퍼졌다. 류현상은 처음으로 다른 창작자의 세계를 음악으로 확장하는 경험을 했다. 이번 제안은 단순한 외주가 아니라, 그가 가수이자 작곡가로 새로운 영역에 발을 들인 사건이 되었다.'}
 ]},
 {key:'hiddenRadioDj',sceneKey:'hiddenRadioDj',title:'🎙 라디오 고정 게스트 제안',condition:()=>state.day>=100&&state.manager.hired,history:'📻 숨겨진 특별 이벤트 · 라디오 고정 게스트가 되어 청취자의 사연에 맞춘 노래를 부르는 라디오 버스킹을 시작했다.',reward:()=>{gainSkill('vocal',4,'specialEvent');stat('fans',180);stat('fame',70);stat('money',500000);stat('stress',-2)},scenes:[
  {name:'나레이션',text:'백 일이 지난 어느 날, 후라보노가 평소보다 이른 시간에 류현상을 깨웠다. 지역 음악 라디오 프로그램에서 고정 게스트 제안이 들어왔다는 소식이었다. 매주 한 번 스튜디오에 출연해 청취자의 사연을 읽고, 그 사연에 어울리는 노래를 짧게 라이브로 들려주는 코너였다.'},
  {name:'류현상',text:'“내가 말을 많이 해야 하는 거면 안 해.” 현상은 이불을 뒤집어쓴 채 즉시 거절하려 했다. 후라보노는 태연하게 대답했다. “형이 말을 잘해서 부르는 게 아니라, 말이 짧아서 부르는 거래요. 사연 듣고 한마디 한 다음 노래하면 된대요.” 현상은 그 설명이 칭찬인지 아닌지 판단하지 못한 채 한동안 침묵했다.'},
  {name:'나레이션',text:'첫 녹화 날, 밝은 낮의 라디오 스튜디오는 생각보다 편안했다. DJ 소라는 긴장을 풀어 주려 가벼운 질문부터 던졌다. 현상은 준비한 답보다 늘 한 문장씩 짧게 대답했지만, 억지로 꾸미지 않은 말투가 오히려 청취자들에게 솔직하게 들렸다.'},
  {name:'DJ 소라',text:'“오늘 사연은 꿈을 포기할까 고민하는 스물아홉 살 청취자분의 이야기예요. 몇 번을 실패했는데 다시 시작할 용기가 나지 않는다고 합니다. 현상 씨는 어떤 말을 해 주고 싶으세요?”'},
  {name:'류현상',text:'현상은 대본을 내려다보다가 천천히 마이크 쪽으로 몸을 기울였다. “저도 한 번 크게 망하고 도망친 적 있어요. 다시 시작해도 잘된다는 보장은 없죠. 그래도 안 하면 실패한 장면에서 시간이 멈춰 버립니다. 아주 조금이라도 다시 해 보는 편이… 덜 억울하더라고요.”'},
  {name:'나레이션',text:'그는 사연에 맞춰 조용한 기타 반주를 시작했다. 라디오 스튜디오는 작은 버스킹 무대가 되었고, 청취자는 보이지 않았지만 수많은 사람이 각자의 방과 차 안에서 그 노래를 듣고 있었다. 곡이 끝난 뒤 실시간 메시지 창에는 “오늘 다시 이력서를 써 보겠다”, “노래 듣고 울었다”는 반응이 이어졌다.'},
  {name:'DJ 소라',text:'“말을 못 한다고 하셨는데, 필요한 말은 다 하시네요.” DJ가 웃으며 말하자 현상은 민망한 듯 안경을 고쳐 썼다. “다음부터는 노래만 시키세요.” 하지만 방송이 끝난 뒤 그는 다음 주 사연 목록을 누구보다 먼저 챙겨 보았다.'},
  {name:'나레이션',text:'라디오 버스킹 코너는 고정 코너로 편성되었다. 류현상은 매주 다른 사람의 사연을 음악으로 받아 적었다. 무대에서 관객의 얼굴을 보며 노래하는 것과는 또 다른 방식으로, 그의 목소리는 누군가의 가장 조용한 시간에 도착하기 시작했다.'}
 ]},
 {key:'hiddenDingo',sceneKey:'hiddenDingo',title:'🎬 딩고 · 더 넥스트 라이징 보이스',condition:()=>fameLevel()>=60&&state.manager.hired,history:'🎬 숨겨진 특별 이벤트 · 딩고 「더 넥스트 라이징 보이스」에 출연해 「기다린만큼, 더」 라이브 영상 조회수 1위를 달성했다.',reward:()=>{gainSkill('vocal',5,'specialEvent');stat('fans',1200);stat('fame',280);stat('money',1500000);stat('stress',4)},scenes:[
  {name:'나레이션',text:'인지도 레벨 60을 넘긴 뒤, 음악 콘텐츠 채널 딩고에서 연락이 왔다. 차세대 남성 보컬을 소개하는 프로젝트 「더 넥스트 라이징 보이스」의 후보로 류현상이 추천됐다는 내용이었다. 여러 가수의 라이브 영상이 같은 기간 공개되고, 조회수와 반응을 통해 가장 주목받는 목소리를 가리는 기획이었다.'},
  {name:'후라보노',text:'“형, 이건 꼭 해야 해요. 라이브 한 번으로 지금까지 형을 몰랐던 사람들이 전부 볼 수 있어요.” 현상은 제안서를 한참 읽다가 물었다. “후보라는 건 떨어질 수도 있다는 거잖아.” 후라보노는 웃으며 대답했다. “그러니까 형 성격에 딱 맞죠. 이겨야 기분 좋으니까.”'},
  {name:'나레이션',text:'촬영곡은 명동 버스킹에서 큰 반응을 얻었던 「기다린만큼, 더」로 결정됐다. 화려한 세트나 관객 없이, 보라색 조명과 마이크 하나만 놓인 스튜디오였다. 숨길 장치가 없다는 점이 오히려 현상을 긴장시켰다. 작은 호흡 하나와 음정의 흔들림까지 전부 카메라에 남는 자리였다.'},
  {name:'류현상',text:'촬영 직전 현상은 이어폰을 빼며 말했다. “보정 많이 하지 마세요. 라이브라고 해 놓고 다 만지면 의미 없잖아요.” 제작진은 당황하면서도 고개를 끄덕였다. 까칠한 요구였지만, 그만큼 자신의 목소리로 정면 승부하고 싶다는 뜻이었다.'},
  {name:'나레이션',text:'반주가 시작되자 스튜디오는 순식간에 조용해졌다. 현상은 첫 소절을 낮게 눌러 부른 뒤, 후렴으로 갈수록 감정을 점점 크게 밀어 올렸다. 명동 거리의 소음 속에서 불렀을 때와 달리 이번에는 아주 작은 떨림까지 선명하게 들렸다. 마지막 음이 끝난 뒤 제작진 누구도 바로 말을 꺼내지 못했다.'},
  {name:'제작진',text:'“컷 하겠습니다.”라는 말이 떨어진 뒤에야 스태프들이 박수를 쳤다. 현상은 만족스럽지 않은 표정으로 “한 번 더 가도 돼요?”라고 물었지만, 감독은 첫 테이크가 가장 좋다며 그대로 사용하겠다고 했다. 완벽을 원하는 현상에게는 불안한 결정이었지만, 그 불완전한 생생함이 영상의 핵심이 되었다.'},
  {name:'나레이션',text:'영상 공개 첫날부터 댓글과 공유가 폭발했다. “왜 이제 알았지”, “버스킹 영상보다 음색이 더 잘 들린다”, “다음 라이징 보이스는 이 사람”이라는 반응이 이어졌다. 며칠 뒤 류현상의 영상은 프로젝트 참가자 중 조회수 1위를 기록했다.'},
  {name:'후라보노',text:'후라보노는 조회수 화면을 보여 주며 소리쳤다. “형, 더 넥스트 라이징 보이스 1위예요!” 현상은 한동안 숫자를 바라보다가 태연한 척 말했다. “당연한 거 아니야?” 후라보노는 즉시 받아쳤다. “방금 전까지 조회수 새로고침만 백 번 한 사람이요?” 현상은 대답 대신 휴대전화를 뒤집어 놓았다.'},
  {name:'나레이션',text:'딩고 라이브는 류현상을 버스킹 영상 속 화제의 인물이 아니라, 라이브 실력으로 기억되는 가수로 바꾸어 놓았다. 한 곡의 영상이 새로운 관객을 데려왔고, 그의 다음 무대를 기다리는 사람들의 수는 다시 크게 늘어났다.'}
 ]}
];
function runHiddenRandomSpecialEvent(def){
 state.specialScene={active:true,key:def.sceneKey};
 const before=snapshotStats();let page=0;const area=$('#choiceArea');
 const draw=()=>{const scene=def.scenes[page];state.dialogue={name:scene.name,text:scene.text};render();area.innerHTML='';const prev=document.createElement('button');prev.textContent='이전 장면';prev.disabled=page===0;const next=document.createElement('button');next.textContent=page===def.scenes.length-1?'특별 스토리 마치기':'다음 장면';area.append(prev,next);area.classList.remove('hidden');prev.onclick=()=>{if(page>0){page--;draw()}};next.onclick=()=>{if(page<def.scenes.length-1){page++;draw();return}def.reward();state.specialEvents[def.key]=true;state.specialScene={active:false,key:null};addHistory(def.history,`hidden:${def.key}`);state.dialogue={name:'나레이션',text:`숨겨진 특별 이벤트 「${def.title}」가 끝났다.`};playSfx('success');save(false);render();const changes=describeStatChanges(before);if(changes)setTimeout(()=>toast(changes),280)}};playSfx('event');draw();
}
function maybeHiddenRandomSpecialEvent(){
 const pool=hiddenRandomSpecialEvents.filter(def=>!state.specialEvents?.[def.key]&&def.condition());
 if(!pool.length||Math.random()>=.30)return false;
 runHiddenRandomSpecialEvent(pick(pool));return true;
}
const fixedDaySpecialEvents=[
 {day:30,key:'day30Hair',sceneKey:'day30Hair',label:'30일 특별 이벤트 · 염색 고민',history:'💭 30일 특별 이벤트 · 노란 긴생머리로 염색할지 고민하다 결국 휴대전화를 껐다.',stat:()=>{stat('looks',1);stat('stress',1)},scenes:[
   {name:'나레이션',text:'버스킹을 시작한 지 어느새 서른 날. 밤이 깊은 자취방에서 류현상은 침대에 엎드린 채 휴대전화 화면을 한참이나 내려 보고 있었다. 오늘따라 알고리즘은 유난히 선명한 노란 장발 사진들을 자꾸만 추천해 주었다. 같은 장발이라도 색이 바뀌면 분위기가 달라질까, 사람들의 반응도 달라질까, 그런 생각이 머릿속을 맴돌았다.'},
   {name:'류현상',text:'“이렇게 하면… 더 인기가 많아질 것 같은데.” 그는 화면을 확대해 가며 머리 끝의 결, 빛에 반사되는 색감, 안경과의 어울림까지 혼자 진지하게 따져 봤다. 무대에서 조명을 받으면 확실히 눈에 더 띌 것 같았다. 무뚝뚝한 인상도 조금은 부드러워 보일지 모른다는 기대도 생겼다.'},
   {name:'나레이션',text:'하지만 기대가 커질수록 이상한 두려움도 함께 올라왔다. 염색이 잘못되면 어쩌지. 머릿결이 상하면? 무엇보다 현상은 진지한 표정으로 이마를 쓸어 올리며 가장 큰 공포를 중얼거렸다. ‘혹시 탈모 오는 거 아니야…?’ 노래가 안 나오는 악몽보다, 머리카락이 빠지는 상상이 더 선명하게 그려졌다.'},
   {name:'류현상',text:'그는 검색창에 “염색 탈모 진짜?”를 쳤다가 “장발 남자 탈색 후 관리”, “노란 머리 안 어울리는 사람 특징”까지 줄줄이 눌러 봤다. 볼수록 마음은 더 흔들렸다. ‘인기가 좀 늘 수도 있겠지. 그런데 머리가 줄어들면 무슨 의미가 있어.’ 진지한 고민 같지만, 본인도 어딘가 우스워서 입꼬리가 살짝 올라갔다.'},
   {name:'나레이션',text:'잠시 뒤 류현상은 휴대전화를 천천히 뒤집어 놓았다. 세상이 요구하는 이미지를 따라 바꾸는 일도 중요할 수 있지만, 적어도 오늘은 아니라고 결론 내렸다. 그는 검은 머리를 한 번 쓸어 넘기고 한숨처럼 웃었다. 아직은 그냥, 내가 아는 내 얼굴로 더 버텨 보기로 했다.'},
   {name:'류현상',text:'“나중에 진짜 엄청 유명해지면… 그때 다시 고민하지 뭐.” 그렇게 중얼거린 뒤 그는 화면을 껐다. 침대 옆 스탠드 불빛 아래 검은 머리카락이 조용히 빛났다. 노란 머리는 잠시 미뤘지만, 언젠가 더 큰 무대에 설 자신의 모습은 조금 또렷해졌다.'}
 ]},
 {day:60,key:'day60Workout',sceneKey:'day60Workout',label:'60일 특별 이벤트 · 5회 푸쉬업',history:'💪 60일 특별 이벤트 · 몸 관리를 결심했지만 푸쉬업 5회에서 체력이 바닥났다.',stat:()=>{stat('hp',4);stat('looks',1);stat('stress',1)},scenes:[
   {name:'나레이션',text:'예순째 날 밤, 샤워를 마치고 나온 류현상은 무심코 거울 앞에 멈춰 섰다. 조용한 방 안에는 책상 스탠드의 노란 빛만 남아 있었고, 그 빛 아래 비친 자신의 어깨선과 팔선이 괜히 더 적나라해 보였다. 공연 영상 속 얼굴만 신경 썼지, 몸은 생각보다 훨씬 방치돼 있다는 사실을 그제야 실감했다.'},
   {name:'류현상',text:'“습… 이대론 안되겠는걸.” 늘 까칠한 톤으로 말하는 그였지만, 이번 한마디에는 꽤 진심이 담겨 있었다. 무대에 오래 서려면 목뿐 아니라 몸도 버텨 줘야 한다. 팬들이 좋아하는 건 목소리겠지만, 적어도 본인은 조금 더 단단한 몸으로 무대에 서고 싶었다.'},
   {name:'나레이션',text:'그는 바닥에 매트를 펼쳤다. 마치 엄청난 결심을 한 사람처럼 물병까지 곁에 세워 놓고, 머리를 질끈 묶었다. 팔을 바닥에 짚는 순간만큼은 꽤 진지했다. ‘오늘부터 관리한다. 꾸준히 한다. 진짜 한다.’ 누구에게 들려줄 것도 아닌 선언을 속으로 세 번쯤 반복했다.'},
   {name:'류현상',text:'하나. 둘. 셋. 넷… 다섯. 다섯 번째 푸쉬업을 겨우 마치자 팔이 먼저 항의를 시작했다. 숨이 턱까지 차올랐고, 어깨는 이미 오늘의 임무를 끝냈다는 듯 떨렸다. 현상은 그대로 매트 위에 엎드린 채 한동안 꿈쩍도 못 했다. 운동 시작 30초 만에 세계 평화를 기원하는 심정이 되었다.'},
   {name:'나레이션',text:'잠시 후 그는 팔을 쭉 뻗은 채 바닥에 누워 스스로를 변호하기 시작했다. ‘시작이 중요한 거지. 무리하면 다음 날 더 못 한다. 천천히 가는 게 오래 간다.’ 틀린 말은 아니었다. 다만 그 말이 푸쉬업 다섯 번 뒤에 나오니 설득력이 조금 떨어질 뿐이었다.'},
   {name:'류현상',text:'결국 그는 식은땀을 닦으며 일어났다. “그래도… 안 한 것보단 낫지.” 거울 속 모습이 갑자기 바뀐 것은 아니었지만, 적어도 손놓고 있진 않았다는 사실이 조금은 마음을 놓이게 했다. 언젠가 더 많은 사람 앞에 설 때를 위해, 오늘의 다섯 번은 너무 초라하면서도 묘하게 소중한 시작이었다.'}
 ]},
 {day:90,key:'day90Live',sceneKey:'day90Live',label:'90일 특별 이벤트 · 인스타 라이브',history:'📱 90일 특별 이벤트 · 인스타 라이브에서 기타를 치며 노래하다가 무리한 신청곡은 능숙하게 모르는 척 넘겼다.',stat:()=>{stat('fans',70);stat('fame',45);stat('stress',2)},scenes:[
   {name:'나레이션',text:'아흔째 날 밤, 류현상은 침대 옆 작은 조명을 켜 두고 휴대전화를 세웠다. 인스타그램 라이브 알림이 켜지자 익숙한 아이디들이 하나둘 들어오기 시작했다. 검은 셔츠 차림의 그는 기타를 무릎 위에 올리고 마이크를 조용히 당겼다. 방 안은 늦은 시간 특유의 적막으로 가득했지만, 화면 속 댓글창은 금세 사람들로 북적였다.'},
   {name:'류현상',text:'“오늘은 그냥… 조용한 노래 몇 곡 할 겁니다.” 시작은 담백했지만 첫 소절이 흘러나오자 반응은 곧 뜨거워졌다. ‘헐 라이브 미쳤다’, ‘목소리 왜 이렇게 가까워요’, ‘오늘 안경 너무 잘 어울려요’ 같은 댓글이 쉴 틈 없이 올라왔고, 하트 아이콘은 화면 오른쪽을 쉬지 않고 타고 올랐다.'},
   {name:'나레이션',text:'한참 분위기가 무르익었을 때, 채팅창에 한 팬이 아주 용감한 신청곡을 남겼다. 현상도 알고, 팬들도 아는, 호흡도 길고 고음도 높은 그 악명 높은 곡이었다. 화면에는 “그 노래 불러 주세요!”라는 댓글이 연달아 달렸고, 현상은 분명히 그 문장을 봤으면서도 아주 능숙하게 기타 줄만 만지작거렸다.'},
   {name:'류현상',text:'“음… 채팅이 조금 빨라서 잘 안 보이네요.” 방금 전까지 작은 이모티콘 하나도 정확히 읽던 사람이 갑자기 난독증이라도 온 듯한 말투였다. 팬들은 곧바로 웃음 표시를 쏟아 냈다. “지금 봤잖아요”, “읽었으면서 모르는 척한다”, “이럴 때만 인터넷 느려짐?” 같은 댓글이 쏟아지자 현상은 결국 피식 웃고 말았다.'},
   {name:'류현상',text:'“힘든 노래는… 오늘 제 컨디션을 위해 잠시 묻어 두겠습니다.” 그는 일부러 진지한 척 말했지만, 팬들은 이미 다 알아차린 상태였다. 누군가는 “가수의 건강권을 보장하라”고 적었고, 누군가는 “모르는 척하는 표정까지 콘텐츠”라고 남겼다. 라이브는 오히려 그 장면 덕분에 더 유쾌해졌다.'},
   {name:'나레이션',text:'방송이 끝날 무렵 시청자 수는 예상보다 훨씬 높아져 있었다. 오늘의 라이브는 대형 바이럴까지는 아니어도, 팬들에게 류현상의 밤을 조금 더 가까이 건네준 시간이었다. 그는 로그아웃 버튼을 누르며 조용히 웃었다. 힘든 신청곡은 피했지만, 팬들의 웃음은 확실히 얻어 낸 밤이었다.'}
 ]},
 {day:120,key:'day120Chat',sceneKey:'day120Chat',label:'120일 특별 이벤트 · 팬톡 대소동',history:'💬 120일 특별 이벤트 · 기획 일을 해 보고 싶다고 팬들과 상의했다가 누나에게 답정너 소리를 들었다.',stat:()=>{stat('fans',120);gainSkill('compose',2,'specialEvent');stat('stress',2)},scenes:[
   {name:'나레이션',text:'백스무째 날 밤, 류현상은 팬들과의 단체 채팅방을 열어 놓고 한참을 망설였다. 요즘은 노래 만드는 일도 재미있지만, 이상하게도 기획안을 짜고 콘셉트를 구상하는 순간에도 꽤 큰 몰입을 느끼고 있었다. 기획사를 말아먹었던 기억이 아직도 남아 있는데도, 다시 그 세계를 들여다보고 싶다는 마음이 고개를 들고 있었다.'},
   {name:'류현상',text:'그는 결국 긴 메시지를 보냈다. “요즘 노래 만드는 것도 너무 재밌지만, 기획 일도 욕심나네요… 노래보다 기획 일을 조금 더 해 보고 싶은데 어떻게 생각해요? 솔직한 의견 궁금해요.” 평소보다 꽤 부드럽게 적은 문장이었지만, 마지막엔 또 어색한 이모지를 하나 붙여 놓았다. 류현상 나름의 사회성 노력의 흔적이었다.'},
   {name:'팬들',text:'답장은 거의 동시에 쏟아졌다. “형 노래 너무 좋아요. 가수 계속해 주세요 제발요🥺”, “기획도 잘할 것 같지만 우리는 형의 목소리를 더 듣고 싶어요!”, “오래오래 가수로 있어 줘요 ㅠㅠ”, “기획도 멋있지만 형이 노래할 때가 제일 빛나요✨” 같은 말들이 채팅창을 빠르게 채웠다. 현상은 스크롤을 내리며 묘하게 웃었다.'},
   {name:'류현상',text:'팬들의 반응을 다 읽은 뒤 그는 장난기 섞인 답을 남겼다. “하핫… 제 맘대로 할겁니다😏 (농담 반 진담 반 😜)” 팬들은 곧바로 ‘형 무서워요’, ‘이럴 거면 왜 물어봐요’, ‘그래도 결국 노래하실 거잖아요’라며 또 한 번 웃음 섞인 아우성을 보냈다. 현상도 자기 말이 약간 답정너처럼 들렸다는 걸 느끼고 있었지만, 이미 늦었다.'},
   {name:'누나',text:'그리고 잠시 뒤, 채팅방에 낯익은 이름이 등장했다. 류현상의 누나였다. “그럴거면 왜 물어보냐? 답정너 자식아 ㅋㅋㅋㅋ 그냥 네가 하고 싶은 거 해 진짜.” 채팅창은 순식간에 폭발했다. 팬들은 “누나 등판”, “팩트 폭행 너무 웃겨요”, “누나가 제일 정확해요”라며 환호했고, 현상은 핸드폰을 들고도 한동안 아무 말 없이 웃기만 했다.'},
   {name:'나레이션',text:'결국 그날의 채팅은 노래와 기획, 팬들의 진심, 그리고 누나의 한 방까지 모두 뒤섞인 채 마무리됐다. 류현상은 휴대전화를 내려놓으며 생각했다. 아직 정확한 답을 정한 것은 아니지만, 적어도 자신이 어떤 모습일 때 가장 많은 사람들이 빛을 본다고 말해 주는지는 분명히 알게 되었다.'}
 ]},
 {day:150,key:'day150Birthday',sceneKey:'day150Birthday',label:'150일 특별 이벤트 · 생일 파티',history:'🎂 150일 특별 이벤트 · 팬들이 생일을 축하해 주었고, 한 오랜 팬에게서 귀한 디지몬 카드 50장을 선물받았다.',stat:()=>{stat('fans',300);stat('stress',-6);state.items.bakcas+=2},scenes:[
   {name:'나레이션',text:'백오십째 날, 류현상은 평소보다 조금 이른 시간에 팬들을 만나러 갔다. 별다를 것 없는 일정이라고 생각했지만, 문을 열자마자 보인 풍경은 예상 밖이었다. 조명이 걸린 공간 한가운데에는 검은색과 금색으로 장식된 케이크가 놓여 있었고, 벽에는 ‘Happy Birthday’ 문구와 그의 사진들이 정성스럽게 붙어 있었다. 팬들은 숨을 죽이고 있다가 그가 들어오자 일제히 환하게 웃었다.'},
   {name:'팬들',text:'“생일 축하해요!” 하는 목소리가 여러 방향에서 한꺼번에 쏟아졌다. 누군가는 케이크를 조심히 앞으로 내밀었고, 누군가는 포장된 선물을 한가득 안겨 주었다. 현상은 순간 당황한 표정으로 안경을 고쳐 썼다. 이렇게 많은 축하를 정면으로 받는 일은 여전히 익숙하지 않았지만, 그 낯설음 자체가 따뜻하게 느껴졌다.'},
   {name:'류현상',text:'“이렇게까지 준비한 거예요…?” 그는 늘 그렇듯 감정을 크게 드러내진 않았지만, 목소리는 평소보다 확실히 부드러웠다. 팬들은 웃으며 “오래된 팬이라면 이 정도는 기본이에요”, “오늘은 까칠 금지예요”, “소원 빌고 촛불 끄셔야 돼요”라며 그를 가운데로 이끌었다. 현상은 민망한 듯 한 손을 가슴에 얹고 조용히 고개를 숙였다.'},
   {name:'나레이션',text:'선물은 예상보다 다양했다. 손편지, 직접 만든 키링, 기타 피크 세트, 향이 좋은 차, 무대에서 쓰라며 준비한 소소한 소품까지. 그런데 오래된 한 팬이 내민 상자는 유독 묵직했다. 조심스럽게 포장을 풀자 안에는 투명 슬리브에 넣어 정리된 카드들이 빼곡히 들어 있었다.'},
   {name:'팬',text:'“이거… 전 세계에서 구하기 어려운 디지몬 카드들이에요. 50장 모았어요. 현상 씨가 디지몬 좋아한다고 예전에 말했잖아요.” 순간 류현상의 표정이 눈에 띄게 무너졌다. 무대 위에서 잘 흔들리지 않던 사람이 카드 한 장 한 장을 넘겨 보며 거의 숨을 삼키듯 웃었다. “이건… 진짜 귀한 건데. 아니, 이걸 어떻게…” 그의 눈빛에는 진짜 기쁨이 그대로 드러나 있었다.'},
   {name:'나레이션',text:'그날의 생일은 단순히 케이크를 자르고 사진을 찍는 시간이 아니었다. 류현상에게는 자신이 오랫동안 부른 노래들이 누군가에게는 축하를 준비할 만큼 큰 마음이 되었다는 증거이기도 했다. 그는 선물들을 끌어안고 조용히 말했다. “고마워요. 진짜… 오래 기억할게요.” 팬들은 그 짧고 서툰 감사가 누구보다 진심이라는 것을 알고 있었다.'}
 ]},
 {day:180,key:'day180Archive',sceneKey:'day180Archive',label:'180일 특별 이벤트 · 폐업한 기획사의 흔적',history:'📂 180일 특별 이벤트 · 망한 기획사의 자료를 다시 꺼내 보며, 언젠가 다시 기획도 하고 싶다는 마음을 정리했다.',stat:()=>{gainSkill('compose',3,'specialEvent');stat('stress',-2);stat('fame',20)},scenes:[
   {name:'나레이션',text:'백여든째 날 저녁, 류현상은 자취방 구석에 처박혀 있던 오래된 서류 상자를 꺼냈다. 먼지가 뽀얗게 쌓인 상자 겉면에는 예전에 자신이 차렸던 작은 기획사의 이름이 희미하게 남아 있었다. 스물여섯, 세상은 내 기획력 하나면 뒤집을 수 있을 거라고 믿었던 시절의 흔적이었다.'},
   {name:'류현상',text:'상자를 여는 손은 생각보다 조심스러웠다. 안에는 콘셉트 기획안, 데뷔 로드맵, 신인 브랜딩 메모, 매출 예상표까지 빼곡하게 들어 있었다. 너무 진지해서 오히려 웃긴 문장도 보였다. “1년 안에 업계 판도 변화.” 현상은 그 문장을 읽고 한동안 어이없다는 표정으로 침묵했다가 결국 작게 웃었다. “야, 자신감 하나는 대기업 회장이었네.”'},
   {name:'나레이션',text:'웃음 뒤에는 조금 쓴 기억도 따라왔다. 코로나가 터지기 전까지는 어떻게든 굴러갈 거라고 믿었다. 하지만 공연은 줄줄이 취소됐고, 계획은 종이 속 문장으로만 남았다. 그는 그때의 자신이 너무 미숙했다고 생각하면서도, 동시에 그 정도로 무모했기에 여기까지 다시 돌아올 수 있었는지도 모른다고 느꼈다.'},
   {name:'류현상',text:'한 장 한 장 넘기다 보니 지금의 자신에게도 쓸 만한 아이디어들이 보였다. 팬들과의 소통 방식, 공연 동선, 굿즈 메모, 앨범 콘셉트 구상…. “지금 보면 엉성한데, 완전히 틀린 건 아니네.” 예전의 실패가 전부 실패로만 남은 것은 아니라는 사실이 조금 위로가 됐다.'},
   {name:'나레이션',text:'잠시 그는 생각했다. 팬들에게 말했던 것처럼, 언젠가는 다시 기획을 더 본격적으로 해 보고 싶다고. 다만 이제는 무대 밖으로 도망치듯 기획을 붙잡는 방식이 아니라, 무대 위에 선 사람으로서 더 좋은 팀과 더 좋은 작품을 만드는 방향이어야 한다고. 망해 본 사람이니 할 수 있는 기획도 분명 있을 것이다.'},
   {name:'류현상',text:'현상은 상자 맨 위에 있던 계획표를 조용히 접어 다시 넣었다. “노래를 먼저 놓진 않는다. 그다음에 기획.” 짧은 한마디였지만, 그 안에는 과거의 실패와 지금의 다짐이 함께 들어 있었다. 실패한 기획사의 흔적은 여전히 아팠지만, 동시에 언젠가 다시 써먹을 수 있는 미래의 재료가 되어 있었다.'}
 ]},
 {day:210,key:'day210Demo',sceneKey:'day210Demo',label:'210일 특별 이벤트 · 새벽 데모와 디지몬 감성',history:'🎙 210일 특별 이벤트 · 새벽에 자작곡 데모를 만들다가 디지몬 감성이 과해진 가사에 스스로 웃었다.',stat:()=>{gainSkill('compose',4,'specialEvent');gainSkill('vocal',2,'specialEvent');stat('stress',1)},scenes:[
   {name:'나레이션',text:'이백열째 날 새벽, 류현상은 도무지 잠이 오지 않아 혼자 작업을 시작했다. 방 안은 조용했고, 창밖 도시의 불빛만 희미하게 깜빡였다. 그는 기타를 가볍게 튕기며 막 떠오른 멜로디를 휴대전화 녹음 앱에 담기 시작했다. 밤이 깊을수록 이상하게 좋은 멜로디가 잘 나오는 날이 있었다.'},
   {name:'류현상',text:'처음에는 꽤 진지했다. “좋은데… 이거 된다.” 그는 낮은 톤으로 멜로디를 흥얼거리고, 가사를 메모장에 빠르게 적어 내려갔다. 문제는 집중이 길어질수록 그의 취향도 점점 스며든다는 데 있었다. 잠깐 쉬는 사이 무심코 틀어 둔 디지몬 오프닝 영상이 머릿속에 남아 있었던 것이다.'},
   {name:'나레이션',text:'그래서였을까. 어느 순간 메모장에는 “진화하듯 커지는 마음”, “디지털처럼 번지는 신호”, “너와 나의 세계가 연결된다” 같은 문장이 줄줄이 적혀 있었다. 사랑 노래를 쓰는 줄 알았는데 어쩐지 마지막 후렴구는 모험과 진화를 외치는 분위기로 흘러갔다. 현상은 가사를 끝까지 적은 뒤 한동안 화면만 바라봤다.'},
   {name:'류현상',text:'“잠깐만… 이거 사랑 노래야, 디지몬 극장판 주제가야?” 본인이 써 놓고도 웃음이 터졌다. 아무리 디지몬을 좋아해도 그렇지, 감정선이 후렴에서 갑자기 궁극체처럼 진화해 버리면 곤란했다. 그는 머리를 쓸어 넘기며 한숨인지 웃음인지 모를 소리를 냈다.'},
   {name:'나레이션',text:'그래도 멜로디 자체는 꽤 마음에 들었다. 현상은 가이드 보컬을 한 번 더 녹음했고, 적당히 민망한 가사는 별표를 쳐 두고 수정 후보로 남겨 뒀다. 실패작은 아니었다. 오히려 웃기게 솔직해서 더 기억에 남는 데모였다. 언젠가 진짜 곡으로 발전시킬지, 평생 혼자만 듣고 웃을지는 아직 모른다.'},
   {name:'류현상',text:'파일명은 결국 “new_demo_final_real_last_진화금지”로 저장됐다. 그는 저장 버튼을 누르며 중얼거렸다. “이건 아무한테도 바로 안 들려준다… 조금 더 다듬은 뒤에 공개하자.” 새벽은 여전히 조용했지만, 그 조용함 속에서 또 하나의 류현상다운 곡의 씨앗이 생겨났다.'}
 ]},
 {day:240,key:'day240Meme',sceneKey:'day240Meme',label:'240일 특별 이벤트 · 팬 밈 정주행',history:'😂 240일 특별 이벤트 · 팬들이 만든 밈과 짤을 정주행하며 자신의 까칠한 이미지가 사랑받고 있음을 실감했다.',stat:()=>{stat('fans',150);stat('fame',35);stat('stress',-3)},scenes:[
   {name:'나레이션',text:'이백사십째 날 밤, 류현상은 팬카페와 SNS를 가볍게 둘러보다가 예상치 못한 게시글 하나를 눌렀다. 제목은 “류현상 레전드 모먼트 모음.zip”. 대수롭지 않게 들어갔지만, 그 안에는 그동안 팬들이 모아 둔 각종 짤과 밈, 자막 영상이 끝도 없이 정리돼 있었다. 문제는 그 자료들이 생각보다 너무 정교했다는 점이었다.'},
   {name:'팬들',text:'“무뚝뚝한데 끝까지 우산 씌워 줌”, “표정은 차가운데 박칵스는 먼저 챙겨 줌”, “팬한테 까칠하게 굴다가 집 가서 댓글 다 읽을 상”, “스태프를 혼낼 듯 말 듯 결국 먼저 도와줌” 같은 자막이 하나하나 붙어 있었다. 그의 말투, 안경 올리는 습관, 팬서비스를 부끄러워하는 미세한 표정까지 전부 밈 소재가 되어 있었다.'},
   {name:'류현상',text:'처음엔 “이 사람들 정말 할 일 많다…”라며 혀를 찼다. 그런데 몇 장 더 넘기자 결국 웃음을 참지 못했다. 특히 자신이 팬의 질문에 딱딱하게 답해 놓고는 뒤늦게 음료를 건네는 장면에 “츤데레 아저씨 아님 주의”라고 적혀 있는 짤에서는 완전히 무너졌다. “아저씨는 아니지.” 반박 포인트가 거기라는 점이 또 우스웠다.'},
   {name:'나레이션',text:'재미있었던 건, 그 밈들 속에 비꼼보다 애정이 훨씬 많았다는 사실이었다. 팬들은 그의 무뚝뚝함을 차가움으로만 보지 않았다. 오히려 서툴게 다정한 부분, 말보다 행동이 먼저 나가는 부분, 예민하지만 음악 앞에서는 누구보다 진지한 부분을 정확히 알고 웃고 있었다. 현상은 그제야 조금 안심했다.'},
   {name:'류현상',text:'“내가 저렇게 보이나….” 그는 민망한 표정으로 중얼거렸지만, 싫지는 않았다. 애써 꾸미지 않아도 좋아해 주는 사람들이 있다는 건 꽤 큰 위안이었다. 억지로 성격을 바꾸지 않아도, 대신 조금씩 더 좋은 사람이 되려고 노력하면 된다는 생각도 들었다.'},
   {name:'나레이션',text:'결국 류현상은 팬들이 만든 짧은 밈 영상 하나에 조용히 좋아요를 눌렀다. 그러자 몇 분 뒤 댓글이 또다시 폭발했다. “본체 등판”, “가수님 본인인증 완료”, “오늘도 떡밥 공급 감사합니다.” 그는 휴대전화를 내려놓으며 피식 웃었다. 가끔은 진지한 노래보다, 이런 사소한 웃음이 더 오래 사람을 붙잡아 주는 법이었다.'}
 ]},
 {day:300,key:'day300Promise',sceneKey:'day300Promise',label:'300일 특별 이벤트 · 텅 빈 공연장의 맹세',history:'🎤 300일 특별 이벤트 · 아무도 없는 공연장을 바라보며, 결과와 상관없이 노래를 계속하겠다고 다짐했다.',stat:()=>{stat('fans',250);stat('fame',70);gainSkill('vocal',2,'specialEvent');stat('stress',-4)},scenes:[
   {name:'나레이션',text:'삼백째 날, 공연 시작까지 아직 시간이 꽤 남아 있었지만 류현상은 남들보다 먼저 공연장 안으로 들어왔다. 객석은 비어 있었고, 무대 조명도 반쯤만 켜져 있었다. 관객의 함성도, 밴드의 튜닝 소리도 없는 빈 공연장은 이상할 만큼 넓고 조용했다. 그는 객석 맨 앞줄부터 가장 뒤쪽 자리까지 천천히 눈으로 훑었다.'},
   {name:'류현상',text:'처음 버스킹을 하던 날엔 세 명만 멈춰 서 줘도 다행이라고 생각했다. 지금은 그때보다 훨씬 더 많은 무대를 밟았고, 더 많은 사람의 얼굴을 알게 됐다. 그런데도 빈 객석을 바라보는 마음만큼은 그때와 크게 다르지 않았다. 무대에 서기 직전의 긴장, 목이 잠기지 않을까 하는 걱정, 오늘은 누군가의 하루를 조금이라도 바꿀 수 있을까 하는 기대.'},
   {name:'나레이션',text:'현상은 무대 중앙으로 걸어가 조용히 마이크 스탠드를 잡았다. 객석을 향해 선 채로 한동안 아무 말 없이 서 있었다. 실패했던 기획사, 군대로 도망쳤던 시간, 공원의 찬 바람, 수원역과 명동의 바이럴, 곁에서 도와준 사람들의 조언, 팬들의 웃음과 응원…. 지난 삼백 일이 파도처럼 스쳐 지나갔다.'},
   {name:'류현상',text:'그는 아무도 없는 객석을 향해 아주 작게 말했다. “결과가 뭐가 되든… 난 계속 노래한다.” 누군가에게 들려주기 위한 대사가 아니라, 자신에게 하는 약속이었다. 유명해져도, 뜻대로 안 돼도, 또다시 흔들려도 결국 자신을 살리는 건 노래라는 사실을 이제는 부정할 수 없었다.'},
   {name:'나레이션',text:'그 말 뒤에는 이상하게 마음이 가벼워졌다. 엔딩이 무엇이든, 숫자가 어느 정도이든, 류현상은 이미 중간에서 포기하던 과거의 자신과는 달라져 있었다. 무대는 아직 비어 있었지만 머지않아 관객들로 채워질 것이다. 그리고 그 순간 자신이 부를 첫 음을 그는 누구보다 잘 알고 있었다.'},
   {name:'류현상',text:'멀리서 스태프가 리허설 준비 신호를 보냈다. 현상은 마이크를 한 번 가볍게 쥐었다 놓고, 조용히 안경을 고쳐 썼다. “좋아. 오늘도 해보자.” 빈 공연장에 남긴 작은 맹세는, 곧 시작될 실제 무대를 향한 가장 단단한 예고가 되었다.'}
 ]}
];
function runFixedDaySpecialEvent(def){
 state.specialScene={active:true,key:def.sceneKey};
 const before=snapshotStats();
 let page=0;
 const area=$('#choiceArea');
 const draw=()=>{
   const scene=def.scenes[page];
   state.dialogue={name:scene.name,text:scene.text};
   render();
   area.innerHTML='';
   const prev=document.createElement('button'); prev.textContent='이전 장면'; prev.disabled=page===0;
   const next=document.createElement('button'); next.textContent=page===def.scenes.length-1?'특별 스토리 마치기':'다음 장면';
   area.append(prev,next); area.classList.remove('hidden');
   prev.onclick=()=>{if(page>0){page--;draw()}};
   next.onclick=()=>{
     if(page<def.scenes.length-1){page++;draw();return;}
     def.stat&&def.stat();
     state.specialEvents[def.key]=true;
     state.specialScene={active:false,key:null};
     addHistory(def.history,`special:${def.key}`);
     playSfx('success');
     const changes=describeStatChanges(before);
     state.dialogue={name:'나레이션',text:`${def.label}이(가) 끝났다. ${changes?changes.replace('능력치 변화 · ','이번 일로 '):'오늘의 기억은 조용히 스토리 기록에 남았다.'}`};
     save(false); render();
     if(changes)setTimeout(()=>toast(changes),280);
   };
 };
 playSfx('event');
 draw();
}
function maybeFixedDaySpecialEvent(){
 for(const def of fixedDaySpecialEvents){
   if(state.day>=def.day && !state.specialEvents?.[def.key]){ runFixedDaySpecialEvent(def); return true; }
 }
 return false;
}
function busking(band){
 if(!state.equipment.mic||!state.equipment.amp)return toast('마이크와 앰프를 먼저 구입해야 합니다.');if(state.equipmentDamage.mic||state.equipmentDamage.amp)return toast('장비가 고장 났습니다. 장비 점검을 먼저 해주세요.');
 if(band&&!state.band.formed)return toast('밴드가 결성되지 않았습니다.');
 const type=dayType(),weather=weatherInfo[state.weather];
 const baseHp=band?24:18,hpCost=baseHp+weather.hp+(type==='공휴일'?3:type==='주말'?1:0);
 if(maybeStartIziViralEvent(band,hpCost))return;
 if(maybeStartWaitedMoreViralEvent(band,hpCost))return;
 if(!costHp(hpCost))return;
 const dayBonus=type==='공휴일'?.18:type==='주말'?.12:0;
 const stressPenalty=Math.max(0,(state.stats.stress-50)/250);const insightBonus=state.preparation?.buskingInsight?.08:0;const successChance=Math.max(.12,Math.min(.95,.48+dayBonus+weather.success+state.stats.vocal/250+state.stats.looks/500+(band?state.band.bond/600:0)+insightBonus-stressPenalty));
 const success=Math.random()<successChance;
 const quality=safe(state.stats.vocal*.65+state.stats.looks*.2+Math.random()*28)*(success?1:.28);
 const insightMultiplier=state.preparation?.buskingInsight?1.1:1;const fans=Math.max(1,Math.floor(quality*(band?3.3:1.8)*(type==='공휴일'?1.5:type==='주말'?1.25:1)*insightMultiplier));
 const money=Math.max(0,Math.floor(quality*(band?1700:850)*(success?1:.35)));
 stat('fans',fans);stat('fame',success?Math.max(1,Math.floor(quality/8)):1);stat('money',money);
 let leaveNote='';
 if(band){state.band.bond=clamp(state.band.bond+(success?6:2));state.soloStreak=0}else{state.soloStreak++;if(state.band.formed){state.band.bond=clamp(state.band.bond-(state.soloStreak>=3?12:8));if(state.band.bond<=20&&Math.random()<.35)leaveNote=memberLeave()}}
 const broken=equipmentBreakCheck();
 const result=success?'성공':'실패';
 state.performanceCount++;state.career.totalBusking++;if(state.preparation?.buskingInsight)state.preparation.buskingInsight=false;const fanLine=pickFanComment();showDialogue('팬들',`${type} · ${weather.label} 버스킹 ${result}. 체력 ${hpCost} 소모, 팬 ${fans}명, ${money.toLocaleString()}원을 얻었다.${broken}\n\n팬 반응: “${fanLine}”${leaveNote?`\n\n${leaveNote}`:''}`);if(checkStalkerEvent())return;advance(1)
}
function safe(n){return Math.max(1,n)}
function recruit(){
 const names={guitar:'기타 P군',bass:'베이스 L군',piano:'피아노 J군',drums:'드럼 R군'};
 const requirements={
  guitar:{cost:120000,label:'인지도 Lv.5 · 보컬 28',ok:()=>fameLevel()>=5&&state.stats.vocal>=28},
  bass:{cost:180000,label:'인지도 Lv.10 · 버스킹 3회',ok:()=>fameLevel()>=10&&state.career.totalBusking>=3},
  piano:{cost:250000,label:'인지도 Lv.15 · 작곡 35',ok:()=>fameLevel()>=15&&state.stats.compose>=35},
  drums:{cost:320000,label:'인지도 Lv.20 · 공연 경험 2회',ok:()=>fameLevel()>=20&&state.performanceCount>=2}
 };
 const missing=Object.keys(state.band.members).filter(k=>!state.band.members[k]);
 if(!missing.length)return toast('모든 멤버가 모였습니다.');
 const remain=Math.max(0,5-(state.day-(state.cooldowns.recruit??-99)));
 showModal('밴드 멤버 오디션',`<p>멤버는 자동으로 합류하지 않습니다. 파트별 조건을 달성하고 오디션 대관비를 지불해야 하며, 영입 후 5일 동안 새 오디션을 열 수 없습니다.</p>${remain>0?`<p><b>다음 모집까지 ${remain}일</b></p>`:''}<div class="card-list">${missing.map(k=>{const r=requirements[k],eligible=r.ok()&&remain===0&&state.stats.money>=r.cost;return `<div class="info-card"><header><b>${names[k]}</b><span>${r.cost.toLocaleString()}원</span></header><p>${r.label}</p><button data-recruit-member="${k}" ${eligible?'':'disabled'}>${remain>0?'모집 대기':!r.ok()?'조건 부족':state.stats.money<r.cost?'비용 부족':'오디션 진행'}</button></div>`}).join('')}</div>`);
 $$('[data-recruit-member]').forEach(btn=>btn.onclick=()=>{
  const k=btn.dataset.recruitMember,r=requirements[k];
  if(state.day-(state.cooldowns.recruit??-99)<5)return toast('새 멤버 오디션은 5일마다 열 수 있습니다.');
  if(!r.ok())return toast(`${names[k]} 영입 조건이 부족합니다: ${r.label}`);
  if(state.stats.money<r.cost)return toast('오디션 대관비가 부족합니다.');
  if(!costHp(10))return;
  stat('money',-r.cost);state.cooldowns.recruit=state.day;state.band.members[k]=names[k];
  const joined=Object.values(state.band.members).filter(Boolean).length;state.band.bond=Math.max(35,45+joined*5);state.band.formed=joined===4;
  addHistory(`🎸 멤버 오디션 합격 · ${names[k]} 합류`,`member:${k}`);
  if(state.band.formed){state.soloStreak=0;state.milestones.bandFormed=true;addHistory('🎶 밴드 결성 · 모든 파트의 오디션을 마치고 완전체가 되었다.','band:formed')}
  closeModal();showDialogue(names[k],state.band.formed?'네 파트의 오디션이 모두 끝났다. 이제 완전체 밴드로 합주와 공연을 진행할 수 있다.':`${names[k]}이(가) 오디션을 통과했다. 아직 공석이 남아 있어 완전체 활동은 할 수 없다.`);advance(1)
 });
}
function managerEvent(){
 const lv=fameLevel();
 if(!state.manager.hired){
  if(lv<20)return toast(`인지도 Lv.20부터 후라보노를 고용할 수 있습니다. 현재 Lv.${lv}`);
  showDialogue('후라보노','형, 이제 혼자서 일정까지 감당하기에는 연락이 너무 많이 와요. 노래와 연습은 형이 맡고, 계약·공연 문의·정산은 제가 맡겠습니다. 대신 제 말도 아주 가끔은 들어주세요.',[['후라보노를 고용한다',()=>{if(state.stats.money<200000)return '초기 고용비 20만원이 부족했다. 후라보노는 한숨을 쉬더니, 돈이 모이면 다시 이야기하자며 명함을 책상 위에 두고 갔다.';state.manager.hired=true;state.manager.bond=20;state.milestones.managerHired=true;state.cooldowns.managerTalk=state.day;stat('money',-200000);addHistory('📋 매니저 고용 · 후라보노가 류현상의 일정을 맡기 시작했다.','manager:hired');save(false);return '후라보노는 구겨진 일정표를 새 파일에 옮겨 적었다. “좋아요, 형. 이제 노래만 망치지 마세요. 나머지는 제가 어떻게든 해볼게요.” 그렇게 류현상의 첫 매니저가 생겼다.'}],['조금 더 혼자 해본다',()=>{state.manager.bond=Math.max(0,state.manager.bond-2);return '후라보노는 억지로 붙잡지 않았다. 다만 나가기 전 말했다. “혼자 하는 것과 혼자 견디는 건 달라요. 정말 필요해지면 연락하세요.”'}]])
 }else{
  if(state.cooldowns.managerTalk===state.day)return toast('오늘은 이미 후라보노와 충분히 이야기했습니다.');
  state.cooldowns.managerTalk=state.day;
  state.manager.bond=clamp(state.manager.bond+3);
  const talks=[
   '형, 이번 주 일정 다시 정리했습니다. 인터뷰 두 건은 거절했고, 공연 하나는 출연료를 올렸어요. 그런데 형은 오늘도 점심을 안 먹었죠?',
   '계약서에 ‘홍보 목적 무기한 사용’이라는 문장이 숨어 있었어요. 제가 지웠습니다. 형은 서명하기 전에 제발 제목 말고 본문도 읽으세요.',
   '목 상태가 안 좋아 보여요. 오늘 고음 연습은 금지입니다. 형이 몰래 연습하면 연습실 전원을 제가 내릴 겁니다.',
   '댓글은 제가 먼저 확인할게요. 칭찬은 형에게 보내고, 악성 댓글은 제가 읽고 화낸 다음 삭제하겠습니다. 역할 분담이죠.',
   '공연장 측에서 머리를 조금 자르면 어떻겠냐고 물었어요. 제가 거절했습니다. 형의 머리카락도 이제 계약 조건에 포함해야 할 것 같아요.',
   '정산이 들어왔습니다. 생각보다 많지는 않지만, 예전처럼 돈이 어디로 사라졌는지 모르는 일은 없게 할게요.',
   '형, 팬들이 무표정 셀카를 좋아하긴 하는데 전부 같은 사진처럼 보여요. 오늘은 고개를 3도만 오른쪽으로 돌려 봅시다.',
   '다음 무대 동선을 표시해 뒀어요. 지난번처럼 암전 중에 드럼 쪽으로 들어가면 R군이 또 심장 멎는 줄 알았다고 할 겁니다.',
   '형이 기획사를 하던 시절에는 모든 걸 혼자 책임졌겠지만, 지금은 제가 있어요. 힘든 일까지 혼자 가져가지 마세요.',
   '방송 작가가 재미있는 개인기를 준비해 달래요. 제가 “노래를 잘합니다”라고 답했더니 그건 개인기가 아니래요. 세상이 이상합니다.',
   '오늘 일정은 비워 뒀습니다. 아무것도 하지 않는 것도 일정이에요. 단, 몰래 작곡하다 걸리면 휴식으로 인정하지 않겠습니다.',
   '처음에는 형이 또 금방 포기할까 봐 지켜봤어요. 그런데 이제는 제가 먼저 지치지 않게 조심해야겠네요. 생각보다 오래 가고 있잖아요, 우리.'
  ];
  if(fameLevel()>30)talks.push(
   '형, 요즘 인터뷰에서 “제가 나가면 분위기가 달라지죠” 같은 말이 자꾸 나오던데요. 자신감은 좋지만 꺼드럭은 편집으로도 못 살립니다.',
   '인지도 레벨이 올랐다고 예의 레벨까지 자동으로 오르는 건 아니에요. 그건 따로 연습해야 합니다. 오늘부터 제가 옆에서 잡을게요.',
   '형이 잘된 건 맞아요. 그런데 스태프가 형보다 먼저 와서 형보다 늦게 갑니다. 대우를 요구하기 전에 고맙다는 말부터 해 주세요.',
   '팬들이 형을 좋아한다고 형의 모든 말을 좋아하는 건 아닙니다. 까칠함은 매력일 수 있지만 무례함은 그냥 무례함이에요.'
  );
  if(!state.manager.wedding&&state.day>90&&state.manager.bond>=50){weddingEvent();return}
  showDialogue('후라보노',pick(talks));state.skipNextStory=true;advance(1);
 }
}
function weddingEvent(){state.manager.wedding=true;addHistory('💍 후라보노 결혼 소식 · 축가 부탁을 받았다.','manager:wedding');showDialogue('후라보노','형, 저… 다음 달에 결혼합니다.',[['축가를 불러준다',()=>{state.manager.bond=clamp(state.manager.bond+25);if(state.band.formed)state.band.bond=clamp(state.band.bond+15);toast('후라보노 결혼 이벤트 완료');return '형이 축가를 불러준다면 정말 든든할 것 같아요. 고맙습니다.'}],['일정 때문에 어렵다',()=>{state.manager.bond=clamp(state.manager.bond-20);toast('후라보노가 서운해합니다.');return '괜찮아요, 형. 바쁜 거 아니까… 정말 괜찮습니다.'}]])}
function audition(){
 if(state.stats.vocal<40||state.stats.fame<30)return toast('보컬 40, 인지도 30 이상이 필요합니다.');
 if(!cooldownReady('audition',7,'다음 오디션'))return;if(!costHp(20))return;markCooldown('audition');
 const rehearsalBonus=state.preparation?.stageReady?12:0;const chance=clamp(state.stats.vocal+state.stats.looks*.3-state.stats.stress*.25+rehearsalBonus,15,95);const ok=Math.random()*100<chance;if(state.preparation?.stageReady)state.preparation.stageReady=false;
 if(ok){stat('fame',75);stat('fans',500);if(!state.milestones.firstAudition){state.milestones.firstAudition=true;addHistory('🎤 첫 오디션 합격 · 다음 무대 진출권을 얻었다.','milestone:audition')}showDialogue('심사위원','당신의 목소리에는 이야기가 있군요. 다음 무대로 올라오세요.')}else{stat('stress',5);showDialogue('심사위원','긴장 때문에 기본기가 흔들렸습니다. 일주일 뒤 다시 준비해 오세요.')}
 advance(1)
}
function concert(){
 if(state.stats.fans<500||state.stats.vocal<45)return toast('팬 500명과 보컬 45 이상이 필요합니다.');
 if(!cooldownReady('concert',7,'다음 공연'))return;if(!costHp(28))return;markCooldown('concert');state.career.totalConcerts++;
 const stageBoost=state.preparation?.stageReady?1.15:1;const earn=Math.floor((300000+Math.floor(Math.min(state.stats.fans,30000)*120))*stageBoost);const newFans=Math.max(80,Math.floor(Math.sqrt(state.stats.fans)*8*stageBoost));if(state.preparation?.stageReady)state.preparation.stageReady=false;
 stat('money',earn);stat('fame',60);stat('fans',newFans);stat('stress',4);
 if(state.band.formed)state.band.bond=clamp(state.band.bond+8);state.performanceCount++;
 if(!state.milestones.firstConcert){state.milestones.firstConcert=true;addHistory(`🎪 첫 단독 공연 · 수익 ${earn.toLocaleString()}원, 새 팬 ${newFans.toLocaleString()}명`,'milestone:concert')}
 showDialogue(state.manager.hired?'후라보노':'팬들',`${state.manager.hired?`공연 수익 ${earn.toLocaleString()}원이 정산됐어요. `:''}새 팬 ${newFans.toLocaleString()}명이 생겼습니다. 팬 반응: “${pickFanComment(true)}”`);if(checkStalkerEvent())return;advance(1)
}
function broadcast(){
 if(!state.manager.hired||state.stats.vocal<55)return toast('후라보노 고용과 보컬 55 이상이 필요합니다.');
 if(!cooldownReady('broadcast',7,'다음 방송 출연'))return;if(!costHp(22))return;markCooldown('broadcast');state.career.totalBroadcasts++;
 const stageBoost=state.preparation?.stageReady?1.15:1;stat('fame',Math.floor(120*stageBoost));stat('fans',Math.floor(1200*stageBoost));stat('stress',6);if(state.preparation?.stageReady)state.preparation.stageReady=false;state.manager.bond=clamp(state.manager.bond+5);
 if(!state.milestones.firstBroadcast){state.milestones.firstBroadcast=true;addHistory('📺 첫 방송 출연 · 실시간 검색에 류현상의 이름이 올랐다.','milestone:broadcast')}
 showDialogue('후라보노','방송 반응이 좋아요. 실시간 검색에도 형 이름이 올라왔습니다. 다만 다음 출연은 일주일 뒤에 잡겠습니다.');advance(1)
}
function fanmeeting(){
 if(state.stats.fans<3000)return toast('팬 3,000명 이상이 필요합니다.');
 if(fameLevel()<20)return toast('인지도 Lv.20 이상이 필요합니다.');
 if(!state.manager.hired)return toast('팬미팅 진행을 맡을 후라보노를 먼저 고용해야 합니다.');
 if(state.stats.money<300000)return toast('팬미팅 대관·운영비 300,000원이 필요합니다.');
 if(!cooldownReady('fanmeeting',20,'다음 팬미팅'))return;
 if(!costHp(20))return;
 stat('money',-300000);markCooldown('fanmeeting');
 const first=!state.milestones.firstFanmeeting;
 const fanGain=first?300:150+Math.floor(Math.random()*101);
 stat('fans',fanGain);stat('stress',-8);
 if(first){state.milestones.firstFanmeeting=true;addHistory('💌 첫 팬미팅 · 팬들과 직접 이야기를 나눴다.','milestone:fanmeeting')}
 showDialogue('팬들',`현상 씨, 다음 노래도 오래 기다릴게요! 팬 ${fanGain.toLocaleString()}명이 새로 합류했고 스트레스가 줄었다.`);advance(1)
}
function national(){const result=endingProfile();if(!result[0].startsWith('월드 '))return toast('월드 엔딩 조건이 아직 부족합니다. 보컬·작곡·밴드·공연·해외 팬 중 자신만의 진출 경로를 완성하세요.');offerEnding(result[0],result[1],true,`manual:${result[0]}:${state.day}`)}
function openGear(){
 if(debtBlocked('장비·악기 구매'))return;
 const busking=[['중고 마이크',150000,'mic','버스킹 필수 장비'],['입문용 앰프',300000,'amp','버스킹 필수 장비'],['방수·전원 보호 케이스',400000,'battery','장비 고장 확률 감소']];
 const instruments=[['어쿠스틱 기타',850000,'acousticGuitar','장착 시 작곡 +1 · 버스킹 감성 보정'],['미디 키보드',1400000,'keyboard','장착 시 작곡 +2'],['오디오 인터페이스',2200000,'audioInterface','장착 시 보컬·작곡 +1 · 앨범 완성도'],['스튜디오 콘덴서 마이크',2800000,'studioMic','장착 시 보컬 +2'],['모니터링 헤드폰',950000,'monitorHeadphones','장착 시 보컬 +1 · 훈련 보조']];
 const equipped=new Set(state.equippedInstruments||[]);
 showModal('장비·악기 세팅',`<h3>버스킹 장비</h3><div class="card-list">${busking.map(([n,p,k,d])=>`<div class="info-card"><header><b>${n}</b><span>${p.toLocaleString()}원</span></header><p>${d}</p><button data-buygear="${k}" ${state.equipment[k]?'disabled':''}>${state.equipment[k]?'보유 중':'구입'}</button></div>`).join('')}</div><h3>악기 컬렉션 · 최대 3개 장착</h3><p>보유 효과가 아니라 장착한 악기만 훈련과 앨범에 적용됩니다. 현재 ${equipped.size}/3개 장착.</p><div class="card-list">${instruments.map(([n,p,k,d])=>{const owned=state.instruments[k],on=equipped.has(k);return `<div class="info-card ${on?'equipped-instrument':''}"><header><b>${n}</b><span>${owned?(on?'장착 중':'보유 중'):p.toLocaleString()+'원'}</span></header><p>${d}</p><button ${owned?`data-equipinstrument="${k}"`:`data-buyinstrument="${k}"`}>${owned?(on?'장착 해제':'장착'):'구입'}</button></div>`}).join('')}</div>`);
 $$('[data-buygear]').forEach(b=>b.onclick=()=>{const it=busking.find(x=>x[2]===b.dataset.buygear);if(state.stats.money<it[1])return toast('돈이 부족합니다.');stat('money',-it[1]);state.equipment[it[2]]=true;playSfx('coin');save(false);openGear();render()});
 $$('[data-buyinstrument]').forEach(b=>b.onclick=()=>{const it=instruments.find(x=>x[2]===b.dataset.buyinstrument);if(state.stats.money<it[1])return toast('돈이 부족합니다.');stat('money',-it[1]);state.instruments[it[2]]=true;addHistory(`🎹 악기 수집 · ${it[0]} 구입`,`instrument:${it[2]}`);playSfx('coin');save(false);openGear();render()});
 $$('[data-equipinstrument]').forEach(b=>b.onclick=()=>{const k=b.dataset.equipinstrument;const list=[...(state.equippedInstruments||[])];const i=list.indexOf(k);if(i>=0)list.splice(i,1);else{if(list.length>=3)return toast('악기는 최대 3개까지만 장착할 수 있습니다.');list.push(k)}state.equippedInstruments=list;save(false);openGear();render()})
}
function openWardrobe(){
 if(debtBlocked('의상 구매와 스타일 관리'))return;
 const outfits=[['검은 셔츠',0,0],['흰 셔츠',180000,2],['체크 셔츠',240000,3],['가죽 재킷',480000,5],['후드티',320000,4],['무대 의상',1200000,8],['???',0,0]];
 showModal('옷장',`<div class="card-list">${outfits.map(([x,price],i)=>{const owned=state.ownedOutfits.includes(i);if(i===6&&!owned)return '';const special=i===6;return `<div class="info-card ${special?'mystery-outfit-card':''}"><header><b>${x}</b><span>${special?'수상한 상인의 의상':i===0?'기본 의상':price.toLocaleString()+'원'}</span></header>${special?'<p>착용하는 순간 외모가 최대치 100이 됩니다.</p>':''}<button data-outfit="${i}" ${state.outfit===i?'disabled':''}>${state.outfit===i?'착용 중':owned?'갈아입기':'구매하기'}</button></div>`}).join('')}<div class="info-card"><header><b>헤어·스타일 관리</b><span>80,000원</span></header><p>체력 4를 사용하고 외모 +2. 외모 100까지 이용할 수 있습니다.</p><button id="styleCare" ${state.stats.looks>=100?'disabled':''}>${state.stats.looks>=100?'외모 최대':'관리받기'}</button></div></div>`);
 $$('[data-outfit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.outfit,[name,price,bonus]=outfits[i];if(!state.ownedOutfits.includes(i)){if(state.stats.money<price)return toast('옷을 구매할 돈이 부족합니다.');stat('money',-price);state.ownedOutfits.push(i);if(bonus)stat('looks',bonus);toast(`${name}을 구매했습니다. 외모 +${bonus}`)}state.outfit=i;if(i===6){state.stats.looks=100;addHistory('✨ 의상 「???」 착용 · 외모가 최대치 100이 되었다.','outfit:mystery-equipped')}showDialogue('류현상',`${name}으로 갈아입었다. 거울을 보며 “옷이 사람을 만든다는데, 성격까지 부드러워지진 않겠지.”라고 중얼거렸다.`);save(false);closeModal();render()});
 const care=$('#styleCare');if(care)care.onclick=()=>{if(state.stats.money<80000)return toast('스타일 관리 비용이 부족합니다.');if(!costHp(4))return;stat('money',-80000);stat('looks',2);if(state.stats.looks>=100)addHistory('✨ 외모 100 달성 · 무대 스타일이 완성됐다.','milestone:looks100');closeModal();showDialogue('류현상','머리와 의상을 정돈했다. 낯선 사람과 눈을 마주치는 일은 여전히 어렵지만, 무대에 설 준비는 조금 더 단단해졌다.');advance(1)}
}
function openAlbum(){if(debtBlocked('앨범 제작'))return;const albums=[['디지털 싱글',5000000],['미니앨범',20000000],['정규앨범',50000000]];showModal('앨범 제작',albums.map(([n,p],i)=>`<div class="info-card"><header><b>${n}</b><span>${p.toLocaleString()}원</span></header><p>보컬과 작곡 능력에 따라 팬과 수익이 증가합니다.</p><button data-album="${i}">발매하기</button></div>`).join(''));$$('[data-album]').forEach(b=>b.onclick=()=>releaseAlbum(albums[+b.dataset.album]))}
function releaseAlbum([name,cost]){
 if(state.stats.money<cost)return toast('제작비가 부족합니다.');if(state.stats.compose<30||state.stats.vocal<35)return toast('작곡 30, 보컬 35 이상이 필요합니다.');if(!cooldownReady('album',30,'다음 앨범 발매'))return;markCooldown('album');
 stat('money',-cost);const score=Math.max(30,state.stats.vocal+state.stats.compose+((state.equippedInstruments||[]).length*2)+(state.band.formed?state.band.bond*.3:0)+Math.random()*35-state.stats.stress*.1);const tier=name==='디지털 싱글'?0:name==='미니앨범'?1:2;const fanRates=[40,120,300],fameRates=[.6,1,1.5];
 const fans=Math.floor(score*fanRates[tier]);const revenueRate=clamp(.45+score/180,.65,1.6);const revenue=Math.floor(cost*revenueRate);const fameGain=Math.max(30,Math.floor(score*fameRates[tier]));
 stat('fans',fans);stat('fame',fameGain);stat('money',revenue);state.albums.push({name,score:Math.floor(score),fans,revenue});
 addHistory(`💿 ${name} 발매 · 팬 ${fans.toLocaleString()}명, 인지도 +${fameGain}, 정산 ${revenue.toLocaleString()}원`);
 if(!state.milestones.firstAlbum)state.milestones.firstAlbum=true;
 showDialogue(state.manager.hired?'후라보노':'류현상',state.manager.hired?`${name} 발매 완료. 팬 ${fans.toLocaleString()}명, 정산 ${revenue.toLocaleString()}원입니다. 다음 앨범은 최소 30일 동안 준비해야 해요.`:`${name} 발매를 마쳤다. 팬 ${fans.toLocaleString()}명이 늘었고 정산은 ${revenue.toLocaleString()}원이었다. 다음 작품은 서두르지 않고 30일 동안 준비하기로 했다.`);closeModal();advance(1)
}
const endingStories={

 '스토커 살해 엔딩':[
  ['무시해 온 경고','인지도는 높아졌지만 위험 신호는 해결되지 않은 채 쌓였다. 같은 자리의 사람, 익명의 사진, 대기실 주변의 침입 기록은 모두 우연이 아니었다. 류현상은 팬을 의심하는 사람이 되고 싶지 않았고, 불편함을 대수롭지 않게 넘기려 했다.'],
  ['돌이킬 수 없는 밤','인지도 레벨 50을 달성한 공연이 끝난 뒤, 통제되지 않은 접근이 비극으로 이어졌다. 자세한 상황은 뉴스의 짧은 문장으로만 남았다. 후라보노는 반복해서 보냈던 경고 메시지를 바라보며 아무 말도 하지 못했다.'],
  ['남겨진 노래','류현상의 마지막 곡은 이후 안전한 공연 문화와 스토킹 범죄 예방을 촉구하는 상징이 되었다. 팬들은 그를 추억했지만, 어떤 인기와 친절도 개인의 경계를 침해할 권리가 될 수 없다는 사실을 뒤늦게 배웠다. 이 엔딩은 위험 신호를 무시한 결과를 기록한다.']
 ],
 '무명 가수 엔딩':[
  ['마지막 밤','365일째 밤, 류현상은 처음과 크게 다르지 않은 자취방에 앉아 있었다. 팬 숫자는 기대만큼 늘지 않았고, 통장 잔고는 늘 월세와 장비 수리비 사이를 아슬아슬하게 오갔다. 휴대전화 화면에는 조회 수가 두 자릿수인 영상과, 끝까지 들어 준 몇 사람의 댓글이 남아 있었다.\n\n그는 실패라는 단어를 떠올렸다. 스물여섯 살에 기획사를 잃었을 때도 같은 단어를 생각했다. 다만 이번에는 이상하게도 예전처럼 숨고 싶지 않았다.'],
  ['남아 있던 사람들','공원 벤치에는 늘 같은 자리에 앉던 노인이 있었고, 야간 근무를 마치고 들르던 편의점 직원이 있었으며, 비 오는 날 우산을 들고 끝까지 노래를 듣던 학생이 있었다. 세상을 뒤흔들 만큼 많은 사람은 아니었다. 하지만 현상의 노래가 필요한 사람은 분명 존재했다.\n\n후라보노는 조용히 말했다. “형, 유명하지 않아도 가수는 가수예요. 노래를 기다리는 사람이 한 명이라도 있으면요.”'],
  ['다시 첫 곡','현상은 다음 날에도 같은 공원으로 나갔다. 앰프를 연결하고 낡은 마이크 높이를 맞춘 뒤, 아주 처음 버스킹을 시작했던 곡을 불렀다. 관객은 세 명뿐이었다. 첫 소절이 끝났을 때 한 사람이 멈춰 섰고, 두 번째 소절에는 또 다른 사람이 휴대전화를 내려놓았다.\n\n류현상은 더 이상 숫자를 세지 않았다. 그의 음악은 작았지만 사라지지 않았다. 그렇게 그는 이름 없는 가수로, 그러나 포기하지 않은 사람으로 오래 노래했다.']
 ],
 '인디 가수 엔딩':[
  ['작은 공연장의 매진','365일째, 공연장 입구에는 손으로 인쇄한 매진 안내문이 붙었다. 객석은 크지 않았지만 모든 의자가 채워졌고, 관객들은 류현상의 노래를 처음부터 끝까지 따라 불렀다. 대형 기획사의 화려한 지원도, 방송국의 강한 조명도 없었다. 대신 이곳에는 그의 음악이 왜 필요한지 아는 사람들이 있었다.'],
  ['우리의 방식','P군은 기타 줄을 세 번 확인했고, L군은 짧게 “오늘 좋네요”라고 말했다. J군은 마지막 곡에 아무도 부탁하지 않은 우주적인 신시사이저를 넣었으며, R군은 소음 제한을 지키겠다고 약속한 뒤 정확히 첫 곡부터 약속을 잊었다.\n\n후라보노는 무대 뒤에서 정산표를 들고 투덜거렸지만, 누구보다 크게 웃고 있었다. 현상은 그제야 자신이 혼자 버티는 사람이 아니라 함께 음악을 만드는 사람이 되었다는 것을 깨달았다.'],
  ['오래 듣는 노래','공연이 끝난 뒤 한 팬이 말했다. “유명해져서 사라지지 말고, 지금처럼 오래 노래해 주세요.” 현상은 그 말이 이상하게 마음에 남았다. 더 큰 무대를 원하지 않는 것은 아니었다. 다만 크기보다 중요한 것이 무엇인지 이제는 알고 있었다.\n\n그의 앨범은 천천히 팔렸고, 공연은 작은 도시들을 따라 이어졌다. 류현상은 유행보다 오래 남는 노래를 만드는 인디 가수가 되었다.']
 ],
 '스타 가수 엔딩':[
  ['이름을 부르는 함성','1년 전, 공원에서 한 사람만 멈춰 세우자고 다짐했던 류현상 앞에 수천 명의 관객이 서 있었다. 대형 전광판에는 그의 이름이 떠 있었고, 무대 아래에서는 응원봉이 파도처럼 흔들렸다. 첫 음을 내기 직전 그는 이상할 만큼 조용한 마음으로 숨을 들이마셨다.'],
  ['성공 뒤의 무게','앨범은 차트 상위권에 올랐고 광고와 방송 제안이 쏟아졌다. 하지만 성공은 자유만 가져오지 않았다. 일정표는 군대 시절보다 촘촘했고, 작은 실수도 기사 제목이 되었다. 후라보노는 계약서를 들고 밤을 새웠고, 밴드 멤버들은 각자의 꿈과 팀의 방향 사이에서 수없이 대화해야 했다.\n\n현상은 그 모든 혼란 속에서도 무대에 오를 때만큼은 처음의 자신으로 돌아갔다.'],
  ['끝나지 않은 무대','앙코르가 끝난 뒤 현상은 관객에게 말했다. “저는 한 번 크게 망했고, 한 번 도망쳤습니다. 그래서 지금 여기 있는 게 더 믿기지 않습니다. 여러분이 멈춰 서서 제 노래를 들어 준 순간들이 저를 다시 살게 했습니다.”\n\n그날 이후 류현상은 성공한 스타로 불렸다. 그러나 그는 자신을 여전히 거리에서 첫 곡을 부르는 가수라고 생각했다. 무대의 크기만 달라졌을 뿐, 노래를 시작하는 마음은 변하지 않았다.']
 ],
 '월드 스타 엔딩':[
  ['세계 투어의 첫날','인지도 레벨 100. 서울에서 시작한 노래는 도쿄·방콕·파리·뉴욕의 공연장까지 이어졌다. 첫 해외 아레나 공연을 앞두고 전광판에는 여러 언어로 류현상의 이름이 떠올랐다. 후라보노는 무대 뒤에서 “형, 이제 진짜 월드스타예요.”라고 말했다. 현상은 긴장한 표정으로 안경을 고쳐 쓰며 대답했다. “발음부터 틀리면 바로 말해.”'],
  ['국경을 넘은 팀','P군의 기타가 첫 소절을 열고 L군의 베이스가 낯선 공연장을 단단히 채웠다. J군은 현지 오케스트라와 새로운 편곡을 만들었고 R군은 세계 어디서든 소음 기준과 싸웠다. 후라보노는 통역과 계약서를 오가며 팀을 지켰다. 관객들은 언어가 달라도 같은 후렴을 따라 불렀다. 류현상은 혼자였다면 결코 바다를 건너지 못했음을 인정했다.'],
  ['월드 스타 류현상','세계 투어 마지막 공연에서 수만 명의 관객이 서로 다른 억양으로 그의 이름을 불렀다. 무대 화면에는 폐업한 반지하 기획사, 군 복무 시절, 첫 공원 버스킹, 수원역과 명동의 바이럴 영상이 차례로 흘렀다. 그는 세계적인 스타가 되었지만 다음 날에도 호텔 책상에 앉아 새 곡의 첫 문장을 썼다. 더 넓은 세계는 결승점이 아니라 다시 노래를 시작할 장소였다.']
 ],
 '재기 엔딩':[
  ['다시 빈손','돈은 모두 사라졌고 남은 것은 오래된 마이크와 고장 직전의 앰프뿐이었다. 현상은 또다시 모든 것을 잃었다는 생각에 한참 동안 장비 가방을 열지 못했다. 기획사를 폐업하던 날의 공기와 군대로 도망치던 날의 침묵이 다시 떠올랐다.'],
  ['이번에는 도망치지 않는다','후라보노는 해결책 대신 따뜻한 음료 하나를 내려놓았다. “형, 이번에도 도망가면 평생 같은 장면이 반복될 것 같아요.” 현상은 그 말에 웃지도 화내지도 못했다. 다만 오래 침묵한 뒤 마이크를 꺼냈다.\n\n돈이 없어 앰프를 켤 수 없었기에 그는 맨목소리로 노래하기로 했다.'],
  ['가장 작은 재출발','공원에는 관객이 거의 없었다. 그러나 현상은 끝까지 한 곡을 불렀다. 노래가 끝났을 때 누군가 천 원짜리 한 장을 기타 케이스에 넣었다. 금액은 작았지만 그것은 새로운 시작을 위한 첫 수익이었다.\n\n류현상은 다시 무너졌지만 이번에는 군대로 숨지 않았다. 그는 자신이 가장 잘 아는 방식으로, 거리에서 다시 삶을 세우기 시작했다.']
 ]
};

// --- 2026 확장 시스템: 성격, 팬 반응, 스토커, 미니게임 ---
const statLabels={hp:'체력',vocal:'보컬',compose:'작곡',looks:'외모',fame:'인지도',fans:'팬',money:'돈',stress:'스트레스'};
const changeFields={
 hp:['체력',()=>state.stats.hp],vocal:['보컬',()=>state.stats.vocal],compose:['작곡',()=>state.stats.compose],looks:['외모',()=>state.stats.looks],fame:['인지도',()=>state.stats.fame],fans:['팬',()=>state.stats.fans],money:['돈',()=>state.stats.money],stress:['스트레스',()=>state.stats.stress],bandBond:['밴드 결속력',()=>state.band.bond],managerBond:['후라보노 관계',()=>state.manager.bond]
};
function snapshotStats(){return Object.fromEntries(Object.entries(changeFields).map(([k,[,get]])=>[k,get()]))}
function describeStatChanges(before){const parts=[];for(const [k,[label,get]] of Object.entries(changeFields)){const d=get()-(before[k]||0);if(d)parts.push(`${label} ${d>0?'+':''}${d.toLocaleString()}`)}return parts.length?`능력치 변화 · ${parts.join(' / ')}`:''}
const fanComments=[
 '현상 씨 목소리 듣고 오늘도 퇴근할 이유를 찾았습니다.','얼굴은 냉정한데 목소리는 왜 이렇게 다정한가요. 고소하겠습니다. 제 심장 훔친 죄로요.','장발이 바람에 날릴 때마다 제 인생 계획도 같이 날아갑니다.','안경 밀어 올리는 동작만으로 앙코르 가능한 사람 처음 봐요.','노래 한 곡 들었는데 제 통장도 팬클럽 가입비 낼 준비를 합니다.','형, 디지몬 얘기할 때만 눈이 반짝이는 거 너무 귀여워요.','오늘 고음에서 제 영혼이 디지털 월드까지 갔다 왔습니다.','무표정인데 팬서비스가 되는 건 반칙 아닌가요.','현상 씨가 까칠하게 “감사합니다” 할 때마다 수명이 늘어납니다.','노래 끝났는데 왜 제 심장은 아직 후렴구인가요.','류현상 존재 자체가 장르입니다.','오늘도 잘생김이 과로 중이네요.','저는 팬이 아니라 현상 씨 음악의 장기 구독자입니다.','마이크보다 제가 더 떨고 있습니다.','가수님이 숨 쉬었어요. 오늘 공연 레전드.'
];
const superFanComments=['현상 씨 공연 37번째입니다. 오늘도 같은 자리에서 봤어요.','집 벽 한 면을 류현상 사진으로 채웠습니다. 아직 천장은 비어 있어요.','오늘 입은 셔츠 지난달 14일 버스킹 때랑 같은 거죠?','현상 씨가 좋아하는 디지몬 진화 장면을 전부 정리해 왔어요.'];
dialogues.home.push('사람들과 잘 지내고 싶기는 하다. 다만 오늘은 아무도 말을 걸지 않았으면 좋겠다. 모순인 건 안다.','책상 한쪽에 오래된 디지몬 피규어를 세워 뒀다. 힘들 때 보면 이상하게 다시 시작할 마음이 든다.');
dialogues.store.push('친절하게 말하려고 했는데 목소리가 또 차갑게 나왔다. 다음 손님에게는 3퍼센트쯤 더 부드럽게 말해 보자.','디지몬 과자가 행사 중이다. 필요해서 보는 게 아니라 시장 조사를 하는 중이다.');
dialogues.practice.push('소리가 조금만 어긋나도 신경이 곤두선다. 그래도 사람에게 화내기 전에 문제를 설명하는 연습부터 하자.');
dialogues.park.push('팬에게 무뚝뚝하게 답하고 나서 뒤늦게 손을 흔들었다. 사회성은 타이밍이 가장 어렵다.');
dialogues.stage.push('예민함은 무대를 망치기도 하지만, 작은 소리까지 놓치지 않게 해 주기도 한다. 오늘은 후자로 쓰자.');
function pickFanComment(big=false){const pool=[...fanComments,...(big||Math.random()<.18?superFanComments:[])];return pick(pool)}
function trainingBaseGain(type){let gain=4;const eq=new Set(state.equippedInstruments||[]);if(type==='compose'){if(eq.has('acousticGuitar'))gain+=1;if(eq.has('keyboard'))gain+=2;if(eq.has('audioInterface'))gain+=1}else{if(eq.has('studioMic'))gain+=2;if(eq.has('monitorHeadphones'))gain+=1;if(eq.has('audioInterface'))gain+=1}return Math.min(7,gain)}
function scaledTrainingGain(type,raw){const v=state.stats[type];let rate=v<40?1:v<60?.8:v<80?.6:v<90?.4:v<95?.25:0;let gain=Math.floor(raw*rate);if(raw>0&&rate>0)gain=Math.max(1,gain);return gain}
function gainSkill(type,raw,source='general'){
 if(!['vocal','compose'].includes(type))return 0;
 const specialSources=new Set(['specialEvent','album','majorStage','endingReward']);
 const cap=specialSources.has(source)?100:95;
 const current=Number(state.stats[type]||0);
 if(current>=cap)return 0;
 let gain=Math.max(0,Math.floor(Number(raw)||0));
 if(source==='training')gain=scaledTrainingGain(type,gain);
 const actual=Math.min(gain,cap-current);
 if(actual<=0)return 0;
 stat(type,actual);
 return actual;
}
function trainingAction(type,hpCost){
 if(state.stats[type]>=95)return toast(`${trainingLabel(type)} 95 이상은 특별 이벤트·앨범·대형 무대로만 성장할 수 있습니다.`);
 if(!costHp(hpCost))return;
 const base=trainingBaseGain(type);
 if(Math.random()<.38){if(Math.random()<.5)startMemoryGame(type,base);else startReactionGame(type,base);return}
 const actual=gainSkill(type,base,'training');if(actual<=0)return toast(`${trainingLabel(type)} 95 이상은 특별 이벤트·앨범·대형 무대로만 성장할 수 있습니다.`);state.exp+=8;showDialogue('류현상',type==='vocal'?pickContextual(actionDialogue.vocal):pickContextual(actionDialogue.compose));toast(`${trainingLabel(type)} +${actual}`);advance(1)
}
function trainingLabel(type){return type==='vocal'?'보컬':'작곡'}
function finishTrainingResult(type,baseGain,success,reason,successText){const raw=success?Math.round(baseGain*1.5):baseGain;const gain=gainSkill(type,raw,'training');state.exp+=success?12:8;const fallbackText=reason==='closed'?'훈련 게임을 중간에 닫았다. 미니게임 보너스는 받지 못했지만 기본 훈련 능력치는 획득했다.':'제한 시간 안에 끝내지는 못했지만 기본 훈련 능력치는 획득했다.';showDialogue('류현상',success?successText:fallbackText);toast(`${trainingLabel(type)} +${gain}`);advance(1)}
function runTrainingCountdown(onStart){let n=3;const body=$('#modalBody');if(!body)return;const overlay=document.createElement('div');overlay.className='training-countdown';overlay.innerHTML=`<strong>${n}</strong><small>준비</small>`;body.appendChild(overlay);const tick=setInterval(()=>{n--;if(n>0){overlay.querySelector('strong').textContent=n;playSfx('tap');return}clearInterval(tick);overlay.querySelector('strong').textContent='START';overlay.querySelector('small').textContent='';setTimeout(()=>{overlay.remove();onStart()},450)},700);return()=>clearInterval(tick)}
function startMemoryGame(type,baseGain){
 memoryGameActive=true;const symbols=['♪','♫','♬','𝄞','♩','𝄢','♭','♯','𝄐','𝄫'];const cards=[...symbols,...symbols].sort(()=>Math.random()-.5);let first=null,lock=true,matched=0,time=60,timer=null,flipTimer=null,finished=false,countdownCancel=null;
 showModal(type==='vocal'?'보컬 리듬 훈련':'작곡 음표 훈련',`<div class="memory-head"><div><b>1분 안에 같은 음악기호 10쌍을 맞추세요.</b><small>3초 뒤 시작합니다. 중간에 닫으면 기본 능력치만 획득합니다.</small></div><span id="memoryTimer">대기</span></div><div id="memoryGrid" class="memory-grid">${cards.map((x,i)=>`<button class="memory-card" data-i="${i}" data-symbol="${x}" disabled>?</button>`).join('')}</div>`);
 const finish=(success,reason='time')=>{if(finished)return;finished=true;clearInterval(timer);if(flipTimer)clearTimeout(flipTimer);if(countdownCancel)countdownCancel();memoryGameActive=false;activeTrainingAbort=null;closeModal(true);finishTrainingResult(type,baseGain,success,reason,`제한 시간 안에 모든 음악기호를 맞췄다. ${trainingLabel(type)} 능력치를 1.5배 획득했다.`)};
 activeTrainingAbort=()=>finish(false,'closed');
 const bind=()=>{$$('.memory-card').forEach(btn=>{btn.disabled=false;btn.onclick=()=>{if(finished||lock||btn.disabled||btn===first)return;btn.textContent=btn.dataset.symbol;btn.classList.add('open');if(!first){first=btn;return}if(first.dataset.symbol===btn.dataset.symbol){first.disabled=btn.disabled=true;first.classList.add('matched');btn.classList.add('matched');first=null;matched+=2;if(matched===20)finish(true,'success')}else{lock=true;const prev=first;first=null;flipTimer=setTimeout(()=>{if(finished)return;prev.textContent=btn.textContent='?';prev.classList.remove('open');btn.classList.remove('open');lock=false},550)}}});lock=false;$('#memoryTimer').textContent='60초';timer=setInterval(()=>{time--;const el=$('#memoryTimer');if(el)el.textContent=`${time}초`;if(time<=0)finish(false,'time')},1000)};
 countdownCancel=runTrainingCountdown(bind)
}
function startReactionGame(type,baseGain){
 memoryGameActive=true;const symbols=['♪','♫','♬','𝄞','♩','♭','♯'];let hits=0,misses=0,time=20,finished=false,timer=null,spawnTimer=null,targetTimer=null,countdownCancel=null;
 showModal(type==='vocal'?'보컬 순발력 훈련':'작곡 순발력 훈련',`<div class="reaction-head"><div><b>빛나는 음표가 나타나면 빠르게 누르세요.</b><small>3초 뒤 시작합니다. 20초 안에 8번 성공하면 1.5배 보상입니다.</small></div><div class="reaction-score"><span id="reactionHits">성공 0 / 8</span><strong id="reactionTimer">대기</strong></div></div><div id="reactionArena" class="reaction-arena"><button id="reactionTarget" class="reaction-target hidden">♪</button><p id="reactionGuide">카운트다운 후 시작합니다.</p></div>`);
 const target=$('#reactionTarget'),guide=$('#reactionGuide');const update=()=>{if($('#reactionHits'))$('#reactionHits').textContent=`성공 ${hits} / 8 · 놓침 ${misses}`;if($('#reactionTimer'))$('#reactionTimer').textContent=`${time}초`};const clearGameTimers=()=>{clearInterval(timer);clearTimeout(spawnTimer);clearTimeout(targetTimer);if(countdownCancel)countdownCancel()};
 const finish=(success,reason='time')=>{if(finished)return;finished=true;clearGameTimers();memoryGameActive=false;activeTrainingAbort=null;closeModal(true);finishTrainingResult(type,baseGain,success,reason,`나타나는 음표를 빠르게 눌러 순발력 훈련을 성공했다. ${trainingLabel(type)} 능력치를 1.5배 획득했다.`)};
 const scheduleTarget=()=>{if(finished)return;spawnTimer=setTimeout(()=>{if(finished)return;target.textContent=pick(symbols);target.style.left=`${10+Math.random()*80}%`;target.style.top=`${12+Math.random()*72}%`;target.classList.remove('hidden');guide?.classList.add('hidden');targetTimer=setTimeout(()=>{if(finished||target.classList.contains('hidden'))return;target.classList.add('hidden');misses++;update();scheduleTarget()},950)},260+Math.floor(Math.random()*520))};
 target.onclick=()=>{if(finished||target.classList.contains('hidden'))return;clearTimeout(targetTimer);target.classList.add('hit');hits++;update();playSfx('tap');setTimeout(()=>{target.classList.remove('hit');target.classList.add('hidden');if(hits>=8)finish(true,'success');else scheduleTarget()},120)};activeTrainingAbort=()=>finish(false,'closed');
 countdownCancel=runTrainingCountdown(()=>{update();scheduleTarget();timer=setInterval(()=>{time--;update();if(time<=0)finish(hits>=8,hits>=8?'success':'time')},1000)})
}
function checkStalkerEvent(){
 const lv=fameLevel();if(lv<40||state.stats.looks<100||state.stalker.resolved)return false;
 if(!state.stalker.active){state.stalker.active=true;addHistory('🚨 스토커 핵심 사건 시작 · 반복적으로 같은 인물이 공연장에 나타났다.','stalker:start')}
 if(state.performanceCount%6!==0)return false;
 state.stalker.encounters++;const n=state.stalker.encounters;const helper=state.manager.hired?'후라보노':'경찰과 공연장 안전 담당자';
 const scenes=[
  ['같은 자리의 사람','최근 여섯 번의 공연마다 같은 사람이 정확히 같은 위치에 서 있었다. 공연이 끝나도 움직이지 않고 류현상의 장비를 바라봤다.',[[`${helper}에게 바로 알린다`,()=>{state.stalker.safety++;return state.manager.hired?'후라보노는 사진과 시간대를 기록하고 공연장 측에 공유했다. “형, 예민한 게 아니라 위험을 알아채는 겁니다.”':'류현상은 사진과 시간대를 기록해 경찰과 공연장 측에 공유했다. 불편함을 무시하지 않고 증거로 남겼다.'}],['열성 팬이라 생각하고 넘어간다',()=>{state.stalker.safety--;return '류현상은 불편함을 삼켰다. 하지만 다음 날 자취방 근처에서 같은 실루엣을 다시 봤다.'}]]],
  ['봉투 속 사진','대기실 앞에 봉투가 놓여 있었다. 안에는 멀리서 촬영한 류현상의 일상 사진과 “무대 밖의 형도 다 알고 있어요”라는 문장이 적혀 있었다.',[['경찰에 신고하고 동선을 바꾼다',()=>{state.stalker.safety++;return state.manager.hired?'후라보노는 즉시 신고하고 숙소와 이동 경로를 바꿨다. 팬들에게도 공식 안전 공지를 냈다.':'류현상은 즉시 신고하고 이동 경로를 바꿨다. 공연장 측도 출입 관리를 강화했다.'}],['팬을 자극하지 않으려고 숨긴다',()=>{state.stalker.safety--;return '사건을 숨긴 사이, 상대는 침묵을 허락으로 받아들인 듯 연락 횟수를 늘렸다.'}]]],
  ['무대 뒤의 침입','공연이 끝난 뒤 출입증이 없는 사람이 무대 뒤 복도에서 발견됐다. 그는 자신이 류현상과 특별한 사이라고 주장했다.',[['경호를 강화하고 접근금지를 요청한다',()=>{state.stalker.safety+=2;return '증거가 쌓이면서 접근금지 절차가 시작됐다. 류현상은 불편해도 안전을 우선하기로 했다.'}],['직접 만나 오해를 풀려고 한다',()=>{state.stalker.safety-=2;return state.manager.hired?'후라보노가 강하게 막았다. 상대는 직접 만나겠다는 말을 약속으로 왜곡해 온라인에 퍼뜨렸다.':'공연장 담당자가 만남을 막았지만, 상대는 류현상의 의도를 자신에게 유리하게 왜곡해 온라인에 퍼뜨렸다.'}]]]
 ];
 const scene=scenes[Math.min(n-1,scenes.length-1)];state.skipNextStory=true;
 const choices=scene[2].map(([label,fn])=>[label,()=>{let result=fn();addHistory(`🚨 스토커 사건 ${n}단계 · ${scene[0]} — ${label}`);if(state.stalker.safety>=3){state.stalker.resolved=true;state.stalker.active=false;state.milestones.stalkerResolved=true;addHistory('✅ 스토커 사건 해결 · 신고와 증거 확보로 안전을 되찾았다.','stalker:resolved');result+=' 충분한 증거와 신고 덕분에 스토커는 체포됐고, 류현상은 안전한 공연 환경을 되찾았다.'}state.skipNextStory=true;advance(1);return result}]);
 showDialogue('핵심 스토리 · 스토커',`【${scene[0]}】

${scene[1]}`,choices);return true
}
function getEndingChapters(name){
 const original=endingStories[name]||[['엔딩',`${name}에 도달했다. 류현상의 긴 여정은 여기서 하나의 결말을 맞았지만, 그의 노래는 끝나지 않았다.`]];const chapters=structuredClone(original);
 if(name==='무명 가수 엔딩'&&!state.manager.hired)chapters[1]=['남아 있던 사람들','공원 벤치에는 늘 같은 자리에 앉던 노인과, 야간 근무를 마치고 노래를 듣던 사람, 비 오는 날 우산을 들고 끝까지 남은 학생이 있었다. 세상을 뒤흔들 만큼 많은 사람은 아니었다. 그러나 류현상은 자신의 노래를 기다리는 사람이 한 명이라도 있다면 계속 부를 이유는 충분하다고 생각했다.'];
 if(name==='인디 가수 엔딩'&&!state.band.formed)chapters[1]=['혼자 만든 방식',`${state.manager.hired?'후라보노는 작은 공연 일정과 정산을 묵묵히 챙겼다. ':''}류현상은 정식 밴드 없이 세션 연주자들과 무대를 완성했다. 혼자 시작했지만 모든 일을 혼자 짊어질 필요는 없다는 사실을 배웠다. 화려하지 않아도 자신의 방식으로 오래 음악을 이어 갈 팀이 생겼다.`];
 if(name==='스타 가수 엔딩'&&(!state.manager.hired||!state.band.formed))chapters[1]=['성공 뒤의 무게',`앨범은 차트 상위권에 올랐고 광고와 방송 제안이 쏟아졌다. 하지만 성공은 자유만 가져오지 않았다. ${state.manager.hired?'후라보노는 계약서를 들고 밤을 새웠다.':'류현상은 전문 스태프를 새로 꾸려 계약과 일정을 배워 나갔다.'} ${state.band.formed?'밴드 멤버들과는 각자의 꿈과 팀의 방향을 두고 수없이 대화했다.':'공연마다 만나는 세션 연주자들과 호흡을 맞추며 혼자만의 무대가 아니라는 것을 인정했다.'}`];
 if(name==='재기 엔딩'&&!state.manager.hired)chapters[1]=['이번에는 도망치지 않는다','아무도 대신 해결책을 내놓지 않았다. 류현상은 오래 침묵한 뒤 스스로 마이크를 꺼냈다. 돈이 없어 앰프를 켤 수 없었기에 맨목소리로 노래하기로 했다. 이번에는 실패를 핑계로 어디에도 숨지 않기로 했다.'];
 if(name==='스토커 살해 엔딩'&&!state.manager.hired)chapters[1]=['돌이킬 수 없는 밤','인지도 레벨 50을 넘긴 공연이 끝난 뒤, 해결되지 않은 접근이 비극으로 이어졌다. 자세한 상황은 뉴스의 짧은 문장으로만 남았다. 공연 관계자들은 반복된 위험 신호를 더 일찍 공식 대응하지 못했다는 사실을 뒤늦게 후회했다.'];
 if(name==='월드 스타 엔딩'){const viral=[];if(state.specialEvents.iziViral)viral.push('수원역 응급실 커버 영상');if(state.specialEvents.waitedMoreViral)viral.push('명동 기다린만큼, 더 영상');const past=viral.length?viral.join('과 '):'첫 오디션과 방송, 직접 만든 앨범';chapters[2]=['월드 스타 류현상',`세계 투어 마지막 공연에서 수만 명의 관객이 서로 다른 억양으로 그의 이름을 불렀다. 무대 화면에는 폐업한 반지하 기획사, 군 복무 시절, 첫 공원 버스킹, ${past}이 차례로 흘렀다. 그는 세계적인 스타가 되었지만 다음 날에도 호텔 책상에 앉아 새 곡의 첫 문장을 썼다. 더 넓은 세계는 결승점이 아니라 다시 노래를 시작할 장소였다.`]}
 return chapters
}
function runEndingStory(name,restartAfter=false){
 enterEndingMusic(name);
 setChoiceLock(false);
 const chapters=getEndingChapters(name);
 let page=0;
 const draw=()=>{
  const [title,text]=chapters[page];
  showModal(name,`<div class="ending-story"><div class="ending-count">ENDING · ${page+1} / ${chapters.length}</div><h3>${title}</h3><p>${text.replace(/\\n/g,'<br>')}</p><div class="ending-nav"><button id="endingPrev" ${page===0?'disabled':''}>이전 장면</button><button id="endingNext" class="primary">${page===chapters.length-1?'엔딩을 마친다':'다음 장면'}</button></div></div>`);
  const prev=$('#endingPrev'),next=$('#endingNext');
  if(prev)prev.onclick=()=>{page--;draw()};
  if(next)next.onclick=()=>{if(page<chapters.length-1){page++;draw()}else{closeModal();if(restartAfter){const collected=[...new Set([...(state.endings||[]),name])];saveMetaEndings(collected);const storage=getStorage();if(storage)storage.removeItem('ryuGame');state=structuredClone(baseState);state.endings=collected;syncEndingCollection();toast(`${name}이 엔딩 컬렉션에 저장되었습니다. 새 이야기를 시작합니다.`);startPrologue()}else toast(`${name}의 이야기를 다시 읽었습니다.`)}};
 };
 draw();
}

function endingProfile(){
 const lv=fameLevel(),albums=state.albums.length,band=state.band.formed,bond=state.band.bond||0,overseas=state.fanGroups.overseas||0;
 if(lv>=100&&state.stats.vocal>=80&&state.stats.fans>=50000&&band&&bond>=75&&overseas>=3000)return ['월드 밴드 스타 엔딩','완전체 밴드와 높은 결속력, 해외 팬덤을 바탕으로 세계 무대에 진출했다.'];
 if(lv>=100&&state.stats.compose>=90&&albums>=2&&overseas>=2500)return ['월드 싱어송라이터 엔딩','자작곡과 앨범 성과, 해외 팬덤을 바탕으로 세계적인 싱어송라이터가 되었다.'];
 if(lv>=100&&state.stats.vocal>=95&&state.career.totalConcerts>=5&&state.stats.fans>=70000)return ['월드 솔로 보컬리스트 엔딩','압도적인 보컬과 대형 무대 경험으로 솔로 월드 스타가 되었다.'];
 if(band&&bond>=80&&state.performanceCount>=12&&state.stats.vocal>=75)return ['밴드 리더 엔딩','밴드 결속력과 공연 경험으로 팀의 중심이 되었다.'];
 if(state.stats.compose>=90&&albums>=2)return ['싱어송라이터 엔딩','높은 작곡 능력과 여러 장의 앨범으로 자신만의 음악 세계를 완성했다.'];
 if(state.stats.vocal>=95&&state.career.totalConcerts>=4)return ['라이브 보컬리스트 엔딩','최고 수준의 보컬과 라이브 경험으로 무대형 가수가 되었다.'];
 if(state.career.totalWork>=70&&lv<15&&albums===0)return ['편의점 점장 엔딩','생계를 지키는 동안 편의점 업무의 베테랑이 되었고 음악은 오래된 꿈으로 남았다.'];
 if(lv>=50&&state.stats.fans>=10000&&(state.stats.vocal>=65||state.stats.compose>=65))return ['스타 가수 엔딩','인지도뿐 아니라 실력과 팬덤을 갖춘 스타 가수가 되었다.'];
 if(lv>=10&&(albums>=1||state.performanceCount>=8))return ['인디 가수 엔딩','앨범 또는 꾸준한 공연 경력을 쌓아 독립 음악인으로 자리를 잡았다.'];
 return ['무명 가수 엔딩','큰 성공에는 닿지 못했지만 소수의 관객 앞에서 계속 노래하기로 했다.'];
}
function checkProgress(){
 const lv=fameLevel();state.level=lv;
 if(lv>=100)state.rank='월드 스타 후보';else if(lv>=50)state.rank='스타 가수';else if(lv>=10)state.rank='인디 가수';else state.rank='무명 가수';
 if(state.pendingEnding)return;
 const stalkerFatal=lv>=50&&state.stalker.active&&!state.stalker.resolved&&state.stalker.encounters>=3&&state.stalker.safety<3;
 if(stalkerFatal){offerEnding('스토커 살해 엔딩','세 차례의 위험 신호를 해결하지 못한 채 인지도 레벨 50을 넘겼고, 통제되지 않은 접근이 돌이킬 수 없는 결말로 이어졌다.');return}
 const world=endingProfile();
 const monthCycle=Math.floor((state.day-1)/30);
 const worldOfferKey=`world:${world[0]}:${monthCycle}`;
 if(world[0].startsWith('월드 ')&&!state.endingPrompted[worldOfferKey]){offerEnding(world[0],world[1],false,worldOfferKey);return}
 const year=Math.floor((state.day-1)/365)+1;
 const yearOfferKey=`year:${year}`;
 if(state.day>=365&&!state.endingPrompted[yearOfferKey]){offerEnding(world[0],`${year}년 차의 마지막 날이다. ${world[1]} 지금까지의 길을 엔딩으로 남기거나 다음 해를 계속 살아갈 수 있다.`,false,yearOfferKey);return}
 if((state.economy?.debt||0)>=1000000&&state.day>20&&(state.career.peakFame>=2000||state.stats.fame>=1000))offerEnding('재기 엔딩','한때 가능성을 확인했지만 큰 채무가 쌓였다. 음악을 포기할지, 장비 하나만 들고 다시 거리로 나갈지 선택해야 한다.')
}
function offerEnding(name,text,force=false,offerKey=name){if(state.endingPrompted[offerKey]&&!force)return;state.endingPrompted[offerKey]=true;state.pendingEnding={name,text,offerKey};save(false);displayPendingEnding()}
function displayPendingEnding(){if(!state.pendingEnding)return;const {name,text}=state.pendingEnding;showDialogue('운명의 선택',text,[['최종 엔딩을 본다',()=>{state.pendingEnding=null;unlockEnding(name);runEndingStory(name,true);return `${name}을 선택했다.`}],['계속 성장한다',()=>{state.pendingEnding=null;save(false);return '아직 끝내지 않는다. 더 높은 무대를 향해 계속 나아가기로 했다.'}]])}
function unlockEnding(name){if(!state.endings.includes(name)){state.endings.push(name);saveMetaEndings(state.endings);addHistory(`🏁 엔딩 해금 · ${name}`);save(false);toast(`${name} 해금!`)}}
function showModal(title,html){const modal=$('#modal');if(modal.open)modal.close();$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;modal.showModal()}
function closeModal(force=false){const modal=$('#modal');if(memoryGameActive&&!force){if(typeof activeTrainingAbort==='function'){activeTrainingAbort();return}memoryGameActive=false}if(modal.open)modal.close();if(endingMusicMode)exitEndingMusic()}
function getLocationDialoguePool(loc){
 if(loc!=='practice')return dialogues[loc].filter(line=>{if(!state.manager.hired&&/후라보노/.test(line))return false;const m=state.band.members;if(!m.guitar&&/P군/.test(line))return false;if(!m.bass&&/L군/.test(line))return false;if(!m.piano&&/J군/.test(line))return false;if(!m.drums&&/R군/.test(line))return false;return true});
 const members=Object.values(state.band.members).filter(Boolean);
 if(!members.length)return ['멤버가 없으니 오늘은 혼자 메트로놈과 싸워야 한다. 기계는 말대꾸를 안 해서 그나마 낫다.','빈 연습실은 조용했다. 류현상은 의자를 하나만 꺼내 놓고 혼자 보컬 루틴을 시작했다.','합주 이야기를 하기엔 아직 멤버가 없다. 오늘은 혼자서 곡의 빈칸을 채워 보기로 했다.'];
 if(members.length<4)return [`현재 합류한 멤버는 ${members.join('·')}이다. 아직 빈자리가 있지만 가능한 파트부터 천천히 맞춰 보기로 했다.`,`완전체 밴드는 아니지만 ${members.join('·')}와 기본 리듬을 확인했다. 없는 파트는 가이드 음원으로 채웠다.`,`연습실에는 ${members.length+1}명만 모였다. 류현상은 아직 오지 않은 멤버들의 자리를 상상하며 곡 구조를 정리했다.`];
 return dialogues.practice
}
function render(){
 $('#dayText').textContent=`${state.day}일차`;$('#timeText').textContent=`${['오전','오후','저녁','밤'][state.time]} · ${weatherLabel()}`;$('#levelText').textContent=fameLevel();$('#rankText').textContent=state.rank;
 const tops=[['♥ 체력','hp'],['♫ 보컬','vocal'],['✍ 작곡','compose'],['★ 인지도','fame']];$('#topStats').innerHTML=tops.map(([n,k])=>`<div class="stat-chip"><small>${n}</small><b>${k==='fame'?`${state.stats.fame.toLocaleString()} · Lv.${fameLevel()}`:state.stats[k].toLocaleString()}</b><div class="bar"><i style="width:${k==='fame'?fameLevel():Math.min(100,state.stats[k])}%"></i></div></div>`).join('');
 $('#resourceStats').innerHTML=[['돈',`${state.stats.money.toLocaleString()}원`],['채무',`${(state.economy.debt||0).toLocaleString()}원`],['팬',`${state.stats.fans.toLocaleString()}명`],['외모',state.stats.looks],['스트레스',state.stats.stress],['박칵스',`${state.items.bakcas}개`]].map(x=>`<div class="resource-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 $('#mobileResources').innerHTML=[['💰','돈',`${state.stats.money.toLocaleString()}원`],['💳','채무',`${(state.economy.debt||0).toLocaleString()}원`],['👥','팬',`${state.stats.fans.toLocaleString()}명`],['✨','외모',state.stats.looks],['☁','스트레스',state.stats.stress],['⚡','박칵스',`${state.items.bakcas}개`]].map(([icon,label,value])=>`<div class="mobile-resource-chip"><span class="mobile-resource-icon">${icon}</span><span class="mobile-resource-label">${label}</span><b>${value}</b></div>`).join('');
 $('#scheduleList').innerHTML=`<li>현재: ${locations[state.location].name}</li><li>날씨: ${weatherLabel()} · ${dayType()}</li><li>집: ${housingInfo[state.housing][0]}</li><li>밴드 결속력: ${state.band.bond}</li>${state.manager.hired?`<li>후라보노 관계: ${state.manager.bond}</li>`:'<li>매니저: 미고용</li>'}`;
 $('#missionBox').innerHTML=`<p>팬 3,000명 달성</p><div class="progress"><span style="width:${Math.min(100,state.stats.fans/30)}%"></span></div><p>첫 앨범 발매 ${state.albums.length?'완료':'미완료'}</p><p>라이벌 스토리 ${state.rival.stage}/5</p>`;
 const outfitImages=['outfit-black.png','outfit-white.png','outfit-check.png','outfit-leather.png','outfit-hoodie.png','outfit-stage.png','outfit-mystery.png'];const art=$('#characterArt');if(art){const src=`assets/images/${outfitImages[state.outfit||0]}`;if(!art.src.endsWith(src))art.src=src;}const scene=$('#scene');const specialKey=state.specialScene?.active?state.specialScene.key:null;const specialClassMap={iziViral:' special-izi-viral',waitedMoreViral:' special-waited-more-viral',day30Hair:' special-day30-hair',day60Workout:' special-day60-workout',day90Live:' special-day90-live',day120Chat:' special-day120-chat',day150Birthday:' special-day150-birthday',day180Archive:' special-day180-archive',day210Demo:' special-day210-demo',day240Meme:' special-day240-meme',day300Promise:' special-day300-promise',hiddenGameOst:' special-hidden-game-ost',hiddenRadioDj:' special-hidden-radio-dj',hiddenDingo:' special-hidden-dingo',mysteriousMerchant:' special-mysterious-merchant'};const specialLabelMap={iziViral:'수원역 · 특별 이벤트',waitedMoreViral:'명동 · 특별 이벤트',day30Hair:'자취방 · 30일 특별 이벤트',day60Workout:'자취방 · 60일 특별 이벤트',day90Live:'자취방 · 90일 특별 이벤트',day120Chat:'자취방 · 120일 특별 이벤트',day150Birthday:'생일 파티 · 150일 특별 이벤트',day180Archive:'자취방 · 180일 특별 이벤트',day210Demo:'연습실 · 210일 특별 이벤트',day240Meme:'자취방 · 240일 특별 이벤트',day300Promise:'공연장 · 300일 특별 이벤트',hiddenGameOst:'카페 · 게임 OST 특별 이벤트',hiddenRadioDj:'라디오 스튜디오 · 특별 이벤트',hiddenDingo:'딩고 스튜디오 · 특별 이벤트',mysteriousMerchant:'이름 없는 골목 · 수상한 상인'};const specialClass=specialKey?(specialClassMap[specialKey]||''):'';scene.className=`scene ${locations[state.location].cls} outfit-${state.outfit||0}${specialClass}`;scene.dataset.time=state.time;scene.style.setProperty('--spark-opacity',state.location==='stage'?'.58':state.location==='park'?'.46':'.32');bindScenePointer();$('#gameScreen').classList.toggle('story-lock',!!specialClass);$('#locationLabel').textContent=specialKey?(specialLabelMap[specialKey]||locations[state.location].name):locations[state.location].name;const basePool=getLocationDialoguePool(state.location);const d=state.dialogue||{name:'류현상',text:pick(basePool)};displayDialogue(d.name,d.text);if(state.pendingEnding)setTimeout(displayPendingEnding,0);
 const locationMarkup=Object.entries(locations).map(([k,v])=>`<button data-loc="${k}" class="${state.location===k?'active':''}" aria-pressed="${state.location===k}">${v.name}</button>`).join('');
 $('#locationButtons').innerHTML=locationMarkup;
 $('#mobileLocationButtons').innerHTML=locationMarkup;
 $('#mobileLocationText').textContent=`현재: ${locations[state.location].name}`;
 $$('[data-loc]').forEach(b=>b.onclick=()=>{
   const next=b.dataset.loc;
   if(next===state.location){toast(`현재 ${locations[next].name}에 있습니다.`);return;}
   state.location=next;state.lastAction='move';
   state.dialogue={name:'류현상',text:pick(getLocationDialoguePool(next))};
   state.time+=1;while(state.time>=4){state.time-=4;state.day++;dailyTick()}checkProgress()
   save(false);
   playSfx('move');toast(`${locations[next].name}으로 이동했습니다.`);
   render();
 });
 $('#actionButtons').innerHTML=actions[state.location].map(([n,d,k])=>`<button class="action-card" data-action="${k}"><b>${n}</b><small>${d}</small></button>`).join('');$$('[data-action]').forEach(b=>b.onclick=()=>doAction(b.dataset.action));
}
function openFanCommunity(){const total=Object.values(state.fanGroups).reduce((a,b)=>a+b,0);showModal('팬 커뮤니티',`<div class="fan-group-grid"><div class="metric-card"><small>일반 팬</small><b>${state.fanGroups.regular.toLocaleString()}명</b></div><div class="metric-card"><small>열혈 팬</small><b>${state.fanGroups.enthusiast.toLocaleString()}명</b></div><div class="metric-card"><small>게이 팬</small><b>${state.fanGroups.gay.toLocaleString()}명</b></div><div class="metric-card"><small>해외 팬</small><b>${state.fanGroups.overseas.toLocaleString()}명</b></div></div><div class="info-card"><b>팬 유형 안내</b><p>팬 유형은 우열이나 능력치가 아니라 팬덤의 다양성을 보여 주는 분류입니다. 게이 팬은 희화화하지 않고 개별 취향과 전문성을 지닌 팬으로 등장합니다.</p><small>분류된 팬 ${total.toLocaleString()}명 / 전체 팬 ${state.stats.fans.toLocaleString()}명</small></div>`)}
function openSNS(){const canPost=state.day!==state.sns.lastPostDay;showModal('SNS',`<div class="info-card"><b>팔로워·팬 ${state.stats.fans.toLocaleString()}명</b><p>오늘의 짧은 게시물을 올리면 다양한 반응이 발생합니다. 하루에 한 번만 직접 게시할 수 있습니다.</p><button id="snsPost" ${canPost?'':'disabled'}>${canPost?'게시물 올리기':'오늘 게시 완료'}</button></div><div class="card-list">${snsScenarios.slice(0,6).map(x=>`<div class="info-card"><b>${x.title}</b><p>${x.text}</p></div>`).join('')}</div>`);const b=$('#snsPost');if(b)b.onclick=()=>{if(!canPost)return;const ev=pick(snsScenarios);state.sns.lastPostDay=state.day;state.sns.totalPosts++;const before=snapshotStats();stat('fans',ev.fans);stat('fame',ev.fame);stat('stress',ev.stress);addHistory(`📱 SNS 게시 · ${ev.title}`,`sns-post:${state.day}`);closeModal();showDialogue('SNS 반응',`【${ev.title}】\n\n${ev.text}`);const changes=describeStatChanges(before);if(changes)setTimeout(()=>toast(changes),250);advance(1)}}
function openItemMenu(){
 const empty=state.items.bakcas<1;
 const dailyLimit=state.items.bakcasUsedToday>=2;
 const fullHp=state.stats.hp>=100;
 const disabled=empty||dailyLimit||fullHp;
 const reason=empty?'보유한 박칵스가 없습니다.':dailyLimit?'오늘 사용 횟수를 모두 소진했습니다.':fullHp?'체력이 이미 최대입니다.':'첫 사용은 체력 25, 두 번째 사용은 체력 20을 회복합니다.';
 showModal('아이템',`<div class="info-card item-use-card"><b>⚡ 박칵스</b><p>보유 <strong>${state.items.bakcas}개</strong> · 오늘 <strong>${state.items.bakcasUsedToday}/2회</strong> 사용 · 현재 체력 <strong>${state.stats.hp}/100</strong></p><p>${reason}</p><button id="useBakcasFromItems" class="primary wide" ${disabled?'disabled':''}>박칵스 사용</button></div>`);
 const button=$('#useBakcasFromItems');if(button)button.onclick=()=>useBakcas(true)
}
function openPhone(type){if(type==='manager')managerEvent();if(type==='band')showBand();if(type==='fan')openFanCommunity();if(type==='sns')openSNS();if(type==='items')openItemMenu()}
function showBand(){showModal('밴드 멤버',Object.entries(state.band.members).map(([k,v])=>`<div class="info-card"><b>${k.toUpperCase()}</b><p>${v||'공석'}</p></div>`).join('')+`<p>결속력: ${state.band.bond}</p>`)}
$('#newGameBtn').onclick=()=>{const collected=loadMetaEndings();state=structuredClone(baseState);state.endings=collected;startPrologue()};
$('#continueBtn').onclick=()=>{if(!load())return toast('저장된 게임이 없습니다.');$('#titleScreen').classList.remove('active');$('#gameScreen').classList.add('active');render()};
$('#howBtn').onclick=()=>showModal('게임 설명','<p>류현상을 연습시키고 버스킹 장비를 구입해 팬과 인지도를 늘리세요. 파트별 조건을 충족해 멤버 오디션을 진행하고 완전체 밴드를 결성한 뒤에는 솔로 버스킹만 반복하지 말고 합주와 밴드 공연으로 결속력을 관리해야 합니다. 인지도 Lv.20부터 후라보노를 고용할 수 있으며, 고용하면 방송과 주요 이벤트가 열립니다. 인지도 Lv.31 이상부터는 류현상이 가끔 성공에 취해 꺼드럭대고 후라보노가 제지하는 선택형 스토리가 발생합니다. 날씨·평일·주말·공휴일에 따라 버스킹 성공률과 체력 소모, 장비 고장 확률이 달라지며 방수·전원 보호 케이스로 더 낮출 수 있습니다. 팬은 활동과 이벤트로 늘지만 논란·무성의한 대응·반복되는 공연으로 감소할 수도 있습니다. 인지도 100마다 레벨이 오릅니다. 오디션·공연·방송은 7일, 앨범은 30일의 준비 기간이 필요합니다. 월드 엔딩은 밴드·싱어송라이터·솔로 보컬의 세 경로가 있으며, 인지도뿐 아니라 실력·앨범·공연·해외 팬·결속력이 함께 평가됩니다. 인지도 성장에 따라 라이벌 카인 스토리가 이어지며, 휴대전화에서 팬 유형과 SNS를 확인할 수 있습니다. 악기는 최대 3개만 장착할 수 있고, 능력치 40 이상부터는 훈련 성장 속도가 점차 둔화됩니다.</p>');
$('#closeModal').onclick=()=>closeModal();$('#modal').addEventListener('cancel',e=>{if(memoryGameActive){e.preventDefault();closeModal()}});$('#audioBtn').onclick=openAudioSettings;$('#menuBtn').onclick=()=>showModal('메뉴','<div class="card-list"><button id="manualSave">수동 저장</button><button id="backTitle">타이틀로 돌아가기</button></div>');
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});
$$('[data-phone]').forEach(b=>b.onclick=()=>openPhone(b.dataset.phone));
$$('[data-tab]').forEach(b=>b.onclick=()=>{const t=b.dataset.tab;$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));if(t==='band')showBand();if(t==='album')openAlbum();if(t==='shop')openGear();if(t==='ending'){showModal('엔딩 컬렉션',state.endings.length?state.endings.map(x=>`<button class="info-card ending-replay" data-ending-replay="${x}"><b>${x}</b><small>다시 읽기</small></button>`).join(''):'아직 해금된 엔딩이 없습니다.');$$('[data-ending-replay]').forEach(x=>x.onclick=()=>runEndingStory(x.dataset.endingReplay));}if(t==='story')showModal('스토리 기록',state.history.length?`<div class="card-list story-history-list">${[...state.history].reverse().map(x=>`<div class="info-card story-history-item">${x}</div>`).join('')}</div>`:'류현상의 이야기는 이제 시작입니다.')});
document.addEventListener('click',e=>{if(e.target&&e.target.id==='manualSave'){save();closeModal()}if(e.target&&e.target.id==='backTitle'){save(false);setChoiceLock(false);exitEndingMusic();$('#gameScreen').classList.remove('active');$('#titleScreen').classList.add('active');closeModal()}});

document.addEventListener('click',e=>{
 if(!choiceLock)return;
 const target=e.target;
 const allowed=target.closest?.('#choiceArea, #menuBtn, #manualSave, #backTitle');
 if(allowed)return;
 e.preventDefault();e.stopImmediatePropagation();
 toast('먼저 선택지를 골라야 합니다. 수동 저장과 타이틀 이동만 가능합니다.');
},true);

loadAudioSettings();
const unlockAudio=()=>{ensureAudio();document.removeEventListener('pointerdown',unlockAudio);document.removeEventListener('keydown',unlockAudio)};
document.addEventListener('pointerdown',unlockAudio,{once:true});document.addEventListener('keydown',unlockAudio,{once:true});
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#toggleBgm,#toggleSfx,#audioBtn'))playSfx('click')});
const installBtn=$('#installBtn'),installHint=$('#installHint');
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const isMobileDevice=()=>/android|iphone|ipad|ipod/i.test(navigator.userAgent)||window.matchMedia('(max-width: 720px)').matches;
function refreshInstallUi(){
 if(!installBtn)return;
 if(isStandalone()){installBtn.classList.add('hidden');installHint?.classList.add('hidden');return;}
 if(isMobileDevice()){installBtn.classList.remove('hidden');installHint?.classList.remove('hidden');}
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;refreshInstallUi()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;refreshInstallUi();toast('홈 화면에 앱이 설치되었습니다.')});
if(installBtn)installBtn.onclick=async()=>{
 if(isStandalone())return toast('이미 앱으로 설치되어 있습니다.');
 if(deferredPrompt){
   deferredPrompt.prompt();
   await deferredPrompt.userChoice;
   deferredPrompt=null;
   refreshInstallUi();
   return;
 }
 if(isIos()){
   showModal('아이폰·아이패드에 설치',`<div class="card-list"><div class="info-card"><b>Safari에서 설치하는 방법</b><p>1. 화면 아래의 <strong>공유 버튼(□↑)</strong>을 누릅니다.<br>2. 메뉴를 내려 <strong>홈 화면에 추가</strong>를 선택합니다.<br>3. 오른쪽 위 <strong>추가</strong>를 누르면 앱처럼 실행할 수 있습니다.</p></div><div class="info-card"><small>카카오톡·인스타그램 내부 브라우저에서는 메뉴가 보이지 않을 수 있습니다. 주소를 Safari로 열어 주세요.</small></div></div>`);
 }else{
   showModal('모바일 앱 설치 안내',`<div class="card-list"><div class="info-card"><b>Chrome에서 설치하는 방법</b><p>브라우저 오른쪽 위 <strong>⋮ 메뉴</strong>를 누른 뒤 <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 선택하세요.</p></div><div class="info-card"><small>설치 항목이 없다면 GitHub Pages 주소를 Chrome에서 직접 열고 페이지를 한 번 새로고침해 주세요.</small></div></div>`);
 }
};
refreshInstallUi();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('service-worker.js?v=40.1',{updateViaCache:'none'});await reg.update();refreshInstallUi()}catch(err){console.warn('서비스워커 등록 실패',err);refreshInstallUi()}});


/* v36: iOS standalone PWA viewport synchronization */
(function setupIOSViewportFix(){
  const update=()=>{
    const height=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;
    if(height>0)document.documentElement.style.setProperty('--app-viewport-height',`${Math.round(height)}px`);
  };
  update();
  window.addEventListener('resize',update,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(update,120),{passive:true});
  window.addEventListener('pageshow',update,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(update,60)});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',update,{passive:true});
})();

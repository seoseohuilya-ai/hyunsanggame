const CACHE='ryu-hyunsang-v88-suspicious-shop-collector-wedding';
const CORE=['./','index.html?ver=88','index.html','style.css?v=88-suspicious-shop-collector-wedding','game.js?v=88-suspicious-shop-collector-wedding','manifest.json','assets/images/ryu.png','assets/images/hurabono.png','assets/images/cover.png','assets/images/home-bg.jpg','assets/images/home-basement.png','assets/images/home-oneroom.png','assets/images/home-duplex.png','assets/images/home-apartment.png','assets/images/home-penthouse.png','assets/images/store-bg.jpg','assets/images/practice-bg.jpg','assets/images/park-bg.jpg','assets/images/stage-bg.jpg','assets/images/izi-suwon-viral.jpg','assets/images/waited-more-myeongdong-viral.jpg','assets/images/special-day150-birthday.jpg','assets/images/hidden-dingo-rising.png','assets/images/hidden-radio-dj.png','assets/images/hidden-game-ost.jpg','assets/images/special-day120-kakaotalk.jpg','assets/images/special-day90-live.jpg','assets/images/special-day60-workout.jpg','assets/images/special-day30-hair.jpg','assets/images/special-day180-user.png','assets/images/special-day210-user.png','assets/images/special-day240-user.png','assets/images/special-day300-user.png','assets/images/outfit-black.png','assets/images/outfit-white.png','assets/images/outfit-check.png','assets/images/outfit-leather.png','assets/images/outfit-hoodie.png','assets/images/outfit-stage.png','assets/images/outfit-mystery.png','assets/images/mysterious-merchant.png','assets/images/special-card-collector.png','assets/images/special-hurabono-wedding.png','assets/images/ryu-dot.png','assets/icons/icon-192.png','assets/icons/icon-512.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith((async()=>{try{const fresh=await fetch(event.request,{cache:'no-store'});const cache=await caches.open(CACHE);cache.put(event.request,fresh.clone()).catch(()=>{});return fresh;}catch(err){return (await caches.match(event.request))||(await caches.match('./'));}})());});


// v74: buying Bakcas no longer changes stress; action notice de-duplication remains enabled.

// v76: location moves remain free, but arriving at a new place checks location-based surprise stories.

// v77: mysterious merchant chance reduced slightly from 0.2% to 0.15%.

// v78: forced rest 50/15, free snack/single lotto, weekly lotto cap, job stages, daily hair care, concert cap and minigame, vocal/fame busking income.

// v79: snack/lottery time-stress adjustments, louder BGM, gear-based busking income, concert-gated rehearsal, and 5 housing backgrounds from user references.

// v80: daily practice penalty changed to -1 per five consecutive days without vocal or compose/arrange training.

// v81: clears old notifications at minigame start, suppresses duplicate action notices, and moves any new toast to a compact top banner.

// v82: full gain/loss action summaries, clearer one-screen stats, and visible cash balance in gear shop.

// v83: short-term practice penalty changed from every 5 missed days to every 7 missed days; old saves migrate without duplicate penalties.

// v84: moving home now requires a Yes/No confirmation before payment and time advancement.

// v85: appearance drops by 1 every 30 days without paid hair/style care; existing saves initialize safely.

// v86: SNS rewards scale with fan count; nightmares use 5+ rests, 3-rest cooldown and 20%; training/busking minigame rates halved; stat changes shown in dialogue; successful busking/concert grants vocal +1; meal cost doubles by housing and upgraded homes recover +3 more HP.

// v87: keep exactly one stat-change block in the dialogue and replace partial results with the latest final result.

// v88: suspicious shop, energizer, adjusted merchant/lottery odds, card collector events, theft follow-up, and Hurabono wedding special event.

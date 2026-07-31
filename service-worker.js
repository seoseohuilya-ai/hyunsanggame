const CACHE='ryu-hyunsang-v106-clean-drawer-photos';
const CORE=['./','index.html?ver=106','index.html','style.css?v=106-clean-drawer-photos','game.js?v=106-clean-drawer-photos','manifest.json','assets/images/ryu.png','assets/images/hurabono.png','assets/images/cover.png','assets/images/home-bg.jpg','assets/images/home-basement.png','assets/images/home-oneroom.png','assets/images/home-duplex.png','assets/images/home-apartment.png','assets/images/home-penthouse.png','assets/images/store-bg.jpg','assets/images/practice-bg.jpg','assets/images/park-bg.jpg','assets/images/stage-bg.jpg','assets/images/izi-suwon-viral.jpg','assets/images/waited-more-myeongdong-viral.jpg','assets/images/special-day150-birthday.jpg','assets/images/hidden-dingo-rising.png','assets/images/hidden-radio-dj.png','assets/images/hidden-game-ost.jpg','assets/images/special-day120-kakaotalk.jpg','assets/images/special-day90-live.jpg','assets/images/special-day60-workout.jpg','assets/images/special-day30-hair.jpg','assets/images/special-day180-user.png','assets/images/special-day210-user.png','assets/images/special-day240-user.png','assets/images/special-day300-user.png','assets/images/special-day330-mother.png','assets/images/special-day360-reflection.png','assets/images/special-career-lv70.png','assets/images/special-career-lv80.png','assets/images/special-career-lv90.png','assets/images/outfit-black.png','assets/images/outfit-white.png','assets/images/outfit-check.png','assets/images/outfit-leather.png','assets/images/outfit-hoodie.png','assets/images/outfit-stage.png','assets/images/outfit-mystery.png','assets/images/mysterious-merchant.png','assets/images/special-card-collector.png','assets/images/special-hurabono-wedding.png','assets/images/drawer-photo-1.jpg','assets/images/drawer-photo-2.jpg','assets/images/drawer-photo-3.jpg','assets/images/drawer-photo-4.jpg','assets/images/drawer-photo-5.jpg','assets/images/ryu-dot.png','assets/icons/icon-192.png','assets/icons/icon-512.png'];
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

// v89: image-backed special events hide character layers; card and lottery purchases consume HP (1 / 5).

// v90: energizer reduces HP costs to one quarter for seven days.

// v91: energizer descriptions now explicitly state rounding up and minimum HP cost of 1.

// v92: diet pill appearance outcomes are -1 at 1%, no change at 98%, and +1 at 1%.

// v93: diet pill price is 100,000 won; taking energizer three or more times before the effect expires causes 1.5x HP costs for seven days.

// v94: added home meditation, usable twice per day with no money or time cost, reducing stress by 5.

// v95: simplified suspicious-shop product descriptions for the diet pill and energizer.

// v96: added long 330-day mother visit and 360-day one-year reflection special events with background-only user images.
// v97: replaced Lv.70/Lv.80/Lv.90 career milestone special-event backgrounds with user images and background-only scenes.

// v98: reset the dialogue box scroll position to the top whenever a new dialogue scene is rendered.

// v99: dialogue body text is 1pt larger while the dialogue box size remains unchanged.

// v100: full 11-ending overhaul with balanced year-end paths, exact world-star/card-shop requirements, 30-day bankruptcy, and Lv.40-50 stalker resolution.

// v101: fixed busking runtime HP error, added 1% walk Bakcas and busking Energizer inventory rewards with blocking confirmation, and raised mysterious merchant chance to 0.9%.

// v102: added interactive Instagram Live phone UI with ten random long-chat scenarios, choices, fan reactions, daily limits, and influencer-ending activity integration.

// v103: persistent dialogue overflow indicator and focused choices in a separate blocking decision dialog.

// v104: added the home drawer collection with 5 nine-piece photo puzzles, 50 contextual diaries, pity systems, new-item badges, and no time/stat cost.

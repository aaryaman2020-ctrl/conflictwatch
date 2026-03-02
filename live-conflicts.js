// CONFLICTWATCH -- Enhanced Live Conflict Intelligence
// Sources: GDELT Project, ISW, ACLED, HRW, Reuters, Al Jazeera, Critical Threats
// Data as of: 2026-03-02
// Covers all major active conflict zones with weapon types, attack categories, and operational details

window.ATTACK_CATEGORIES = {
  'Airstrike': { icon: '✈️', color: '#ef4444', desc: 'Fixed-wing aircraft strikes' },
  'Missile Strike': { icon: '🚀', color: '#dc2626', desc: 'Ballistic/cruise missile attacks' },
  'Drone Strike': { icon: '🎯', color: '#f97316', desc: 'UAV/drone-delivered munitions' },
  'Artillery': { icon: '💥', color: '#eab308', desc: 'Artillery/mortar shelling' },
  'Ground Assault': { icon: '⚔️', color: '#a855f7', desc: 'Infantry/armor ground operations' },
  'Naval': { icon: '🚢', color: '#3b82f6', desc: 'Naval operations/maritime attacks' },
  'IED/VBIED': { icon: '💣', color: '#78716c', desc: 'Improvised explosive devices' },
  'Suicide Attack': { icon: '⚠️', color: '#991b1b', desc: 'Suicide bombings/attacks' },
  'Cyber/EW': { icon: '📡', color: '#06b6d4', desc: 'Cyber attacks/electronic warfare' },
  'CBRN': { icon: '☢️', color: '#7c3aed', desc: 'Chemical/radiological threats' }
};

window.WEAPON_SYSTEMS = {
  // Missiles
  'Iskander-M': { type: 'Ballistic Missile', origin: 'Russia', range: '500km', warhead: '700kg' },
  'Kh-101': { type: 'Cruise Missile', origin: 'Russia', range: '4,500km', warhead: '400kg' },
  'Emad': { type: 'Ballistic Missile', origin: 'Iran', range: '1,700km', warhead: '750kg' },
  'Ghadr': { type: 'Ballistic Missile', origin: 'Iran', range: '1,950km', warhead: '650kg' },
  'Samad-3': { type: 'Cruise Drone', origin: 'Yemen/Houthi', range: '1,500km', warhead: 'varies' },
  'JDAM': { type: 'Guided Bomb', origin: 'USA', range: '28km', warhead: '450kg' },
  'GBU-39 SDB': { type: 'Small Diameter Bomb', origin: 'USA', range: '110km', warhead: '17kg' },
  'JASSM-ER': { type: 'Cruise Missile', origin: 'USA', range: '1,000km', warhead: '450kg' },
  'Tomahawk': { type: 'Cruise Missile', origin: 'USA', range: '2,500km', warhead: '450kg' },
  // Drones
  'Shahed-136': { type: 'Loitering Munition', origin: 'Iran', range: '2,500km', warhead: '50kg' },
  'Bayraktar TB2': { type: 'Combat UAV', origin: 'Turkey', range: '150km', warhead: 'MAM-L/MAM-C' },
  'Bayraktar Akinci': { type: 'Combat UCAV', origin: 'Turkey', range: '300km', warhead: 'various' },
  'MQ-9 Reaper': { type: 'Combat UAV', origin: 'USA', range: '1,850km', warhead: 'Hellfire/GBU' },
  'Wing Loong II': { type: 'Combat UAV', origin: 'China', range: '200km', warhead: 'various' },
  'CH-4': { type: 'Combat UAV', origin: 'China', range: '250km', warhead: 'AR-1/FT-9' },
  'FPV Drone': { type: 'First-Person-View', origin: 'Various', range: '10km', warhead: 'RPG/grenade' },
  'Fiber-Optic Drone': { type: 'Guided FPV', origin: 'Russia', range: '20km', warhead: 'shaped charge' },
  // Aircraft
  'F-35I Adir': { type: 'Stealth Fighter', origin: 'Israel/USA', range: '2,200km', warhead: 'various' },
  'F-15I Ra\'am': { type: 'Strike Fighter', origin: 'Israel/USA', range: '3,450km', warhead: 'various' },
  'B-2 Spirit': { type: 'Stealth Bomber', origin: 'USA', range: '11,000km', warhead: '23,000kg' },
  'JF-17 Thunder': { type: 'Multirole Fighter', origin: 'Pakistan/China', range: '1,352km', warhead: 'various' },
  'F-16': { type: 'Multirole Fighter', origin: 'USA', range: '4,220km', warhead: 'various' },
  'Su-34': { type: 'Strike Fighter', origin: 'Russia', range: '4,000km', warhead: 'various' },
  // Air Defense
  'FK-2000': { type: 'Air Defense', origin: 'China', range: '25km', warhead: 'SAM' },
  'Pantsir-S1': { type: 'Air Defense', origin: 'Russia', range: '20km', warhead: 'SAM/AAA' },
  'Iron Dome': { type: 'Air Defense', origin: 'Israel', range: '70km', warhead: 'Interceptor' },
  'Arrow-3': { type: 'ABM System', origin: 'Israel/USA', range: '2,400km', warhead: 'KV' },
  'THAAD': { type: 'ABM System', origin: 'USA', range: '200km', warhead: 'KV' }
};

window.LIVE_CONFLICT_DATA = [

  // ============================================================
  // US-ISRAEL vs IRAN (Feb 28, 2026 - Operation Epic Fury / Roaring Lion)
  // ============================================================
  {
    name: "Tehran -- Nuclear & Military Sites",
    lat: 35.75, lng: 51.515,
    count: 1637, articles: 61812,
    severity: "critical",
    attackTypes: ["Airstrike", "Missile Strike"],
    weapons: ["B-2 Spirit", "Tomahawk", "JASSM-ER", "F-35I Adir", "JDAM"],
    description: "US & Israeli joint strikes on Iranian nuclear facilities, military HQ, and leadership targets. Operation codenamed Roaring Lion (Israel) / Epic Fury (US). Supreme Leader Khamenei assassinated. 200+ Israeli jets deployed.",
    casualties: "Unknown -- heavy military & infrastructure damage",
    dailyActivity: [
      { date: "2026-02-28", event: "Joint US-Israeli airstrikes begin 9:45AM IRST. B-2 stealth bombers, F-35s, cruise missiles hit Tehran, Isfahan, Natanz, Fordow." },
      { date: "2026-02-28", event: "Iranian retaliation: ~35 Emad & Ghadr ballistic missiles fired at Israel and 14 US military bases in region." },
      { date: "2026-03-01", event: "Continued strikes on missile launchers in western Iran. IDF reports 'hundreds of military sites' targeted." }
    ],
    region: "Middle East", country: "Iran", countryCode: "IR",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://understandingwar.org/research/middle-east/iran-update-special-report-us-and-israeli-strikes-february-28-2026/", "https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran"]
  },
  {
    name: "Isfahan -- Nuclear Enrichment Complex",
    lat: 32.65, lng: 51.68,
    count: 980, articles: 28500,
    severity: "critical",
    attackTypes: ["Airstrike", "Missile Strike"],
    weapons: ["B-2 Spirit", "GBU-57 MOP", "Tomahawk"],
    description: "Strikes on Isfahan nuclear technology center. Massive Ordnance Penetrator (MOP) bunker-busters deployed by B-2s against hardened underground facilities.",
    casualties: "Military casualties reported, extent unknown",
    dailyActivity: [
      { date: "2026-02-28", event: "B-2 Spirit bombers deliver GBU-57 MOP bunker-busters on underground enrichment halls." },
      { date: "2026-02-28", event: "Tomahawk cruise missiles strike above-ground support infrastructure." }
    ],
    region: "Middle East", country: "Iran", countryCode: "IR",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran"]
  },
  {
    name: "Natanz -- Uranium Enrichment Facility",
    lat: 33.72, lng: 51.73,
    count: 820, articles: 22000,
    severity: "critical",
    attackTypes: ["Airstrike", "Missile Strike"],
    weapons: ["B-2 Spirit", "GBU-57 MOP", "JASSM-ER"],
    description: "Major underground enrichment facility targeted with penetrating munitions. Key target of US nuclear prevention campaign.",
    casualties: "Unknown",
    dailyActivity: [
      { date: "2026-02-28", event: "Multiple waves of strikes on underground centrifuge halls. Assessment ongoing." }
    ],
    region: "Middle East", country: "Iran", countryCode: "IR",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran"]
  },
  {
    name: "Fordow -- Underground Nuclear Facility",
    lat: 34.88, lng: 51.59,
    count: 700, articles: 18000,
    severity: "critical",
    attackTypes: ["Airstrike", "Missile Strike"],
    weapons: ["B-2 Spirit", "GBU-57 MOP"],
    description: "Deep underground enrichment facility near Qom. Built inside a mountain; hardest target. Multiple B-2 passes with bunker-busters.",
    casualties: "Unknown",
    dailyActivity: [
      { date: "2026-02-28", event: "Repeated strikes with GBU-57 Massive Ordnance Penetrators targeting underground chambers." }
    ],
    region: "Middle East", country: "Iran", countryCode: "IR",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran"]
  },
  {
    name: "Western Iran -- Missile Launch Sites",
    lat: 33.5, lng: 48.0,
    count: 600, articles: 15000,
    severity: "critical",
    attackTypes: ["Airstrike"],
    weapons: ["F-35I Adir", "F-15I Ra'am", "JDAM", "GBU-39 SDB"],
    description: "IDF strikes on Iranian missile launchers to degrade retaliatory capability. Over 200 Israeli jets involved in strike package.",
    casualties: "Multiple launch sites destroyed",
    dailyActivity: [
      { date: "2026-02-28", event: "IDF reports striking 'hundreds of military sites' including mobile missile launchers." },
      { date: "2026-02-28", event: "Iranian IRGC retaliates with Emad and Ghadr ballistic missiles toward Israel." }
    ],
    region: "Middle East", country: "Iran", countryCode: "IR",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://understandingwar.org/research/middle-east/iran-update-special-report-us-and-israeli-strikes-february-28-2026/"]
  },
  {
    name: "Israel -- Iron Dome / Arrow Defense",
    lat: 31.5, lng: 34.75,
    count: 1038, articles: 34479,
    severity: "critical",
    attackTypes: ["Missile Strike"],
    weapons: ["Emad", "Ghadr", "Iron Dome", "Arrow-3", "THAAD"],
    description: "Iran retaliates with ~35 ballistic missiles at Israel. Arrow-3, Iron Dome, and US THAAD systems activated. 1 civilian killed in Israel from retaliatory strikes.",
    casualties: "1 civilian killed in Israel",
    dailyActivity: [
      { date: "2026-02-28", event: "Iran fires ~35 Emad & Ghadr missiles at Israeli territory. Multilayer defense (Iron Dome, Arrow-3, THAAD) activated." },
      { date: "2026-02-28", event: "Houthis announce resumption of Red Sea attacks in solidarity with Iran." }
    ],
    region: "Middle East", country: "Israel", countryCode: "IL",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://understandingwar.org/research/middle-east/iran-update-special-report-us-and-israeli-strikes-february-28-2026/"]
  },
  // ============================================================
  // IRAN RETALIATORY STRIKES -- Operation "True Promise 4"
  // Gulf States, Israel, Jordan, Oman (Feb 28 - Mar 1, 2026)
  // Sources: Time, CNN, BBC, Al Jazeera, Axios, Critical Threats, Sky News, WaPo
  // ============================================================
  {
    name: "Dubai International Airport -- Missile Strike",
    lat: 25.2532, lng: 55.3657,
    count: 920, articles: 45000,
    severity: "critical",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Emad", "Ghadr", "Shahed-136"],
    description: "Iranian missile strike on world's busiest international airport. Terminal sustained 'minor damage', 4 staff injured. Passengers evacuated through smoke-filled corridors. All flights suspended. Part of Iran's Operation True Promise 4 retaliation for US-Israeli strikes and Khamenei assassination.",
    casualties: "4 staff injured",
    dailyActivity: [
      { date: "2026-02-28", event: "Iranian missile hits Dubai International Airport terminal. Passengers evacuated, ambulances rush to scene. All flights suspended." },
      { date: "2026-03-01", event: "Airport remains closed for second day. Over 3,400 flights cancelled across region. 90,000+ passengers/day affected at DXB alone." }
    ],
    region: "Middle East", country: "UAE", countryCode: "AE",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.cnn.com/2026/02/28/middleeast/dubai-airport-uae-iran-attacks-intl-hnk", "https://news.sky.com/story/thousands-stranded-as-iranian-strikes-force-airports-to-close-including-dubai-and-doha-13513797"]
  },
  {
    name: "Abu Dhabi Zayed International Airport -- Drone Strike",
    lat: 24.4431, lng: 54.6511,
    count: 680, articles: 32000,
    severity: "critical",
    attackTypes: ["Drone Strike"],
    weapons: ["Shahed-136"],
    description: "Iranian drone struck Zayed International Airport in Abu Dhabi. Falling debris killed 1, injured 7. Airport authority confirmed 'incident' -- CNN reports drone attack. UAE intercepted 165 ballistic missiles, 2 cruise missiles, 541 drones total.",
    casualties: "1 killed, 7 injured",
    dailyActivity: [
      { date: "2026-02-28", event: "Drone targets Abu Dhabi Zayed International Airport. 1 killed, 7 injured from falling debris. Airport operations suspended." }
    ],
    region: "Middle East", country: "UAE", countryCode: "AE",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.cnn.com/2026/02/28/middleeast/dubai-airport-uae-iran-attacks-intl-hnk", "https://www.bbc.com/news/articles/c363zkp1pgxo"]
  },
  {
    name: "Dubai Palm Jumeirah -- Fairmont Hotel Strike",
    lat: 25.1124, lng: 55.1390,
    count: 580, articles: 28000,
    severity: "high",
    attackTypes: ["Drone Strike"],
    weapons: ["Shahed-136"],
    description: "Explosion and fire at Fairmont Hotel on Palm Jumeirah after drone impact. Iconic Burj Al Arab also hit by falling debris, caught fire. Dubai Media Office confirmed 'incident in Palm Jumeirah area'. 4 people injured. Videos show drone diving toward ground.",
    casualties: "4 injured at Fairmont; Burj Al Arab fire from debris",
    dailyActivity: [
      { date: "2026-02-28", event: "Iranian drone strikes Fairmont Hotel on Palm Jumeirah. Explosion and fire. 4 injured. Burj Al Arab catches fire from falling debris." },
      { date: "2026-03-01", event: "Dubai Media Office warns against sharing 'old clips and images' -- urges reliance on official sources only." }
    ],
    region: "Middle East", country: "UAE", countryCode: "AE",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://time.com/7381884/iran-missiles-dubai-palm-gulf/", "https://www.cnn.com/2026/02/28/middleeast/dubai-airport-uae-iran-attacks-intl-hnk"]
  },
  {
    name: "Jebel Ali Port, Dubai -- Port Strike",
    lat: 25.0075, lng: 55.0600,
    count: 420, articles: 18000,
    severity: "high",
    attackTypes: ["Missile Strike"],
    weapons: ["Emad"],
    description: "Dark smoke visible rising from Jebel Ali Port, one of the busiest ports in the Middle East. Strike part of Iran's broader campaign hitting UAE infrastructure. CENTCOM listed 'Port of Dubai' among confirmed Iranian strike targets.",
    casualties: "Unknown -- damage assessment ongoing",
    dailyActivity: [
      { date: "2026-03-01", event: "Observers report dark smoke rising from Jebel Ali port. CENTCOM confirms Port of Dubai among Iranian targets." }
    ],
    region: "Middle East", country: "UAE", countryCode: "AE",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.aljazeera.com/news/2026/3/1/more-blasts-rock-dubai-doha-and-manama-as-iran-targets-us-assets-in-gulf", "https://time.com/7381884/iran-missiles-dubai-palm-gulf/"]
  },
  {
    name: "Bahrain -- US 5th Fleet HQ, Manama",
    lat: 26.2285, lng: 50.5860,
    count: 750, articles: 35000,
    severity: "critical",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Emad", "Ghadr", "Shahed-136"],
    description: "IRGC claimed strike on US Navy 5th Fleet headquarters in Manama. 45 missiles and 9 drones targeted Bahrain. Video shows missile impact near base, black smoke rising. Drone hit Bahrain International Airport causing 'material damage without casualties'. Shahed drone struck residential apartment building in Manama. Era Views Towers residential area also hit.",
    casualties: "Material damage -- no fatalities reported in Bahrain",
    dailyActivity: [
      { date: "2026-02-28", event: "IRGC claims strike on US 5th Fleet HQ. 45 missiles + 9 drones target Bahrain. Drone damages airport. Shahed drone hits residential building in Manama." },
      { date: "2026-03-01", event: "Continued explosions reported in Manama -- at least 4 significant blasts heard. Era Views Towers area impacted." }
    ],
    region: "Middle East", country: "Bahrain", countryCode: "BA",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://time.com/7381884/iran-missiles-dubai-palm-gulf/", "https://www.bbc.com/news/articles/c1jk922dgjgo"]
  },
  {
    name: "Qatar -- Al Udeid Air Base, Doha",
    lat: 25.1173, lng: 51.3150,
    count: 700, articles: 30000,
    severity: "critical",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Emad", "Ghadr", "Shahed-136"],
    description: "Iran targeted Al Udeid Air Base -- the largest US military base in the Middle East -- with 65 missiles and 12 drones (Qatari officials' count; initial reports said 44 missiles + 8 drones). Most intercepted but Iranian ballistic missile damaged a clinic on base. 16 injured from attack fallout. Loud detonations and black smoke reported in southern Doha.",
    casualties: "16 injured; clinic on base damaged",
    dailyActivity: [
      { date: "2026-02-28", event: "Iran fires 65 missiles + 12 drones at Qatar targeting Al Udeid. Most intercepted. Clinic damaged, 16 injured." },
      { date: "2026-03-01", event: "Multiple loud detonations heard in southern Doha. Thick black smoke visible. Doha airport remains closed." }
    ],
    region: "Middle East", country: "Qatar", countryCode: "QA",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.criticalthreats.org/analysis/iran-update-evening-special-report-february-28-2026", "https://www.aljazeera.com/news/2026/3/1/more-blasts-rock-dubai-doha-and-manama-as-iran-targets-us-assets-in-gulf"]
  },
  {
    name: "Kuwait -- Ali al-Salem Air Base & Airport",
    lat: 29.3467, lng: 47.5211,
    count: 650, articles: 28000,
    severity: "critical",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Emad", "Ghadr", "Shahed-136"],
    description: "Iran struck Ali al-Salem Air Base (hosts US Air Force) with ballistic missiles causing 'significant runway damage' (Italian FM). Kuwait International Airport also hit -- minor injuries to workers, terminal partially damaged. Kuwait air defenses intercepted 97 ballistic missiles and 283 drones. 1 killed, 32 injured (all foreign nationals).",
    casualties: "1 killed, 32 injured (all foreign nationals)",
    dailyActivity: [
      { date: "2026-02-28", event: "Iran strikes Ali al-Salem Air Base -- significant runway damage. Kuwait International Airport also hit. 97 missiles + 283 drones intercepted. 1 killed, 32 injured." },
      { date: "2026-03-01", event: "Sirens activated across Kuwait. Airport operations suspended. Air defenses continue intercepting incoming threats." }
    ],
    region: "Middle East", country: "Kuwait", countryCode: "KU",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.criticalthreats.org/analysis/iran-update-evening-special-report-february-28-2026", "https://www.bbc.com/news/articles/c363zkp1pgxo"]
  },
  {
    name: "Jordan -- Muwaffaq al-Salti Air Base",
    lat: 31.8264, lng: 36.7821,
    count: 420, articles: 15000,
    severity: "high",
    attackTypes: ["Missile Strike"],
    weapons: ["Emad", "Ghadr"],
    description: "Iranian ballistic missiles struck Muwaffaq al-Salti Air Base in Jordan where US forces maintain a presence. Jordan's air defense systems intercepted missiles over Amman and northern regions. Jordan FM condemned 'blatant Iranian aggression' and 'flagrant violation' of sovereignty.",
    casualties: "Explosions in sky -- no major casualties reported",
    dailyActivity: [
      { date: "2026-02-28", event: "Iranian ballistic missiles strike Muwaffaq al-Salti Air Base. Jordan intercepts missiles over Amman." },
      { date: "2026-03-01", event: "Jordan's defense systems intercept additional missiles over capital and northern regions." }
    ],
    region: "Middle East", country: "Jordan", countryCode: "JO",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.criticalthreats.org/analysis/iran-update-evening-special-report-february-28-2026", "https://www.axios.com/2026/02/28/us-israel-strikes-iran-middle-east-dubai-airports"]
  },
  {
    name: "Saudi Arabia -- Riyadh & Eastern Province",
    lat: 24.7136, lng: 46.6753,
    count: 380, articles: 14000,
    severity: "high",
    attackTypes: ["Missile Strike"],
    weapons: ["Emad", "Ghadr"],
    description: "Iran targeted Saudi capital Riyadh and Eastern Province. Saudi air defenses intercepted all attacks. Saudi Arabia 'strongly rejects and condemns blatant Iranian aggression' -- calls it 'flagrant violation' of sovereignty. No casualties reported.",
    casualties: "All intercepted -- no casualties",
    dailyActivity: [
      { date: "2026-02-28", event: "Iran fires missiles at Riyadh and Eastern Province. Saudi air defenses intercept all. Saudi FM issues strong condemnation." }
    ],
    region: "Middle East", country: "Saudi Arabia", countryCode: "SA",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://time.com/7381884/iran-missiles-dubai-palm-gulf/", "https://www.bbc.com/news/articles/c1jk922dgjgo"]
  },
  {
    name: "Israel -- Beit Shemesh Synagogue Strike",
    lat: 31.7462, lng: 34.9876,
    count: 850, articles: 40000,
    severity: "critical",
    attackTypes: ["Missile Strike"],
    weapons: ["Emad", "Ghadr"],
    description: "Iranian ballistic missile struck synagogue in Beit Shemesh where people were sheltering from airstrikes. Building 'utterly obliterated'. 9 killed, 27 injured. IDF accused Iran of 'directly targeting innocent civilians'. Rescuers searching rubble for trapped people. Significant crater at impact site, nearby vehicles destroyed.",
    casualties: "9 killed, 27 injured",
    dailyActivity: [
      { date: "2026-02-28", event: "Iranian missile directly hits Beit Shemesh synagogue being used as shelter. 9 killed, 27 injured. Building destroyed." },
      { date: "2026-03-01", event: "Search and rescue ongoing. IDF condemns Iran for targeting civilians." }
    ],
    region: "Middle East", country: "Israel", countryCode: "IL",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.bbc.com/news/articles/c363zkp1pgxo"]
  },
  {
    name: "Israel -- Tel Aviv & Bnei Brak Missile Strikes",
    lat: 32.0853, lng: 34.7818,
    count: 720, articles: 35000,
    severity: "critical",
    attackTypes: ["Missile Strike"],
    weapons: ["Emad", "Ghadr", "Iron Dome", "Arrow-3"],
    description: "At least 2 Iranian ballistic missiles struck Israeli cities -- one in Tel Aviv (1 killed, 21 wounded), one in Bnei Brak (several wounded). IDF shot down 10+ Iranian drones targeting Israel. Missile struck street in Jerusalem vicinity injuring 3. Air sirens across Israel including Tel Aviv.",
    casualties: "1 killed in Tel Aviv, 21+ wounded across strikes",
    dailyActivity: [
      { date: "2026-02-28", event: "Iranian ballistic missiles strike Tel Aviv and Bnei Brak. 1 killed, 21+ wounded. IDF intercepts 10+ drones." },
      { date: "2026-03-01", event: "Continued missile assaults on Israel. Strike on street near Jerusalem injures 3. Air sirens activated across Israel." }
    ],
    region: "Middle East", country: "Israel", countryCode: "IL",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.criticalthreats.org/analysis/iran-update-evening-special-report-february-28-2026", "https://www.bbc.com/news/articles/c363zkp1pgxo"]
  },
  {
    name: "Erbil International Airport, Iraq -- Drone Crash",
    lat: 36.2375, lng: 43.9632,
    count: 280, articles: 9000,
    severity: "high",
    attackTypes: ["Drone Strike"],
    weapons: ["Shahed-136"],
    description: "Drone crashed near Erbil International Airport in Iraqi Kurdistan. Significant plume of smoke reported. US forces remain stationed in Kurdistan region as part of anti-ISIS coalition. CENTCOM listed Erbil among confirmed Iranian strike targets.",
    casualties: "Unknown -- smoke plume reported",
    dailyActivity: [
      { date: "2026-02-28", event: "Iranian drone crashes near Erbil International Airport. Significant smoke plume. US coalition forces in region." }
    ],
    region: "Middle East", country: "Iraq", countryCode: "IZ",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.aljazeera.com/news/2026/3/1/more-blasts-rock-dubai-doha-and-manama-as-iran-targets-us-assets-in-gulf"]
  },
  {
    name: "Oman -- Duqm Port Drone Strike",
    lat: 19.6713, lng: 57.7084,
    count: 180, articles: 5000,
    severity: "medium",
    attackTypes: ["Drone Strike"],
    weapons: ["Shahed-136"],
    description: "Two Iranian drones struck Duqm commercial port in Oman, injuring 1 worker. Unprecedented -- Oman has served as mediator in US-Iran nuclear talks and was previously exempt from Iranian attacks. Marks spillover of conflict into traditionally neutral territory.",
    casualties: "1 worker injured",
    dailyActivity: [
      { date: "2026-02-28", event: "2 Iranian drones strike Duqm port. 1 worker injured. First-ever Iranian attack on Oman -- previously neutral mediator." }
    ],
    region: "Middle East", country: "Oman", countryCode: "MU",
    conflictName: "Iran Retaliatory Strikes -- Operation True Promise 4",
    urls: ["https://www.bbc.com/news/articles/c363zkp1pgxo"]
  },

  {
    name: "Iraq -- Jurf al-Sakhr (PMF Base)",
    lat: 32.93, lng: 44.14,
    count: 320, articles: 8500,
    severity: "high",
    attackTypes: ["Airstrike"],
    weapons: ["JDAM", "Tomahawk"],
    description: "US airstrikes hit Kataib Hezbollah stronghold in Jurf al-Sakhr, Iraq. 2 PMF killed in al-Mayadin, 3 injured in Sanidij. Part of broader anti-Iran Axis of Resistance campaign.",
    casualties: "2 killed, 3 injured (PMF)",
    dailyActivity: [
      { date: "2026-02-28", event: "PMF reports US airstrikes on Jurf al-Sakhr base. 2 killed, 3 wounded." }
    ],
    region: "Middle East", country: "Iraq", countryCode: "IZ",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://understandingwar.org/research/middle-east/iran-update-special-report-us-and-israeli-strikes-february-28-2026/"]
  },

  // ============================================================
  // RUSSIA-UKRAINE WAR
  // ============================================================
  {
    name: "Kyiv -- Energy Infrastructure",
    lat: 50.45, lng: 30.52,
    count: 890, articles: 42000,
    severity: "critical",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Iskander-M", "Kh-101", "Shahed-136"],
    description: "Massive combined missile/drone strike on Feb 25-26: 420 drones + 39 missiles in single attack. 4th time in Feb 2026 Russia launched 400+ projectiles. Ukraine intercepted 374 drones and 32 missiles.",
    casualties: "Civilian casualties from 5 missiles + 46 drones impacting 32 sites",
    dailyActivity: [
      { date: "2026-02-26", event: "Night strike: 420 Shahed drones + 39 missiles (11 Iskander-M, 24 Kh-101, 2 anti-ship). 374 drones and 32 missiles intercepted." },
      { date: "2026-02-27", event: "Ukrainian drone strikes Russian Pantsir-S1 air defense in Dubovoe, Belgorod Oblast (28km from border)." },
      { date: "2026-02-28", event: "Russian forces continue offensive in Sumy Oblast. No territorial gains. Drone/artillery exchanges continue." }
    ],
    region: "Europe", country: "Ukraine", countryCode: "UP",
    conflictName: "Russia-Ukraine War",
    urls: ["https://understandingwar.org/research/russia-ukraine/russian-offensive-campaign-assessment-february-26-2026/", "https://understandingwar.org/research/russia-ukraine/russian-offensive-campaign-assessment-february-28-2026/"]
  },
  {
    name: "Sumy Oblast -- Northern Front",
    lat: 50.91, lng: 34.80,
    count: 540, articles: 12000,
    severity: "critical",
    attackTypes: ["Ground Assault", "Drone Strike", "Artillery"],
    weapons: ["FPV Drone", "Fiber-Optic Drone", "Shahed-136"],
    description: "Russian forces testing border defenses with small-scale infantry probes. Cross-border assaults doubled in January. Drone operators from Zikon Center targeting Ukrainian positions.",
    casualties: "Multiple soldiers on both sides",
    dailyActivity: [
      { date: "2026-02-28", event: "Russian forces continue offensive operations but fail to advance. 4th Akhmat-Chechnya Regiment active." },
      { date: "2026-02-27", event: "Cross-border assaults in previously quiet sectors. Small infantry groups probing defenses." }
    ],
    region: "Europe", country: "Ukraine", countryCode: "UP",
    conflictName: "Russia-Ukraine War",
    urls: ["https://understandingwar.org/research/russia-ukraine/russian-offensive-campaign-assessment-february-28-2026/"]
  },
  {
    name: "Donetsk Oblast -- Eastern Front",
    lat: 48.02, lng: 37.80,
    count: 680, articles: 18000,
    severity: "critical",
    attackTypes: ["Ground Assault", "Artillery", "Drone Strike"],
    weapons: ["FPV Drone", "Fiber-Optic Drone", "Iskander-M"],
    description: "Russia pursuing capture of entire Donetsk Oblast. Increased attacks in Slovyansk direction with reinforcements deployed. Russia using fiber-optic guided drones and drones equipped with mines/cluster munitions.",
    casualties: "Heavy -- both sides",
    dailyActivity: [
      { date: "2026-02-28", event: "Russian attacks intensify in Slovyansk direction. Reinforcements deployed." },
      { date: "2026-02-27", event: "Russia deploys fiber-optic drones and drones with mines/cluster munitions against positions." },
      { date: "2026-02-26", event: "Ukraine strikes Russian supply depot with drone strike on troop concentration near Dovka, Belgorod Oblast." }
    ],
    region: "Europe", country: "Ukraine", countryCode: "UP",
    conflictName: "Russia-Ukraine War",
    urls: ["https://understandingwar.org/research/russia-ukraine/russian-offensive-campaign-assessment-february-28-2026/"]
  },
  {
    name: "Kharkiv Oblast -- Border Zone",
    lat: 49.99, lng: 36.23,
    count: 420, articles: 9800,
    severity: "high",
    attackTypes: ["Drone Strike", "Artillery", "Ground Assault"],
    weapons: ["FPV Drone", "Shahed-136"],
    description: "Cross-border Russian strikes between Vovchansk and Luhansk border. Small infantry groups without heavy machinery cross into Ukrainian territory to probe defenses -- frequently repulsed by Ukrainian drones.",
    casualties: "Civilian casualties from shelling",
    dailyActivity: [
      { date: "2026-02-28", event: "Cross-border raids near Vovchansk. Russian infantry probes repelled by Ukrainian FPV drones." },
      { date: "2026-02-27", event: "Artillery exchanges along border zone. No significant territorial changes." }
    ],
    region: "Europe", country: "Ukraine", countryCode: "UP",
    conflictName: "Russia-Ukraine War",
    urls: ["https://reliefweb.int/report/ukraine/ukraine-war-situation-update-7-13-february-2026"]
  },
  {
    name: "Western Ukraine -- Lviv/Volyn",
    lat: 49.84, lng: 24.03,
    count: 310, articles: 7200,
    severity: "high",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Kh-101", "Shahed-136"],
    description: "Russian long-range strikes reaching western regions: Lviv, Volyn, Ivano-Frankivsk, Khmelnytskyi. At least 54 long-range missile/drone attacks in Feb 7-13 alone. 45 civilians killed across multiple regions.",
    casualties: "45+ civilians killed (Feb 7-13 alone)",
    dailyActivity: [
      { date: "2026-02-26", event: "Kh-101 cruise missiles and Shahed drones target energy infrastructure in western Ukraine." }
    ],
    region: "Europe", country: "Ukraine", countryCode: "UP",
    conflictName: "Russia-Ukraine War",
    urls: ["https://reliefweb.int/report/ukraine/ukraine-war-situation-update-7-13-february-2026"]
  },
  {
    name: "Belgorod Oblast -- Ukrainian Strikes in Russia",
    lat: 50.60, lng: 36.59,
    count: 280, articles: 5500,
    severity: "high",
    attackTypes: ["Drone Strike"],
    weapons: ["FPV Drone", "Bayraktar TB2"],
    description: "Ukrainian long-range drone campaign targeting Russian military assets in occupied territories and Russian soil. Geolocated footage confirms strike on Russian Pantsir-S1 air defense system in Dubovoe.",
    casualties: "Russian military losses -- unconfirmed numbers",
    dailyActivity: [
      { date: "2026-02-28", event: "Drone strike hits Russian Pantsir-S1 air defense in Dubovoe, Belgorod Oblast." },
      { date: "2026-02-27", event: "Ukrainian forces target Russian troop concentration near Dovka, Belgorod Oblast (~2km from border)." }
    ],
    region: "Europe", country: "Russia", countryCode: "RS",
    conflictName: "Russia-Ukraine War",
    urls: ["https://understandingwar.org/research/russia-ukraine/russian-offensive-campaign-assessment-february-28-2026/"]
  },

  // ============================================================
  // GAZA / ISRAEL-PALESTINE
  // ============================================================
  {
    name: "Khan Younis -- Police Checkpoints",
    lat: 31.35, lng: 34.30,
    count: 480, articles: 14200,
    severity: "critical",
    attackTypes: ["Airstrike", "Drone Strike"],
    weapons: ["F-35I Adir", "MQ-9 Reaper"],
    description: "Israeli airstrikes on Hamas-run police checkpoints during ceasefire. 3 police killed at al-Mawasi intersection. 1 Palestinian killed in western Khan Younis. Hamas condemns strikes as violating ceasefire.",
    casualties: "5+ killed (4 police, 1 civilian)",
    dailyActivity: [
      { date: "2026-02-27", event: "Israeli drone strike kills 3 at police checkpoint near al-Mawasi, Khan Younis. Strike on western Khan Younis kills 1." },
      { date: "2026-02-27", event: "Hamas condemns strikes as disrupting mediation efforts -- calls it 'bloody night'." }
    ],
    region: "Middle East", country: "Palestine", countryCode: "GZ",
    conflictName: "Gaza War",
    urls: ["https://www.aljazeera.com/news/2026/2/27/israeli-attacks-on-police-sites-kill-five-in-southern-central-gaza", "https://www.ksat.com/news/world/2026/02/27/israels-top-court-allows-aid-groups-to-keep-working-in-gaza-as-israeli-strikes-kill-5-there/"]
  },
  {
    name: "Bureij Refugee Camp -- Central Gaza",
    lat: 31.47, lng: 34.36,
    count: 380, articles: 11500,
    severity: "high",
    attackTypes: ["Drone Strike"],
    weapons: ["MQ-9 Reaper"],
    description: "Israeli drone strike on police post at entrance of Bureij refugee camp. 2 killed, several wounded. Part of pattern of strikes on police facilities during ceasefire.",
    casualties: "2 killed, multiple wounded",
    dailyActivity: [
      { date: "2026-02-27", event: "Drone strike on police post at camp entrance. 2 Palestinians killed, several wounded." }
    ],
    region: "Middle East", country: "Palestine", countryCode: "GZ",
    conflictName: "Gaza War",
    urls: ["https://www.aljazeera.com/news/2026/2/27/israeli-attacks-on-police-sites-kill-five-in-southern-central-gaza"]
  },
  {
    name: "West Bank -- Qusra Village",
    lat: 32.13, lng: 35.28,
    count: 180, articles: 4200,
    severity: "medium",
    attackTypes: ["Ground Assault"],
    weapons: [],
    description: "Masked Israeli settlers attacked Palestinian and Israeli civilians in Qusra village, occupied West Bank. 2 Israelis injured. Israeli military confirms attack by 'masked Israeli civilians'.",
    casualties: "2 Israelis injured",
    dailyActivity: [
      { date: "2026-02-27", event: "Settler attack on Qusra village. Israeli military confirms masked Israeli civilians carried it out." }
    ],
    region: "Middle East", country: "Palestine", countryCode: "WE",
    conflictName: "Gaza War",
    urls: ["https://www.ksat.com/news/world/2026/02/27/israels-top-court-allows-aid-groups-to-keep-working-in-gaza-as-israeli-strikes-kill-5-there/"]
  },

  // ============================================================
  // PAKISTAN-AFGHANISTAN CONFLICT (Feb 2026)
  // ============================================================
  {
    name: "Kabul -- Pakistani Air Strikes",
    lat: 34.53, lng: 69.17,
    count: 620, articles: 21000,
    severity: "critical",
    attackTypes: ["Airstrike"],
    weapons: ["JF-17 Thunder", "F-16"],
    description: "Pakistan strikes on Taliban HQ in Kabul as part of Operation Ghazab Lil Haq ('Righteous Fury'). 22 Afghan military sites hit, 83 Taliban posts destroyed, 17 captured. 274 Taliban reported killed, 400+ injured.",
    casualties: "274 Taliban killed, 400+ injured (Pakistani claim)",
    dailyActivity: [
      { date: "2026-02-27", event: "PAF strikes military targets in Kabul hours after Taliban ground attacks on Pakistani border posts." },
      { date: "2026-02-26", event: "Afghanistan launches retaliatory cross-border operation against Pakistan." },
      { date: "2026-02-21", event: "Initial PAF strikes on 7 TTP/ISIS-K camps in Nangarhar, Paktika, and Khost." }
    ],
    region: "Asia", country: "Afghanistan", countryCode: "AF",
    conflictName: "2026 Afghanistan-Pakistan Conflict",
    urls: ["https://www.military.com/feature/2026/02/27/pakistan-declares-open-war-afghan-taliban-airstrikes-hammer-kabul-and-kandahar.html", "https://en.wikipedia.org/wiki/2026_Afghanistan%E2%80%93Pakistan_conflict"]
  },
  {
    name: "Kandahar -- Military Targets",
    lat: 31.63, lng: 65.71,
    count: 480, articles: 16000,
    severity: "critical",
    attackTypes: ["Airstrike"],
    weapons: ["JF-17 Thunder", "F-16"],
    description: "Pakistani air strikes on Taliban brigade HQ and weapons depots in Kandahar. Part of Operation Ghazab Lil Haq -- first direct strike on Taliban government since 2021.",
    casualties: "Part of 274 killed / 80+ vehicles destroyed",
    dailyActivity: [
      { date: "2026-02-27", event: "PAF strikes Taliban brigade HQ, weapons depots, and border installations." }
    ],
    region: "Asia", country: "Afghanistan", countryCode: "AF",
    conflictName: "2026 Afghanistan-Pakistan Conflict",
    urls: ["https://www.military.com/feature/2026/02/27/pakistan-declares-open-war-afghan-taliban-airstrikes-hammer-kabul-and-kandahar.html"]
  },
  {
    name: "Paktia Province -- Border Zone",
    lat: 33.40, lng: 69.39,
    count: 350, articles: 12000,
    severity: "high",
    attackTypes: ["Airstrike"],
    weapons: ["JF-17 Thunder"],
    description: "PAF strikes in Paktia province targeting TTP/ISIS-K camps near Pakistan-Afghanistan border. Intelligence-based selective strikes on militant hideouts.",
    casualties: "Unknown",
    dailyActivity: [
      { date: "2026-02-27", event: "Airstrikes on militant camps and border installations in Paktia." }
    ],
    region: "Asia", country: "Afghanistan", countryCode: "AF",
    conflictName: "2026 Afghanistan-Pakistan Conflict",
    urls: ["https://en.wikipedia.org/wiki/2026_Afghanistan%E2%80%93Pakistan_conflict"]
  },
  {
    name: "Nangarhar -- TTP/ISIS-K Camps",
    lat: 34.17, lng: 70.62,
    count: 300, articles: 9800,
    severity: "high",
    attackTypes: ["Airstrike"],
    weapons: ["JF-17 Thunder", "F-16"],
    description: "Initial Pakistani airstrikes on Feb 21 hit 7 militant camps in Nangarhar, Paktika, and Khost. Targeting TTP and ISIS-Khorasan Province hideouts. Retaliation for Islamabad mosque bombing (36 killed) and Bajaur attack (11 soldiers + 1 child).",
    casualties: "Unknown -- Taliban prevented recording",
    dailyActivity: [
      { date: "2026-02-21", event: "Initial PAF strikes on 7 alleged TTP/ISIS-K camps. Taliban condemns strikes, vows retaliation." }
    ],
    region: "Asia", country: "Afghanistan", countryCode: "AF",
    conflictName: "2026 Afghanistan-Pakistan Conflict",
    urls: ["https://en.wikipedia.org/wiki/2026_Afghanistan%E2%80%93Pakistan_conflict"]
  },
  {
    name: "Islamabad/Bajaur -- Terror Attacks",
    lat: 33.69, lng: 73.04,
    count: 250, articles: 7500,
    severity: "high",
    attackTypes: ["Suicide Attack", "IED/VBIED"],
    weapons: [],
    description: "Suicide bombing at Shiite mosque in Islamabad killed 36. Assault in Bajaur killed 11 soldiers and a child. These attacks triggered Pakistan's Operation Ghazab Lil Haq.",
    casualties: "47+ killed across attacks",
    dailyActivity: [
      { date: "2026-02-11", event: "Pakistan warns it may act against TTP hideouts before Ramadan." },
      { date: "2026-02-19", event: "Pakistan formally warns Afghan ambassador." }
    ],
    region: "Asia", country: "Pakistan", countryCode: "PK",
    conflictName: "2026 Afghanistan-Pakistan Conflict",
    urls: ["https://www.military.com/feature/2026/02/27/pakistan-declares-open-war-afghan-taliban-airstrikes-hammer-kabul-and-kandahar.html"]
  },

  // ============================================================
  // SUDAN CIVIL WAR
  // ============================================================
  {
    name: "Kordofan Region -- SAF vs RSF",
    lat: 12.77, lng: 29.56,
    count: 520, articles: 13000,
    severity: "critical",
    attackTypes: ["Airstrike", "Drone Strike", "Artillery", "Ground Assault"],
    weapons: ["Bayraktar Akinci", "Bayraktar TB2", "FK-2000"],
    description: "Kordofan is key epicenter of Sudan civil war. Both SAF and RSF use heavy drone strikes and aerial bombardments. RSF using Turkish Bayraktar Akinci drones. SAF claims it shot down one over Nyala. RSF drone strikes on markets killing civilians.",
    casualties: "Dozens killed -- civilians targeted in market strikes",
    dailyActivity: [
      { date: "2026-01-03", event: "RSF drone strikes on El-Obeid and White Nile State. 64 killed in SAF airstrikes on Al Zorg." },
      { date: "2026-01-11", event: "RSF drone strike on market in Kartala, South Kordofan: 5 killed, 20 injured." },
      { date: "2026-01-15", event: "RSF drone strike on market in Dalang: 12 killed." },
      { date: "2026-01-23", event: "SAF drone strike on market in Abu Zaima: 5 killed." },
      { date: "2026-01-26", event: "SAF re-enters Dilling after 2-year RSF siege, reopens supply routes." }
    ],
    region: "Africa", country: "Sudan", countryCode: "SU",
    conflictName: "Sudanese Civil War",
    urls: ["https://en.wikipedia.org/wiki/Timeline_of_the_Sudanese_civil_war_(2026)", "https://www.securitycouncilreport.org/monthly-forecast/2026-02/sudan-38.php"]
  },
  {
    name: "North Darfur -- SAF Airstrikes",
    lat: 13.63, lng: 25.35,
    count: 380, articles: 9800,
    severity: "high",
    attackTypes: ["Airstrike", "Drone Strike", "Ground Assault"],
    weapons: ["Bayraktar TB2"],
    description: "SAF airstrikes on RSF positions in Darfur and Kordofan. SAF claims 240 military vehicles destroyed and hundreds of RSF killed. Ongoing ground fighting in North Darfur state.",
    casualties: "240 vehicles destroyed, hundreds killed (SAF claim)",
    dailyActivity: [
      { date: "2026-01-10", event: "RSF accused of killing/kidnapping 19 people in Jirjira, North Darfur." },
      { date: "2026-01-03", event: "SAF airstrikes on RSF in Darfur -- 240 vehicles wrecked, hundreds of RSF killed (SAF claim)." }
    ],
    region: "Africa", country: "Sudan", countryCode: "SU",
    conflictName: "Sudanese Civil War",
    urls: ["https://en.wikipedia.org/wiki/Timeline_of_the_Sudanese_civil_war_(2026)"]
  },
  {
    name: "Chad Border -- RSF Cross-Border Attack",
    lat: 14.00, lng: 22.00,
    count: 180, articles: 4200,
    severity: "medium",
    attackTypes: ["Ground Assault"],
    weapons: [],
    description: "RSF cross-border attack into Chad while pursuing JDF unit. 7 Chadian soldiers killed at Birak garrison near Tine Djagaraba. International spillover of Sudan conflict.",
    casualties: "7 Chadian soldiers killed",
    dailyActivity: [
      { date: "2026-01-15", event: "RSF attacks Birak garrison in Chad, killing 7 Chadian soldiers." }
    ],
    region: "Africa", country: "Chad", countryCode: "CD",
    conflictName: "Sudanese Civil War",
    urls: ["https://en.wikipedia.org/wiki/Timeline_of_the_Sudanese_civil_war_(2026)"]
  },

  // ============================================================
  // YEMEN / HOUTHIS / RED SEA
  // ============================================================
  {
    name: "Red Sea / Bab-el-Mandeb -- Houthi Blockade",
    lat: 13.50, lng: 42.80,
    count: 450, articles: 18000,
    severity: "critical",
    attackTypes: ["Missile Strike", "Drone Strike", "Naval"],
    weapons: ["Samad-3"],
    description: "Houthis announce resumption of Red Sea shipping attacks following US-Israel strikes on Iran. 178 vessels attacked since 2023, 4 ships sunk, 9 sailors killed. Strait of Hormuz closure disrupting global oil/gas shipments.",
    casualties: "9 sailors killed total (since 2023), major economic disruption",
    dailyActivity: [
      { date: "2026-02-28", event: "Houthis announce they will resume attacks on Red Sea shipping in solidarity with Iran." },
      { date: "2026-03-01", event: "US-Israeli attacks on Iran disrupt shipping further. Maersk suspends Red Sea transit." }
    ],
    region: "Middle East", country: "Yemen", countryCode: "YM",
    conflictName: "Red Sea Crisis / Yemen Conflict",
    urls: ["https://en.wikipedia.org/wiki/Red_Sea_crisis", "https://www.cfr.org/global-conflict-tracker/conflict/war-yemen"]
  },
  {
    name: "Sanaa -- Houthi Capital",
    lat: 15.37, lng: 44.19,
    count: 350, articles: 11000,
    severity: "high",
    attackTypes: ["Missile Strike", "Drone Strike"],
    weapons: ["Samad-3", "Emad"],
    description: "Houthi-controlled Sanaa serves as launch point for ballistic missiles and drones targeting Israel and Red Sea shipping. Houthis have fired missiles at Israel since Oct 2023.",
    casualties: "Ongoing",
    dailyActivity: [
      { date: "2026-02-28", event: "Houthi leadership announces new wave of attacks following US-Iran hostilities." }
    ],
    region: "Middle East", country: "Yemen", countryCode: "YM",
    conflictName: "Red Sea Crisis / Yemen Conflict",
    urls: ["https://www.cfr.org/global-conflict-tracker/conflict/war-yemen"]
  },

  // ============================================================
  // MYANMAR CIVIL WAR
  // ============================================================
  {
    name: "Magway Region -- Pyaung Airstrike",
    lat: 19.87, lng: 95.05,
    count: 380, articles: 9500,
    severity: "critical",
    attackTypes: ["Airstrike"],
    weapons: [],
    description: "Two jet fighter airstrikes on trading junction near Pyaung village. 25+ killed, 20 wounded, 14 vehicles destroyed. Targeting trade route between Magway and Rakhine.",
    casualties: "25+ killed, 20 wounded",
    dailyActivity: [
      { date: "2026-03-01", event: "Two jet fighters bomb trading point near Pyaung. 25+ killed including 2 women. 14 vehicles burned." }
    ],
    region: "Asia", country: "Myanmar", countryCode: "BM",
    conflictName: "Myanmar Civil War",
    urls: ["https://wtop.com/world/2026/03/myanmar-military-airstrikes-on-trading-site-kills-more-than-two-dozen/"]
  },
  {
    name: "Sagaing Region -- Junta Airstrikes & Paramotors",
    lat: 21.88, lng: 95.97,
    count: 340, articles: 8000,
    severity: "critical",
    attackTypes: ["Airstrike", "Drone Strike"],
    weapons: [],
    description: "Junta using jet airstrikes, armed drones, paramotors, and gyrocopters. Oct 6: paramotor attack on Buddhist festival killed 24 (including 3 children). 135+ paramotor attacks since Dec 2024. Cluster munitions and landmines in use.",
    casualties: "Thousands killed in 2025 airstrikes across Myanmar",
    dailyActivity: [
      { date: "2026-01-31", event: "Airstrike on IDP camp in Koke Ko village: 11 civilians killed including pregnant woman and children." }
    ],
    region: "Asia", country: "Myanmar", countryCode: "BM",
    conflictName: "Myanmar Civil War",
    urls: ["https://www.hrw.org/world-report/2026/country-chapters/myanmar", "https://www.amnesty.org/en/latest/news/2026/01/myanmar-junta-atrocities-surge-5-years-since-coup/"]
  },
  {
    name: "Rakhine State -- Arakan Army vs Junta",
    lat: 20.15, lng: 92.90,
    count: 300, articles: 7200,
    severity: "high",
    attackTypes: ["Airstrike", "Ground Assault"],
    weapons: [],
    description: "Arakan Army controls most of Rakhine State. Junta airstrikes target civilian areas. Feb 25: airstrike on Ponnagyun Township market killed 17. Rohingya caught between both sides -- facing killings, arson, forced recruitment.",
    casualties: "17 killed in market airstrike (Feb 25)",
    dailyActivity: [
      { date: "2026-02-25", event: "Junta airstrike on village market in Ponnagyun Township: 17 killed." }
    ],
    region: "Asia", country: "Myanmar", countryCode: "BM",
    conflictName: "Myanmar Civil War",
    urls: ["https://www.hrw.org/world-report/2026/country-chapters/myanmar"]
  },

  // ============================================================
  // DR CONGO -- M23 CONFLICT
  // ============================================================
  {
    name: "Goma / North Kivu -- M23 Occupation",
    lat: -1.68, lng: 29.23,
    count: 480, articles: 14000,
    severity: "critical",
    attackTypes: ["Drone Strike", "Ground Assault", "Artillery"],
    weapons: ["Wing Loong II", "CH-4"],
    description: "M23 (Rwanda-backed) captured Goma on Jan 27 and Bukavu on Feb 16. DRC forces using Chinese/Turkish drones for counter-strikes. M23 assassinated by drone strike on Feb 24 (spokesman Willy Ngoma killed).",
    casualties: "Thousands displaced, multiple killed in drone/artillery strikes",
    dailyActivity: [
      { date: "2026-02-26", event: "FARDC drone strike on Rubaya mine area -- M23 stronghold. Access denied by M23." },
      { date: "2026-02-24", event: "FARDC drone strike assassinates M23 spokesman Willy Ngoma." },
      { date: "2026-02-08", event: "M23 counterattack bombs Kahumiro village with heavy weaponry. Wazalendo fighters clash in Kibirizi." }
    ],
    region: "Africa", country: "DR Congo", countryCode: "CG",
    conflictName: "Eastern Congo Conflict",
    urls: ["https://thedefensepost.com/2026/02/26/dr-congo-attacks-m23/", "https://www.cfr.org/global-conflict-tracker/conflict/violence-democratic-republic-congo"]
  },
  {
    name: "Rubaya Mine -- Coltan Strategic Target",
    lat: -1.48, lng: 29.15,
    count: 320, articles: 9000,
    severity: "high",
    attackTypes: ["Drone Strike", "Ground Assault"],
    weapons: [],
    description: "Rubaya produces ~25% of world's coltan. FARDC and Wazalendo militias attacking M23 positions around mine. DRC forces using drone strikes on rebel positions. Phone networks cut by M23.",
    casualties: "Unknown -- communications disrupted",
    dailyActivity: [
      { date: "2026-02-26", event: "FARDC drone strike on Rubaya mine area. Wazalendo capture village of Kazinga (20km NW)." },
      { date: "2026-02-08", event: "Clashes around Rutshuru district. FDLR-Wazalendo incursion on M23 in Kibirizi." }
    ],
    region: "Africa", country: "DR Congo", countryCode: "CG",
    conflictName: "Eastern Congo Conflict",
    urls: ["https://thedefensepost.com/2026/02/26/dr-congo-attacks-m23/"]
  },
  {
    name: "South Kivu -- Minembwe Highlands",
    lat: -3.70, lng: 29.00,
    count: 250, articles: 6500,
    severity: "high",
    attackTypes: ["Ground Assault", "Artillery"],
    weapons: [],
    description: "FARDC and allies clashing with M23-aligned Twirwaneho fighters around Minembwe. Battles at Kalingi, Kakenge, and Rugezi. South Africa announced withdrawal from UN contingent.",
    casualties: "Significant displacement reported",
    dailyActivity: [
      { date: "2026-02-09", event: "Clashes at multiple villages around Minembwe. FARDC recaptured Point Zero from Twirwaneho." },
      { date: "2026-02-05", event: "M23-aligned fighters attack FARDC in Point Zero and Tuwetuwe -- mass displacement." }
    ],
    region: "Africa", country: "DR Congo", countryCode: "CG",
    conflictName: "Eastern Congo Conflict",
    urls: ["https://www.criticalthreats.org/briefs/congo-war-security-review/february-9-2026"]
  },

  // ============================================================
  // SYRIA -- ISIS RESURGENCE & SDF TENSIONS
  // ============================================================
  {
    name: "Deir ez-Zor -- ISIS Attacks",
    lat: 35.34, lng: 40.14,
    count: 280, articles: 7800,
    severity: "high",
    attackTypes: ["Ground Assault", "IED/VBIED"],
    weapons: [],
    description: "ISIS claims 'new phase of operations' against Syrian transitional government. Assassinations in Mayadin and Raqqa. Surge in hostilities against Sharaa government. ISIS labels Sharaa 'watchdog' for international coalition.",
    casualties: "1 soldier + 1 civilian killed in Mayadin, 2 wounded in Raqqa",
    dailyActivity: [
      { date: "2026-02-22", event: "ISIS shoots Syrian army soldier and civilian in Mayadin. Guns down 2 in Raqqa with machine guns." },
      { date: "2026-02-22", event: "ISIS spokesperson announces 'new phase of operations in Syria'." }
    ],
    region: "Middle East", country: "Syria", countryCode: "SY",
    conflictName: "Syrian Conflict / ISIS Resurgence",
    urls: ["https://www.reuters.com/world/middle-east/islamic-state-claims-two-attacks-syrian-army-announces-new-phase-operations-2026-02-21/"]
  },
  {
    name: "Northeastern Syria -- SDF Integration",
    lat: 36.80, lng: 40.00,
    count: 220, articles: 5800,
    severity: "medium",
    attackTypes: ["Ground Assault"],
    weapons: [],
    description: "Syrian transitional government launched offensive against SDF on Jan 13. Expanded to Raqqa, Deir ez-Zor, and Al-Hasakah. Ceasefire reached Jan 18 but fragile. SDF being integrated into government forces. US-mediated deal includes ISIS prisoner transfer to Iraq.",
    casualties: "Multiple -- ceasefire fragile",
    dailyActivity: [
      { date: "2026-01-30", event: "Comprehensive agreement reached: ceasefire, military integration, Interior Ministry deployment." },
      { date: "2026-01-13", event: "Syrian government offensive launched against SDF in eastern Aleppo Governorate." }
    ],
    region: "Middle East", country: "Syria", countryCode: "SY",
    conflictName: "Syrian Conflict / ISIS Resurgence",
    urls: ["https://en.wikipedia.org/wiki/2026_northeastern_Syria_offensive"]
  },

  // ============================================================
  // SOUTH SUDAN
  // ============================================================
  {
    name: "Jonglei State -- Opposition Fighting",
    lat: 7.18, lng: 31.60,
    count: 260, articles: 6000,
    severity: "high",
    attackTypes: ["Airstrike", "Ground Assault"],
    weapons: [],
    description: "Risk of 'return to full-scale war' (UN warning). Coalition of opposition forces captured government outposts in Jonglei since December. Government launched major offensive in late January. 'Dangerous shift in tactics' -- airstrikes targeting civilian areas. Ugandan forces involvement.",
    casualties: "Killings, sexual violence, forced displacement (UN report)",
    dailyActivity: [
      { date: "2026-01-28", event: "South Sudan military launches major offensive against opposition in Jonglei. Civilians told to evacuate." },
      { date: "2026-02-27", event: "UN Human Rights Council report: risk of 'return to full-scale war'." }
    ],
    region: "Africa", country: "South Sudan", countryCode: "OD",
    conflictName: "South Sudan Conflict",
    urls: ["https://www.aljazeera.com/news/2026/2/27/south-sudan-at-risk-of-return-to-full-scale-war-un-report-warns"]
  },

  // ============================================================
  // STRAIT OF HORMUZ -- OIL/GAS DISRUPTION
  // ============================================================
  {
    name: "Strait of Hormuz -- Oil/Gas Disruption",
    lat: 26.56, lng: 56.25,
    count: 380, articles: 15000,
    severity: "critical",
    attackTypes: ["Naval"],
    weapons: [],
    description: "Closure of Strait of Hormuz following US-Israel strikes on Iran. Disruption of global oil and gas shipments. Iranian attacks on civilian aviation in Kuwait and UAE. Maersk suspends Red Sea transit.",
    casualties: "Economic -- massive global supply chain disruption",
    dailyActivity: [
      { date: "2026-02-28", event: "Strait of Hormuz effectively closed. Global oil prices spike. Maersk suspends Red Sea shipping." },
      { date: "2026-02-28", event: "Iran attacks civilian airports in Kuwait and UAE." }
    ],
    region: "Middle East", country: "Iran", countryCode: "IR",
    conflictName: "2026 US-Israel Strikes on Iran",
    urls: ["https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran", "https://www.nytimes.com/2026/03/01/world/middleeast/maersk-red-sea-iran-war.html"]
  }
];

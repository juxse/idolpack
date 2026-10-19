export type RarityIndex = 0 | 1 | 2 | 3 | 4 | 5; // 0: Common, 1: Rare, 2: Epic, 3: Legendary, 4: Mythic, 5: 🌈 EXOTIC
export type RoleIndex = 0 | 1 | 2 | 3; // 0: Vocal, 1: Dancer, 2: Rapper, 3: Visual

export interface AbilityDef {
  id: string;
  name: string;
  desc: string;
  ultimateName: string;
}

export interface IdolCard {
  id: number;
  name: string;
  group: string;
  debutYear: number;
  era: 'GEN3' | 'GEN4' | 'GEN5';
  accentColor: string;
  rarity: RarityIndex;
  role: RoleIndex;
  abilityId: string;
  baseHp: number;
  baseAtk: number;
  key: string; // "Name|Group"
}

export interface BoosterPackBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  accentHex: string;
  featuredGroups: string[];
  costSingle: number;
  costPack5: number;
  costBox10: number;
}

export interface TourCity {
  id: number;
  name: string;
  country: string;
  arenaName: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  recommendedPower: number;
}

export interface QuestDef {
  id: string;
  type: 'roll' | 'win' | 'upgrade' | 'ultimate' | 'pack5' | 'collect';
  title: string;
  desc: string;
  target: number;
  rewardCoins: number;
  rewardDiamonds?: number;
  rewardXp: number;
  isMilestone?: boolean;
}

export const RARITY_CODES = ['C', 'R', 'E', 'L', 'M', 'EX'] as const;
export const RARITY_LABELS = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Exotic'] as const;
export const RARITY_WEIGHTS = [56, 26, 12, 4.3, 1.2, 0.5] as const; // Balanced TCG rates with 0.5% Exotic
export const BASE_HP_BY_RARITY = [110, 155, 220, 320, 470, 620] as const;
export const BASE_ATK_BY_RARITY = [16, 23, 33, 46, 66, 88] as const;
export const DUPLICATE_COIN_REWARD = [20, 45, 110, 260, 650, 1500] as const;

export const ROLES: Array<{ id: RoleIndex; name: string; short: string; icon: string; bonusDesc: string }> = [
  { id: 0, name: 'Main Vocal', short: 'Vocal', icon: '🎤', bonusDesc: 'Unggul lawan Dancer (+25% DMG) · Ultimate Heal Tim' },
  { id: 1, name: 'Main Dancer', short: 'Dancer', icon: '💃', bonusDesc: 'Unggul lawan Rapper (+25% DMG) · Ultimate Stun Lawan' },
  { id: 2, name: 'Main Rapper', short: 'Rapper', icon: '🎧', bonusDesc: 'Unggul lawan Vocal (+25% DMG) · Ultimate AoE Crit +30%' },
  { id: 3, name: 'Center Visual', short: 'Visual', icon: '🌟', bonusDesc: 'All-Rounder (+12% DMG ke semua) · Ultimate Shield + Aura' },
];

export const ABILITIES: Record<string, AbilityDef> = {
  crit: {
    id: 'crit',
    name: 'Killing Part',
    desc: '35% peluang serangan menjadi Critical Stage (Damage ×2.0)',
    ultimateName: 'Fancam Viral Nova',
  },
  heal: {
    id: 'heal',
    name: 'Encore Harmony',
    desc: 'Memulihkan 14% HP rekan tim terlemah setiap kali menyerang',
    ultimateName: 'Heavenly High Note',
  },
  shield: {
    id: 'shield',
    name: 'Formation Guard',
    desc: 'Memulai konser dengan Lightstick Shield sebesar 28% Max HP',
    ultimateName: 'Diamond Dome Barrier',
  },
  life: {
    id: 'life',
    name: 'Spotlight Drain',
    desc: 'Menyerap 32% dari damage serangan menjadi HP diri sendiri',
    ultimateName: 'Midnight Velvet Steal',
  },
  burn: {
    id: 'burn',
    name: 'Pyro Stage',
    desc: 'Membakar musuh selama 3 giliran (7% Max HP per giliran)',
    ultimateName: 'Inferno Finale Drop',
  },
  stun: {
    id: 'stun',
    name: 'Camera Freeze',
    desc: '30% peluang membuat target terpaku (Skip 1 giliran)',
    ultimateName: 'Ending Fairy Pose',
  },
  rage: {
    id: 'rage',
    name: 'Mic Drop Tempo',
    desc: 'ATK meningkat +14% secara permanen setiap kali menyerang',
    ultimateName: 'Cypher Overdrive',
  },
  aoe: {
    id: 'aoe',
    name: 'Bass Wave',
    desc: 'Serangan memantul ke 2 musuh lain sebesar 45% Damage',
    ultimateName: 'Stadium Megabass Shock',
  },
  ref: {
    id: 'ref',
    name: 'Mirror Choreo',
    desc: 'Memantulkan 28% damage yang diterima kembali ke penyerang',
    ultimateName: 'Prism Counter Dance',
  },
  dodge: {
    id: 'dodge',
    name: 'Freestyle Step',
    desc: '26% peluang menghindari serangan lawan sepenuhnya',
    ultimateName: 'Illusion Moonwalk',
  },
  buff: {
    id: 'buff',
    name: 'Leader Charisma',
    desc: 'Meningkatkan ATK seluruh member di deck +12% sejak awal battle',
    ultimateName: 'All-Kill Anthem',
  },
  snipe: {
    id: 'snipe',
    name: 'Ending Fairy Focus',
    desc: 'Selalu mengincar lawan dengan sisa HP paling rendah (+15% DMG)',
    ultimateName: 'Laser Focus Shot',
  },
  revive: {
    id: 'revive',
    name: 'Comeback Stage',
    desc: 'Bangkit kembali 1 kali saat KO dengan 38% Max HP & +50 Energi',
    ultimateName: 'Immortal Encore',
  },
  battery: {
    id: 'battery',
    name: 'Hype Maker',
    desc: 'Mengisi +20 Energi tambahan ke diri sendiri & 1 rekan tiap serang',
    ultimateName: 'Lightstick Ocean Surge',
  },
};

// [GroupName, DebutYear, Era, AccentHex, BaseTierWeight(1..5),CommaSeparatedMembers]
export const RAW_GROUPS: Array<[string, number, 'GEN3' | 'GEN4' | 'GEN5', string, number, string]> = [
  // GEN 3 LEGENDS & QUEENS
  ['BTS', 2013, 'GEN3', '#9D6BFF', 5, 'RM,Jin,Suga,J-Hope,Jimin,V,Jungkook'],
  ['BLACKPINK', 2016, 'GEN3', '#FF4FA3', 5, 'Jisoo,Jennie,Rosé,Lisa'],
  ['TWICE', 2015, 'GEN3', '#FF85B3', 4, 'Nayeon,Jeongyeon,Momo,Sana,Jihyo,Mina,Dahyun,Chaeyoung,Tzuyu'],
  ['SEVENTEEN', 2015, 'GEN3', '#F7A8B8', 4, 'S.Coups,Jeonghan,Joshua,Jun,Hoshi,Wonwoo,Woozi,DK,Mingyu,The8,Seungkwan,Vernon,Dino'],
  ['Red Velvet', 2014, 'GEN3', '#FF5E7E', 4, 'Irene,Seulgi,Wendy,Joy,Yeri'],
  ['EXO', 2012, 'GEN3', '#7CA5FF', 4, 'Suho,Baekhyun,Chanyeol,D.O.,Kai,Sehun'],
  ['GFRIEND', 2015, 'GEN3', '#78C6FF', 3, 'Sowon,Yerin,Eunha,Yuju,SinB,Umji'],
  ['MONSTA X', 2015, 'GEN3', '#E8687E', 3, 'Shownu,Minhyuk,Kihyun,Hyungwon,Joohoney,I.M'],

  // GEN 4 POWERHOUSES (2018-2022)
  ['Stray Kids', 2018, 'GEN4', '#FF5252', 5, 'Bang Chan,Lee Know,Changbin,Hyunjin,Han,Felix,Seungmin,I.N'],
  ['(G)I-DLE', 2018, 'GEN4', '#B967FF', 4, 'Soyeon,Miyeon,Minnie,Yuqi,Shuhua'],
  ['ATEEZ', 2018, 'GEN4', '#FF9248', 4, 'Hongjoong,Seonghwa,Yunho,Yeosang,San,Mingi,Wooyoung,Jongho'],
  ['ITZY', 2019, 'GEN4', '#FF5C8A', 4, 'Yeji,Lia,Ryujin,Chaeryeong,Yuna'],
  ['TXT', 2019, 'GEN4', '#4ECBFF', 4, 'Soobin,Yeonjun,Beomgyu,Taehyun,Hueningkai'],
  ['aespa', 2020, 'GEN4', '#8E7DFF', 5, 'Karina,Giselle,Winter,Ningning'],
  ['ENHYPEN', 2020, 'GEN4', '#E6AC38', 4, 'Jungwon,Heeseung,Jay,Jake,Sunghoon,Sunoo,Ni-ki'],
  ['STAYC', 2020, 'GEN4', '#FF7BB0', 3, 'Sumin,Sieun,Isa,Seeun,Yoon,J'],
  ['IVE', 2021, 'GEN4', '#FF6BA8', 5, 'Yujin,Gaeul,Rei,Wonyoung,Liz,Leeseo'],
  ['NewJeans', 2022, 'GEN4', '#47C8FF', 5, 'Minji,Hanni,Danielle,Haerin,Hyein'],
  ['LE SSERAFIM', 2022, 'GEN4', '#7B8CDE', 4, 'Chaewon,Sakura,Yunjin,Kazuha,Eunchae'],
  ['NMIXX', 2022, 'GEN4', '#38E096', 4, 'Lily,Haewon,Sullyoon,Bae,Jiwoo,Kyujin'],
  ['Kep1er', 2022, 'GEN4', '#C48BFF', 3, 'Yujin,Xiaoting,Chaehyun,Dayeon,Hikaru,Huening Bahiyyih,Youngeun'],

  // GEN 5 & 2023-2026 ROOKIE WAVE
  ['ZEROBASEONE', 2023, 'GEN5', '#5AA9F0', 4, 'Sung Hanbin,Kim Jiwoong,Zhang Hao,Seok Matthew,Kim Taerae,Ricky,Kim Gyuvin,Park Gunwook,Han Yujin'],
  ['RIIZE', 2023, 'GEN5', '#FF9C5C', 4, 'Shotaro,Eunseok,Sungchan,Wonbin,Sohee,Anton'],
  ['BOYNEXTDOOR', 2023, 'GEN5', '#4DC4FF', 3, 'Sungho,Riwoo,Jaehyun,Taesan,Leehan,Woonhak'],
  ['KISS OF LIFE', 2023, 'GEN5', '#FF4D79', 4, 'Julie,Natty,Belle,Haneul'],
  ['tripleS', 2023, 'GEN5', '#A594FF', 3, 'Yooyeon,Nakyeon,Sohyun,Xinyu,Kotone,Seoyeon'],
  ['QWER', 2023, 'GEN5', '#5CE6B8', 3, 'Chodan,Magenta,Hina,Siyeon'],
  ['BABYMONSTER', 2024, 'GEN5', '#FF5599', 4, 'Ruka,Pharita,Asa,Ahyeon,Rami,Rora,Chiquita'],
  ['ILLIT', 2024, 'GEN5', '#FF9EBB', 4, 'Yunah,Minju,Moka,Wonhee,Iroha'],
  ['TWS', 2024, 'GEN5', '#5CB8FF', 3, 'Shinyu,Dohoon,Youngjae,Hanjin,Jihoon,Kyungmin'],
  ['MEOVV', 2024, 'GEN5', '#D68FFF', 4, 'Sooin,Gawon,Anna,Narin,Ella'],
  ['izna', 2024, 'GEN5', '#FF78C4', 4, 'Mai,Bang Jeemin,Yoon Jiyoon,Coco,Ryu Sarang,Choi Jungeun,Jeong Saebi'],
  ['RESCENE', 2024, 'GEN5', '#70E6C8', 3, 'Woni,Liv,Minami,May,Zena'],
  ['KATSEYE', 2024, 'GEN5', '#FF8066', 3, 'Manon,Sophia,Daniela,Lara,Megan,Yoonchae'],
  ['NCT WISH', 2024, 'GEN5', '#9EE668', 3, 'Sion,Riku,Yushi,Jaehee,Ryo,Sakuya'],
  ['UNIS', 2024, 'GEN5', '#FFB0DF', 2, 'Hyeonju,Nana,Gehlee,Kotoko,Yunha,Elisia,Yoona,Seowon'],
  ['BADVILLAIN', 2024, 'GEN5', '#C259FF', 2, 'Emma,Chloe Young,Hu’e,Ina,YunSeo,Vin,Kelly'],
  ['KiiiKiii', 2025, 'GEN5', '#FF66B2', 4, 'Jiyu,Leesol,Sui,Haum,Kya'],
  ['Hearts2Hearts', 2025, 'GEN5', '#FF8DA1', 4, 'Jiwoo,Carmen,Yuha,Stella,Juun,A-na,Ian,Ye-on'],
  ['CORTIS', 2025, 'GEN5', '#3AD6BD', 3, 'Martin,James,Juhoon,Seonghyeon,Keonho'],
  ['ALPHA DRIVE ONE', 2026, 'GEN5', '#8F9CFF', 3, 'Junseo,Arno,Leo,Geonwoo,Sangwon,Xinlong,Anxin,Sanghyeon'],
];

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const ABILITY_KEYS = Object.keys(ABILITIES);

// Special curated Mythic / Legendary / Rare Idols (Wonyoung, Yujin, Woni explicitly set to Rare 1 as requested)
const ICONIC_RARITY_OVERRIDES: Record<string, RarityIndex> = {
  'Wonyoung|IVE': 1,
  'Yujin|IVE': 1,
  'Yujin|Kep1er': 1,
  'Woni|RESCENE': 1,
  'Karina|aespa': 4,
  'Winter|aespa': 4,
  'Jennie|BLACKPINK': 4,
  'Lisa|BLACKPINK': 4,
  'Jungkook|BTS': 4,
  'V|BTS': 4,
  'Sana|TWICE': 4,
  'Nayeon|TWICE': 4,
  'Hyunjin|Stray Kids': 4,
  'Felix|Stray Kids': 4,
  'Hanni|NewJeans': 4,
  'Haerin|NewJeans': 4,
  'Chaewon|LE SSERAFIM': 4,
  'Ahyeon|BABYMONSTER': 4,
  'Wonhee|ILLIT': 4,
  'Sung Hanbin|ZEROBASEONE': 4,
  'Zhang Hao|ZEROBASEONE': 4,
  'Wonbin|RIIZE': 4,
  'Natty|KISS OF LIFE': 4,
  'Bang Jeemin|izna': 4,
  'Jiyu|KiiiKiii': 4,
  'Carmen|Hearts2Hearts': 4,
  'Jiwoo|Hearts2Hearts': 3,
  'Ella|MEOVV': 4,
  'Gawon|MEOVV': 3,
  'Minju|ILLIT': 3,
};

export const ALL_CARDS: IdolCard[] = [];
export const CARDS_BY_RARITY: IdolCard[][] = [[], [], [], [], [], []];

RAW_GROUPS.forEach(([group, debutYear, era, accentColor, _tierWeight, membersCsv]) => {
  const memberList = membersCsv.split(',').map((s) => s.trim());
  memberList.forEach((name, memberIdx) => {
    const key = `${name}|${group}`;
    const h = deterministicHash(key);
    // Distribute every group's members across Common (0), Rare (1), Epic (2), Legendary (3)
    // so every group (including Hearts2Hearts, ILLIT, MEOVV, IVE, aespa, BTS, BLACKPINK)
    // can be pulled across all rarity rolls, with iconic centers at Mythic (4).
    let rarity = ((memberIdx + (h % 2)) % 4) as RarityIndex;
    if (ICONIC_RARITY_OVERRIDES[key] !== undefined) {
      rarity = ICONIC_RARITY_OVERRIDES[key];
    }

    const role = ((h >> 3) % 4) as RoleIndex;
    const abilityId = ABILITY_KEYS[h % ABILITY_KEYS.length];
    const hpVariance = 0.92 + ((h % 17) / 100);
    const atkVariance = 0.92 + (((h >> 5) % 17) / 100);

    const card: IdolCard = {
      id: ALL_CARDS.length,
      name,
      group,
      debutYear,
      era,
      accentColor,
      rarity,
      role,
      abilityId,
      baseHp: Math.round(BASE_HP_BY_RARITY[rarity] * hpVariance),
      baseAtk: Math.round(BASE_ATK_BY_RARITY[rarity] * atkVariance),
      key,
    };

    ALL_CARDS.push(card);
    CARDS_BY_RARITY[rarity].push(card);
  });
});

export const BOOSTER_BANNERS: BoosterPackBanner[] = [
  {
    id: 'rookie_wave',
    title: 'NEXT WAVE 2024–2026',
    subtitle: 'Hearts2Hearts · ILLIT · MEOVV · KiiiKiii · BABYMONSTER · izna · RESCENE · TWS',
    badge: 'GEN 5 RATE UP',
    primaryColor: '#0066FF',
    secondaryColor: '#38BDF8',
    accentHex: '#38BDF8',
    featuredGroups: [
      'Hearts2Hearts',
      'ILLIT',
      'MEOVV',
      'KiiiKiii',
      'BABYMONSTER',
      'RESCENE',
      'izna',
      'TWS',
      'ZEROBASEONE',
      'RIIZE',
      'KISS OF LIFE',
      'BOYNEXTDOOR',
      'KATSEYE',
      'NCT WISH',
      'UNIS',
      'BADVILLAIN',
      'CORTIS',
      'ALPHA DRIVE ONE',
    ],
    costSingle: 80,
    costPack5: 360,
    costBox10: 680,
  },
  {
    id: 'queens_era',
    title: 'SYNK & DIVE APEX',
    subtitle: 'IVE · aespa · NewJeans · LE SSERAFIM · ENHYPEN · NMIXX · STAYC · QWER',
    badge: 'GEN 4 ICONS',
    primaryColor: '#4F46E5',
    secondaryColor: '#06B6D4',
    accentHex: '#38BDF8',
    featuredGroups: [
      'IVE',
      'aespa',
      'NewJeans',
      'LE SSERAFIM',
      'ENHYPEN',
      'NMIXX',
      'STAYC',
      'Kep1er',
      'tripleS',
      'QWER',
      '(G)I-DLE',
      'ITZY',
      'TXT',
      'ATEEZ',
    ],
    costSingle: 80,
    costPack5: 360,
    costBox10: 680,
  },
  {
    id: 'legends_hall',
    title: 'HALL OF CROWNS',
    subtitle: 'BTS · BLACKPINK · TWICE · Stray Kids · SEVENTEEN · Red Velvet · EXO',
    badge: 'MEGA LEGENDS',
    primaryColor: '#FFB62E',
    secondaryColor: '#E11D48',
    accentHex: '#FBBF24',
    featuredGroups: [
      'BTS',
      'BLACKPINK',
      'TWICE',
      'Stray Kids',
      'SEVENTEEN',
      'Red Velvet',
      'EXO',
      'GFRIEND',
      'MONSTA X',
    ],
    costSingle: 80,
    costPack5: 360,
    costBox10: 680,
  },
  {
    id: 'omni_allstar',
    title: 'ALL-ERA OMNI EDITION',
    subtitle: 'Seluruh 41 Grup K-Pop (2012–2026) dalam Satu Koleksi Hologram',
    badge: '270+ IDOLS',
    primaryColor: '#A855F7',
    secondaryColor: '#06B6D4',
    accentHex: '#C084FC',
    featuredGroups: [],
    costSingle: 75,
    costPack5: 340,
    costBox10: 640,
  },
];

// 18 World Tour Cities x 5 Stages = 90 Stages Total!
export const WORLD_TOUR_CITIES: TourCity[] = [
  { id: 0, name: 'Hongdae Busking', country: 'Korea Selatan', arenaName: 'Hongdae Indie Street', icon: '🎸', primaryColor: '#FF4FA3', secondaryColor: '#7C3AED', recommendedPower: 280 },
  { id: 1, name: 'Gangnam K-Star', country: 'Korea Selatan', arenaName: 'COEX Artium Live', icon: '🏙️', primaryColor: '#38BDF8', secondaryColor: '#6366F1', recommendedPower: 420 },
  { id: 2, name: 'Busan Ocean', country: 'Korea Selatan', arenaName: 'Gwangan Bridge Stage', icon: '🌊', primaryColor: '#06B6D4', secondaryColor: '#3B82F6', recommendedPower: 580 },
  { id: 3, name: 'Incheon Sky', country: 'Korea Selatan', arenaName: 'Inspire Arena', icon: '✈️', primaryColor: '#8B5CF6', secondaryColor: '#EC4899', recommendedPower: 760 },
  { id: 4, name: 'Daegu Fiesta', country: 'Korea Selatan', arenaName: 'Daegu Stadium', icon: '🔥', primaryColor: '#F97316', secondaryColor: '#EF4444', recommendedPower: 960 },
  { id: 5, name: 'Jeju Island', country: 'Korea Selatan', arenaName: 'Sunset Cliff Amphitheater', icon: '🌴', primaryColor: '#10B981', secondaryColor: '#06B6D4', recommendedPower: 1180 },
  { id: 6, name: 'Tokyo Dome', country: 'Jepang', arenaName: 'Tokyo Dome Special', icon: '🗼', primaryColor: '#EC4899', secondaryColor: '#F43F5E', recommendedPower: 1450 },
  { id: 7, name: 'Osaka Kyocera', country: 'Jepang', arenaName: 'Kyocera Dome Osaka', icon: '🏮', primaryColor: '#F59E0B', secondaryColor: '#EF4444', recommendedPower: 1750 },
  { id: 8, name: 'Jakarta GBK', country: 'Indonesia', arenaName: 'Gelora Bung Karno Main Stadium', icon: '🇮🇩', primaryColor: '#EF4444', secondaryColor: '#F97316', recommendedPower: 2100 },
  { id: 9, name: 'Bangkok Encore', country: 'Thailand', arenaName: 'Rajamangala National Stadium', icon: '🐘', primaryColor: '#EAB308', secondaryColor: '#A855F7', recommendedPower: 2500 },
  { id: 10, name: 'Manila Arena', country: 'Filipina', arenaName: 'Philippine Arena', icon: '☀️', primaryColor: '#3B82F6', secondaryColor: '#F59E0B', recommendedPower: 2950 },
  { id: 11, name: 'Singapore Bay', country: 'Singapura', arenaName: 'National Stadium Kallang', icon: '🦁', primaryColor: '#06B6D4', secondaryColor: '#8B5CF6', recommendedPower: 3450 },
  { id: 12, name: 'Taipei Neon', country: 'Taiwan', arenaName: 'Taipei Dome', icon: '🧋', primaryColor: '#A855F7', secondaryColor: '#EC4899', recommendedPower: 4000 },
  { id: 13, name: 'Los Angeles', country: 'Amerika Serikat', arenaName: 'SoFi Stadium Hollywood', icon: '🎬', primaryColor: '#F59E0B', secondaryColor: '#EC4899', recommendedPower: 4650 },
  { id: 14, name: 'New York', country: 'Amerika Serikat', arenaName: 'Madison Square Garden', icon: '🗽', primaryColor: '#38BDF8', secondaryColor: '#1D4ED8', recommendedPower: 5350 },
  { id: 15, name: 'London', country: 'Inggris', arenaName: 'Wembley Stadium', icon: '👑', primaryColor: '#EF4444', secondaryColor: '#6366F1', recommendedPower: 6150 },
  { id: 16, name: 'Paris', country: 'Prancis', arenaName: 'Paris La Défense Arena', icon: '✨', primaryColor: '#EC4899', secondaryColor: '#8B5CF6', recommendedPower: 7050 },
  { id: 17, name: 'World Idol Finale', country: 'Global', arenaName: 'Seoul Jamsil Grand Dome', icon: '🏆', primaryColor: '#FBBF24', secondaryColor: '#FF4FA3', recommendedPower: 8200 },
];

export const STAGE_ROLES_INFO = [
  { title: 'Opening Act', icon: '🎤', quote: 'Pemanasan vokal dulu sebelum panggung utama!' },
  { title: 'Dance Break Rival', icon: '💃', quote: 'Koreografi kami tidak akan kalah presisi!' },
  { title: 'Cypher Challenger', icon: '🎧', quote: 'Beat drop! Siap adu rap di atas panggung?' },
  { title: 'Visual Sub-Unit', icon: '🌟', quote: 'Semua kamera mengarah ke formasi kami!' },
  { title: 'HEADLINER BOSS', icon: '👑', quote: 'Panggung utama kota ini milik grup kami!' },
];

export const DAILY_QUESTS: QuestDef[] = [
  {
    id: 'dq_roll_3',
    type: 'roll',
    title: 'Audisi Pagi',
    desc: 'Rekrut 3 Photocard Idol dari Booster Pack mana saja',
    target: 3,
    rewardCoins: 140,
    rewardDiamonds: 4,
    rewardXp: 40,
  },
  {
    id: 'dq_pack5_1',
    type: 'pack5',
    title: 'Sobek Foil Pack ×5',
    desc: 'Buka 1 Booster Pack ×5 atau Mega Box ×10 di 3D Pack Studio',
    target: 1,
    rewardCoins: 220,
    rewardDiamonds: 6,
    rewardXp: 70,
  },
  {
    id: 'dq_win_2',
    type: 'win',
    title: 'Debut Panggung',
    desc: 'Menangkan 2 Live Battle di World Tour Arena atau Queendom Tower',
    target: 2,
    rewardCoins: 180,
    rewardDiamonds: 5,
    rewardXp: 60,
  },
  {
    id: 'dq_up_2',
    type: 'upgrade',
    title: 'Latihan Vokal & Koreo',
    desc: 'Naikkan Level (Upgrade) Photocard sebanyak 2 kali',
    target: 2,
    rewardCoins: 160,
    rewardDiamonds: 4,
    rewardXp: 50,
  },
  {
    id: 'dq_ult_2',
    type: 'ultimate',
    title: 'Fancam Klimaks',
    desc: 'Aktifkan 2 Ultimate Skill atau Rhythm Fever saat Battle',
    target: 2,
    rewardCoins: 200,
    rewardDiamonds: 5,
    rewardXp: 65,
  },
  {
    id: 'dq_win_5',
    type: 'win',
    title: 'All-Kill Chart Harian',
    desc: 'Menangkan 5 Live Battle di World Tour Arena atau Queendom Tower hari ini',
    target: 5,
    rewardCoins: 350,
    rewardDiamonds: 8,
    rewardXp: 120,
  },
];

export const CAREER_MILESTONES: QuestDef[] = [
  {
    id: 'ms_col_15',
    type: 'collect',
    title: 'Kolektor Rookie',
    desc: 'Miliki 15 Idol Photocard berbeda di dalam 3D Binder',
    target: 15,
    rewardCoins: 400,
    rewardDiamonds: 15,
    rewardXp: 150,
    isMilestone: true,
  },
  {
    id: 'ms_col_45',
    type: 'collect',
    title: 'Kurator Agensi',
    desc: 'Miliki 45 Idol Photocard berbeda di dalam 3D Binder',
    target: 45,
    rewardCoins: 800,
    rewardDiamonds: 25,
    rewardXp: 300,
    isMilestone: true,
  },
  {
    id: 'ms_col_100',
    type: 'collect',
    title: 'Museum K-Pop Hall',
    desc: 'Miliki 100 Idol Photocard berbeda di dalam 3D Binder',
    target: 100,
    rewardCoins: 1800,
    rewardDiamonds: 45,
    rewardXp: 600,
    isMilestone: true,
  },
  {
    id: 'ms_win_15',
    type: 'win',
    title: 'Bintang Asia Tour',
    desc: 'Menangkan total 15 Stage Battle di World Tour',
    target: 15,
    rewardCoins: 550,
    rewardDiamonds: 20,
    rewardXp: 250,
    isMilestone: true,
  },
  {
    id: 'ms_roll_50',
    type: 'roll',
    title: 'Gacha High-Roller',
    desc: 'Lakukan total 50 kali penarikan Photocard',
    target: 50,
    rewardCoins: 650,
    rewardDiamonds: 25,
    rewardXp: 280,
    isMilestone: true,
  },
];

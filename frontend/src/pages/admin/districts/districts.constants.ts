export interface OfficialDistrictItem {
  name: string;
  region: string;
  code: string;
}

export const NAMANGAN_OFFICIAL_DISTRICTS: OfficialDistrictItem[] = [
  { name: 'Davlatobod tumani', region: 'Namangan', code: 'davlatobod' },
  { name: 'Yangi Namangan tumani', region: 'Namangan', code: 'yangi_namangan' },
  { name: 'Namangan shahri', region: 'Namangan', code: 'namangan_shahar' },
  { name: 'Chust tumani', region: 'Namangan', code: 'chust' },
  { name: 'Kosonsoy tumani', region: 'Namangan', code: 'kosonsoy' },
  { name: 'Chortoq tumani', region: 'Namangan', code: 'chortoq' },
  { name: 'Pop tumani', region: 'Namangan', code: 'pop' },
  { name: 'To‘raqo‘rg‘on tumani', region: 'Namangan', code: 'toraqorgon' },
  { name: 'Uchqo‘rg‘on tumani', region: 'Namangan', code: 'uchqorgon' },
  { name: 'Uychi tumani', region: 'Namangan', code: 'uychi' },
  { name: 'Mingbuloq tumani', region: 'Namangan', code: 'mingbuloq' },
  { name: 'Norin tumani', region: 'Namangan', code: 'norin' },
  { name: 'Yangiqo‘rg‘on tumani', region: 'Namangan', code: 'yangiqorgon' },
  { name: 'Namangan tumani', region: 'Namangan', code: 'namangan_tuman' }
];

export const OTHER_OFFICIAL_DISTRICTS: OfficialDistrictItem[] = [
  { name: 'Andijon shahri', region: 'Andijon', code: 'andijon_shahar' },
  { name: 'Asaka tumani', region: 'Andijon', code: 'asaka' },
  { name: 'Shahrixon tumani', region: 'Andijon', code: 'shahrixon' },
  { name: 'Farg‘ona shahri', region: 'Farg‘ona', code: 'fargona_shahar' },
  { name: 'Marg‘ilon shahri', region: 'Farg‘ona', code: 'margilon_shahar' },
  { name: 'Qo‘qon shahri', region: 'Farg‘ona', code: 'qoqon_shahar' },
  { name: 'Rishton tumani', region: 'Farg‘ona', code: 'rishton' },
  { name: 'Oltiariq tumani', region: 'Farg‘ona', code: 'oltiariq' },
  { name: 'Toshkent shahri', region: 'Toshkent', code: 'toshkent_shahar' }
];

export const ALL_OFFICIAL_DISTRICTS: OfficialDistrictItem[] = [
  ...NAMANGAN_OFFICIAL_DISTRICTS,
  ...OTHER_OFFICIAL_DISTRICTS
];

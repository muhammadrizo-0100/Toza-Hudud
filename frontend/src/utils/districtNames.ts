export const DISTRICT_CYRILLIC_MAP: Record<string, string> = {
  'Namangan shahri': 'Наманган шаҳри',
  'Davlatobod tumani': 'Давлатобод тумани',
  'Yangi Namangan tumani': 'Янги Наманган тумани',
  'Yangi Namangan Tumani': 'Янги Наманган тумани',
  'Chust tumani': 'Чуст тумани',
  'Kosonsoy tumani': 'Косонсой тумани',
  'Mingbuloq tumani': 'Мингбулоқ тумани',
  'Norin tumani': 'Норин тумани',
  'Pop tumani': 'Поп тумани',
  'To‘raqo‘rg‘on tumani': 'Тўрақўрғон тумани',
  "To'raqo'rg'on tumani": 'Тўрақўрғон тумани',
  'Uychi tumani': 'Уйчи тумани',
  'Uchqo‘rg‘on tumani': 'Учқўрғон тумани',
  "Uchqo'rg'on tumani": 'Учқўрғон тумани',
  'Yangiqo‘rg‘on tumani': 'Янгиқўрғон тумани',
  "Yangiqo'rg'on tumani": 'Янгиқўрғон тумани',
  'Chortoq tumani': 'Чортоқ тумани',
  'Namangan tumani': 'Наманган тумани',
  'Namangan viloyati': 'Наманган вилояти',
  'Barcha tumanlar': 'Барча туманлар'
};

export function translateDistrictName(name?: string | null, lang: 'uz' | 'oz' = 'uz'): string {
  if (!name) return '';
  if (lang !== 'oz') return name;

  const trimmed = name.trim();
  if (DISTRICT_CYRILLIC_MAP[trimmed]) {
    return DISTRICT_CYRILLIC_MAP[trimmed];
  }

  // Handle case variations or suffixes
  let result = trimmed;
  for (const [lat, cyr] of Object.entries(DISTRICT_CYRILLIC_MAP)) {
    if (result.toLowerCase() === lat.toLowerCase()) {
      return cyr;
    }
  }

  // Fallback for general "tumani" / "shahri"
  result = result
    .replace(/\btumani\b/gi, 'тумани')
    .replace(/\bshahri\b/gi, 'шаҳри')
    .replace(/\bviloyati\b/gi, 'вилояти')
    .replace(/\bMFY\b/g, 'МФЙ');

  return result;
}

export const MAHALLA_CYRILLIC_MAP: Record<string, string> = {
  'Damariq MFY': 'Дамариқ МФЙ',
  'Elxon MFY': 'Элхон МФЙ',
  'Gulshan MFY': 'Гулшан МФЙ',
  'Mustaqillik MFY': 'Мустақиллик МФЙ',
  'Navbahor MFY': 'Навбаҳор МФЙ',
  'Orzu MFY': 'Орзу МФЙ',
  'Porloq MFY': 'Порлоқ МФЙ',
  'Sohil MFY': 'Соҳил МФЙ',
  "To'qimachi MFY": 'Тўқимачи МФЙ',
  "To‘qimachi MFY": 'Тўқимачи МФЙ',
  'Yuksalish MFY': 'Юксалиш МФЙ'
};

export function latinToCyrillic(str: string): string {
  if (!str) return '';
  return str
    .replace(/MFY/g, 'МФЙ')
    .replace(/mfy/g, 'мфй')
    .replace(/O['‘`ʻ]/g, 'Ў')
    .replace(/o['‘`ʻ]/g, 'ў')
    .replace(/G['‘`ʻ]/g, 'Ғ')
    .replace(/g['‘`ʻ]/g, 'ғ')
    .replace(/Sh/g, 'Ш')
    .replace(/SH/g, 'Ш')
    .replace(/sh/g, 'ш')
    .replace(/Ch/g, 'Ч')
    .replace(/CH/g, 'Ч')
    .replace(/ch/g, 'ч')
    .replace(/Yo/g, 'Ё')
    .replace(/YO/g, 'Ё')
    .replace(/yo/g, 'ё')
    .replace(/Yu/g, 'Ю')
    .replace(/YU/g, 'Ю')
    .replace(/yu/g, 'ю')
    .replace(/Ya/g, 'Я')
    .replace(/YA/g, 'Я')
    .replace(/ya/g, 'я')
    .replace(/Ye/g, 'Е')
    .replace(/YE/g, 'Е')
    .replace(/ye/g, 'е')
    .replace(/Ts/g, 'Ц')
    .replace(/ts/g, 'ц')
    .replace(/A/g, 'А')
    .replace(/a/g, 'а')
    .replace(/B/g, 'Б')
    .replace(/b/g, 'б')
    .replace(/D/g, 'Д')
    .replace(/d/g, 'д')
    .replace(/(^|\s|[aeiouAEIOU])E/g, '$1Э')
    .replace(/(^|\s|[aeiouAEIOU])e/g, '$1э')
    .replace(/E/g, 'Е')
    .replace(/e/g, 'е')
    .replace(/F/g, 'Ф')
    .replace(/f/g, 'ф')
    .replace(/G/g, 'Г')
    .replace(/g/g, 'г')
    .replace(/H/g, 'Ҳ')
    .replace(/h/g, 'ҳ')
    .replace(/I/g, 'И')
    .replace(/i/g, 'и')
    .replace(/J/g, 'Ж')
    .replace(/j/g, 'ж')
    .replace(/K/g, 'К')
    .replace(/k/g, 'к')
    .replace(/L/g, 'Л')
    .replace(/l/g, 'л')
    .replace(/M/g, 'М')
    .replace(/m/g, 'м')
    .replace(/N/g, 'Н')
    .replace(/n/g, 'н')
    .replace(/O/g, 'О')
    .replace(/o/g, 'о')
    .replace(/P/g, 'П')
    .replace(/p/g, 'п')
    .replace(/Q/g, 'Қ')
    .replace(/q/g, 'қ')
    .replace(/R/g, 'Р')
    .replace(/r/g, 'р')
    .replace(/S/g, 'С')
    .replace(/s/g, 'с')
    .replace(/T/g, 'Т')
    .replace(/t/g, 'т')
    .replace(/U/g, 'У')
    .replace(/u/g, 'у')
    .replace(/V/g, 'В')
    .replace(/v/g, 'в')
    .replace(/X/g, 'Х')
    .replace(/x/g, 'х')
    .replace(/Y/g, 'Й')
    .replace(/y/g, 'й')
    .replace(/Z/g, 'З')
    .replace(/z/g, 'з');
}

export function translateMahallaName(name?: string | null, lang: 'uz' | 'oz' = 'uz'): string {
  if (!name) return '';
  if (lang !== 'oz') return name;

  const trimmed = name.trim();
  if (MAHALLA_CYRILLIC_MAP[trimmed]) {
    return MAHALLA_CYRILLIC_MAP[trimmed];
  }

  for (const [lat, cyr] of Object.entries(MAHALLA_CYRILLIC_MAP)) {
    if (trimmed.toLowerCase() === lat.toLowerCase()) {
      return cyr;
    }
  }

  return latinToCyrillic(trimmed);
}

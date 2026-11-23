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

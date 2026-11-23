import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

export const WORKER_KEYBOARD = Markup.keyboard([
  ['🚛 Biriktirilgan vazifalarim'],
  ['📊 Mening hisobotlarim', '🚪 Tizimdan chiqish']
]).resize();

export const GUEST_KEYBOARD = Markup.keyboard([
  ['🔑 Xodim sifatida kirish']
]).resize();

export const CANCEL_KEYBOARD = Markup.keyboard([
  ['❌ Bekor qilish']
]).resize();

export const MAIN_CITIZEN_KEYBOARD = Markup.keyboard([
  ['📸 Chiqindi haqida xabar berish'],
  ['📋 Mening murojaatlarim', '📞 Aloqa']
]).resize();

export const WASTE_TYPE_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('🗑 Maishiy chiqindi', 'waste_maishiy'),
    Markup.button.callback('🧱 Qurilish chiqindisi', 'waste_qurilish')
  ],
  [
    Markup.button.callback('🍂 Xazon va shoxlar', 'waste_xazon'),
    Markup.button.callback('🛋 Katta hajmli chiqindi', 'waste_katta_hajmli')
  ],
  [
    Markup.button.callback('⚠️ Noqonuniy tashlandiq', 'waste_noqonuniy')
  ]
]);

export function buildDistrictButtons(
  districts: Array<{ id: number; name: string }>,
  selectedDistrictId?: number
): InlineKeyboardButton[][] {
  const buttons: InlineKeyboardButton[][] = [];
  for (let i = 0; i < districts.length; i += 2) {
    const row: InlineKeyboardButton[] = [];
    const d1 = districts[i];
    const isD1Selected = d1.id === selectedDistrictId;
    row.push(Markup.button.callback(`${isD1Selected ? '✅ ' : ''}${d1.name}`, `district_${d1.id}`));

    if (i + 1 < districts.length) {
      const d2 = districts[i + 1];
      const isD2Selected = d2.id === selectedDistrictId;
      row.push(Markup.button.callback(`${isD2Selected ? '✅ ' : ''}${d2.name}`, `district_${d2.id}`));
    }
    buttons.push(row);
  }
  return buttons;
}

export function buildMahallaButtons(
  mahallas: Array<{ id: number; name: string }>,
  selectedMahallaId?: number
): InlineKeyboardButton[][] {
  const buttons: InlineKeyboardButton[][] = [];
  for (let i = 0; i < mahallas.length; i += 2) {
    const row: InlineKeyboardButton[] = [];
    const m1 = mahallas[i];
    const isM1Selected = m1.id === selectedMahallaId;
    row.push(Markup.button.callback(`${isM1Selected ? '✅ ' : ''}${m1.name}`, `mahalla_${m1.id}`));

    if (i + 1 < mahallas.length) {
      const m2 = mahallas[i + 1];
      const isM2Selected = m2.id === selectedMahallaId;
      row.push(Markup.button.callback(`${isM2Selected ? '✅ ' : ''}${m2.name}`, `mahalla_${m2.id}`));
    }
    buttons.push(row);
  }

  buttons.push([
    Markup.button.callback('✍️ Mahallam ro‘yxatda yo‘q (nomini yozish)', 'custom_mahalla')
  ]);
  buttons.push([
    Markup.button.callback('🔄 Boshqa tumanni tanlash', 'change_district')
  ]);

  return buttons;
}

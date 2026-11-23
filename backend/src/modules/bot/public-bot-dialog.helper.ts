import { Markup } from 'telegraf';
import { DistrictsService } from '../districts/districts.service';
import { MahallasService } from '../mahallas/mahallas.service';
import { TunnelService } from '../tunnel/tunnel.service';
import { buildDistrictButtons, buildMahallaButtons } from './bot-keyboards.helper';
import { UserSession, WASTE_LABELS } from './bot.types';

export function getSummaryText(session: UserSession): string {
  const wasteLabel = WASTE_LABELS[session.wasteType || 'maishiy'] || '🗑 Maishiy chiqindi';
  const coords = session.lat && session.lng ? `🌐 **Koordinatalar:** 📍 ${session.lat.toFixed(5)}, ${session.lng.toFixed(5)}\n\n` : '\n';

  return (
    `📝 **Murojaat xulosasi:**\n\n` +
    `🏛 **Tuman:** ${session.districtName || 'Belgilangan tuman'}\n` +
    `🏘 **Mahalla:** ${session.mahallaName || 'Belgilangan mahalla'}\n` +
    `🗑 **Chiqindi turi:** ${wasteLabel}\n` +
    `📍 **Mo‘ljal/Manzil:** ${session.address || 'Xarita yoki GPS orqali belgilangan'}\n` +
    coords +
    `Murojaatni mutasaddilarga yuborishni tasdiqlaysizmi?`
  );
}

export async function sendDistrictSelection(
  ctx: any,
  districtsService: DistrictsService,
  selectedDistrictId?: number
): Promise<void> {
  const districts = await districtsService.findAll();
  if (districts.length === 0) {
    await ctx.reply('Hozircha tizimda faol tumanlar kiritilmagan. Iltimos, keyinroq urinib ko‘ring.');
    return;
  }

  const buttons = buildDistrictButtons(districts, selectedDistrictId);
  const title = selectedDistrictId
    ? `🏛 **Tumanni o‘zgartirish:**\n\nQuyidagi ro‘yxatdan yangi tumanni tanlang:`
    : `Chiqindi toifasi qabul qilindi. ✅\n\nEndi hududni aniqlash uchun **tumaningizni** tanlang:`;

  await ctx.reply(title, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(buttons)
  });
}

export async function sendMahallaSelection(
  ctx: any,
  session: UserSession,
  mahallasService: MahallasService
): Promise<void> {
  const districtId = session.districtId!;
  const districtName = session.districtName || 'Tuman';
  const mahallas = await mahallasService.findAll(districtId);

  if (mahallas.length > 0) {
    session.step = 'await_mahalla';
    const buttons = buildMahallaButtons(mahallas, session.mahallaId);

    await ctx.reply(
      `🏛 **Tanlangan tuman:** ✅ **${districtName}**\n\n` +
      `Ushbu tumandagi **mahallangizni** tanlang:\n\n` +
      `_(Agar adashib boshqa tumanni tanlagan bo‘lsangiz, quyidagi "🔄 Boshqa tumanni tanlash" tugmasini bosing)_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
  } else {
    session.step = 'await_landmark';
    await ctx.reply(
      `🏛 **Tanlangan tuman:** ✅ **${districtName}**\n\n` +
      `Ushbu tumanda mahallalar ro‘yxati topilmadi.\n` +
      `Iltimos, chiqindi joylashgan aniq manzil yoki mo‘ljalni yozing:`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([['🔄 Boshqa tumanni tanlash'], ['❌ Bekor qilish']]).resize()
      }
    );
  }
}

export async function sendLocationPrompt(
  ctx: any,
  session: UserSession,
  tunnelService: TunnelService
): Promise<void> {
  const liveUrl = tunnelService.getLiveFrontendUrl();
  const isHttps = typeof liveUrl === 'string' && liveUrl.toLowerCase().startsWith('https://');
  const districtName = session.districtName || '';
  const mahallaName = session.mahallaName || '';
  const miniAppUrl = isHttps
    ? `${liveUrl}/location-picker?lat=${session.lat}&lng=${session.lng}&name=${encodeURIComponent(mahallaName)}&district=${encodeURIComponent(districtName)}`
    : '';

  const keyboardRows: any[] = [];
  if (isHttps && miniAppUrl) {
    keyboardRows.push([Markup.button.webApp('🗺 Xaritadan belgilash (Mini App)', miniAppUrl)]);
  }
  keyboardRows.push([Markup.button.locationRequest('📍 GPS Lokatsiyamni yuborish')]);
  keyboardRows.push(['➡️ Mo‘ljalsiz davom etish']);
  keyboardRows.push(['🔄 Tuman yoki mahallani o‘zgartirish', '❌ Bekor qilish']);

  await ctx.reply(
    `📍 **Tanlangan hudud:**\n` +
    `🏛 Tuman: **${districtName || 'Belgilangan'}**\n` +
    `🏘 Mahalla: **${mahallaName}** ✅\n\n` +
    `Chiqindi to‘plangan joyni belgilash uchun quyidagi qulay usullardan foydalaning:\n\n` +
    (isHttps ? `🗺 **1. Mini App:** Pastdagi **"🗺 Xaritadan belgilash (Mini App)"** tugmasini bosing;\n` : '') +
    `📍 **2. GPS:** Pastdagi **"📍 GPS Lokatsiyamni yuborish"** tugmasini bosing;\n` +
    `📎 **3. Telegram xaritasi:** Qisqich (📎 Скрепка -> Локация) orqali xaritadan istalgan nuqtani tanlab yuboring;\n` +
    `✍️ **4. Mo‘ljal yozish:** Mo‘ljalni matn sifatida yozib yuboring (masalan: 12-maktab orqasi):`,
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard(keyboardRows).resize()
    }
  );
}

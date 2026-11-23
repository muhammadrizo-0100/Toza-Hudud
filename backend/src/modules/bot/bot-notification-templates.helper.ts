import { WorkerEntity } from '../../database/entities/worker.entity';
import { RequestEntity } from '../../database/entities/request.entity';

export function buildWorkerAssignmentNotification(
  request: RequestEntity,
  worker: WorkerEntity,
  isReassignment: boolean
): string {
  const roleLabel = worker.role === 'Inspector' ? '🔍 Hudud nazoratchisi / Usta' : '🚛 Maxsus texnika haydovchisi';
  const address = [request.mahallaName, request.address].filter(Boolean).join(', ') || 'Manzil ko‘rsatilmagan';
  const title = isReassignment ? '🚨 <b>QAYTA BIRIKTIRILGAN TOPSHIRIQ!</b>' : '🚨 <b>YANGI TOPSHIRIQ BIRIKTIRILDI!</b>';

  return (
    `${title}\n\n` +
    `📋 <b>Murojaat raqami:</b> #${request.id}\n` +
    `🏷 <b>Vazifa toifasi:</b> ${roleLabel}\n` +
    `📍 <b>Manzil:</b> ${address}\n` +
    `🗑 <b>Chiqindi turi:</b> ${request.wasteType || 'maishiy'}\n` +
    `👤 <b>Murojaatchi:</b> ${request.citizenFullName || 'Fuqaro'} (${request.citizenPhone || '-'})\n\n` +
    `Joyiga yetib borgach, tozalash ishlarini bajaring va hisobot fotosuratini yuborish uchun pastdagi tugmani bosing:`
  );
}

export function buildCitizenAssignmentNotification(
  request: RequestEntity,
  worker: WorkerEntity,
  isReassignment: boolean
): string {
  const roleLabel = worker.role === 'Inspector' ? 'Hudud nazoratchisi' : 'Haydovchi';
  const vehicleInfo = worker.vehicleNumber ? ` [${worker.vehicleNumber}]` : '';

  if (isReassignment) {
    return (
      `🔄 <b>Murojaatingiz bo‘yicha mas’ul ijrochi yangilandi!</b>\n\n` +
      `📋 <b>Murojaat raqami:</b> #${request.id}\n` +
      `👤 <b>Yangi mas’ul ijrochi:</b> ${worker.fullName} (${roleLabel}${vehicleInfo})\n` +
      `📞 <b>Aloqa telefoni:</b> ${worker.phone}\n` +
      `⏱ <b>Holati:</b> Jarayonda\n\n` +
      `ℹ️ Chiqindini tozalash uchun yangi mas'ul xodim va maxsus texnika yo‘naltirildi. Xodim tez orada manzilingizga yetib boradi.`
    );
  }

  return (
    `🚚 <b>Murojaatingizga mas’ul xodim biriktirildi!</b>\n\n` +
    `📋 <b>Murojaat raqami:</b> #${request.id}\n` +
    `👤 <b>Mas’ul ijrochi:</b> ${worker.fullName} (${roleLabel}${vehicleInfo})\n` +
    `📞 <b>Aloqa telefoni:</b> ${worker.phone}\n` +
    `⏱ <b>Holati:</b> Jarayonda\n\n` +
    `Xodim tez orada manzilingizga yetib boradi va masalani hal qiladi.`
  );
}

export function buildWorkerSubmittedNotification(request: RequestEntity): string {
  const address = [request.mahallaName, request.address].filter(Boolean).join(', ') || 'Manzil ko‘rsatilmagan';
  return (
    `⏳ <b>Topshiriq #${request.id} bo‘yicha hisobot qabul qilindi!</b>\n\n` +
    `📍 <b>Manzil:</b> ${address}\n` +
    `⏱ <b>Holati:</b> ⏳ Dispetcher tasdig‘i kutilmoqda\n\n` +
    `ℹ️ Topshiriq bo‘yicha tozalash hisoboti tizimga muvaffaqiyatli kiritildi. Dispetcher tasdiqlaganidan so‘ng sizga yakuniy xabar yuboriladi.`
  );
}

export function buildCitizenCompletedNotification(request: RequestEntity): string {
  return (
    `🎉 <b>Murojaatingiz muvaffaqiyatli yakunlandi!</b>\n\n` +
    `📋 <b>Murojaat:</b> #${request.id}\n` +
    `✅ Hududni tozalash ishlari to‘liq bajarildi va nazoratdan o‘tdi.\n\n` +
    `Toza Hudud xizmatidan foydalanganingiz uchun tashakkur!`
  );
}

export function buildWorkerCompletedNotification(request: RequestEntity): string {
  const address = [request.mahallaName, request.address].filter(Boolean).join(', ') || 'Manzil ko‘rsatilmagan';
  return (
    `🎉 <b>Topshiriq #${request.id} dispetcher tomonidan tasdiqlandi!</b>\n\n` +
    `📍 <b>Manzil:</b> ${address}\n` +
    `✅ <b>Holati:</b> Bajarildi (Yakunlandi)\n\n` +
    `Tozalash ishlari to‘liq qabul qilindi. Mehnat va xizmatingiz uchun tashakkur!`
  );
}

export function buildWorkerRejectedNotification(request: RequestEntity, reason?: string): string {
  const address = [request.mahallaName, request.address].filter(Boolean).join(', ') || 'Manzil ko‘rsatilmagan';
  return (
    `⚠️ <b>Topshiriq #${request.id} hisoboti qaytarildi!</b>\n\n` +
    `📍 <b>Manzil:</b> ${address}\n` +
    `❌ <b>Rad etish sababi:</b> ${reason || 'Talab darajasida tozalanmagan'}\n\n` +
    `Iltimos, hudud tozaligini qayta ta'minlab, sifatli fotosuratni qayta yuklang:`
  );
}

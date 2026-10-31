# 🌿 Toza Hudud — Tizim Spetsifikatsiyasi (BSK Loyihasi Shabloni Asosida)

Ushbu loyiha arxitekturasi va ish mantig‘i bo‘yicha **100% BSK loyihamiz shabloniga asoslanadi**. Hech qanday ortiqcha murakkablik (mashina trekingi, GPS grafigi va h.k.) bo‘lmaydi.

---

## 1. Asosiy Mantiq va Farqlar

| Xususiyat | BSK Loyihasi | Toza Hudud Loyihasi |
| :--- | :--- | :--- |
| **Yo‘nalish** | Ko‘p tarmoqli (Gaz, Svet, Suv, Boshqa...) | **Faqat Chiqindi va Tozalash** |
| **Hudud qamrovi** | Faqat Davlatobod tumani | **Ko‘p tumanli (Har bir tuman o‘z boshqaruviga ega)** |
| **Statuslar** | Yangi -> Jarayonda -> Tasdiqlashda -> Bajarildi | **Aynan bir xil (4 ta asosiy status)** |
| **Xodim hisoboti** | Matnli hisobot + rasm | **Faqat 1 ta tozalangan holat (After) rasmi** |
| **UX tuzilishi** | Jadvallar, Kartalar, Xarita, Notifikatsiyalar | **BSK bilan 100% bir xil** |
| **UI Ranglari** | Ma'muriy ko‘k (#2563EB) | **Ekologik toza yashil (#059669) va Qizil (#DC2626)** |

---

## 2. Tizim Rollari (BSK kabi 4 ta rol)

1. **SuperAdmin (Viloyat / Boshqaruv darajasi):**
   * BSK dagi SuperAdmin kabi.
   * Barcha tumanlarni ko‘radi, yangi tuman/mahalla va adminlarni qo‘shadi.
2. **Manager / Dispetcher (Tuman darajasi):**
   * BSK dagi BSK Menejeri kabi.
   * Faqat o‘z tumanidagi murojaatlarni ko‘radi, o‘z xodimlariga (haydovchi/ishchilarga) biriktiradi va xodim yuklagan rasmni tekshirib ishni tasdiqlaydi.
3. **Worker (Chiqindi xodimi / Usta):**
   * BSK dagi Usta (Xodim) kabi.
   * Telegram botida o‘ziga biriktirilgan murojaatni ko‘radi, joyiga borib tozalaydi va **tozalangan joyning 1 ta rasmini** yuklab topshiradi.
4. **Fuqaro (Aholi):**
   * Telegram botda chiqindi rasmi + lokatsiya/mahalla bilan murojaat yo‘llaydi va holatini kuzatadi.

---

## 3. Murojaat Statuslari (BSK bilan bir xil)

1. 🟡 **Yangi (`new`):** Fuqaro murojaat yubordi.
2. 🔵 **Jarayonda (`in_progress`):** Dispetcher xodimga biriktirdi.
3. 🟠 **Tasdiqlashda (`submitted`):** Xodim tozalab, natijaviy suratni yukladi.
4. 🟢 **Bajarildi (`completed`):** Dispetcher suratni ko‘rib, qabul qildi.
5. ⚪ **Rad etildi (`rejected`):** Noto‘g‘ri yoki soxta murojaat bo‘lsa.

---

## 4. Web Admin Panel Sahifalari (BSK ning aynan nusxasi)

1. `/requests` — Faol murojaatlar jadvali (Yangi, Jarayonda).
2. `/completed` — Bajarilgan murojaatlar arxivi (Oldin va Keyin rasmlarini solishtirish).
3. `/map` — Muammolar xaritasi (BSKdagi MapTab kabi: Klasterlar va Spiderfy bilan).
4. `/stats` — Statistik grafiklar (BSKdagi Donut va BarChart kabi).
5. `/staff` — Xodimlar va Dispetcherlar boshqaruvi.
6. `/locations` — Tumanlar va Mahallalar ma'lumotnomasi.
7. `NotificationCenter` — Real-time qo‘ng‘iroqcha va ovozli bildirishnomalar.

---

## 5. UI Ranglar Palitrasi

* **Asosiy tozalik rangi (Primary):** `#059669` (Zumrad yashil)
* **Muammo / Chiqindi (Danger):** `#DC2626` (Qizil)
* **Jarayonda (Warning):** `#F59E0B` (Qahrabo)
* **Fon (Background):** `#F8FAFC` (Slate-50 toza oq fon)

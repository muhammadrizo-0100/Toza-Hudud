# 🌿 Toza Hudud — Chiqindi va Sanitar Tozalash Tizimi

Aholi murojaatlarini qabul qilish, chiqindi tozalash jarayonini monitoring qilish va xodimlarni boshqarish uchun avtomatlashtirilgan axborot tizimi.

---

## 🏛️ Tizim Arxitekturasi

* **Backend:** NestJS (TypeScript), TypeORM, PostgreSQL, Redis, Socket.IO
* **Frontend:** React (Vite, TypeScript), Material UI (MUI), Recharts, Leaflet (OpenStreetMap)
* **Telegram Bot:** Telegraf / node-telegram-bot-api (Aholi va Xodimlar uchun)
* **Konteynerizatsiya:** Docker & Docker Compose

---

## 👥 Tizim Rollari (RBAC)

1. **Aholi / Fuqaro (Telegram Bot):**
   * Chiqindi toshib ketgan joy rasmini va lokatsiyasini (Telegram WebApp orqali yoki mahalla bo'yicha) yuborish.
   * Murojaat holatini real-time kuzatish.
   * Xodim tozalagandan keyingi natijaviy suratni ko'rish.

2. **Xodim / Haydovchi (Telegram Bot / Mobile):**
   * O'ziga biriktirilgan tozalash vazifalarini qabul qilish.
   * Manzilga borib tozalash va faqat **tozalangan holatdagi rasmni (After-photo)** yuklab vazifani yakunlash.

3. **Dispetcher / Operator (Web Panel):**
   * Tushgan barcha murojaatlarni saralash, brigadalarga biriktirish.
   * Xodim yuklagan natijaviy rasmni tekshirib, murojaatni yopish.

4. **Rahbar / SuperAdmin (Web Panel):**
   * Tumanlar va Mahallalarni boshqarish (qo'shish, tahrirlash).
   * Muammolar xaritasi (Heatmap va klasterlar).
   * Tahliliy statistika va xodimlar KPI ko'rsatkichlari.

---

## 🚀 Ishga Tushirish (Dastlabki Bosqich)

1. Muhit parametrlarini nusxalash:
   ```bash
   cp .env.example .env
   ```
2. Ma'lumotlar bazasi va Redis konteynerlarini ko'tarish:
   ```bash
   docker compose up -d
   ```

Yangi sessiya boshlanganda birinchi javobingda shu bo'limga qarab qayerda qolganimizni 3-4 qatorda eslat va keyingi qadamni taklif qil. Har bir vazifa oxirida bu bo'limni yangila.

## AI Tutor — holat

**Branch:** `feat/ai-tutor` (`feat/ona-tili-10-11` ustidan ochilgan, GitHub'ga push qilingan).
**Hosting:** Netlify (asosiy). Vercel fayllari (`api/*.js`, `vercel.json`) ham saqlangan.
**Oxirgi commit:** `feat(tutor): Netlify functions support` — aniq hash uchun `git log -1 feat/ai-tutor`.

### Tayyor
- `/tutor` sahifasi: Groq (`openai/gpt-oss-120b`), oqimli javob, KaTeX formulalar, javob ostida model nomi.
- Konspekt RAG: `src/data/konspekt/**/*.md` dan mos faylning to'liq matni (≤6000 belgi); aloqasiz savollarga konspekt berilmaydi.
- Internetdan izlash: gpt-oss `browser_search`; 【N】 belgilari manba havolasiga aylanadi, takrorlanganlari qisqaradi; qidiruv imkonsiz bo'lsa ogohlantirish.
- Suhbatlar tarixi (localStorage, 30 suhbat × 100 xabar), qidiruv, nomini o'zgartirish, o'chirish; mobil uchun drawer va bottom sheet.
- Rasmli savol (3 tagacha, brauzerda siqiladi) → `qwen/qwen3.8-27b`; rasmlar localStorage'ga yozilmaydi.
- Ovozli savol: MediaRecorder (60 s) → `/api/transcribe` → Whisper; "Tinglash" (speechSynthesis).
- IELTS Speaking mashqi: Part 1/2/3, taxminiy band'lar, tuzatishlar.
- Kunlik limit: 10 savol/kun (Toshkent 00:00), serverda tekshiriladi (Upstash Redis yoki xotira); `GET /api/tutor` qolgan limitni qaytaradi.
- Vaqt chegaralari: oqim darhol boshlanadi; internet qidiruvi 7 s ichida javobni boshlamasa, qidiruvsiz javobga o'tiladi (ogohlantirish bilan); butun javob 55 s'da yopiladi; oqim uzilsa frontendda "Qayta urinish".
- Server kodi: `server/tutor/*`; Netlify: `netlify/functions/*.mjs` + `netlify.toml`; Vercel: `api/*.js`; dev: `vite.config.js` plagini; mock: `npm run mock:groq`; terminal sinovi: `npm run tutor:ask`.

### Sinalmaganlar
- Haqiqiy mikrofon (faqat Chrome'ning soxta qurilmasi va WAV fayllar bilan sinalgan).
- Ovoz yozishning 60 soniyada avtomatik to'xtashi.
- Safari'dagi `audio/mp4` yozuvi.
- Upstash: faqat soxta REST server bilan sinalgan, haqiqiy bazada emas.
- Netlify production deploy (lokalda `netlify dev` bilan sinalgan): konspekt fayllari funksiyaga qo'shilgani deploy logidagi `[knowledge] N ta konspekt yuklandi` qatoridan tekshiriladi.

### Ma'lum cheklovlar
- O'quvchini ishonchli aniqlash faqat Google bilan kirganda ishlaydi (Google ID token serverda tekshiriladi). Lokal akkauntlar faqat brauzerda, shuning uchun ular IP + qurilma id bo'yicha hisoblanadi — brauzer ma'lumotlarini tozalab yoki boshqa brauzer ochib limitni chetlab o'tish mumkin.
- Google bilan oldin kirgan o'quvchilarda token saqlanmagan — ular bir marta chiqib, qayta kirishi kerak. Token 7 kundan eski bo'lsa ham qayta kirish kerak.
- `TUTOR_UNLIMITED_EMAILS` faqat Google bilan kirilganda ishlaydi.
- Netlify'da xotiradagi hisoblagichlar chaqiruvlar orasida saqlanmaydi (`netlify dev` da tasdiqlangan): Upstash ulanmasa kunlik limit amalda ishlamaydi; IP bo'yicha so'rov limitlari ham faqat bitta funksiya nusxasi ichida ishlaydi.
- Netlify funksiya chegaralari (hujjat, 2026-10): oddiy (sinxron) va streaming — 60 s; streaming javob ≤20 MB; buferlangan so'rov/javob ≤6 MB.
- Groq bepul tarifi: 8000 token/daqiqa; internet qidiruvi buni tez tugatadi.
- Brauzerlarda odatda o'zbekcha ovoz yo'q — o'zbekcha javoblarda "Bu tilda ovoz mavjud emas".

### Mening (egasining) qilishim kerak bo'lgan ishlar
1. Lokal `.env` da: `GROQ_SEARCH_MODEL=openai/gpt-oss-120b` (hozirgi `groq/compound` bu kalitda mavjud emas).
2. Hosting'da env o'zgaruvchilari (qiymatlarini repoga yozmang):
   - majburiy: `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `VITE_GOOGLE_CLIENT_ID` (yoki `GOOGLE_CLIENT_ID`);
   - ixtiyoriy: `TUTOR_UNLIMITED_EMAILS`, `TUTOR_DAILY_LIMIT`, `GROQ_MODEL`, `GROQ_SEARCH_MODEL`, `GROQ_VISION_MODEL`, `GROQ_TRANSCRIBE_MODEL`.
   - Netlify: app.netlify.com → loyiha → Project configuration → Environment variables → Add a variable. Har biri uchun Scopes'da kamida **Functions** (`VITE_GOOGLE_CLIENT_ID` uchun **Builds** ham) belgilansin; Deploy contexts — Production (kerak bo'lsa Deploy Previews). Keyin Deploys → Trigger deploy → Deploy project (env o'zgarishi faqat yangi deploy'dan keyin kuchga kiradi).
   - Netlify CLI orqali ham mumkin: `netlify env:set GROQ_API_KEY <qiymat> --scope functions`.
   - Vercel (zaxira): Project → Settings → Environment Variables → Production (va Preview) → Redeploy.
   - ixtiyoriy vaqt sozlamalari: `TUTOR_SEARCH_TIMEOUT_MS` (7000), `TUTOR_MAX_DURATION_MS` (55000).
3. Upstash'ni ulash: console.upstash.com → Create Database (Redis, Frankfurt `eu-central-1` yaqinroq) → "REST API" bo'limidan `UPSTASH_REDIS_REST_URL` va `UPSTASH_REDIS_REST_TOKEN` ni nusxalab, hosting env'iga qo'yish → redeploy. Netlify'da Functions log'ida `[quota] UPSTASH... yo‘q` ogohlantirishi chiqmasa, ulangan.
4. Avval `feat/ona-tili-10-11` ni `main` ga qo'shish, keyin `feat/ai-tutor` uchun PR ochish (aks holda PR'ga Ona tili commit'lari ham kiradi).

### Keyingi g'oyalar
- Suhbatlarni bazada saqlab, barcha qurilmalarda ko'rsatish (hozir faqat shu brauzerda).
- Real o'quvchilarga ochishdan oldin Groq pullik tarifini ko'rib chiqish.
- O'zbekchani yaxshi tushunadigan vision model topish (qwen'ning o'zbekchasi zaif).
- Lokal akkauntlar uchun server tomonda haqiqiy autentifikatsiya (limitni chetlab o'tishni yopish uchun).

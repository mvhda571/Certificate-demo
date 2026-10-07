const q = (text, options, answer) => ({ text, options, answer })

export const subjects = [
  { id: 'ona-tili-adabiyot', title: 'Ona tili va adabiyot', short: 'Grammatika, adiblar, asarlar va badiiy tahlil', active: true, color: 'from-violet-500 to-rose-500', pdfs: [] },
  { id: 'matematika', title: 'Matematika', short: 'Sonlar, kasrlar va proporsiya', active: true, color: 'from-blue-500 to-cyan-500', pdfs: [{ title: 'Matematika darsligi', url: '/textbooks/matematika-6.pdf' }] },
  { id: 'tarix', title: 'Tarix', short: '6-11-sinf O‘zbekiston va jahon tarixi', active: true, color: 'from-orange-600 to-rose-700', pdfs: [] },
  ...['7-sinf fanlari', '8-sinf fanlari', '9-sinf fanlari', 'Fizika', 'Kimyo', 'Biologiya'].map((title, i) => ({ id: `soon-${i}`, title, short: 'Yangi darslik va testlar tayyorlanmoqda', active: false, color: 'from-slate-400 to-slate-600', pdfs: [] })),
]

const common = {
  'ona-tili': [
    ['Matn va uning turlari', 'Matn mazmunan bog‘langan gaplardan tuziladi. Hikoya matni voqeani, tasviriy matn belgi-xususiyatni, muhokama matni esa fikr, dalil va xulosani ifodalaydi.', ['Mavzu — matnda yoritilgan asosiy masala', 'Asosiy fikr — muallif yetkazmoqchi bo‘lgan xulosa', 'Muhokama: tezis + dalil + xulosa']],
    ['So‘z tarkibi', 'So‘z asos va qo‘shimchalardan tuziladi. So‘z yasovchi qo‘shimcha yangi lug‘aviy ma’no, shakl yasovchi qo‘shimcha esa grammatik shakl hosil qiladi.', ['Asos lug‘aviy ma’noni saqlaydi', 'Yasovchi qo‘shimcha yangi so‘z yaratadi', 'Qo‘shimchalar asosdan keyin tartib bilan keladi']],
    ['Fe’l va nisbatlar', 'Fe’l harakat yoki holatni bildiradi. Nisbat shakllari harakatning bajaruvchi va obyektga munosabatini ko‘rsatadi: aniq, o‘zlik, majhul, orttirma va birgalik.', ['Fe’l so‘roqlari: nima qildi? nima qiladi?', 'Majhul nisbatda bajaruvchi noma’lum', 'Orttirma nisbat harakatni bajartirishni bildiradi']],
    ['Fe’lning vazifa shakllari', 'Harakat nomi fe’lni otga, sifatdosh sifatga, ravishdosh ravishga xos vazifada qo‘llaydi. Ular fe’llik ma’nosini saqlaydi.', ['Harakat nomi: -moq, -ish, -uv', 'Sifatdosh: -gan, -adigan, -ar', 'Ravishdosh: -ib, -a/-y, -gach']],
    ['Ot va uning turlari', 'Ot shaxs, narsa, joy va tushuncha nomini bildiradi. Atoqli otlar yakka nom bo‘lib bosh harf bilan, turdosh otlar umumiy nom bo‘lib kichik harf bilan yoziladi.', ['Atoqli va turdosh ot', 'Aniq va mavhum ot', 'Sodda, qo‘shma, juft va takroriy ot']],
    ['Sifat, son va ravish', 'Sifat predmet belgisini, son miqdor va tartibni, ravish esa harakat-holat belgisini bildiradi. Ularni so‘rog‘i va gapdagi bog‘lanishiga ko‘ra farqlash zarur.', ['Sifat: qanday?', 'Son: qancha? nechanchi?', 'Ravish: qanday? qachon? qayerda?']],
  ],
  adabiyot: [
    ['G‘afur G‘ulom va “Shum bola”', 'Qissada Shum bolaning sarguzashtlari orqali XX asr boshidagi xalq hayoti, bolalar ruhiyati va ijtimoiy tengsizlik yumor bilan yoritiladi.', ['Janr: qissa', 'Yetakchi usul: yumor va sarguzasht', 'Qahramon topqir, sho‘x va hayotga chanqoq']],
    ['Xudoyberdi To‘xtaboyev ijodi', 'Adib bolalar dunyosini fantastika va kulgi bilan tasvirlaydi. Hoshimjon obrazi orqali tayyor bilim va oson muvaffaqiyatning oqibatlari ko‘rsatiladi.', ['Asosiy g‘oya: bilim mehnat bilan egallanadi', 'Fantastik detal voqeani harakatga keltiradi', 'Qahramon xatosidan saboq chiqaradi']],
    ['Hajviy asar va Abdulla Qahhor', 'Hajv illatlarni kulgi vositasida fosh etadi. Abdulla Qahhor hikoyalarida ixcham detal, tabiiy dialog va keskin yakun obraz xarakterini ochadi.', ['Hajv: yumor va satira', 'Badiiy detal katta ma’no tashiydi', 'Dialog xarakter yaratadi']],
    ['O‘tkir Hoshimov hikoyalari', 'Adib urush va og‘ir turmush sharoitida insoniy qarorlarning oqibatini ochadi. Ona obrazi mehr, fidoyilik va vijdon mezoni sifatida talqin qilinadi.', ['Konflikt qahramon tanlovini ochadi', 'Ona obrazi ma’naviy markaz', 'Sabab va oqibatni tahlil qilish muhim']],
    ['Xalq qo‘shiqlari va Alisher Navoiy', 'Xalq qo‘shiqlari og‘zaki ijod, Navoiy asarlari yozma mumtoz adabiyot namunasidir. Har ikkisi ham xalqning axloqiy qarashlari va obrazli tafakkurini ifodalaydi.', ['Qo‘shiqda ritm va takror muhim', 'Navoiyda saxovat va himmat ulug‘lanadi', 'Obrazli ifoda ko‘chma ma’no yaratadi']],
    ['Zulfiya va Ibroyim Yusupov she’riyati', 'She’rlarda Vatan, xotira, tabiat va insoniy sadoqat lirik kechinma orqali beriladi. Lirik qahramon hissi manzara va ramziy obrazlar bilan uyg‘unlashadi.', ['Lirik qahramon muallifning aynan o‘zi emas', 'Ramz kengroq ma’no anglatadi', 'Tashbeh ikki tushunchani qiyoslaydi']],
  ],
  matematika: [
    ['Bo‘linish belgilari', 'Sonning oxirgi raqami va raqamlar yig‘indisi orqali 2, 3, 5, 9 va 10 ga bo‘linishni tez tekshirish mumkin.', ['2 ga: oxirgi raqam juft', '5 ga: oxirgi raqam 0 yoki 5', '3 va 9 ga: raqamlar yig‘indisi bo‘linadi']],
    ['Tub sonlar, EKUB va EKUK', 'Tub son faqat 1 va o‘ziga bo‘linadi. Sonlarni tub ko‘paytuvchilarga ajratish EKUB va EKUKni topishning ishonchli usulidir.', ['EKUB — umumiy tub ko‘paytuvchilarning kichik darajalari', 'EKUK — barcha tub ko‘paytuvchilarning katta darajalari', 'O‘zaro tub sonlar EKUBi 1']],
    ['Kasrlarni qisqartirish va taqqoslash', 'Kasr surat va maxrajini bir xil noldan farqli songa ko‘paytirish yoki bo‘lish kasr qiymatini o‘zgartirmaydi. Taqqoslash uchun umumiy maxraj qulay.', ['a/b = (a·k)/(b·k)', 'Qisqartirishda surat va maxraj EKUBga bo‘linadi', 'Teng maxrajda surati katta kasr katta']],
    ['Kasrlar ustida amallar', 'Qo‘shish va ayirishdan oldin kasrlar umumiy maxrajga keltiriladi. Ko‘paytirishda suratlar va maxrajlar ko‘paytiriladi; bo‘lishda ikkinchi kasr teskarilanadi.', ['a/b + c/d = (ad+bc)/bd', 'a/b · c/d = ac/bd', 'a/b : c/d = ad/bc']],
    ['Nisbat va proporsiya', 'Nisbat ikki miqdorni taqqoslaydi. Proporsiya ikki nisbat tengligi bo‘lib, chetki hadlar ko‘paytmasi o‘rta hadlar ko‘paytmasiga teng.', ['a:b = a/b', 'a/b = c/d bo‘lsa ad = bc', 'Masshtab — chizmadagi uzunlikning haqiqiy uzunlikka nisbati']],
    ['Musbat va manfiy sonlar', 'Koordinata chizig‘ida o‘ngdagi son katta. Son moduli uning noldan masofasi; qarama-qarshi sonlarning modullari teng.', ['|a| ≥ 0', 'a va -a qarama-qarshi', 'Har xil ishorali sonlar yig‘indisida modullar ayiriladi']],
  ],
  algebra: [
    ['Ratsional sonlar', 'Butun va kasr sonlar ratsional sonlar to‘plamiga kiradi. Ular m/n ko‘rinishida yoziladi, bunda m butun, n esa noldan farqli.', ['Q = {m/n | n ≠ 0}', 'Manfiy sonlar ko‘paytmasi musbat', 'Turli ishorali sonlar ko‘paytmasi manfiy']],
    ['Qavslarni ochish', 'Qavs oldida musbat ishora bo‘lsa hadlar ishorasi saqlanadi; manfiy ishora bo‘lsa barcha hadlarning ishorasi almashadi.', ['+(a-b)=a-b', '-(a-b)=-a+b', 'O‘xshash hadlarning harfiy qismi bir xil']],
    ['Koeffitsiyent va o‘xshash hadlar', 'Harfiy ifodadagi sonli ko‘paytuvchi koeffitsiyent deyiladi. O‘xshash hadlar koeffitsiyentlarini qo‘shish orqali ixchamlanadi.', ['3x dagi koeffitsiyent 3', 'ax+bx=(a+b)x', '1x=x, -1x=-x']],
    ['Chiziqli tenglama', 'ax=b ko‘rinishidagi tenglama a noldan farqli bo‘lsa yagona x=b/a yechimga ega. Tenglikning ikki tomonida bir xil amal bajarish mumkin.', ['ax=b ⇒ x=b/a', 'Hadni qarama-qarshi ishora bilan o‘tkazish mumkin', 'Yechim o‘rniga qo‘yib tekshiriladi']],
    ['Kasr koeffitsiyentli tenglama', 'Kasrli tenglamani yechishda avval barcha hadlar umumiy maxrajga ko‘paytirilib, butun koeffitsiyentli tenglamaga keltiriladi.', ['Maxraj nol bo‘lmaydi', 'Umumiy maxraj kasrlarni yo‘qotadi', 'Yakuniy yechim tekshiriladi']],
    ['Daraja va davriy kasr', 'Daraja bir xil ko‘paytuvchilar ko‘paytmasining qisqa yozuvidir. Takrorlanuvchi cheksiz o‘nli kasr davriy kasr deyiladi.', ['aⁿ — n ta a ko‘paytmasi', 'a² — sonning kvadrati', '0,(3)=1/3']],
  ],
  geometriya: [
    ['Uchburchak va uning turlari', 'Uchburchak uchta kesmadan tuziladi. Tomonlariga ko‘ra teng tomonli, teng yonli va turli tomonli; burchaklariga ko‘ra o‘tkir, to‘g‘ri va o‘tmas burchakli bo‘ladi.', ['a+b>c', 'P=a+b+c', 'Ichki burchaklar yig‘indisi 180°']],
    ['Uchburchak perimetri', 'Perimetr uchburchak tomonlari uzunliklari yig‘indisidir. Noma’lum tomon perimetrdan qolgan ikki tomon ayirilishi bilan topiladi.', ['P=a+b+c', 'Teng tomonli uchburchak: P=3a', 'Teng yonli uchburchak: P=2a+b']],
    ['Uchburchak yuzi', 'Uchburchak yuzi asos bilan shu asosga tushirilgan balandlik ko‘paytmasining yarmiga teng.', ['S=a·h/2', 'Balandlik asosga perpendikulyar', 'Birliklar kvadrat ko‘rinishda yoziladi']],
    ['Katakli qog‘ozda yuza', 'Katakli shakl yuzini to‘liq kataklarni sanash, qismlarni birlashtirish yoki shaklni sodda to‘rtburchak va uchburchaklarga ajratish orqali topish mumkin.', ['1 katak yuzi o‘lchov birligi bo‘lishi mumkin', 'Yuzalar qo‘shiladi va ayiriladi', 'Diagonal katakni teng ikki qismga bo‘ladi']],
    ['Aylana va doira', 'Aylana markazdan teng masofadagi nuqtalar to‘plami, doira esa aylana bilan chegaralangan sohadir. Radius diametrning yarmiga teng.', ['d=2r', 'L=2πr=πd', 'S=πr²']],
    ['Murakkab shakllar yuzi', 'Murakkab shakl yuzasi sodda figuralarga ajratilib topiladi. Kesishmaydigan qismlar yuzalari qo‘shiladi, kesib olingan qism ayiriladi.', ['Chizma o‘lchovlarini bir xil birlikka keltirish', 'S umumiy = S₁ + S₂', 'Kesilgan qism: S = S katta - S kichik']],
  ],
}

export const curriculum = Object.fromEntries(Object.entries(common).map(([id, lessons]) => [id, lessons.map(([title, summary, facts], index) => ({
  id: index + 1, title, summary, facts,
  test: (index + 1) % 3 === 0 ? [
    q(`${lessons[0][0]} bo‘yicha asosiy tushunchani belgilang.`, [lessons[0][2][0], facts[0], 'Mavzuga aloqasiz fikr', 'Faqat istisno holat'], 0),
    q(`${lessons[1][0]} mavzusiga tegishli qoida qaysi?`, [facts[1] || facts[0], lessons[1][2][0], 'Hech biri', 'Faqat taxmin'], 1),
    q(`${title} mavzusidagi to‘g‘ri fikrni toping.`, [facts[0], 'Qoida mavjud emas', 'Barcha holatlar teng', 'Faqat matnda aniqlanmaydi'], 0),
    q('O‘tilgan mavzularni yechishda eng ishonchli usul qaysi?', ['Qoidani aniqlab, bosqichma-bosqich qo‘llash', 'Tasodifiy javob tanlash', 'Shartni o‘qimaslik', 'Faqat javobga qarash'], 0),
    q('Natijani tekshirishning to‘g‘ri yo‘li qaysi?', ['Dastlabki shart va qoida bilan solishtirish', 'Savolni o‘zgartirish', 'Variantlarni kamaytirish', 'Tekshirmaslik'], 0),
  ] : null,
}))]))

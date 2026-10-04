import fs from 'node:fs/promises'
import path from 'node:path'

const sources = [
  ['5', 'Tarixdan_hikoyalar_5sinf_TOLIQ_konspekt.txt'],
]

const fifthGradeCorrections = {
  10: { title: '«Avesto» — ajdodlarimiz yaratgan ilk yozma tarixiy manba' },
  26: { pages: 89 },
  28: { pages: 95 },
  37: { pages: 129 },
  41: { title: "Gitler Germaniyasi ustidan qozonilgan g‘alabaga O‘zbekistonning qo‘shgan hissasi" },
  46: { pages: 162 },
}

const clean = value => value
  .replaceAll('В·', '·').replaceAll('вЂ”', '—').replaceAll('вЂ“', '–')
  .replaceAll('в†’', '→').replaceAll('в‡’', '⇒').replaceAll('В«', '«').replaceAll('В»', '»')
  .replaceAll('OвЂ', "O‘").replaceAll('oвЂ', "o‘").replaceAll('gвЂ', "g‘")
  .replaceAll('GвЂ', "G‘").replaceAll('shgвЂ', 'shg‘').replaceAll('taвЂ™', 'ta’')
  .replaceAll('eвЂ™', 'e’').replaceAll('boвЂ', 'bo‘').replaceAll('qoвЂ', 'qo‘')
  .replaceAll('koвЂ', 'ko‘').replaceAll('yoвЂ', 'yo‘').replaceAll('toвЂ', 'to‘')
  .replace(/\s+/g, ' ').trim()

const between = (text, start, end) => {
  const from = text.indexOf(start)
  if (from < 0) return ''
  const rest = text.slice(from + start.length)
  const to = rest.indexOf(end)
  return clean(to < 0 ? rest : rest.slice(0, to))
}

const parse = text => text.split(/===== PAGE \d+ =====/)
  .filter(page => page.includes('MAVZUNING MOHIYATI'))
  .map((page, index) => {
    const before = page.slice(0, page.indexOf('MAVZUNING MOHIYATI'))
      .split(/\r?\n/).map(clean).filter(Boolean)
    const title = before.at(-1)
    const summary = between(page, 'MAVZUNING MOHIYATI', 'KALIT IBORALAR VA SANALAR')
    const factsText = between(page, 'KALIT IBORALAR VA SANALAR', 'XOTIRA ILGAGI')
    const memory = between(page, 'XOTIRA ILGAGI', 'MANTIQIY ZANJIR')
    const logic = between(page, 'MANTIQIY ZANJIR', 'MILLIY SERTIFIKAT TUZOG\'I')
    const trap = between(page, "MILLIY SERTIFIKAT TUZOG'I", 'TAKRORLASH: MINI-TEST')
    const questionBlock = between(page, 'TAKRORLASH: MINI-TEST', 'Milliy Sertifikat')
    const quickQuestions = (questionBlock.match(/[^?]+\?/g) || [])
      .map(item => clean(item.replace(/^\d+\.\s*/, ''))).filter(Boolean).slice(0, 3)
    return {
      id: index + 1,
      title,
      summary,
      facts: [factsText],
      quickQuestions,
      teacherAdvice: { essence: memory, trap, practical: logic },
    }
  })

const compact = value => clean(value).toLocaleLowerCase('uz-UZ')
  .replace(/[^a-z0-9а-яё‘' ]/gi, '').replaceAll('‘', "'").replace(/\s+/g, ' ').trim()

const findTextbookPage = (textbook, title) => {
  const needle = compact(title)
  const pages = [...textbook.matchAll(/===== PAGE (\d+) =====([\s\S]*?)(?====== PAGE|$)/g)]
  const match = pages.find(([, , body]) => compact(body).includes(needle))
  return match ? Number(match[1]) : null
}

const result = {}
for (const [grade, file] of sources) {
  const text = await fs.readFile(path.resolve('tmp/pdfs', file), 'utf8')
  result[grade] = parse(text)
}

const fifthTextbook = await fs.readFile(path.resolve('tmp/pdfs/tarixdan_hikoyalar_5_uzb.txt'), 'utf8')
result[5] = result[5].map(note => ({
  ...note,
  pages: findTextbookPage(fifthTextbook, note.title),
  ...fifthGradeCorrections[note.id],
}))

await fs.writeFile(path.resolve('src/data/historyPdfNotes.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`History notes: 5-sinf ${result[5].length}, 6-sinf ${result[6].length}`)

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { HiArrowLeft as FiArrowLeft, HiArrowRight as FiArrowRight, HiArrowsExpand as FiExpand, HiBookOpen as FiBookOpen, HiCheck as FiCheck, HiClock as FiClock, HiCollection as FiLayers, HiLightBulb as FiBulb, HiPencilAlt as FiEdit, HiRefresh as FiRefresh, HiX as FiX } from 'react-icons/hi'
import { ShareResultButtons } from './ShareResultButtons'

const STEPS = [['read', 'Konspekt', FiBookOpen], ['cards', 'Flashcardlar', FiLayers], ['quiz', 'Mavzu testi', FiEdit]]
const LETTERS = ['A', 'B', 'C', 'D']

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index} className="font-extrabold text-slate-950 dark:text-white">{part.slice(2, -2)}</strong>
    : <Fragment key={index}>{part}</Fragment>)
}

function MarkdownBlock({ body }) {
  const lines = body.split('\n')
  const blocks = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line) continue
    if (line.startsWith('|')) {
      const rows = []
      while (index < lines.length && lines[index].trim().startsWith('|')) { rows.push(lines[index].trim()); index += 1 }
      index -= 1
      const cells = rows.filter(row => !/^\|\s*-/.test(row)).map(row => row.slice(1, -1).split('|').map(cell => cell.trim()))
      const [head, ...rest] = cells
      blocks.push(<div key={index} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700"><table className="w-full text-left text-sm"><thead className="bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-200"><tr>{head.map(cell => <th key={cell} className="px-4 py-2.5 font-bold">{cell}</th>)}</tr></thead><tbody>{rest.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100 dark:border-slate-800">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-2.5 align-top"><Inline text={cell}/></td>)}</tr>)}</tbody></table></div>)
    } else if (/^(-|\d+\.)\s/.test(line)) {
      const items = []
      const ordered = /^\d+\./.test(line)
      while (index < lines.length && /^(-|\d+\.)\s/.test(lines[index].trim())) { items.push(lines[index].trim().replace(/^(-|\d+\.)\s+/, '')); index += 1 }
      index -= 1
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={index} className={`space-y-2 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-orange-500`}>{items.map((item, itemIndex) => <li key={itemIndex}><Inline text={item}/></li>)}</List>)
    } else {
      blocks.push(<p key={index}><Inline text={line}/></p>)
    }
  }
  return <div className="space-y-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{blocks}</div>
}

function TopicText({ topic }) {
  return <div className="space-y-7">{topic.sections.map(section => {
    const highlight = section.heading === 'Asosiy g‘oya' || section.heading === 'Eslab qolish hiylasi'
    return <section key={section.heading} className={highlight ? 'rounded-2xl border border-orange-200 bg-orange-50/60 p-5 dark:border-orange-500/20 dark:bg-orange-500/5' : ''}>
      <h3 className={`mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] ${highlight ? 'text-orange-600 dark:text-orange-300' : 'text-slate-400'}`}>{section.heading === 'Eslab qolish hiylasi' && <FiBulb className="h-4 w-4"/>}{section.heading}</h3>
      <MarkdownBlock body={section.body}/>
    </section>
  })}</div>
}

function Flashcards({ cards }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = cards[index]
  const go = (next) => { setIndex(next); setFlipped(false) }
  return <div>
    <p className="text-sm text-slate-500">Kartani bosing — javob ochiladi. {index + 1} / {cards.length}</p>
    <button type="button" onClick={() => setFlipped(value => !value)} className={`mt-4 grid min-h-56 w-full place-items-center rounded-3xl border-2 p-8 text-center transition ${flipped ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-orange-300 bg-orange-50 hover:border-orange-400 dark:bg-orange-500/10'}`}>
      <span>
        <span className={`text-xs font-black uppercase tracking-[.25em] ${flipped ? 'text-emerald-600' : 'text-orange-500'}`}>{flipped ? 'Javob' : 'Savol'}</span>
        <span className="mt-4 block text-xl font-black leading-snug text-slate-900 dark:text-white sm:text-2xl">{flipped ? card.back : card.front}</span>
      </span>
    </button>
    <div className="mt-4 flex items-center justify-between gap-3">
      <button type="button" disabled={index === 0} onClick={() => go(index - 1)} className="btn-secondary disabled:opacity-40"><FiArrowLeft/> Oldingi</button>
      <div className="flex max-w-[11rem] flex-wrap justify-center gap-1.5">{cards.map((_, dot) => <span key={dot} className={`h-2 w-2 rounded-full ${dot === index ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}/>)}</div>
      <button type="button" disabled={index === cards.length - 1} onClick={() => go(index + 1)} className="btn-secondary disabled:opacity-40">Keyingi <FiArrowRight/></button>
    </div>
  </div>
}

function QuestionList({ questions, answers, onAnswer, checked }) {
  return <div className="space-y-6">{questions.map((question, index) => {
    const picked = answers[index]
    const correct = picked === question.answer
    return <div key={`${index}-${question.text}`}>
      <p className="font-semibold leading-7">{index + 1}. {question.text}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => {
        let tone = 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
        if (!checked && picked === optionIndex) tone = 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-500/10 dark:text-orange-200'
        if (checked && optionIndex === question.answer) tone = 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
        if (checked && picked === optionIndex && !correct) tone = 'border-red-400 bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200'
        return <button type="button" key={option} disabled={checked} onClick={() => onAnswer(index, optionIndex)} className={`rounded-xl border p-3 text-left text-sm transition ${tone}`}>{LETTERS[optionIndex]}. {option}</button>
      })}</div>
      {checked && <div className={`mt-3 flex gap-2 rounded-xl px-4 py-3 text-sm leading-6 ${correct ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200'}`}>{correct ? <FiCheck className="mt-1 shrink-0"/> : <FiX className="mt-1 shrink-0"/>}<span><b>{correct ? 'To‘g‘ri!' : `Xato. To‘g‘ri javob: ${LETTERS[question.answer]}.`}</b> {question.explanation}</span></div>}
    </div>
  })}</div>
}

export function KonspektLesson({ topic, done, isLast, midtermAfter, testSize, durationMinutes, onStartTest, onNext, onFinal, onMidterm }) {
  const [step, setStep] = useState('read')

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow text-orange-600">{topic.section}</p><h2 className="mt-2 text-3xl font-black">{topic.id}-mavzu. {topic.title}</h2></div>{done && <span className="pill inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><FiCheck/> O‘zlashtirilgan</span>}</div>
    <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">{STEPS.map(([key, label, Icon], index) => <button type="button" key={key} onClick={() => setStep(key)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm ${step === key ? 'bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300' : 'text-slate-500'}`}><Icon className="hidden h-4 w-4 sm:block"/>{index + 1}. {label}</button>)}</div>

    <div className="mt-7">
      {step === 'read' && <><TopicText topic={topic}/><div className="mt-8 flex justify-end"><button type="button" onClick={() => setStep('cards')} className="btn-primary bg-orange-500 hover:bg-orange-600">Flashcardlarga o‘tish <FiArrowRight/></button></div></>}
      {step === 'cards' && <><Flashcards key={topic.id} cards={topic.flashcards}/><div className="mt-8 flex justify-end"><button type="button" onClick={() => setStep('quiz')} className="btn-primary bg-orange-500 hover:bg-orange-600">Mavzu testiga o‘tish <FiArrowRight/></button></div></>}
      {step === 'quiz' && <div className="rounded-3xl border border-orange-200 bg-orange-50/60 p-6 dark:border-orange-500/20 dark:bg-orange-500/5 sm:p-8">
        <p className="eyebrow text-orange-600">Mavzu testi</p>
        <h3 className="mt-2 text-2xl font-black">{topic.title}</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold dark:bg-slate-900"><FiEdit className="text-orange-500"/> {testSize} ta savol</span>
          <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold dark:bg-slate-900"><FiClock className="text-orange-500"/> {durationMinutes} daqiqa</span>
          <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold dark:bg-slate-900"><FiExpand className="text-orange-500"/> To‘liq ekran</span>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">Savollar konspektdan har safar yangidan tuziladi — qayta topshirganda boshqa savollar chiqadi. Test to‘liq ekran rejimida o‘tadi; vaqt tugasa, javoblar avtomatik yuboriladi.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onStartTest} className="btn-primary bg-orange-500 hover:bg-orange-600">{done ? 'Testni qayta topshirish' : 'Testni boshlash'} <FiArrowRight/></button>
          {done && midtermAfter && <button type="button" onClick={onMidterm} className="btn-secondary"><FiEdit/> Oraliq test</button>}
          {done && (isLast ? <button type="button" onClick={onFinal} className="btn-secondary">Yakuniy test <FiArrowRight/></button> : <button type="button" onClick={onNext} className="btn-secondary">Keyingi mavzu <FiArrowRight/></button>)}
        </div>
      </div>}
    </div>
  </div>
}

function gradeFor(percent) {
  if (percent >= 86) return { label: 'A’lo (5)', tone: 'text-emerald-600', text: 'Ajoyib! Materialni juda yaxshi o‘zlashtirgansiz.' }
  if (percent >= 71) return { label: 'Yaxshi (4)', tone: 'text-blue-600', text: 'Yaxshi natija. Xato qilgan joylaringizni ko‘rib chiqsangiz, a’loga chiqasiz.' }
  if (percent >= 56) return { label: 'Qoniqarli (3)', tone: 'text-amber-600', text: 'Asosiy bilim bor, lekin konspektni qayta o‘qish kerak.' }
  return { label: 'Qayta tayyorlanish kerak (2)', tone: 'text-red-600', text: 'Konspektni qayta o‘qing, flashcardlarni takrorlang va testni qayta topshiring.' }
}

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

/**
 * To'liq ekranda o'tadigan, taymerli test (mavzu testi, oraliq va yakuniy test).
 * exam: { title, subtitle, questions, showWeakTopics }
 */
export function ProctoredExam({ exam, topics, durationSeconds, onComplete, onClose, onRetry, onOpenTopic, actions = [] }) {
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [remaining, setRemaining] = useState(durationSeconds)
  const finishRef = useRef(null)
  const resultCardRef = useRef(null)
  const { questions } = exam
  const score = questions.filter((question, index) => answers[index] === question.answer).length
  const percent = Math.round(score / questions.length * 100)
  const grade = gradeFor(percent)
  const answeredCount = Object.keys(answers).length
  const weakTopics = useMemo(() => {
    if (!exam.showWeakTopics) return []
    const ids = [...new Set(questions.filter((question, index) => answers[index] !== question.answer).map(question => question.topicId))].sort((a, b) => a - b)
    return ids.map(id => topics.find(topic => topic.id === id)).filter(Boolean)
  }, [answers, exam.showWeakTopics, questions, topics])

  const submit = () => {
    if (checked) return
    setChecked(true)
    onComplete(score, percent, questions.filter((question, index) => answers[index] !== question.answer))
    window.scrollTo({ top: 0 })
  }

  // Taymer tugaganda eng so'nggi javoblar bilan avtomatik yuboriladi.
  useEffect(() => { finishRef.current = submit })
  useEffect(() => {
    if (checked) return undefined
    const timer = window.setInterval(() => setRemaining(value => {
      if (value <= 1) { window.clearInterval(timer); window.queueMicrotask(() => finishRef.current?.()); return 0 }
      return value - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [checked])

  return <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-100 dark:bg-slate-950">
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-wider text-orange-600">{exam.subtitle}</p><h2 className="truncate text-lg font-black">{exam.title}</h2></div>
        {checked ? <button type="button" onClick={onClose} className="icon-button" aria-label="Yopish"><FiX/></button> : <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:block">{answeredCount}/{questions.length}</span>
          <span className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-black ${remaining <= 60 ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}><FiClock className="h-4 w-4"/>{formatTime(remaining)}</span>
        </div>}
      </div>
      {!checked && <div className="mx-auto mt-2 h-1.5 max-w-3xl overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${answeredCount / questions.length * 100}%` }}/></div>}
    </div>

    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      {checked && <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <div ref={resultCardRef} className="flex flex-wrap items-center gap-5 bg-white p-1 dark:bg-slate-900"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-orange-100 text-xl font-black text-orange-600 dark:bg-orange-500/15">{score}/{questions.length}</span><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Certificate Academy · {exam.title}</p><p className={`text-xl font-black ${grade.tone}`}>{percent}% · {grade.label}</p><p className="mt-1 text-sm text-slate-500">{grade.text}</p>{remaining === 0 && <p className="mt-1 text-xs font-bold text-red-500">Vaqt tugadi — javoblar avtomatik yuborildi.</p>}</div></div>
        <ShareResultButtons cardRef={resultCardRef} fileName={`natija-${exam.title}`} shareText={`"${exam.title}" testida ${percent}% (${grade.label}) natija qildim!`} className="mt-5"/>
        {weakTopics.length > 0 && <div className="mt-5"><p className="text-sm font-bold">Qayta o‘qish tavsiya etiladigan mavzular:</p><div className="mt-3 flex flex-wrap gap-2">{weakTopics.map(topic => <button type="button" key={topic.id} onClick={() => onOpenTopic(topic.id)} className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-left text-xs font-semibold text-orange-700 transition hover:bg-orange-50 dark:border-orange-500/30 dark:bg-slate-900 dark:text-orange-300">{topic.id}. {topic.title}</button>)}</div></div>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onRetry} className="btn-secondary"><FiRefresh/> Yangi savollar bilan qayta topshirish</button>
          {actions.map(action => <button type="button" key={action.label} onClick={action.onClick} className={action.primary ? 'btn-primary flex-1 bg-orange-500 hover:bg-orange-600' : 'btn-secondary'}>{action.label} {action.primary && <FiArrowRight/>}</button>)}
          {!actions.length && <button type="button" onClick={onClose} className="btn-primary flex-1 bg-orange-500 hover:bg-orange-600">Yopish</button>}
        </div>
        <p className="mt-6 text-sm font-bold text-slate-500">Javoblar tahlili:</p>
      </div>}

      <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900 sm:p-8"><QuestionList questions={questions} answers={answers} onAnswer={(index, option) => setAnswers({ ...answers, [index]: option })} checked={checked}/></div>
      {!checked && <button type="button" onClick={submit} className="btn-primary mt-6 w-full bg-orange-500 hover:bg-orange-600">Javoblarni yuborish ({answeredCount}/{questions.length})</button>}
    </div>
  </div>
}

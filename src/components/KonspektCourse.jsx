import { Fragment, useMemo, useState } from 'react'
import { HiArrowLeft as FiArrowLeft, HiArrowRight as FiArrowRight, HiBookOpen as FiBookOpen, HiCheck as FiCheck, HiCollection as FiLayers, HiLightBulb as FiBulb, HiPencilAlt as FiEdit, HiRefresh as FiRefresh, HiX as FiX } from 'react-icons/hi'

const STEPS = [['read', 'Konspekt', FiBookOpen], ['cards', 'Flashcardlar', FiLayers], ['quiz', 'Oraliq test', FiEdit]]
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
    return <div key={question.text}>
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

export function KonspektLesson({ topic, done, isLast, midtermAfter, onSubmitQuiz, onNext, onFinal, onMidterm }) {
  const [step, setStep] = useState('read')
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const score = topic.quiz.filter((question, index) => answers[index] === question.answer).length
  const allAnswered = Object.keys(answers).length === topic.quiz.length

  const submit = () => {
    setChecked(true)
    onSubmitQuiz(score, topic.quiz.filter((question, index) => answers[index] !== question.answer))
  }
  const retry = () => { setAnswers({}); setChecked(false) }

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow text-orange-600">{topic.section}</p><h2 className="mt-2 text-3xl font-black">{topic.id}-mavzu. {topic.title}</h2></div>{done && <span className="pill inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><FiCheck/> O‘zlashtirilgan</span>}</div>
    <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">{STEPS.map(([key, label, Icon], index) => <button type="button" key={key} onClick={() => setStep(key)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm ${step === key ? 'bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300' : 'text-slate-500'}`}><Icon className="hidden h-4 w-4 sm:block"/>{index + 1}. {label}</button>)}</div>

    <div className="mt-7">
      {step === 'read' && <><TopicText topic={topic}/><div className="mt-8 flex justify-end"><button type="button" onClick={() => setStep('cards')} className="btn-primary bg-orange-500 hover:bg-orange-600">Flashcardlarga o‘tish <FiArrowRight/></button></div></>}
      {step === 'cards' && <><Flashcards key={topic.id} cards={topic.flashcards}/><div className="mt-8 flex justify-end"><button type="button" onClick={() => setStep('quiz')} className="btn-primary bg-orange-500 hover:bg-orange-600">Oraliq testni boshlash <FiArrowRight/></button></div></>}
      {step === 'quiz' && <div>
        <p className="mb-6 text-sm text-slate-500">{checked ? 'Natijangiz va xatolar tahlili:' : `${topic.quiz.length} ta savol. Barcha savollarga javob bering, keyin «Javoblarni yuborish» tugmasini bosing.`}</p>
        <QuestionList questions={topic.quiz} answers={answers} onAnswer={(index, option) => setAnswers({ ...answers, [index]: option })} checked={checked}/>
        {!checked ? <button type="button" disabled={!allAnswered} onClick={submit} className="btn-primary mt-8 w-full bg-orange-500 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">Javoblarni yuborish</button> : <div className="mt-8 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <p className="text-lg font-black">{score}/{topic.quiz.length} to‘g‘ri javob</p>
          <p className="mt-1 text-sm text-slate-500">{score === topic.quiz.length ? 'Ajoyib! Mavzuni to‘liq o‘zlashtirdingiz.' : 'Xatolaringiz yuqorida izohlandi. Konspektni qayta ko‘rib chiqib, testni yana ishlashingiz mumkin.'}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={retry} className="btn-secondary"><FiRefresh/> Qayta ishlash</button>
            {score < topic.quiz.length && <button type="button" onClick={() => { retry(); setStep('read') }} className="btn-secondary"><FiBookOpen/> Konspektni qayta o‘qish</button>}
            {midtermAfter && <button type="button" onClick={onMidterm} className="btn-secondary"><FiEdit/> Oraliq test (1–{topic.id})</button>}
            {isLast ? <button type="button" onClick={onFinal} className="btn-primary flex-1 bg-slate-950 hover:bg-slate-800 dark:bg-orange-600">Yakuniy testga o‘tish <FiArrowRight/></button> : <button type="button" onClick={onNext} className="btn-primary flex-1 bg-orange-500 hover:bg-orange-600">Keyingi mavzu <FiArrowRight/></button>}
          </div>
        </div>}
      </div>}
    </div>
  </div>
}

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5)

function gradeFor(percent) {
  if (percent >= 86) return { label: 'A’lo (5)', tone: 'text-emerald-600', text: 'Butun konspektni juda yaxshi o‘zlashtirgansiz!' }
  if (percent >= 71) return { label: 'Yaxshi (4)', tone: 'text-blue-600', text: 'Yaxshi natija. Quyidagi mavzularni qayta ko‘rib chiqsangiz, a’loga chiqasiz.' }
  if (percent >= 56) return { label: 'Qoniqarli (3)', tone: 'text-amber-600', text: 'Asosiy bilim bor, lekin bir nechta mavzuni qayta o‘qish kerak.' }
  return { label: 'Qayta tayyorlanish kerak (2)', tone: 'text-red-600', text: 'Quyidagi mavzularni qayta o‘qib, flashcardlarni takrorlang va testni qayta topshiring.' }
}

export function CourseExam({ exam, topics, onClose, onComplete, onOpenTopic }) {
  const [questions, setQuestions] = useState(() => shuffle(exam.questions))
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const score = questions.filter((question, index) => answers[index] === question.answer).length
  const percent = Math.round(score / questions.length * 100)
  const grade = gradeFor(percent)
  const weakTopics = useMemo(() => {
    const ids = [...new Set(questions.filter((question, index) => answers[index] !== question.answer).map(question => question.topicId))].sort((a, b) => a - b)
    return ids.map(id => topics.find(topic => topic.id === id)).filter(Boolean)
  }, [answers, topics, questions])

  const submit = () => {
    setChecked(true)
    onComplete(score, percent, questions.filter((question, index) => answers[index] !== question.answer))
  }
  const restart = () => { setQuestions(shuffle(exam.questions)); setAnswers({}); setChecked(false) }

  return <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-slate-950/80 p-4">
    <div className="my-8 w-full max-w-3xl rounded-3xl bg-white p-6 dark:bg-slate-900 sm:p-8">
      <div className="flex justify-between gap-4"><div><p className="eyebrow text-orange-600">Qadimgi dunyo tarixi · 6-sinf</p><h2 className="mt-1 text-2xl font-black">{exam.title}</h2><p className="mt-1 text-sm text-slate-500">{exam.scope} · {questions.length} ta savol</p></div><button type="button" onClick={onClose} className="icon-button" aria-label="Yopish"><FiX/></button></div>
      {checked && <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
        <div className="flex flex-wrap items-center gap-5"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-orange-100 text-xl font-black text-orange-600 dark:bg-orange-500/15">{score}/{questions.length}</span><div><p className={`text-xl font-black ${grade.tone}`}>{percent}% · {grade.label}</p><p className="mt-1 text-sm text-slate-500">{grade.text}</p></div></div>
        {weakTopics.length > 0 && <div className="mt-5"><p className="text-sm font-bold">Qayta o‘qish tavsiya etiladigan mavzular:</p><div className="mt-3 flex flex-wrap gap-2">{weakTopics.map(topic => <button type="button" key={topic.id} onClick={() => onOpenTopic(topic.id)} className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-left text-xs font-semibold text-orange-700 transition hover:bg-orange-50 dark:border-orange-500/30 dark:bg-slate-900 dark:text-orange-300">{topic.id}. {topic.title}</button>)}</div></div>}
        <button type="button" onClick={restart} className="btn-secondary mt-5"><FiRefresh/> Qayta topshirish</button>
      </div>}
      <div className="mt-7"><QuestionList questions={questions} answers={answers} onAnswer={(index, option) => setAnswers({ ...answers, [index]: option })} checked={checked}/></div>
      {!checked && <button type="button" disabled={Object.keys(answers).length < questions.length} onClick={submit} className="btn-primary mt-8 w-full bg-orange-500 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">Yakuniy javoblarni yuborish ({Object.keys(answers).length}/{questions.length})</button>}
    </div>
  </div>
}

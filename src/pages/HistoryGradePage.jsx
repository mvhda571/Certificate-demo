import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { HiArrowLeft as FiArrowLeft, HiArrowRight as FiArrowRight, HiBookOpen as FiBookOpen, HiCheck as FiCheck, HiDownload as FiDownload, HiExternalLink as FiExternalLink, HiDocumentText as FiFileText, HiGlobe as FiGlobe, HiLockClosed as FiLock, HiPlay as FiPlay, HiX as FiX } from 'react-icons/hi'
import { historyGrades } from '../data/historyCurriculum'
import { useLearningStore } from '../store/useLearningStore'
import { useTestStore } from '../store/useTestStore'
import { TeacherAdvice } from '../components/TeacherAdvice'
import { KonspektLesson, ProctoredExam } from '../components/KonspektCourse'
import { findKonspektCourse, historyTracks, localize, TEST_DURATION_SECONDS, TOPIC_TEST_SIZE } from '../data/konspekt'
import { useKonspektCourse } from '../hooks/useKonspektCourse'
import { useTranslation } from 'react-i18next'
import { buildQuestionSet } from '../utils/quizGenerator'
import { ExamProctorModals, useExamProctor } from '../hooks/useExamProctor'
import { useLessonView } from '../hooks/useLessonView'
import { LessonBackButton } from '../components/LessonBackButton'
import { wrongAnswers } from '../store/useMistakesStore'

const EXAM_SIZES = { midterm: 20, final: 30 }

const newAttemptId = () => Date.now()
const trackIcons = { ozbekiston: FiBookOpen, jahon: FiGlobe }

function TrackChooser({ grade, tracks }) {
  const { t, i18n } = useTranslation()
  return <div className="space-y-7">
    <Link to="/subjects/tarix" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><FiArrowLeft/> {t('konspekt.backToGrades')}</Link>
    <section className="hero-panel"><p className="eyebrow text-orange-600">{t('konspekt.historyGrade', { grade })}</p><h1 className="page-title">{t('konspekt.chooseTrack')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{t('konspekt.tracksInfo', { grade })}</p></section>
    <section className="grid gap-5 sm:grid-cols-2">{tracks.map(item => {
      const track = localize(item, i18n.language)
      const Icon = trackIcons[track.id] || FiBookOpen
      return <Link key={track.id} to={`/subjects/tarix/grade/${grade}/${track.id}`} className="group card-panel p-6 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10"><Icon className="h-6 w-6"/></span>
        <h2 className="mt-5 text-2xl font-black">{track.title}</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{track.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-orange-600 dark:border-slate-800">{t('konspekt.openLessons')} <FiArrowRight className="transition group-hover:translate-x-1"/></div>
      </Link>
    })}</section>
  </div>
}

function Exam({ title, questions, onClose, onComplete }) {
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const score = questions.filter((question, index) => answers[index] === question.answer).length
  return <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-slate-950/80 p-4">
    <div className="my-8 w-full max-w-3xl rounded-3xl bg-white p-6 dark:bg-slate-900">
      <div className="flex justify-between gap-4"><div><p className="eyebrow">Tarix nazorati</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div><button onClick={onClose} className="icon-button"><FiX/></button></div>
      {done ? <div className="py-12 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-orange-100 text-2xl font-black text-orange-600">{score}/{questions.length}</span><h3 className="mt-5 text-xl font-bold">Imtihon yakunlandi</h3><button onClick={onClose} className="btn-primary mt-6">Darslarga qaytish</button></div> : <div className="mt-7 space-y-6">
        {questions.map((question, index) => <div key={`${question.text}-${index}`}><p className="font-semibold">{index + 1}. {question.text}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <button key={`${option}-${optionIndex}`} onClick={() => setAnswers({...answers, [index]: optionIndex})} className={`rounded-xl border p-3 text-left text-sm ${answers[index] === optionIndex ? 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-500/10 dark:text-orange-200' : 'border-slate-200 dark:border-slate-700'}`}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div></div>)}
        <button disabled={Object.keys(answers).length < questions.length} onClick={() => { setDone(true); onComplete(score, wrongAnswers(questions, answers)) }} className="btn-primary w-full disabled:opacity-40">Javoblarni tekshirish</button>
      </div>}
    </div>
  </div>
}

export function HistoryGradePage() {
  const { gradeId, track } = useParams()
  const tracks = historyTracks[gradeId]
  if (tracks && !track) return <TrackChooser grade={gradeId} tracks={tracks}/>
  if (track && !tracks?.some(item => item.id === track)) return <Navigate to={`/subjects/tarix/grade/${gradeId}`} replace />
  return <HistoryProgram key={`${gradeId}-${track || ''}`} grade={gradeId} track={track}/>
}

function HistoryProgram({ grade, track }) {
  const { t, i18n } = useTranslation()
  const entry = findKonspektCourse(grade, track)
  // Konspekt interfeys tilida (tarjimasi bo'lsa); mavzu id'lari va progress kalitlari tildan qat'i nazar bir xil.
  const { course, lang: courseLang, loading } = useKonspektCourse(entry)
  const konspekt = localize(entry, i18n.language)
  // Konspektning o'z davri bo'lsa (masalan, Jahon tarixi), darslik PDF'siz alohida dastur sifatida ko'rsatiladi.
  const data = konspekt?.period ? { period: konspekt.period, pdf: konspekt.pdf, count: course.topics.length, lessons: course.topics.map(topic => ({ id: topic.id, title: topic.title })) } : historyGrades[grade]
  const subjectKey = konspekt?.key || `tarix-${grade}`
  const trackTitle = localize(historyTracks[grade]?.find(item => item.id === track), i18n.language)?.title
  const backTo = track ? `/subjects/tarix/grade/${grade}` : '/subjects/tarix'
  const { completed, completeLesson } = useLearningStore()
  const completeTest = useTestStore(state => state.completeTest)
  const [activeId, setActiveId] = useState(() => course?.topics.find(topic => !completed[`${subjectKey}:${topic.id}`])?.id || 1)
  const [viewer, setViewer] = useState(false)
  const [exam, setExam] = useState(null)
  const [activeTest, setActiveTest] = useState(null)
  const proctor = useExamProctor(() => setActiveTest(null))
  const lessonView = useLessonView()
  const active = data?.lessons.find(item => item.id === activeId)
  const activeTopic = course?.topics.find(topic => topic.id === activeId)
  const completeCount = data?.lessons.filter(item => completed[`${subjectKey}:${item.id}`]).length || 0
  if (!data) return <Navigate to="/subjects/tarix" replace />

  const isDone = (id) => Boolean(completed[`${subjectKey}:${id}`])
  const isUnlocked = (id) => !course || id === 1 || isDone(id) || isDone(id - 1)
  const openTopic = (id) => { setActiveId(id); setActiveTest(null); lessonView.openLesson() }
  // Test faqat qamrab olgan barcha mavzular yakunlangach ochiladi.
  const examUnlocked = (exam) => course.topics.slice(0, exam.lastTopic).every(topic => isDone(topic.id))
  const toErrorLog = (errors, topic) => errors.map((item, index) => ({ ...item, id: `${subjectKey}-${newAttemptId()}-${index}`, topic, front: item.text, back: item.options[item.answer] }))

  const programTitle = t('konspekt.program', { grade, title: trackTitle || konspekt?.title || 'tarix' })
  const topicNotice = activeTopic && i18n.language !== 'uz' && !activeTopic.translated ? t(loading ? 'konspekt.loadingTranslation' : 'konspekt.notTranslated') : null

  // Har bir urinishda savollar konspektdan yangidan tuziladi, test esa to'liq ekranga rozilikdan keyin boshlanadi.
  const startTest = (kind) => proctor.askStart(() => {
    if (kind === 'topic') {
      setActiveTest({
        kind, topicId: activeTopic.id, attempt: newAttemptId(),
        title: t('konspekt.topicTestTitle', { id: activeTopic.id, title: activeTopic.title }), subtitle: programTitle,
        questions: buildQuestionSet({ topics: [activeTopic], allTopics: course.topics, authored: activeTopic.quiz, size: TOPIC_TEST_SIZE, lang: courseLang }),
      })
      return
    }
    const exam = course[kind]
    const covered = course.topics.slice(0, exam.lastTopic)
    setActiveTest({
      kind, attempt: newAttemptId(), showWeakTopics: true,
      title: exam.title, subtitle: `${programTitle} · ${exam.scope}`,
      questions: buildQuestionSet({ topics: covered, allTopics: course.topics, authored: [...exam.questions, ...covered.flatMap(topic => topic.quiz)], size: EXAM_SIZES[kind], lang: courseLang }),
    })
  })

  const submitTest = (score, percent, errors) => {
    void proctor.finishExam()
    if (activeTest.kind === 'topic') {
      const topic = course.topics.find(item => item.id === activeTest.topicId)
      // XP faqat mavzu birinchi marta yakunlanganda beriladi, qayta ishlash ball yig'ish uchun emas.
      if (!isDone(topic.id)) {
        completeTest({ id: newAttemptId(), title: activeTest.title, testId: subjectKey, score, percent, questions: activeTest.questions, errors: toErrorLog(errors, topic.title) })
        completeLesson(subjectKey, topic.id)
      }
      return
    }
    completeTest({ id: newAttemptId(), title: `${programTitle}: ${activeTest.title}`, testId: `${subjectKey}-${activeTest.kind}`, score, percent, questions: activeTest.questions, errors: toErrorLog(errors, activeTest.title) })
  }

  const testActions = () => {
    if (activeTest?.kind !== 'topic') return []
    const topicId = activeTest.topicId
    const actions = []
    if (topicId === course.midterm.lastTopic) actions.push({ label: t('konspekt.midterm'), onClick: () => { setActiveTest(null); startTest('midterm') } })
    if (topicId === course.topics.length) actions.push({ label: t('konspekt.final'), primary: true, onClick: () => { setActiveTest(null); startTest('final') } })
    else actions.push({ label: t('konspekt.nextTopic'), primary: true, onClick: () => openTopic(topicId + 1) })
    return actions
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><FiArrowLeft/> {track ? t('konspekt.backToTracks') : t('konspekt.backToGrades')}</Link><div className="min-w-52"><div className="flex justify-between text-xs"><span>{t('konspekt.progress')}</span><b>{Math.round(completeCount/data.lessons.length*100)}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-orange-500" style={{width:`${completeCount/data.lessons.length*100}%`}}/></div></div></div>
    <section className="hero-panel"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-orange-600">{t('konspekt.historyGrade', { grade })}{trackTitle ? ` · ${trackTitle}` : ''}</p><h1 className="page-title">{data.period}</h1><p className="mt-3 text-sm text-slate-500">{t('konspekt.stats', { count: data.count, lessons: data.lessons.length, done: completeCount })}</p></div>{data.pdf && <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"><button onClick={() => setViewer(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"><FiFileText/> {t('konspekt.viewPdf')}</button><a href={data.pdf} download className="grid place-items-center border-l border-slate-200 px-3 dark:border-slate-700"><FiDownload/></a><a href={data.pdf} target="_blank" rel="noreferrer" className="grid place-items-center border-l border-slate-200 px-3 dark:border-slate-700"><FiExternalLink/></a></div>}</div></section>
    <div className="grid gap-6 xl:grid-cols-[350px_1fr]">
      <aside className={`card-panel h-fit p-3 xl:max-h-[75vh] xl:overflow-y-auto ${lessonView.listClass}`}><p className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">{course ? t('konspekt.planTitle') : t('konspekt.bookTopics')}</p>{data.lessons.map((item, index) => { const done = completed[`${subjectKey}:${item.id}`]; const unlocked = isUnlocked(item.id); const section = course?.topics[index]?.section; const newSection = section && section !== course.topics[index - 1]?.section; return <div key={item.id}>{newSection && <p className="px-3 pb-1 pt-4 text-[11px] font-black uppercase tracking-wider text-orange-500">{section}</p>}<button disabled={!unlocked} onClick={() => openTopic(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${activeId === item.id ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${done ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{done ? <FiCheck/> : unlocked ? item.id : <FiLock/>}</span><span className="font-semibold">{item.title}</span></button>{course && item.id === course.midterm.lastTopic && <button disabled={!examUnlocked(course.midterm)} onClick={() => startTest('midterm')} className="my-2 ml-11 inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 disabled:bg-transparent disabled:text-slate-300 dark:bg-orange-500/10">{examUnlocked(course.midterm) ? <FiPlay/> : <FiLock/>} {t('konspekt.midtermButton', { scope: course.midterm.scope, count: EXAM_SIZES.midterm })}</button>}{!course && item.test && <button disabled={!done} onClick={() => setExam({title: `${item.id}-Progress Test`, questions: item.test})} className="mb-2 ml-11 inline-flex items-center gap-2 text-xs font-bold text-orange-500 disabled:text-slate-300">{done ? <FiPlay/> : <FiLock/>} Progress Test</button>}</div>})}<button disabled={completeCount !== data.lessons.length} onClick={() => course ? startTest('final') : setExam({title: `${grade}-sinf Mock Exam`, questions: data.mock})} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:bg-slate-100 disabled:text-slate-400 dark:bg-orange-600 dark:disabled:bg-slate-800"><FiPlay/> {course ? t('konspekt.finalButton', { count: EXAM_SIZES.final }) : 'Yakuniy Mock Exam'}</button></aside>
      {course ? <article className={`card-panel p-6 sm:p-8 ${lessonView.lessonClass}`}><LessonBackButton onClick={lessonView.backToList}/><KonspektLesson key={activeTopic.id} topic={activeTopic} done={isDone(activeTopic.id)} isLast={activeTopic.id === course.topics.length} midtermAfter={activeTopic.id === course.midterm.lastTopic} testSize={TOPIC_TEST_SIZE} durationMinutes={TEST_DURATION_SECONDS / 60} notice={topicNotice} onStartTest={() => startTest('topic')} onNext={() => openTopic(activeTopic.id + 1)} onFinal={() => startTest('final')} onMidterm={() => startTest('midterm')}/></article> : <article className={`card-panel p-6 sm:p-8 ${lessonView.lessonClass}`}><LessonBackButton onClick={lessonView.backToList}/>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow text-orange-600">Mavzu {active.id}</p><h2 className="mt-2 text-3xl font-black">{active.id}-dars: {active.title}</h2></div><span className="pill bg-slate-100 text-slate-500 dark:bg-slate-800">PDF: {active.pages}-sahifalar</span></div>
        <section className="mt-7"><p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Ustoz tushuntirishi</p><p className="mt-3 text-base leading-8 text-slate-600 dark:text-slate-300">{active.summary}</p><p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">{active.facts.map((fact, index) => <strong key={fact} className="mr-2 font-extrabold text-slate-950 dark:text-white">{fact}{index < active.facts.length - 1 ? ';' : '.'}</strong>)}</p></section>
        <section className="mt-7 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70"><h3 className="font-bold">Imtihon uchun eng muhim faktlar</h3><ul className="mt-4 space-y-3">{active.facts.map((fact, index) => <li key={fact} className="flex gap-3 text-sm leading-6"><FiCheck className="mt-1 shrink-0 text-orange-500"/><span><b>{index === 0 ? 'Sana yoki davr' : index === 1 ? 'Shaxs yoki joy' : 'Atama yoki voqea'}:</b> {fact}</span></li>)}</ul></section>
        <section className="mt-7 rounded-2xl border border-orange-200 p-5 dark:border-orange-500/20"><h3 className="font-bold">Mustahkamlash uchun tezkor savollar</h3><ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{active.quickQuestions.map((question, index) => <li key={question}><b>{index + 1}.</b> {question}</li>)}</ol></section>
        <TeacherAdvice subject="tarix" lesson={active}/>
        <div className="mt-7 flex justify-end"><button onClick={() => completeLesson(subjectKey, active.id)} className="btn-primary bg-orange-500 hover:bg-orange-600"><FiCheck/>{completed[`${subjectKey}:${active.id}`] ? 'Dars yakunlangan' : 'Darsni yakunlash'}</button></div>
      </article>}
    </div>
    <ExamProctorModals proctor={proctor}/>
    {activeTest && <ProctoredExam key={activeTest.attempt} exam={activeTest} topics={course.topics} durationSeconds={TEST_DURATION_SECONDS} onComplete={submitTest} onClose={() => setActiveTest(null)} onRetry={() => { const kind = activeTest.kind; setActiveTest(null); startTest(kind) }} onOpenTopic={openTopic} actions={testActions()}/>}
    {exam &&<Exam {...exam} onClose={() => setExam(null)} onComplete={(score, errors) => completeTest({id:Date.now(), title:exam.title, testId:subjectKey, score, percent:Math.round(score/exam.questions.length*100), questions:exam.questions, errors:errors.map((item,index)=>({...item,id:`${subjectKey}-${Date.now()}-${index}`,topic:active.title,front:item.text,back:item.options[item.answer]}))})}/>} 
    {viewer && <div className="fixed inset-0 z-[80] flex flex-col bg-slate-950/90 p-3 sm:p-6"><div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-t-2xl bg-white px-4 py-3 dark:bg-slate-900"><b>{grade}-sinf tarix darsligi</b><div className="flex gap-2"><a href={data.pdf} download className="btn-primary"><FiDownload/> Yuklab olish</a><button onClick={() => setViewer(false)} className="icon-button"><FiX/></button></div></div><iframe title={`${grade}-sinf tarix`} src={data.pdf} className="mx-auto h-full w-full max-w-6xl rounded-b-2xl bg-white"/></div>}
  </div>
}

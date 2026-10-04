import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { HiX } from 'react-icons/hi'
import mathGrades from '../data/mathCurriculum.json'
import uzbekGrades from '../data/uzbekCurriculum.json'
import literatureGrades from '../data/literatureCurriculum.json'
import { historyGrades } from '../data/historyCurriculum'
import { curriculum } from '../data/curriculum'
import { useLearningStore } from '../store/useLearningStore'
import { useTestStore } from '../store/useTestStore'
import { MilestoneTests } from './MilestoneTests'
import { wrongAnswers } from '../store/useMistakesStore'

const configs = {
  tarix: { grades: historyGrades, accent: 'orange' },
  matematika: { grades: mathGrades, accent: 'blue' },
  'ona-tili': { grades: uzbekGrades, accent: 'violet' },
  adabiyot: { grades: literatureGrades, accent: 'rose' },
}

function resolveCourse(pathname) {
  const gradeMatch = pathname.match(/^\/subjects\/(tarix|matematika|ona-tili|adabiyot)\/grade\/(\d+)$/)
  if (gradeMatch) {
    const [, subject, grade] = gradeMatch
    const data = configs[subject].grades[grade]
    return data?.lessons?.length ? { subjectKey: `${subject}-${grade}`, lessons: data.lessons, accent: configs[subject].accent } : null
  }
  const subjectMatch = pathname.match(/^\/subjects\/([^/]+)$/)
  const subject = subjectMatch?.[1]
  return subject && !configs[subject] && curriculum[subject]?.length ? { subjectKey: subject, lessons: curriculum[subject], accent: 'emerald' } : null
}

function MilestoneExam({ exam, subjectKey, onClose }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const completeTest = useTestStore(state => state.completeTest)
  const completeCourse = useLearningStore(state => state.completeCourse)
  const score = exam.questions.filter((question, index) => answers[index] === question.answer).length
  const submit = () => {
    const percent = Math.round(score / exam.questions.length * 100)
    const errors = wrongAnswers(exam.questions, answers)
    completeTest({ id: Date.now(), title: exam.title, testId: subjectKey, type: exam.type, score, total: exam.questions.length, percent, questions: exam.questions, errors })
    if (exam.type === 'final') completeCourse(subjectKey)
    setResult({ score, percent })
  }
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-4"><div className="mx-auto my-8 max-w-4xl rounded-3xl bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-emerald-600">Bosqich nazorati</p><h2 className="mt-1 text-2xl font-black">{exam.title}</h2></div><button onClick={onClose} className="icon-button"><HiX/></button></div>{result ? <div className="py-14 text-center"><b className="text-5xl text-emerald-600">{result.score}/{exam.questions.length}</b><p className="mt-3 text-lg font-bold">Natija: {result.percent}/100</p><button onClick={onClose} className="btn-primary mt-6">Darslarga qaytish</button></div> : <div className="mt-7 space-y-6">{exam.questions.map((question, index) => <article key={question.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p className="font-semibold"><span className="mr-2 text-slate-400">{index + 1}.</span>{question.text}</p><p className="mt-1 text-xs text-slate-400">{question.topic}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <button key={`${index}-${optionIndex}`} onClick={() => setAnswers(current => ({ ...current, [index]: optionIndex }))} className={`rounded-xl border p-3 text-left text-sm ${answers[index] === optionIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-slate-200 dark:border-slate-700'}`}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div></article>)}<button disabled={Object.keys(answers).length < exam.questions.length} onClick={submit} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40">Testni yakunlash</button></div>}</div></div>
}

export function MilestoneController() {
  const { pathname } = useLocation()
  const { completed, completedCourses } = useLearningStore()
  const [exam, setExam] = useState(null)
  const course = useMemo(() => resolveCourse(pathname), [pathname])
  if (!course) return null
  const completedCount = course.lessons.filter(lesson => completed[`${course.subjectKey}:${lesson.id}`]).length
  const completedLessonIds = course.lessons.filter(lesson => completed[`${course.subjectKey}:${lesson.id}`]).map(lesson => lesson.id)
  return <div className="mt-6"><MilestoneTests {...course} completedCount={completedCount} completedLessonIds={completedLessonIds} courseCompleted={Boolean(completedCourses[course.subjectKey])} onOpen={setExam}/>{exam && <MilestoneExam exam={exam} subjectKey={course.subjectKey} onClose={() => setExam(null)}/>}</div>
}

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft, HiRefresh } from 'react-icons/hi'
import { examSubjects, generateExam } from '../utils/examGenerator'
import { useTestStore } from '../store/useTestStore'
import { ExamProctorModals, useExamProctor } from '../hooks/useExamProctor'
import { wrongAnswers } from '../store/useMistakesStore'

const difficultyLabel = { easy: 'Oson', medium: 'O‘rta', hard: 'Qiyin' }
const difficultyClass = { easy: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', hard: 'bg-red-50 text-red-700' }
const certificateGrade = percent => percent >= 93 ? 'A+' : percent >= 86 ? 'A' : percent >= 78 ? 'B+' : percent >= 70 ? 'B' : percent >= 62 ? 'C+' : percent >= 55 ? 'C' : 'O‘tmadi'

export function TestDetailPage() {
  const navigate = useNavigate()
  const proctor = useExamProctor(() => navigate('/tests', { replace: true }))
  const { askStart } = proctor
  const { id } = useParams(); const subject = examSubjects.find(item => item.id === id)
  const [attemptKey, setAttemptKey] = useState(0); const questions = useMemo(() => { void attemptKey; return generateExam(id) }, [id, attemptKey])
  const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null); const completeTest = useTestStore(state => state.completeTest)
  useEffect(() => { askStart() }, [askStart])
  if (!subject) return <Navigate to="/tests" replace/>
  const retake = () => proctor.askStart(() => { setAnswers({}); setResult(null); setAttemptKey(value => value + 1) })
  const submit = () => { const correct=questions.filter((q,index)=>answers[index]===q.answer).length; const errors=wrongAnswers(questions,answers).map(q=>({...q,front:q.text,back:q.options[q.answer]})); const percent=Math.round(correct/questions.length*100); setResult({correct,percent}); void proctor.finishExam(); completeTest({id:Date.now(),testId:id,type:'mock',title:`${subject.title} Mock Exam`,score:correct,total:questions.length,percent,certificateLevel:certificateGrade(percent),questions,errors}) }
  return <div className="space-y-6"><ExamProctorModals proctor={proctor}/><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/tests" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><HiArrowLeft/> Testlarga qaytish</Link><button onClick={retake} className="btn-secondary"><HiRefresh/> Yangi variant</button></div><section className="hero-panel"><p className="eyebrow">{subject.title}</p><h1 className="page-title">Milliy Sertifikat sinov testi</h1><p className="mt-2 text-sm text-slate-500">20 savol: 4 ta oson, 10 ta o‘rta, 6 ta qiyin.</p></section>
    {questions.map((question,index)=><article key={question.id} className="card-panel p-6"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{index+1}. {question.text}</h2><span className={`pill shrink-0 ${difficultyClass[question.difficulty]}`}>{difficultyLabel[question.difficulty]}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option,optionIndex)=><button key={`${option}-${optionIndex}`} disabled={Boolean(result)} onClick={()=>setAnswers({...answers,[index]:optionIndex})} className={`rounded-xl border p-3 text-left text-sm ${answers[index]===optionIndex?'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200':'border-slate-200 dark:border-slate-700'}`}>{String.fromCharCode(65+optionIndex)}. {option}</button>)}</div>{result&&<p className={`mt-3 text-sm ${answers[index]===question.answer?'text-emerald-600':'text-red-600'}`}>{question.explanation}</p>}</article>)}
    <div className="flex justify-end">{result?<div className="card-panel flex items-center gap-5 p-5"><div><p className="text-sm text-slate-500">Natija</p><b className="text-2xl">{result.correct}/20 · {result.percent}%</b></div><button onClick={retake} className="btn-primary"><HiRefresh/> Qayta ishlash</button></div>:<button disabled={Object.keys(answers).length<questions.length} onClick={submit} className="btn-primary disabled:opacity-40">Testni yakunlash</button>}</div>
  </div>
}

import { useMemo, useState } from 'react'
import { HiCheck, HiRefresh, HiSparkles } from 'react-icons/hi'
import { useAcademyStore } from '../store/academyStore'
import { useLearningStore } from '../store/useLearningStore'
import { useTestStore } from '../store/useTestStore'
import { curriculum } from '../data/curriculum'
import { historyGrades } from '../data/historyCurriculum'
import math from '../data/mathCurriculum.json'
import uzbek from '../data/uzbekCurriculum.json'
import literature from '../data/literatureCurriculum.json'
import { konspektCourses } from '../data/konspekt'

// Konspekt kursi bilan almashtirilgan sinflar (eski fakt-kartalari endi ishlatilmaydi).
const konspektGrades = new Set(Object.values(konspektCourses).filter(entry => !entry.track).map(entry => entry.grade))

const factsOf = lesson => lesson.facts || lesson.formulas || lesson.points || lesson.rules || []

function curriculumCards(completed) {
  const cards=[]
  Object.entries(curriculum).forEach(([subject,lessons])=>lessons.forEach(lesson=>{if(completed[`${subject}:${lesson.id}`])factsOf(lesson).slice(0,2).forEach((fact,index)=>cards.push({id:`${subject}-${lesson.id}-${index}`,subject,front:lesson.title,back:fact,source:'Dars mavzusi'}))}))
  // Mavzu kartalari faqat o'quvchi shu mavzuni yakunlagandan keyin qo'shiladi.
  Object.values(konspektCourses).forEach(({key,grade,title,course})=>course.topics.forEach(topic=>{if(completed[`${key}:${topic.id}`])topic.flashcards.forEach((card,index)=>cards.push({id:`${key}-konspekt-${topic.id}-${index}`,subject:`${title} ${grade} · ${topic.id}-mavzu`,front:card.front,back:card.back,source:topic.title}))}))
  Object.entries(historyGrades).forEach(([grade,data])=>!konspektGrades.has(grade)&&data.lessons.forEach(lesson=>{if(completed[`tarix-${grade}:${lesson.id}`])factsOf(lesson).slice(0,2).forEach((fact,index)=>cards.push({id:`tarix-${grade}-${lesson.id}-${index}`,subject:`Tarix ${grade}`,front:lesson.title,back:fact,source:'PDF mavzusi'}))}))
  ;[[math,'matematika'],[uzbek,'ona-tili'],[literature,'adabiyot']].forEach(([grades,subject])=>Object.entries(grades).forEach(([grade,data])=>(data.lessons||[]).forEach(lesson=>{if(completed[`${subject}-${grade}:${lesson.id}`])factsOf(lesson).slice(0,2).forEach((fact,index)=>cards.push({id:`${subject}-${grade}-${lesson.id}-${index}`,subject:`${subject} ${grade}`,front:lesson.title,back:fact,source:'PDF mavzusi'}))})))
  return cards
}

export function FlashcardsPage() {
  const completed=useLearningStore(state=>state.completed); const errorLog=useTestStore(state=>state.errorLog)
  const {flashcardStatus,setFlashcardStatus}=useAcademyStore(); const [batchIds,setBatchIds]=useState([]); const [round,setRound]=useState({}); const [index,setIndex]=useState(0); const [flipped,setFlipped]=useState(false)
  const allCards=useMemo(()=>{const mistakes=errorLog.map((item,i)=>({id:`mistake-${item.id||i}`,subject:item.topic||'Test xatosi',front:item.front||item.text,back:item.back||item.explanation||item.options?.[item.answer]||'To‘g‘ri javobni qayta tekshiring.',source:'Takrorlash uchun'}));const unique=new Map([...mistakes,...curriculumCards(completed)].map(card=>[card.id,card]));return [...unique.values()]},[completed,errorLog])
  const initialIds=useMemo(()=>{const review=allCards.filter(card=>flashcardStatus[card.id]==='review');const fresh=allCards.filter(card=>!flashcardStatus[card.id]);return [...review,...fresh].slice(0,20).map(card=>card.id)},[allCards,flashcardStatus])
  const activeIds=batchIds.length?batchIds:initialIds; const batch=activeIds.map(id=>allCards.find(card=>card.id===id)).filter(Boolean); const card=batch[index]
  const answer=status=>{setFlashcardStatus(card.id,status);const nextRound={...round,[card.id]:status};const finished=batch.every(item=>nextRound[item.id]);if(!finished){setRound(nextRound);setIndex((index+1)%batch.length);setFlipped(false);return}const reviewIds=batch.filter(item=>nextRound[item.id]==='review').map(item=>item.id);if(reviewIds.length){setBatchIds(reviewIds);setRound({});setIndex(0);setFlipped(false);return}const remaining=allCards.filter(item=>!activeIds.includes(item.id)&&flashcardStatus[item.id]!=='known');const next=[...remaining.filter(item=>flashcardStatus[item.id]==='review'),...remaining.filter(item=>!flashcardStatus[item.id])].slice(0,20).map(item=>item.id);setBatchIds(next);setRound({});setIndex(0);setFlipped(false)}
  if(!allCards.length)return <div className="card-panel p-12 text-center"><HiSparkles className="mx-auto h-10 w-10 text-emerald-500"/><h1 className="mt-4 text-xl font-bold">Kartalar hali shakllanmadi</h1><p className="mt-2 text-sm text-slate-500">Darsni yakunlang yoki test ishlang.</p></div>
  if(!card)return <div className="card-panel p-12 text-center"><HiCheck className="mx-auto h-12 w-12 text-emerald-500"/><h1 className="mt-4 text-2xl font-black">Barcha kartalar o‘zlashtirildi</h1><p className="mt-2 text-slate-500">Yangi dars yoki test xatosi paydo bo‘lsa, keyingi to‘plam avtomatik yaratiladi.</p></div>
  const known=batch.filter(item=>round[item.id]==='known').length
  return <div className="space-y-6"><section className="hero-panel"><p className="eyebrow">Aqlli flesh-kartalar</p><h1 className="page-title">20 talik o‘rganish to‘plami</h1><p className="mt-2 text-sm text-slate-500">Avval qiyin kartalar takrorlanadi. To‘plam to‘liq o‘zlashtirilgach, keyingi 20 ta karta ochiladi.</p></section><div className="card-panel flex min-h-[520px] flex-col items-center justify-center p-6"><div className="mb-5 flex w-full max-w-2xl justify-between text-sm"><span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10">{card.subject}</span><span className="text-slate-400">{index+1}/{batch.length} · O‘zlashtirildi: {known}</span></div><button onClick={()=>setFlipped(value=>!value)} className="flashcard relative w-full max-w-2xl text-left"><div className={`flashcard-inner ${flipped?'is-flipped':''}`}><div className="flashcard-face bg-slate-900 text-white"><HiSparkles className="mb-8 h-8 w-8 text-emerald-400"/><p className="text-xs uppercase tracking-widest text-slate-400">Savol</p><h2 className="mt-4 text-2xl font-semibold">{card.front}</h2></div><div className="flashcard-face flashcard-back bg-emerald-500 text-white"><HiCheck className="mb-8 h-8 w-8"/><p className="text-xs uppercase tracking-widest text-emerald-100">Javob</p><h2 className="mt-4 text-2xl font-semibold">{card.back}</h2></div></div></button><div className="mt-6 flex w-full max-w-2xl justify-center gap-3"><button onClick={()=>answer('review')} className="btn-review"><HiRefresh/> Yana takrorlayman</button><button onClick={()=>answer('known')} className="btn-primary"><HiCheck/> Bilaman</button></div><div className="mt-6 h-2 w-full max-w-2xl overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:`${Object.keys(round).length/batch.length*100}%`}}/></div></div></div>
}

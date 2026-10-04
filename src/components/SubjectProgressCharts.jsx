import { useLearningStore } from '../store/useLearningStore'
import mathCurriculum from '../data/mathCurriculum.json'
import uzbekCurriculum from '../data/uzbekCurriculum.json'
import literatureCurriculum from '../data/literatureCurriculum.json'
import { historyGrades } from '../data/historyCurriculum'
import { konspektCourses } from '../data/konspekt'

const countLessons = data => Object.values(data).reduce((sum, grade) => sum + (grade.available === false ? 0 : (grade.lessons?.length || 0)), 0)
// Tarix: 5-sinf eski darslari + 6–11-sinf konspekt kurslarining mavzulari.
const historyTotal = countLessons(historyGrades) + Object.values(konspektCourses).reduce((sum, entry) => sum + entry.course.topics.length, 0)
const subjects = [
  { id: 'matematika', title: 'Matematika', color: '#3b82f6', total: countLessons(mathCurriculum) },
  { id: 'ona-tili', title: 'Ona tili', color: '#8b5cf6', total: countLessons(uzbekCurriculum) },
  { id: 'adabiyot', title: 'Adabiyot', color: '#f43f5e', total: countLessons(literatureCurriculum) },
  { id: 'tarix', title: 'Tarix', color: '#f97316', total: historyTotal },
]

function SubjectPieChart({ title, color, completed, total }) {
  const percent = total ? Math.min(100, Math.round(completed / total * 100)) : 0
  const radius = 44
  const circumference = 2 * Math.PI * radius
  return <article className="card-panel flex items-center gap-5 p-5"><div className="relative h-28 w-28 shrink-0" role="img" aria-label={`${title}: ${percent} foiz o‘zlashtirilgan`}><svg viewBox="0 0 104 104" className="h-full w-full -rotate-90"><circle cx="52" cy="52" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800"/><circle cx="52" cy="52" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} className="transition-all duration-700"/></svg><strong className="absolute inset-0 grid place-items-center text-xl">{percent}%</strong></div><div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm text-slate-500">{completed} / {total} dars yakunlangan</p></div></article>
}

export function SubjectProgressCharts() {
  const completed = useLearningStore(state => state.completed)
  const completedKeys = Object.keys(completed).filter(key => completed[key])
  const countFor = id => completedKeys.filter(key => key.split(':')[0] === id || key.split(':')[0].startsWith(`${id}-`)).length
  return <section><div className="mb-4"><p className="eyebrow text-blue-600">Fanlar kesimida</p><h2 className="mt-1 text-2xl font-black">O‘zlashtirish ko‘rsatkichlari</h2></div><div className="grid gap-5 md:grid-cols-2">{subjects.map(subject => <SubjectPieChart key={subject.id} {...subject} completed={countFor(subject.id)}/>)}</div></section>
}

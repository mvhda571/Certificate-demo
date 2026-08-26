import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { PageHeader } from './components/PageHeader'
import { HomePage } from './pages/HomePage'
import { SubjectsPage } from './pages/SubjectsPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { TestDetailPage } from './pages/TestDetailPage'
import { TutorPage } from './pages/TutorPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResultsPage } from './pages/ResultsPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import i18n from './i18n'
import { useThemeStore } from './store/themeStore'
import { useUserStore } from './store/useUserStore'
import { AuthGate } from './components/AuthGate'
import { LessonPage } from './pages/LessonPage'
import { MockTestPage } from './pages/MockTestPage'
import { HistoryGradesPage } from './pages/HistoryGradesPage'
import { HistoryGradePage } from './pages/HistoryGradePage'
import { MathGradesPage, MathTrackPage } from './pages/MathGradesPage'
import { UzbekGradesPage } from './pages/UzbekGradesPage'
import { UzbekGradePage } from './pages/UzbekGradePage'
import { LiteratureGradesPage } from './pages/LiteratureGradesPage'
import { LiteratureGradePage } from './pages/LiteratureGradePage'
import { MilestoneController } from './components/MilestoneController'

function App() {
  const { darkMode, language } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [examFullscreen, setExamFullscreen] = useState(Boolean(document.fullscreenElement))
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])
  useEffect(() => { i18n.changeLanguage(language) }, [language])
  useEffect(() => { const syncFullscreen = () => setExamFullscreen(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', syncFullscreen); return () => document.removeEventListener('fullscreenchange', syncFullscreen) }, [])

  if (!isAuthenticated) {
    return <AuthGate />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <div className={`mx-auto flex min-h-screen max-w-[1600px] ${examFullscreen ? 'p-0' : 'gap-6 p-3 sm:p-5 lg:p-8'}`}>
          {!examFullscreen && <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />}

          <main className="min-w-0 flex-1">
            {!examFullscreen && <PageHeader onMenu={() => setMenuOpen(true)} />}

            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/fanlar" element={<SubjectsPage />} />
                  <Route path="/subjects/tarix" element={<HistoryGradesPage />} />
                  <Route path="/subjects/tarix/grade/:gradeId" element={<HistoryGradePage />} />
                  <Route path="/subjects/ona-tili" element={<UzbekGradesPage />} />
                  <Route path="/subjects/ona-tili/grade/:gradeId" element={<UzbekGradePage />} />
                  <Route path="/subjects/adabiyot" element={<LiteratureGradesPage />} />
                  <Route path="/subjects/adabiyot/grade/:gradeId" element={<LiteratureGradePage />} />
                  <Route path="/subjects/matematika/grades" element={<MathGradesPage />} />
                  <Route path="/subjects/matematika/grade/:gradeId" element={<MathTrackPage />} />
                  <Route path="/subjects/:subjectId" element={<LessonPage />} />
                  <Route path="/subjects/:subjectId/mock" element={<MockTestPage />} />
                  <Route path="/flashcards" element={<FlashcardsPage />} />
                  <Route path="/tests" element={<MockTestPage />} />
                  <Route path="/tests/mock" element={<MockTestPage />} />
                  <Route path="/tests/:id" element={<TestDetailPage />} />
                  <Route path="/knowledge" element={<Navigate to="/results" replace />} />
                  <Route path="/tutor" element={<TutorPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/login" element={<HomePage />} />
                  <Route path="/analytics" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
            <MilestoneController />
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App

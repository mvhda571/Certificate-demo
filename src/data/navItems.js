import { FiAlertCircle, FiGrid, FiHome, FiMessageCircle, FiPieChart, FiTarget, FiUser } from 'react-icons/fi'
import { GiBookshelf } from 'react-icons/gi'
import { FaTrophy } from 'react-icons/fa'

// Ilovadagi barcha bo'limlar: [i18n kaliti, manzil, ikonka]. Desktop Sidebar va mobil "Boshqalar" paneli shu ro'yxatdan foydalanadi.
export const navItems = [['dashboard','/',FiHome],['subjects','/subjects',GiBookshelf],['tests','/tests',FiTarget],['flashcards','/flashcards',FiGrid],['results','/results',FiPieChart],['mistakes.nav','/mistakes',FiAlertCircle],['leaderboard','/leaderboard',FaTrophy],['tutor','/tutor',FiMessageCircle],['profile','/profile',FiUser]]

import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SchoolListPage from './pages/SchoolListPage'
import SchoolDetailPage from './pages/SchoolDetailPage'
import CalculatorPage from './pages/CalculatorPage'
import ComparePage from './pages/ComparePage'
import FavoritesPage from './pages/FavoritesPage'
import ProfilePage from './pages/ProfilePage'
import FAQPage from './pages/FAQPage'
import TreeholePage from './pages/TreeholePage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/schools" element={<SchoolListPage />} />
        <Route path="/schools/:id" element={<SchoolDetailPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/treehole" element={<TreeholePage />} />
      </Routes>
    </Layout>
  )
}

export default App

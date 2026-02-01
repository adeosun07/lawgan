import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LawPage from './pages/LawPage'
import PoliticsPage from './pages/PoliticsPage'
import ForeignAffairsPage from './pages/ForeignAffairsPage'
import ReviewsPage from './pages/ReviewsPage'
import AboutPage from './pages/AboutPage'
import EditorialBoardPage from './pages/EditorialBoardPage'
import AdminPage from './pages/AdminPage'
import ArticlePage from './pages/ArticlePage'
import './App.css'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/law" element={<LawPage />} />
        <Route path="/politics" element={<PoliticsPage />} />
        <Route path="/foreign-affairs" element={<ForeignAffairsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/editorial-board" element={<EditorialBoardPage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App

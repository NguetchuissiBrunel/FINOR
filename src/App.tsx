import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/Layout/MainLayout'
import { Home } from './pages/Home'
import { Invest } from './pages/Invest'
import { InvestorDashboard } from './pages/InvestorDashboard'
import { TreasurerDashboard } from './pages/TreasurerDashboard'
import { InvestorLogin } from './pages/InvestorLogin'
import { TreasurerLogin } from './pages/TreasurerLogin'
import { NotificationProvider } from './context/NotificationContext'

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="investir" element={<Invest />} />
            <Route path="investisseur/login" element={<InvestorLogin />} />
            <Route path="investisseur/dashboard" element={<InvestorDashboard />} />
            <Route path="tresorier/login" element={<TreasurerLogin />} />
            <Route path="tresorier" element={<TreasurerDashboard />} />
            {/* We will add other routes here */}
          </Route>
        </Routes>
      </Router>
    </NotificationProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Home from './pages/Home'
import CapitalAccessResults from './pages/CapitalAccessResults'
import CreditBuilderResults from './pages/CreditBuilderResults'
import InstitutionDetail from './pages/InstitutionDetail'
import ProfilePositioning from './pages/education/ProfilePositioning'
import StackingMethod from './pages/education/StackingMethod'
import WealthyPlaybook from './pages/education/WealthyPlaybook'
import AdminLogin from './pages/admin/AdminLogin'
import AdminPanel from './pages/admin/AdminPanel'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/results/capital-access" element={<ProtectedRoute><CapitalAccessResults /></ProtectedRoute>} />
            <Route path="/results/credit-builder" element={<ProtectedRoute><CreditBuilderResults /></ProtectedRoute>} />
            <Route path="/institution/:id" element={<ProtectedRoute><InstitutionDetail /></ProtectedRoute>} />
            <Route path="/education/profile-positioning" element={<ProtectedRoute><ProfilePositioning /></ProtectedRoute>} />
            <Route path="/education/stacking-method" element={<ProtectedRoute><StackingMethod /></ProtectedRoute>} />
            <Route path="/education/wealthy-playbook" element={<ProtectedRoute><WealthyPlaybook /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Home from './pages/Home'
import BrowseAll from './pages/BrowseAll'
import CapitalAccessResults from './pages/CapitalAccessResults'
import CreditBuilderResults from './pages/CreditBuilderResults'
import InstitutionDetail from './pages/InstitutionDetail'
import Resources from './pages/Resources'
import Account from './pages/Account'
import Terms from './pages/legal/Terms'
import Privacy from './pages/legal/Privacy'
import Refunds from './pages/legal/Refunds'
import CommunityGuidelines from './pages/legal/CommunityGuidelines'
import BankDirectory from './pages/public/BankDirectory'
import Demo from './pages/public/Demo'
import BankDetail from './pages/public/BankDetail'
import CheatSheet from './pages/public/CheatSheet'
import ShareExperience from './pages/public/ShareExperience'
import WinsWall from './pages/public/WinsWall'
import ChatRoom from './pages/ChatRoom'
import BusinessFunding from './pages/BusinessFunding'
import ProfilePositioning from './pages/education/ProfilePositioning'
import StackingMethod from './pages/education/StackingMethod'
import WealthyPlaybook from './pages/education/WealthyPlaybook'
import ACCBlueprint from './pages/education/ACCBlueprint'
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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/banks" element={<BankDirectory />} />
            <Route path="/banks/:slug" element={<BankDetail />} />
            <Route path="/cheat-sheet" element={<CheatSheet />} />
            <Route path="/share" element={<ShareExperience />} />
            <Route path="/wins" element={<WinsWall />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><BrowseAll /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/business" element={<ProtectedRoute><BusinessFunding /></ProtectedRoute>} />
            <Route path="/results/capital-access" element={<ProtectedRoute><CapitalAccessResults /></ProtectedRoute>} />
            <Route path="/results/credit-builder" element={<ProtectedRoute><CreditBuilderResults /></ProtectedRoute>} />
            <Route path="/institution/:id" element={<ProtectedRoute><InstitutionDetail /></ProtectedRoute>} />
            <Route path="/education/profile-positioning" element={<ProtectedRoute><ProfilePositioning /></ProtectedRoute>} />
            <Route path="/education/stacking-method" element={<ProtectedRoute><StackingMethod /></ProtectedRoute>} />
            <Route path="/education/wealthy-playbook" element={<ProtectedRoute requirePaid feature="The Wealthy Person's Playbook"><WealthyPlaybook /></ProtectedRoute>} />
            <Route path="/education/acc-blueprint" element={<ProtectedRoute requirePaid feature="The ACC Blueprint"><ACCBlueprint /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

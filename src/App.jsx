import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateNew from './pages/CandidateNew'
import CandidateDetail from './pages/CandidateDetail'
import Pipeline from './pages/Pipeline'
import PublicApply from './pages/PublicApply'
import PublicApplyES from './pages/PublicApplyES'
import ApplicationResult from './pages/ApplicationResult'
import BiuDocument from './pages/BiuDocument'
import StudentReport from './pages/StudentReport'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AdminUsers from './pages/AdminUsers'

// Heavy page (bundles pdf.js) — load only when the export route is opened
const CandidateExport = lazy(() => import('./pages/CandidateExport'))

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC LANDING (root) */}
        <Route path="/" element={<Landing />} />

        {/* PUBLIC APPLICATION — English */}
        <Route path="/aplicar" element={<PublicApply />} />
        <Route path="/aplicar/resultado" element={<ApplicationResult />} />

        {/* PUBLIC APPLICATION — Spanish */}
        <Route path="/aplicar/es" element={<PublicApplyES />} />
        <Route path="/aplicar/es/resultado" element={<ApplicationResult />} />

        {/* STUDENT MONTHLY REPORT (public, no auth) */}
        <Route path="/reportar/:candidateId" element={<StudentReport />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* BIU DOCUMENT (auth required, no sidebar) */}
        <Route
          path="/candidatos/:id/biu-document"
          element={<ProtectedRoute><BiuDocument /></ProtectedRoute>}
        />

        {/* FULL CANDIDATE EXPORT (auth required, no sidebar) */}
        <Route
          path="/candidatos/:id/export"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading export…</div>}>
                <CandidateExport />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ADMIN (with Layout, auth required) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidatos" element={<Candidates />} />
          <Route path="/candidatos/nuevo" element={<CandidateNew />} />
          <Route path="/candidatos/:id" element={<CandidateDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route
            path="/admin/usuarios"
            element={<ProtectedRoute requireContinental><AdminUsers /></ProtectedRoute>}
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

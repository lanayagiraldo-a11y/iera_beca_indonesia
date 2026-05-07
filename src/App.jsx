import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateNew from './pages/CandidateNew'
import CandidateDetail from './pages/CandidateDetail'
import Pipeline from './pages/Pipeline'
import PublicApply from './pages/PublicApply'
import ApplicationResult from './pages/ApplicationResult'
import BiuDocument from './pages/BiuDocument'
import StudentReport from './pages/StudentReport'

export default function App() {
  return (
    <Routes>
      {/* PUBLIC LANDING (root) */}
      <Route path="/" element={<Landing />} />

      {/* PUBLIC APPLICATION */}
      <Route path="/aplicar" element={<PublicApply />} />
      <Route path="/aplicar/resultado" element={<ApplicationResult />} />

      {/* BIU DOCUMENT (no sidebar — print friendly) */}
      <Route path="/candidatos/:id/biu-document" element={<BiuDocument />} />

      {/* STUDENT MONTHLY REPORT (public, no auth) */}
      <Route path="/reportar/:candidateId" element={<StudentReport />} />

      {/* ADMIN (with Layout) */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidatos" element={<Candidates />} />
        <Route path="/candidatos/nuevo" element={<CandidateNew />} />
        <Route path="/candidatos/:id" element={<CandidateDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
      </Route>
    </Routes>
  )
}

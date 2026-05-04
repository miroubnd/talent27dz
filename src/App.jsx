import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, RoleRoute, GuestRoute } from './components/auth/ProtectedRoute'

// Public Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Job Market Pages
import JobDetails from './pages/jobs/JobDetails'

// Dashboard Pages
import CandidateDashboard from './pages/dashboard/CandidateDashboard'
import EmployerDashboard from './pages/dashboard/EmployerDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import AdminPendingJobs from './pages/dashboard/AdminPendingJobs'
import ApplicantsView from './pages/dashboard/ApplicantsView'
import PostJob from './pages/dashboard/PostJob'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } />
            
            {/* Job Marketplace (Candidate only) */}
            <Route path="/jobs" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['candidate']}>
                  <Navigate to="/dashboard/candidate" replace />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['candidate']}>
                  <JobDetails />
                </RoleRoute>
              </ProtectedRoute>
            } />

            {/* Candidate Dashboard */}
            <Route path="/dashboard/candidate" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['candidate']}>
                  <CandidateDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } />

            {/* Employer Dashboard */}
            <Route path="/dashboard/employer" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['employer']}>
                  <EmployerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/employer/applicants/:id" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['employer']}>
                  <ApplicantsView />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/post-job" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['employer']}>
                  <PostJob />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/jobs/new" element={<Navigate to="/post-job" replace />} />

            {/* Admin — pending jobs (Super Admin moderation) */}
            <Route path="/dashboard/admin/pending-jobs" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminPendingJobs />
                </RoleRoute>
              </ProtectedRoute>
            } />

            {/* Admin Dashboard */}
            <Route path="/dashboard/admin" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } />

            {/* Global Redirects */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

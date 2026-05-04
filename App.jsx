import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/user/UserDashboard'
import CreatePickup from './pages/user/CreatePickup'
import TrackPickup from './pages/user/TrackPickup'
import CollectorDashboard from './pages/collector/CollectorDashboard'
import RecyclerDashboard from './pages/recycler/RecyclerDashboard'
import AdminPanel from './pages/admin/AdminPanel'
import LoadingSpinner from './components/common/LoadingSpinner'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to={getDashboardPath(user?.role)} replace />
  return children
}

const getDashboardPath = (role) => {
  switch (role) {
    case 'admin': return '/admin'
    case 'collector': return '/collector'
    case 'recycler': return '/recycler'
    default: return '/dashboard'
  }
}

const AuthRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (isAuthenticated) return <Navigate to={getDashboardPath(user?.role)} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

      {/* User */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/create-pickup" element={<ProtectedRoute roles={['user']}><CreatePickup /></ProtectedRoute>} />
      <Route path="/track/:id" element={<ProtectedRoute roles={['user', 'collector', 'admin']}><TrackPickup /></ProtectedRoute>} />

      {/* Collector */}
      <Route path="/collector" element={<ProtectedRoute roles={['collector']}><CollectorDashboard /></ProtectedRoute>} />

      {/* Recycler */}
      <Route path="/recycler" element={<ProtectedRoute roles={['recycler']}><RecyclerDashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

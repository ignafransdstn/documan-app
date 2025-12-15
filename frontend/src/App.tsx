import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './styles/theme.css'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import Nav from './components/Nav'
import PageTransition from './components/PageTransition'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DocumentsPage from './pages/DocumentsPage'
import UsersPage from './pages/UsersPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  
  // Debug logging
  console.log('AdminRoute check - token:', !!token, 'user:', user)
  
  // If no token, redirect to login
  if (!token) {
    console.log('AdminRoute: No token, redirecting to login')
    return <Navigate to="/login" replace />
  }
  // If user data not loaded yet, show loading (don't redirect yet)
  if (!user) {
    console.log('AdminRoute: User not loaded yet, showing loading')
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa4b2' }}>Loading...</div>
  }
  // If user is not admin, redirect to dashboard
  if (user.userLevel !== 'admin') {
    console.log('AdminRoute: User level is', user.userLevel, ', redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }
  // User is admin, allow access
  console.log('AdminRoute: User is admin, allowing access')
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div id="app-root">
          <Nav />
          <main className="container">
            <PageTransition>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <AdminRoute>
                    <UsersPage />
                  </AdminRoute>
                } />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </PageTransition>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

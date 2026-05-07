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
import ProjectPage from './pages/ProjectPage'
import UsersPage from './pages/UsersPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!user) return <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa4b2' }}>Loading...</div>
  if (user.userLevel !== 'admin') return <Navigate to="/dashboard" replace />
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
                <Route path="/project" element={
                  <ProtectedRoute>
                    <ProjectPage />
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

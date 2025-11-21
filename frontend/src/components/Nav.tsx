import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Nav: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function onLogout() {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className={`nav ${!user ? 'nav-login' : ''}`}>
      <div className="brand">
        <Link to={user ? "/dashboard" : "/login"}>DocuMan</Link>
      </div>
      {user && (
        <nav className="nav-links">
          <Link 
            to="/dashboard" 
            className={isActive('/dashboard') ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link 
            to="/documents" 
            className={isActive('/documents') ? 'active' : ''}
          >
            Documents
          </Link>
          {user?.userLevel === 'admin' && (
            <Link 
              to="/users" 
              className={isActive('/users') ? 'active' : ''}
            >
              Users
            </Link>
          )}
        </nav>
      )}
      <div className="nav-actions">
        {user && (
          <>
            <span className="muted">{user.username}</span>
            <button className="btn ghost" onClick={onLogout}>Sign out</button>
          </>
        )}
      </div>
    </header>
  )
}

export default Nav

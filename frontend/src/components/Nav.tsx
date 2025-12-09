import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitcher from './LanguageSwitcher'

const Nav: React.FC = () => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
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
            {t('nav.dashboard')}
          </Link>
          <Link 
            to="/documents" 
            className={isActive('/documents') ? 'active' : ''}
          >
            {t('nav.documents')}
          </Link>
          {user?.userLevel === 'admin' && (
            <>
              <Link 
                to="/forms" 
                className={isActive('/forms') ? 'active' : ''}
              >
                {t('nav.forms') || 'Forms'}
              </Link>
              <Link 
                to="/users" 
                className={isActive('/users') ? 'active' : ''}
              >
                {t('nav.users')}
              </Link>
            </>
          )}
        </nav>
      )}
      <div className="nav-actions">
        {user && (
          <>
            <LanguageSwitcher />
            <span className="muted">{user.username}</span>
            <button className="btn ghost" onClick={onLogout}>{t('nav.signOut')}</button>
          </>
        )}
      </div>
    </header>
  )
}

export default Nav

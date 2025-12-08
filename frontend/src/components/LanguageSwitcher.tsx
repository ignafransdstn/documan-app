import React from 'react'
import { useLanguage } from '../hooks/useLanguage'

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        onClick={() => setLanguage('en')}
        style={{
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          border: language === 'en' ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.2)',
          background: language === 'en' ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
          color: language === 'en' ? '#e0d5ff' : '#9aa4b2',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: language === 'en' ? 600 : 400,
          transition: 'all 0.3s ease',
        }}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('id')}
        style={{
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          border: language === 'id' ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.2)',
          background: language === 'id' ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
          color: language === 'id' ? '#e0d5ff' : '#9aa4b2',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: language === 'id' ? 600 : 400,
          transition: 'all 0.3s ease',
        }}
        title="Indonesian"
      >
        ID
      </button>
    </div>
  )
}

export default LanguageSwitcher

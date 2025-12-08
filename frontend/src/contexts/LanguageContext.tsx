import React, { createContext, useState } from 'react'
import enTranslations from '../i18n/en.json'
import idTranslations from '../i18n/id.json'

type Language = 'en' | 'id'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface TranslationObject {
  [key: string]: string | TranslationObject
}

const translations: Record<Language, TranslationObject> = {
  en: enTranslations as TranslationObject,
  id: idTranslations as TranslationObject,
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or default to 'en'
    const saved = localStorage.getItem('language')
    return (saved as Language) || 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: TranslationObject | string = translations[language]

    for (const k of keys) {
      if (typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export { LanguageContext }

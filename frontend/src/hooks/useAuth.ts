import { useContext } from 'react'
import type { AuthContextType } from '../contexts/AuthContext'
import { AuthContext } from '../contexts/AuthContext'

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext) as AuthContextType | undefined
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

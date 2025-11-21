import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as api from '../api'
import type { ApiUser } from '../api'
import extractErrorMessage from '../utils/extractErrorMessage'

const UsersPage: React.FC = () => {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState<number | null>(null)
  const [changingLevel, setChangingLevel] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [resettingId, setResettingId] = useState<number | null>(null)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'level1' | 'level2' | 'level3'>('all')

  useEffect(() => {
    async function load() {
      if (!token) return
      setLoading(true)
      try {
        const res = await api.getUsers(token)
        setUsers(res)
      } catch (e: unknown) {
        console.error(extractErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (!user || user.userLevel !== 'admin') {
    return <div className="card"><h3>Not authorized</h3><p>Only admin can access user management</p></div>
  }

  // Calculate statistics
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive !== false).length
  const inactiveUsers = users.filter(u => u.isActive === false).length
  const adminUsers = users.filter(u => u.userLevel === 'admin').length

  // Filter users based on search and role filter
  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery.trim() === '' || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || u.userLevel === roleFilter
    
    return matchesSearch && matchesRole
  })

  return (
    <div className="users-page-container">
      <div className="users-header">
        <div>
          <h1 className="users-main-title">Manajemen Pengguna</h1>
          <p className="users-subtitle">Kelola pengguna dan hak akses sistem</p>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Pengguna</div>
            <div className="stat-value">{totalUsers}</div>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 11l-3 3-2-2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Pengguna Aktif</div>
            <div className="stat-value">{activeUsers}</div>
          </div>
        </div>

        <div className="stat-card admin">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15a6 6 0 100-12 6 6 0 000 12z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15v7M9 22h6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Administrator</div>
            <div className="stat-value">{adminUsers}</div>
          </div>
        </div>

        <div className="stat-card inactive">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 9L12 9M12 9l3-3M12 9l3 3" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Tidak Aktif</div>
            <div className="stat-value">{inactiveUsers}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Daftar Pengguna ({filteredUsers.length})</h3>
        <div className="user-filters">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input 
            type="text" 
            className="search-input"
            placeholder="Cari pengguna berdasarkan nama, username, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">Semua Role</option>
          <option value="admin">Admin / Super Admin</option>
          <option value="level1">Level 1</option>
          <option value="level2">Level 2</option>
          <option value="level3">Level 3</option>
        </select>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="list">
          {filteredUsers.map(u => {
            const created = (u as unknown as Record<string, string | undefined>).createdAt ? new Date((u as unknown as Record<string, string | undefined>).createdAt as string).toLocaleString('id-ID', {day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'}) : ''
            const last = (u as unknown as Record<string, string | undefined>).lastLogin ? new Date((u as unknown as Record<string, string | undefined>).lastLogin as string).toLocaleString('id-ID', {day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'}) : ''
            return (
            <div key={u.id} className="list-item user-row">
              <div className="user-left">
                <div className="avatar" aria-hidden>{(u.username || u.email || 'U')[0].toUpperCase()}</div>
                <div className="user-info">
                  <div className="user-top">
                    <strong className="user-name warm">{u.username}{u.isApproved === false && <span className="muted"> (pending)</span>}</strong>
                    <div className="badges">
                      <span className={`badge role ${u.userLevel}`}>{u.userLevel === 'admin' ? 'Administrator' : u.userLevel.replace(/level/, 'User Level ')}</span>
                      <span className={`badge status ${u.isActive === false ? 'inactive' : 'active'}`}>{u.isActive === false ? 'Tidak Aktif' : 'Aktif'}</span>
                    </div>
                  </div>
                  <div className="muted user-meta">{u.email}{created ? ` • Dibuat: ${created}` : ''}{last ? ` • Login terakhir: ${last}` : ''}</div>
                </div>
              </div>
              <div className="user-actions">
                {u.isApproved === false && u.userLevel === 'admin' && (
                  <button title="Approve admin" className="action-icon" disabled={approving === u.id} onClick={async () => {
                    setApproving(u.id)
                    try {
                      await api.approveUser(u.id, token || undefined)
                      const refreshed = await api.getUsers(token || undefined)
                      setUsers(refreshed)
                    } catch (e: unknown) {
                      console.error(extractErrorMessage(e))
                    } finally {
                      setApproving(null)
                    }
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11l3 3L22 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}

                {u.userLevel !== 'admin' && (
                  <select className="select-level" defaultValue={u.userLevel} disabled={changingLevel === u.id} onChange={(e) => {
                    const newLevel = e.target.value as ApiUser['userLevel']
                    if (!confirm(`Change ${u.username} level to ${newLevel}?`)) return
                    ;(async () => {
                      setChangingLevel(u.id)
                      try {
                        await api.updateUser(u.id, { userLevel: newLevel }, token || undefined)
                        const refreshed = await api.getUsers(token || undefined)
                        setUsers(refreshed)
                      } catch (err: unknown) {
                        console.error(extractErrorMessage(err))
                      } finally {
                        setChangingLevel(null)
                      }
                    })()
                  }}>
                    <option value="level1">Level 1</option>
                    <option value="level2">Level 2</option>
                    <option value="level3">Level 3</option>
                  </select>
                )}

                {u.userLevel !== 'admin' && (
                  <button className="action-icon danger" title="Delete user" disabled={deletingId === u.id} onClick={async () => {
                    if (u.id === user.id) { alert('You cannot delete your own account'); return }
                    if (!confirm(`Delete user ${u.username}? This action cannot be undone.`)) return
                    setDeletingId(u.id)
                    try {
                      await api.deleteUser(u.id, token || undefined)
                      const refreshed = await api.getUsers(token || undefined)
                      setUsers(refreshed)
                    } catch (err: unknown) {
                      console.error(extractErrorMessage(err))
                    } finally {
                      setDeletingId(null)
                    }
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v6" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}

                {u.userLevel !== 'admin' && (
                  <button className="action-icon" title={u.isActive === false ? 'Activate user' : 'Deactivate user'} disabled={activatingId === u.id} onClick={async () => {
                    // toggle active state for non-admin users
                    const targetState = u.isActive === false // Will activate if currently inactive
                    if (!confirm(`${targetState ? 'Activate' : 'Deactivate'} user ${u.username}?`)) return
                    setActivatingId(u.id)
                    try {
                      await api.setUserActive(u.id, targetState, token || undefined)
                      const refreshed = await api.getUsers(token || undefined)
                      setUsers(refreshed)
                      alert(`${u.username} has been ${targetState ? 'activated' : 'deactivated'}`)
                    } catch (err: unknown) {
                      console.error(extractErrorMessage(err))
                      alert(`Failed to ${targetState ? 'activate' : 'deactivate'} ${u.username}: ${extractErrorMessage(err)}`)
                    } finally {
                      setActivatingId(null)
                    }
                  }}>
                    {u.isActive === false ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12a9 9 0 0118 0" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5v7" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </button>
                )}

                {u.userLevel !== 'admin' && (
                  <button className="action-icon" title="Reset password" disabled={resettingId === u.id} onClick={async () => {
                    if (u.id === user.id) { alert('Use your profile to change your password'); return }
                    const np = prompt(`Enter a new password for ${u.username}:`)
                    if (!np) return
                    if (np.length < 8) { alert('Password must be at least 8 characters'); return }
                    setResettingId(u.id)
                    try {
                      await api.resetUserPassword(u.id, np, token || undefined)
                      alert('Password reset successfully')
                    } catch (err: unknown) {
                      console.error(extractErrorMessage(err))
                      alert(`Failed to reset password: ${extractErrorMessage(err)}`)
                    } finally {
                      setResettingId(null)
                    }
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12v-2a8 8 0 10-4.9 7.4" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 8v6h-6" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
            </div>
          )
        })}
        </div>
      )}
      </div>
    </div>
  )
}

export default UsersPage

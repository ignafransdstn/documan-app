import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as api from '../api'
import { useEffect, useState } from 'react'
import type { Summary, ActivityLog } from '../api'
import extractErrorMessage from '../utils/extractErrorMessage'

const Dashboard: React.FC = () => {
  const { user, token } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [filterDate, setFilterDate] = useState<string>('')

  useEffect(() => {
    async function loadSummary() {
      if (!user || !token) return
      // Semua user bisa akses summary untuk melihat jumlah dokumen
      try {
        const res = await api.getSummary(token)
        setSummary(res)
      } catch (e: unknown) {
        console.error(extractErrorMessage(e))
      }
    }

    async function loadActivityLogs() {
      if (!user || !token) return
      try {
        const res = await api.getActivityLogs(token, 10, 0)
        setActivityLogs(res.logs)
      } catch (e: unknown) {
        console.error(extractErrorMessage(e))
      }
    }

    loadSummary()
    loadActivityLogs()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      loadSummary()
      loadActivityLogs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, token])

  // Filter logs berdasarkan tanggal yang dipilih
  const filteredLogs = filterDate 
    ? activityLogs.filter(log => {
        const logDate = new Date(log.createdAt).toLocaleDateString('en-CA') // Format: YYYY-MM-DD
        return logDate === filterDate
      })
    : activityLogs

  const totalDocs = (summary?.totalDocuments || 0)
  const masterDocs = (summary?.totalMasterDocuments || 0)
  const subDocs = (summary?.totalSubDocuments || 0)
  const activeSessions = (summary?.activeSessions || 0)

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h1 className="dashboard-title">Selamat Datang, {user?.username || 'User'}!</h1>
          <p className="dashboard-subtitle">
            Anda masuk sebagai {user?.userLevel === 'admin' ? 'Administrator' : `User ${user?.userLevel}`} • Terakhir login: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={`dashboard-stats ${user?.userLevel !== 'admin' ? 'three-cards' : ''}`}>
        <div className="dash-stat-card total">
          <div className="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-label">Total Dokumen</div>
            <div className="dash-stat-value">{totalDocs}</div>
          </div>
        </div>

        <div className="dash-stat-card master">
          <div className="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-label">Dokumen Master</div>
            <div className="dash-stat-value">{masterDocs}</div>
          </div>
        </div>

        <div className="dash-stat-card sub">
          <div className="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-label">Sub Dokumen</div>
            <div className="dash-stat-value">{subDocs}</div>
          </div>
        </div>

        {/* Card Sesi Aktif - Hanya untuk Admin */}
        {user?.userLevel === 'admin' && (
          <div className="dash-stat-card active">
            <div className="dash-stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-label">Sesi Aktif</div>
              <div className="dash-stat-value">{activeSessions}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions and Activity */}
      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: '1 / 2' }}>
          <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Aksi Cepat
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/documents" className="quick-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Upload Dokumen Baru</span>
            </Link>
            <Link to="/documents" className="quick-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Review Dokumen</span>
            </Link>
            {user?.userLevel === 'admin' && (
              <Link to="/users" className="quick-action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Kelola Pengguna</span>
              </Link>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '2 / 3' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Aktivitas Terbaru
            </h3>
            {/* Filter Tanggal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  padding: '0.375rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e5e7eb',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  style={{
                    padding: '0.375rem 0.625rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  title="Reset filter"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="activity-list">
            {filteredLogs.length === 0 ? (
              <div className="activity-item" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <div className="activity-dot" style={{ background: '#6b7280' }}></div>
                <div>
                  <div className="activity-desc">
                    {filterDate ? 'Tidak ada aktivitas pada tanggal ini' : 'Tidak ada aktivitas terbaru'}
                  </div>
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                // Color based on action type
                const actionColors: Record<string, string> = {
                  LOGIN: '#3b82f6',
                  LOGOUT: '#6b7280',
                  CREATE: '#22c55e',
                  UPDATE: '#f59e0b',
                  DELETE: '#ef4444',
                  VIEW: '#8b5cf6',
                  DOWNLOAD: '#06b6d4'
                }
                
                // Format timestamp
                const date = new Date(log.createdAt)
                const now = new Date()
                const diffMs = now.getTime() - date.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMins / 60)
                const diffDays = Math.floor(diffHours / 24)
                
                let timeText = ''
                if (diffMins < 1) timeText = 'Baru saja'
                else if (diffMins < 60) timeText = `${diffMins} menit yang lalu`
                else if (diffHours < 24) timeText = `${diffHours} jam yang lalu`
                else if (diffDays === 1) timeText = 'Kemarin'
                else timeText = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                
                return (
                  <div key={log.id} className="activity-item">
                    <div className="activity-dot" style={{ background: actionColors[log.action] || '#6b7280' }}></div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div className="activity-title">
                        {user?.userLevel === 'admin' && log.user ? `${log.user.username} • ` : ''}{log.action}
                      </div>
                      <div className="activity-desc">{log.description}</div>
                      <div className="activity-time">{timeText}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

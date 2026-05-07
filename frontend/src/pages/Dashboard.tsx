import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import * as api from '../api'
import { useEffect, useState, useMemo } from 'react'
import type { Summary, ActivityLog } from '../api'
import extractErrorMessage from '../utils/extractErrorMessage'
import * as XLSX from '@e965/xlsx'

// Simple inline donut chart using SVG
const DonutChart: React.FC<{ active: number; archived: number; expired: number }> = ({ active, archived, expired }) => {
  const total = active + archived + expired
  if (total === 0) return <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>No data</div>

  const r = 52
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r

  const activeRatio = active / total
  const archivedRatio = archived / total
  const expiredRatio = expired / total

  // Offset: start from top (-90deg = -circumference/4)
  const activeLen = activeRatio * circumference
  const archivedLen = archivedRatio * circumference
  const expiredLen = expiredRatio * circumference

  const activeOffset = -circumference / 4
  const archivedOffset = activeOffset - activeLen
  const expiredOffset = archivedOffset - archivedLen

  const segments = [
    { len: activeLen, offset: activeOffset, color: '#22c55e', label: 'Active', value: active },
    { len: archivedLen, offset: archivedOffset, color: '#f59e0b', label: 'Archived', value: archived },
    { len: expiredLen, offset: expiredOffset, color: '#ef4444', label: 'Expired', value: expired },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
        {segments.map((s, i) => (
          s.len > 0 && (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${s.len} ${circumference - s.len}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          )
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#9aa4b2" fontSize="10">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: '#9aa4b2' }}>{s.label}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginLeft: 'auto', paddingLeft: '0.75rem' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [filterDate, setFilterDate] = useState<string>('')
  const [showExport, setShowExport] = useState(false)
  const [exportFrom, setExportFrom] = useState<string>('')
  const [exportTo, setExportTo] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function loadSummary() {
      if (!user || !token) return
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

    const interval = setInterval(() => {
      loadSummary()
      loadActivityLogs()
    }, 30000)

    return () => clearInterval(interval)
  }, [user, token])

  const filteredLogs = filterDate
    ? activityLogs.filter(log => {
        const logDate = new Date(log.createdAt).toLocaleDateString('en-CA')
        return logDate === filterDate
      })
    : activityLogs

  const handleExportExcel = async () => {
    if (!token) return
    setExporting(true)
    try {
      const res = await api.exportActivityLogs(token, exportFrom || undefined, exportTo || undefined)
      const rows = res.logs.map((log: ActivityLog) => ({
        'Username': log.user?.username || '-',
        'User Level': log.user?.userLevel || '-',
        'Action': log.action,
        'Description': log.description,
        'Timestamp': new Date(log.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }),
        'IP Address': log.ipAddress || '-',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 60 }, { wch: 24 }, { wch: 18 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activity Log')

      const fromLabel = exportFrom || 'all'
      const toLabel = exportTo || 'now'
      XLSX.writeFile(wb, `activity-log_${fromLabel}_${toLabel}.xlsx`)

      setShowExport(false)
    } catch (e) {
      console.error(extractErrorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  const totalDocs = summary?.totalDocuments || 0
  const masterDocs = summary?.totalMasterDocuments || 0
  const subDocs = summary?.totalSubDocuments || 0
  const activeSessions = summary?.activeSessions || 0
  const statusBreakdown = summary?.statusBreakdown
  const expiringDocs = summary?.expiringDocuments || []
  const visibleYearAheadDocs = useMemo(() => {
    const yearAheadDocs = summary?.yearAheadNotifications || []
    if (!yearAheadDocs.length) return []
    const nowDay = new Date()
    nowDay.setHours(0, 0, 0, 0)
    return yearAheadDocs.filter(doc => {
      const expiry = new Date(doc.expiredDate)
      expiry.setHours(0, 0, 0, 0)
      const diff = Math.round((expiry.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24))
      return diff >= 363 && diff <= 365
    })
  }, [summary?.yearAheadNotifications])

  // Dynamic animation duration: longer content scrolls slower
  const tickerDuration = Math.max(20, visibleYearAheadDocs.length * 9)

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h1 className="dashboard-title">{t('dashboard.welcome')}, {user?.username || 'User'}!</h1>
          <p className="dashboard-subtitle">
            {t('dashboard.loggedAs')} {user?.userLevel === 'admin' ? t('dashboard.administrator') : `User ${user?.userLevel}`} • {t('dashboard.lastLogin')}: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
            <div className="dash-stat-label">{t('dashboard.totalDocuments')}</div>
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
            <div className="dash-stat-label">{t('dashboard.masterDocuments')}</div>
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
            <div className="dash-stat-label">{t('dashboard.subDocuments')}</div>
            <div className="dash-stat-value">{subDocs}</div>
          </div>
        </div>

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
              <div className="dash-stat-label">{t('dashboard.activeSessions')}</div>
              <div className="dash-stat-value">{activeSessions}</div>
            </div>
          </div>
        )}
      </div>

      {/* Year-Ahead Notification Ticker Banner */}
      {visibleYearAheadDocs.length > 0 && (
        <div className="notif-ticker-wrap">
          <div className="notif-ticker-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('dashboard.yearAheadLabel')}
          </div>
          <div className="notif-ticker-track">
            <div
              className="notif-ticker-content"
              style={{ animationDuration: `${tickerDuration}s` }}
            >
              {/* Duplicate items for seamless loop */}
              {[...visibleYearAheadDocs, ...visibleYearAheadDocs].map((doc, idx) => {
                const expiry = new Date(doc.expiredDate)
                expiry.setHours(0, 0, 0, 0)
                const nowDay = new Date()
                nowDay.setHours(0, 0, 0, 0)
                const diff = Math.round((expiry.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <span key={`${doc.docType}-${doc.id}-${idx}`} className="notif-ticker-item">
                    <span className="notif-ticker-item-badge">H-{diff}</span>
                    <span className="notif-ticker-item-title">{doc.title}</span>
                    <span className="notif-ticker-item-date">
                      · {new Date(doc.expiredDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Chart + Expiring Docs */}
      <div className="dashboard-row2">
        {/* Donut Chart - Status Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            {t('dashboard.statusDistribution')}
          </h3>
          {statusBreakdown ? (
            <DonutChart
              active={statusBreakdown.active}
              archived={statusBreakdown.archived}
              expired={statusBreakdown.expired}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>{t('buttons.loading')}</div>
          )}
          {/* Status badges row */}
          {statusBreakdown && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(34,197,94,0.3)' }}>
                ✓ Active: {statusBreakdown.active}
              </span>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(245,158,11,0.3)' }}>
                📦 Archived: {statusBreakdown.archived}
              </span>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠ Expired: {statusBreakdown.expired}
              </span>
            </div>
          )}
        </div>

        {/* Expiry Watch */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#f59e0b" strokeWidth="2"/></svg>
            {t('dashboard.expiringDocuments')}
            {expiringDocs.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '12px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                {expiringDocs.length}
              </span>
            )}
          </h3>

          {/* Legend */}
          {expiringDocs.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {[
                { label: 'H+1–H+3', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
                { label: 'H-7', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
                { label: 'H-15', color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)' },
                { label: 'H-30', color: '#84cc16', bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.25)' },
              ].map(leg => (
                <span key={leg.label} style={{ fontSize: '0.68rem', fontWeight: 700, color: leg.color, background: leg.bg, border: `1px solid ${leg.border}`, borderRadius: '4px', padding: '0.1rem 0.4rem' }}>{leg.label}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '230px', overflowY: 'auto' }}>
            {expiringDocs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0', fontSize: '0.9rem' }}>
                ✅ {t('dashboard.noExpiringDocuments')}
              </div>
            ) : (
              expiringDocs.map((doc) => {
                const expiry = new Date(doc.expiredDate)
                expiry.setHours(0, 0, 0, 0)
                const nowDay = new Date()
                nowDay.setHours(0, 0, 0, 0)
                const diff = Math.round((expiry.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24))

                // Badge config per range
                let badge: { text: string; color: string; bg: string; border: string; rowBorder: string }
                if (diff < 0) {
                  // H+1 to H+3: recently expired
                  badge = { text: `H+${Math.abs(diff)}`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', rowBorder: 'rgba(239,68,68,0.2)' }
                } else if (diff === 0) {
                  badge = { text: 'H-0', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', rowBorder: 'rgba(239,68,68,0.25)' }
                } else if (diff <= 7) {
                  badge = { text: `H-${diff}`, color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', rowBorder: 'rgba(249,115,22,0.18)' }
                } else if (diff <= 15) {
                  badge = { text: `H-${diff}`, color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)', rowBorder: 'rgba(234,179,8,0.15)' }
                } else {
                  badge = { text: `H-${diff}`, color: '#84cc16', bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.3)', rowBorder: 'rgba(132,204,22,0.12)' }
                }

                return (
                  <div key={`${doc.docType}-${doc.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${badge.rowBorder}`,
                    gap: '0.6rem'
                  }}>
                    {/* H-N / H+N badge */}
                    <div style={{
                      flexShrink: 0,
                      minWidth: '42px',
                      textAlign: 'center',
                      padding: '0.2rem 0.35rem',
                      borderRadius: '5px',
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: badge.color,
                      letterSpacing: '0.01em',
                      fontFamily: 'monospace'
                    }}>
                      {badge.text}
                    </div>

                    {/* Doc info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9aa4b2', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                        <span style={{ padding: '0.05rem 0.35rem', borderRadius: '3px', background: doc.docType === 'sub' ? 'rgba(168,85,247,0.12)' : 'rgba(59,130,246,0.12)', color: doc.docType === 'sub' ? '#a855f7' : '#60a5fa', fontSize: '0.65rem', fontWeight: 700 }}>
                          {doc.docType === 'sub' ? 'Sub' : 'Master'}
                        </span>
                        {doc.location && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.location}</span>}
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: badge.color, fontWeight: 600 }}>
                        {new Date(doc.expiredDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {expiringDocs.length > 0 && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <Link to="/documents" style={{ fontSize: '0.8rem', color: '#60a5fa', textDecoration: 'none' }}>
                {t('dashboard.viewAllDocuments')} &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Quick Actions + Activity */}
      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('dashboard.quickActions')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/documents" className="quick-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('dashboard.uploadNewDocument')}</span>
            </Link>
            <Link to="/documents" className="quick-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('dashboard.reviewDocuments')}</span>
            </Link>
            {user?.userLevel === 'admin' && (
              <Link to="/users" className="quick-action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('dashboard.manageUsers')}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('dashboard.recentActivity')}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <button
                onClick={() => setShowExport(v => !v)}
                style={{
                  padding: '0.375rem 0.625rem',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: showExport ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.07)',
                  color: '#22c55e',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap'
                }}
                title={t('dashboard.exportExcel')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill="currentColor"/>
                  <path d="M4 18h16v2H4v-2z" fill="currentColor"/>
                </svg>
                {t('dashboard.exportExcel')}
              </button>
            </div>
          </div>

          {showExport && (
            <div style={{
              marginBottom: '0.75rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(34,197,94,0.05)',
              border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: '0.625rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9aa4b2', fontWeight: 600 }}>{t('dashboard.exportFrom')}</label>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={e => setExportFrom(e.target.value)}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '0.35rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e5e7eb',
                    fontSize: '0.82rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9aa4b2', fontWeight: 600 }}>{t('dashboard.exportTo')}</label>
                <input
                  type="date"
                  value={exportTo}
                  onChange={e => setExportTo(e.target.value)}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '0.35rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e5e7eb',
                    fontSize: '0.82rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '0.35rem',
                  border: 'none',
                  background: exporting ? 'rgba(34,197,94,0.3)' : '#22c55e',
                  color: '#0f172a',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {exporting ? '...' : '\u2B07 ' + t('dashboard.downloadExcel')}
              </button>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', alignSelf: 'center' }}>
                {!exportFrom && !exportTo ? t('dashboard.exportAllHint') : ''}
              </span>
            </div>
          )}

          <div className="activity-list">
            {filteredLogs.length === 0 ? (
              <div className="activity-item" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <div className="activity-dot" style={{ background: '#6b7280' }}></div>
                <div>
                  <div className="activity-desc">
                    {filterDate ? t('dashboard.noActivityOnDate') : t('dashboard.noRecentActivity')}
                  </div>
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const actionColors: Record<string, string> = {
                  LOGIN: '#3b82f6',
                  LOGOUT: '#6b7280',
                  CREATE: '#22c55e',
                  UPDATE: '#f59e0b',
                  DELETE: '#ef4444',
                  VIEW: '#8b5cf6',
                  DOWNLOAD: '#06b6d4',
                  UPLOAD: '#0891b2'
                }

                const date = new Date(log.createdAt)
                const now = new Date()
                const diffMs = now.getTime() - date.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMins / 60)
                const diffDays = Math.floor(diffHours / 24)

                let timeText = ''
                if (diffMins < 1) timeText = t('dashboard.justNow')
                else if (diffMins < 60) timeText = `${diffMins} ${t('dashboard.minutesAgo')}`
                else if (diffHours < 24) timeText = `${diffHours} ${t('dashboard.hoursAgo')}`
                else if (diffDays === 1) timeText = t('dashboard.yesterday')
                else timeText = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

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

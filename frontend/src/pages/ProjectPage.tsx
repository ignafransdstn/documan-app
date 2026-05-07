import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useAuth } from '../hooks/useAuth'
import {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  linkDocumentToProject, unlinkDocumentFromProject,
  uploadProjectSupportingDoc, downloadProjectSupportingDoc, deleteProjectSupportingDoc,
  getDocuments, getProjectReport
} from '../api'
import type { ApiProject, ApiProjectDocument, ApiProjectSupportingDocument, ProjectStatus, ProjectType, ProjectInstitution } from '../api'
import { generateProjectPDF } from '../utils/projectPdfReport'

// ---- helpers ----
function formatBytes(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function daysDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function durationLabel(project: ApiProject, t: (k: string) => string) {
  const today = new Date().toISOString().slice(0, 10)
  if (project.actualEndDate) {
    const closed = daysDiff(project.startDate, project.actualEndDate)
    return `${closed} ${t('project.daysElapsed')}`
  }
  const elapsed = daysDiff(project.startDate, today)
  if (project.estimatedEndDate && today > project.estimatedEndDate) {
    const overdue = daysDiff(project.estimatedEndDate, today)
    return { label: `${overdue} ${t('project.daysOverdue')}`, overdue: true }
  }
  if (project.estimatedEndDate) {
    const remaining = daysDiff(today, project.estimatedEndDate)
    return `${elapsed} ${t('project.daysElapsed')} · ${remaining} ${t('project.daysRemaining')}`
  }
  return `${elapsed} ${t('project.daysElapsed')}`
}

function statusBadgeStyle(status: ProjectStatus): React.CSSProperties {
  const map: Record<ProjectStatus, string> = { active: '#16a34a', closed: '#6b7280', on_hold: '#d97706' }
  return { background: map[status], color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }
}
function typeBadgeStyle(type: ProjectType): React.CSSProperties {
  return { background: type === 'dispute' ? '#7c3aed' : '#0891b2', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }
}

const INSTITUTIONS: ProjectInstitution[] = ['POLSEK', 'POLRES', 'POLDA', 'KEJATI', 'KEJARI', 'KEJAGUNG', 'MA', 'MK', 'OTHERS']

// ---- sub-components ----

interface ProjectFormProps {
  initial?: Partial<ApiProject>
  onSave: (data: Partial<ApiProject>) => Promise<void>
  onCancel: () => void
  onTypeChange?: (type: ProjectType) => void
  t: (k: string) => string
}
function ProjectForm({ initial, onSave, onCancel, onTypeChange, t }: ProjectFormProps) {
  const [form, setForm] = useState<Partial<ApiProject>>({
    type: 'project', name: '', number: '', description: '', status: 'active',
    institution: undefined, institutionDetail: '', startDate: '', estimatedEndDate: '', actualEndDate: '',
    ...initial
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof ApiProject, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type || !form.name?.trim() || !form.number?.trim() || !form.startDate) {
      setError('type, name, number, startDate are required'); return
    }
    if (form.type === 'dispute' && !form.institution) {
      setError('institution is required for dispute cases'); return
    }
    setSaving(true)
    try {
      await onSave({
        ...form,
        institution: form.type === 'dispute' ? form.institution : undefined,
        institutionDetail: form.type === 'dispute' && form.institution === 'OTHERS' ? form.institutionDetail : undefined,
        estimatedEndDate: form.estimatedEndDate || undefined,
        actualEndDate: form.actualEndDate || undefined
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}

      <div className="form-grid-2">
        <label>
          {t('project.typeLabel')} *
          <select value={form.type} onChange={e => { const v = e.target.value as ProjectType; set('type', v); onTypeChange?.(v) }}>
            <option value="project">{t('project.typeProject')}</option>
            <option value="dispute">{t('project.typeDispute')}</option>
          </select>
        </label>
        <label>
          Status *
          <select value={form.status} onChange={e => set('status', e.target.value as ProjectStatus)}>
            <option value="active">{t('project.statusActive')}</option>
            <option value="on_hold">{t('project.statusOnHold')}</option>
            <option value="closed">{t('project.statusClosed')}</option>
          </select>
        </label>
      </div>

      <label>
        {t('project.nameLabel')} *
        <input value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder={t('project.namePlaceholder')} required />
      </label>

      <label>
        {t('project.numberLabel')} *
        <input value={form.number ?? ''} onChange={e => set('number', e.target.value)} placeholder={form.type === 'dispute' ? t('project.numberDisputePlaceholder') : t('project.numberProjectPlaceholder')} required />
      </label>

      {form.type === 'dispute' && (
        <div className="form-grid-2">
          <label>
            {t('project.institutionLabel')} *
            <select value={form.institution ?? ''} onChange={e => set('institution', e.target.value as ProjectInstitution)}>
              <option value="">{t('project.selectInstitution')}</option>
              {INSTITUTIONS.map(i => <option key={i} value={i}>{t(`project.institution${i.charAt(0)}${i.slice(1).toLowerCase()}`) || i}</option>)}
            </select>
          </label>
          {form.institution === 'OTHERS' && (
            <label>
              {t('project.institutionDetailLabel')}
              <input value={form.institutionDetail ?? ''} onChange={e => set('institutionDetail', e.target.value)} />
            </label>
          )}
        </div>
      )}

      <div className="form-grid-3">
        <label>
          {t('project.startDateLabel')} *
          <input type="date" value={form.startDate ?? ''} onChange={e => set('startDate', e.target.value)} required />
        </label>
        <label>
          {t('project.estimatedEndDateLabel')}
          <input type="date" value={form.estimatedEndDate ?? ''} onChange={e => set('estimatedEndDate', e.target.value)} />
        </label>
        <label>
          {t('project.actualEndDateLabel')}
          <input type="date" value={form.actualEndDate ?? ''} onChange={e => set('actualEndDate', e.target.value)} />
          <small style={{ color: 'var(--muted)' }}>{t('project.actualEndDateNote')}</small>
        </label>
      </div>

      <label>
        {t('project.descriptionLabel')}
        <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder={t('project.descriptionPlaceholder')} rows={3} style={{ resize: 'vertical' }} />
      </label>

      <div className="modal-actions">
        <button type="button" onClick={onCancel} className="btn ghost">{t('buttons.cancel')}</button>
        <button type="submit" disabled={saving} className="btn primary">
          {saving ? t('buttons.loading') : t('buttons.save')}
        </button>
      </div>
    </form>
  )
}

// ---- Main Page ----

const ProjectPage: React.FC = () => {
  const { t } = useLanguage()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.userLevel === 'admin'

  const [projects, setProjects] = useState<ApiProject[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  const [createModal, setCreateModal] = useState<{ open: boolean; defaultType?: ProjectType }>({ open: false })
  const [editModal, setEditModal] = useState<{ open: boolean; project?: ApiProject }>({ open: false })
  const [detailProject, setDetailProject] = useState<ApiProject | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ApiProject | null>(null)
  const [actionError, setActionError] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')

  // For document linking
  const [allDocuments, setAllDocuments] = useState<{ id: number; title: string; type: 'master' | 'sub'; subDocumentNo?: string }[]>([])
  const [linkDocType, setLinkDocType] = useState<'master' | 'sub'>('master')
  const [linkDocId, setLinkDocId] = useState<number | ''>('')
  const [linkingDoc, setLinkingDoc] = useState(false)
  const [linkPending, setLinkPending] = useState<{ id: number; title: string; type: 'master' | 'sub' } | null>(null)

  // Supporting doc upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  async function openDetail(project: ApiProject) {
    setDetailProject(project) // show drawer immediately with basic info
    setDetailLoading(true)
    try {
      const full = await getProjectById(project.id, token!)
      setDetailProject(full)
    } catch {
      // keep basic info if fetch fails
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleExportPdf(dateFrom?: string, dateTo?: string) {
    if (!token) return
    setShowReportModal(false)
    setExportingPdf(true)
    try {
      const reportData = await getProjectReport(token, dateFrom || undefined, dateTo || undefined)
      await generateProjectPDF(reportData)
    } catch (e) {
      console.error('PDF export failed', e)
    } finally {
      setExportingPdf(false)
    }
  }

  const loadProjects = useCallback(async (pg = page) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await getProjects(token, { page: pg, limit: 20, type: typeFilter || undefined, status: statusFilter || undefined, search: search || undefined })
      setProjects(res.projects)
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [token, page, typeFilter, statusFilter, search])

  useEffect(() => { loadProjects(1); setPage(1) }, [typeFilter, statusFilter]) // eslint-disable-line
  useEffect(() => { loadProjects(page) }, [page]) // eslint-disable-line

  useEffect(() => {
    if (!token) return
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { loadProjects(1); setPage(1) }, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [search]) // eslint-disable-line

  // Load all docs for link picker
  useEffect(() => {
    if (!token || !detailProject) return
    getDocuments(token).then(docs => {
      const flat: typeof allDocuments = []
      docs.forEach(d => {
        flat.push({ id: d.id, title: d.title, type: 'master' })
        d.subDocuments?.forEach(s => flat.push({ id: s.id, title: `↳ ${s.title}`, type: 'sub', subDocumentNo: s.subDocumentNo }))
      })
      setAllDocuments(flat)
    }).catch(() => {})
  }, [token, detailProject]) // eslint-disable-line

  async function handleCreate(data: Partial<ApiProject>) {
    if (!token) return
    await createProject({ ...data, type: createModal.defaultType || data.type }, token)
    setCreateModal({ open: false })
    loadProjects(1); setPage(1)
  }

  async function handleEdit(data: Partial<ApiProject>) {
    if (!token || !editModal.project) return
    await updateProject(editModal.project.id, data, token)
    setEditModal({ open: false })
    if (detailProject?.id === editModal.project.id) {
      const updated = await getProjectById(editModal.project.id, token)
      setDetailProject(updated)
    }
    loadProjects(page)
  }

  async function handleDelete() {
    if (!token || !deleteConfirm) return
    try {
      await deleteProject(deleteConfirm.id, token)
      setDeleteConfirm(null)
      if (detailProject?.id === deleteConfirm.id) setDetailProject(null)
      loadProjects(page)
    } catch {
      setActionError('Delete failed')
    }
  }

  async function handleLinkDoc() {
    if (!token || !detailProject || !linkDocId) return
    setLinkingDoc(true)
    try {
      const payload = linkDocType === 'master'
        ? { documentId: Number(linkDocId), documentType: 'master' as const }
        : { subDocumentId: Number(linkDocId), documentType: 'sub' as const }
      await linkDocumentToProject(detailProject.id, payload, token)
      const updated = await getProjectById(detailProject.id, token)
      setDetailProject(updated)
      setLinkDocId('')
      setLinkPending(null)
    } catch (err: unknown) {
      const e = err as { body?: { message?: string } }
      setActionError(e?.body?.message || 'Failed to link document')
    } finally {
      setLinkingDoc(false)
    }
  }

  async function handleUnlinkDoc(link: ApiProjectDocument) {
    if (!token || !detailProject) return
    try {
      await unlinkDocumentFromProject(detailProject.id, link.id, token)
      const updated = await getProjectById(detailProject.id, token)
      setDetailProject(updated)
    } catch {
      setActionError('Failed to unlink document')
    }
  }

  async function handleSupportingUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !detailProject || !e.target.files?.[0]) return
    setUploadingFile(true)
    try {
      await uploadProjectSupportingDoc(detailProject.id, e.target.files[0], token)
      const updated = await getProjectById(detailProject.id, token)
      setDetailProject(updated)
    } catch {
      setActionError('Upload failed')
    } finally {
      setUploadingFile(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSupportingDownload(doc: ApiProjectSupportingDocument) {
    if (!token || !detailProject) return
    await downloadProjectSupportingDoc(detailProject.id, doc.id, token, doc.originalName)
  }

  async function handleSupportingDelete(doc: ApiProjectSupportingDocument) {
    if (!token || !detailProject) return
    try {
      await deleteProjectSupportingDoc(detailProject.id, doc.id, token)
      const updated = await getProjectById(detailProject.id, token)
      setDetailProject(updated)
    } catch {
      setActionError('Delete failed')
    }
  }

  // Duration display
  function renderDuration(project: ApiProject) {
    const result = durationLabel(project, t)
    if (typeof result === 'object' && 'overdue' in result) {
      return <span style={{ color: '#dc2626', fontWeight: 600 }}>{result.label}</span>
    }
    return <span>{result as string}</span>
  }

  // Get available docs for link picker (filter already linked)
  const linkedIds = detailProject?.linkedDocuments?.map(l => ({ type: l.documentType, id: l.documentId ?? l.subDocumentId })) || []
  const availableDocs = allDocuments.filter(d => !linkedIds.some(l => l.type === d.type && l.id === d.id)).filter(d => d.type === linkDocType)

  return (
    <div className="project-page-container">
      {/* Header */}
      <div className="project-header">
        <h1 className="project-main-title">{t('project.pageTitle')}</h1>
        <p className="project-subtitle">{t('project.pageSubtitle')}</p>
      </div>

      {/* Toolbar */}
      <div className="project-toolbar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('project.searchPlaceholder')}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">{t('project.allTypes')}</option>
          <option value="project">{t('project.typeProject')}</option>
          <option value="dispute">{t('project.typeDispute')}</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{t('project.allStatuses')}</option>
          <option value="active">{t('project.statusActive')}</option>
          <option value="on_hold">{t('project.statusOnHold')}</option>
          <option value="closed">{t('project.statusClosed')}</option>
        </select>
        {isAdmin && (
          <button onClick={() => setCreateModal({ open: true, defaultType: 'project' })} className="btn primary" style={{ whiteSpace: 'nowrap' }}>
            + {t('project.addNew')}
          </button>
        )}
        <button
          onClick={() => setShowReportModal(true)}
          disabled={exportingPdf}
          className="btn ghost"
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          title={t('project.reportModalTitle')}
        >
          {exportingPdf ? '⏳' : '📄'} {exportingPdf ? t('buttons.loading') : t('buttons.downloadReport')}
        </button>
      </div>

      {actionError && (
        <div className="project-error">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')}>✕</button>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <p className="project-loading">{t('buttons.loading')}</p>
      ) : projects.length === 0 ? (
        <div className="project-empty">{t('project.noProjects')}</div>
      ) : (
        <div className="project-grid">
          {projects.map(project => (
            <div key={project.id} onClick={() => openDetail(project)} className="project-card">
              <div className="project-card-badges">
                <span style={typeBadgeStyle(project.type)}>{t(`project.type${project.type.charAt(0).toUpperCase()}${project.type.slice(1)}`)}</span>
                <span style={statusBadgeStyle(project.status)}>{t(`project.status${project.status.charAt(0).toUpperCase()}${project.status.slice(1).replace(/_(.)/g, (_, c: string) => c.toUpperCase())}`)}</span>
              </div>
              <div className="project-card-name">{project.name}</div>
              <div className="project-card-number">{project.number}</div>
              {project.type === 'dispute' && project.institution && (
                <div className="project-card-institution">
                  {t('project.institutionLabel')}: {project.institution === 'OTHERS' && project.institutionDetail ? project.institutionDetail : project.institution}
                </div>
              )}
              <div className="project-card-duration">
                {renderDuration(project)}
              </div>
              {isAdmin && (
                <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditModal({ open: true, project })} className="btn ghost" style={{ fontSize: 12, padding: '4px 10px' }}>{t('buttons.edit')}</button>
                  <button onClick={() => setDeleteConfirm(project)} className="btn danger" style={{ fontSize: 12, padding: '4px 10px' }}>{t('buttons.delete')}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="project-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn ghost" style={{ padding: '6px 14px' }}>{t('buttons.previous')}</button>
          <span>{t('pagination.page')} {page} {t('pagination.of')} {totalPages} ({totalCount})</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn ghost" style={{ padding: '6px 14px' }}>{t('buttons.next')}</button>
        </div>
      )}

      {/* === CREATE MODAL === */}
      {createModal.open && (
        <div className="modal-overlay" onClick={() => setCreateModal({ open: false })}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h3>
              {createModal.defaultType === 'dispute' ? t('project.createDisputeTitle') : t('project.createProjectTitle')}
            </h3>
            <ProjectForm
              initial={{ type: createModal.defaultType }}
              onSave={handleCreate}
              onCancel={() => setCreateModal({ open: false })}
              onTypeChange={type => setCreateModal(m => ({ ...m, defaultType: type }))}
              t={t}
            />
          </div>
        </div>
      )}

      {/* === EDIT MODAL === */}
      {editModal.open && editModal.project && (
        <div className="modal-overlay" onClick={() => setEditModal({ open: false })}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h3>{t('project.editTitle')}</h3>
            <ProjectForm
              initial={editModal.project}
              onSave={handleEdit}
              onCancel={() => setEditModal({ open: false })}
              t={t}
            />
          </div>
        </div>
      )}

      {/* === DELETE CONFIRM === */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>⚠️ {t('project.deleteConfirmTitle')}</h3>
            <p className="muted">{t('project.deleteConfirmMsg')}</p>
            <p style={{ fontWeight: 600 }}>{deleteConfirm.name} ({deleteConfirm.number})</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn ghost">{t('buttons.cancel')}</button>
              <button onClick={handleDelete} className="btn danger">{t('buttons.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* === REPORT DATE RANGE MODAL === */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>📄 {t('project.reportModalTitle')}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 16px' }}>{t('project.reportDateHint')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#d1d5db' }}>
                {t('project.reportDateFrom')}
                <input
                  type="date"
                  value={reportDateFrom}
                  onChange={e => setReportDateFrom(e.target.value)}
                  style={{ display: 'block', marginTop: 4, width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '7px 10px', color: '#f9fafb', fontSize: 14 }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#d1d5db' }}>
                {t('project.reportDateTo')}
                <input
                  type="date"
                  value={reportDateTo}
                  onChange={e => setReportDateTo(e.target.value)}
                  style={{ display: 'block', marginTop: 4, width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '7px 10px', color: '#f9fafb', fontSize: 14 }}
                />
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button onClick={() => setShowReportModal(false)} className="btn ghost">{t('buttons.cancel')}</button>
              <button onClick={() => handleExportPdf(reportDateFrom, reportDateTo)} className="btn primary">
                📄 {t('project.reportDownload')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === DETAIL DRAWER === */}
      {detailProject && (
        <div className="project-detail-drawer">
          <div className="project-detail-overlay" onClick={() => { setDetailProject(null); setLinkPending(null); setLinkDocId('') }} />
          <div className="project-detail-panel">
            {/* Header */}
            <div>
              <div className="project-detail-header-row">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={typeBadgeStyle(detailProject.type)}>{t(`project.type${detailProject.type.charAt(0).toUpperCase()}${detailProject.type.slice(1)}`)}</span>
                  <span style={statusBadgeStyle(detailProject.status)}>{t(`project.status${detailProject.status.charAt(0).toUpperCase()}${detailProject.status.slice(1).replace(/_(.)/g, (_, c: string) => c.toUpperCase())}`)}</span>
                </div>
                <button onClick={() => { setDetailProject(null); setLinkPending(null); setLinkDocId('') }} className="project-detail-close">✕</button>
              </div>
              <h2 className="project-detail-title">{detailProject.name}</h2>
              <p className="project-detail-number">{detailProject.number}</p>
            </div>

            {/* Info grid */}
            <div className="project-detail-info-grid">
              <div><span className="project-detail-info-label">{t('project.startDateLabel')}</span><span className="project-detail-info-value">{detailProject.startDate}</span></div>
              {detailProject.estimatedEndDate && <div><span className="project-detail-info-label">{t('project.estimatedEndDateLabel')}</span><span className="project-detail-info-value">{detailProject.estimatedEndDate}</span></div>}
              {detailProject.actualEndDate && <div><span className="project-detail-info-label">{t('project.actualEndDateLabel')}</span><span className="project-detail-info-value">{detailProject.actualEndDate}</span></div>}
              <div><span className="project-detail-info-label">{t('project.duration')}</span><span className="project-detail-info-value">{renderDuration(detailProject)}</span></div>
              {detailProject.type === 'dispute' && detailProject.institution && (
                <div><span className="project-detail-info-label">{t('project.institutionLabel')}</span>
                  <span className="project-detail-info-value">{detailProject.institution === 'OTHERS' && detailProject.institutionDetail ? `${detailProject.institution} — ${detailProject.institutionDetail}` : detailProject.institution}</span>
                </div>
              )}
              {detailProject.creator && <div><span className="project-detail-info-label">{t('project.createdBy')}</span><span className="project-detail-info-value">{detailProject.creator.username}</span></div>}
            </div>

            {detailProject.description && <p className="project-detail-description">{detailProject.description}</p>}

            {/* Linked Documents */}
            <section>
              <h3 className="project-detail-section-title">{t('project.linkedDocuments')}</h3>
              {detailLoading ? (
                <p className="project-no-data">{t('buttons.loading')}</p>
              ) : detailProject.linkedDocuments && detailProject.linkedDocuments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailProject.linkedDocuments.map(link => {
                    const doc = link.document || link.subDocument
                    return (
                      <div key={link.id} className="project-detail-doc-row">
                        <span className={`project-detail-doc-type ${link.documentType}`}>{link.documentType}</span>
                        <span
                          className="project-detail-doc-name project-detail-doc-link"
                          onClick={() => { setDetailProject(null); navigate('/documents', { state: { search: doc?.title || '' } }) }}
                          title={doc?.title || '-'}
                        >{doc?.title || '-'}</span>
                        {isAdmin && (
                          <button onClick={() => handleUnlinkDoc(link)} className="btn danger" style={{ fontSize: 12, padding: '3px 8px' }}>{t('project.unlinkDoc')}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="project-no-data">{t('project.noLinkedDocs')}</p>
              )}

              {isAdmin && (
                <div style={{ marginTop: 10 }}>
                  <div className="project-detail-link-row">
                    <select value={linkDocType} onChange={e => { setLinkDocType(e.target.value as 'master' | 'sub'); setLinkDocId(''); setLinkPending(null) }}>
                      <option value="master">{t('documents.masterDocument')}</option>
                      <option value="sub">{t('documents.subDocument')}</option>
                    </select>
                    <select value={linkDocId} onChange={e => {
                      const val = Number(e.target.value) || ''
                      setLinkDocId(val)
                      if (val) {
                        const found = availableDocs.find(d => d.id === Number(val))
                        setLinkPending(found ? { id: found.id, title: found.title, type: found.type } : null)
                      } else {
                        setLinkPending(null)
                      }
                    }} style={{ flex: 1 }}>
                      <option value="">{t('project.selectDocument')}</option>
                      {availableDocs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                    </select>
                  </div>
                  {linkPending && (
                    <div className="project-link-preview">
                      <div className="project-link-preview-info">
                        <span className={`project-detail-doc-type ${linkPending.type}`}>{linkPending.type}</span>
                        <span className="project-link-preview-name">📎 {linkPending.title}</span>
                      </div>
                      <p className="project-link-preview-note">
                        {detailProject.type === 'project'
                          ? t('project.linkNoteProject')
                          : t('project.linkNoteDispute')}
                      </p>
                      <div className="project-link-preview-actions">
                        <button onClick={() => { setLinkDocId(''); setLinkPending(null) }} className="btn ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                          {t('buttons.cancel')}
                        </button>
                        <button onClick={handleLinkDoc} disabled={linkingDoc} className="btn primary" style={{ fontSize: 12, padding: '5px 14px' }}>
                          {linkingDoc ? '...' : t('project.saveLinkDocument')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Supporting Documents */}
            <section>
              <h3 className="project-detail-section-title">{t('project.supportingDocuments')}</h3>
              {detailLoading ? (
                <p className="project-no-data">{t('buttons.loading')}</p>
              ) : detailProject.supportingDocuments && detailProject.supportingDocuments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailProject.supportingDocuments.map(doc => (
                    <div key={doc.id} className="project-detail-supporting-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="project-detail-file-name">{doc.originalName}</div>
                        <div className="project-detail-file-meta">{formatBytes(doc.fileSize)} · {doc.uploader?.username}</div>
                      </div>
                      <button onClick={() => handleSupportingDownload(doc)} className="btn ghost" style={{ fontSize: 12, padding: '3px 8px' }}>{t('project.downloadFile')}</button>
                      {isAdmin && (
                        <button onClick={() => handleSupportingDelete(doc)} className="btn danger" style={{ fontSize: 12, padding: '3px 8px' }}>{t('project.deleteFile')}</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="project-no-data">{t('project.noSupportingDocs')}</p>
              )}

              {isAdmin && (
                <div style={{ marginTop: 10 }}>
                  <input ref={fileRef} type="file" onChange={handleSupportingUpload} disabled={uploadingFile} style={{ display: 'none' }} id="supporting-upload" />
                  <label htmlFor="supporting-upload" className={`project-upload-label${uploadingFile ? ' uploading' : ''}`}>
                    {uploadingFile ? t('buttons.uploading') : '↑ ' + t('project.uploadSupportingDoc')}
                  </label>
                </div>
              )}
            </section>


          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectPage


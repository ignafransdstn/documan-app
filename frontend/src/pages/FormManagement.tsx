import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import * as api from '../api'
import type { Form } from '../api'
import extractErrorMessage from '../utils/extractErrorMessage'
import FormUploadDialog from '../components/FormUploadDialog'

const FormManagement: React.FC = () => {
  const { token, user } = useAuth()
  const { t } = useLanguage()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalForms, setTotalForms] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const itemsPerPage = 10

  async function loadForms(page: number = 1) {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.getForms(
        token,
        page,
        itemsPerPage,
        searchQuery,
        statusFilter === 'all' ? '' : statusFilter
      )
      setForms(res.forms)
      setTotalForms(res.total)
      setTotalPages(Math.ceil(res.total / itemsPerPage))
      setCurrentPage(page)
    } catch (e: unknown) {
      console.error(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms(1)
  }, [token, searchQuery, statusFilter])

  if (!user || user.userLevel !== 'admin') {
    return (
      <div className="card">
        <h3>{t('auth.notAuthorized')}</h3>
        <p>{t('auth.onlyAdminCanAccess')}</p>
      </div>
    )
  }

  async function handleUploadSuccess() {
    setShowUploadDialog(false)
    loadForms(1)
  }

  async function handleEditForm(form: Form) {
    setEditingForm(form)
    setEditName(form.name)
    setEditDescription(form.description || '')
  }

  async function handleSaveEdit() {
    if (!editingForm || !token) return
    try {
      await api.updateForm(editingForm.id, {
        name: editName,
        description: editDescription
      }, token)
      setEditingForm(null)
      loadForms(currentPage)
    } catch (e: unknown) {
      console.error('Error updating form:', extractErrorMessage(e))
    }
  }

  async function handleDeleteForm(formId: number) {
    if (!token) return
    try {
      await api.deleteForm(formId, token)
      setDeleteConfirm(null)
      loadForms(currentPage)
    } catch (e: unknown) {
      console.error('Error deleting form:', extractErrorMessage(e))
    }
  }

  async function handleDeactivateForm(formId: number) {
    if (!token) return
    try {
      await api.deactivateForm(formId, token)
      loadForms(currentPage)
    } catch (e: unknown) {
      console.error('Error deactivating form:', extractErrorMessage(e))
    }
  }

  return (
    <div className="forms-management-container">
      <div className="forms-header">
        <div>
          <h1>{t('forms.management') || 'Form Management'}</h1>
          <p>{t('forms.subtitle') || 'Manage form templates and configurations'}</p>
        </div>
        <button className="btn primary" onClick={() => setShowUploadDialog(true)}>
          {t('forms.uploadNewForm') || 'Upload Form'}
        </button>
      </div>

      {/* Filters */}
      <div className="forms-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('forms.searchForms') || 'Search forms...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="filter-box">
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'archived')
              setCurrentPage(1)
            }}
          >
            <option value="all">{t('forms.allForms') || 'All Forms'}</option>
            <option value="active">{t('forms.activeForms') || 'Active'}</option>
            <option value="archived">{t('forms.archivedForms') || 'Archived'}</option>
          </select>
        </div>
      </div>

      {/* Forms List */}
      <div className="forms-list">
        {loading ? (
          <div className="loading">{t('buttons.loading')}</div>
        ) : forms.length === 0 ? (
          <div className="empty-state">
            <p>{t('forms.noForms') || 'No forms found'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="forms-table">
              <thead>
                <tr>
                  <th>{t('forms.formName') || 'Form Name'}</th>
                  <th>{t('forms.description') || 'Description'}</th>
                  <th>{t('forms.fields') || 'Fields'}</th>
                  <th>{t('forms.status') || 'Status'}</th>
                  <th>{t('forms.createdAt') || 'Created'}</th>
                  <th>{t('buttons.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id}>
                    <td className="form-name">{form.name}</td>
                    <td className="form-description">{form.description || '-'}</td>
                    <td className="form-fields">{form.fields?.length || 0}</td>
                    <td>
                      <span className={`status-badge ${form.status}`}>
                        {t(`forms.status.${form.status}`) || form.status}
                      </span>
                    </td>
                    <td>{new Date(form.createdAt).toLocaleDateString()}</td>
                    <td className="form-actions">
                      <button
                        className="btn small"
                        onClick={() => handleEditForm(form)}
                        title={t('buttons.edit') || 'Edit'}
                      >
                        {t('buttons.edit')}
                      </button>
                      {form.status === 'active' ? (
                        <button
                          className="btn small danger"
                          onClick={() => handleDeactivateForm(form.id)}
                          title={t('forms.deactivate') || 'Deactivate'}
                        >
                          {t('forms.deactivate') || 'Deactivate'}
                        </button>
                      ) : (
                        <button
                          className="btn small danger"
                          onClick={() => setDeleteConfirm(form.id)}
                          title={t('buttons.delete') || 'Delete'}
                        >
                          {t('buttons.delete')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => loadForms(currentPage - 1)}
            className="btn"
          >
            {t('buttons.previous')}
          </button>
          <span>
            {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => loadForms(currentPage + 1)}
            className="btn"
          >
            {t('buttons.next')}
          </button>
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <FormUploadDialog
          onClose={() => setShowUploadDialog(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Edit Dialog */}
      {editingForm && (
        <div className="modal-overlay" onClick={() => setEditingForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('forms.editForm') || 'Edit Form'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit() }} className="form">
              <label>
                {t('forms.formName') || 'Form Name'}
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </label>
              <label>
                {t('forms.description') || 'Description'}
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn primary">
                  {t('buttons.save')}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditingForm(null)}
                >
                  {t('buttons.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('modals.deleteConfirmation')}</h3>
            <p>{t('forms.deleteFormConfirm') || 'Are you sure you want to delete this form?'}</p>
            <div className="form-actions">
              <button
                className="btn danger"
                onClick={() => handleDeleteForm(deleteConfirm)}
              >
                {t('modals.confirmDelete')}
              </button>
              <button
                className="btn"
                onClick={() => setDeleteConfirm(null)}
              >
                {t('buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .forms-management-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .forms-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .forms-header h1 {
          margin: 0;
          font-size: 2rem;
        }

        .forms-header p {
          margin: 0.5rem 0 0 0;
          color: var(--muted);
        }

        .forms-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
        }

        .search-box input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .filter-box {
          min-width: 150px;
        }

        .filter-box select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .forms-list {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .forms-table {
          width: 100%;
          border-collapse: collapse;
        }

        .forms-table thead {
          background: var(--header-bg);
          border-bottom: 2px solid var(--border);
        }

        .forms-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .forms-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .forms-table tr:hover {
          background: var(--hover-bg);
        }

        .form-name {
          font-weight: 500;
        }

        .form-description {
          color: var(--text-secondary);
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-badge.archived {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn.small {
          padding: 0.25rem 0.75rem;
          font-size: 0.85rem;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-top: 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .loading {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

export default FormManagement

import React, { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useAuth } from '../hooks/useAuth'
import * as api from '../api'
import extractErrorMessage from '../utils/extractErrorMessage'

interface FormUploadDialogProps {
  onClose: () => void
  onSuccess: () => void
}

const FormUploadDialog: React.FC<FormUploadDialogProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage()
  const { token } = useAuth()
  const [formName, setFormName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formName.trim()) {
      setError(t('forms.formNameRequired') || 'Form name is required')
      return
    }

    if (!file) {
      setError(t('forms.fileRequired') || 'Please select a Word document')
      return
    }

    if (!file.name.endsWith('.docx')) {
      setError(t('forms.docxOnly') || 'Please upload a .docx file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('forms.fileTooLarge') || 'File must be less than 10MB')
      return
    }

    if (!token) {
      setError(t('auth.notAuthenticated') || 'Not authenticated')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', formName.trim())
      if (description.trim()) {
        formData.append('description', description.trim())
      }
      formData.append('file', file)

      await api.uploadForm(formData, token)
      setSuccess(t('forms.uploadSuccess') || 'Form uploaded successfully!')
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to upload form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('forms.uploadNewForm') || 'Upload Form Template'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <label>
            <span className="label-text">
              {t('forms.formName') || 'Form Name'} <span className="required">*</span>
            </span>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t('forms.formNamePlaceholder') || 'Enter form name'}
              required
            />
          </label>

          <label>
            <span className="label-text">
              {t('forms.description') || 'Description'}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('forms.descriptionPlaceholder') || 'Enter form description'}
              rows={3}
            />
          </label>

          <label>
            <span className="label-text">
              {t('forms.wordDocument') || 'Word Document'} <span className="required">*</span>
            </span>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="file-input"
              />
              <div className="file-label">
                {file ? (
                  <>
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                  </>
                ) : (
                  <>
                    <span className="file-icon">📁</span>
                    <span>{t('forms.selectWordFile') || 'Select a .docx file'}</span>
                  </>
                )}
              </div>
              <p className="file-hint">
                {t('forms.docxHint') || 'Maximum file size: 10MB. Form fields should be marked with {fieldName}'}
              </p>
            </div>
          </label>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn primary"
              disabled={loading || !formName.trim() || !file}
            >
              {loading ? t('buttons.uploading') || 'Uploading...' : t('buttons.upload')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={loading}
            >
              {t('buttons.cancel')}
            </button>
          </div>
        </form>

        <style>{`
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
            padding: 0;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 1.3rem;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 2rem;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }

          .close-btn:hover {
            color: var(--text-primary);
          }

          .upload-form {
            padding: 1.5rem;
          }

          .upload-form label {
            display: flex;
            flex-direction: column;
            margin-bottom: 1.5rem;
          }

          .label-text {
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 0.95rem;
          }

          .required {
            color: #ef4444;
          }

          .upload-form input[type="text"],
          .upload-form textarea {
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-family: inherit;
            font-size: 0.95rem;
            background: var(--input-bg);
            color: var(--text-primary);
          }

          .upload-form input[type="text"]:focus,
          .upload-form textarea:focus {
            outline: none;
            border-color: #7c3aed;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
          }

          .file-input-wrapper {
            position: relative;
          }

          .file-input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }

          .file-label {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            border: 2px dashed var(--border);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--input-bg);
          }

          .file-input-wrapper:hover .file-label {
            border-color: #7c3aed;
            background: rgba(124, 58, 237, 0.05);
          }

          .file-icon {
            font-size: 1.5rem;
          }

          .file-name {
            font-weight: 500;
            color: #22c55e;
          }

          .file-size {
            color: var(--text-secondary);
            font-size: 0.9rem;
          }

          .file-hint {
            margin: 0.75rem 0 0 0;
            font-size: 0.85rem;
            color: var(--text-secondary);
          }

          .error-message {
            padding: 1rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            border-radius: 4px;
            color: #ef4444;
            margin-bottom: 1rem;
          }

          .success-message {
            padding: 1rem;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid #22c55e;
            border-radius: 4px;
            color: #22c55e;
            margin-bottom: 1rem;
          }

          .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border);
          }

          .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            font-size: 0.95rem;
            transition: all 0.3s ease;
          }

          .btn.primary {
            background: #7c3aed;
            color: white;
          }

          .btn.primary:hover:not(:disabled) {
            background: #6d28d9;
          }

          .btn.primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .btn {
            background: var(--button-bg);
            color: var(--button-text);
          }

          .btn:hover:not(:disabled) {
            background: var(--button-hover);
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  )
}

export default FormUploadDialog

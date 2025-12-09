/**
 * Form Submission Page
 * Allows level 4 users to fill and submit forms
 * Supports draft saving and form submission tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FormField as DynamicFormField, FormData, FormErrors } from '../components/DynamicFormRenderer';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import { FormValidator } from '../utils/FormValidator';
import * as API from '../api';

interface FormWithFields {
  id: number
  name: string
  description?: string
  status: 'active' | 'archived' | 'deleted'
  fields: DynamicFormField[]
  createdAt: string
}

interface Submission {
  id: number
  formId: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived'
  submissionData: FormData
  submittedAt?: string
  createdAt: string
}

const FormSubmissionPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // State management
  const [forms, setForms] = useState<FormWithFields[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormWithFields | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fill' | 'submissions'>('fill');

  // Fetch forms on component mount
  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      const response = await API.getForms(token, 1, 100, '', 'active');
      setForms(response.forms as FormWithFields[]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('errors.failedToLoadForms');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const response = await API.getSubmissionsList(token, 1, 50);
      setSubmissions(response.submissions || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  }, []);

  useEffect(() => {
    fetchForms();
    fetchSubmissions();
  }, [fetchForms, fetchSubmissions]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFormSelect = async (formId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      const form = await API.getForm(formId, token);
      setSelectedForm(form as FormWithFields);
      
      // Initialize form data with empty values
      const initialData: FormData = {};
      const formFields = form.fields || [];
      formFields.forEach((field) => {
        initialData[field.fieldName] = '';
      });
      setFormData(initialData);
      setErrors({});
      setSuccessMessage(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('errors.failedToLoadForm');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (_fieldId: number, fieldName: string, value: string | number | boolean | null) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field when user starts editing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleFileChange = () => {
    // File handling would be implemented here if needed
  };

  const validateForm = (): boolean => {
    if (!selectedForm) return false;

    const newErrors = FormValidator.validateForm(selectedForm.fields, formData);
    setErrors(newErrors);
    return !FormValidator.hasErrors(newErrors);
  };

  const handleSaveDraft = async () => {
    if (!selectedForm || !user) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare submission data
      const submissionPayload = {
        formId: selectedForm.id,
        submissionData: formData,
        status: 'draft'
      };

      // Check if updating existing draft
      const existingDraft = submissions.find(
        (s) => s.formId === selectedForm.id && s.status === 'draft'
      );

      const token = localStorage.getItem('auth_token') || '';

      // Remove undefined values for API compatibility
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number | boolean | null>);

      const cleanPayload = {
        formId: selectedForm.id,
        submissionData: cleanedData,
        status: submissionPayload.status
      };

      if (existingDraft) {
        // Update existing draft
        await API.updateSubmission(existingDraft.id, cleanPayload, token);
        setSuccessMessage(t('submissions.draftUpdated'));
      } else {
        // Create new draft
        await API.createSubmission(cleanPayload, token);
        setSuccessMessage(t('submissions.draftSaved'));
      }

      // Refresh submissions list
      fetchSubmissions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('errors.failedToSaveDraft');
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForm = async () => {
    if (!selectedForm || !user) return;

    // Validate form
    if (!validateForm()) {
      setError(t('errors.pleaseFixErrors'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if updating existing draft
      const existingDraft = submissions.find(
        (s) => s.formId === selectedForm.id && s.status === 'draft'
      );

      // Remove undefined values for API compatibility
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number | boolean | null>);

      const submissionPayload = {
        formId: selectedForm.id,
        submissionData: cleanedData,
        status: 'submitted'
      };

      const token = localStorage.getItem('auth_token') || '';

      if (existingDraft) {
        // Update draft to submitted
        await API.updateSubmission(existingDraft.id, submissionPayload, token);
      } else {
        // Create new submission
        await API.createSubmission(submissionPayload, token);
      }

      setSuccessMessage(t('submissions.formSubmitted'));

      // Reset form
      setSelectedForm(null);
      setFormData({});
      setErrors({});

      // Refresh submissions list
      setTimeout(() => {
        fetchSubmissions();
        setActiveTab('submissions');
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('errors.failedToSubmitForm');
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return '#FF9800';
      case 'submitted':
        return '#2196F3';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#f44336';
      case 'archived':
        return '#9E9E9E';
      default:
        return '#999';
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>
            {t('submissions.title') || 'Form Submissions'}
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            {t('submissions.subtitle') || 'Fill and submit forms for approval'}
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '1px solid #ddd'
          }}
        >
          <button
            onClick={() => setActiveTab('fill')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'fill' ? '#1976D2' : 'transparent',
              color: activeTab === 'fill' ? 'white' : '#666',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: activeTab === 'fill' ? 'bold' : 'normal',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {t('submissions.fillNewForm') || 'Fill Form'}
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'submissions' ? '#1976D2' : 'transparent',
              color: activeTab === 'submissions' ? 'white' : '#666',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: activeTab === 'submissions' ? 'bold' : 'normal',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {t('submissions.mySubmissions') || 'My Submissions'} ({submissions.length})
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px 16px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #ef5350'
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              padding: '12px 16px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #66bb6a'
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Fill Form Tab */}
        {activeTab === 'fill' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Form Selection */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                {t('submissions.selectForm') || 'Select a Form'}
              </label>
              <select
                onChange={(e) => handleFormSelect(parseInt(e.target.value))}
                value={selectedForm?.id || ''}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">{t('submissions.chooseForm') || 'Choose a form...'}</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Form Renderer */}
            {selectedForm && (
              <div>
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>
                    {selectedForm.name}
                  </h2>
                  {selectedForm.description && (
                    <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
                      {selectedForm.description}
                    </p>
                  )}
                  <small style={{ color: '#999', marginTop: '8px', display: 'block' }}>
                    {t('forms.fields') || 'Fields'}: {selectedForm.fields?.length || 0}
                  </small>
                </div>

                <DynamicFormRenderer
                  fields={selectedForm.fields || []}
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                  onFileChange={handleFileChange}
                  disabled={saving || loading}
                />

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '1px solid #eee'
                  }}
                >
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving || loading}
                    style={{
                      padding: '10px 24px',
                      border: 'none',
                      backgroundColor: '#f5f5f5',
                      color: '#333',
                      borderRadius: '4px',
                      cursor: saving || loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      opacity: saving || loading ? 0.6 : 1
                    }}
                  >
                    {saving ? t('submissions.saving') : t('submissions.saveDraft') || 'Save Draft'}
                  </button>

                  <button
                    onClick={handleSubmitForm}
                    disabled={saving || loading}
                    style={{
                      padding: '10px 24px',
                      border: 'none',
                      backgroundColor: '#1976D2',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: saving || loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      opacity: saving || loading ? 0.6 : 1
                    }}
                  >
                    {saving ? t('submissions.submitting') : t('submissions.submitForm') || 'Submit Form'}
                  </button>
                </div>
              </div>
            )}

            {!selectedForm && !loading && forms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <p>{t('submissions.noFormsAvailable') || 'No forms available for submission'}</p>
              </div>
            )}
          </div>
        )}

        {/* Submissions List Tab */}
        {activeTab === 'submissions' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {submissions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>
                        {t('submissions.formName') || 'Form Name'}
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>
                        {t('submissions.status') || 'Status'}
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>
                        {t('submissions.submittedAt') || 'Submitted At'}
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>
                        {t('submissions.createdAt') || 'Created At'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => {
                      const form = forms.find((f) => f.id === submission.formId);
                      return (
                        <tr key={submission.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{form?.name || `Form #${submission.formId}`}</td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                backgroundColor: getStatusColor(submission.status),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textTransform: 'capitalize'
                              }}
                            >
                              {submission.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#666' }}>
                            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '12px', color: '#666' }}>
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <p>{t('submissions.noSubmissions') || 'You have no submissions yet'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSubmissionPage;

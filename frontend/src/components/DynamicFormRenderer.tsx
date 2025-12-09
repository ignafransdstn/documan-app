/**
 * Dynamic Form Renderer Component
 * Renders form fields based on field definitions from backend
 * Supports: text, date, number, select, textarea, file
 */

import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export interface FormField {
  id: number
  fieldName: string
  fieldType: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'file' | 'email' | 'checkbox' | 'radio'
  isRequired: boolean
  placeholder?: string
  displayOrder: number
  validationRules?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    options?: { value: string; label: string }[]
    fileTypes?: string[]
    maxFileSize?: number
  }
}

export interface FormData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface FormErrors {
  [key: string]: string;
}

interface DynamicFormRendererProps {
  fields: FormField[]
  formData: FormData
  errors: FormErrors
  onChange: (fieldId: number, fieldName: string, value: string | number | boolean | null) => void
  onFileChange?: (fieldId: number, fieldName: string, file: File) => void
  disabled?: boolean
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  formData,
  errors,
  onChange,
  onFileChange,
  disabled = false
}) => {
  const { t } = useLanguage();

  // Sort fields by displayOrder
  const sortedFields = [...fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const handleChange = (field: FormField, value: string | number | boolean | null) => {
    onChange(field.id, field.fieldName, value);
  };

  const handleFileChange = (field: FormField, file: File | null) => {
    if (onFileChange) {
      onFileChange(field.id, field.fieldName, file || new File([], ''));
    }
  };

  const renderField = (field: FormField) => {
    const fieldValue = String(formData[field.fieldName] || '');
    const fieldError = errors[field.fieldName];
    const isRequired = field.isRequired;

    const fieldInputClassName = `form-input ${fieldError ? 'error' : ''}`;

    switch (field.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            className={fieldInputClassName}
            placeholder={field.placeholder || ''}
            value={fieldValue}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={disabled}
            required={isRequired}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${fieldError ? '#d32f2f' : '#ccc'}`,
              fontFamily: 'inherit',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        );

      case 'textarea':
        return (
          <textarea
            className={fieldInputClassName}
            placeholder={field.placeholder || ''}
            value={fieldValue}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={disabled}
            required={isRequired}
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${fieldError ? '#d32f2f' : '#ccc'}`,
              fontFamily: 'inherit',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className={fieldInputClassName}
            value={fieldValue}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={disabled}
            required={isRequired}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${fieldError ? '#d32f2f' : '#ccc'}`,
              fontFamily: 'inherit',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className={fieldInputClassName}
            placeholder={field.placeholder || ''}
            value={fieldValue}
            onChange={(e) => handleChange(field, e.target.value ? parseFloat(e.target.value) : '')}
            disabled={disabled}
            required={isRequired}
            min={field.validationRules?.min}
            max={field.validationRules?.max}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${fieldError ? '#d32f2f' : '#ccc'}`,
              fontFamily: 'inherit',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        );

      case 'select': {
        const options = field.validationRules?.options || [];
        return (
          <select
            className={fieldInputClassName}
            value={fieldValue || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={disabled}
            required={isRequired}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${fieldError ? '#d32f2f' : '#ccc'}`,
              fontFamily: 'inherit',
              fontSize: '14px',
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">{field.placeholder || `${t('forms.selectOption')}`}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      case 'file':
        return (
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              className={fieldInputClassName}
              onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
              disabled={disabled}
              required={isRequired}
              accept={field.validationRules?.fileTypes?.join(',') || '*'}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: `1px solid ${fieldError ? '#d32f2f' : '#ccc'}`,
                fontFamily: 'inherit',
                fontSize: '14px',
                boxSizing: 'border-box',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            />
            {field.validationRules?.maxFileSize && (
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                {t('forms.maxFileSize')}: {(field.validationRules.maxFileSize / 1024 / 1024).toFixed(2)}MB
              </small>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {sortedFields.map((field) => (
        <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            style={{
              fontWeight: 500,
              fontSize: '14px',
              color: '#333'
            }}
          >
            {field.fieldName}
            {field.isRequired && (
              <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
            )}
          </label>
          {renderField(field)}
          {errors[field.fieldName] && (
            <small style={{ color: '#d32f2f', marginTop: '2px' }}>
              {errors[field.fieldName]}
            </small>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicFormRenderer;

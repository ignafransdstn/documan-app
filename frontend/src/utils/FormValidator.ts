/**
 * Form Validation Utility
 * Validates form data against field definitions and validation rules
 */

import { FormField, FormData, FormErrors } from '../components/DynamicFormRenderer';

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  fileTypes?: string[];
  maxFileSize?: number;
  customValidator?: (value: any) => boolean | string;
}

export class FormValidator {
  /**
   * Validate all form fields
   */
  static validateForm(fields: FormField[], formData: FormData): FormErrors {
    const errors: FormErrors = {};

    fields.forEach((field) => {
      const error = this.validateField(field, formData[field.fieldName]);
      if (error) {
        errors[field.fieldName] = error;
      }
    });

    return errors;
  }

  /**
   * Validate a single field
   */
  static validateField(field: FormField, value: any): string | null {
    // Check required
    if (field.isRequired && this.isEmpty(value)) {
      return `${field.fieldName} is required`;
    }

    // If field is not required and empty, skip other validations
    if (!field.isRequired && this.isEmpty(value)) {
      return null;
    }

    const rules = field.validationRules || {};

    switch (field.fieldType) {
      case 'text':
      case 'textarea':
        return this.validateString(value, field.fieldName, rules);

      case 'number':
        return this.validateNumber(value, field.fieldName, rules);

      case 'date':
        return this.validateDate(value, field.fieldName, rules);

      case 'select':
        return this.validateSelect(value, field.fieldName, rules);

      case 'file':
        return this.validateFile(value, field.fieldName, rules);

      default:
        return null;
    }
  }

  /**
   * Check if value is empty
   */
  private static isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    );
  }

  /**
   * Validate string field (text/textarea)
   */
  private static validateString(value: string, fieldName: string, rules: ValidationRule): string | null {
    if (typeof value !== 'string') {
      return `${fieldName} must be a text value`;
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must not exceed ${rules.maxLength} characters`;
    }

    // Pattern (regex)
    if (rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          return `${fieldName} format is invalid`;
        }
      } catch (e) {
        console.error(`Invalid regex pattern for ${fieldName}:`, rules.pattern);
      }
    }

    // Custom validator
    if (rules.customValidator) {
      const result = rules.customValidator(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return `${fieldName} is invalid`;
      }
    }

    return null;
  }

  /**
   * Validate number field
   */
  private static validateNumber(value: any, fieldName: string, rules: ValidationRule): string | null {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return `${fieldName} must be a valid number`;
    }

    // Min value
    if (rules.min !== undefined && numValue < rules.min) {
      return `${fieldName} must be at least ${rules.min}`;
    }

    // Max value
    if (rules.max !== undefined && numValue > rules.max) {
      return `${fieldName} must not exceed ${rules.max}`;
    }

    return null;
  }

  /**
   * Validate date field
   */
  private static validateDate(value: string, fieldName: string, rules: ValidationRule): string | null {
    // Check if valid date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return `${fieldName} must be a valid date`;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`;
    }

    return null;
  }

  /**
   * Validate select field
   */
  private static validateSelect(value: string, fieldName: string, rules: ValidationRule): string | null {
    const options = rules.options || [];
    const optionValues = options.map((opt) => opt.value);

    if (value && !optionValues.includes(value)) {
      return `${fieldName} has an invalid selection`;
    }

    return null;
  }

  /**
   * Validate file field
   */
  private static validateFile(file: File | null, fieldName: string, rules: ValidationRule): string | null {
    if (!file) {
      return null; // Already handled by required check
    }

    // Check file type
    if (rules.fileTypes && rules.fileTypes.length > 0) {
      const fileName = file.name.toLowerCase();
      const isValidType = rules.fileTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        return file.type === type;
      });

      if (!isValidType) {
        return `${fieldName} must be one of: ${rules.fileTypes.join(', ')}`;
      }
    }

    // Check file size
    if (rules.maxFileSize && file.size > rules.maxFileSize) {
      const maxSizeMB = (rules.maxFileSize / 1024 / 1024).toFixed(2);
      return `${fieldName} must not exceed ${maxSizeMB}MB`;
    }

    return null;
  }

  /**
   * Validate specific field and return error or null
   */
  static validateSingleField(field: FormField, value: any): string | null {
    return this.validateField(field, value);
  }

  /**
   * Get all field names from field list
   */
  static getFieldNames(fields: FormField[]): string[] {
    return fields.map((field) => field.fieldName);
  }

  /**
   * Check if form has any errors
   */
  static hasErrors(errors: FormErrors): boolean {
    return Object.values(errors).some((error) => error !== null && error !== '');
  }

  /**
   * Get error count
   */
  static getErrorCount(errors: FormErrors): number {
    return Object.values(errors).filter((error) => error !== null && error !== '').length;
  }
}

export default FormValidator;

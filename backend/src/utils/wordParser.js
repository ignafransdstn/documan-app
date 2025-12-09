/**
 * Word Document Parser and Field Extractor
 * Utilities untuk extract {fieldName} placeholders dari Word documents
 */

const PizZip = require('pizzip');
const DocxTemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

/**
 * Extract field names dari Word document
 * Mencari semua {fieldName} placeholders dalam document
 * 
 * @param {Buffer} fileBuffer - Buffer dari Word file (BLOB)
 * @returns {Promise<Array>} Array of extracted field names dengan metadata
 * 
 * Example output:
 * [
 *   { fieldName: 'nama', index: 0 },
 *   { fieldName: 'tanggal', index: 1 },
 *   { fieldName: 'jabatan', index: 2 }
 * ]
 */
async function extractFieldsFromWordDocument(fileBuffer) {
  try {
    // Load file buffer sebagai ZIP
    const zip = new PizZip(fileBuffer);
    
    // Initialize DocxTemplater
    const doc = new DocxTemplater(zip);
    
    // Get all placeholders/tags dari document
    const tags = doc.getFullText().match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) || [];
    
    // Extract field names (remove curly braces)
    const fields = tags
      .map(tag => tag.replace(/[{}]/g, ''))
      .filter((field, index, self) => self.indexOf(field) === index) // Remove duplicates
      .map((fieldName, index) => ({
        fieldName,
        fieldType: 'text', // Default type - bisa di-override later
        isRequired: true,  // Default required
        displayOrder: index,
        placeholder: `Enter ${fieldName}`
      }));
    
    return fields;
  } catch (error) {
    throw new Error(`Failed to extract fields from Word document: ${error.message}`);
  }
}

/**
 * Validate Word document format
 * Check apakah file adalah valid DOCX format
 * 
 * @param {Buffer} fileBuffer - Buffer dari Word file
 * @returns {Promise<Boolean>}
 */
async function isValidWordDocument(fileBuffer) {
  try {
    // DOCX files are ZIP archives
    // Magic number untuk ZIP: 50 4B (PK in ASCII)
    if (fileBuffer[0] !== 0x50 || fileBuffer[1] !== 0x4B) {
      return false;
    }

    // Try to initialize as ZIP to ensure validity
    new PizZip(fileBuffer);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate sample data untuk document preview
 * Membuat mock data dengan field names dari template
 * 
 * @param {Array} fields - Array of field definitions
 * @returns {Object} Sample data object
 */
function generateSampleData(fields) {
  const sampleData = {};
  
  fields.forEach(field => {
    switch (field.fieldType) {
      case 'date':
        sampleData[field.fieldName] = new Date().toISOString().split('T')[0];
        break;
      case 'number':
        sampleData[field.fieldName] = '123';
        break;
      case 'textarea':
        sampleData[field.fieldName] = `Sample text for ${field.fieldName}`;
        break;
      case 'text':
      default:
        sampleData[field.fieldName] = `Sample ${field.fieldName}`;
    }
  });
  
  return sampleData;
}

/**
 * Get document structure information
 * Analyze document untuk metadata
 * 
 * @param {Buffer} fileBuffer - Buffer dari Word file
 * @returns {Promise<Object>} Document metadata
 */
async function getDocumentInfo(fileBuffer) {
  try {
    const zip = new PizZip(fileBuffer);
    const doc = new DocxTemplater(zip);
    
    // Get full text (preview)
    const fullText = doc.getFullText().substring(0, 500);
    
    return {
      isValid: true,
      textPreview: fullText,
      fileSize: fileBuffer.length,
      estimatedFieldCount: (fullText.match(/\{/g) || []).length
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

module.exports = {
  extractFieldsFromWordDocument,
  isValidWordDocument,
  generateSampleData,
  getDocumentInfo
};

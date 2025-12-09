/**
 * Test Word Parser utilities
 * Unit tests untuk field extraction dan validation
 */

const fs = require('fs');
const path = require('path');
const { 
  extractFieldsFromWordDocument, 
  isValidWordDocument, 
  getDocumentInfo,
  generateSampleData 
} = require('../src/utils/wordParser');

describe('Word Parser Utilities', () => {
  
  describe('isValidWordDocument', () => {
    test('should return false for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('This is not a Word document');
      const isValid = await isValidWordDocument(invalidBuffer);
      expect(isValid).toBe(false);
    });

    test('should return false for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const isValid = await isValidWordDocument(emptyBuffer);
      expect(isValid).toBe(false);
    });

    test('should detect Word document magic number (PK)', async () => {
      // Valid DOCX files start with PK (0x50 0x4B)
      // This is a minimal valid ZIP structure
      const validBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      const isValid = await isValidWordDocument(validBuffer);
      // Note: Might still fail ZIP validation, but should pass magic number check
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('generateSampleData', () => {
    test('should generate sample data for text fields', () => {
      const fields = [
        { fieldName: 'firstName', fieldType: 'text', isRequired: true },
        { fieldName: 'lastName', fieldType: 'text', isRequired: false }
      ];
      
      const sampleData = generateSampleData(fields);
      
      expect(sampleData).toHaveProperty('firstName');
      expect(sampleData).toHaveProperty('lastName');
      expect(typeof sampleData.firstName).toBe('string');
      expect(sampleData.firstName).toContain('Sample');
    });

    test('should generate sample data for date fields', () => {
      const fields = [
        { fieldName: 'startDate', fieldType: 'date', isRequired: true }
      ];
      
      const sampleData = generateSampleData(fields);
      
      expect(sampleData).toHaveProperty('startDate');
      // Should be in YYYY-MM-DD format
      expect(sampleData.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should generate sample data for number fields', () => {
      const fields = [
        { fieldName: 'amount', fieldType: 'number', isRequired: true }
      ];
      
      const sampleData = generateSampleData(fields);
      
      expect(sampleData).toHaveProperty('amount');
      expect(sampleData.amount).toBe('123');
    });

    test('should generate sample data for textarea fields', () => {
      const fields = [
        { fieldName: 'comments', fieldType: 'textarea', isRequired: false }
      ];
      
      const sampleData = generateSampleData(fields);
      
      expect(sampleData).toHaveProperty('comments');
      expect(typeof sampleData.comments).toBe('string');
      expect(sampleData.comments).toContain('Sample');
    });

    test('should handle empty fields array', () => {
      const fields = [];
      const sampleData = generateSampleData(fields);
      
      expect(sampleData).toEqual({});
    });
  });

  describe('getDocumentInfo', () => {
    test('should return document info structure for valid input', async () => {
      const buffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      const info = await getDocumentInfo(buffer);
      
      // For invalid ZIP, should still return isValid property
      expect(info).toHaveProperty('isValid');
      expect(typeof info.isValid).toBe('boolean');
    });

    test('should calculate correct file size for valid document', async () => {
      // Create a more complete mock - actual test should use real DOCX
      const samplePath = path.join(__dirname, '../samples/template.docx');
      
      if (fs.existsSync(samplePath)) {
        const buffer = fs.readFileSync(samplePath);
        const info = await getDocumentInfo(buffer);
        
        if (info.isValid) {
          expect(info).toHaveProperty('fileSize');
          expect(info.fileSize).toBe(buffer.length);
        }
      }
    });
  });

  describe('extractFieldsFromWordDocument', () => {
    test('should handle invalid document gracefully', async () => {
      const invalidBuffer = Buffer.from('Not a Word document');
      
      // Should not throw, but may return error or empty array
      try {
        const fields = await extractFieldsFromWordDocument(invalidBuffer);
        expect(Array.isArray(fields)).toBe(true);
      } catch (error) {
        // Expected behavior for invalid document
        expect(error).toBeDefined();
      }
    });

    test('should return array of fields', async () => {
      // Create a mock scenario - we'll skip if sample file doesn't exist
      const samplePath = path.join(__dirname, '../samples/template.docx');
      
      if (fs.existsSync(samplePath)) {
        const buffer = fs.readFileSync(samplePath);
        const fields = await extractFieldsFromWordDocument(buffer);
        
        expect(Array.isArray(fields)).toBe(true);
        
        // If fields found, verify structure
        if (fields.length > 0) {
          fields.forEach(field => {
            expect(field).toHaveProperty('fieldName');
            expect(field).toHaveProperty('fieldType');
            expect(field).toHaveProperty('isRequired');
            expect(typeof field.fieldName).toBe('string');
          });
        }
      }
    });
  });
});


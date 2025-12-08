const request = require('supertest')
const path = require('path')
const fs = require('fs')
const app = require('../src/app')
const { Document, User } = require('../src/models')

describe('Upload Document with New Certificate Fields', () => {
  let token
  let userId

  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
    
    token = res.body.token
    userId = res.body.id
  })

  describe('Test 1: Full Data Upload (All fields populated)', () => {
    it('should upload master document with all 12 certificate fields', async () => {
      // Create a dummy PDF file for testing
      const testPdfPath = path.join(__dirname, 'test-document.pdf')
      if (!fs.existsSync(testPdfPath)) {
        // Create a minimal PDF file
        const pdfContent = Buffer.from('%PDF-1.4\n%EOF', 'utf8')
        fs.writeFileSync(testPdfPath, pdfContent)
      }

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Document - Full Data')
        .field('location', 'Jimbaran, Bali')
        .field('longitude', '-8.7208')
        .field('latitude', '115.1690')
        .field('description', 'This is a test document with all fields populated')
        .field('certificateType', 'SHGB')
        .field('landSize', '500 m²')
        .field('areaName', 'Jimbaran Hijau')
        .field('projectName', 'Luxury Villas Project')
        .field('zoneUrl', 'https://example.com/zone/jh-001')
        .field('zoneRtdr', 'Zone A1 - Residential')
        .field('publishDate', '2025-11-01')
        .field('expiredDate', '2030-11-01')
        .field('documentObtained', '2025-11-15')
        .field('originDocument', 'Original document from Land Office. Serial: 12345/2025. Condition: Good')
        .field('previousOwner', 'PT Bumi Pertiwi Indonesia')
        .field('company', 'JH')
        .attach('document', testPdfPath)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.document).toBeDefined()
      expect(response.body.document.title).toBe('Test Document - Full Data')
      expect(response.body.document.certificateType).toBe('SHGB')
      expect(response.body.document.landSize).toBe('500 m²')
      expect(response.body.document.areaName).toBe('Jimbaran Hijau')
      expect(response.body.document.projectName).toBe('Luxury Villas Project')
      expect(response.body.document.publishDate).toBeDefined()
      expect(response.body.document.company).toBe('JH')

      console.log('✅ Test 1 PASSED: Full data upload successful')
      console.log('Document ID:', response.body.document.id)
      console.log('Certificate Type:', response.body.document.certificateType)
      console.log('Company:', response.body.document.company)
    })
  })

  describe('Test 2: Mandatory Fields Only (Minimal data)', () => {
    it('should upload document with only mandatory fields', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')
      if (!fs.existsSync(testPdfPath)) {
        const pdfContent = Buffer.from('%PDF-1.4\n%EOF', 'utf8')
        fs.writeFileSync(testPdfPath, pdfContent)
      }

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Document - Minimal Data')
        .field('location', 'Jakarta, Indonesia')
        .field('certificateType', 'SHM')
        .field('publishDate', '2025-12-08')
        .field('company', 'JHT')
        .attach('document', testPdfPath)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.document).toBeDefined()
      expect(response.body.document.title).toBe('Test Document - Minimal Data')
      expect(response.body.document.certificateType).toBe('SHM')
      expect(response.body.document.company).toBe('JHT')
      // Optional fields should be null
      expect(response.body.document.landSize).toBeNull()
      expect(response.body.document.areaName).toBeNull()

      console.log('✅ Test 2 PASSED: Minimal data upload successful')
      console.log('Document ID:', response.body.document.id)
      console.log('Optional fields preserved as null')
    })
  })

  describe('Test 3: Sub-Document Upload with Full Data', () => {
    let masterDocId

    beforeAll(async () => {
      // First create a master document
      const testPdfPath = path.join(__dirname, 'test-document.pdf')
      if (!fs.existsSync(testPdfPath)) {
        const pdfContent = Buffer.from('%PDF-1.4\n%EOF', 'utf8')
        fs.writeFileSync(testPdfPath, pdfContent)
      }

      const masterRes = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Master Doc for Sub-test')
        .field('location', 'Bali')
        .field('certificateType', 'SHGB')
        .field('publishDate', '2025-11-01')
        .field('company', 'JH')
        .attach('document', testPdfPath)

      masterDocId = masterRes.body.document.id
    })

    it('should upload sub-document with all certificate fields', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')

      const response = await request(app)
        .post(`/api/documents/${masterDocId}/sub-document/upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Sub Document - Full Data')
        .field('location', 'Bali - Jimbaran')
        .field('subDocumentNo', 'SUB-001')
        .field('description', 'Sub document test with all fields')
        .field('certificateType', 'AJB')
        .field('landSize', '250 m²')
        .field('areaName', 'Jimbaran Hijau Phase 1')
        .field('projectName', 'Coastal Villas')
        .field('zoneUrl', 'https://example.com/zone/phase1')
        .field('zoneRtdr', 'Zone B2 - Commercial')
        .field('publishDate', '2025-10-01')
        .field('expiredDate', '2035-10-01')
        .field('documentObtained', '2025-10-20')
        .field('originDocument', 'Original from District Office')
        .field('previousOwner', 'Individual - I Made Wirawan')
        .field('company', 'JHT')
        .attach('document', testPdfPath)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.subDocument.title).toBe('Sub Document - Full Data')
      expect(response.body.subDocument.certificateType).toBe('AJB')
      expect(response.body.subDocument.company).toBe('JHT')

      console.log('✅ Test 3 PASSED: Sub-document full data upload successful')
      console.log('Sub-Document ID:', response.body.subDocument.id)
    })
  })

  describe('Test 4: Validation - Missing Mandatory Fields', () => {
    it('should fail when title is missing', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')
      if (!fs.existsSync(testPdfPath)) {
        const pdfContent = Buffer.from('%PDF-1.4\n%EOF', 'utf8')
        fs.writeFileSync(testPdfPath, pdfContent)
      }

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('location', 'Jakarta')
        .field('certificateType', 'SHM')
        .field('publishDate', '2025-12-08')
        .field('company', 'JH')
        .attach('document', testPdfPath)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('title')

      console.log('✅ Test 4a PASSED: Title validation working')
    })

    it('should fail when certificateType is missing', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Doc')
        .field('location', 'Jakarta')
        .field('publishDate', '2025-12-08')
        .field('company', 'JH')
        .attach('document', testPdfPath)

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('certificateType')

      console.log('✅ Test 4b PASSED: Certificate type validation working')
    })

    it('should fail when publishDate is missing', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Doc')
        .field('location', 'Jakarta')
        .field('certificateType', 'SHM')
        .field('company', 'JH')
        .attach('document', testPdfPath)

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('publishDate')

      console.log('✅ Test 4c PASSED: Publish date validation working')
    })

    it('should fail when company is missing', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Doc')
        .field('location', 'Jakarta')
        .field('certificateType', 'SHM')
        .field('publishDate', '2025-12-08')
        .attach('document', testPdfPath)

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('company')

      console.log('✅ Test 4d PASSED: Company validation working')
    })
  })

  describe('Test 5: Verify Data Persistence', () => {
    it('should fetch uploaded document and verify all fields are saved', async () => {
      const testPdfPath = path.join(__dirname, 'test-document.pdf')
      if (!fs.existsSync(testPdfPath)) {
        const pdfContent = Buffer.from('%PDF-1.4\n%EOF', 'utf8')
        fs.writeFileSync(testPdfPath, pdfContent)
      }

      // Upload document
      const uploadRes = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Verification Test Document')
        .field('location', 'Surabaya, Indonesia')
        .field('certificateType', 'HPL')
        .field('landSize', '1000 m²')
        .field('areaName', 'Industrial Zone')
        .field('publishDate', '2025-09-15')
        .field('company', 'BEP')
        .attach('document', testPdfPath)

      const docId = uploadRes.body.document.id

      // Fetch document
      const getRes = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`)

      const fetchedDoc = getRes.body.find(d => d.id === docId)

      expect(fetchedDoc).toBeDefined()
      expect(fetchedDoc.title).toBe('Verification Test Document')
      expect(fetchedDoc.certificateType).toBe('HPL')
      expect(fetchedDoc.landSize).toBe('1000 m²')
      expect(fetchedDoc.areaName).toBe('Industrial Zone')
      expect(fetchedDoc.company).toBe('BEP')
      expect(new Date(fetchedDoc.publishDate).toISOString().split('T')[0]).toBe('2025-09-15')

      console.log('✅ Test 5 PASSED: Data persistence verified')
      console.log('All fields correctly stored and retrieved')
    })
  })

  afterAll(async () => {
    // Cleanup
    const testPdfPath = path.join(__dirname, 'test-document.pdf')
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath)
    }
  })
})

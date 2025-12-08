import React, { useEffect, useState } from 'react'
import * as api from '../api'
import type { ApiDocument, ApiSubDocument } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import extractErrorMessage from '../utils/extractErrorMessage'

const DocumentsPage: React.FC = () => {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [description, setDescription] = useState('')
  const [certificateType, setCertificateType] = useState('')
  const [landSize, setLandSize] = useState('')
  const [areaName, setAreaName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [zoneUrl, setZoneUrl] = useState('')
  const [zoneRtdr, setZoneRtdr] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [expiredDate, setExpiredDate] = useState('')
  const [documentObtained, setDocumentObtained] = useState('')
  const [originDocument, setOriginDocument] = useState('')
  const [previousOwner, setPreviousOwner] = useState('')
  const [company, setCompany] = useState('')
  const [documentType, setDocumentType] = useState<'master' | 'sub'>('master')
  const [subDocumentNo, setSubDocumentNo] = useState('')
  const [parentDocumentId, setParentDocumentId] = useState('')
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set())
  const [editingSubDoc, setEditingSubDoc] = useState<{ id: number; currentNo: string } | null>(null)
  const [newSubDocNo, setNewSubDocNo] = useState('')
  const [editingDoc, setEditingDoc] = useState<{ id: number; title: string; location: string; longitude?: number | null; latitude?: number | null; description: string; type: 'master' | 'sub'; certificateType?: string; landSize?: string; areaName?: string; projectName?: string; zoneUrl?: string; zoneRtdr?: string; publishDate?: string; expiredDate?: string; documentObtained?: string; originDocument?: string; previousOwner?: string; company?: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editLongitude, setEditLongitude] = useState('')
  const [editLatitude, setEditLatitude] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCertificateType, setEditCertificateType] = useState('')
  const [editLandSize, setEditLandSize] = useState('')
  const [editAreaName, setEditAreaName] = useState('')
  const [editProjectName, setEditProjectName] = useState('')
  const [editZoneUrl, setEditZoneUrl] = useState('')
  const [editZoneRtdr, setEditZoneRtdr] = useState('')
  const [editPublishDate, setEditPublishDate] = useState('')
  const [editExpiredDate, setEditExpiredDate] = useState('')
  const [editDocumentObtained, setEditDocumentObtained] = useState('')
  const [editOriginDocument, setEditOriginDocument] = useState('')
  const [editPreviousOwner, setEditPreviousOwner] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [masterFilter, setMasterFilter] = useState<'all' | 'master-only' | 'master-with-subs'>('all')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: 'master' | 'sub'; title: string; hasSubDocs?: boolean } | null>(null)
  const [viewDocument, setViewDocument] = useState<{ id: number; type: 'master' | 'sub'; title: string; fileUrl: string } | null>(null)
  const [mapModal, setMapModal] = useState<{ longitude: number; latitude: number; title: string } | null>(null)
  const [detailModal, setDetailModal] = useState<ApiDocument | null>(null)
  const [detailSubModal, setDetailSubModal] = useState<ApiSubDocument | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  async function loadDocuments() {
    setLoading(true)
    try {
      const res = await api.getDocuments(token || undefined)
      setDocs(res)
    } catch (e: unknown) {
      console.error(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Debug map modal
  useEffect(() => {
    if (mapModal) {
      console.log('Map Modal State:', mapModal);
      console.log('Map URL will be:', `https://www.openstreetmap.org/export/embed.html?bbox=${mapModal.longitude - 0.01},${mapModal.latitude - 0.01},${mapModal.longitude + 0.01},${mapModal.latitude + 0.01}&layer=mapnik&marker=${mapModal.latitude},${mapModal.longitude}`);
    }
  }, [mapModal])

  // Anti-screenshot protection when viewing document
  useEffect(() => {
    if (viewDocument) {
      const preventScreenshot = (e: KeyboardEvent) => {
        // Prevent Print Screen, Cmd+Shift+3/4/5 (Mac), Windows+Shift+S
        if (
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
          (e.key === 's' && e.metaKey && e.shiftKey)
        ) {
          e.preventDefault()
          alert('⚠️ Screenshot dilarang! Dokumen ini dilindungi.')
          return false
        }
      }

      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        return false
      }

      document.addEventListener('keyup', preventScreenshot)
      document.addEventListener('keydown', preventScreenshot)
      document.addEventListener('contextmenu', preventContextMenu)

      return () => {
        document.removeEventListener('keyup', preventScreenshot)
        document.removeEventListener('keydown', preventScreenshot)
        document.removeEventListener('contextmenu', preventContextMenu)
        
        // Cleanup blob URL when component unmounts or document changes
        if (viewDocument?.fileUrl) {
          URL.revokeObjectURL(viewDocument.fileUrl)
        }
      }
    }
  }, [viewDocument])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    
    // Validate mandatory fields
    if (!title) {
      alert(`${t('forms.title')} ${t('forms.required')}`)
      return
    }
    if (!location) {
      alert(`${t('forms.location')} ${t('forms.required')}`)
      return
    }
    if (!certificateType) {
      alert(t('forms.certTypeRequired'))
      return
    }
    if (!publishDate) {
      alert(t('forms.publishDateRequired'))
      return
    }
    if (!company) {
      alert(t('forms.companyRequired'))
      return
    }
    
    // Validate PDF file
    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan!')
      return
    }
    
    const fd = new FormData()
    fd.append('document', file)
    fd.append('title', title)
    fd.append('location', location)
    if (longitude) fd.append('longitude', longitude)
    if (latitude) fd.append('latitude', latitude)
    fd.append('description', description)
    fd.append('certificateType', certificateType)
    if (landSize) fd.append('landSize', landSize)
    if (areaName) fd.append('areaName', areaName)
    if (projectName) fd.append('projectName', projectName)
    if (zoneUrl) fd.append('zoneUrl', zoneUrl)
    if (zoneRtdr) fd.append('zoneRtdr', zoneRtdr)
    fd.append('publishDate', publishDate)
    if (expiredDate) fd.append('expiredDate', expiredDate)
    if (documentObtained) fd.append('documentObtained', documentObtained)
    if (originDocument) fd.append('originDocument', originDocument)
    if (previousOwner) fd.append('previousOwner', previousOwner)
    fd.append('company', company)
    
    try {
      if (documentType === 'master') {
        await api.uploadDocument(fd, token || undefined)
      } else {
        // Sub document
        if (!parentDocumentId) {
          alert('Please select a Master Document')
          return
        }
        if (!subDocumentNo) {
          alert('Please enter Sub Document No')
          return
        }
        fd.append('parentDocumentId', parentDocumentId)
        fd.append('subDocumentNo', subDocumentNo)
        await api.uploadSubDocument(fd, token || undefined)
      }
      
      // Reload documents
      const res = await api.getDocuments(token || undefined)
      setDocs(res)
      
      // Reset form
      setTitle('')
      setLocation('')
      setLongitude('')
      setLatitude('')
      setDescription('')
      setCertificateType('')
      setLandSize('')
      setAreaName('')
      setProjectName('')
      setZoneUrl('')
      setZoneRtdr('')
      setPublishDate('')
      setExpiredDate('')
      setDocumentObtained('')
      setOriginDocument('')
      setPreviousOwner('')
      setCompany('')
      setFile(null)
      setDocumentType('master')
      setSubDocumentNo('')
      setParentDocumentId('')
      setShowUploadForm(false)
    } catch (err: unknown) {
      console.error(extractErrorMessage(err))
      alert('Upload failed: ' + extractErrorMessage(err))
    }
  }

  function toggleExpand(docId: number) {
    setExpandedDocs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  async function handleDownloadDocument(docId: number) {
    try {
      await api.downloadDocument(docId)
    } catch (err: unknown) {
      console.error(extractErrorMessage(err))
      alert('Download failed: ' + extractErrorMessage(err))
    }
  }

  async function handleDownloadSubDocument(subDocId: number) {
    try {
      await api.downloadSubDocument(subDocId)
    } catch (err: unknown) {
      console.error(extractErrorMessage(err))
      alert('Download failed: ' + extractErrorMessage(err))
    }
  }

  function openEditModal(subDocId: number, currentNo: string) {
    setEditingSubDoc({ id: subDocId, currentNo })
    // Extract number part for easier editing (SUB-001 -> 1)
    const numPart = currentNo.replace('SUB-', '').replace(/^0+/, '') || '1'
    setNewSubDocNo(numPart)
  }

  function closeEditModal() {
    setEditingSubDoc(null)
    setNewSubDocNo('')
  }

  async function handleUpdateSubDocNumber(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSubDoc) return

    try {
      await api.updateSubDocumentNumber(editingSubDoc.id, newSubDocNo, token || undefined)
      
      // Reload documents
      const res = await api.getDocuments(token || undefined)
      setDocs(res)
      
      closeEditModal()
    } catch (err: unknown) {
      console.error(extractErrorMessage(err))
      alert('Update failed: ' + extractErrorMessage(err))
    }
  }

  const openDocEditModal = (id: number, title: string, location: string, description: string, type: 'master' | 'sub', longitude?: number | null, latitude?: number | null, certificateType?: string, landSize?: string, areaName?: string, projectName?: string, zoneUrl?: string, zoneRtdr?: string, publishDate?: string, expiredDate?: string, documentObtained?: string, originDocument?: string, previousOwner?: string, company?: string) => {
    setEditingDoc({ id, title, location, longitude, latitude, description, type, certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr, publishDate, expiredDate, documentObtained, originDocument, previousOwner, company })
    setEditTitle(title)
    setEditLocation(location)
    setEditLongitude(longitude?.toString() || '')
    setEditLatitude(latitude?.toString() || '')
    setEditDescription(description)
    setEditCertificateType(certificateType || '')
    setEditLandSize(landSize || '')
    setEditAreaName(areaName || '')
    setEditProjectName(projectName || '')
    setEditZoneUrl(zoneUrl || '')
    setEditZoneRtdr(zoneRtdr || '')
    setEditPublishDate(publishDate || '')
    setEditExpiredDate(expiredDate || '')
    setEditDocumentObtained(documentObtained || '')
    setEditOriginDocument(originDocument || '')
    setEditPreviousOwner(previousOwner || '')
    setEditCompany(company || '')
  }

  function closeDocEditModal() {
    setEditingDoc(null)
    setEditTitle('')
    setEditLocation('')
    setEditLongitude('')
    setEditLatitude('')
    setEditDescription('')
    setEditCertificateType('')
    setEditLandSize('')
    setEditAreaName('')
    setEditProjectName('')
    setEditZoneUrl('')
    setEditZoneRtdr('')
    setEditPublishDate('')
    setEditExpiredDate('')
    setEditDocumentObtained('')
    setEditOriginDocument('')
    setEditPreviousOwner('')
    setEditCompany('')
  }

  async function handleUpdateDocInfo(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDoc) return

    try {
      const updateData = {
        title: editTitle,
        location: editLocation,
        description: editDescription,
        longitude: editLongitude || undefined,
        latitude: editLatitude || undefined,
        certificateType: editCertificateType || undefined,
        landSize: editLandSize || undefined,
        areaName: editAreaName || undefined,
        projectName: editProjectName || undefined,
        zoneUrl: editZoneUrl || undefined,
        zoneRtdr: editZoneRtdr || undefined,
        publishDate: editPublishDate || undefined,
        expiredDate: editExpiredDate || undefined,
        documentObtained: editDocumentObtained || undefined,
        originDocument: editOriginDocument || undefined,
        previousOwner: editPreviousOwner || undefined,
        company: editCompany || undefined
      }
      
      if (editingDoc.type === 'master') {
        await api.updateDocumentInfo(editingDoc.id, updateData, token || undefined)
      } else {
        await api.updateSubDocumentInfo(editingDoc.id, updateData, token || undefined)
      }
      
      // Reload documents
      const res = await api.getDocuments(token || undefined)
      setDocs(res)
      
      closeDocEditModal()
    } catch (err: unknown) {
      console.error(extractErrorMessage(err))
      alert('Update failed: ' + extractErrorMessage(err))
    }
  }

  const openDeleteConfirm = (id: number, type: 'master' | 'sub', title: string, hasSubDocs: boolean = false) => {
    setDeleteConfirm({ id, type, title, hasSubDocs })
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirm(null)
  }

  const handleDeleteDocument = async () => {
    if (!deleteConfirm) return
    
    try {
      if (deleteConfirm.type === 'master') {
        await api.deleteDocument(deleteConfirm.id)
      } else {
        await api.deleteSubDocument(deleteConfirm.id)
      }
      await loadDocuments()
      closeDeleteConfirm()
    } catch (error: unknown) {
      alert('Error deleting document: ' + extractErrorMessage(error))
    }
  }

  const handleViewDocument = async (id: number, type: 'master' | 'sub', title: string) => {
    try {
      if (!token) {
        throw new Error('No authentication token available')
      }

      const baseURL = ''
      const endpoint = type === 'master' ? `/api/documents/download/${id}` : `/api/documents/sub-document/download/${id}`
      const fullUrl = `${baseURL}${endpoint}`
      
      // Fetch file dengan token menggunakan credentials
      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = `HTTP ${response.status}`
        
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } else {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(`Failed to fetch document: ${errorMessage}`)
      }
      
      // Buat blob URL dari response
      const blob = await response.blob()
      const fileUrl = URL.createObjectURL(blob)
      
      setViewDocument({ id, type, title, fileUrl })
    } catch (error: unknown) {
      console.error('View document error:', error)
      alert('Error viewing document: ' + extractErrorMessage(error))
    }
  }

  const closeViewDocument = () => {
    // Revoke blob URL untuk free memory
    if (viewDocument?.fileUrl) {
      URL.revokeObjectURL(viewDocument.fileUrl)
    }
    setViewDocument(null)
  }

  // Filter and search documents
  const filteredDocs = docs
    .filter(d => {
      // Master filter
      if (masterFilter === 'master-only') {
        // Hanya tampilkan master dokumen tanpa sub dokumen
        if (d.subDocuments && d.subDocuments.length > 0) return false
      } else if (masterFilter === 'master-with-subs') {
        // Hanya tampilkan master dokumen yang memiliki sub dokumen
        if (!d.subDocuments || d.subDocuments.length === 0) return false
      }
      
      // Search filter (by title, documentNo, or subdocument title/number)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchMaster = d.title.toLowerCase().includes(query) || 
                           d.documentNo.toLowerCase().includes(query)
        
        // Check if any subdocument matches
        const matchSub = d.subDocuments?.some(sub => 
          sub.title.toLowerCase().includes(query) || 
          sub.subDocumentNo.toLowerCase().includes(query)
        )
        
        return matchMaster || matchSub
      }
      
      return true
    })
    // Sort by newest first (descending by id)
    .sort((a, b) => b.id - a.id)

  // Pagination
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocs = filteredDocs.slice(startIndex, endIndex)

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, masterFilter])

  return (
    <div className="documents-page-container">
      <div className="documents-header">
        <div>
          <h1 className="documents-main-title">Manajemen Dokumen</h1>
          <p className="documents-subtitle">Kelola dokumen dan sub-dokumen dalam sistem</p>
        </div>
        <button 
          className="btn primary" 
          onClick={() => setShowUploadForm(!showUploadForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '1.2rem' }}>+</span> Tambah Dokumen
        </button>
      </div>

      {/* Search and Filter */}
      <div className="documents-search-section">
        <div className="search-box" style={{ flex: 2 }}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Cari dokumen berdasarkan judul"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="role-filter"
          value={masterFilter}
          onChange={(e) => setMasterFilter(e.target.value as typeof masterFilter)}
        >
          <option value="all">Semua Dokumen</option>
          <option value="master-only">Master Saja</option>
          <option value="master-with-subs">Master dengan Sub Dokumen</option>
        </select>
      </div>

      {/* Upload Form - Collapsible */}
      {showUploadForm && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Upload Dokumen Baru</h3>
          <form className="form" onSubmit={handleUpload}>
            <label>
              Document Type
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value as 'master' | 'sub')}>
                <option value="master">{t('documents.list')}</option>
                <option value="sub">Sub-Document</option>
              </select>
            </label>

            {documentType === 'sub' && (
              <>
                <label>
                  {t('forms.masterDocument')}
                  <select value={parentDocumentId} onChange={(e) => setParentDocumentId(e.target.value)} required>
                    <option value="">{t('forms.selectMasterDocument')}</option>
                    {docs.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('forms.subDocumentNo')}
                  <input 
                    value={subDocumentNo} 
                    onChange={(e) => setSubDocumentNo(e.target.value)} 
                    placeholder={t('forms.subDocumentPlaceholder')}
                    required 
                  />
                </label>
              </>
            )}

            <label>
              <span>{t('forms.title')} <span style={{ color: '#dc2626' }}>*</span></span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              <span>{t('forms.location')} <span style={{ color: '#dc2626' }}>*</span></span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label>
                Longitude (Opsional)
                <input 
                  type="number" 
                  step="any" 
                  value={longitude} 
                  onChange={(e) => setLongitude(e.target.value)} 
                  placeholder="contoh: -197.491239"
                />
              </label>
              <label>
                Latitude (Opsional)
                <input 
                  type="number" 
                  step="any" 
                  value={latitude} 
                  onChange={(e) => setLatitude(e.target.value)} 
                  placeholder="contoh: 104.37124"
                />
              </label>
            </div>
            <label>
              {t('forms.description')}
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder={t('forms.descriptionPlaceholder')}
                maxLength={350}
                rows={4}
                style={{ 
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'transparent',
                  color: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#9aa4b2', marginTop: '0.25rem' }}>
                {description.length}/350 karakter
              </span>
            </label>

            {/* NEW CERTIFICATE & PROPERTY FIELDS */}
            <label>
              <span>{t('forms.certificateType')} <span style={{ color: '#ff6b6b' }}>*</span></span>
              <select value={certificateType} onChange={(e) => setCertificateType(e.target.value)} required>
                <option value="">{t('forms.selectCertificate')}</option>
                <option value="SHM">SHM</option>
                <option value="SHGB">SHGB</option>
                <option value="SHGU">SHGU</option>
                <option value="SHP">SHP</option>
                <option value="HPL">HPL</option>
                <option value="AJB">AJB</option>
                <option value="Girik">Girik/Petok D/Letter C</option>
                <option value="Others">Others</option>
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label>
                {t('forms.landSize')}
                <input 
                  value={landSize} 
                  onChange={(e) => setLandSize(e.target.value)} 
                  placeholder={t('forms.landSizePlaceholder')}
                />
              </label>
              <label>
                {t('forms.areaName')}
                <input 
                  value={areaName} 
                  onChange={(e) => setAreaName(e.target.value)} 
                  placeholder={t('forms.areaNamePlaceholder')}
                />
              </label>
            </div>

            <label>
              {t('forms.projectName')}
              <input 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                placeholder={t('forms.projectNamePlaceholder')}
              />
            </label>

            <label>
              {t('forms.zoneUrl')}
              <input 
                value={zoneUrl} 
                onChange={(e) => setZoneUrl(e.target.value)} 
                placeholder="https://..."
              />
            </label>

            <label>
              {t('forms.zoneRtdr')}
              <input 
                value={zoneRtdr} 
                onChange={(e) => setZoneRtdr(e.target.value)} 
                placeholder="e.g., (W) Pariwisata"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label>
                <div style={{ marginBottom: '0.5rem' }}>
                  {t('forms.publishDate')} <span style={{ color: '#ff6b6b' }}>*</span>
                </div>
                <input 
                  type="date"
                  value={publishDate} 
                  onChange={(e) => setPublishDate(e.target.value)} 
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </label>
              <label>
                <div style={{ marginBottom: '0.5rem' }}>
                  {t('forms.expiredDate')}
                </div>
                <input 
                  type="date"
                  value={expiredDate} 
                  onChange={(e) => setExpiredDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </label>
            </div>

            <label>
              {t('forms.documentObtained')}
              <input 
                type="date"
                value={documentObtained} 
                onChange={(e) => setDocumentObtained(e.target.value)} 
              />
            </label>

            <label>
              {t('forms.originDocument')}
              <input 
                value={originDocument} 
                onChange={(e) => setOriginDocument(e.target.value)} 
                placeholder="e.g., AJB No. 292/2011 Notaris Dewi Eka Koreati"
              />
            </label>

            <label>
              {t('forms.previousOwner')}
              <input 
                value={previousOwner} 
                onChange={(e) => setPreviousOwner(e.target.value)} 
                placeholder="e.g., PT. Citratama Selaras"
              />
            </label>

            <label>
              <span>Company <span style={{ color: '#ff6b6b' }}>*</span></span>
              <select value={company} onChange={(e) => setCompany(e.target.value)} required>
                <option value="">-- Pilih Perusahaan --</option>
                <option value="JH">JH</option>
                <option value="JHT">JHT</option>
                <option value="BEP">BEP</option>
                <option value="PIJ">PIJ</option>
              </select>
            </label>

            <label>
              {t('forms.filePdf')}
              <input 
                type="file" 
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required 
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn primary" type="submit">{t('buttons.upload')}</button>
              <button className="btn ghost" type="button" onClick={() => setShowUploadForm(false)}>{t('buttons.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>{t('documents.documentList')} ({filteredDocs.length})</h3>

      {loading ? (
        <p>{t('buttons.loading')}</p>
      ) : paginatedDocs.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
          {searchQuery ? t('documents.noMatchingDocuments') : t('documents.noDocumentsYet')}
        </p>
      ) : (
        <>
        <div className="doc-container">
          {paginatedDocs.map((d) => (
            <div key={d.id} className="doc-master">
              <div className="doc-header">
                <div className="doc-left">
                  {d.subDocuments && d.subDocuments.length > 0 && (
                    <button 
                      onClick={() => toggleExpand(d.id)} 
                      className={`doc-toggle ${expandedDocs.has(d.id) ? 'expanded' : ''}`}
                      title={expandedDocs.has(d.id) ? 'Collapse' : 'Expand'}
                    >
                      {expandedDocs.has(d.id) ? '▼' : '▶'}
                    </button>
                  )}
                  <div className="doc-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="doc-id-badge">{d.documentNo}</div>
                      <button
                        onClick={() => setDetailModal(d)}
                        className="info-btn"
                        title="Lihat detail informasi sertifikat"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          fontSize: '1.2rem',
                          color: '#7c3aed',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#9333ea'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#7c3aed'}
                      >
                        ⓘ
                      </button>
                    </div>
                    <div className="doc-title">{d.title}</div>
                    <div className="doc-location">{d.location}</div>
                    {(d.longitude !== null && d.latitude !== null) && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Opening map for:', { longitude: d.longitude, latitude: d.latitude, title: d.title });
                          setMapModal({ longitude: d.longitude!, latitude: d.latitude!, title: d.title });
                        }}
                        style={{ 
                          fontSize: '0.85rem', 
                          color: '#7c3aed', 
                          marginTop: '0.25rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          transition: 'color 0.2s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#9333ea'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#7c3aed'}
                        title="Klik untuk melihat peta"
                      >
                        📍 Lokasi pada peta : {d.longitude}, {d.latitude}
                      </div>
                    )}
                    {d.description && <div className="doc-description">{d.description}</div>}
                    
                    {d.subDocuments && d.subDocuments.length > 0 && (
                      <div className="doc-count">
                        <span className="doc-count-number">{d.subDocuments.length}</span>
                        <span>sub-document{d.subDocuments.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="doc-actions">
                  <button 
                    onClick={() => openDocEditModal(d.id, d.title, d.location, d.description || '', 'master', d.longitude, d.latitude, d.certificateType, d.landSize, d.areaName, d.projectName, d.zoneUrl, d.zoneRtdr, d.publishDate, d.expiredDate, d.documentObtained, d.originDocument, d.previousOwner, d.company)}
                    className="btn ghost"
                    title="Edit document"
                  >
                    ✏️ {t('buttons.edit')}
                  </button>
                  <button 
                    onClick={() => handleViewDocument(d.id, 'master', d.title)}
                    className="btn ghost"
                    title="View document"
                  >
                    👁️ {t('buttons.view')}
                  </button>
                  <button onClick={() => handleDownloadDocument(d.id)} className="btn">{t('buttons.download')}</button>
                  <button 
                    onClick={() => openDeleteConfirm(d.id, 'master', d.title, (d.subDocuments?.length || 0) > 0)}
                    className="btn small danger"
                    title="Delete document"
                  >
                    🗑️ {t('buttons.delete')}
                  </button>
                </div>
              </div>
              
              {expandedDocs.has(d.id) && d.subDocuments && d.subDocuments.length > 0 && (
                <div className="subdoc-container">
                  {d.subDocuments.map((sub) => (
                    <div key={sub.id} className="subdoc-item">
                      <div className="subdoc-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <button 
                            onClick={() => openEditModal(sub.id, sub.subDocumentNo)}
                            className="subdoc-number"
                            title="Click to edit number"
                            style={{ cursor: 'pointer', border: '1px solid rgba(124,58,237,0.3)' }}
                          >
                            {sub.subDocumentNo}
                          </button>
                          <button
                            onClick={() => setDetailSubModal(sub)}
                            className="info-btn"
                            title="Lihat detail informasi sub-dokumen"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              fontSize: '1rem',
                              color: '#7c3aed',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#9333ea'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#7c3aed'}
                          >
                            ⓘ
                          </button>
                        </div>
                        <div className="subdoc-title">{sub.title}</div>
                        <div className="subdoc-location">{sub.location}</div>
                        {(sub.longitude !== null && sub.latitude !== null) && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Opening map for subdoc:', { longitude: sub.longitude, latitude: sub.latitude, title: sub.title });
                              setMapModal({ longitude: sub.longitude!, latitude: sub.latitude!, title: sub.title });
                            }}
                            style={{ 
                              fontSize: '0.85rem', 
                              color: '#7c3aed', 
                              marginTop: '0.25rem',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              transition: 'color 0.2s',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#9333ea'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#7c3aed'}
                            title="Klik untuk melihat peta"
                          >
                            📍 Lokasi pada peta : {sub.longitude}, {sub.latitude}
                          </div>
                        )}
                        {sub.description && <div className="subdoc-description">{sub.description}</div>}
                        
                        {/* Certificate & Property Information for Sub-Documents */}
                        {(sub.certificateType || sub.landSize || sub.areaName || sub.projectName || sub.zoneUrl || sub.zoneRtdr || sub.publishDate || sub.expiredDate || sub.documentObtained || sub.originDocument || sub.previousOwner || sub.company) && (
                          <div style={{ 
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid #e0e4e8',
                            fontSize: '0.8rem'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.8rem' }}>
                              {sub.certificateType && (
                                <div>
                                  <span style={{ color: '#7c7e8b', fontWeight: 500 }}>Tipe:</span>
                                  <div style={{ color: '#1d2e4a', marginTop: '0.05rem' }}>{sub.certificateType}</div>
                                </div>
                              )}
                              {sub.landSize && (
                                <div>
                                  <span style={{ color: '#7c7e8b', fontWeight: 500 }}>Luas:</span>
                                  <div style={{ color: '#1d2e4a', marginTop: '0.05rem' }}>{sub.landSize}</div>
                                </div>
                              )}
                              {sub.areaName && (
                                <div>
                                  <span style={{ color: '#7c7e8b', fontWeight: 500 }}>Area:</span>
                                  <div style={{ color: '#1d2e4a', marginTop: '0.05rem' }}>{sub.areaName}</div>
                                </div>
                              )}
                              {sub.projectName && (
                                <div>
                                  <span style={{ color: '#7c7e8b', fontWeight: 500 }}>Proyek:</span>
                                  <div style={{ color: '#1d2e4a', marginTop: '0.05rem' }}>{sub.projectName}</div>
                                </div>
                              )}
                              {sub.company && (
                                <div>
                                  <span style={{ color: '#7c7e8b', fontWeight: 500 }}>Perusahaan:</span>
                                  <div style={{ color: '#1d2e4a', marginTop: '0.05rem' }}>{sub.company}</div>
                                </div>
                              )}
                              {sub.publishDate && (
                                <div>
                                  <span style={{ color: '#7c7e8b', fontWeight: 500 }}>Diterbitkan:</span>
                                  <div style={{ color: '#1d2e4a', marginTop: '0.05rem' }}>{new Date(sub.publishDate).toLocaleDateString('id-ID')}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="doc-actions">
                        <button 
                          onClick={() => openDocEditModal(sub.id, sub.title, sub.location, sub.description || '', 'sub', sub.longitude, sub.latitude, sub.certificateType, sub.landSize, sub.areaName, sub.projectName, sub.zoneUrl, sub.zoneRtdr, sub.publishDate, sub.expiredDate, sub.documentObtained, sub.originDocument, sub.previousOwner, sub.company)}
                          className="btn ghost"
                          title="Edit sub-document"
                          style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleViewDocument(sub.id, 'sub', sub.title)}
                          className="btn ghost"
                          title="View sub-document"
                          style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        >
                          👁️
                        </button>
                        <button onClick={() => handleDownloadSubDocument(sub.id)} className="btn">{t('buttons.download')}</button>
                        <button 
                          onClick={() => openDeleteConfirm(sub.id, 'sub', sub.title)}
                          className="btn small danger"
                          title="Delete sub-document"
                          style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn small ghost"
              style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              ← {t('buttons.previous')}
            </button>
            
            <div className="pagination-info">
              {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
              <span className="muted" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                ({startIndex + 1}-{Math.min(endIndex, filteredDocs.length)} {t('pagination.of')} {filteredDocs.length})
              </span>
            </div>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn small ghost"
              style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              {t('buttons.next')} →
            </button>
          </div>
        )}
        </>
      )}
      </div> {/* End of Documents List card */}

      {/* Edit Sub-Document Number Modal */}
      {editingSubDoc && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('modals.editSubDocumentNo')}</h3>
            <p className="muted">{t('modals.currentNo')} {editingSubDoc.currentNo}</p>
            <form onSubmit={handleUpdateSubDocNumber}>
              <label>
                {t('modals.newNumber')}
                <input 
                  type="text" 
                  value={newSubDocNo} 
                  onChange={(e) => setNewSubDocNo(e.target.value)}
                  placeholder={t('modals.newNumberPlaceholder')}
                  required
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="btn ghost">{t('buttons.cancel')}</button>
                <button type="submit" className="btn primary">{t('buttons.update')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Info Modal */}
      {editingDoc && (
        <div className="modal-overlay" onClick={closeDocEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('modals.editDocument')}</h3>
            <form onSubmit={handleUpdateDocInfo}>
              <label>
                {t('forms.title')}
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label>
                {t('forms.location')}
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label>
                  {t('forms.longitude')}
                  <input 
                    type="number" 
                    step="any" 
                    value={editLongitude} 
                    onChange={(e) => setEditLongitude(e.target.value)} 
                    placeholder="contoh: -197.491239"
                  />
                </label>
                <label>
                  {t('forms.latitude')}
                  <input 
                    type="number" 
                    step="any" 
                    value={editLatitude} 
                    onChange={(e) => setEditLatitude(e.target.value)} 
                    placeholder="contoh: 104.37124"
                  />
                </label>
              </div>
              <label>
                {t('forms.description')}
                <textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={350}
                  rows={4}
                  placeholder={t('forms.descriptionPlaceholder')}
                  style={{ 
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem'
                  }}
                />
                <small style={{ color: '#9aa4b2', marginTop: '0.25rem' }}>
                  {editDescription.length}/350 {t('forms.charCount')}
                </small>
              </label>
              
              {/* Informasi Sertifikat & Properti Section */}
              <div>
                <label>
                  <span>{t('forms.certificateType')} <span style={{ color: '#dc2626' }}>*</span></span>
                  <select 
                    value={editCertificateType} 
                    onChange={(e) => setEditCertificateType(e.target.value)}
                  >
                    <option value="">{t('forms.selectCertificate')}</option>
                    <option value="SHM">SHM</option>
                    <option value="SHGB">SHGB</option>
                    <option value="SHGU">SHGU</option>
                    <option value="SHP">SHP</option>
                    <option value="HPL">HPL</option>
                    <option value="AJB">AJB</option>
                    <option value="Girik">Girik</option>
                    <option value="Others">Others</option>
                  </select>
                </label>
                
                <label>
                  {t('forms.landSize')}
                  <input 
                    type="text" 
                    value={editLandSize} 
                    onChange={(e) => setEditLandSize(e.target.value)}
                    placeholder={t('forms.landSizePlaceholder')}
                  />
                </label>
                
                <label>
                  {t('forms.areaName')}
                  <input 
                    type="text" 
                    value={editAreaName} 
                    onChange={(e) => setEditAreaName(e.target.value)}
                    placeholder={t('forms.areaNamePlaceholder')}
                  />
                </label>
                
                <label>
                  {t('forms.projectName')}
                  <input 
                    type="text" 
                    value={editProjectName} 
                    onChange={(e) => setEditProjectName(e.target.value)}
                    placeholder={t('forms.projectNamePlaceholder')}
                  />
                </label>
                
                <label>
                  {t('forms.zoneUrl')}
                  <input 
                    type="text" 
                    value={editZoneUrl} 
                    onChange={(e) => setEditZoneUrl(e.target.value)}
                    placeholder="contoh: https://example.com"
                  />
                </label>
                
                <label>
                  {t('forms.zoneRtdr')}
                  <input 
                    type="text" 
                    value={editZoneRtdr} 
                    onChange={(e) => setEditZoneRtdr(e.target.value)}
                    placeholder="contoh: Zone A"
                  />
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label>
                    <div style={{ marginBottom: '0.5rem' }}>
                      {t('forms.publishDate')} <span style={{ color: '#dc2626' }}>*</span>
                    </div>
                    <input 
                      type="date" 
                      value={editPublishDate} 
                      onChange={(e) => setEditPublishDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label>
                    <div style={{ marginBottom: '0.5rem' }}>
                      {t('forms.expiredDate')}
                    </div>
                    <input 
                      type="date" 
                      value={editExpiredDate} 
                      onChange={(e) => setEditExpiredDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>
                
                <label>
                  {t('forms.documentObtained')}
                  <input 
                    type="date" 
                    value={editDocumentObtained} 
                    onChange={(e) => setEditDocumentObtained(e.target.value)}
                  />
                </label>
                
                <label>
                  {t('forms.originDocument')}
                  <textarea 
                    value={editOriginDocument} 
                    onChange={(e) => setEditOriginDocument(e.target.value)}
                    placeholder="Keterangan dokumen asli..."
                    style={{ 
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem'
                    }}
                  />
                </label>
                
                <label>
                  {t('forms.previousOwner')}
                  <input 
                    type="text" 
                    value={editPreviousOwner} 
                    onChange={(e) => setEditPreviousOwner(e.target.value)}
                    placeholder="Nama pemilik sebelumnya"
                  />
                </label>
                
                <label>
                  <span>{t('forms.company')} <span style={{ color: '#dc2626' }}>*</span></span>
                  <select 
                    value={editCompany} 
                    onChange={(e) => setEditCompany(e.target.value)}
                  >
                    <option value="">{t('forms.selectCompany')}</option>
                    <option value="JH">JH</option>
                    <option value="JHT">JHT</option>
                    <option value="BEP">BEP</option>
                    <option value="PIJ">PIJ</option>
                  </select>
                </label>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={closeDocEditModal} className="btn ghost">{t('buttons.cancel')}</button>
                <button type="submit" className="btn primary">{t('buttons.update')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('modals.deleteConfirmation')}</h3>
            <p className="muted">
              {deleteConfirm.type === 'master' && deleteConfirm.hasSubDocs ? (
                <>
                  <strong style={{ color: '#f97316' }}>⚠️ {t('modals.warning')}</strong> {t('modals.deleteWithSubsMessage')}
                </>
              ) : (
                <>
                  {t('modals.deleteMessage')}
                  <br /><br />
                  {t('modals.cannotBeUndone')}
                </>
              )}
            </p>
            <div className="modal-actions">
              <button type="button" onClick={closeDeleteConfirm} className="btn ghost">{t('buttons.cancel')}</button>
              <button 
                type="button" 
                onClick={handleDeleteDocument} 
                className="btn danger"
                style={{ background: 'linear-gradient(90deg, rgba(220,38,38,0.8), rgba(185,28,28,0.8))' }}
              >
                {t('modals.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal with Watermark */}
      {viewDocument && (
        <div className="modal-overlay view-modal-overlay" onClick={closeViewDocument}>
          <div className="modal-content view-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h3>📄 {viewDocument.title}</h3>
              <button onClick={closeViewDocument} className="btn ghost" style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>×</button>
            </div>
            <div className="document-viewer">
              <div className="watermark-overlay">
                <div className="watermark-text">{t('modals.watermarkConfidential')}</div>
                <div className="watermark-text watermark-diagonal">{t('modals.watermarkDoNotCopy')}</div>
                <div className="watermark-text watermark-center">{t('modals.watermarkPreview')}</div>
              </div>
              <iframe 
                src={`${viewDocument.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                title={viewDocument.title}
                className="document-iframe"
              />
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapModal && (
        <div className="modal-overlay" onClick={() => setMapModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>🗺️ {t('modals.location')}: {mapModal.title}</h3>
              <button onClick={() => setMapModal(null)} className="btn ghost" style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>×</button>
            </div>
            <div style={{ 
              background: '#1a1d29', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(124,58,237,0.3)',
              position: 'relative'
            }}>
              <iframe
                width="100%"
                height="500"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapModal.longitude) - 0.01},${Number(mapModal.latitude) - 0.01},${Number(mapModal.longitude) + 0.01},${Number(mapModal.latitude) + 0.01}&layer=mapnik&marker=${Number(mapModal.latitude)},${Number(mapModal.longitude)}`}
              />
              <div style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px', 
                background: 'rgba(0,0,0,0.7)', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                backdropFilter: 'blur(4px)'
              }}>
                📍 {Number(mapModal.latitude).toFixed(6)}, {Number(mapModal.longitude).toFixed(6)}
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(124,58,237,0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
                <strong>Koordinat:</strong> Lat: {Number(mapModal.latitude)}, Long: {Number(mapModal.longitude)}
              </div>
              <a 
                href={`https://www.google.com/maps?q=${Number(mapModal.latitude)},${Number(mapModal.longitude)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                🗺️ Buka di Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', maxHeight: '85vh', overflowY: 'auto', background: '#0f1419', border: '1px solid rgba(124,58,237,0.3)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#a0a4b0', marginBottom: '0.5rem', fontWeight: 500 }}>Kode Dokumen</div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', color: '#ffffff', fontWeight: 700 }}>{detailModal.documentNo}</h2>
                <p style={{ margin: '0', color: '#c0c4cc', fontSize: '0.95rem' }}>{detailModal.title}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="btn ghost" style={{ fontSize: '2rem', padding: '0', width: '2rem', height: '2rem', color: '#ffffff' }}>×</button>
            </div>

            {/* Info Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                {/* Basic Info */}
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#9d4edd', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Informasi Dasar</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Judul Dokumen</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.title}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Lokasi</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.location}</div>
                    </div>
                    {detailModal.description && (
                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Deskripsi</span>
                        <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', lineHeight: 1.6 }}>{detailModal.description}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Info */}
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#9d4edd', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📜 Informasi Sertifikat</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                    {detailModal.certificateType && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Tipe Sertifikat</span>
                        <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 600, padding: '0.5rem 0.75rem', background: 'rgba(157,78,221,0.25)', borderRadius: '6px', width: 'fit-content', border: '1px solid rgba(157,78,221,0.4)' }}>{detailModal.certificateType}</div>
                      </div>
                    )}
                    {detailModal.company && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Perusahaan</span>
                        <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.company}</div>
                      </div>
                    )}
                    {detailModal.publishDate && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Tanggal Diterbitkan</span>
                        <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailModal.publishDate).toLocaleDateString('id-ID')}</div>
                      </div>
                    )}
                    {detailModal.expiredDate && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Tanggal Kadaluarsa</span>
                        <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailModal.expiredDate).toLocaleDateString('id-ID')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            {(detailModal.landSize || detailModal.areaName || detailModal.projectName || detailModal.zoneUrl || detailModal.zoneRtdr || detailModal.documentObtained || detailModal.originDocument || detailModal.previousOwner) && (
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(124,58,237,0.3)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#9d4edd', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏘️ Informasi Properti</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                  {detailModal.landSize && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Luas Tanah</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.landSize}</div></div>)}
                  {detailModal.areaName && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nama Area</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.areaName}</div></div>)}
                  {detailModal.projectName && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nama Proyek</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.projectName}</div></div>)}
                  {detailModal.zoneUrl && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>URL Zone</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500, wordBreak: 'break-all' }}><a href={detailModal.zoneUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#9d4edd', textDecoration: 'underline' }}>{detailModal.zoneUrl}</a></div></div>)}
                  {detailModal.zoneRtdr && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Zone RTDR</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.zoneRtdr}</div></div>)}
                  {detailModal.documentObtained && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Tanggal Dokumen</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailModal.documentObtained).toLocaleDateString('id-ID')}</div></div>)}
                  {detailModal.originDocument && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Dokumen Asal</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.originDocument}</div></div>)}
                  {detailModal.previousOwner && (<div><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Pemilik Sebelumnya</span><div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.previousOwner}</div></div>)}
                </div>
              </div>
            )}

            {/* Location */}
            {(detailModal.longitude !== null && detailModal.latitude !== null) && (
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ background: 'rgba(157,78,221,0.15)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(157,78,221,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>📍 Koordinat</div><div style={{ color: '#e8ecf1', fontSize: '0.95rem', fontFamily: 'monospace', marginTop: '0.25rem', fontWeight: 500 }}>Lat: {Number(detailModal.latitude).toFixed(6)}<br />Long: {Number(detailModal.longitude).toFixed(6)}</div></div>
                    <a href={`https://www.google.com/maps?q=${Number(detailModal.latitude)},${Number(detailModal.longitude)}`} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>🗺️ Google Maps</a>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(124,58,237,0.3)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailModal(null)} className="btn secondary">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Document Detail Modal */}
      {detailSubModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0f1419', borderRadius: '12px', padding: '2rem', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#a0a4b0', fontWeight: 600, marginBottom: '0.5rem' }}>Sub-dokumen</div>
                <div style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 700 }}>{detailSubModal.subDocumentNo}</div>
              </div>
              <button onClick={() => setDetailSubModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0a4b0' }}>✕</button>
            </div>

            {/* Basic Info */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
              <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📋 Informasi Dasar</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                {detailSubModal.title && (
                  <div>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Judul</span>
                    <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.title}</div>
                  </div>
                )}
                {detailSubModal.location && (
                  <div>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Lokasi</span>
                    <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.location}</div>
                  </div>
                )}
                {detailSubModal.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Deskripsi</span>
                    <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500, lineHeight: '1.5' }}>{detailSubModal.description}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Info */}
            {(detailSubModal.certificateType || detailSubModal.landSize || detailSubModal.areaName || detailSubModal.projectName) && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📜 Informasi Sertifikat</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                  {detailSubModal.certificateType && (
                    <div>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Tipe Sertifikat</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 600, padding: '0.5rem 0.75rem', background: 'rgba(157,78,221,0.25)', borderRadius: '6px', width: 'fit-content', border: '1px solid rgba(157,78,221,0.4)' }}>{detailSubModal.certificateType}</div>
                    </div>
                  )}
                  {detailSubModal.landSize && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Ukuran Lahan</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.landSize}</div>
                    </div>
                  )}
                  {detailSubModal.areaName && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Nama Area</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.areaName}</div>
                    </div>
                  )}
                  {detailSubModal.projectName && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Nama Proyek</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.projectName}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Property Info */}
            {(detailSubModal.zoneUrl || detailSubModal.zoneRtdr || detailSubModal.originDocument || detailSubModal.previousOwner) && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏘️ Informasi Properti</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                  {detailSubModal.zoneUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Zone URL</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500, wordBreak: 'break-all' }}>{detailSubModal.zoneUrl}</div>
                    </div>
                  )}
                  {detailSubModal.zoneRtdr && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Zone RTDR</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.zoneRtdr}</div>
                    </div>
                  )}
                  {detailSubModal.originDocument && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Dokumen Asal</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.originDocument}</div>
                    </div>
                  )}
                  {detailSubModal.previousOwner && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Pemilik Sebelumnya</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.previousOwner}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Details */}
            {(detailSubModal.publishDate || detailSubModal.expiredDate || detailSubModal.documentObtained || detailSubModal.company) && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📄 Detail Dokumen</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                  {detailSubModal.publishDate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Tanggal Diterbitkan</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailSubModal.publishDate).toLocaleDateString('id-ID')}</div>
                    </div>
                  )}
                  {detailSubModal.expiredDate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Tanggal Kadaluarsa</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailSubModal.expiredDate).toLocaleDateString('id-ID')}</div>
                    </div>
                  )}
                  {detailSubModal.documentObtained && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Dokumen Diperoleh</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.documentObtained}</div>
                    </div>
                  )}
                  {detailSubModal.company && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Perusahaan</span>
                      <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.company}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {(detailSubModal.longitude !== null && detailSubModal.latitude !== null) && (
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ background: 'rgba(157,78,221,0.15)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(157,78,221,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>📍 Koordinat</div><div style={{ color: '#e8ecf1', fontSize: '0.95rem', fontFamily: 'monospace', marginTop: '0.25rem', fontWeight: 500 }}>Lat: {Number(detailSubModal.latitude).toFixed(6)}<br />Long: {Number(detailSubModal.longitude).toFixed(6)}</div></div>
                    <a href={`https://www.google.com/maps?q=${Number(detailSubModal.latitude)},${Number(detailSubModal.longitude)}`} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>🗺️ Google Maps</a>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(124,58,237,0.3)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailSubModal(null)} className="btn secondary">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentsPage


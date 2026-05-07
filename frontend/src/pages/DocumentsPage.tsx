import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as api from '../api'
import type { ApiDocument, ApiSubDocument, ApiDocumentVersion } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import extractErrorMessage from '../utils/extractErrorMessage'
import LocationInput from '../components/LocationInput'

const DocumentsPage: React.FC = () => {
  const { token, user } = useAuth()
  const { t } = useLanguage()
  const routeLocation = useLocation()
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [description, setDescription] = useState('')
  const [permitNumber, setPermitNumber] = useState('')
  const [certificateType, setCertificateType] = useState('')
  const [landSize, setLandSize] = useState('')
  const [areaName, setAreaName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [zoneUrl, setZoneUrl] = useState('')
  const [zoneRtdr, setZoneRtdr] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [expiredDate, setExpiredDate] = useState('')
  const [documentObtained, setDocumentObtained] = useState('')
  const [issuingAgency, setIssuingAgency] = useState('')
  const [originDocument, setOriginDocument] = useState('')
  const [physicalLocation, setPhysicalLocation] = useState('')
  const [physicalLocationDetail, setPhysicalLocationDetail] = useState('')
  const [previousOwner, setPreviousOwner] = useState('')
  const [company, setCompany] = useState('')
  const [documentType, setDocumentType] = useState<'master' | 'sub'>('master')
  const [category, setCategory] = useState<'Corporate Document' | 'Permit Document'>('Corporate Document')
  const [subDocumentNo, setSubDocumentNo] = useState('')
  const [parentDocumentId, setParentDocumentId] = useState('')
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set())
  const [editingSubDoc, setEditingSubDoc] = useState<{ id: number; currentNo: string } | null>(null)
  const [newSubDocNo, setNewSubDocNo] = useState('')
  const [editingDoc, setEditingDoc] = useState<{ id: number; title: string; location: string; longitude?: number | null; latitude?: number | null; description: string; category?: 'Corporate Document' | 'Permit Document'; type: 'master' | 'sub'; certificateType?: string; landSize?: string; areaName?: string; projectName?: string; zoneUrl?: string; zoneRtdr?: string; publishDate?: string; expiredDate?: string; documentObtained?: string; issuingAgency?: string; originDocument?: string; physicalLocation?: string; physicalLocationDetail?: string; previousOwner?: string; company?: string; permitNumber?: string; status?: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editLongitude, setEditLongitude] = useState('')
  const [editLatitude, setEditLatitude] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPermitNumber, setEditPermitNumber] = useState('')
  const [editCategory, setEditCategory] = useState<'Corporate Document' | 'Permit Document'>('Corporate Document')
  const [editCertificateType, setEditCertificateType] = useState('')
  const [editLandSize, setEditLandSize] = useState('')
  const [editAreaName, setEditAreaName] = useState('')
  const [editProjectName, setEditProjectName] = useState('')
  const [editZoneUrl, setEditZoneUrl] = useState('')
  const [editZoneRtdr, setEditZoneRtdr] = useState('')
  const [editPublishDate, setEditPublishDate] = useState('')
  const [editExpiredDate, setEditExpiredDate] = useState('')
  const [editDocumentObtained, setEditDocumentObtained] = useState('')
  const [editIssuingAgency, setEditIssuingAgency] = useState('')
  const [editOriginDocument, setEditOriginDocument] = useState('')
  const [editPhysicalLocation, setEditPhysicalLocation] = useState('')
  const [editPhysicalLocationDetail, setEditPhysicalLocationDetail] = useState('')
  const [editPreviousOwner, setEditPreviousOwner] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [docStatus, setDocStatus] = useState<'active' | 'archived'>('active')
  const [editDocStatus, setEditDocStatus] = useState<'active' | 'archived'>('active')
  const [archiveConfirmPending, setArchiveConfirmPending] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; fields?: string[] } | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>((routeLocation.state as { search?: string } | null)?.search || '')
  const [masterFilter, setMasterFilter] = useState<'all' | 'master-only' | 'master-with-subs'>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: 'master' | 'sub'; title: string; hasSubDocs?: boolean } | null>(null)
  const [viewDocument, setViewDocument] = useState<{ id: number; type: 'master' | 'sub'; title: string; fileUrl: string } | null>(null)
  const [mapModal, setMapModal] = useState<{ longitude: number; latitude: number; title: string } | null>(null)
  const [detailModal, setDetailModal] = useState<ApiDocument | null>(null)
  const [detailSubModal, setDetailSubModal] = useState<ApiSubDocument | null>(null)
  const [versionListModal, setVersionListModal] = useState<{ id: number; type: 'master' | 'sub'; title: string; mode: 'view' | 'download' } | null>(null)
  const [versionList, setVersionList] = useState<ApiDocumentVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [uploadVersionModal, setUploadVersionModal] = useState<{ id: number; type: 'master' | 'sub'; title: string } | null>(null)
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null)
  const [newVersionLabel, setNewVersionLabel] = useState('')
  const [uploadingVersion, setUploadingVersion] = useState(false)
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

  // Reset pagination when filters or search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, masterFilter, companyFilter])

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

  function computeEffectiveStatus(dbStatus: string, expiredDate?: string | null): 'active' | 'archived' | 'expired' {
    if (dbStatus === 'archived') return 'archived'
    if (expiredDate && new Date(expiredDate) < new Date()) return 'expired'
    return 'active'
  }

  function getExpiryInfo(expiredDate: string | undefined | null): { text: string; color: string; icon: string } | null {
    if (!expiredDate) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const exp = new Date(expiredDate); exp.setHours(0, 0, 0, 0)
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { text: `Expired ${Math.abs(diff)} days ago`, color: '#ef4444', icon: '🔴' }
    if (diff === 0) return { text: 'Expires today!', color: '#f59e0b', icon: '⚠' }
    if (diff <= 30) return { text: `Expires in ${diff} days`, color: '#f59e0b', icon: '⏰' }
    return { text: `Valid for ${diff} days`, color: '#10b981', icon: '✅' }
  }

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
      alert(t('errors.onlyPdfAllowed'))
      return
    }
    
    const fd = new FormData()
    fd.append('document', file)
    fd.append('title', title)
    fd.append('location', location)
    fd.append('category', category)
    if (longitude) fd.append('longitude', longitude)
    if (latitude) fd.append('latitude', latitude)
    fd.append('description', description)
    if (permitNumber) fd.append('permitNumber', permitNumber)
    fd.append('certificateType', certificateType)
    if (landSize) fd.append('landSize', landSize)
    if (areaName) fd.append('areaName', areaName)
    if (projectName) fd.append('projectName', projectName)
    if (zoneUrl) fd.append('zoneUrl', zoneUrl)
    if (zoneRtdr) fd.append('zoneRtdr', zoneRtdr)
    fd.append('publishDate', publishDate)
    if (expiredDate) fd.append('expiredDate', expiredDate)
    if (documentObtained) fd.append('documentObtained', documentObtained)
    if (issuingAgency) fd.append('issuingAgency', issuingAgency)
    if (originDocument) fd.append('originDocument', originDocument)
    if (physicalLocation) fd.append('physicalLocation', physicalLocation)
    if (physicalLocationDetail) fd.append('physicalLocationDetail', physicalLocationDetail)
    if (previousOwner) fd.append('previousOwner', previousOwner)
    fd.append('company', company)
    fd.append('status', docStatus)
    
    try {
      if (documentType === 'master') {
        await api.uploadDocument(fd, token || undefined)
      } else {
        // Sub document
        if (!parentDocumentId) {
          alert(t('errors.selectMasterDocument'))
          return
        }
        if (!subDocumentNo) {
          alert(t('errors.enterSubDocumentNo'))
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
      setPermitNumber('')
      setCategory('Corporate Document')
      setCertificateType('')
      setLandSize('')
      setAreaName('')
      setProjectName('')
      setZoneUrl('')
      setZoneRtdr('')
      setPublishDate('')
      setExpiredDate('')
      setDocumentObtained('')
      setIssuingAgency('')
      setOriginDocument('')
      setPhysicalLocation('')
      setPhysicalLocationDetail('')
      setPreviousOwner('')
      setCompany('')
      setDocStatus('active')
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

  const openDocEditModal = (id: number, title: string, location: string, description: string, type: 'master' | 'sub', longitude?: number | null, latitude?: number | null, certificateType?: string, landSize?: string, areaName?: string, projectName?: string, zoneUrl?: string, zoneRtdr?: string, publishDate?: string, expiredDate?: string, documentObtained?: string, issuingAgency?: string, originDocument?: string, physicalLocation?: string, physicalLocationDetail?: string, previousOwner?: string, company?: string, category?: 'Corporate Document' | 'Permit Document', permitNumber?: string, status?: string) => {
    setEditingDoc({ id, title, location, longitude, latitude, description, type, certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr, publishDate, expiredDate, documentObtained, issuingAgency, originDocument, physicalLocation, physicalLocationDetail, previousOwner, company, permitNumber, status })
    setEditTitle(title)
    setEditLocation(location)
    setEditLongitude(longitude?.toString() || '')
    setEditLatitude(latitude?.toString() || '')
    setEditDescription(description)
    setEditCategory(category || 'Corporate Document')
    setEditCertificateType(certificateType || '')
    setEditLandSize(landSize || '')
    setEditAreaName(areaName || '')
    setEditProjectName(projectName || '')
    setEditZoneUrl(zoneUrl || '')
    setEditZoneRtdr(zoneRtdr || '')
    setEditPublishDate(publishDate || '')
    setEditExpiredDate(expiredDate || '')
    setEditDocumentObtained(documentObtained || '')
    setEditIssuingAgency(issuingAgency || '')
    setEditOriginDocument(originDocument || '')
    setEditPhysicalLocation(physicalLocation || '')
    setEditPhysicalLocationDetail(physicalLocationDetail || '')
    setEditPreviousOwner(previousOwner || '')
    setEditCompany(company || '')
    setEditPermitNumber(permitNumber || '')
    setEditDocStatus(status === 'archived' ? 'archived' : 'active')
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
    setEditIssuingAgency('')
    setEditOriginDocument('')
    setEditPhysicalLocation('')
    setEditPhysicalLocationDetail('')
    setEditPreviousOwner('')
    setEditCompany('')
    setEditPermitNumber('')
    setEditDocStatus('active')
    setArchiveConfirmPending(false)
  }

  async function handleUpdateDocInfo(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDoc) return

    try {
      // Track which fields have changed
      const docStatusToSave: string = editDocStatus === 'archived' ? 'archived' : (editExpiredDate && new Date(editExpiredDate) < new Date()) ? 'expired' : 'active'
      const updatedFields: string[] = []
      
      if (editTitle !== editingDoc.title) updatedFields.push('Title')
      if (editLocation !== editingDoc.location) updatedFields.push('Location')
      if (editDescription !== (editingDoc.description || '')) updatedFields.push('Description')
      if (editCategory !== (editingDoc.category || 'Corporate Document')) updatedFields.push('Category')
      if (editLongitude !== (editingDoc.longitude?.toString() || '')) updatedFields.push('Longitude')
      if (editLatitude !== (editingDoc.latitude?.toString() || '')) updatedFields.push('Latitude')
      if (editCertificateType !== (editingDoc.certificateType || '')) updatedFields.push('Certificate Type')
      if (editLandSize !== (editingDoc.landSize || '')) updatedFields.push('Land Size')
      if (editAreaName !== (editingDoc.areaName || '')) updatedFields.push('Area Name')
      if (editProjectName !== (editingDoc.projectName || '')) updatedFields.push('Project Name')
      if (editZoneUrl !== (editingDoc.zoneUrl || '')) updatedFields.push('Zone URL')
      if (editZoneRtdr !== (editingDoc.zoneRtdr || '')) updatedFields.push('Zone RTDR')
      if (editPublishDate !== (editingDoc.publishDate || '')) updatedFields.push('Publish Date')
      if (editExpiredDate !== (editingDoc.expiredDate || '')) updatedFields.push('Expired Date')
      if (editDocumentObtained !== (editingDoc.documentObtained || '')) updatedFields.push('Document Obtained')
      if (editIssuingAgency !== (editingDoc.issuingAgency || '')) updatedFields.push('Issuing Agency')
      if (editOriginDocument !== (editingDoc.originDocument || '')) updatedFields.push('Origin Document')
      if (editPhysicalLocation !== (editingDoc.physicalLocation || '')) updatedFields.push('Physical Location')
      if (editPhysicalLocationDetail !== (editingDoc.physicalLocationDetail || '')) updatedFields.push('Physical Location Detail')
      if (editPreviousOwner !== (editingDoc.previousOwner || '')) updatedFields.push('Previous Owner')
      if (editCompany !== (editingDoc.company || '')) updatedFields.push('Company')
      if (editPermitNumber !== (editingDoc.permitNumber || '')) updatedFields.push('Permit Number')
      if (docStatusToSave !== (editingDoc.status || 'active')) updatedFields.push('Status')

      const updateData = {
        title: editTitle,
        location: editLocation,
        description: editDescription,
        category: editCategory,
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
        issuingAgency: editIssuingAgency || undefined,
        originDocument: editOriginDocument || undefined,
        physicalLocation: editPhysicalLocation,
        physicalLocationDetail: editPhysicalLocationDetail,
        previousOwner: editPreviousOwner || undefined,
        company: editCompany || undefined,
        permitNumber: editPermitNumber || undefined,
        status: docStatusToSave
      }
      
      if (editingDoc.type === 'master') {
        await api.updateDocumentInfo(editingDoc.id, updateData, token || undefined)
      } else {
        await api.updateSubDocumentInfo(editingDoc.id, updateData, token || undefined)
      }
      
      // Show notification with updated fields
      if (updatedFields.length > 0) {
        setNotification({
          type: 'success',
          message: `Document updated successfully`,
          fields: updatedFields
        })
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000)
      }
      
      // Reload documents
      const res = await api.getDocuments(token || undefined)
      setDocs(res)
      
      closeDocEditModal()
    } catch (err: unknown) {
      console.error(extractErrorMessage(err))
      setNotification({
        type: 'error',
        message: 'Update failed: ' + extractErrorMessage(err)
      })
      setTimeout(() => setNotification(null), 5000)
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

  const openVersionListModal = async (id: number, type: 'master' | 'sub', title: string, mode: 'view' | 'download' = 'view') => {
    setVersionListModal({ id, type, title, mode })
    setVersionsLoading(true)
    try {
      const versions = await api.getDocumentVersions(id, type, token || '')
      setVersionList(versions)
    } catch (e) {
      console.error('Error loading versions:', e)
      setVersionList([])
    } finally {
      setVersionsLoading(false)
    }
  }

  const closeVersionListModal = () => {
    setVersionListModal(null)
    setVersionList([])
  }

  const handleViewVersion = async (version: ApiDocumentVersion, parentId: number, parentType: 'master' | 'sub') => {
    try {
      if (!token) throw new Error('No authentication token')

      let blob: Blob
      if (version.syntheticVersion || version.id === null) {
        // Backward-compat: no DB version, use standard download endpoint
        const endpoint = parentType === 'master'
          ? `/api/documents/download/${parentId}`
          : `/api/documents/sub-document/download/${parentId}`
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        blob = await response.blob()
      } else {
        blob = await api.viewDocumentVersion(version.id as number, token)
      }

      const fileUrl = URL.createObjectURL(blob)
      const versionLabel = version.label ? ` · ${version.label}` : ` · v${version.versionNumber}`
      setViewDocument({ id: parentId, type: parentType, title: `${versionListModal?.title || ''}${versionLabel}`, fileUrl })
    } catch (error) {
      console.error('View version error:', error)
      alert('Error viewing document version: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleDownloadVersion = async (version: ApiDocumentVersion, parentId: number, parentType: 'master' | 'sub') => {
    try {
      if (!token) throw new Error('No authentication token')

      if (version.syntheticVersion || version.id === null) {
        // Backward-compat: use standard download endpoint
        if (parentType === 'master') {
          await api.downloadDocument(parentId)
        } else {
          await api.downloadSubDocument(parentId)
        }
      } else {
        const filename = version.originalName || `document-v${version.versionNumber}.pdf`
        await api.downloadDocumentVersion(version.id as number, token, filename)
      }
    } catch (error) {
      console.error('Download version error:', error)
      alert('Error downloading version: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadVersionModal || !newVersionFile || !token) return
    setUploadingVersion(true)
    try {
      const formData = new FormData()
      formData.append('document', newVersionFile)
      if (newVersionLabel.trim()) formData.append('label', newVersionLabel.trim())
      await api.uploadDocumentVersion(uploadVersionModal.id, uploadVersionModal.type, formData, token)
      setNotification({ type: 'success', message: 'New version uploaded successfully!' })
      setUploadVersionModal(null)
      setNewVersionFile(null)
      setNewVersionLabel('')
      await loadDocuments()
    } catch (error) {
      console.error('Upload version error:', error)
      setNotification({ type: 'error', message: 'Error uploading version: ' + (error instanceof Error ? error.message : String(error)) })
    } finally {
      setUploadingVersion(false)
    }
  }

  const closeViewDocument = () => {
    // Revoke blob URL untuk free memory
    if (viewDocument?.fileUrl) {
      URL.revokeObjectURL(viewDocument.fileUrl)
    }
    setViewDocument(null)
  }

  // Get unique companies from documents
  const availableCompanies = Array.from(new Set(
    docs.map(d => d.company).filter(Boolean)
  )).sort()

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
      
      // Company filter
      if (companyFilter !== 'all') {
        if (d.company !== companyFilter) return false
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
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          padding: '1.25rem',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 10000,
          maxWidth: 'min(400px, calc(100vw - 2rem))',
          width: 'max-content',
          animation: 'slideIn 0.3s ease-out',
          fontWeight: 500
        }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {notification.type === 'success' ? '✅' : '❌'} {notification.message}
          </div>
          {notification.fields && notification.fields.length > 0 && (
            <div style={{ 
              fontSize: '0.85rem', 
              opacity: 0.95,
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255,255,255,0.3)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Updated fields:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {notification.fields.map((field, idx) => (
                  <span key={idx} style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    fontSize: '0.8rem'
                  }}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="documents-header">
        <div>
          <h1 className="documents-main-title">{t('documents.pageTitle')}</h1>
          <p className="documents-subtitle">{t('documents.pageSubtitle')}</p>
        </div>
        {(user?.userLevel === 'admin' || user?.userLevel === 'level1' || user?.userLevel === 'level2') && (
          <button 
            className="btn primary" 
            onClick={() => setShowUploadForm(!showUploadForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> {t('buttons.addDocument')}
          </button>
        )}
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
            placeholder={t('documents.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="role-filter"
          value={masterFilter}
          onChange={(e) => setMasterFilter(e.target.value as typeof masterFilter)}
        >
          <option value="all">{t('documents.allDocuments')}</option>
          <option value="master-only">{t('documents.masterOnly')}</option>
          <option value="master-with-subs">{t('documents.masterWithSubs')}</option>
        </select>
        <select 
          className="role-filter"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="all">{t('documents.filterAllCompanies')}</option>
          {availableCompanies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>

      {/* Upload Form - Collapsible */}
      {showUploadForm && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{t('documents.uploadNewDocument')}</h3>
          <form className="form" onSubmit={handleUpload}>
            <label>
              {t('documents.category')}
              <select value={category} onChange={(e) => setCategory(e.target.value as 'Corporate Document' | 'Permit Document')}>
                <option value="Corporate Document">{t('documents.categoryValueCorporate')}</option>
                <option value="Permit Document">{t('documents.categoryValuePermit')}</option>
              </select>
            </label>

            <label>
              {t('documents.documentType')}
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value as 'master' | 'sub')}>
                <option value="master">{t('documents.masterDocument')}</option>
                <option value="sub">{t('documents.subDocument')}</option>
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
              <span>{t('forms.documentTitle')} <span style={{ color: '#dc2626' }}>*</span></span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              {t('forms.permitNumber')}
              <input
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                placeholder={t('forms.permitNumberPlaceholder')}
              />
            </label>
            <LocationInput
              value={location}
              onChange={setLocation}
              label={t('forms.location')}
              placeholder={t('forms.locationPlaceholder')}
              required={true}
            />
            <div className="form-grid-2">
              <label>
                {t('forms.longitude')} ({t('forms.optional')})
                <input 
                  type="number" 
                  step="any" 
                  value={longitude} 
                  onChange={(e) => setLongitude(e.target.value)} 
                  placeholder="-8.7208"
                />
              </label>
              <label>
                {t('forms.latitude')} ({t('forms.optional')})
                <input 
                  type="number" 
                  step="any" 
                  value={latitude} 
                  onChange={(e) => setLatitude(e.target.value)} 
                  placeholder="115.1690"
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
                {description.length}/350 {t('forms.characters')}
              </span>
            </label>

            {/* NEW CERTIFICATE & PROPERTY FIELDS */}
            <label>
              <span>{t('documents.certificateType')} <span style={{ color: '#ff6b6b' }}>*</span></span>
              <select value={certificateType} onChange={(e) => setCertificateType(e.target.value)} required>
                <option value="">{t('forms.selectCertificateType')}</option>
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

            <div className="form-grid-2">
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
                placeholder={t('forms.zoneUrlPlaceholder')}
              />
            </label>

            <label>
              {t('forms.zoneRtdr')}
              <input 
                value={zoneRtdr} 
                onChange={(e) => setZoneRtdr(e.target.value)} 
                placeholder={t('forms.zoneRtdrPlaceholder')}
              />
            </label>

            <div className="form-grid-2">
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

            {(() => {
              const exInfo = getExpiryInfo(expiredDate)
              return exInfo ? (
                <div style={{ fontSize: '0.85rem', color: exInfo.color, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', borderLeft: `3px solid ${exInfo.color}` }}>
                  {exInfo.icon} {exInfo.text}
                </div>
              ) : null
            })()}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('forms.documentStatus')}</label>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="radio" name="docStatus" value="active" checked={docStatus === 'active'} onChange={() => setDocStatus('active')} />
                  🟢 {t('forms.statusActive')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="radio" name="docStatus" value="archived" checked={docStatus === 'archived'} onChange={() => setDocStatus('archived')} />
                  🗄️ {t('forms.statusArchive')}
                </label>
              </div>
            </div>

            <label>
              {t('forms.documentObtainedDate')}
              <input 
                type="date"
                value={documentObtained} 
                onChange={(e) => setDocumentObtained(e.target.value)} 
              />
            </label>

            <label>
              {t('forms.issuingAgency')}
              <input 
                value={issuingAgency} 
                onChange={(e) => setIssuingAgency(e.target.value)} 
                placeholder={t('forms.issuingAgencyPlaceholder')}
              />
            </label>

            <label>
              {t('forms.originDocument')}
              <input 
                value={originDocument} 
                onChange={(e) => setOriginDocument(e.target.value)} 
                placeholder={t('forms.originDocumentPlaceholder')}
              />
            </label>

            <label>
              {t('forms.physicalLocation')}
              <select
                value={physicalLocation}
                onChange={(e) => { setPhysicalLocation(e.target.value); setPhysicalLocationDetail('') }}
              >
                <option value="">{t('forms.selectPhysicalLocation')}</option>
                <option value="Lemari Arsip Legal">{t('forms.physLocLemariArsip')}</option>
                <option value="Brankas">{t('forms.physLocBrankas')}</option>
                <option value="Safe Deposit Box">{t('forms.physLocSafeDepositBox')}</option>
                <option value="Notaris">{t('forms.physLocNotaris')}</option>
                <option value="Others">{t('forms.physLocOthers')}</option>
              </select>
            </label>

            {(physicalLocation === 'Safe Deposit Box' || physicalLocation === 'Notaris' || physicalLocation === 'Others') && (
              <label>
                {physicalLocation === 'Safe Deposit Box' ? t('forms.physLocBankName') : physicalLocation === 'Notaris' ? t('forms.physLocNotarisName') : t('forms.physLocOthersDetail')}
                <input
                  type="text"
                  value={physicalLocationDetail}
                  onChange={(e) => setPhysicalLocationDetail(e.target.value)}
                  placeholder={physicalLocation === 'Safe Deposit Box' ? t('forms.physLocBankNamePlaceholder') : physicalLocation === 'Notaris' ? t('forms.physLocNotarisNamePlaceholder') : t('forms.physLocOthersDetailPlaceholder')}
                />
              </label>
            )}

            <label>
              {t('forms.previousOwner')}
              <input 
                value={previousOwner} 
                onChange={(e) => setPreviousOwner(e.target.value)} 
                placeholder={t('forms.previousOwnerPlaceholder')}
              />
            </label>

            <label>
              <span>{t('documents.company')} <span style={{ color: '#ff6b6b' }}>*</span></span>
              <select value={company} onChange={(e) => setCompany(e.target.value)} required>
                <option value="">{t('forms.selectCompany')}</option>
                <option value="JH">JH</option>
                <option value="JHT">JHT</option>
                <option value="BEP">BEP</option>
                <option value="PIJ">PIJ</option>
              </select>
            </label>

            <label>
              {t('forms.pdfFile')} <span style={{ color: '#ff6b6b' }}>*</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className="doc-id-badge">{d.documentNo}</div>
                      {(() => {
                        const efs = computeEffectiveStatus(d.status || 'active', d.expiredDate)
                        const styleMap = {
                          active: { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
                          expired: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
                          archived: { background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' }
                        } as const
                        const labelMap = { active: t('documents.statusActive'), expired: t('documents.statusExpired'), archived: t('documents.statusArchived') }
                        return <span style={{ ...styleMap[efs], fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{labelMap[efs]}</span>
                      })()}
                      <button
                        onClick={() => setDetailModal(d)}
                        className="info-btn"
                        title={t('documents.viewCertificateDetails')}
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
                        title={t('documents.clickToViewMap')}
                      >
                        📍 {t('documents.locationOnMap')} : {d.longitude}, {d.latitude}
                      </div>
                    )}
                    {d.description && <div className="doc-description">{d.description}</div>}
                    
                    {d.subDocuments && d.subDocuments.length > 0 && (
                      <div className="doc-count">
                        <span className="doc-count-number">{d.subDocuments.length}</span>
                        <span>{t('documents.subDocumentsCount')}{d.subDocuments.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="doc-actions">
                  {(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
                    <button 
                      onClick={() => openDocEditModal(d.id, d.title, d.location, d.description || '', 'master', d.longitude, d.latitude, d.certificateType, d.landSize, d.areaName, d.projectName, d.zoneUrl, d.zoneRtdr, d.publishDate, d.expiredDate, d.documentObtained, d.issuingAgency, d.originDocument, d.physicalLocation, d.physicalLocationDetail, d.previousOwner, d.company, d.category, d.permitNumber, d.status)}
                      className="btn ghost"
                      title={t('documents.editDocument')}
                    >
                      ✏️ {t('buttons.edit')}
                    </button>
                  )}
                  {(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
                    <button
                      onClick={() => setUploadVersionModal({ id: d.id, type: 'master', title: d.title })}
                      className="btn ghost"
                      title={t('buttons.uploadVersion')}
                    >
                      🔄 {t('buttons.newVersion')}
                    </button>
                  )}
                  <button 
                    onClick={() => openVersionListModal(d.id, 'master', d.title)}
                    className="btn ghost"
                    title={t('buttons.view')}
                  >
                    👁️ {t('buttons.view')}
                  </button>
                  {(user?.userLevel === 'admin' || user?.userLevel === 'level1' || user?.userLevel === 'level2') && (
                    <button onClick={() => openVersionListModal(d.id, 'master', d.title, 'download')} className="btn">{t('buttons.download')}</button>
                  )}
                  {(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
                    <button 
                      onClick={() => openDeleteConfirm(d.id, 'master', d.title, (d.subDocuments?.length || 0) > 0)}
                      className="btn small danger"
                      title={t('buttons.delete')}
                    >
                      🗑️ {t('buttons.delete')}
                    </button>
                  )}
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
                            title={t('documents.editSubDocumentNo')}
                            style={{ cursor: 'pointer', border: '1px solid rgba(124,58,237,0.3)' }}
                          >
                            {sub.subDocumentNo}
                          </button>
                          {(() => {
                            const efs = computeEffectiveStatus(sub.status || 'active', sub.expiredDate)
                            const styleMap = {
                              active: { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
                              expired: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
                              archived: { background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' }
                            } as const
                            const labelMap = { active: t('documents.statusActive'), expired: t('documents.statusExpired'), archived: t('documents.statusArchived') }
                            return <span style={{ ...styleMap[efs], fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{labelMap[efs]}</span>
                          })()}
                          <button
                            onClick={() => setDetailSubModal(sub)}
                            className="info-btn"
                            title={t('documents.viewCertificateDetails')}
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
                      </div>
                      <div className="doc-actions">
                        {(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
                          <button 
                            onClick={() => openDocEditModal(sub.id, sub.title, sub.location, sub.description || '', 'sub', sub.longitude, sub.latitude, sub.certificateType, sub.landSize, sub.areaName, sub.projectName, sub.zoneUrl, sub.zoneRtdr, sub.publishDate, sub.expiredDate, sub.documentObtained, sub.issuingAgency, sub.originDocument, sub.physicalLocation, sub.physicalLocationDetail, sub.previousOwner, sub.company, sub.category, sub.permitNumber, sub.status)}
                            className="btn ghost"
                            title="Edit sub-document"
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                          >
                            ✏️
                          </button>
                        )}
                        {(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
                          <button
                            onClick={() => setUploadVersionModal({ id: sub.id, type: 'sub', title: sub.title })}
                            className="btn ghost"
                            title={t('buttons.uploadVersion')}
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                          >
                            🔄
                          </button>
                        )}
                        <button 
                          onClick={() => openVersionListModal(sub.id, 'sub', sub.title)}
                          className="btn ghost"
                          title="View sub-document"
                          style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        >
                          👁️
                        </button>
                        {(user?.userLevel === 'admin' || user?.userLevel === 'level1' || user?.userLevel === 'level2') && (
                          <button onClick={() => openVersionListModal(sub.id, 'sub', sub.title, 'download')} className="btn">{t('buttons.download')}</button>
                        )}
                        {(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
                          <button 
                            onClick={() => openDeleteConfirm(sub.id, 'sub', sub.title)}
                            className="btn small danger"
                            title="Delete sub-document"
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                          >
                            🗑️
                          </button>
                        )}
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
                {t('forms.documentTitle')}
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <LocationInput
                value={editLocation}
                onChange={setEditLocation}
                label={t('forms.location')}
                placeholder={t('forms.locationPlaceholder')}
                required={false}
              />
              <label>
                {t('documents.category')}
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as 'Corporate Document' | 'Permit Document')}>
                  <option value="Corporate Document">{t('documents.categoryValueCorporate')}</option>
                  <option value="Permit Document">{t('documents.categoryValuePermit')}</option>
                </select>
              </label>
              <div className="form-grid-2">
                <label>
                  {t('forms.longitude')} ({t('forms.optional')})
                  <input 
                    type="number" 
                    step="any" 
                    value={editLongitude} 
                    onChange={(e) => setEditLongitude(e.target.value)} 
                    placeholder="contoh: -197.491239"
                  />
                </label>
                <label>
                  {t('forms.latitude')} ({t('forms.optional')})
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
                  {editDescription.length}/350 {t('forms.characters')}
                </small>
              </label>
              <label>
                {t('forms.permitNumber')}
                <input
                  type="text"
                  value={editPermitNumber}
                  onChange={(e) => setEditPermitNumber(e.target.value)}
                  placeholder={t('forms.permitNumberPlaceholder')}
                />
              </label>
              
              {/* Informasi Sertifikat & Properti Section */}
              <div>
                <label>
                  <span>{t('documents.certificateType')} <span style={{ color: '#dc2626' }}>*</span></span>
                  <select 
                    value={editCertificateType} 
                    onChange={(e) => setEditCertificateType(e.target.value)}
                  >
                    <option value="">{t('forms.selectCertificateType')}</option>
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
                
                <div className="form-grid-2">
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

                {(() => {
                  const exInfo = getExpiryInfo(editExpiredDate)
                  return exInfo ? (
                    <div style={{ fontSize: '0.85rem', color: exInfo.color, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', borderLeft: `3px solid ${exInfo.color}` }}>
                      {exInfo.icon} {exInfo.text}
                    </div>
                  ) : null
                })()}
                {(() => {
                  const effectiveStatus = computeEffectiveStatus(editDocStatus, editExpiredDate)
                  const isExpired = effectiveStatus === 'expired'
                  return (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('forms.documentStatus')}</label>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isExpired ? 'not-allowed' : 'pointer', fontWeight: 'normal', opacity: isExpired ? 0.5 : 1 }}>
                          <input type="radio" name="editDocStatus" value="active" checked={editDocStatus === 'active'} disabled={isExpired} onChange={() => setEditDocStatus('active')} />
                          🟢 {t('forms.statusActive')}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                          <input type="radio" name="editDocStatus" value="archived" checked={editDocStatus === 'archived'} onChange={() => { if (editDocStatus !== 'archived') setArchiveConfirmPending(true) }} />
                          🗄️ {t('forms.statusArchive')}
                        </label>
                        {isExpired && (
                          <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>⌛ {t('forms.statusExpired')}</span>
                        )}
                      </div>
                      {isExpired && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', padding: '0.4rem 0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                          ⚠️ {t('forms.statusExpiredNote')}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <label>
                  {t('forms.documentObtainedDate')}
                  <input 
                    type="date" 
                    value={editDocumentObtained} 
                    onChange={(e) => setEditDocumentObtained(e.target.value)}
                  />
                </label>
                
                <label>
                  {t('forms.issuingAgency')}
                  <input 
                    type="text"
                    value={editIssuingAgency}
                    onChange={(e) => setEditIssuingAgency(e.target.value)}
                    placeholder={t('forms.issuingAgencyPlaceholder')}
                  />
                </label>
                
                <label>
                  {t('forms.originDocument')}
                  <textarea 
                    value={editOriginDocument} 
                    onChange={(e) => setEditOriginDocument(e.target.value)}
                    placeholder={t('forms.originDocumentPlaceholder')}
                    style={{ 
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem'
                    }}
                  />
                </label>
                
                <label>
                  {t('forms.physicalLocation')}
                  <select
                    value={editPhysicalLocation}
                    onChange={(e) => { setEditPhysicalLocation(e.target.value); setEditPhysicalLocationDetail('') }}
                  >
                    <option value="">{t('forms.selectPhysicalLocation')}</option>
                    <option value="Lemari Arsip Legal">{t('forms.physLocLemariArsip')}</option>
                    <option value="Brankas">{t('forms.physLocBrankas')}</option>
                    <option value="Safe Deposit Box">{t('forms.physLocSafeDepositBox')}</option>
                    <option value="Notaris">{t('forms.physLocNotaris')}</option>
                    <option value="Others">{t('forms.physLocOthers')}</option>
                  </select>
                </label>

                {(editPhysicalLocation === 'Safe Deposit Box' || editPhysicalLocation === 'Notaris' || editPhysicalLocation === 'Others') && (
                  <label>
                    {editPhysicalLocation === 'Safe Deposit Box' ? t('forms.physLocBankName') : editPhysicalLocation === 'Notaris' ? t('forms.physLocNotarisName') : t('forms.physLocOthersDetail')}
                    <input
                      type="text"
                      value={editPhysicalLocationDetail}
                      onChange={(e) => setEditPhysicalLocationDetail(e.target.value)}
                      placeholder={editPhysicalLocation === 'Safe Deposit Box' ? t('forms.physLocBankNamePlaceholder') : editPhysicalLocation === 'Notaris' ? t('forms.physLocNotarisNamePlaceholder') : t('forms.physLocOthersDetailPlaceholder')}
                    />
                  </label>
                )}
                
                <label>
                  {t('forms.previousOwner')}
                  <input 
                    type="text" 
                    value={editPreviousOwner} 
                    onChange={(e) => setEditPreviousOwner(e.target.value)}
                    placeholder={t('forms.previousOwnerPlaceholder')}
                  />
                </label>
                
                <label>
                  <span>{t('documents.company')} <span style={{ color: '#dc2626' }}>*</span></span>
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

      {/* Version List Modal */}
      {versionListModal && (
        <div className="modal-overlay" onClick={closeVersionListModal} style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '560px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{versionListModal.mode === 'download' ? '⬇️' : '📎'} {versionListModal.mode === 'download' ? t('modals.downloadVersionTitle') : t('modals.versionListTitle')}</h3>
              <button onClick={closeVersionListModal} className="btn ghost" style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '1rem' }}>
              <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                {versionListModal.title}
              </p>
              {versionsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {t('buttons.loading')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {versionList.map((v, idx) => (
                    <div
                      key={v.id ?? `synthetic-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        border: idx === 0 ? '1.5px solid #16a34a' : '1px solid #d1d5db',
                        borderRadius: '8px',
                        background: idx === 0 ? '#f0fdf4' : '#fff'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                          {t('documents.versionNumber')} {v.versionNumber}
                          {idx === 0 && (
                            <span style={{
                              marginLeft: '0.5rem',
                              background: '#16a34a',
                              color: '#fff',
                              borderRadius: '4px',
                              padding: '0.1rem 0.4rem',
                              fontSize: '0.75rem'
                            }}>
                              {t('documents.versionLatest')}
                            </span>
                          )}
                          {v.label && (
                            <span style={{ marginLeft: '0.4rem', color: '#374151', fontWeight: 400, fontSize: '0.85rem' }}>
                              · {v.label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>
                          {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}
                          {v.uploader?.username && ` · ${t('documents.uploadedBy')} ${v.uploader.username}`}
                          {v.originalName && ` · ${v.originalName}`}
                        </div>
                      </div>
                      <button
                        onClick={() => versionListModal.mode === 'download'
                          ? handleDownloadVersion(v, versionListModal.id, versionListModal.type)
                          : handleViewVersion(v, versionListModal.id, versionListModal.type)
                        }
                        style={{
                          marginLeft: '0.75rem',
                          whiteSpace: 'nowrap',
                          background: versionListModal.mode === 'download' ? '#2563eb' : '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {versionListModal.mode === 'download' ? `⬇️ ${t('buttons.download')}` : `👁️ ${t('documents.viewThisVersion')}`}
                      </button>
                    </div>
                  ))}
                  {versionList.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                      No versions found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeVersionListModal} className="btn ghost">{t('buttons.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Version Modal */}
      {uploadVersionModal && (
        <div className="modal-overlay" onClick={() => { setUploadVersionModal(null); setNewVersionFile(null); setNewVersionLabel('') }} style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 {t('modals.uploadVersionTitle')}</h3>
              <button
                onClick={() => { setUploadVersionModal(null); setNewVersionFile(null); setNewVersionLabel('') }}
                className="btn ghost"
                style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}
              >×</button>
            </div>
            <form onSubmit={handleUploadNewVersion}>
              <div className="modal-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                  {uploadVersionModal.title}
                </p>
                <div className="form-group">
                  <label className="form-label">{t('documents.versionLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('documents.versionLabelPlaceholder')}
                    value={newVersionLabel}
                    onChange={(e) => setNewVersionLabel(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PDF File *</label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    className="form-input"
                    onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => { setUploadVersionModal(null); setNewVersionFile(null); setNewVersionLabel('') }}
                >
                  {t('buttons.cancel')}
                </button>
                <button type="submit" className="btn primary" disabled={uploadingVersion || !newVersionFile}>
                  {uploadingVersion ? t('buttons.uploading') : t('buttons.uploadVersion')}
                </button>
              </div>
            </form>
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
                <div style={{ fontSize: '0.9rem', color: '#a0a4b0', marginBottom: '0.5rem', fontWeight: 500 }}>{t('documents.documentCode')}</div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', color: '#ffffff', fontWeight: 700 }}>{detailModal.documentNo}</h2>
                <p style={{ margin: '0', color: '#c0c4cc', fontSize: '0.95rem' }}>{detailModal.title}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="btn ghost" style={{ fontSize: '2rem', padding: '0', width: '2rem', height: '2rem', color: '#ffffff' }}>×</button>
            </div>

            {/* Info Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="detail-section-grid">
                {/* Basic Info */}
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#9d4edd', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 {t('documents.basicInfo')}</h4>
                  <div className="detail-field-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.documentTitle')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.title}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.locationLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.location}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.category')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.95rem', fontWeight: 600, background: 'rgba(59,130,246,0.25)', borderRadius: '6px', display: 'inline-block', border: '1px solid rgba(59,130,246,0.4)' }}>{detailModal.category || 'Corporate Document'}</div>
                    </div>
                    {detailModal.description && (
                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.descriptionLabel')}</span>
                        <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', lineHeight: 1.6 }}>{detailModal.description}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Info */}
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#9d4edd', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📜 {t('documents.certificateInfo')}</h4>
                  <div className="detail-field-grid">
                    {detailModal.certificateType && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.certificateType')}</span>
                        <div style={{ color: '#e8ecf1', margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.95rem', fontWeight: 600, background: 'rgba(157,78,221,0.25)', borderRadius: '6px', display: 'inline-block', border: '1px solid rgba(157,78,221,0.4)' }}>{detailModal.certificateType}</div>
                      </div>
                    )}
                    {detailModal.permitNumber && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.permitNumberLabel')}</span>
                        <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.permitNumber}</div>
                      </div>
                    )}
                    {detailModal.company && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.company')}</span>
                        <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.company}</div>
                      </div>
                    )}
                    {detailModal.publishDate && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.publishDateLabel')}</span>
                        <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailModal.publishDate).toLocaleDateString('id-ID')}</div>
                      </div>
                    )}
                    {detailModal.expiredDate && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                        <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.expiredDateLabel')}</span>
                        <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailModal.expiredDate).toLocaleDateString('id-ID')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            {(detailModal.landSize || detailModal.areaName || detailModal.projectName || detailModal.zoneUrl || detailModal.zoneRtdr || detailModal.documentObtained || detailModal.issuingAgency || detailModal.originDocument || detailModal.physicalLocation || detailModal.previousOwner) && (
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(124,58,237,0.3)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#9d4edd', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏘️ {t('documents.propertyInfo')}</h4>
                <div className="detail-field-grid">
                  {detailModal.landSize && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.landSizeLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.landSize}</div></div>)}
                  {detailModal.areaName && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.areaNameLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.areaName}</div></div>)}
                  {detailModal.projectName && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.projectNameLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.projectName}</div></div>)}
                  {detailModal.zoneUrl && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.zoneUrlLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500, wordBreak: 'break-all' }}><a href={detailModal.zoneUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#9d4edd', textDecoration: 'underline' }}>{detailModal.zoneUrl}</a></div></div>)}
                  {detailModal.zoneRtdr && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.zoneRtdrLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.zoneRtdr}</div></div>)}
                  {detailModal.documentObtained && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.documentObtainedLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailModal.documentObtained).toLocaleDateString('id-ID')}</div></div>)}
                  {detailModal.issuingAgency && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.issuingAgencyLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.issuingAgency}</div></div>)}
                  {detailModal.originDocument && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.originDocumentLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.originDocument}</div></div>)}
                  {detailModal.physicalLocation && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.physicalLocationLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.physicalLocation}{detailModal.physicalLocationDetail ? ` · ${detailModal.physicalLocationDetail}` : ''}</div></div>)}
                  {detailModal.previousOwner && (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}><span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.previousOwnerLabel')}</span><div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailModal.previousOwner}</div></div>)}
                </div>
              </div>
            )}

            {/* Location */}
            {(detailModal.longitude !== null && detailModal.latitude !== null) && (
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ background: 'rgba(157,78,221,0.15)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(157,78,221,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>📍 {t('documents.coordinates')}</div><div style={{ color: '#e8ecf1', fontSize: '0.95rem', fontFamily: 'monospace', marginTop: '0.25rem', fontWeight: 500 }}>Lat: {Number(detailModal.latitude).toFixed(6)}<br />Long: {Number(detailModal.longitude).toFixed(6)}</div></div>
                    <a href={`https://www.google.com/maps?q=${Number(detailModal.latitude)},${Number(detailModal.longitude)}`} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>🗺️ {t('documents.googleMaps')}</a>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(124,58,237,0.3)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailModal(null)} className="btn secondary">{t('documents.close')}</button>
            </div>
          </div>
        </div>
      )}

      {archiveConfirmPending && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 11000 }}>
          <div style={{ backgroundColor: '#0f1419', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '90%', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>{t('modals.archiveConfirmTitle')}</h3>
            <p style={{ color: '#a0a4b0', marginBottom: '1.5rem', lineHeight: 1.5 }}>{t('modals.archiveConfirmMessage')}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setArchiveConfirmPending(false)}>{t('buttons.cancel')}</button>
              <button className="btn primary" onClick={() => { setEditDocStatus('archived'); setArchiveConfirmPending(false) }}>{t('modals.archiveConfirmBtn')}</button>
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
                <div style={{ fontSize: '0.85rem', color: '#a0a4b0', fontWeight: 600, marginBottom: '0.5rem' }}>{t('documents.subdocumentLabel')}</div>
                <div style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 700 }}>{detailSubModal.subDocumentNo}</div>
              </div>
              <button onClick={() => setDetailSubModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0a4b0' }}>✕</button>
            </div>

            {/* Basic Info */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
              <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📋 {t('documents.basicInfo')}</div>
              <div className="detail-field-grid">
                {detailSubModal.title && (
                  <div>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>{t('documents.documentTitle')}</span>
                    <div style={{ color: '#e8ecf1', marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.title}</div>
                  </div>
                )}
                {detailSubModal.location && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.locationLabel')}</span>
                    <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.location}</div>
                  </div>
                )}
                {detailSubModal.category && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.category')}</span>
                    <div style={{ color: '#e8ecf1', margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.95rem', fontWeight: 600, background: 'rgba(59,130,246,0.25)', borderRadius: '6px', display: 'inline-block', border: '1px solid rgba(59,130,246,0.4)' }}>{detailSubModal.category}</div>
                  </div>
                )}
                {detailSubModal.description && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                    <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.descriptionLabel')}</span>
                    <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500, lineHeight: '1.5' }}>{detailSubModal.description}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Info */}
            {(detailSubModal.certificateType || detailSubModal.landSize || detailSubModal.areaName || detailSubModal.projectName) && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📜 {t('documents.certificateInfo')}</div>
                <div className="detail-field-grid">
                  {detailSubModal.certificateType && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.certificateType')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.95rem', fontWeight: 600, background: 'rgba(157,78,221,0.25)', borderRadius: '6px', display: 'inline-block', border: '1px solid rgba(157,78,221,0.4)' }}>{detailSubModal.certificateType}</div>
                    </div>
                  )}
                  {detailSubModal.permitNumber && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.permitNumberLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.permitNumber}</div>
                    </div>
                  )}
                  {detailSubModal.landSize && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.landSizeLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.landSize}</div>
                    </div>
                  )}
                  {detailSubModal.areaName && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.areaNameLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.areaName}</div>
                    </div>
                  )}
                  {detailSubModal.projectName && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.projectNameLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.projectName}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Property Info */}
            {(detailSubModal.zoneUrl || detailSubModal.zoneRtdr || detailSubModal.originDocument || detailSubModal.previousOwner) && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏘️ {t('documents.propertyInfo')}</div>
                <div className="detail-field-grid">
                  {detailSubModal.zoneUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.zoneUrlLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500, wordBreak: 'break-all' }}>{detailSubModal.zoneUrl}</div>
                    </div>
                  )}
                  {detailSubModal.zoneRtdr && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.zoneRtdrLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.zoneRtdr}</div>
                    </div>
                  )}
                  {detailSubModal.originDocument && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.originDocumentLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.originDocument}</div>
                    </div>
                  )}
                  {detailSubModal.previousOwner && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.previousOwnerLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.previousOwner}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Details */}
            {(detailSubModal.publishDate || detailSubModal.expiredDate || detailSubModal.documentObtained || detailSubModal.issuingAgency || detailSubModal.physicalLocation || detailSubModal.company) && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📝 {t('documents.documentDetails')}</div>
                <div className="detail-field-grid">
                  {detailSubModal.publishDate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.publishDateLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailSubModal.publishDate).toLocaleDateString('id-ID')}</div>
                    </div>
                  )}
                  {detailSubModal.expiredDate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.expiredDateLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(detailSubModal.expiredDate).toLocaleDateString('id-ID')}</div>
                    </div>
                  )}
                  {detailSubModal.documentObtained && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.documentObtainedLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.documentObtained}</div>
                    </div>
                  )}
                  {detailSubModal.issuingAgency && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.issuingAgencyLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.issuingAgency}</div>
                    </div>
                  )}
                  {detailSubModal.physicalLocation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.physicalLocationLabel')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.physicalLocation}{detailSubModal.physicalLocationDetail ? ` · ${detailSubModal.physicalLocationDetail}` : ''}</div>
                    </div>
                  )}
                  {detailSubModal.company && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'start' }}>
                      <span style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, display: 'block', margin: 0 }}>{t('documents.company')}</span>
                      <div style={{ color: '#e8ecf1', margin: 0, marginTop: '0', fontSize: '0.95rem', fontWeight: 500 }}>{detailSubModal.company}</div>
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
                    <div><div style={{ color: '#a0a4b0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>📍 {t('documents.coordinates')}</div><div style={{ color: '#e8ecf1', fontSize: '0.95rem', fontFamily: 'monospace', marginTop: '0.25rem', fontWeight: 500 }}>Lat: {Number(detailSubModal.latitude).toFixed(6)}<br />Long: {Number(detailSubModal.longitude).toFixed(6)}</div></div>
                    <a href={`https://www.google.com/maps?q=${Number(detailSubModal.latitude)},${Number(detailSubModal.longitude)}`} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>🗺️ {t('documents.googleMaps')}</a>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(124,58,237,0.3)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailSubModal(null)} className="btn secondary">{t('documents.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentsPage



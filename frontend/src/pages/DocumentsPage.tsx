import React, { useEffect, useState } from 'react'
import * as api from '../api'
import type { ApiDocument } from '../api'
import { useAuth } from '../hooks/useAuth'
import extractErrorMessage from '../utils/extractErrorMessage'

const DocumentsPage: React.FC = () => {
  const { token } = useAuth()
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [description, setDescription] = useState('')
  const [documentType, setDocumentType] = useState<'master' | 'sub'>('master')
  const [subDocumentNo, setSubDocumentNo] = useState('')
  const [parentDocumentId, setParentDocumentId] = useState('')
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set())
  const [editingSubDoc, setEditingSubDoc] = useState<{ id: number; currentNo: string } | null>(null)
  const [newSubDocNo, setNewSubDocNo] = useState('')
  const [editingDoc, setEditingDoc] = useState<{ id: number; title: string; location: string; longitude?: number | null; latitude?: number | null; description: string; type: 'master' | 'sub' } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editLongitude, setEditLongitude] = useState('')
  const [editLatitude, setEditLatitude] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [masterFilter, setMasterFilter] = useState<'all' | 'master-only' | 'master-with-subs'>('all')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: 'master' | 'sub'; title: string; hasSubDocs?: boolean } | null>(null)
  const [viewDocument, setViewDocument] = useState<{ id: number; type: 'master' | 'sub'; title: string; fileUrl: string } | null>(null)
  const [mapModal, setMapModal] = useState<{ longitude: number; latitude: number; title: string } | null>(null)
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

  const openDocEditModal = (id: number, title: string, location: string, description: string, type: 'master' | 'sub', longitude?: number | null, latitude?: number | null) => {
    setEditingDoc({ id, title, location, longitude, latitude, description, type })
    setEditTitle(title)
    setEditLocation(location)
    setEditLongitude(longitude?.toString() || '')
    setEditLatitude(latitude?.toString() || '')
    setEditDescription(description)
  }

  function closeDocEditModal() {
    setEditingDoc(null)
    setEditTitle('')
    setEditLocation('')
    setEditLongitude('')
    setEditLatitude('')
    setEditDescription('')
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
        latitude: editLatitude || undefined
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

      const baseURL = 'http://localhost:5001'
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
                <option value="master">Master Document</option>
                <option value="sub">Sub Document</option>
              </select>
            </label>

            {documentType === 'sub' && (
              <>
                <label>
                  Master Document
                  <select value={parentDocumentId} onChange={(e) => setParentDocumentId(e.target.value)} required>
                    <option value="">-- Select Master Document --</option>
                    {docs.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Sub Document No
                  <input 
                    value={subDocumentNo} 
                    onChange={(e) => setSubDocumentNo(e.target.value)} 
                    placeholder="e.g., 1 or 001 (will be formatted to SUB-001)"
                    required 
                  />
                </label>
              </>
            )}

            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Location
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
              Description
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Deskripsi dokumen (maksimal 350 karakter)"
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
            <label>
              File (PDF Only)
              <input 
                type="file" 
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required 
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn primary" type="submit">Upload</button>
              <button className="btn ghost" type="button" onClick={() => setShowUploadForm(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Daftar Dokumen ({filteredDocs.length})</h3>

      {loading ? (
        <p>Loading...</p>
      ) : paginatedDocs.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
          {searchQuery ? 'Tidak ada dokumen yang sesuai dengan pencarian' : 'Belum ada dokumen'}
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
                    <div className="doc-id-badge">{d.documentNo}</div>
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
                    onClick={() => openDocEditModal(d.id, d.title, d.location, d.description || '', 'master', d.longitude, d.latitude)}
                    className="btn ghost"
                    title="Edit document"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleViewDocument(d.id, 'master', d.title)}
                    className="btn ghost"
                    title="View document"
                  >
                    👁️ View
                  </button>
                  <button onClick={() => handleDownloadDocument(d.id)} className="btn">Download</button>
                  <button 
                    onClick={() => openDeleteConfirm(d.id, 'master', d.title, (d.subDocuments?.length || 0) > 0)}
                    className="btn small danger"
                    title="Delete document"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              {expandedDocs.has(d.id) && d.subDocuments && d.subDocuments.length > 0 && (
                <div className="subdoc-container">
                  {d.subDocuments.map((sub) => (
                    <div key={sub.id} className="subdoc-item">
                      <div className="subdoc-info">
                        <button 
                          onClick={() => openEditModal(sub.id, sub.subDocumentNo)}
                          className="subdoc-number"
                          title="Click to edit number"
                          style={{ cursor: 'pointer', border: '1px solid rgba(124,58,237,0.3)' }}
                        >
                          {sub.subDocumentNo}
                        </button>
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
                      </div>
                      <div className="doc-actions">
                        <button 
                          onClick={() => openDocEditModal(sub.id, sub.title, sub.location, sub.description || '', 'sub', sub.longitude, sub.latitude)}
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
                        <button onClick={() => handleDownloadSubDocument(sub.id)} className="btn">Download</button>
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
              ← Sebelumnya
            </button>
            
            <div className="pagination-info">
              Halaman {currentPage} dari {totalPages}
              <span className="muted" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                ({startIndex + 1}-{Math.min(endIndex, filteredDocs.length)} dari {filteredDocs.length})
              </span>
            </div>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn small ghost"
              style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Selanjutnya →
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
            <h3>Edit Sub-Document Number</h3>
            <p className="muted">Current: {editingSubDoc.currentNo}</p>
            <form onSubmit={handleUpdateSubDocNumber}>
              <label>
                New Number
                <input 
                  type="text" 
                  value={newSubDocNo} 
                  onChange={(e) => setNewSubDocNo(e.target.value)}
                  placeholder="e.g., 1 or 001 (will be formatted to SUB-XXX)"
                  required
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="btn ghost">Cancel</button>
                <button type="submit" className="btn primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Info Modal */}
      {editingDoc && (
        <div className="modal-overlay" onClick={closeDocEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editingDoc.type === 'master' ? 'Document' : 'Sub-Document'}</h3>
            <form onSubmit={handleUpdateDocInfo}>
              <label>
                Title
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label>
                Location
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label>
                  Longitude (Opsional)
                  <input 
                    type="number" 
                    step="any" 
                    value={editLongitude} 
                    onChange={(e) => setEditLongitude(e.target.value)} 
                    placeholder="contoh: -197.491239"
                  />
                </label>
                <label>
                  Latitude (Opsional)
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
                Deskripsi (opsional)
                <textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={350}
                  rows={4}
                  placeholder="Tambahkan deskripsi dokumen (maksimal 350 karakter)"
                  style={{ 
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem'
                  }}
                />
                <small style={{ color: '#9aa4b2', marginTop: '0.25rem' }}>
                  {editDescription.length}/350 karakter
                </small>
              </label>
              <div className="modal-actions">
                <button type="button" onClick={closeDocEditModal} className="btn ghost">Cancel</button>
                <button type="submit" className="btn primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Konfirmasi Hapus</h3>
            <p className="muted">
              {deleteConfirm.type === 'master' && deleteConfirm.hasSubDocs ? (
                <>
                  <strong style={{ color: '#f97316' }}>Perhatian!</strong> Master dokumen <strong>"{deleteConfirm.title}"</strong> memiliki sub-dokumen di dalamnya.
                  <br /><br />
                  Menghapus master dokumen akan menghapus semua sub-dokumen terkait. Apakah Anda yakin?
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus {deleteConfirm.type === 'master' ? 'master dokumen' : 'sub-dokumen'} <strong>"{deleteConfirm.title}"</strong>?
                  <br /><br />
                  Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </p>
            <div className="modal-actions">
              <button type="button" onClick={closeDeleteConfirm} className="btn ghost">Batal</button>
              <button 
                type="button" 
                onClick={handleDeleteDocument} 
                className="btn danger"
                style={{ background: 'linear-gradient(90deg, rgba(220,38,38,0.8), rgba(185,28,28,0.8))' }}
              >
                Ya, Hapus
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
                <div className="watermark-text">CONFIDENTIAL</div>
                <div className="watermark-text watermark-diagonal">DO NOT COPY</div>
                <div className="watermark-text watermark-center">PREVIEW ONLY</div>
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
              <h3>🗺️ Lokasi: {mapModal.title}</h3>
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
    </div>
  )
}

export default DocumentsPage

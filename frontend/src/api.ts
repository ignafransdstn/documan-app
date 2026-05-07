// API Base URL — empty string = use Vite proxy (/api/* forwarded server-side to localhost:5001)
// Works for localhost AND LAN devices without CORS issues
const API_BASE = import.meta.env.VITE_API_URL || ''

export type ApiUser = {
  id: number
  username: string
  email: string
  userLevel: 'admin' | 'level1' | 'level2' | 'level3' | 'level4'
  name?: string | null
  isApproved?: boolean
  isActive?: boolean
  createdAt?: string
  lastLogin?: string
}

export type ApiSubDocument = {
  id: number
  title: string
  subDocumentNo: string
  location: string
  longitude?: number | null
  latitude?: number | null
  description?: string
  filePath: string
  parentDocumentId: number
  status?: string
  createdAt?: string
  certificateType?: string
  landSize?: string
  areaName?: string
  projectName?: string
  zoneUrl?: string
  zoneRtdr?: string
  publishDate?: string
  expiredDate?: string
  documentObtained?: string
  issuingAgency?: string
  originDocument?: string
  physicalLocation?: string
  physicalLocationDetail?: string
  previousOwner?: string
  company?: string
  category?: 'Corporate Document' | 'Permit Document'
  permitNumber?: string
}

export interface ApiDocument {
  id: number
  documentNo: string
  title: string
  location: string
  longitude?: number | null
  latitude?: number | null
  description?: string
  filePath: string
  status: string
  createdBy: number
  createdAt: string
  updatedAt: string
  certificateType?: string
  landSize?: string
  areaName?: string
  projectName?: string
  zoneUrl?: string
  zoneRtdr?: string
  publishDate?: string
  expiredDate?: string
  documentObtained?: string
  issuingAgency?: string
  originDocument?: string
  physicalLocation?: string
  physicalLocationDetail?: string
  previousOwner?: string
  company?: string
  category?: 'Corporate Document' | 'Permit Document'
  permitNumber?: string
  subDocuments?: ApiSubDocument[]
}

export type LoginResponse = {
  id: number
  username: string
  email: string
  userLevel: ApiUser['userLevel']
  token: string
}

export type SignupResponse = Partial<LoginResponse> & { isApproved?: boolean; message?: string }

export type Summary = {
  totalUsers: number
  admins: number
  level1: number
  level2: number
  level3: number
  pendingAdmins: number
  totalDocuments: number
  totalMasterDocuments: number
  totalSubDocuments: number
  activeSessions: number
  recentDocuments: Array<Record<string, unknown>>
  statusBreakdown?: {
    active: number
    archived: number
    expired: number
  }
  expiringDocuments?: Array<{
    id: number
    title: string
    expiredDate: string
    location?: string
    docType: 'master' | 'sub'
  }>
  yearAheadNotifications?: Array<{
    id: number
    title: string
    expiredDate: string
    location?: string
    docType: 'master' | 'sub'
  }>
}

export type ActivityLog = {
  id: number
  userId: number
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD'
  entityType?: string
  entityId?: number
  description: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    id: number
    username: string
    userLevel: ApiUser['userLevel']
  }
}

export type ActivityLogsResponse = {
  logs: ActivityLog[]
  totalCount: number
  hasMore: boolean
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      ...options.headers
    },
    credentials: 'include',
    ...options
  })

  if (!res.ok) {
    const text = await res.text()
    let body: unknown = text
    try {
      body = JSON.parse(text)
    } catch {
      // keep body as text
    }
    throw { status: res.status, body }
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json() as Promise<T>
  return res.text() as unknown as Promise<T>
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
}

export async function logout(token: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
}

export async function signup(data: { username: string; password: string; name?: string; userLevel?: string; email: string }): Promise<SignupResponse> {
  return request<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function getDocuments(token?: string): Promise<ApiDocument[]> {
  return request<ApiDocument[]>('/api/documents', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
}

export async function uploadDocument(formData: FormData, token?: string) {
  return request('/api/documents', {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}

export async function uploadSubDocument(formData: FormData, token?: string) {
  return request('/api/documents/sub-document', {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}

export async function getUsers(token?: string): Promise<ApiUser[]> {
  // Force a fresh fetch to avoid 304 Not Modified responses from cached GETs
  return request<ApiUser[]>('/api/users', { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: 'no-store' })
}

export async function updateUser(id: number, data: Partial<ApiUser>, token?: string) {
  return request<ApiUser>(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data)
  })
}

export async function deleteUser(id: number, token?: string) {
  return request(`/api/users/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}

export async function resetUserPassword(id: number, newPassword: string, token?: string) {
  return request(`/api/users/${id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ newPassword })
  })
}

export async function approveUser(id: number, token?: string) {
  return request(`/api/users/${id}/approve`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}

export async function setUserActive(id: number, active: boolean, token?: string) {
  return request(`/api/users/${id}/activation`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ active })
  })
}

export async function getSummary(token?: string): Promise<Summary> {
  return request<Summary>(`/api/users/summary`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
}

export async function deleteDocument(id: number): Promise<void> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function deleteSubDocument(id: number): Promise<void> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_BASE}/api/documents/sub-document/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function downloadDocument(id: number): Promise<void> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token')
  
  const response = await fetch(`${API_BASE}/api/documents/download/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Download failed')
  }
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  
  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('content-disposition')
  let downloadFilename = 'document'
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
    if (filenameMatch) downloadFilename = filenameMatch[1]
  }
  
  a.download = downloadFilename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function downloadSubDocument(id: number): Promise<void> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token')
  
  const response = await fetch(`${API_BASE}/api/documents/sub-document/download/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Download failed')
  }
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  
  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('content-disposition')
  let filename = 'sub-document'
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
    if (filenameMatch) filename = filenameMatch[1]
  }
  
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function updateSubDocumentNumber(id: number, subDocumentNo: string, token?: string) {
  return request(`/api/documents/sub-document/${id}/number`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ subDocumentNo })
  })
}

export async function updateDocumentInfo(id: number, data: { title?: string; location?: string; description?: string; longitude?: string; latitude?: string; category?: string; certificateType?: string; landSize?: string; areaName?: string; projectName?: string; zoneUrl?: string; zoneRtdr?: string; publishDate?: string; expiredDate?: string; documentObtained?: string; issuingAgency?: string; originDocument?: string; physicalLocation?: string; physicalLocationDetail?: string; previousOwner?: string; company?: string; permitNumber?: string; status?: string }, token?: string) {
  return request(`/api/documents/${id}/info`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data)
  })
}

export async function updateSubDocumentInfo(id: number, data: { title?: string; location?: string; description?: string; longitude?: string; latitude?: string; category?: string; certificateType?: string; landSize?: string; areaName?: string; projectName?: string; zoneUrl?: string; zoneRtdr?: string; publishDate?: string; expiredDate?: string; documentObtained?: string; issuingAgency?: string; originDocument?: string; physicalLocation?: string; physicalLocationDetail?: string; previousOwner?: string; company?: string; permitNumber?: string; status?: string }, token?: string) {
  return request(`/api/documents/sub-document/${id}/info`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data)
  })
}

export async function getActivityLogs(token: string, limit = 50, offset = 0): Promise<ActivityLogsResponse> {
  return request<ActivityLogsResponse>(`/api/activity-logs?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function exportActivityLogs(token: string, startDate?: string, endDate?: string): Promise<ActivityLogsResponse> {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  return request<ActivityLogsResponse>(`/api/activity-logs/export?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export interface ApiDocumentVersion {
  id: number | null
  documentId?: number | null
  subDocumentId?: number | null
  versionNumber: number
  filePath?: string
  originalName?: string | null
  fileSize?: number | null
  uploadedBy?: number | null
  label?: string | null
  createdAt?: string
  updatedAt?: string
  syntheticVersion?: boolean
  uploader?: { username: string } | null
}

export async function getDocumentVersions(id: number, type: 'master' | 'sub', token: string): Promise<ApiDocumentVersion[]> {
  const path = type === 'sub' ? `/api/documents/sub-document/${id}/versions` : `/api/documents/${id}/versions`
  return request<ApiDocumentVersion[]>(path, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function uploadDocumentVersion(id: number, type: 'master' | 'sub', formData: FormData, token: string) {
  const path = type === 'sub' ? `/api/documents/sub-document/${id}/versions` : `/api/documents/${id}/versions`
  return request(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })
}

export async function viewDocumentVersion(versionId: number, token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/documents/versions/${versionId}/view`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch document version')
  return response.blob()
}

export async function downloadDocumentVersion(versionId: number, token: string, filename?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/documents/versions/${versionId}/view`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Download failed')
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const contentDisposition = response.headers.get('content-disposition')
  let dl = filename || 'document.pdf'
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+?)"?$/)
    if (match) dl = match[1]
  }
  a.download = dl
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// ---- Project types ----

export type ProjectType = 'project' | 'dispute'
export type ProjectStatus = 'active' | 'closed' | 'on_hold'
export type ProjectInstitution = 'POLSEK' | 'POLRES' | 'POLDA' | 'KEJATI' | 'KEJARI' | 'KEJAGUNG' | 'MA' | 'MK' | 'OTHERS'

export interface ApiProject {
  id: number
  type: ProjectType
  name: string
  number: string
  description?: string | null
  status: ProjectStatus
  institution?: ProjectInstitution | null
  institutionDetail?: string | null
  startDate: string
  estimatedEndDate?: string | null
  actualEndDate?: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
  creator?: { id: number; username: string }
  linkedDocuments?: ApiProjectDocument[]
  supportingDocuments?: ApiProjectSupportingDocument[]
}

export interface ApiProjectDocument {
  id: number
  projectId: number
  documentId?: number | null
  subDocumentId?: number | null
  documentType: 'master' | 'sub'
  document?: Pick<ApiDocument, 'id' | 'title' | 'certificateType' | 'status' | 'expiredDate' | 'location'> | null
  subDocument?: Pick<ApiSubDocument, 'id' | 'title' | 'certificateType' | 'status' | 'expiredDate' | 'location'> | null
}

export interface ApiProjectSupportingDocument {
  id: number
  projectId: number
  filePath: string
  originalName: string
  fileSize?: number | null
  mimeType?: string | null
  uploadedBy: number
  createdAt: string
  uploader?: { id: number; username: string }
}

export interface ApiProjectListResponse {
  projects: ApiProject[]
  totalCount: number
  page: number
  totalPages: number
}

// ---- Project API calls ----

export async function getProjects(token: string, params?: { page?: number; limit?: number; type?: string; status?: string; search?: string }): Promise<ApiProjectListResponse> {
  const q = new URLSearchParams()
  if (params?.page) q.append('page', String(params.page))
  if (params?.limit) q.append('limit', String(params.limit))
  if (params?.type) q.append('type', params.type)
  if (params?.status) q.append('status', params.status)
  if (params?.search) q.append('search', params.search)
  return request<ApiProjectListResponse>(`/api/projects?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
}

export async function getProjectById(id: number, token: string): Promise<ApiProject> {
  return request<ApiProject>(`/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
}

export async function createProject(data: Partial<ApiProject>, token: string): Promise<ApiProject> {
  return request<ApiProject>('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
}

export async function updateProject(id: number, data: Partial<ApiProject>, token: string): Promise<ApiProject> {
  return request<ApiProject>(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
}

export async function deleteProject(id: number, token: string): Promise<void> {
  await request(`/api/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
}

export async function linkDocumentToProject(projectId: number, data: { documentId?: number; subDocumentId?: number; documentType: 'master' | 'sub' }, token: string): Promise<ApiProjectDocument> {
  return request<ApiProjectDocument>(`/api/projects/${projectId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
}

export async function unlinkDocumentFromProject(projectId: number, linkId: number, token: string): Promise<void> {
  await request(`/api/projects/${projectId}/documents/${linkId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
}

export async function uploadProjectSupportingDoc(projectId: number, file: File, token: string): Promise<ApiProjectSupportingDocument> {
  const fd = new FormData()
  fd.append('file', file)
  return request<ApiProjectSupportingDocument>(`/api/projects/${projectId}/supporting-docs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  })
}

export async function downloadProjectSupportingDoc(projectId: number, fileId: number, token: string, originalName: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/supporting-docs/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Download failed')
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = originalName
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function deleteProjectSupportingDoc(projectId: number, fileId: number, token: string): Promise<void> {
  await request(`/api/projects/${projectId}/supporting-docs/${fileId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
}

export interface ApiProjectReportItem {
  id: number
  name: string
  number: string
  type: 'project' | 'dispute'
  status: 'active' | 'closed' | 'on_hold'
  institution?: string | null
  startDate: string
  estimatedEndDate?: string | null
  actualEndDate?: string | null
  createdAt: string
  creator: string
  linkedDocCount: number
  supportingDocCount: number
  durationDays: number
}

export interface ApiProjectReport {
  summary: {
    total: number
    byType: { project: number; dispute: number }
    byStatus: { active: number; closed: number; on_hold: number }
    totalLinkedDocs: number
    totalSupportingDocs: number
  }
  institutionBreakdown: { POLSEK: number; POLRES: number; POLDA: number; KEJATI: number; KEJARI: number; KEJAGUNG: number; MA: number; MK: number; OTHERS: number }
  monthlyTrend: { month: string; count: number }[]
  projects: ApiProjectReportItem[]
}

export async function getProjectReport(token: string, dateFrom?: string, dateTo?: string): Promise<ApiProjectReport> {
  const params = new URLSearchParams()
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return request<ApiProjectReport>(`/api/projects/report${qs}`, { headers: { Authorization: `Bearer ${token}` } })
}

export default { login, getDocuments, uploadDocument, uploadSubDocument, getUsers, updateUser, deleteUser, resetUserPassword, signup, approveUser, setUserActive, getSummary, downloadDocument, downloadSubDocument, updateSubDocumentNumber, updateDocumentInfo, updateSubDocumentInfo, getActivityLogs, exportActivityLogs, getDocumentVersions, uploadDocumentVersion, viewDocumentVersion, downloadDocumentVersion, getProjects, getProjectById, createProject, updateProject, deleteProject, linkDocumentToProject, unlinkDocumentFromProject, uploadProjectSupportingDoc, downloadProjectSupportingDoc, deleteProjectSupportingDoc, getProjectReport }

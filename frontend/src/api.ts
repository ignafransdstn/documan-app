const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export type ApiUser = {
  id: number
  username: string
  email: string
  userLevel: 'admin' | 'level1' | 'level2' | 'level3'
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
  createdAt?: string
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

export async function updateDocumentInfo(id: number, data: { title?: string; location?: string; description?: string; longitude?: string; latitude?: string }, token?: string) {
  return request(`/api/documents/${id}/info`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data)
  })
}

export async function updateSubDocumentInfo(id: number, data: { title?: string; location?: string; description?: string; longitude?: string; latitude?: string }, token?: string) {
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

export default { login, getDocuments, uploadDocument, uploadSubDocument, getUsers, updateUser, deleteUser, resetUserPassword, signup, approveUser, setUserActive, getSummary, downloadDocument, downloadSubDocument, updateSubDocumentNumber, updateDocumentInfo, updateSubDocumentInfo, getActivityLogs }

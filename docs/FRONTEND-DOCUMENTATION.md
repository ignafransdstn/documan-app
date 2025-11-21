# Frontend Documentation - DocuMan

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [State Management](#state-management)
5. [Routing](#routing)
6. [API Integration](#api-integration)
7. [Styling & Animations](#styling--animations)
8. [Security Features](#security-features)
9. [Build & Deployment](#build--deployment)

---

## 🏗️ Architecture Overview

Frontend menggunakan **Component-Based Architecture** dengan React dan TypeScript:

```
User Interface → Components → Context → API Client → Backend
                                ↓
                          Local State
```

### Technology Stack

- **React** 18.2.0 - UI library
- **TypeScript** 5.2.2 - Type safety
- **Vite** 5.0.8 - Build tool & dev server
- **React Router** 6.x - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── favicon.svg              # App icon (DM logo)
├── src/
│   ├── components/
│   │   ├── Nav.tsx              # Navigation component
│   │   └── PageTransition.tsx   # Page transition wrapper
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state
│   ├── hooks/
│   │   └── useAuth.tsx          # Auth hook
│   ├── pages/
│   │   ├── Login.tsx            # Login page
│   │   ├── Dashboard.tsx        # Dashboard with stats
│   │   ├── DocumentsPage.tsx    # Document management
│   │   └── UsersPage.tsx        # User management
│   ├── styles/
│   │   └── theme.css            # Global styles & animations
│   ├── utils/
│   │   └── extractErrorMessage.ts # Error handling utility
│   ├── api.ts                   # API client
│   ├── App.tsx                  # App root component
│   ├── main.tsx                 # Application entry point
│   └── vite-env.d.ts            # TypeScript declarations
├── index.html                   # HTML template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
└── package.json
```

---

## 🧩 Core Components

### 1. App.tsx - Root Component

**File:** `src/App.tsx`

```typescript
function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTransition>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />
            <Route path="/documents" element={
              <PrivateRoute><DocumentsPage /></PrivateRoute>
            } />
            <Route path="/users" element={
              <PrivateRoute><UsersPage /></PrivateRoute>
            } />
            <Route path="/" element={
              <Navigate to="/dashboard" replace />
            } />
          </Routes>
        </PageTransition>
      </Router>
    </AuthProvider>
  );
}
```

**Features:**
- AuthProvider wraps entire app
- PageTransition for smooth navigation
- PrivateRoute protection
- Default redirect to dashboard

### 2. Nav.tsx - Navigation Bar

**File:** `src/components/Nav.tsx`

```typescript
const Nav: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="logo">DocuMan</div>
      
      <div className="nav-links">
        <Link 
          to="/dashboard"
          className={location.pathname === '/dashboard' ? 'active' : ''}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/documents"
          className={location.pathname === '/documents' ? 'active' : ''}
        >
          Documents
        </Link>
        
        {user?.userLevel === 'admin' && (
          <Link 
            to="/users"
            className={location.pathname === '/users' ? 'active' : ''}
          >
            Users
          </Link>
        )}
      </div>
      
      <div className="user-section">
        <span>{user?.username}</span>
        <button onClick={logout}>Sign out</button>
      </div>
    </nav>
  );
};
```

**Features:**
- Active tab detection dengan `useLocation`
- Conditional rendering for admin
- Gradient background on active tab
- Smooth hover transitions

**Styling:**
```css
.nav-links a.active {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2), 
    rgba(147, 51, 234, 0.2)
  );
  border-bottom: 2px solid #fbbf24;
  box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
}
```

### 3. PageTransition.tsx - Page Animation Wrapper

**File:** `src/components/PageTransition.tsx`

```typescript
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<
    'fade-in' | 'fade-out'
  >('fade-in');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  const onAnimationEnd = () => {
    if (transitionStage === 'fade-out') {
      setTransitionStage('fade-in');
      setDisplayLocation(location);
    }
  };

  return (
    <div
      className={`page-transition ${transitionStage}`}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};
```

**Animation Flow:**
```
Route Change → Fade Out (old page) → 
Update Location → Fade In (new page)
```

**CSS Animations:**
```css
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.page-transition.fade-in {
  animation: pageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4. Login.tsx - Authentication Page

**File:** `src/pages/Login.tsx`

```typescript
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h1>DocuMan</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
};
```

**Features:**
- Form validation
- Error handling
- Loading state
- Auto-redirect after login

### 5. Dashboard.tsx - Statistics Page

**File:** `src/pages/Dashboard.tsx`

```typescript
const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardSummary(token || '');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Nav />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard 
                title="Total Documents" 
                value={stats.totalDocuments}
                icon="📄"
              />
              <StatCard 
                title="Active Users" 
                value={stats.totalUsers}
                icon="👥"
              />
              <StatCard 
                title="Active Sessions" 
                value={stats.activeSessions}
                icon="🔐"
              />
            </div>
            
            <RecentDocuments docs={stats.recentDocuments} />
          </>
        )}
      </div>
    </div>
  );
};
```

**Dashboard Cards:**
- Total Documents
- Total Users (by level)
- Active Sessions
- Recent Documents (last 5)

### 6. DocumentsPage.tsx - Main Document Management

**File:** `src/pages/DocumentsPage.tsx`

**State Management:**
```typescript
const [docs, setDocs] = useState<ApiDocument[]>([]);
const [loading, setLoading] = useState(false);
const [file, setFile] = useState<File | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [masterFilter, setMasterFilter] = useState<
  'all' | 'master-only' | 'master-with-subs'
>('all');
const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());
const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
const [mapModal, setMapModal] = useState<MapModal | null>(null);
```

**Key Functions:**

**loadDocuments:**
```typescript
async function loadDocuments() {
  setLoading(true);
  try {
    const res = await api.getDocuments(token || undefined);
    setDocs(res);
  } catch (e) {
    console.error(extractErrorMessage(e));
  } finally {
    setLoading(false);
  }
}
```

**handleUpload:**
```typescript
async function handleUpload(e: React.FormEvent) {
  e.preventDefault();
  
  if (!file) {
    alert('Please select a file');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('location', location);
  if (longitude) formData.append('longitude', longitude);
  if (latitude) formData.append('latitude', latitude);
  formData.append('description', description);

  try {
    if (documentType === 'master') {
      await api.createDocument(formData, token || '');
    } else {
      await api.createSubDocument(
        parseInt(parentDocumentId), 
        formData, 
        token || ''
      );
    }
    
    // Reset form
    resetForm();
    loadDocuments();
    setShowUploadForm(false);
  } catch (error) {
    alert('Upload failed');
  }
}
```

**handleEdit:**
```typescript
async function handleEdit(e: React.FormEvent) {
  e.preventDefault();
  
  if (!editingDoc) return;

  const updates = {
    title: editTitle,
    location: editLocation,
    longitude: editLongitude ? parseFloat(editLongitude) : null,
    latitude: editLatitude ? parseFloat(editLatitude) : null,
    description: editDescription
  };

  try {
    if (editingDoc.type === 'master') {
      await api.updateDocument(editingDoc.id, updates, token || '');
    } else {
      await api.updateSubDocument(editingDoc.id, updates, token || '');
    }
    
    loadDocuments();
    setEditingDoc(null);
  } catch (error) {
    alert('Update failed');
  }
}
```

**handleDelete:**
```typescript
async function handleDelete() {
  if (!deleteConfirm) return;

  try {
    if (deleteConfirm.type === 'master') {
      await api.deleteDocument(deleteConfirm.id, token || '');
    } else {
      await api.deleteSubDocument(deleteConfirm.id, token || '');
    }
    
    loadDocuments();
    setDeleteConfirm(null);
  } catch (error) {
    alert('Delete failed');
  }
}
```

**Document Filtering:**
```typescript
const filteredDocs = docs.filter(doc => {
  // Search filter
  const searchLower = searchQuery.toLowerCase();
  const matchesSearch = 
    doc.title.toLowerCase().includes(searchLower) ||
    doc.description.toLowerCase().includes(searchLower) ||
    doc.location.toLowerCase().includes(searchLower);

  if (!matchesSearch) return false;

  // Master filter
  if (masterFilter === 'master-only') {
    return doc.subDocuments.length === 0;
  }
  if (masterFilter === 'master-with-subs') {
    return doc.subDocuments.length > 0;
  }

  return true; // 'all'
});
```

**Pagination:**
```typescript
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedDocs = filteredDocs.slice(startIndex, endIndex);
const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
```

**Map Modal:**
```typescript
const openMap = (lng: number, lat: number, title: string) => {
  setMapModal({ 
    longitude: Number(lng), 
    latitude: Number(lat), 
    title 
  });
};

// In modal:
<iframe
  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
    mapModal.longitude - 0.01
  },${
    mapModal.latitude - 0.01
  },${
    mapModal.longitude + 0.01
  },${
    mapModal.latitude + 0.01
  }&layer=mapnik&marker=${mapModal.latitude},${mapModal.longitude}`}
  width="100%"
  height="450"
  style={{ border: 0 }}
/>
```

### 7. UsersPage.tsx - User Management (Admin)

**File:** `src/pages/UsersPage.tsx`

**Features:**
- List all users
- Create new user
- Edit user details
- Toggle user activation
- Reset password
- Delete user

**Key Functions:**

```typescript
// Create user
async function handleCreate(e: React.FormEvent) {
  const userData = {
    username, email, password, userLevel, name
  };
  
  await api.createUser(userData, token || '');
  loadUsers();
}

// Toggle activation
async function handleToggleActive(userId: number, active: boolean) {
  await api.toggleUserActivation(userId, !active, token || '');
  loadUsers();
}

// Reset password
async function handleResetPassword(userId: number) {
  const newPassword = prompt('Enter new password:');
  if (newPassword) {
    await api.resetUserPassword(userId, newPassword, token || '');
  }
}

// Delete user
async function handleDelete(userId: number) {
  if (confirm('Are you sure?')) {
    await api.deleteUser(userId, token || '');
    loadUsers();
  }
}
```

---

## 🔄 State Management

### AuthContext

**File:** `src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.login(username, password);
    
    setUser(response);
    setToken(response.token);
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));
  };

  const logout = async () => {
    try {
      await api.logout(token || '');
    } catch (error) {
      console.error('Logout API call failed');
    }
    
    setUser(null);
    setToken(null);
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Usage:**
```typescript
const { user, token, login, logout } = useAuth();

// Check authentication
if (!token) {
  return <Navigate to="/login" />;
}

// Check role
if (user?.userLevel !== 'admin') {
  return <div>Access denied</div>;
}
```

---

## 🛣️ Routing

### Routes Configuration

```typescript
<Routes>
  {/* Public route */}
  <Route path="/login" element={<Login />} />

  {/* Protected routes */}
  <Route 
    path="/dashboard" 
    element={
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/documents" 
    element={
      <PrivateRoute>
        <DocumentsPage />
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/users" 
    element={
      <PrivateRoute>
        <AdminRoute>
          <UsersPage />
        </AdminRoute>
      </PrivateRoute>
    } 
  />

  {/* Default redirect */}
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

### PrivateRoute Component

```typescript
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### AdminRoute Component

```typescript
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { user } = useAuth();

  if (user?.userLevel !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

---

## 🌐 API Integration

### API Client

**File:** `src/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication
export const login = async (username: string, password: string) => {
  const res = await apiClient.post('/auth/login', { 
    username, password 
  });
  return res.data;
};

export const logout = async (token: string) => {
  await apiClient.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Documents
export const getDocuments = async (token?: string) => {
  const headers = token ? { 
    Authorization: `Bearer ${token}` 
  } : {};
  
  const res = await apiClient.get('/documents', { headers });
  return res.data;
};

export const createDocument = async (
  formData: FormData, 
  token: string
) => {
  const res = await apiClient.post('/documents', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const updateDocument = async (
  id: number,
  updates: Partial<ApiDocument>,
  token: string
) => {
  const res = await apiClient.put(`/documents/${id}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteDocument = async (id: number, token: string) => {
  await apiClient.delete(`/documents/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Users
export const getUsers = async (token: string) => {
  const res = await apiClient.get('/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createUser = async (
  userData: CreateUserData, 
  token: string
) => {
  const res = await apiClient.post('/users', userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const toggleUserActivation = async (
  userId: number,
  active: boolean,
  token: string
) => {
  const res = await apiClient.patch(
    `/users/${userId}/activation`,
    { active },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
```

### TypeScript Interfaces

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  userLevel: 'admin' | 'level1' | 'level2' | 'level3';
  name?: string;
  isActive: boolean;
  lastLogin?: string;
  token?: string;
}

export interface ApiDocument {
  id: number;
  documentNo: string;
  title: string;
  filePath: string;
  location: string;
  longitude?: number | null;
  latitude?: number | null;
  description: string;
  status: 'active' | 'archived' | 'deleted';
  createdBy: number;
  creator?: {
    username: string;
  };
  subDocuments: ApiSubDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiSubDocument {
  id: number;
  title: string;
  subDocumentNo: string;
  filePath: string;
  parentDocumentId: number;
  location: string;
  longitude?: number | null;
  latitude?: number | null;
  description: string;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  admins: number;
  level1: number;
  level2: number;
  level3: number;
  totalDocuments: number;
  totalMasterDocuments: number;
  totalSubDocuments: number;
  activeSessions: number;
  recentDocuments: ApiDocument[];
}
```

---

## 🎨 Styling & Animations

### Global Theme

**File:** `src/styles/theme.css`

**Color Palette:**
```css
:root {
  /* Primary Colors */
  --bg-primary: #0f172a;      /* Dark blue background */
  --bg-secondary: #1e293b;    /* Lighter dark blue */
  --text-primary: #f1f5f9;    /* Light text */
  --text-secondary: #94a3b8;  /* Muted text */
  --accent: #fbbf24;          /* Gold/Yellow accent */
  
  /* Status Colors */
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
  
  /* Gradients */
  --gradient-primary: linear-gradient(
    135deg, 
    rgba(59, 130, 246, 0.2), 
    rgba(147, 51, 234, 0.2)
  );
}
```

**Typography:**
```css
body {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
}

h1 { font-size: 2rem; font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; }
h3 { font-size: 1.25rem; font-weight: 600; }
```

### Animation System

**Button Animations:**
```css
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

button:active {
  transform: translateY(0) scale(0.98);
}
```

**Input Animations:**
```css
input:focus {
  border-color: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
  transform: translateY(-1px);
}
```

**Card Animations:**
```css
.document-card {
  transition: all 0.3s ease;
}

.document-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```

**Modal Animations:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-overlay {
  animation: fadeIn 0.3s ease;
}

.modal-content {
  animation: slideUp 0.3s ease;
}
```

**Page Transitions:**
```css
.page-transition {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.page-transition.fade-in {
  animation-name: pageSlideIn;
}

.page-transition.fade-out {
  animation-name: pageSlideOut;
}
```

---

## 🔒 Security Features

### 1. Anti-Screenshot Protection

```typescript
useEffect(() => {
  if (viewDocument) {
    const preventScreenshot = (e: KeyboardEvent) => {
      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        alert('⚠️ Screenshot dilarang!');
        return false;
      }
      
      // Block Cmd+Shift+3/4/5 (Mac)
      if (e.metaKey && e.shiftKey && 
          (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        alert('⚠️ Screenshot dilarang!');
        return false;
      }
      
      // Block Win+Shift+S (Windows)
      if (e.key === 's' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        alert('⚠️ Screenshot dilarang!');
        return false;
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keyup', preventScreenshot);
    document.addEventListener('keydown', preventScreenshot);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('keyup', preventScreenshot);
      document.removeEventListener('keydown', preventScreenshot);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }
}, [viewDocument]);
```

### 2. Token Management

```typescript
// Store token securely
localStorage.setItem('token', token);

// Include in all API requests
headers: {
  'Authorization': `Bearer ${token}`
}

// Clear on logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### 3. Input Sanitization

```typescript
// Validate before submit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!title.trim()) {
    alert('Title required');
    return;
  }
  
  if (!file) {
    alert('File required');
    return;
  }
  
  // Proceed with upload
};
```

### 4. XSS Prevention

```typescript
// React automatically escapes content
<div>{user.username}</div> // Safe

// Dangerous (avoid):
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## 📦 Build & Deployment

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Output: dist/ folder

# Preview production build
npm run preview
```

### Environment Variables

**File:** `.env`

```env
VITE_API_URL=http://localhost:5001/api
```

**Production:**
```env
VITE_API_URL=https://api.documan.app/api
```

### Vite Configuration

**File:** `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          api: ['axios']
        }
      }
    }
  }
});
```

### Deploy to Static Hosting

**Nginx Configuration:**
```nginx
server {
  listen 80;
  server_name documan.app;
  root /var/www/documan/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:5001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

**Apache Configuration:**
```apache
<VirtualHost *:80>
  ServerName documan.app
  DocumentRoot /var/www/documan/dist

  <Directory /var/www/documan/dist>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
    
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </Directory>
</VirtualHost>
```

---

## 🧪 Testing (Recommended)

### Unit Testing Setup

```bash
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev vitest
```

**Sample Test:**
```typescript
import { render, screen } from '@testing-library/react';
import { Login } from './Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
});
```

---

## 📊 Performance Optimization

### Code Splitting

```typescript
// Lazy load pages
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));

// Wrap with Suspense
<Suspense fallback={<Loading />}>
  <DocumentsPage />
</Suspense>
```

### Memoization

```typescript
// Memoize expensive calculations
const filteredDocs = useMemo(() => {
  return docs.filter(doc => 
    doc.title.includes(searchQuery)
  );
}, [docs, searchQuery]);

// Memoize callbacks
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### Image Optimization

```typescript
// Lazy load images
<img loading="lazy" src={imageSrc} alt="..." />

// Use appropriate formats
- PNG for icons
- JPEG for photos
- SVG for logos
```

---

## 🔍 Browser DevTools

### React DevTools

```bash
# Install extension
https://react-devtools.com/

# Features:
- Component tree inspection
- Props/state viewing
- Performance profiling
```

### Network Monitoring

```javascript
// Monitor API calls
console.log('Request:', url, data);
console.log('Response:', response.data);

// Track load times
performance.mark('start');
// ... code ...
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🚀 Deployment Checklist

- [ ] Update VITE_API_URL to production
- [ ] Build project (`npm run build`)
- [ ] Test production build locally
- [ ] Configure web server (Nginx/Apache)
- [ ] Set up SSL certificate
- [ ] Enable compression (gzip/brotli)
- [ ] Configure caching headers
- [ ] Test all pages and features
- [ ] Monitor performance
- [ ] Set up error tracking (Sentry)

---

**Version:** 1.0.0  
**Last Updated:** November 21, 2025  
**Maintained by:** Frontend Development Team

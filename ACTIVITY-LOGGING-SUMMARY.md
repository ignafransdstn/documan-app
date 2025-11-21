# Activity Logging Implementation Summary

## Tanggal Implementasi
20 November 2024

## Fitur yang Telah Ditambahkan

### 1. Backend Implementation

#### A. Database Model
- **File**: `backend/src/models/activityLog.js`
- **Tabel**: `ActivityLogs`
- **Fields**:
  - `id`: Primary key (INTEGER, auto-increment)
  - `userId`: Foreign key ke Users table (INTEGER, NOT NULL)
  - `action`: ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD')
  - `entityType`: Tipe entitas (document, subdocument, user, dll) - VARCHAR(255), nullable
  - `entityId`: ID entitas - INTEGER, nullable
  - `description`: Deskripsi aktivitas - TEXT, NOT NULL
  - `ipAddress`: IP address user - VARCHAR(255), nullable
  - `userAgent`: User agent browser - TEXT, nullable
  - `createdAt`: Timestamp pembuatan
  - `updatedAt`: Timestamp update
- **Association**: belongsTo User (sebagai 'user')

#### B. Utility Function
- **File**: `backend/src/utils/activityLogger.js`
- **Function**: `logActivity()`
- **Parameters**:
  ```javascript
  {
    userId,          // Required: ID user yang melakukan aktivitas
    action,          // Required: Tipe aktivitas (LOGIN, LOGOUT, CREATE, dll)
    description,     // Required: Deskripsi aktivitas
    entityType,      // Optional: Tipe entitas (document, subdocument)
    entityId,        // Optional: ID entitas
    req             // Optional: Request object untuk ekstrak IP & user agent
  }
  ```
- **Fitur**:
  - Ekstrak IP address dari `req.ip` atau `req.connection.remoteAddress`
  - Ekstrak User-Agent dari headers
  - Error handling yang tidak mengganggu flow utama

#### C. API Endpoints
- **File**: `backend/src/routes/activityLogs.js`
- **Endpoint**: `GET /api/activity-logs`
- **Authentication**: Requires Bearer token
- **Query Parameters**:
  - `limit`: Jumlah maksimal records (default: 50)
  - `offset`: Offset untuk pagination (default: 0)
- **Response**:
  ```json
  {
    "logs": [...],
    "totalCount": 100,
    "hasMore": true
  }
  ```
- **Access Control**:
  - Admin: Melihat semua activity logs (semua user)
  - Level 1/2/3: Hanya melihat activity logs mereka sendiri

#### D. Activity Logging Integration

**1. Authentication Activities**
- **File**: `backend/src/controllers/authController.js`
- **Login**: Log setelah update lastLogin
- **Logout**: Log setelah update lastLogout

**2. Document Operations**
- **File**: `backend/src/controllers/documentController.js`
- **CREATE**: 
  - Master document: "Created master document: {title}"
  - Sub-document: "Created sub-document: {title}"
- **UPDATE**: 
  - Master document info: "Updated document info: {title}"
  - Sub-document info: "Updated sub-document info: {title}"
- **DELETE**: 
  - Master document: "Deleted master document: {title}"
  - Sub-document: "Deleted sub-document: {title}"
- **DOWNLOAD**: 
  - Master document: "Downloaded master document: {title}"
  - Sub-document: "Downloaded sub-document: {title}"

### 2. Frontend Implementation

#### A. API Types & Functions
- **File**: `frontend/src/api.ts`
- **Types**:
  ```typescript
  type ActivityLog = {
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

  type ActivityLogsResponse = {
    logs: ActivityLog[]
    totalCount: number
    hasMore: boolean
  }
  ```
- **Function**: `getActivityLogs(token, limit, offset)`

#### B. Dashboard Display
- **File**: `frontend/src/pages/Dashboard.tsx`
- **Fitur**:
  - Fetch activity logs on mount
  - Auto-refresh setiap 30 detik
  - Tampilan "Aktivitas Terbaru" card
  - Color-coded dots berdasarkan action type:
    - 🔵 LOGIN: Blue (#3b82f6)
    - ⚪ LOGOUT: Gray (#6b7280)
    - 🟢 CREATE: Green (#22c55e)
    - 🟡 UPDATE: Orange (#f59e0b)
    - 🔴 DELETE: Red (#ef4444)
    - 🟣 VIEW: Purple (#8b5cf6)
    - 🔵 DOWNLOAD: Cyan (#06b6d4)
  - Relative time display:
    - "Baru saja" (< 1 menit)
    - "X menit yang lalu" (< 1 jam)
    - "X jam yang lalu" (< 1 hari)
    - "Kemarin" (1 hari)
    - Date format untuk lebih dari 1 hari
  - Conditional username display:
    - Admin: Menampilkan username user yang melakukan aktivitas
    - Level 1/2/3: Hanya menampilkan action type (karena hanya melihat aktivitas sendiri)

### 3. Access Control

#### Admin User
- Melihat **SEMUA** activity logs dari semua user
- Dapat melihat username dan user level di setiap log entry
- Refresh otomatis setiap 30 detik
- Menampilkan hingga 10 aktivitas terbaru di dashboard

#### Level 1/2/3 Users
- Hanya melihat activity logs **mereka sendiri**
- Username tidak ditampilkan (karena sudah jelas itu aktivitas mereka)
- Refresh otomatis setiap 30 detik
- Menampilkan hingga 10 aktivitas terbaru di dashboard

## Testing

### Test Script
- **File**: `backend/src/scripts/testActivityLogs.js`
- **Test Cases**:
  1. ✅ Login as admin - log created
  2. ✅ Fetch activity logs - data returned correctly
  3. ✅ Logout - log created
  4. ✅ Login again - verify logout was logged
  5. ✅ Verify activity ordering (newest first)

### Test Results
```
✅ All activity logging tests passed!

Sample output:
1. [LOGIN] User logged in successfully - 20 Nov, 16.34
2. [LOGOUT] User logged out - 20 Nov, 16.34
3. [LOGIN] User logged in successfully - 20 Nov, 16.34
```

## Activity Types Tracked

### Authentication
- ✅ LOGIN - User logged in successfully
- ✅ LOGOUT - User logged out

### Document Operations
- ✅ CREATE - Created master document / sub-document
- ✅ UPDATE - Updated document info / sub-document info
- ✅ DELETE - Deleted master document / sub-document
- ✅ DOWNLOAD - Downloaded master document / sub-document
- ⚠️ VIEW - Not yet implemented (pending requirement clarification)

## Database Schema

```sql
CREATE TABLE "ActivityLogs" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON UPDATE CASCADE,
  "action" ENUM('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD') NOT NULL,
  "entityType" VARCHAR(255) NULL COMMENT 'document, subdocument, user, etc',
  "entityId" INTEGER NULL,
  "description" TEXT NOT NULL,
  "ipAddress" VARCHAR(255) NULL,
  "userAgent" TEXT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## File Changes Summary

### New Files Created
1. `backend/src/models/activityLog.js` - ActivityLog model
2. `backend/src/utils/activityLogger.js` - Logging utility
3. `backend/src/routes/activityLogs.js` - API routes
4. `backend/src/scripts/testActivityLogs.js` - Test script

### Modified Files
1. `backend/src/models/index.js` - Added ActivityLog to modelDefiners
2. `backend/src/app.js` - Registered activity logs routes
3. `backend/src/controllers/authController.js` - Added LOGIN and LOGOUT logging
4. `backend/src/controllers/documentController.js` - Added CREATE, UPDATE, DELETE, DOWNLOAD logging
5. `frontend/src/api.ts` - Added ActivityLog types and getActivityLogs function
6. `frontend/src/pages/Dashboard.tsx` - Added activity logs display

## Next Steps / Future Enhancements

### Pending Implementation
- [ ] VIEW action logging (when user opens PDF preview modal)
- [ ] Activity filtering by date range
- [ ] Activity export to CSV/PDF
- [ ] Advanced search/filter in activity logs

### Possible Improvements
- [ ] Real-time updates using WebSocket instead of polling
- [ ] Activity log retention policy (auto-delete old logs)
- [ ] Enhanced activity details (e.g., show what fields were changed in UPDATE)
- [ ] Activity statistics dashboard (most active users, action breakdown)
- [ ] Email notifications for critical activities

## Notes

1. **Auto-refresh**: Activity logs refresh setiap 30 detik bersamaan dengan dashboard statistics
2. **Performance**: Query dibatasi 10 records untuk menghindari overload
3. **Privacy**: Level 1/2/3 users hanya bisa melihat aktivitas mereka sendiri
4. **Error Handling**: Activity logging tidak akan mengganggu operasi utama (menggunakan try-catch internal)
5. **IP Tracking**: IP address user dicatat untuk audit purposes
6. **User Agent**: Browser/device information dicatat untuk troubleshooting

## Compatibility

- ✅ Backend: Node.js 18+, PostgreSQL
- ⚠️ Frontend: Requires Node.js 20.19+ or 22.12+ (current: 18.20.8 - needs upgrade)
- ✅ Database: PostgreSQL with Sequelize ORM
- ✅ Authentication: JWT Bearer tokens

## Status

**Implementation Status**: ✅ Complete (except VIEW action)
**Testing Status**: ✅ Passed
**Documentation Status**: ✅ Complete
**Deployment Ready**: ⚠️ Yes (frontend needs Node.js upgrade)

---

Dibuat oleh: GitHub Copilot
Tanggal: 20 November 2024, 16:34 WIB

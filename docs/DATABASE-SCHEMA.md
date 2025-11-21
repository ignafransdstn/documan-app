# Database Schema Documentation - DocuMan PostgreSQL

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Database Configuration](#database-configuration)
3. [Tables Structure](#tables-structure)
4. [Table Relationships](#table-relationships)
5. [Indexes & Constraints](#indexes--constraints)
6. [Data Types](#data-types)
7. [Query Examples](#query-examples)
8. [Database Maintenance](#database-maintenance)

---

## 🗄️ Database Overview

### Database Information

| Property | Value |
|----------|-------|
| **Database Name** | `document_management_dev` (development) |
| | `document_management_test` (testing) |
| | `document_management_prod` (production) |
| **Database Engine** | PostgreSQL 14+ |
| **ORM** | Sequelize 6.x |
| **Character Set** | UTF8 |
| **Timezone** | UTC |

### Schema Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────┘

4 Main Tables:
├── Users (User accounts & authentication)
├── Documents (Master documents)
├── SubDocuments (Child documents)
└── ActivityLogs (Audit trail)

Relationships:
├── Users → Documents (1:N - creator)
├── Users → ActivityLogs (1:N - actor)
├── Documents → SubDocuments (1:N - parent-child)
└── Documents → Users (N:1 - createdBy)
```

---

## ⚙️ Database Configuration

### Connection Settings

**Development:**
```javascript
{
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'document_management_dev',
  username: 'your_username',
  password: 'your_password',
  logging: console.log
}
```

**Testing:**
```javascript
{
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'document_management_test',
  username: 'your_username',
  password: 'your_password',
  logging: false
}
```

**Production:**
```javascript
{
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
}
```

### Connection Pool Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| max | 10 | Maximum connections |
| min | 2 | Minimum connections |
| acquire | 30000ms | Max time to get connection |
| idle | 10000ms | Max idle time before release |

---

## 📊 Tables Structure

### 1. Users Table

**Table Name:** `Users`

**Purpose:** Store user accounts with authentication and authorization data

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `username` | VARCHAR(255) | UNIQUE, NOT NULL | Login username |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `userLevel` | ENUM | NOT NULL | Role: 'admin', 'level1', 'level2', 'level3' |
| `name` | VARCHAR(255) | NULLABLE | Full name |
| `isActive` | BOOLEAN | DEFAULT true | Account status |
| `lastLogin` | TIMESTAMP | NULLABLE | Last login timestamp |
| `lastLogout` | TIMESTAMP | NULLABLE | Last logout timestamp |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Last update time |

**SQL Definition:**
```sql
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "userLevel" VARCHAR(50) NOT NULL CHECK (
    "userLevel" IN ('admin', 'level1', 'level2', 'level3')
  ),
  "name" VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "lastLogout" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_users_username ON "Users"("username");
CREATE INDEX idx_users_email ON "Users"("email");
CREATE INDEX idx_users_userLevel ON "Users"("userLevel");
CREATE INDEX idx_users_isActive ON "Users"("isActive");
```

**Sample Data:**
```sql
INSERT INTO "Users" 
  (username, email, password, userLevel, name, isActive) 
VALUES 
  ('admin', 'admin@example.com', '$2b$10$...', 'admin', 'Admin User', true),
  ('user1', 'user1@example.com', '$2b$10$...', 'level1', 'Manager User', true),
  ('user2', 'user2@example.com', '$2b$10$...', 'level2', 'Staff User', true),
  ('user3', 'user3@example.com', '$2b$10$...', 'level3', 'Viewer User', true);
```

---

### 2. Documents Table

**Table Name:** `Documents`

**Purpose:** Store master documents with metadata and file information

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique document identifier |
| `documentNo` | VARCHAR(255) | UNIQUE, NOT NULL | Auto-generated doc number (DOC-YYYYMMDD-XXXX) |
| `title` | VARCHAR(255) | NOT NULL | Document title |
| `filePath` | VARCHAR(500) | NOT NULL | Path to PDF file |
| `location` | VARCHAR(255) | NOT NULL | Physical/logical location |
| `longitude` | DECIMAL(10,7) | NULLABLE | GPS longitude coordinate |
| `latitude` | DECIMAL(10,7) | NULLABLE | GPS latitude coordinate |
| `description` | TEXT | NOT NULL | Document description |
| `status` | ENUM | DEFAULT 'active' | Status: 'active', 'archived', 'deleted' |
| `createdBy` | INTEGER | FOREIGN KEY, NOT NULL | Reference to Users.id |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Last update time |

**SQL Definition:**
```sql
CREATE TABLE "Documents" (
  "id" SERIAL PRIMARY KEY,
  "documentNo" VARCHAR(255) UNIQUE NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(500) NOT NULL,
  "location" VARCHAR(255) NOT NULL,
  "longitude" DECIMAL(10,7),
  "latitude" DECIMAL(10,7),
  "description" TEXT NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active' CHECK (
    "status" IN ('active', 'archived', 'deleted')
  ),
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT
);
```

**Indexes:**
```sql
CREATE INDEX idx_documents_documentNo ON "Documents"("documentNo");
CREATE INDEX idx_documents_title ON "Documents"("title");
CREATE INDEX idx_documents_status ON "Documents"("status");
CREATE INDEX idx_documents_createdBy ON "Documents"("createdBy");
CREATE INDEX idx_documents_location ON "Documents"("location");
CREATE INDEX idx_documents_createdAt ON "Documents"("createdAt" DESC);
```

**Sample Data:**
```sql
INSERT INTO "Documents" 
  (documentNo, title, filePath, location, longitude, latitude, 
   description, status, createdBy) 
VALUES 
  ('DOC-20250121-0001', 'Project Proposal', 
   'uploads/1234567890-proposal.pdf', 'Jakarta Office', 
   106.8456, -6.2088, 'Q1 2025 Project Proposal', 'active', 1),
  
  ('DOC-20250121-0002', 'Financial Report', 
   'uploads/1234567891-finance.pdf', 'Head Office', 
   106.8270, -6.1751, 'Annual Financial Report 2024', 'active', 1);
```

---

### 3. SubDocuments Table

**Table Name:** `SubDocuments`

**Purpose:** Store sub-documents (child documents) linked to master documents

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique sub-document identifier |
| `subDocumentNo` | VARCHAR(255) | UNIQUE, NOT NULL | Auto-generated (ParentNo-SUB-XXX) |
| `title` | VARCHAR(255) | NOT NULL | Sub-document title |
| `filePath` | VARCHAR(500) | NOT NULL | Path to PDF file |
| `parentDocumentId` | INTEGER | FOREIGN KEY, NOT NULL | Reference to Documents.id |
| `location` | VARCHAR(255) | NOT NULL | Physical/logical location |
| `longitude` | DECIMAL(10,7) | NULLABLE | GPS longitude coordinate |
| `latitude` | DECIMAL(10,7) | NULLABLE | GPS latitude coordinate |
| `description` | TEXT | NOT NULL | Sub-document description |
| `status` | VARCHAR(50) | DEFAULT 'active' | Document status |
| `createdBy` | INTEGER | FOREIGN KEY, NOT NULL | Reference to Users.id |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Last update time |

**SQL Definition:**
```sql
CREATE TABLE "SubDocuments" (
  "id" SERIAL PRIMARY KEY,
  "subDocumentNo" VARCHAR(255) UNIQUE NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(500) NOT NULL,
  "parentDocumentId" INTEGER NOT NULL,
  "location" VARCHAR(255) NOT NULL,
  "longitude" DECIMAL(10,7),
  "latitude" DECIMAL(10,7),
  "description" TEXT NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active',
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  FOREIGN KEY ("parentDocumentId") REFERENCES "Documents"("id") 
    ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT
);
```

**Indexes:**
```sql
CREATE INDEX idx_subdocuments_subDocumentNo 
  ON "SubDocuments"("subDocumentNo");
CREATE INDEX idx_subdocuments_parentDocumentId 
  ON "SubDocuments"("parentDocumentId");
CREATE INDEX idx_subdocuments_title 
  ON "SubDocuments"("title");
CREATE INDEX idx_subdocuments_createdBy 
  ON "SubDocuments"("createdBy");
CREATE INDEX idx_subdocuments_status 
  ON "SubDocuments"("status");
```

**Sample Data:**
```sql
INSERT INTO "SubDocuments" 
  (subDocumentNo, title, filePath, parentDocumentId, 
   location, description, createdBy) 
VALUES 
  ('DOC-20250121-0001-SUB-001', 'Budget Breakdown', 
   'uploads/1234567892-budget.pdf', 1, 
   'Jakarta Office', 'Detailed budget breakdown for Q1 2025', 2),
  
  ('DOC-20250121-0001-SUB-002', 'Timeline', 
   'uploads/1234567893-timeline.pdf', 1, 
   'Jakarta Office', 'Project timeline and milestones', 2);
```

---

### 4. ActivityLogs Table

**Table Name:** `ActivityLogs`

**Purpose:** Audit trail for all user activities and system events

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique log identifier |
| `userId` | INTEGER | FOREIGN KEY, NULLABLE | Reference to Users.id |
| `action` | VARCHAR(50) | NOT NULL | Action type (LOGIN, LOGOUT, CREATE, etc.) |
| `details` | JSONB | NULLABLE | Additional details as JSON |
| `ipAddress` | VARCHAR(50) | NULLABLE | User IP address |
| `createdAt` | TIMESTAMP | NOT NULL | When action occurred |

**SQL Definition:**
```sql
CREATE TABLE "ActivityLogs" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER,
  "action" VARCHAR(50) NOT NULL,
  "details" JSONB,
  "ipAddress" VARCHAR(50),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_activitylogs_userId 
  ON "ActivityLogs"("userId");
CREATE INDEX idx_activitylogs_action 
  ON "ActivityLogs"("action");
CREATE INDEX idx_activitylogs_createdAt 
  ON "ActivityLogs"("createdAt" DESC);
CREATE INDEX idx_activitylogs_details 
  ON "ActivityLogs" USING gin("details");
```

**Sample Data:**
```sql
INSERT INTO "ActivityLogs" 
  (userId, action, details, ipAddress) 
VALUES 
  (1, 'LOGIN', 
   '{"username": "admin", "success": true}'::jsonb, 
   '192.168.1.100'),
  
  (1, 'CREATE', 
   '{"type": "document", "documentId": 1, "title": "Project Proposal"}'::jsonb, 
   '192.168.1.100'),
  
  (2, 'VIEW', 
   '{"type": "document", "documentId": 1}'::jsonb, 
   '192.168.1.101');
```

---

## 🔗 Table Relationships

### Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP DIAGRAM                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      Users       │
│──────────────────│
│ 🔑 id (PK)       │
│    username      │
│    email         │
│    password      │
│    userLevel     │
│    name          │
│    isActive      │
│    lastLogin     │
│    lastLogout    │
└────────┬─────────┘
         │
         │ 1:N (creator)
         │
         ├────────────────────────────────────┐
         │                                    │
         ↓                                    ↓
┌────────────────────┐              ┌─────────────────┐
│    Documents       │              │  ActivityLogs   │
│────────────────────│              │─────────────────│
│ 🔑 id (PK)         │              │ 🔑 id (PK)      │
│    documentNo      │              │ 🔗 userId (FK)  │
│    title           │              │    action       │
│    filePath        │              │    details      │
│    location        │              │    ipAddress    │
│    longitude       │              └─────────────────┘
│    latitude        │
│    description     │
│    status          │
│ 🔗 createdBy (FK)  │
└────────┬───────────┘
         │
         │ 1:N (parent)
         │
         ↓
┌────────────────────────┐
│    SubDocuments        │
│────────────────────────│
│ 🔑 id (PK)             │
│ 🔗 parentDocumentId(FK)│
│    subDocumentNo       │
│    title               │
│    filePath            │
│    location            │
│    longitude           │
│    latitude            │
│    description         │
│    status              │
│ 🔗 createdBy (FK)      │
└────────────────────────┘
```

### Relationship Details

#### 1. Users → Documents (One-to-Many)

```sql
-- Foreign Key
ALTER TABLE "Documents"
  ADD CONSTRAINT fk_documents_createdBy
  FOREIGN KEY ("createdBy") 
  REFERENCES "Users"("id")
  ON DELETE RESTRICT;

-- Relationship Type: 1:N
-- Cascading: RESTRICT (cannot delete user with documents)
-- Join Example:
SELECT d.*, u.username as creatorName
FROM "Documents" d
INNER JOIN "Users" u ON d."createdBy" = u.id;
```

#### 2. Documents → SubDocuments (One-to-Many)

```sql
-- Foreign Key
ALTER TABLE "SubDocuments"
  ADD CONSTRAINT fk_subdocuments_parentDocumentId
  FOREIGN KEY ("parentDocumentId") 
  REFERENCES "Documents"("id")
  ON DELETE CASCADE;

-- Relationship Type: 1:N
-- Cascading: CASCADE (delete sub-docs when parent deleted)
-- Join Example:
SELECT d.*, 
       json_agg(sd.*) as subDocuments
FROM "Documents" d
LEFT JOIN "SubDocuments" sd ON d.id = sd."parentDocumentId"
GROUP BY d.id;
```

#### 3. Users → SubDocuments (One-to-Many)

```sql
-- Foreign Key
ALTER TABLE "SubDocuments"
  ADD CONSTRAINT fk_subdocuments_createdBy
  FOREIGN KEY ("createdBy") 
  REFERENCES "Users"("id")
  ON DELETE RESTRICT;

-- Relationship Type: 1:N
-- Cascading: RESTRICT (cannot delete user with sub-documents)
```

#### 4. Users → ActivityLogs (One-to-Many)

```sql
-- Foreign Key
ALTER TABLE "ActivityLogs"
  ADD CONSTRAINT fk_activitylogs_userId
  FOREIGN KEY ("userId") 
  REFERENCES "Users"("id")
  ON DELETE SET NULL;

-- Relationship Type: 1:N
-- Cascading: SET NULL (preserve logs even if user deleted)
-- Join Example:
SELECT al.*, u.username
FROM "ActivityLogs" al
LEFT JOIN "Users" u ON al."userId" = u.id
ORDER BY al."createdAt" DESC;
```

### Cascade Behavior Summary

| Relationship | On Delete |
|--------------|-----------|
| Users → Documents | RESTRICT (prevent deletion) |
| Users → SubDocuments | RESTRICT (prevent deletion) |
| Documents → SubDocuments | CASCADE (delete children) |
| Users → ActivityLogs | SET NULL (preserve logs) |

---

## 🔒 Indexes & Constraints

### Primary Keys

```sql
-- All tables use SERIAL (auto-increment) primary keys
ALTER TABLE "Users" ADD PRIMARY KEY ("id");
ALTER TABLE "Documents" ADD PRIMARY KEY ("id");
ALTER TABLE "SubDocuments" ADD PRIMARY KEY ("id");
ALTER TABLE "ActivityLogs" ADD PRIMARY KEY ("id");
```

### Unique Constraints

```sql
-- Users table
ALTER TABLE "Users" ADD CONSTRAINT uk_users_username 
  UNIQUE ("username");
ALTER TABLE "Users" ADD CONSTRAINT uk_users_email 
  UNIQUE ("email");

-- Documents table
ALTER TABLE "Documents" ADD CONSTRAINT uk_documents_documentNo 
  UNIQUE ("documentNo");

-- SubDocuments table
ALTER TABLE "SubDocuments" ADD CONSTRAINT uk_subdocuments_subDocumentNo 
  UNIQUE ("subDocumentNo");
```

### Check Constraints

```sql
-- Users.userLevel validation
ALTER TABLE "Users" ADD CONSTRAINT chk_users_userLevel 
  CHECK ("userLevel" IN ('admin', 'level1', 'level2', 'level3'));

-- Documents.status validation
ALTER TABLE "Documents" ADD CONSTRAINT chk_documents_status 
  CHECK ("status" IN ('active', 'archived', 'deleted'));

-- Coordinate range validation (optional)
ALTER TABLE "Documents" ADD CONSTRAINT chk_documents_longitude 
  CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "Documents" ADD CONSTRAINT chk_documents_latitude 
  CHECK ("latitude" BETWEEN -90 AND 90);
```

### Performance Indexes

```sql
-- Frequently queried columns
CREATE INDEX idx_documents_status_createdAt 
  ON "Documents"("status", "createdAt" DESC);

CREATE INDEX idx_subdocuments_parent_status 
  ON "SubDocuments"("parentDocumentId", "status");

CREATE INDEX idx_activitylogs_user_action 
  ON "ActivityLogs"("userId", "action");

-- Full-text search (if needed)
CREATE INDEX idx_documents_title_search 
  ON "Documents" USING gin(to_tsvector('english', "title"));
CREATE INDEX idx_documents_description_search 
  ON "Documents" USING gin(to_tsvector('english', "description"));
```

---

## 📐 Data Types

### Type Definitions

| PostgreSQL Type | Sequelize Type | Usage | Example |
|----------------|----------------|-------|---------|
| SERIAL | INTEGER (autoIncrement) | Primary keys | 1, 2, 3 |
| VARCHAR(n) | STRING(n) | Text fields | "admin", "Doc Title" |
| TEXT | TEXT | Long text | Descriptions |
| BOOLEAN | BOOLEAN | True/false | true, false |
| DECIMAL(10,7) | DECIMAL(10,7) | GPS coordinates | 106.8456000 |
| TIMESTAMP | DATE | Datetime | 2025-01-21 10:30:00 |
| JSONB | JSONB | Structured data | {"key": "value"} |
| ENUM | ENUM | Limited values | 'admin', 'level1' |

### GPS Coordinate Precision

```
DECIMAL(10,7):
- Total digits: 10
- Decimal places: 7
- Range: -999.9999999 to 999.9999999

Precision:
- ~11.1mm at equator
- Sufficient for building-level accuracy

Examples:
- Longitude: 106.8456789 (Jakarta)
- Latitude: -6.2088123 (Jakarta)
```

### JSONB Usage (ActivityLogs.details)

```sql
-- Store complex data
INSERT INTO "ActivityLogs" (userId, action, details)
VALUES (1, 'CREATE', '{
  "type": "document",
  "documentId": 123,
  "title": "New Document",
  "metadata": {
    "location": "Jakarta",
    "fileSize": 1024000
  }
}'::jsonb);

-- Query JSON data
SELECT * FROM "ActivityLogs"
WHERE details->>'type' = 'document';

SELECT * FROM "ActivityLogs"
WHERE details->'metadata'->>'location' = 'Jakarta';
```

---

## 📝 Query Examples

### Common Queries

#### 1. Get All Documents with Creator Info

```sql
SELECT 
  d.*,
  u.username as creatorName,
  u.email as creatorEmail
FROM "Documents" d
INNER JOIN "Users" u ON d."createdBy" = u.id
WHERE d."status" = 'active'
ORDER BY d."createdAt" DESC;
```

#### 2. Get Document with All Sub-Documents

```sql
SELECT 
  d.*,
  json_agg(
    json_build_object(
      'id', sd.id,
      'title', sd.title,
      'subDocumentNo', sd."subDocumentNo",
      'filePath', sd."filePath",
      'location', sd.location,
      'description', sd.description
    )
  ) FILTER (WHERE sd.id IS NOT NULL) as subDocuments
FROM "Documents" d
LEFT JOIN "SubDocuments" sd ON d.id = sd."parentDocumentId"
WHERE d.id = $1
GROUP BY d.id;
```

#### 3. Get User Activity Log

```sql
SELECT 
  al.action,
  al.details,
  al."ipAddress",
  al."createdAt",
  u.username
FROM "ActivityLogs" al
LEFT JOIN "Users" u ON al."userId" = u.id
WHERE al."userId" = $1
ORDER BY al."createdAt" DESC
LIMIT 50;
```

#### 4. Search Documents by Title

```sql
SELECT * FROM "Documents"
WHERE "title" ILIKE '%search term%'
  AND "status" = 'active'
ORDER BY "createdAt" DESC;
```

#### 5. Get Dashboard Statistics

```sql
-- Total users by level
SELECT 
  "userLevel",
  COUNT(*) as count
FROM "Users"
WHERE "isActive" = true
GROUP BY "userLevel";

-- Total documents
SELECT 
  COUNT(*) as totalDocuments,
  COUNT(*) FILTER (WHERE "status" = 'active') as activeDocuments,
  COUNT(*) FILTER (WHERE "status" = 'archived') as archivedDocuments
FROM "Documents";

-- Active sessions
SELECT COUNT(*) as activeSessions
FROM "Users"
WHERE "isActive" = true
  AND (
    "lastLogout" IS NULL 
    OR "lastLogin" > "lastLogout"
  );
```

#### 6. Get Documents by Location

```sql
-- Exact location match
SELECT * FROM "Documents"
WHERE "location" = 'Jakarta Office';

-- Location search
SELECT * FROM "Documents"
WHERE "location" ILIKE '%Jakarta%';

-- Documents with GPS coordinates
SELECT * FROM "Documents"
WHERE "longitude" IS NOT NULL 
  AND "latitude" IS NOT NULL;
```

#### 7. Get Recent Activity

```sql
SELECT 
  al.action,
  u.username,
  al.details->>'type' as actionType,
  al."createdAt"
FROM "ActivityLogs" al
INNER JOIN "Users" u ON al."userId" = u.id
WHERE al."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY al."createdAt" DESC
LIMIT 100;
```

### Advanced Queries

#### 8. Full-Text Search

```sql
-- Search in title and description
SELECT * FROM "Documents"
WHERE 
  to_tsvector('english', "title" || ' ' || "description") 
  @@ to_tsquery('english', 'project & proposal');
```

#### 9. Geospatial Query (Nearby Documents)

```sql
-- Find documents within 10km radius
SELECT *,
  earth_distance(
    ll_to_earth("latitude", "longitude"),
    ll_to_earth(-6.2088, 106.8456)
  ) / 1000 as distance_km
FROM "Documents"
WHERE 
  earth_box(ll_to_earth(-6.2088, 106.8456), 10000) 
  @> ll_to_earth("latitude", "longitude")
ORDER BY distance_km;

-- Requires PostGIS extension:
-- CREATE EXTENSION cube;
-- CREATE EXTENSION earthdistance;
```

#### 10. Document Hierarchy

```sql
-- Get full document tree
WITH RECURSIVE doc_tree AS (
  -- Base case: master documents
  SELECT 
    id,
    "documentNo",
    title,
    NULL::INTEGER as "parentId",
    0 as level
  FROM "Documents"
  
  UNION ALL
  
  -- Recursive case: sub-documents
  SELECT 
    sd.id,
    sd."subDocumentNo" as "documentNo",
    sd.title,
    sd."parentDocumentId" as "parentId",
    dt.level + 1 as level
  FROM "SubDocuments" sd
  INNER JOIN doc_tree dt ON sd."parentDocumentId" = dt.id
)
SELECT * FROM doc_tree
ORDER BY "documentNo";
```

---

## 🛠️ Database Maintenance

### Backup & Restore

#### Backup Database

```bash
# Full backup
pg_dump -U username -h localhost -d document_management_prod \
  -F c -b -v -f backup_$(date +%Y%m%d).dump

# Schema only
pg_dump -U username -h localhost -d document_management_prod \
  --schema-only -f schema_backup.sql

# Data only
pg_dump -U username -h localhost -d document_management_prod \
  --data-only -f data_backup.sql

# Specific tables
pg_dump -U username -h localhost -d document_management_prod \
  -t Users -t Documents -f tables_backup.sql
```

#### Restore Database

```bash
# From custom format
pg_restore -U username -h localhost -d document_management_prod \
  -v backup_20250121.dump

# From SQL file
psql -U username -h localhost -d document_management_prod \
  -f backup.sql
```

### Database Migration

#### Create New Database

```sql
-- Create database
CREATE DATABASE document_management_prod
  WITH ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8';

-- Create user
CREATE USER documan_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE document_management_prod 
  TO documan_user;

-- Connect to database
\c document_management_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO documan_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO documan_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO documan_user;
```

#### Sequelize Sync

```javascript
// Sync all models (development only)
await sequelize.sync({ force: false });

// Drop and recreate (DANGER - data loss!)
await sequelize.sync({ force: true });

// Alter tables (add missing columns)
await sequelize.sync({ alter: true });
```

### Performance Optimization

#### Vacuum & Analyze

```sql
-- Vacuum all tables
VACUUM VERBOSE ANALYZE;

-- Vacuum specific table
VACUUM VERBOSE ANALYZE "Documents";

-- Auto-vacuum settings (postgresql.conf)
autovacuum = on
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05
```

#### Index Monitoring

```sql
-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- Find missing indexes (slow queries)
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  seq_tup_read / seq_scan as avg_seq_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

#### Query Performance

```sql
-- Enable query timing
\timing

-- Explain query plan
EXPLAIN ANALYZE
SELECT d.*, u.username
FROM "Documents" d
INNER JOIN "Users" u ON d."createdBy" = u.id
WHERE d."status" = 'active';

-- Find slow queries (postgresql.conf)
log_min_duration_statement = 1000  -- Log queries > 1 second
```

### Data Cleanup

```sql
-- Delete old activity logs (keep 90 days)
DELETE FROM "ActivityLogs"
WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Archive old documents
UPDATE "Documents"
SET "status" = 'archived'
WHERE "createdAt" < NOW() - INTERVAL '2 years'
  AND "status" = 'active';

-- Clean up orphaned files (compare DB with filesystem)
SELECT "filePath" FROM "Documents"
UNION
SELECT "filePath" FROM "SubDocuments";
```

### Monitoring Queries

```sql
-- Database size
SELECT 
  pg_size_pretty(pg_database_size('document_management_prod')) as db_size;

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT 
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_connections,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = 'document_management_prod';

-- Long-running queries
SELECT 
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

---

## 🔐 Security Best Practices

### Database User Privileges

```sql
-- Create read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'readonly_pass';
GRANT CONNECT ON DATABASE document_management_prod TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Create application user with limited privileges
CREATE USER app_user WITH PASSWORD 'app_pass';
GRANT CONNECT ON DATABASE document_management_prod TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### Connection Security

```sql
-- Enable SSL (postgresql.conf)
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'

-- Require SSL for connections (pg_hba.conf)
hostssl all all 0.0.0.0/0 md5
```

### Password Encryption

```sql
-- Always use strong password hashing
-- Application handles this with bcrypt
-- Database stores only hashed values

-- Example check (should never return plaintext)
SELECT username, LENGTH(password) as hash_length
FROM "Users";
```

---

## 📊 Database Statistics

### Current Statistics (Example)

| Metric | Value |
|--------|-------|
| Total Tables | 4 |
| Total Indexes | 20+ |
| Foreign Keys | 4 |
| Average Row Size | ~500 bytes |
| Estimated Max Records | 1,000,000+ documents |
| Storage Type | PostgreSQL TOAST for large text |

### Growth Projection

```sql
-- Estimate storage growth
SELECT 
  'Documents' as table_name,
  COUNT(*) as current_rows,
  pg_size_pretty(pg_total_relation_size('Documents')) as current_size,
  pg_size_pretty(
    pg_total_relation_size('Documents') * 10
  ) as estimated_10x_size
FROM "Documents";
```

---

## 📚 Additional Resources

### PostgreSQL Extensions (Optional)

```sql
-- Full-text search
CREATE EXTENSION pg_trgm;  -- Trigram matching

-- Geospatial queries
CREATE EXTENSION postgis;  -- Advanced GIS functions

-- Encryption
CREATE EXTENSION pgcrypto; -- Cryptographic functions

-- UUID support
CREATE EXTENSION "uuid-ossp"; -- UUID generation
```

### Useful PostgreSQL Commands

```sql
-- List all tables
\dt

-- Describe table structure
\d "Users"

-- List all indexes
\di

-- List all foreign keys
\dP

-- Show current database
SELECT current_database();

-- Show PostgreSQL version
SELECT version();

-- Show active configuration
SHOW all;
```

---

**Version:** 1.0.0  
**Database Engine:** PostgreSQL 14+  
**ORM:** Sequelize 6.x  
**Last Updated:** November 21, 2025  
**Maintained by:** Database Administration Team

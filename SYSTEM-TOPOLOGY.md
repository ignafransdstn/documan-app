# System Topology - DocuMan Application

## Architecture Diagram

```mermaid
graph TB
    subgraph "External Access"
        User[👤 User<br/>Laptop/Mobile<br/>Any Device]
        Internet((Internet))
    end

    subgraph "Cloudflare Network"
        CF[☁️ Cloudflare Tunnel<br/>Quick Tunnel<br/>HTTPS]
        Edge[Cloudflare Edge<br/>Location: dps01/sin15]
    end

    subgraph "Local Machine - MacBook Pro"
        subgraph "Port Forwarding Layer"
            Socat[🔀 Socat<br/>Port 5173<br/>TCP Forwarder]
        end

        subgraph "Web Server Layer"
            Nginx[⚙️ Nginx<br/>Port 3000<br/>Reverse Proxy]
        end

        subgraph "Application Layer"
            Frontend[🎨 Frontend<br/>React SPA<br/>Static Files]
            Backend[⚡ Backend<br/>Node.js Express<br/>Port 5001]
        end

        subgraph "Data Layer"
            DB[(🗄️ PostgreSQL<br/>Database<br/>documan_db)]
        end

        subgraph "File Storage"
            Uploads[📁 File Storage<br/>uploads/]
        end
    end

    %% External connections
    User -->|HTTPS Request| Internet
    Internet -->|Encrypted Tunnel| Edge
    Edge -->|HTTP/2 Protocol| CF
    
    %% Cloudflare to local
    CF -->|http://localhost:5173| Socat
    
    %% Port forwarding
    Socat -->|Forward to Port 3000| Nginx
    
    %% Nginx routing
    Nginx -->|"Route: /"<br/>Serve Static| Frontend
    Nginx -->|"Route: /api"<br/>Proxy Pass| Backend
    
    %% Backend connections
    Backend -->|SQL Queries| DB
    Backend -->|File Operations| Uploads
    
    %% Styling
    classDef cloudflare fill:#f96,stroke:#333,stroke-width:2px
    classDef proxy fill:#6c9,stroke:#333,stroke-width:2px
    classDef app fill:#69f,stroke:#333,stroke-width:2px
    classDef data fill:#f9c,stroke:#333,stroke-width:2px
    classDef user fill:#9cf,stroke:#333,stroke-width:2px
    
    class CF,Edge cloudflare
    class Socat,Nginx proxy
    class Frontend,Backend app
    class DB,Uploads data
    class User,Internet user
```

## Network Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CF as ☁️ Cloudflare
    participant S as 🔀 Socat
    participant N as ⚙️ Nginx
    participant FE as 🎨 Frontend
    participant BE as ⚡ Backend
    participant DB as 🗄️ Database

    Note over U,DB: Initial Page Load
    U->>CF: GET https://python-neon-votes-flu.trycloudflare.com/
    CF->>S: Forward to localhost:5173
    S->>N: Forward to localhost:3000
    N->>FE: Serve index.html + assets
    FE-->>N: Static files
    N-->>S: Response
    S-->>CF: Response
    CF-->>U: HTML + JS + CSS

    Note over U,DB: Login Request
    U->>CF: POST /api/auth/login
    CF->>S: Forward request
    S->>N: Forward request
    N->>BE: Proxy to localhost:5001/api/auth/login
    BE->>DB: SELECT user credentials
    DB-->>BE: User data
    BE-->>N: JSON response + JWT token
    N-->>S: Response
    S-->>CF: Response
    CF-->>U: Login successful

    Note over U,DB: Document Upload
    U->>CF: POST /api/documents (multipart/form-data)
    CF->>S: Forward request
    S->>N: Forward request
    N->>BE: Proxy upload request
    BE->>DB: INSERT document metadata
    BE->>Uploads: Save file to disk
    DB-->>BE: Success
    Uploads-->>BE: File saved
    BE-->>N: Success response
    N-->>S: Response
    S-->>CF: Response
    CF-->>U: Upload complete
```

## Port Mapping

```mermaid
graph LR
    subgraph "Port Configuration"
        P5173[Port 5173<br/>Socat Listener]
        P3000[Port 3000<br/>Nginx]
        P5001[Port 5001<br/>Backend API]
        P5432[Port 5432<br/>PostgreSQL]
    end
    
    P5173 -->|TCP Forward| P3000
    P3000 -->|HTTP Proxy /api| P5001
    P5001 -->|Database Connection| P5432
    
    style P5173 fill:#ff9,stroke:#333,stroke-width:2px
    style P3000 fill:#9f9,stroke:#333,stroke-width:2px
    style P5001 fill:#99f,stroke:#333,stroke-width:2px
    style P5432 fill:#f9f,stroke:#333,stroke-width:2px
```

## Technology Stack

```mermaid
mindmap
  root((DocuMan<br/>System))
    Frontend
      React 18
      TypeScript
      React Router DOM
      Vite 7.2.2
    Backend
      Node.js 20.19.5
      Express.js
      Sequelize ORM
      JWT Auth
      Multer Upload
    Database
      PostgreSQL
      Models
        Users
        Documents
        SubDocuments
        ActivityLogs
    Infrastructure
      Nginx 1.29.3
      Socat TCP Proxy
      Cloudflare Tunnel
      macOS Darwin
    Security
      JWT Tokens
      Password Hashing
      CORS Headers
      Role-based Access
```

## Deployment Architecture

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Public Access** | Cloudflare Tunnel | HTTPS | Public internet gateway |
| **Port Forwarder** | Socat | 5173 | TCP port forwarding |
| **Reverse Proxy** | Nginx | 3000 | Route requests, serve static files |
| **Frontend** | React + Vite Build | - | Single Page Application |
| **Backend API** | Node.js + Express | 5001 | REST API server |
| **Database** | PostgreSQL | 5432 | Data persistence |
| **File Storage** | Local Filesystem | - | Document storage |

## Security Features

```mermaid
graph TD
    A[Security Layers] --> B[Transport Security]
    A --> C[Authentication]
    A --> D[Authorization]
    A --> E[Data Protection]
    
    B --> B1[HTTPS via Cloudflare]
    B --> B2[HTTP/2 Protocol]
    B --> B3[CORS Headers]
    
    C --> C1[JWT Tokens]
    C --> C2[Password Hashing]
    C --> C3[Session Management]
    
    D --> D1[Role-based Access]
    D --> D2[Admin/Level1/Level2/Level3]
    D --> D3[Middleware Validation]
    
    E --> E1[SQL Injection Prevention]
    E --> E2[File Upload Validation]
    E --> E3[Activity Logging]
    
    style A fill:#f96,stroke:#333,stroke-width:3px
    style B fill:#6c9,stroke:#333,stroke-width:2px
    style C fill:#69f,stroke:#333,stroke-width:2px
    style D fill:#f9c,stroke:#333,stroke-width:2px
    style E fill:#9cf,stroke:#333,stroke-width:2px
```

## Access Information

**Public URL:** https://python-neon-votes-flu.trycloudflare.com

**Note:** URL changes on every tunnel restart (Quick Tunnel limitation)

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**Services Status:**
- ✅ Frontend: Running (Static files via Nginx)
- ✅ Backend: Running (Node.js on port 5001)
- ✅ Database: Connected (PostgreSQL)
- ✅ Cloudflare Tunnel: Active
- ✅ Nginx: Running (Port 3000)
- ✅ Socat: Running (Port 5173 → 3000)

---

**Generated:** November 27, 2025
**System:** DocuMan - Document Management System
**Status:** Production Ready ✅

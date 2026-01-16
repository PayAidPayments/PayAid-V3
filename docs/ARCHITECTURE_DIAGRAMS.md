# PayAid V3 - Architecture Diagrams

**Version:** 3.0.0  
**Last Updated:** January 2026

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile App]
    end
    
    subgraph "Reverse Proxy"
        C[Nginx/Caddy<br/>Port 80/443]
    end
    
    subgraph "Application Layer"
        D[Next.js Application<br/>Port 3000]
        E[API Routes<br/>577+ endpoints]
        F[Server Components]
    end
    
    subgraph "Business Logic Layer"
        G[Services]
        H[Workflow Engine]
        I[AI Agents<br/>27+ agents]
    end
    
    subgraph "Data Layer"
        J[(PostgreSQL<br/>Primary<br/>Port 5432)]
        K[(PostgreSQL<br/>Read Replica)]
        L[(Redis<br/>Cache & Queue<br/>Port 6379)]
    end
    
    subgraph "Queue Layer"
        M[Bull Queue]
        N[Job Processors]
    end
    
    subgraph "External Services"
        O[PayAid Payments<br/>Exclusive]
        P[Email Service<br/>SendGrid/SMTP]
        Q[SMS Service<br/>Twilio/Exotel]
        R[AI Services<br/>Groq/Ollama]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    E --> G
    G --> J
    G --> K
    G --> L
    G --> M
    M --> N
    N --> O
    N --> P
    N --> Q
    I --> R
    G --> I
```

---

## Multi-Tenant Architecture

```mermaid
graph TB
    subgraph "Tenant Isolation Layer"
        A[Request with tenantId]
        B[JWT Token<br/>Contains tenantId]
    end
    
    subgraph "Application Layer"
        C[Middleware<br/>Extract tenantId]
        D[All Queries<br/>Filter by tenantId]
    end
    
    subgraph "Database Layer"
        E[(PostgreSQL)]
        F[Row-Level Filtering<br/>WHERE tenantId = ?]
    end
    
    subgraph "Tenant A Data"
        G[Contacts A]
        H[Invoices A]
        I[Deals A]
    end
    
    subgraph "Tenant B Data"
        J[Contacts B]
        K[Invoices B]
        L[Deals B]
    end
    
    A --> B
    B --> C
    C --> D
    D --> F
    F --> E
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
```

---

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Auth
    participant DB
    participant Cache
    
    User->>Frontend: Login (email, password)
    Frontend->>API: POST /api/auth/login
    API->>DB: Find user by email
    DB-->>API: User data
    API->>Auth: Verify password
    Auth->>Auth: Generate JWT token
    Auth-->>API: JWT token
    API->>Cache: Warm cache (async)
    API-->>Frontend: Token + User data
    Frontend->>Frontend: Store token (HTTP-only cookie)
    
    User->>Frontend: Access protected route
    Frontend->>API: GET /api/contacts<br/>(with token)
    API->>Auth: Verify JWT token
    Auth->>Auth: Check permissions
    Auth-->>API: Authorized
    API->>DB: Query contacts (with tenantId)
    DB-->>API: Contact data
    API-->>Frontend: Contacts list
```

---

## Payment Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant PayAid Payments
    participant DB
    participant Email
    
    User->>Frontend: Create invoice
    Frontend->>API: POST /api/invoices
    API->>DB: Create invoice
    DB-->>API: Invoice created
    
    User->>Frontend: Generate payment link
    Frontend->>API: POST /api/invoices/[id]/generate-payment-link
    API->>PayAid Payments: Generate payment URL
    PayAid Payments-->>API: Payment URL + UUID
    API->>DB: Update invoice (paymentLinkUrl)
    API-->>Frontend: Payment link
    
    User->>Frontend: Send invoice
    Frontend->>API: POST /api/invoices/[id]/send-with-payment
    API->>Email: Send invoice email
    API-->>Frontend: Email sent
    
    Customer->>PayAid Payments: Click payment link
    PayAid Payments->>Customer: Payment page
    Customer->>PayAid Payments: Complete payment
    PayAid Payments->>API: POST /api/payments/webhook
    API->>API: Verify webhook signature
    API->>DB: Update invoice (paymentStatus: paid)
    API->>Email: Send receipt
    PayAid Payments->>Customer: Redirect to success page
```

---

## Caching Architecture (Multi-Layer)

```mermaid
graph TB
    A[API Request] --> B{Check L1 Cache<br/>Memory}
    B -->|Hit| C[Return Data]
    B -->|Miss| D{Check L2 Cache<br/>Redis}
    D -->|Hit| E[Return Data<br/>+ Populate L1]
    D -->|Miss| F[Query Database]
    F --> G[Return Data]
    G --> H[Populate L1 + L2]
    H --> C
    
    I[Write Operation] --> J[Update Database]
    J --> K[Invalidate Cache]
    K --> L[Delete L1 + L2 Keys]
```

---

## AI Agent System Architecture

```mermaid
graph TB
    A[User Message] --> B[Agent Router]
    B --> C{Keyword Match}
    C -->|Finance| D[CFO Agent]
    C -->|Sales| E[Sales Agent]
    C -->|Marketing| F[Marketing Agent]
    C -->|Default| G[Co-Founder Agent]
    
    D --> H[Business Context Builder]
    E --> H
    F --> H
    G --> H
    
    H --> I[Fetch Tenant Data]
    I --> J[Filter by Data Scopes]
    
    J --> K{AI Service}
    K -->|Primary| L[Groq API]
    K -->|Fallback| M[Ollama Local]
    K -->|Backup| N[HuggingFace]
    
    L --> O[AI Response]
    M --> O
    N --> O
    
    O --> P[Format Response]
    P --> Q[Save Conversation]
    Q --> R[Return to User]
```

---

## Module Architecture

```mermaid
graph TB
    subgraph "Core Modules"
        A[CRM Module]
        B[Invoicing Module]
        C[Payments Module]
        D[HR Module]
    end
    
    subgraph "Business Modules"
        E[Marketing Module]
        F[Analytics Module]
        G[Workflow Module]
    end
    
    subgraph "AI Modules"
        H[AI Co-Founder]
        I[AI Studio]
    end
    
    subgraph "Infrastructure"
        J[Auth Module]
        K[Admin Module]
        L[Integration Hub]
    end
    
    A --> J
    B --> J
    C --> J
    D --> J
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    
    K --> A
    K --> B
    K --> C
    K --> D
    
    L --> A
    L --> B
    L --> C
```

---

## Database Schema Relationships

```mermaid
erDiagram
    Tenant ||--o{ User : has
    Tenant ||--o{ Contact : has
    Tenant ||--o{ Invoice : has
    Tenant ||--o{ Deal : has
    Tenant ||--o{ Order : has
    
    User ||--o{ Contact : creates
    User ||--o{ Invoice : creates
    User ||--o{ Deal : creates
    
    Contact ||--o{ Deal : has
    Contact ||--o{ Invoice : receives
    Contact ||--o{ Order : places
    
    Invoice ||--|| Payment : has
    Order ||--|| Payment : has
    
    Tenant {
        string id PK
        string name
        string[] licensedModules
        string subscriptionTier
    }
    
    User {
        string id PK
        string email UK
        string tenantId FK
        string role
    }
    
    Contact {
        string id PK
        string name
        string email
        string tenantId FK
        float leadScore
    }
    
    Invoice {
        string id PK
        string invoiceNumber UK
        decimal amount
        string tenantId FK
        string customerId FK
        string paymentStatus
    }
```

---

## Deployment Architecture (Self-Hosted)

```mermaid
graph TB
    subgraph "Internet"
        A[Users]
    end
    
    subgraph "Server"
        B[Nginx<br/>Reverse Proxy<br/>Port 80/443]
        C[Next.js App<br/>Port 3000]
        D[PostgreSQL<br/>Port 5432]
        E[Redis<br/>Port 6379]
    end
    
    subgraph "Storage"
        F[(Database Data)]
        G[(Redis Data)]
        H[(File Storage)]
    end
    
    subgraph "Backups"
        I[Daily Backups]
        J[Off-Site Storage]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    D --> F
    E --> G
    C --> H
    D --> I
    I --> J
```

---

## RBAC Permission Flow

```mermaid
graph TB
    A[User Request] --> B[Extract JWT Token]
    B --> C[Decode Token]
    C --> D{Check Role}
    D -->|OWNER| E[All Permissions]
    D -->|ADMIN| F[Admin Permissions]
    D -->|MANAGER| G[Manager Permissions]
    D -->|MEMBER| H[Member Permissions]
    D -->|VIEWER| I[Read-Only]
    
    E --> J{Check Module License}
    F --> J
    G --> J
    H --> J
    I --> J
    
    J -->|Licensed| K[Allow Access]
    J -->|Not Licensed| L[Deny Access<br/>Redirect to App Store]
    
    K --> M{Check Object Permission}
    M -->|Own/Assigned| N[Allow]
    M -->|Not Own| O{Is Admin?}
    O -->|Yes| N
    O -->|No| P[Deny]
```

---

## Workflow Execution Flow

```mermaid
graph TB
    A[Trigger Event] --> B[Workflow Engine]
    B --> C[Find Active Workflows]
    C --> D[Parse Workflow Definition]
    D --> E[Execute Actions Sequentially]
    
    E --> F{Action Type}
    F -->|Send Email| G[Email Queue]
    F -->|Send SMS| H[SMS Queue]
    F -->|Create Task| I[Database]
    F -->|Create Contact| I
    F -->|Webhook| J[External API]
    
    G --> K[Job Processor]
    H --> K
    I --> L[Update Database]
    J --> M[HTTP Request]
    
    K --> N[Log Execution]
    L --> N
    M --> N
    
    N --> O{All Actions Complete?}
    O -->|Yes| P[Mark Workflow Complete]
    O -->|No| Q[Mark Workflow Failed]
```

---

## Summary

These diagrams provide visual representations of PayAid V3's architecture, data flows, and system components. They complement the detailed documentation in other parts and help visualize the system's structure and behavior.

**Diagrams Included:**
- ✅ System architecture (high-level)
- ✅ Multi-tenant architecture
- ✅ Authentication & authorization flow
- ✅ Payment processing flow
- ✅ Caching architecture
- ✅ AI agent system architecture
- ✅ Module architecture
- ✅ Database schema relationships
- ✅ Deployment architecture
- ✅ RBAC permission flow
- ✅ Workflow execution flow

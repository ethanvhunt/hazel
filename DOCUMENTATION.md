# Hazelnutcyborg CRM Platform - Complete Technical Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication System](#authentication-system)
5. [Team Portal Features](#team-portal-features)
6. [Customer Portal Features](#customer-portal-features)
7. [API Reference](#api-reference)
8. [Components Library](#components-library)
9. [Configuration](#configuration)
10. [Security](#security)
11. [Workflows](#workflows)
12. [Troubleshooting](#troubleshooting)

---

## 1. System Overview

### 1.1 Application Purpose

Hazelnutcyborg CRM is a comprehensive Customer Relationship Management platform designed for IT support and service businesses. It provides two distinct portals:

- **Team Portal**: For administrators, managers, and agents to manage customers, tickets, products, and operations
- **Customer Portal**: For clients to create tickets, view products, and track service requests

### 1.2 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.1.9 | Styling framework |
| PostgreSQL | Latest | Database (via Neon) |
| Vercel Blob | Latest | File storage |
| shadcn/ui | Latest | UI component library |
| Nodemailer | 7.0.12 | Email notifications |
| bcryptjs | 3.0.3 | Password hashing |
| xlsx | 0.18.5 | Excel file processing |

### 1.3 Key Features

- Multi-role authentication (Super Admin, Manager, Agent, Customer)
- Real-time notifications
- Ticket management system
- Customer and product management
- Excel file upload, parsing, and viewing
- Email notifications via Gmail SMTP
- Activity logging and audit trails
- Responsive design with mobile support

---

## 2. Architecture

### 2.1 Application Structure

```
hazelnutcyborg-crm/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── api/                        # API routes
│   ├── team/                       # Team portal pages
│   ├── customer/                   # Customer portal pages
│   └── docs/                       # Documentation page
├── components/
│   ├── ui/                         # Base UI components
│   ├── team/                       # Team-specific components
│   ├── customer/                   # Customer-specific components
│   └── common/                     # Shared components
├── lib/
│   ├── db.ts                       # Database connection
│   ├── utils.ts                    # Utility functions
│   ├── email-service.ts            # Email functionality
│   └── notifications.ts            # Notification helpers
├── hooks/                          # Custom React hooks
├── scripts/                        # Database migration scripts
└── public/                         # Static assets
```

### 2.2 Routing Architecture

#### Team Portal Routes (`/team/*`)
- `/team/login` - Team member authentication
- `/team/register` - Team member registration
- `/team/dashboard` - Main dashboard with stats
- `/team/tickets` - Ticket list and management
- `/team/tickets/[id]` - Ticket detail and chat
- `/team/customers` - Customer list
- `/team/customers/[id]` - Customer detail
- `/team/customers/create` - Create new customer
- `/team/users` - User management (Super Admin only)
- `/team/users/create` - Create team member
- `/team/users/[id]` - Edit team member
- `/team/product-requests` - Product request management
- `/team/activity-logs` - Audit trail
- `/team/profile` - User profile and Gmail setup
- `/team/excel-view/[id]` - View Excel files

#### Customer Portal Routes (`/customer/*`)
- `/customer/login` - Customer authentication
- `/customer/register` - Customer registration
- `/customer/dashboard` - Customer dashboard
- `/customer/tickets` - View customer tickets
- `/customer/tickets/create` - Create new ticket
- `/customer/products` - View assigned products
- `/customer/products/[id]` - Product details
- `/customer/requests` - Product requests
- `/customer/profile` - Customer profile
- `/customer/excel-view/[id]` - View Excel files

### 2.3 Data Flow

```
Client Request
    ↓
Next.js App Router
    ↓
API Route Handler
    ↓
Authentication Check (cookies)
    ↓
Database Query (Neon PostgreSQL)
    ↓
Response Processing
    ↓
JSON Response to Client
```

---

## 3. Database Schema

### 3.1 Tables Overview

The database consists of 12 tables managing users, customers, tickets, products, and system operations.

### 3.2 users Table

**Purpose**: Stores team members (agents, managers, super admins)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| email | VARCHAR | UNIQUE, NOT NULL | Login email address |
| password_hash | VARCHAR | NOT NULL | bcrypt hashed password |
| full_name | VARCHAR | NOT NULL | User's display name |
| role | VARCHAR | NOT NULL, CHECK | Role: 'super_admin', 'manager', 'agent' |
| gmail_address | VARCHAR | NULLABLE | Gmail for notifications |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `email`

**Relationships**:
- Referenced by `activity_logs.performed_by`
- Referenced by `tickets.agent_id`
- Referenced by `customer_agent_assignment.agent_id`

**Validation Rules**:
- Email must be valid format
- Password minimum 6 characters
- Role must be one of: 'super_admin', 'manager', 'agent'

**Usage Examples**:
```typescript
// Create user
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (gen_random_uuid(), 'john@example.com', '$2a$10$...', 'John Doe', 'agent');

// Update Gmail address
UPDATE users SET gmail_address = 'john.doe@gmail.com' WHERE id = '...';
```

### 3.3 customers Table

**Purpose**: Stores customer/client information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| email | VARCHAR | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR | NOT NULL | bcrypt hashed password |
| company_name | VARCHAR | NOT NULL | Company/organization name |
| contact_person | VARCHAR | NOT NULL | Primary contact name |
| phone | VARCHAR | NULLABLE | Contact phone number |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `email`

**Relationships**:
- Referenced by `tickets.customer_id`
- Referenced by `products.customer_id`
- Referenced by `excel_uploads.customer_id`
- Referenced by `customer_agent_assignment.customer_id`

**Validation Rules**:
- Email must be valid format
- Password minimum 6 characters
- Company name required
- Contact person required

**Usage Examples**:
```typescript
// Create customer
INSERT INTO customers (id, email, password_hash, company_name, contact_person, phone)
VALUES (gen_random_uuid(), 'client@company.com', '$2a$10$...', 'ACME Corp', 'Jane Smith', '+1234567890');

// Update customer
UPDATE customers 
SET company_name = 'New Name', contact_person = 'New Contact', updated_at = NOW()
WHERE id = '...';
```

### 3.4 tickets Table

**Purpose**: Support tickets created by customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | FOREIGN KEY → customers(id) | Ticket owner |
| agent_id | UUID | FOREIGN KEY → users(id), NULLABLE | Assigned agent |
| product_id | UUID | FOREIGN KEY → products(id), NULLABLE | Related product |
| title | VARCHAR | NOT NULL | Ticket subject |
| description | TEXT | NOT NULL | Detailed description |
| status | VARCHAR | NOT NULL, CHECK | Current status |
| priority | VARCHAR | NOT NULL, CHECK | Priority level |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Values**:
- `open` - New, unassigned ticket
- `in_progress` - Agent actively working
- `resolved` - Issue fixed, awaiting confirmation
- `closed` - Completed and confirmed

**Priority Values**:
- `low` - Minor issues, no urgency
- `medium` - Standard priority
- `high` - Important, needs attention
- `urgent` - Critical, immediate action required

**Indexes**:
- Primary key on `id`
- Index on `customer_id`
- Index on `agent_id`
- Index on `status`

**Relationships**:
- References `customers.id` via `customer_id`
- References `users.id` via `agent_id`
- References `products.id` via `product_id`
- Referenced by `messages.ticket_id`

**Usage Examples**:
```typescript
// Create ticket
INSERT INTO tickets (id, customer_id, title, description, status, priority)
VALUES (gen_random_uuid(), '...', 'Cannot login', 'Getting error...', 'open', 'high');

// Assign agent and update status
UPDATE tickets 
SET agent_id = '...', status = 'in_progress', updated_at = NOW()
WHERE id = '...';

// Change priority
UPDATE tickets 
SET priority = 'urgent', updated_at = NOW()
WHERE id = '...';
```

### 3.5 messages Table

**Purpose**: Chat messages within tickets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| ticket_id | UUID | FOREIGN KEY → tickets(id) | Parent ticket |
| sender_id | UUID | NOT NULL | Message author ID |
| sender_type | VARCHAR | NOT NULL, CHECK | 'customer' or 'user' |
| message | TEXT | NOT NULL | Message content |
| created_at | TIMESTAMP | DEFAULT NOW() | Send timestamp |

**Sender Types**:
- `customer` - Message from customer (sender_id = customer.id)
- `user` - Message from agent (sender_id = user.id)

**Indexes**:
- Primary key on `id`
- Index on `ticket_id`
- Composite index on `(ticket_id, created_at)` for chronological retrieval

**Relationships**:
- References `tickets.id` via `ticket_id`
- sender_id references either `customers.id` or `users.id` depending on sender_type

**Usage Examples**:
```typescript
// Customer sends message
INSERT INTO messages (id, ticket_id, sender_id, sender_type, message)
VALUES (gen_random_uuid(), '...', '<customer_id>', 'customer', 'Thanks for the help!');

// Agent replies
INSERT INTO messages (id, ticket_id, sender_id, sender_type, message)
VALUES (gen_random_uuid(), '...', '<user_id>', 'user', 'Happy to assist!');

// Fetch messages
SELECT * FROM messages 
WHERE ticket_id = '...' 
ORDER BY created_at ASC;
```

### 3.6 products Table

**Purpose**: Products/services assigned to customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | FOREIGN KEY → customers(id) | Product owner |
| name | VARCHAR | NOT NULL | Product name |
| description | TEXT | NULLABLE | Product details |
| status | VARCHAR | NOT NULL, CHECK | Current status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Values**:
- `active` - Currently in use
- `inactive` - Disabled or suspended
- `pending` - Awaiting activation

**Indexes**:
- Primary key on `id`
- Index on `customer_id`

**Relationships**:
- References `customers.id` via `customer_id`
- Referenced by `tickets.product_id`

**Usage Examples**:
```typescript
// Create product
INSERT INTO products (id, customer_id, name, description, status)
VALUES (gen_random_uuid(), '...', 'Website Hosting', 'Premium shared hosting', 'active');

// Update status
UPDATE products 
SET status = 'inactive', updated_at = NOW()
WHERE id = '...';
```

### 3.7 product_requests Table

**Purpose**: Customer requests for new products/services

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | FOREIGN KEY → customers(id) | Requesting customer |
| product_name | VARCHAR | NOT NULL | Requested product name |
| description | TEXT | NOT NULL | Request details |
| status | VARCHAR | NOT NULL, CHECK | Request status |
| assigned_agent_id | UUID | FOREIGN KEY → users(id), NULLABLE | Reviewing agent |
| reviewed_by | UUID | FOREIGN KEY → users(id), NULLABLE | Who approved/rejected |
| reviewed_at | TIMESTAMP | NULLABLE | Review timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Values**:
- `pending` - Awaiting review
- `approved` - Request accepted
- `rejected` - Request denied

**Indexes**:
- Primary key on `id`
- Index on `customer_id`
- Index on `status`

**Relationships**:
- References `customers.id` via `customer_id`
- References `users.id` via `assigned_agent_id`
- References `users.id` via `reviewed_by`

**Usage Examples**:
```typescript
// Customer submits request
INSERT INTO product_requests (id, customer_id, product_name, description, status)
VALUES (gen_random_uuid(), '...', 'SSL Certificate', 'Need SSL for domain', 'pending');

// Agent reviews and approves
UPDATE product_requests 
SET status = 'approved', 
    reviewed_by = '<agent_id>', 
    reviewed_at = NOW(),
    updated_at = NOW()
WHERE id = '...';
```

### 3.8 excel_uploads Table

**Purpose**: Metadata for uploaded Excel files

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | FOREIGN KEY → customers(id) | File owner |
| uploaded_by | UUID | FOREIGN KEY → users(id) | Uploader (agent) |
| file_name | VARCHAR | NOT NULL | Original filename |
| file_path | VARCHAR | NOT NULL | Blob storage URL |
| file_type | VARCHAR | NOT NULL | MIME type |
| file_size | INTEGER | NOT NULL | Size in bytes |
| description | TEXT | NULLABLE | Optional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Supported File Types**:
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
- `application/vnd.ms-excel` (.xls)
- `text/csv` (.csv)

**Indexes**:
- Primary key on `id`
- Index on `customer_id`
- Index on `uploaded_by`

**Relationships**:
- References `customers.id` via `customer_id`
- References `users.id` via `uploaded_by`
- Referenced by `excel_data.excel_upload_id`

**File Storage**:
- Files stored in Vercel Blob storage
- `file_path` contains the Blob URL
- Original file preserved for download

**Usage Examples**:
```typescript
// Record upload
INSERT INTO excel_uploads (id, customer_id, uploaded_by, file_name, file_path, file_type, file_size, description)
VALUES (
  gen_random_uuid(), 
  '<customer_id>', 
  '<agent_id>', 
  'products_2024.xlsx',
  'https://blob.vercel-storage.com/...',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  45678,
  'Q1 product inventory'
);
```

### 3.9 excel_data Table

**Purpose**: Parsed Excel file data for viewing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| excel_upload_id | UUID | FOREIGN KEY → excel_uploads(id) | Parent file |
| sheet_name | VARCHAR | NOT NULL | Worksheet name |
| row_index | INTEGER | NOT NULL | Row number (0-based) |
| row_data | JSONB | NOT NULL | Cell data as JSON |
| created_at | TIMESTAMP | DEFAULT NOW() | Parse timestamp |

**Data Structure**:
```json
// row_data format:
{
  "A": "Product Name",
  "B": "SKU",
  "C": "Price",
  "D": "Quantity"
}
```

**Indexes**:
- Primary key on `id`
- Composite index on `(excel_upload_id, sheet_name, row_index)`

**Relationships**:
- References `excel_uploads.id` via `excel_upload_id`
- Cascade delete when parent upload is deleted

**Usage Examples**:
```typescript
// Insert parsed row
INSERT INTO excel_data (id, excel_upload_id, sheet_name, row_index, row_data)
VALUES (
  gen_random_uuid(),
  '<upload_id>',
  'Sheet1',
  0,
  '{"A": "Product", "B": "Description", "C": "Price"}'::jsonb
);

// Query sheet data
SELECT row_index, row_data 
FROM excel_data 
WHERE excel_upload_id = '...' AND sheet_name = 'Sheet1'
ORDER BY row_index ASC;
```

### 3.10 customer_agent_assignment Table

**Purpose**: Maps customers to their assigned agents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | FOREIGN KEY → customers(id) | Assigned customer |
| agent_id | UUID | FOREIGN KEY → users(id) | Assigned agent |
| assigned_by | UUID | FOREIGN KEY → users(id) | Who made assignment |
| assigned_at | TIMESTAMP | DEFAULT NOW() | Assignment timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `customer_id` (one agent per customer)
- Index on `agent_id`

**Relationships**:
- References `customers.id` via `customer_id`
- References `users.id` via `agent_id`
- References `users.id` via `assigned_by`

**Business Rules**:
- One customer can only be assigned to one agent at a time
- Reassignment creates new record (could be extended to track history)

**Usage Examples**:
```typescript
// Assign agent to customer
INSERT INTO customer_agent_assignment (id, customer_id, agent_id, assigned_by)
VALUES (gen_random_uuid(), '<customer_id>', '<agent_id>', '<admin_id>')
ON CONFLICT (customer_id) DO UPDATE
SET agent_id = EXCLUDED.agent_id, 
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = NOW();
```

### 3.11 notifications Table

**Purpose**: Real-time notification system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | NOT NULL | Notification recipient |
| user_type | VARCHAR | NOT NULL, CHECK | 'customer' or 'user' |
| entity_type | VARCHAR | NOT NULL | Related entity type |
| entity_id | UUID | NOT NULL | Related entity ID |
| event_type | VARCHAR | NOT NULL | Event that triggered |
| title | VARCHAR | NOT NULL | Notification heading |
| message | TEXT | NOT NULL | Notification body |
| read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**User Types**:
- `customer` - Notification for customer
- `user` - Notification for team member

**Entity Types**:
- `ticket` - Ticket-related notification
- `message` - New message notification
- `product` - Product-related notification
- `product_request` - Product request update

**Event Types**:
- `ticket_created` - New ticket opened
- `ticket_assigned` - Ticket assigned to agent
- `ticket_updated` - Ticket status/priority changed
- `message_received` - New message in ticket
- `product_created` - New product added
- `request_reviewed` - Product request reviewed

**Indexes**:
- Primary key on `id`
- Composite index on `(user_id, user_type, read)`
- Index on `created_at`

**Usage Examples**:
```typescript
// Create notification
INSERT INTO notifications (
  id, user_id, user_type, entity_type, entity_id, 
  event_type, title, message
) VALUES (
  gen_random_uuid(),
  '<agent_id>',
  'user',
  'ticket',
  '<ticket_id>',
  'ticket_created',
  'New Ticket Created',
  'Ticket #123: Cannot login - assigned to you'
);

// Mark as read
UPDATE notifications 
SET read = TRUE, updated_at = NOW()
WHERE id = '...';

// Get unread notifications
SELECT * FROM notifications
WHERE user_id = '...' AND user_type = 'user' AND read = FALSE
ORDER BY created_at DESC;
```

### 3.12 activity_logs Table

**Purpose**: Audit trail for all system actions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| entity_type | VARCHAR | NOT NULL | Type of entity modified |
| entity_id | UUID | NOT NULL | ID of modified entity |
| action | VARCHAR | NOT NULL, CHECK | Action performed |
| performed_by | UUID | FOREIGN KEY → users(id) | Who performed action |
| old_values | JSONB | NULLABLE | Previous state |
| new_values | JSONB | NULLABLE | New state |
| created_at | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Action Values**:
- `create` - New entity created
- `update` - Entity modified
- `delete` - Entity deleted

**Entity Types**:
- `user` - Team member actions
- `customer` - Customer actions
- `ticket` - Ticket changes
- `product` - Product changes
- `excel_upload` - File uploads

**Indexes**:
- Primary key on `id`
- Composite index on `(entity_type, entity_id)`
- Index on `performed_by`
- Index on `created_at`

**Usage Examples**:
```typescript
// Log ticket status change
INSERT INTO activity_logs (
  id, entity_type, entity_id, action, performed_by, 
  old_values, new_values
) VALUES (
  gen_random_uuid(),
  'ticket',
  '<ticket_id>',
  'update',
  '<agent_id>',
  '{"status": "open"}'::jsonb,
  '{"status": "in_progress", "agent_id": "..."}'::jsonb
);

// Query audit trail
SELECT 
  al.*,
  u.full_name as performed_by_name
FROM activity_logs al
JOIN users u ON al.performed_by = u.id
WHERE entity_type = 'customer' AND entity_id = '...'
ORDER BY created_at DESC;
```

### 3.13 email_logs Table

**Purpose**: Track sent email notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | NOT NULL | Related user |
| entity_type | VARCHAR | NOT NULL | Related entity |
| entity_id | UUID | NOT NULL | Entity ID |
| event_type | VARCHAR | NOT NULL | Email trigger event |
| recipient_email | VARCHAR | NOT NULL | Email address sent to |
| subject | VARCHAR | NOT NULL | Email subject line |
| status | VARCHAR | NOT NULL | Send status |
| sent_at | TIMESTAMP | DEFAULT NOW() | Send timestamp |

**Status Values**:
- `sent` - Successfully sent
- `failed` - Send failed
- `pending` - Queued for sending

**Event Types**:
- `ticket_created` - New ticket email
- `message_received` - New message email

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `entity_id`

**Usage Examples**:
```typescript
// Log sent email
INSERT INTO email_logs (
  id, user_id, entity_type, entity_id, event_type, 
  recipient_email, subject, status
) VALUES (
  gen_random_uuid(),
  '<agent_id>',
  'ticket',
  '<ticket_id>',
  'ticket_created',
  'agent@company.com',
  'New Ticket: Cannot login',
  'sent'
);
```

---

## 4. Authentication System

### 4.1 Authentication Overview

The application uses cookie-based session management with separate authentication flows for team members and customers.

### 4.2 Password Security

**Hashing Algorithm**: bcryptjs with salt rounds = 10

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Password Requirements**:
- Minimum length: 6 characters
- No maximum length
- No complexity requirements (can be enhanced)

### 4.3 Team Authentication

**Login Endpoint**: `POST /api/auth/team/login`

**Request Body**:
```typescript
{
  email: string;      // Team member email
  password: string;   // Plain text password
}
```

**Response**:
```typescript
{
  success: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'super_admin' | 'manager' | 'agent';
  }
}
```

**Cookie Set**: `team-session`
```typescript
{
  userId: string;     // User UUID
  email: string;
  role: string;
}
// HttpOnly, Secure (production), SameSite=Lax, Max-Age=7 days
```

**Registration Endpoint**: `POST /api/auth/team/register`

**Request Body**:
```typescript
{
  email: string;
  password: string;
  full_name: string;
  role: 'super_admin' | 'manager' | 'agent';
}
```

### 4.4 Customer Authentication

**Login Endpoint**: `POST /api/auth/customer/login`

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  customer: {
    id: string;
    email: string;
    company_name: string;
    contact_person: string;
  }
}
```

**Cookie Set**: `customer-session`
```typescript
{
  customerId: string;    // Customer UUID
  email: string;
  company_name: string;
}
// HttpOnly, Secure (production), SameSite=Lax, Max-Age=7 days
```

**Registration Endpoint**: `POST /api/auth/customer/register`

**Request Body**:
```typescript
{
  email: string;
  password: string;
  company_name: string;
  contact_person: string;
  phone?: string;
}
```

### 4.5 Session Management

**Check Session**: `GET /api/auth/session`

**Response**:
```typescript
{
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  customer?: {
    id: string;
    email: string;
    company_name: string;
    contact_person: string;
  };
}
```

**Logout**: `POST /api/auth/logout`
- Clears both `team-session` and `customer-session` cookies
- Redirects to home page

### 4.6 Authorization Middleware

All protected API routes check for appropriate session cookies:

```typescript
// Team routes require team-session
const teamSession = request.cookies.get('team-session');
if (!teamSession) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const session = JSON.parse(teamSession.value);
// Use session.userId, session.role

// Customer routes require customer-session
const customerSession = request.cookies.get('customer-session');
if (!customerSession) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const session = JSON.parse(customerSession.value);
// Use session.customerId
```

### 4.7 Role-Based Access Control

**Roles and Permissions**:

| Feature | Super Admin | Manager | Agent | Customer |
|---------|-------------|---------|-------|----------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Create Customers | ✅ | ✅ | ✅ | ❌ |
| Assign Agents | ✅ | ✅ | ❌ | ❌ |
| View All Tickets | ✅ | ✅ | Own only | Own only |
| Upload Excel | ✅ | ✅ | ✅ | ❌ |
| Reset Customer Password | ✅ | ❌ | ❌ | ❌ |
| View Activity Logs | ✅ | ✅ | ❌ | ❌ |

**Implementation Example**:
```typescript
// Check if user is super admin
if (session.role !== 'super_admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 5. Team Portal Features

### 5.1 Dashboard (`/team/dashboard`)

**Purpose**: Main overview for team members

**Stats Cards**:
- Total Customers: Count of all customers in database
- Open Tickets: Count of tickets with status='open'
- In Progress: Count of tickets with status='in_progress'
- Resolved: Count of tickets with status='resolved'

**Components**:
- Recent Tickets: Last 5 tickets ordered by created_at
- Quick Actions: Links to create customer, view tickets

**API Endpoint**: `GET /api/team/stats`

**Response**:
```typescript
{
  totalCustomers: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}
```

### 5.2 Ticket Management (`/team/tickets`)

**Features**:
- List all tickets with filtering
- Search by title, customer name
- Filter by status, priority
- Assign tickets to agents
- Change ticket status
- View ticket details and chat

**Ticket List Fields**:
- Ticket ID (first 8 chars)
- Title
- Customer name
- Status (badge with color)
- Priority (badge with color)
- Assigned agent
- Created date

**Status Colors**:
- `open`: Yellow
- `in_progress`: Blue
- `resolved`: Green
- `closed`: Gray

**Priority Colors**:
- `low`: Gray
- `medium`: Yellow
- `high`: Orange
- `urgent`: Red

**Actions**:
- Click ticket → View detail page
- Status dropdown → Update status
- Agent dropdown → Assign/reassign agent
- Priority dropdown → Change priority

**API Endpoints**:
- `GET /api/tickets` - List tickets
- `PUT /api/tickets/[id]` - Update ticket
- `PATCH /api/tickets/[id]` - Update ticket (alias)

### 5.3 Ticket Detail (`/team/tickets/[id]`)

**Sections**:

**1. Ticket Header**:
- Title
- Status badge
- Priority badge
- Created date
- Customer info
- Assigned agent

**2. Ticket Details**:
- Description (full text)
- Related product (if any)
- Created timestamp
- Last updated timestamp

**3. Chat View**:
- Message list (scrollable)
- Customer messages (left, blue)
- Agent messages (right, gray)
- Timestamps for each message
- Message input field
- Send button

**Message Form**:
```typescript
{
  message: string;   // Required, max 5000 chars
}
```

**API Endpoints**:
- `GET /api/tickets/[id]` - Get ticket details
- `GET /api/messages?ticketId=...` - Get messages
- `POST /api/messages` - Send message

**Message Create Request**:
```typescript
{
  ticketId: string;
  message: string;
}
```

**Real-time Updates**:
- Messages refresh every 3 seconds
- New messages appear immediately
- No auto-scroll (user controls scroll)

### 5.4 Customer Management (`/team/customers`)

**Features**:
- List all customers
- Search by company name, email
- View customer details
- Create new customers
- Edit customer information
- Assign agents to customers
- Reset customer passwords (Super Admin)

**Customer List Fields**:
- Company Name
- Contact Person
- Email
- Phone
- Assigned Agent
- Created Date
- Actions (View, Edit)

**Create Customer Form** (`/team/customers/create`):
```typescript
{
  email: string;           // Required, unique
  password: string;        // Required, min 6 chars
  company_name: string;    // Required
  contact_person: string;  // Required
  phone?: string;          // Optional
}
```

**API Endpoints**:
- `GET /api/customers` - List customers
- `POST /api/customers/create` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### 5.5 Customer Detail Page (`/team/customers/[id]`)

**Tabs**:

**1. Overview Tab**:
- Company Information
  - Company Name
  - Contact Person
  - Email
  - Phone
  - Created Date
- Assigned Agent
  - Current agent name
  - Reassign button (for managers/admins)
- Quick Actions
  - Reset Password (Super Admin only)
  - Edit Customer
  - View Tickets

**2. Tickets Tab**:
- List of all customer tickets
- Filter by status
- Click to view ticket detail

**3. Products Tab**:
- List of customer products
- Add new product button
- Edit/Delete products

**4. Excel Files Tab**:
- List of uploaded Excel files
- Upload new file button
- View/Download files

**Reset Password Dialog** (Super Admin):
```typescript
{
  newPassword: string;        // Min 6 chars
  confirmPassword: string;    // Must match newPassword
}
```

**API Endpoint**: `POST /api/password/customer/admin-reset`

**Request**:
```typescript
{
  customerId: string;
  newPassword: string;
}
```

### 5.6 User Management (`/team/users`)

**Access**: Super Admin only

**Features**:
- List all team members
- Create new users
- Edit user details
- Delete users
- View activity logs

**User List Fields**:
- Full Name
- Email
- Role (badge)
- Gmail Address
- Created Date
- Actions (Edit, Delete)

**Create User Form** (`/team/users/create`):
```typescript
{
  email: string;        // Required, unique
  password: string;     // Required, min 6 chars
  full_name: string;    // Required
  role: 'super_admin' | 'manager' | 'agent';  // Required
}
```

**API Endpoints**:
- `GET /api/users` - List users
- `POST /api/user-management/create` - Create user
- `GET /api/users/[id]` - Get user details
- `PUT /api/user-management/update/[id]` - Update user
- `DELETE /api/user-management/delete/[id]` - Delete user

**Edit User Page** (`/team/users/[id]`):
- Update full name
- Update email
- Update role
- Change password
- View user's activity

### 5.7 Excel Upload Management

**Purpose**: Upload Excel files for customers to view

**Upload Process**:
1. Select customer from dropdown
2. Choose Excel file (.xlsx, .xls, .csv)
3. Add optional description
4. Click Upload
5. File is parsed and stored
6. Customer can view in their portal

**Upload Form**:
```typescript
{
  customerId: string;      // Required
  file: File;              // Required, max 10MB
  description?: string;    // Optional
}
```

**API Endpoint**: `POST /api/excel-uploads`

**Request**: multipart/form-data
```typescript
{
  customerId: string;
  description?: string;
  file: File;
}
```

**Response**:
```typescript
{
  success: boolean;
  upload: {
    id: string;
    file_name: string;
    file_path: string;  // Blob URL
    file_size: number;
  }
}
```

**File Processing**:
1. File uploaded to Vercel Blob
2. Excel parsed using `xlsx` library
3. Each row inserted into `excel_data` table
4. Metadata stored in `excel_uploads` table

**View Excel** (`/team/excel-view/[id]`):
- Sheet selector (tabs)
- Table view of data
- Column headers from first row
- Scrollable content
- Download original file button

**API Endpoint**: `GET /api/excel-uploads/[id]/data`

**Response**:
```typescript
{
  success: boolean;
  data: {
    uploadId: string;
    fileName: string;
    sheets: {
      [sheetName: string]: Array<{
        [column: string]: any;
      }>;
    };
  }
}
```

### 5.8 Product Request Management (`/team/product-requests`)

**Purpose**: Review customer product requests

**Request List Fields**:
- Product Name
- Customer Name
- Description
- Status (badge)
- Requested Date
- Actions (Approve, Reject)

**Actions**:
1. View request details
2. Assign to agent
3. Approve request
   - Creates new product for customer
   - Updates request status to 'approved'
   - Sends notification to customer
4. Reject request
   - Updates status to 'rejected'
   - Sends notification to customer

**API Endpoints**:
- `GET /api/product-requests` - List requests
- `PUT /api/product-requests/[id]` - Update request

**Update Request**:
```typescript
{
  status: 'approved' | 'rejected';
  assigned_agent_id?: string;
}
```

### 5.9 Activity Logs (`/team/activity-logs`)

**Access**: Super Admin, Manager

**Purpose**: Audit trail of all system actions

**Log Fields**:
- Timestamp
- User (who performed action)
- Action (create, update, delete)
- Entity Type (user, customer, ticket, etc.)
- Entity ID
- Old Values (JSON)
- New Values (JSON)

**Filters**:
- Date range
- Entity type
- Action type
- User

**API Endpoint**: `GET /api/activity-logs`

**Query Parameters**:
```typescript
{
  entityType?: string;
  entityId?: string;
  action?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
}
```

### 5.10 Profile Page (`/team/profile`)

**Sections**:

**1. Personal Information**:
- Full Name (editable)
- Email (editable)
- Role (read-only)

**2. Gmail Configuration**:
- Gmail Address field
- Purpose: Receive email notifications
- Instructions for Gmail App Password

**3. Change Password**:
```typescript
{
  currentPassword: string;   // Required
  newPassword: string;       // Required, min 6 chars
  confirmPassword: string;   // Must match newPassword
}
```

**API Endpoints**:
- `GET /api/profile/team` - Get profile
- `PUT /api/profile/team` - Update profile
- `POST /api/password/team/change` - Change password

**Email Notification Setup**:
1. Enter Gmail address in profile
2. Generate App Password in Google Account
3. Admin sets GMAIL_USER and GMAIL_APP_PASSWORD env vars
4. Agent receives emails for:
   - New tickets assigned
   - Customer replies to tickets

---

## 6. Customer Portal Features

### 6.1 Customer Dashboard (`/customer/dashboard`)

**Stats Cards**:
- Total Products: Count of customer's products
- Open Tickets: Customer's tickets with status='open'
- Resolved Tickets: Customer's tickets with status='resolved'

**Sections**:
1. Recent Tickets
   - Last 5 tickets
   - Click to view details
2. Recent Products
   - All products
   - Click to view details

**API Endpoint**: `GET /api/customer/stats/[id]`

**Response**:
```typescript
{
  totalProducts: number;
  openTickets: number;
  resolvedTickets: number;
}
```

### 6.2 Tickets (`/customer/tickets`)

**Features**:
- View all customer's tickets
- Filter by status
- Search by title
- Create new ticket

**Ticket List Fields**:
- Ticket ID
- Title
- Status
- Priority
- Assigned Agent (if any)
- Created Date
- Actions (View)

**Create Ticket** (`/customer/tickets/create`):

**Form Fields**:
```typescript
{
  title: string;           // Required, max 200 chars
  description: string;     // Required, max 5000 chars
  priority: 'low' | 'medium' | 'high' | 'urgent';  // Required
  product_id?: string;     // Optional, select from customer's products
}
```

**API Endpoint**: `POST /api/tickets`

**Request**:
```typescript
{
  title: string;
  description: string;
  priority: string;
  product_id?: string;
}
// customer_id auto-filled from session
// status defaults to 'open'
```

**Response**:
```typescript
{
  success: boolean;
  ticket: {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }
}
```

**Business Logic**:
1. Customer creates ticket
2. Notification created for assigned agent (if any)
3. Email sent to agent's Gmail (if configured)
4. Ticket appears in team dashboard

### 6.3 Ticket Chat (Customer View)

**Access**: Click ticket in list

**Features**:
- View ticket details
- See all messages
- Send messages to agent
- View message history

**Message List**:
- Customer messages (right side, blue)
- Agent messages (left side, gray)
- Timestamps
- Sender names

**Message Form**:
```typescript
{
  message: string;   // Required, max 5000 chars
}
```

**API Endpoints**:
- `GET /api/tickets/[id]` - Get ticket
- `GET /api/messages?ticketId=...` - Get messages
- `POST /api/messages` - Send message

**Message Send Request**:
```typescript
{
  ticketId: string;
  message: string;
}
// sender_id and sender_type auto-filled from session
```

**Email Notifications**:
- When customer sends message, agent receives email
- Email includes message preview and link to ticket

### 6.4 Products (`/customer/products`)

**Purpose**: View assigned products and uploaded Excel files

**Sections**:

**1. Excel Files Section** (Top):
- Title: "Product Information Files"
- List of Excel files uploaded by agents
- Each file shows:
  - File name
  - Upload date
  - File size
  - View button

**View Excel Button**:
- Navigates to `/customer/excel-view/[id]`
- Shows parsed Excel data in table format
- Tabs for multiple sheets
- Scrollable table

**2. Products List** (Below):
- All customer's products
- Product cards showing:
  - Product Name
  - Description
  - Status badge
  - Created Date
  - View Details button

**Product Detail** (`/customer/products/[id]`):
- Full product information
- Related tickets
- Request changes button

**API Endpoints**:
- `GET /api/products?customerId=...` - Get products
- `GET /api/excel-uploads?customerId=...` - Get Excel files
- `GET /api/products/[id]` - Get product details

### 6.5 Product Requests (`/customer/requests`)

**Purpose**: Request new products or services

**Request Form**:
```typescript
{
  product_name: string;    // Required, max 200 chars
  description: string;     // Required, max 5000 chars
}
```

**API Endpoint**: `POST /api/product-requests`

**Request**:
```typescript
{
  product_name: string;
  description: string;
}
// customer_id auto-filled from session
// status defaults to 'pending'
```

**Request List**:
- All customer's requests
- Status badges:
  - Pending (Yellow)
  - Approved (Green)
  - Rejected (Red)
- Review details
- Reviewed by (agent name)
- Reviewed date

### 6.6 Customer Profile (`/customer/profile`)

**Sections**:

**1. Company Information**:
- Company Name (editable)
- Contact Person (editable)
- Email (editable)
- Phone (editable)

**2. Change Password**:
```typescript
{
  currentPassword: string;
  newPassword: string;      // Min 6 chars
  confirmPassword: string;  // Must match
}
```

**API Endpoints**:
- `GET /api/profile/customer` - Get profile
- `PUT /api/profile/customer` - Update profile
- `POST /api/password/customer/change` - Change password

---

## 7. API Reference

### 7.1 Authentication APIs

#### POST /api/auth/team/login
**Purpose**: Authenticate team member

**Request**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "agent"
  }
}
```

**Response Error (401)**:
```json
{
  "error": "Invalid credentials"
}
```

**Cookie Set**: `team-session` (HttpOnly, 7 days)

#### POST /api/auth/customer/login
**Purpose**: Authenticate customer

**Request**:
```json
{
  "email": "client@company.com",
  "password": "password123"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "client@company.com",
    "company_name": "ACME Corp",
    "contact_person": "Jane Smith"
  }
}
```

**Cookie Set**: `customer-session` (HttpOnly, 7 days)

#### GET /api/auth/session
**Purpose**: Check current session

**Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "agent"
  }
}
// OR
{
  "customer": {
    "id": "uuid",
    "email": "client@company.com",
    "company_name": "ACME Corp"
  }
}
// OR
{}  // No active session
```

#### POST /api/auth/logout
**Purpose**: Logout user

**Response (200)**:
```json
{
  "success": true
}
```

**Clears cookies**: Both `team-session` and `customer-session`

### 7.2 Ticket APIs

#### GET /api/tickets
**Purpose**: List tickets

**Query Parameters**:
- `customerId` (string, optional): Filter by customer
- `agentId` (string, optional): Filter by agent
- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority

**Auth**: Requires `team-session` or `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "tickets": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "agent_id": "uuid",
      "product_id": "uuid",
      "title": "Cannot login",
      "description": "Getting error when trying to login",
      "status": "open",
      "priority": "high",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "customer_name": "ACME Corp",
      "agent_name": "John Doe",
      "product_name": "Website Hosting"
    }
  ]
}
```

#### POST /api/tickets
**Purpose**: Create new ticket

**Auth**: Requires `customer-session`

**Request**:
```json
{
  "title": "Cannot login",
  "description": "Getting error when trying to login",
  "priority": "high",
  "product_id": "uuid"  // optional
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "title": "Cannot login",
    "status": "open",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Side Effects**:
- Creates notification for assigned agent
- Sends email to agent (if Gmail configured)
- Logs activity

#### GET /api/tickets/[id]
**Purpose**: Get ticket details

**Auth**: Requires `team-session` or `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "customer_id": "uuid",
    "agent_id": "uuid",
    "product_id": "uuid",
    "title": "Cannot login",
    "description": "Getting error when trying to login",
    "status": "open",
    "priority": "high",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "customer": {
      "company_name": "ACME Corp",
      "contact_person": "Jane Smith",
      "email": "jane@acme.com"
    },
    "agent": {
      "full_name": "John Doe",
      "email": "john@company.com"
    },
    "product": {
      "name": "Website Hosting"
    }
  }
}
```

#### PUT /api/tickets/[id]
**Purpose**: Update ticket

**Auth**: Requires `team-session`

**Request**:
```json
{
  "status": "in_progress",
  "priority": "urgent",
  "agent_id": "uuid"
}
```

**Response (200)**:
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "status": "in_progress",
    "priority": "urgent",
    "agent_id": "uuid",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Side Effects**:
- Logs activity with old and new values
- Creates notification for customer
- Updates updated_at timestamp

### 7.3 Message APIs

#### GET /api/messages
**Purpose**: Get ticket messages

**Query Parameters**:
- `ticketId` (string, required): Ticket ID

**Auth**: Requires `team-session` or `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "sender_id": "uuid",
      "sender_type": "customer",
      "message": "I need help with login",
      "created_at": "2024-01-15T10:30:00Z",
      "sender_name": "Jane Smith"
    },
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "sender_id": "uuid",
      "sender_type": "user",
      "message": "I'll help you with that",
      "created_at": "2024-01-15T10:35:00Z",
      "sender_name": "John Doe"
    }
  ]
}
```

#### POST /api/messages
**Purpose**: Send message in ticket

**Auth**: Requires `team-session` or `customer-session`

**Request**:
```json
{
  "ticketId": "uuid",
  "message": "Thanks for your help!"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "ticket_id": "uuid",
    "sender_id": "uuid",
    "sender_type": "customer",
    "message": "Thanks for your help!",
    "created_at": "2024-01-15T10:40:00Z"
  }
}
```

**Side Effects**:
- Creates notification for recipient
- Sends email to agent (if customer sent message)
- Updates ticket updated_at

### 7.4 Customer APIs

#### GET /api/customers
**Purpose**: List customers

**Auth**: Requires `team-session`

**Query Parameters**:
- `search` (string, optional): Search by company name or email
- `agentId` (string, optional): Filter by assigned agent

**Response (200)**:
```json
{
  "success": true,
  "customers": [
    {
      "id": "uuid",
      "email": "client@acme.com",
      "company_name": "ACME Corp",
      "contact_person": "Jane Smith",
      "phone": "+1234567890",
      "created_at": "2024-01-01T00:00:00Z",
      "agent_name": "John Doe",
      "agent_id": "uuid"
    }
  ]
}
```

#### POST /api/customers/create
**Purpose**: Create customer

**Auth**: Requires `team-session`

**Request**:
```json
{
  "email": "newclient@company.com",
  "password": "password123",
  "company_name": "New Company",
  "contact_person": "Bob Johnson",
  "phone": "+9876543210"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "newclient@company.com",
    "company_name": "New Company",
    "contact_person": "Bob Johnson"
  }
}
```

**Validation**:
- Email must be unique
- Password min 6 chars
- Company name required
- Contact person required

#### GET /api/customers/[id]
**Purpose**: Get customer details

**Auth**: Requires `team-session`

**Response (200)**:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "client@acme.com",
    "company_name": "ACME Corp",
    "contact_person": "Jane Smith",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "assigned_agent": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@company.com"
    }
  }
}
```

#### PUT /api/customers/[id]
**Purpose**: Update customer

**Auth**: Requires `team-session`

**Request**:
```json
{
  "company_name": "ACME Corporation",
  "contact_person": "Jane Doe",
  "phone": "+1111111111"
}
```

**Response (200)**:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "company_name": "ACME Corporation",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}
```

**Side Effects**:
- Logs activity

#### DELETE /api/customers/[id]
**Purpose**: Delete customer

**Auth**: Requires `team-session` (Super Admin only)

**Response (200)**:
```json
{
  "success": true
}
```

**Side Effects**:
- Deletes customer
- Cascades to related tickets, products, etc.
- Logs activity

### 7.5 Product APIs

#### GET /api/products
**Purpose**: List products

**Auth**: Requires `team-session` or `customer-session`

**Query Parameters**:
- `customerId` (string, optional/auto): Filter by customer
- `status` (string, optional): Filter by status

**Response (200)**:
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "name": "Website Hosting",
      "description": "Premium shared hosting package",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "customer_name": "ACME Corp"
    }
  ]
}
```

#### POST /api/products
**Purpose**: Create product

**Auth**: Requires `team-session`

**Request**:
```json
{
  "customerId": "uuid",
  "name": "SSL Certificate",
  "description": "Wildcard SSL certificate",
  "status": "active"
}
```

**Response (201)**:
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "SSL Certificate",
    "status": "active",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

#### GET /api/products/[id]
**Purpose**: Get product details

**Auth**: Requires `team-session` or `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "customer_id": "uuid",
    "name": "Website Hosting",
    "description": "Premium shared hosting package",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "customer": {
      "company_name": "ACME Corp"
    }
  }
}
```

#### PUT /api/products/[id]
**Purpose**: Update product

**Auth**: Requires `team-session`

**Request**:
```json
{
  "name": "Premium Website Hosting",
  "status": "inactive"
}
```

**Response (200)**:
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "Premium Website Hosting",
    "status": "inactive",
    "updated_at": "2024-01-15T12:30:00Z"
  }
}
```

### 7.6 Excel Upload APIs

#### POST /api/excel-uploads
**Purpose**: Upload Excel file

**Auth**: Requires `team-session`

**Content-Type**: multipart/form-data

**Form Fields**:
- `customerId`: string (required)
- `file`: File (required, .xlsx/.xls/.csv)
- `description`: string (optional)

**Response Success (201)**:
```json
{
  "success": true,
  "upload": {
    "id": "uuid",
    "file_name": "products_2024.xlsx",
    "file_path": "https://blob.vercel-storage.com/...",
    "file_size": 45678,
    "created_at": "2024-01-15T13:00:00Z"
  }
}
```

**Process**:
1. Upload file to Vercel Blob
2. Parse Excel with xlsx library
3. Store each row in excel_data table
4. Store metadata in excel_uploads table

**Validation**:
- File size max 10MB
- Must be Excel format (.xlsx, .xls, .csv)
- Customer ID must exist

#### GET /api/excel-uploads
**Purpose**: List Excel uploads

**Auth**: Requires `team-session` or `customer-session`

**Query Parameters**:
- `customerId` (string, optional/auto): Filter by customer

**Response (200)**:
```json
{
  "success": true,
  "uploads": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "file_name": "products_2024.xlsx",
      "file_size": 45678,
      "description": "Q1 inventory",
      "created_at": "2024-01-15T13:00:00Z",
      "uploader_name": "John Doe"
    }
  ]
}
```

#### GET /api/excel-uploads/[id]/data
**Purpose**: Get parsed Excel data

**Auth**: Requires `team-session` or `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "fileName": "products_2024.xlsx",
    "sheets": {
      "Sheet1": [
        {
          "A": "Product Name",
          "B": "SKU",
          "C": "Price"
        },
        {
          "A": "Widget",
          "B": "WDG-001",
          "C": "$19.99"
        }
      ],
      "Sheet2": [...]
    }
  }
}
```

#### DELETE /api/excel-uploads/[id]
**Purpose**: Delete Excel upload

**Auth**: Requires `team-session`

**Response (200)**:
```json
{
  "success": true
}
```

**Side Effects**:
- Deletes file from Vercel Blob
- Deletes excel_uploads record
- Cascades delete to excel_data records

### 7.7 Notification APIs

#### GET /api/notifications/subscribe
**Purpose**: Get unread notifications (long-polling)

**Auth**: Requires `team-session` or `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_type": "user",
      "entity_type": "ticket",
      "entity_id": "uuid",
      "event_type": "ticket_created",
      "title": "New Ticket Created",
      "message": "Ticket #123: Cannot login - assigned to you",
      "read": false,
      "created_at": "2024-01-15T14:00:00Z"
    }
  ]
}
```

#### POST /api/notifications/mark-read
**Purpose**: Mark notification as read

**Auth**: Requires `team-session` or `customer-session`

**Request**:
```json
{
  "notificationId": "uuid"
}
```

**Response (200)**:
```json
{
  "success": true
}
```

### 7.8 Stats APIs

#### GET /api/team/stats
**Purpose**: Get team dashboard stats

**Auth**: Requires `team-session`

**Response (200)**:
```json
{
  "success": true,
  "totalCustomers": 45,
  "openTickets": 12,
  "inProgressTickets": 8,
  "resolvedTickets": 156
}
```

#### GET /api/customer/stats/[id]
**Purpose**: Get customer dashboard stats

**Auth**: Requires `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "totalProducts": 3,
  "openTickets": 2,
  "resolvedTickets": 15
}
```

### 7.9 Profile APIs

#### GET /api/profile/team
**Purpose**: Get team member profile

**Auth**: Requires `team-session`

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@company.com",
    "full_name": "John Doe",
    "role": "agent",
    "gmail_address": "john.doe@gmail.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/profile/team
**Purpose**: Update team profile

**Auth**: Requires `team-session`

**Request**:
```json
{
  "full_name": "John Smith",
  "email": "john.smith@company.com",
  "gmail_address": "john.smith@gmail.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "full_name": "John Smith",
    "gmail_address": "john.smith@gmail.com",
    "updated_at": "2024-01-15T15:00:00Z"
  }
}
```

#### GET /api/profile/customer
**Purpose**: Get customer profile

**Auth**: Requires `customer-session`

**Response (200)**:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "client@acme.com",
    "company_name": "ACME Corp",
    "contact_person": "Jane Smith",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/profile/customer
**Purpose**: Update customer profile

**Auth**: Requires `customer-session`

**Request**:
```json
{
  "company_name": "ACME Corporation",
  "contact_person": "Jane Doe",
  "phone": "+1111111111"
}
```

**Response (200)**:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "company_name": "ACME Corporation",
    "updated_at": "2024-01-15T15:30:00Z"
  }
}
```

### 7.10 Password APIs

#### POST /api/password/team/change
**Purpose**: Change team member password

**Auth**: Requires `team-session`

**Request**:
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Response Error (401)**:
```json
{
  "error": "Current password is incorrect"
}
```

#### POST /api/password/customer/change
**Purpose**: Change customer password

**Auth**: Requires `customer-session`

**Request**:
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

#### POST /api/password/customer/admin-reset
**Purpose**: Reset customer password (Super Admin)

**Auth**: Requires `team-session` (role='super_admin')

**Request**:
```json
{
  "customerId": "uuid",
  "newPassword": "temppass123"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response Error (403)**:
```json
{
  "error": "Forbidden: Super admin access required"
}
```

**Side Effects**:
- Logs activity as 'update' action on customer entity

---

## 8. Components Library

### 8.1 UI Components (shadcn/ui)

Located in `components/ui/`:

- **accordion**: Collapsible content sections
- **alert**: Notification messages
- **avatar**: User profile images
- **badge**: Status indicators
- **button**: Interactive buttons
- **card**: Content containers
- **checkbox**: Boolean input
- **dialog**: Modal windows
- **dropdown-menu**: Contextual menus
- **input**: Text input fields
- **label**: Form labels
- **select**: Dropdown selections
- **table**: Data tables
- **tabs**: Tabbed content
- **textarea**: Multi-line text input
- **toast**: Temporary notifications

### 8.2 Team Components

Located in `components/team/`:

#### TeamNav
**Purpose**: Navigation header for team portal

**Props**: None

**Features**:
- Logo and app title
- Navigation links (Dashboard, Tickets, Customers, etc.)
- User menu dropdown
- Notifications bell
- Logout option

#### TicketsView
**Purpose**: Display and manage ticket list

**Props**:
```typescript
{
  tickets: Ticket[];
  onStatusChange: (ticketId: string, status: string) => void;
  onAssignAgent: (ticketId: string, agentId: string) => void;
}
```

**Features**:
- Sortable columns
- Status filter dropdown
- Priority filter dropdown
- Agent assignment
- Search functionality

#### ChatView
**Purpose**: Ticket chat interface

**Props**:
```typescript
{
  ticketId: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
}
```

**Features**:
- Message list
- Sender identification
- Timestamp display
- Message input
- Send button

#### ExcelUploadsSection
**Purpose**: Upload and manage Excel files

**Props**:
```typescript
{
  customerId: string;
}
```

**Features**:
- File upload form
- Upload progress
- File list display
- View/Delete actions

### 8.3 Customer Components

Located in `components/customer/`:

#### CustomerNav
**Purpose**: Navigation for customer portal

**Props**: None

**Features**:
- Logo
- Navigation links (Dashboard, Tickets, Products, etc.)
- User menu
- Notifications

#### TicketsList
**Purpose**: Display customer tickets

**Props**:
```typescript
{
  customerId: string;
}
```

**Features**:
- Ticket cards
- Status badges
- Filter by status
- View ticket button

#### ProductsList
**Purpose**: Display customer products

**Props**:
```typescript
{
  customerId: string;
}
```

**Features**:
- Product cards
- Status indicators
- View details button

#### ExcelProductsSection
**Purpose**: Display Excel files for customer

**Props**:
```typescript
{
  customerId: string;
}
```

**Features**:
- File list
- View button
- Download option

### 8.4 Common Components

Located in `components/common/`:

#### NotificationsBell
**Purpose**: Real-time notifications dropdown

**Props**: None

**Features**:
- Unread count badge
- Notification list
- Mark as read
- Clear all
- Auto-refresh

**Usage**:
```typescript
<NotificationsBell />
```

#### ExcelViewer
**Purpose**: Display parsed Excel data

**Props**:
```typescript
{
  uploadId: string;
}
```

**Features**:
- Sheet tabs
- Table view
- Column headers
- Scrollable content
- Responsive design

---

## 9. Configuration

### 9.1 Environment Variables

#### Required Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db"
POSTGRES_URL="postgresql://user:pass@host/db"
POSTGRES_PRISMA_URL="postgresql://user:pass@host/db?pgbouncer=true"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_token"

# Application URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Gmail SMTP (for email notifications)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
```

#### Optional Variables

```bash
# Additional Neon variables (auto-configured by Vercel)
PGHOST="host"
PGUSER="user"
PGPASSWORD="password"
PGDATABASE="database"
```

### 9.2 Gmail Setup

**Steps to Configure Gmail for Email Notifications**:

1. **Enable 2-Factor Authentication**:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Enable 2FA

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "CRM Notifications"
   - Copy the 16-character password

3. **Set Environment Variables**:
   ```bash
   GMAIL_USER="your-email@gmail.com"
   GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
   ```

4. **Configure Agent Gmail Address**:
   - Agent logs in to `/team/profile`
   - Enters Gmail address in profile
   - Saves profile
   - Now receives email notifications

### 9.3 Database Setup

**Initial Setup**:

1. **Create Neon Project**:
   - Visit https://neon.tech
   - Create new project
   - Copy connection string

2. **Add to Vercel**:
   - Go to Vercel project settings
   - Environment Variables
   - Add DATABASE_URL

3. **Run Migrations**:
   ```bash
   # From v0 chat interface or Neon SQL editor
   # Execute scripts in order:
   scripts/001_create_schema.sql
   scripts/002_add_notifications_table.sql  # If needed
   scripts/003_add_excel_tables.sql         # If needed
   scripts/004_add_gmail_field.sql          # If needed
   ```

**Migration Scripts**:

All database setup scripts are in the `scripts/` folder:

- `001_create_schema.sql`: Initial tables and relationships
- Additional migration scripts for new features

### 9.4 Vercel Blob Setup

**Setup Steps**:

1. **Add Blob Integration**:
   - Vercel dashboard → Project → Storage
   - Add → Blob Storage
   - Configure settings

2. **Environment Variable**:
   - `BLOB_READ_WRITE_TOKEN` is auto-configured
   - Used by `@vercel/blob` package

3. **Usage in Code**:
   ```typescript
   import { put, del } from '@vercel/blob';
   
   // Upload file
   const blob = await put(fileName, file, {
     access: 'public',
   });
   
   // Delete file
   await del(blobUrl);
   ```

### 9.5 Next.js Configuration

**next.config.mjs**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['blob.vercel-storage.com'],
  },
};

export default nextConfig;
```

**Key Settings**:
- **reactStrictMode**: Enables React strict mode
- **serverActions**: Enables Next.js 13+ server actions
- **images.domains**: Allows Vercel Blob images

### 9.6 TypeScript Configuration

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 10. Security

### 10.1 Authentication Security

**Password Hashing**:
- Algorithm: bcrypt
- Salt rounds: 10
- Passwords never stored in plain text

**Session Management**:
- HttpOnly cookies (cannot be accessed by JavaScript)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- 7-day expiration
- Separate cookies for team and customers

**Cookie Structure**:
```typescript
// team-session
{
  userId: "uuid",
  email: "user@company.com",
  role: "agent"
}
// Signed and encrypted by Next.js

// customer-session
{
  customerId: "uuid",
  email: "client@company.com",
  company_name: "ACME Corp"
}
```

### 10.2 Authorization

**Route Protection**:

Every API route checks for appropriate session:

```typescript
// Team-only routes
const teamSession = request.cookies.get('team-session');
if (!teamSession) {
  return NextResponse.json(
    { error: 'Unauthorized' }, 
    { status: 401 }
  );
}

// Role-based access
const session = JSON.parse(teamSession.value);
if (session.role !== 'super_admin') {
  return NextResponse.json(
    { error: 'Forbidden' }, 
    { status: 403 }
  );
}
```

**Data Access Control**:
- Customers can only access their own data
- Agents see only assigned or unassigned items
- Managers see all team data
- Super Admins have full access

### 10.3 SQL Injection Prevention

**Parameterized Queries**:

Always use parameterized queries with tagged template literals:

```typescript
// CORRECT - Safe from SQL injection
const result = await sql`
  SELECT * FROM tickets 
  WHERE customer_id = ${customerId}
`;

// WRONG - Vulnerable to SQL injection
const result = await sql.query(
  `SELECT * FROM tickets WHERE customer_id = '${customerId}'`
);
```

**Input Validation**:
- All user inputs validated
- Type checking with TypeScript
- Runtime validation with zod (where applicable)

### 10.4 File Upload Security

**File Validation**:
- File type checking (MIME type)
- File size limit: 10MB
- Allowed extensions: .xlsx, .xls, .csv
- Virus scanning (recommended for production)

**Storage Security**:
- Files stored in Vercel Blob (isolated)
- Public access URLs with unique identifiers
- No direct file system access
- Automatic cleanup on deletion

### 10.5 XSS Prevention

**Content Security**:
- React automatic escaping
- No dangerouslySetInnerHTML usage
- User content sanitized
- HTML entities encoded

**Headers**:
```typescript
// next.config.mjs
{
  headers: [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
  ],
}
```

### 10.6 CSRF Protection

**Protection Mechanisms**:
- SameSite cookie attribute
- POST requests for state changes
- No GET requests for mutations
- Origin header validation

### 10.7 Rate Limiting

**Recommendations for Production**:

```typescript
// Example with Vercel Edge Config
import { ratelimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const identifier = request.ip || 'anonymous';
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Process request
}
```

**Suggested Limits**:
- Login attempts: 5 per 15 minutes
- API requests: 100 per minute
- File uploads: 10 per hour

### 10.8 Environment Variable Security

**Best Practices**:
- Never commit `.env` files
- Use Vercel environment variables
- Separate dev/staging/production
- Rotate credentials regularly

**Variable Types**:
- **Server-only**: Database passwords, API keys
- **Public**: Variables prefixed with `NEXT_PUBLIC_`

---

## 11. Workflows

### 11.1 Customer Ticket Workflow

```
1. Customer Creates Ticket
   ↓
2. Ticket Status: "open"
   ↓
3. Notification sent to assigned agent (if any)
   ↓
4. Email sent to agent's Gmail (if configured)
   ↓
5. Agent views ticket in dashboard
   ↓
6. Agent assigns self (if not assigned)
   ↓
7. Status changes to "in_progress"
   ↓
8. Agent sends message to customer
   ↓
9. Customer receives notification
   ↓
10. Customer replies via chat
    ↓
11. Agent receives email notification
    ↓
12. Agent resolves issue
    ↓
13. Status changes to "resolved"
    ↓
14. Customer confirms resolution
    ↓
15. Status changes to "closed"
```

### 11.2 Excel Upload Workflow

```
1. Agent navigates to customer detail page
   ↓
2. Clicks "Upload Excel File"
   ↓
3. Selects file from computer
   ↓
4. Adds optional description
   ↓
5. Clicks Upload
   ↓
6. File uploaded to Vercel Blob
   ↓
7. File parsed with xlsx library
   ↓
8. Each row inserted into excel_data table
   ↓
9. Metadata stored in excel_uploads table
   ↓
10. Customer sees file in their products page
    ↓
11. Customer clicks View
    ↓
12. Excel data displayed in table format
    ↓
13. Customer can switch between sheets
    ↓
14. Customer can download original file
```

### 11.3 Product Request Workflow

```
1. Customer submits product request
   ↓
2. Request status: "pending"
   ↓
3. Notification sent to managers
   ↓
4. Manager reviews request
   ↓
5. Manager assigns to agent (optional)
   ↓
6. Agent evaluates request
   ↓
7. Agent approves OR rejects
   ↓
   ├─ If Approved:
   │  ├─ Status: "approved"
   │  ├─ New product created for customer
   │  └─ Notification sent to customer
   │
   └─ If Rejected:
      ├─ Status: "rejected"
      └─ Notification sent to customer
```

### 11.4 User Management Workflow

```
1. Super Admin creates new user
   ↓
2. Enters email, password, name, role
   ↓
3. User record created in database
   ↓
4. Activity logged
   ↓
5. User can now login
   ↓
6. User sets up profile
   ↓
7. User adds Gmail address (optional)
   ↓
8. User starts receiving email notifications
   ↓
9. If role changes:
   ├─ Super Admin updates role
   ├─ Activity logged
   └─ User permissions update immediately
```

### 11.5 Customer Onboarding Workflow

```
1. Agent creates customer account
   ↓
2. Enters company details and credentials
   ↓
3. Customer record created
   ↓
4. Agent assigns self to customer (optional)
   ↓
5. Agent creates initial products for customer
   ↓
6. Agent uploads any relevant Excel files
   ↓
7. Customer receives login credentials
   ↓
8. Customer logs in for first time
   ↓
9. Customer views products and Excel files
   ↓
10. Customer can create tickets
```

---

## 12. Troubleshooting

### 12.1 Common Issues

#### Login Issues

**Problem**: Cannot login as team member
**Solutions**:
1. Check email spelling
2. Verify password (case-sensitive)
3. Ensure account exists in `users` table
4. Check browser cookies are enabled
5. Clear browser cache and cookies
6. Try different browser

**Problem**: Cannot login as customer
**Solutions**:
1. Verify email in `customers` table
2. Check password reset with admin
3. Ensure `customer-session` cookie can be set
4. Check for any CORS issues

#### Cookie Issues

**Problem**: Session cookie not persisting
**Solutions**:
1. Check browser settings allow cookies
2. Verify HTTPS in production
3. Check SameSite attribute compatibility
4. Inspect cookie expiration (7 days)
5. Clear all site cookies and retry

**Problem**: Logged out unexpectedly
**Solutions**:
1. Check cookie expiration (7 days)
2. Browser may have cleared cookies
3. Session may have been invalidated
4. Re-login required

#### Database Connection Issues

**Problem**: Database errors in API routes
**Solutions**:
1. Verify `DATABASE_URL` environment variable
2. Check Neon project is active
3. Test connection string directly
4. Check for IP restrictions in Neon
5. Verify database migrations ran successfully

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### File Upload Issues

**Problem**: Excel upload fails
**Solutions**:
1. Check file size (max 10MB)
2. Verify file format (.xlsx, .xls, .csv)
3. Check `BLOB_READ_WRITE_TOKEN` is set
4. Verify Vercel Blob integration is active
5. Check browser console for errors
6. Try smaller file first

**Problem**: Uploaded Excel not displaying
**Solutions**:
1. Check file was parsed successfully
2. Verify data in `excel_data` table
3. Check `excel_uploads` record exists
4. Inspect browser console for errors
5. Try re-uploading file

#### Email Notification Issues

**Problem**: Emails not being sent
**Solutions**:
1. Verify `GMAIL_USER` environment variable
2. Check `GMAIL_APP_PASSWORD` is correct
3. Verify 2FA enabled on Gmail account
4. Check app password hasn't expired
5. Verify agent has Gmail address in profile
6. Check `email_logs` table for errors

```typescript
// Check email logs
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC 
LIMIT 10;
```

**Problem**: Agent not receiving ticket emails
**Solutions**:
1. Verify agent has `gmail_address` set in profile
2. Check Gmail spam/junk folder
3. Verify SMTP credentials in environment
4. Check email quota limits
5. Test with different email address

#### Notification Issues

**Problem**: Notifications not appearing
**Solutions**:
1. Check browser allows notifications
2. Verify notifications are created in database
3. Check `NotificationsBell` component is mounted
4. Inspect browser console for errors
5. Try refresh page

```sql
-- Check notifications
SELECT * FROM notifications 
WHERE user_id = 'your-user-id' 
AND read = false
ORDER BY created_at DESC;
```

**Problem**: Notification badge not updating
**Solutions**:
1. Check polling interval (3 seconds default)
2. Verify network tab shows requests
3. Mark as read not working
4. Clear browser cache
5. Check for JavaScript errors

#### Permission Issues

**Problem**: "Forbidden" or "Unauthorized" errors
**Solutions**:
1. Verify correct session type (team vs customer)
2. Check role requirements for route
3. Ensure user has necessary role
4. Re-login to refresh session
5. Check API route authorization logic

**Problem**: Cannot access admin features
**Solutions**:
1. Verify user role is 'super_admin'
2. Check session cookie contains correct role
3. Re-login to update session
4. Contact super admin for role change

#### UI/Display Issues

**Problem**: Page not loading or white screen
**Solutions**:
1. Check browser console for errors
2. Verify all required environment variables
3. Clear browser cache
4. Try incognito/private mode
5. Check network tab for failed requests

**Problem**: Sidebar not showing
**Solutions**:
1. Verify `SidebarProvider` wraps page
2. Check `useSidebar` hook has context
3. Inspect for JavaScript errors
4. Verify component imports
5. Check mobile menu toggle

**Problem**: Stats cards showing 0 or wrong data
**Solutions**:
1. Verify database has data
2. Check API endpoint returns correct data
3. Inspect network tab for response
4. Verify SQL query logic
5. Check for type casting issues

```sql
-- Verify data
SELECT COUNT(*)::int as count FROM tickets WHERE status = 'open';
```

### 12.2 Development Issues

#### Build Errors

**Problem**: TypeScript errors during build
**Solutions**:
1. Run `npm install` to ensure dependencies
2. Check `tsconfig.json` configuration
3. Verify all imports have correct paths
4. Check for missing type definitions
5. Run `npm run lint` to find issues

**Problem**: Module not found errors
**Solutions**:
1. Verify package is installed
2. Check import path uses `@/` alias
3. Ensure file extension is correct
4. Check case sensitivity of filename
5. Restart development server

#### Runtime Errors

**Problem**: "Cannot read property of undefined"
**Solutions**:
1. Add optional chaining (`?.`)
2. Add null checks before access
3. Verify API response structure
4. Check for async timing issues
5. Add default values

**Problem**: "Headers already sent" error
**Solutions**:
1. Ensure only one response per request
2. Check for multiple `return` statements
3. Verify no response after redirect
4. Check middleware order
5. Add early returns

### 12.3 Database Troubleshooting

#### Query Issues

**Problem**: SQL syntax errors
**Solutions**:
1. Use parameterized queries (tagged templates)
2. Check table and column names match schema
3. Verify PostgreSQL syntax
4. Test query in Neon SQL editor
5. Check for reserved keywords

**Problem**: Slow queries
**Solutions**:
1. Add indexes on frequently queried columns
2. Limit result sets with LIMIT
3. Avoid SELECT *
4. Use EXPLAIN ANALYZE to debug
5. Consider caching results

```sql
-- Example: Add index for performance
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
```

#### Data Issues

**Problem**: Foreign key constraint violations
**Solutions**:
1. Verify referenced record exists
2. Check UUID format is valid
3. Ensure parent record not deleted
4. Check cascade delete settings
5. Verify relationship setup

**Problem**: Duplicate key errors
**Solutions**:
1. Check UNIQUE constraints
2. Verify email uniqueness
3. Use ON CONFLICT for upserts
4. Check for race conditions
5. Add proper error handling

### 12.4 Performance Issues

**Problem**: Slow page loads
**Solutions**:
1. Enable caching where appropriate
2. Optimize database queries
3. Reduce payload sizes
4. Use pagination for large lists
5. Implement lazy loading
6. Check network tab for slow requests

**Problem**: High memory usage
**Solutions**:
1. Limit query result sizes
2. Process large files in chunks
3. Clear unused references
4. Check for memory leaks
5. Optimize image sizes

### 12.5 Getting Help

**Debug Checklist**:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify environment variables are set
4. Check database for expected data
5. Review server logs (Vercel dashboard)
6. Test in incognito mode
7. Try different browser
8. Check for recent code changes

**Logging for Debug**:

Add logging to troubleshoot:

```typescript
// Server-side (API routes)
console.log('[v0] Processing request:', { userId, action });

// Check Vercel logs
// Vercel Dashboard → Project → Logs

// Client-side (components)
console.log('[v0] Component state:', state);

// Check browser console
// F12 → Console tab
```

**Database Debugging**:

```sql
-- Check record counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets;

-- Check recent activity
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Check notifications
SELECT * FROM notifications 
WHERE read = false
ORDER BY created_at DESC;
```

---

## Appendix A: Glossary

- **Agent**: Team member who handles customer tickets
- **Customer**: External client using the platform
- **Manager**: Team member who oversees agents
- **Super Admin**: Highest permission level, can manage users
- **Ticket**: Support request from customer
- **Product**: Service or item assigned to customer
- **Excel Upload**: Spreadsheet file uploaded by agent for customer
- **Notification**: Real-time alert for users
- **Activity Log**: Audit trail of system actions
- **Session**: Authenticated user state stored in cookie

---

## Appendix B: Database Diagram

```
users (Team Members)
├─ id (PK)
├─ email
├─ password_hash
├─ full_name
├─ role
└─ gmail_address

customers (Clients)
├─ id (PK)
├─ email
├─ password_hash
├─ company_name
├─ contact_person
└─ phone

tickets (Support Tickets)
├─ id (PK)
├─ customer_id (FK → customers.id)
├─ agent_id (FK → users.id)
├─ product_id (FK → products.id)
├─ title
├─ description
├─ status
└─ priority

messages (Ticket Chat)
├─ id (PK)
├─ ticket_id (FK → tickets.id)
├─ sender_id
├─ sender_type
└─ message

products
├─ id (PK)
├─ customer_id (FK → customers.id)
├─ name
├─ description
└─ status

product_requests
├─ id (PK)
├─ customer_id (FK → customers.id)
├─ product_name
├─ description
├─ status
├─ assigned_agent_id (FK → users.id)
└─ reviewed_by (FK → users.id)

excel_uploads
├─ id (PK)
├─ customer_id (FK → customers.id)
├─ uploaded_by (FK → users.id)
├─ file_name
├─ file_path
└─ file_size

excel_data
├─ id (PK)
├─ excel_upload_id (FK → excel_uploads.id)
├─ sheet_name
├─ row_index
└─ row_data (JSONB)

customer_agent_assignment
├─ id (PK)
├─ customer_id (FK → customers.id)
├─ agent_id (FK → users.id)
└─ assigned_by (FK → users.id)

notifications
├─ id (PK)
├─ user_id
├─ user_type
├─ entity_type
├─ entity_id
├─ event_type
├─ title
├─ message
└─ read

activity_logs
├─ id (PK)
├─ entity_type
├─ entity_id
├─ action
├─ performed_by (FK → users.id)
├─ old_values (JSONB)
└─ new_values (JSONB)

email_logs
├─ id (PK)
├─ user_id
├─ entity_type
├─ entity_id
├─ event_type
├─ recipient_email
├─ subject
└─ status
```

---

**End of Documentation**

This documentation covers all aspects of the Hazelnutcyborg CRM Platform. For additional support or feature requests, please contact the development team.

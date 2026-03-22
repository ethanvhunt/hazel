-- Migration: Product Management System with 3-Way Ticket Approval
-- This script adds:
-- 1. Product categories table
-- 2. Updates products table for global catalog with auto-generated PRD-XXXXXX IDs
-- 3. Customer product assignments table
-- 4. Customer users table (customer_admin and customer_agent roles)
-- 5. Ticket approval workflow columns
-- 6. SMS notification logs table

-- ============================================
-- 1. PRODUCT CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO product_categories (name, description) VALUES
  ('Computer', 'Desktops, laptops, workstations'),
  ('Printer', 'Printers, scanners, multifunction devices'),
  ('Network Hardware', 'Routers, switches, access points, cables'),
  ('Peripherals', 'Keyboards, mice, monitors, webcams'),
  ('Software', 'Operating systems, applications, licenses'),
  ('Server', 'Physical and virtual servers'),
  ('Storage', 'Hard drives, SSDs, NAS, SAN'),
  ('Mobile Device', 'Smartphones, tablets'),
  ('Other', 'Miscellaneous IT equipment')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PRODUCT ID SEQUENCE FOR PRD-XXXXXX FORMAT
-- ============================================
CREATE SEQUENCE IF NOT EXISTS product_id_seq START 1;

-- ============================================
-- 3. UPDATE PRODUCTS TABLE FOR GLOBAL CATALOG
-- ============================================
-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS product_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
  ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Make customer_id nullable for global products
ALTER TABLE products ALTER COLUMN customer_id DROP NOT NULL;

-- Create index for product_code
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ============================================
-- 4. CUSTOMER PRODUCT ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_product_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cpa_customer_id ON customer_product_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_cpa_product_id ON customer_product_assignments(product_id);

-- ============================================
-- 5. CUSTOMER USERS TABLE (Sub-users under each customer)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer_admin', 'customer_agent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_email ON customer_users(email);
CREATE INDEX IF NOT EXISTS idx_customer_users_role ON customer_users(role);

-- ============================================
-- 6. UPDATE TICKETS TABLE FOR APPROVAL WORKFLOW
-- ============================================
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS created_by_customer_user_id UUID REFERENCES customer_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_admin_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_admin_approved_by UUID REFERENCES customer_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_admin_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS team_agent_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_agent_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_agent_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'customer_approved', 'team_approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_tickets_approval_status ON tickets(approval_status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by_customer_user ON tickets(created_by_customer_user_id);

-- ============================================
-- 7. SMS NOTIFICATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_mobile VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('customer_admin', 'customer_agent', 'team_agent', 'team_admin')),
  recipient_id UUID,
  message TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ticket_created', 'ticket_approved_by_customer', 'ticket_approved_by_team', 'ticket_rejected', 'ticket_resolved', 'ticket_closed')),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient_mobile ON sms_logs(recipient_mobile);
CREATE INDEX IF NOT EXISTS idx_sms_logs_event_type ON sms_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);

-- ============================================
-- 8. ADD MOBILE NUMBER TO TEAM USERS
-- ============================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);

-- ============================================
-- 9. ADD ACTION TYPE INDEX FOR ACTIVITY LOGS FILTERING
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- 10. UPDATE MESSAGES TABLE TO SUPPORT CUSTOMER USERS
-- ============================================
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_type_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_type_check 
  CHECK (sender_type IN ('customer', 'agent', 'customer_user'));

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES customer_users(id) ON DELETE SET NULL;

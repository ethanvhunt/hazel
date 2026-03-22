-- Migration: Create all required tables for product management system
-- This script creates tables in the correct order to handle dependencies

-- ============================================
-- 1. CREATE PRODUCT CATEGORIES TABLE FIRST
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO product_categories (name, slug, description) VALUES
  ('Computer', 'computer', 'Desktop computers and workstations'),
  ('Laptop', 'laptop', 'Portable computers and notebooks'),
  ('Printer', 'printer', 'Printers, scanners, and multifunction devices'),
  ('Network Hardware', 'network-hardware', 'Routers, switches, access points, and network equipment'),
  ('Storage', 'storage', 'Hard drives, SSDs, NAS devices, and storage solutions'),
  ('Peripherals', 'peripherals', 'Keyboards, mice, monitors, and other accessories'),
  ('Software', 'software', 'Software licenses and subscriptions'),
  ('Other', 'other', 'Other IT equipment and accessories')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. CREATE PRODUCT CODE SEQUENCE
-- ============================================
CREATE SEQUENCE IF NOT EXISTS product_code_seq START 1;

-- ============================================
-- 3. CREATE CATALOG_PRODUCTS TABLE (Global Product Catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  specifications JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for catalog_products
CREATE INDEX IF NOT EXISTS idx_catalog_products_product_code ON catalog_products(product_code);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category_id ON catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog_products(status);
CREATE INDEX IF NOT EXISTS idx_catalog_products_name ON catalog_products(name);

-- ============================================
-- 4. CREATE CUSTOMER_USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  mobile_number VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer_admin', 'customer_agent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, username)
);

CREATE INDEX IF NOT EXISTS idx_customer_users_customer ON customer_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_role ON customer_users(role);

-- ============================================
-- 5. CREATE CUSTOMER_PRODUCT_ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_product_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID,
  notes TEXT,
  UNIQUE(product_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_product_assignments_customer ON customer_product_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_assignments_product ON customer_product_assignments(product_id);

-- ============================================
-- 6. ADD TICKET COLUMNS FOR APPROVAL WORKFLOW
-- ============================================
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS created_by_customer_user UUID REFERENCES customer_users(id) ON DELETE SET NULL;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES customer_users(id) ON DELETE SET NULL;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS approval_notes TEXT;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_created_by_customer_user ON tickets(created_by_customer_user);
CREATE INDEX IF NOT EXISTS idx_tickets_approved_by ON tickets(approved_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_agent_id ON tickets(assigned_agent_id);

-- ============================================
-- 7. CREATE SMS_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'fast2sms',
  provider_response JSONB,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);

-- ============================================
-- 8. CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('team', 'customer', 'customer_user')),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

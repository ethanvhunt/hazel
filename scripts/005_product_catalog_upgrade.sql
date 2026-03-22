-- Migration: Product Catalog Upgrade with Global Products, Customer Users, and Ticket Approval Flow
-- Run this script to add all new tables and columns

-- 1. Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories
INSERT INTO product_categories (name, description, is_custom) VALUES
  ('Computer', 'Desktop computers, laptops, and workstations', false),
  ('Printer', 'Printers, scanners, and multifunction devices', false),
  ('Network Hardware', 'Routers, switches, access points, and modems', false),
  ('Monitor', 'Display screens and monitors', false),
  ('Keyboard', 'Wired and wireless keyboards', false),
  ('Mouse', 'Wired and wireless mice and pointing devices', false),
  ('CPU', 'Central processing units and processors', false),
  ('Server', 'Server hardware and blade servers', false),
  ('Router', 'Network routers', false),
  ('Switch', 'Network switches', false),
  ('Storage', 'Hard drives, SSDs, NAS, and storage devices', false),
  ('UPS', 'Uninterruptible power supplies and battery backups', false),
  ('Cable', 'Network cables, power cables, and accessories', false),
  ('Software', 'Software licenses and subscriptions', false),
  ('Other', 'Other IT equipment and accessories', false)
ON CONFLICT (name) DO NOTHING;

-- 2. Create sequence for product IDs
CREATE SEQUENCE IF NOT EXISTS product_id_seq START 1;

-- 3. Update Products Table for Global Catalog
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_id VARCHAR(20) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Make customer_id nullable for global products
ALTER TABLE products ALTER COLUMN customer_id DROP NOT NULL;

-- 4. Customer Product Assignments Table
CREATE TABLE IF NOT EXISTS customer_product_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(customer_id, product_id)
);

-- 5. Customer Users Table (Customer Admin/Agent)
CREATE TABLE IF NOT EXISTS customer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer_admin', 'customer_agent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, email)
);

-- 6. Add Mobile to Users Table (Team users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

-- 7. Ticket Approval Flow columns
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) 
  DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by_customer_user_id UUID REFERENCES customer_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES customer_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 8. SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_mobile VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  response_data JSONB,
  error_message TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_assignments_customer_id ON customer_product_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_assignments_product_id ON customer_product_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_email ON customer_users(email);
CREATE INDEX IF NOT EXISTS idx_tickets_approval_status ON tickets(approval_status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_performed_by ON activity_logs(performed_by);

-- 10. Function to generate product ID
CREATE OR REPLACE FUNCTION generate_product_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_id VARCHAR(20);
BEGIN
  new_id := 'PRD-' || LPAD(nextval('product_id_seq')::TEXT, 6, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger to auto-generate product_id on insert
CREATE OR REPLACE FUNCTION set_product_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NULL THEN
    NEW.product_id := generate_product_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_product_id ON products;
CREATE TRIGGER trigger_set_product_id
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_id();

-- 12. Update existing products to have product_id if they don't have one
UPDATE products 
SET product_id = generate_product_id() 
WHERE product_id IS NULL;

-- Create product requests table for customers to request products/services
CREATE TABLE IF NOT EXISTS product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for efficient querying
CREATE INDEX idx_product_requests_customer_id ON product_requests(customer_id);
CREATE INDEX idx_product_requests_status ON product_requests(status);
CREATE INDEX idx_product_requests_created_at ON product_requests(created_at);

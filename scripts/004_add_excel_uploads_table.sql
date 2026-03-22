-- Create excel_uploads table for storing customer Excel files
CREATE TABLE IF NOT EXISTS excel_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('xlsx', 'xls', 'csv')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_excel_uploads_customer_id ON excel_uploads(customer_id);
CREATE INDEX idx_excel_uploads_uploaded_by ON excel_uploads(uploaded_by);
CREATE INDEX idx_excel_uploads_created_at ON excel_uploads(created_at);

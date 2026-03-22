-- Create table to store Excel data
CREATE TABLE IF NOT EXISTS excel_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  excel_upload_id UUID NOT NULL REFERENCES excel_uploads(id) ON DELETE CASCADE,
  sheet_name VARCHAR(255) NOT NULL,
  row_index INTEGER NOT NULL,
  row_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_excel_data_upload_id ON excel_data(excel_upload_id);
CREATE INDEX IF NOT EXISTS idx_excel_data_sheet_name ON excel_data(excel_upload_id, sheet_name);

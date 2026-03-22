-- Add gmail_address column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_address VARCHAR(255);

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent'
);

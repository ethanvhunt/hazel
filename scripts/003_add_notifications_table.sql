-- Fix foreign key constraint by using UUID instead of INTEGER for user_id
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL DEFAULT 'team' CHECK (user_type IN ('team', 'customer')),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ticket_created', 'ticket_updated', 'message_received', 'assignment_changed')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('ticket', 'message', 'assignment')),
  entity_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

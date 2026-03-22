# Hazelnutcyborg CRM Platform

*A comprehensive IT support management system built with Next.js, Neon PostgreSQL, and Vercel Blob*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Email Setup](#email-setup)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Hazelnutcyborg CRM Platform is a full-featured customer relationship management system designed for IT support teams. It enables agents, managers, and administrators to manage customer tickets, communicate with customers, upload and view Excel files, and track all activities with an integrated notification system.

## ✨ Features

### Team Features
- **Dashboard**: Overview of customers, tickets, and recent activities
- **Ticket Management**: Create, track, and resolve customer support tickets
- **Customer Management**: Add, edit, and manage customer information
- **User Management**: Create and manage team members with role-based access
- **Excel Upload & Viewer**: Upload Excel files and view data in formatted tables
- **Email Notifications**: Automatic email alerts for new tickets and customer replies
- **Activity Logs**: Track all team member actions for security and auditing
- **Product Requests**: Manage customer product requests and inquiries
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Customer Features
- **Dashboard**: View personal tickets and recent activities
- **Ticket Creation**: Submit new support requests with detailed descriptions
- **Ticket Tracking**: Monitor ticket status and view communication history
- **Product Viewing**: Browse available products and services
- **Excel File Access**: View uploaded Excel files in table format
- **Profile Management**: Update personal information and password

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** with App Router and React 19
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **shadcn/ui** for UI components
- **Recharts** for data visualization
- **React Hook Form** for form handling

### Backend
- **Node.js** serverless functions
- **Neon PostgreSQL** for database
- **Vercel Blob** for file storage
- **Nodemailer** for email notifications
- **bcryptjs** for password encryption

### Infrastructure
- **Vercel** for deployment
- **Neon** for PostgreSQL database
- **Vercel Blob** for file storage
- **Gmail SMTP** for email notifications

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- A Neon PostgreSQL database
- Vercel account for deployment
- Gmail account with App Password enabled

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crm-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see Configuration section)

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Team Login: [http://localhost:3000/team/login](http://localhost:3000/team/login)
   - Customer Login: [http://localhost:3000/customer/login](http://localhost:3000/customer/login)

## ⚙️ Configuration

### Required Environment Variables

Add these to your `.env.local` file (locally) or Vercel project settings:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database
POSTGRES_URL=postgresql://user:password@host/database

# Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password_16_chars
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://your-domain.com

# Analytics (Optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### Gmail Setup for Email Notifications

1. Enable 2-Factor Authentication on your Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for Mail
4. Copy the 16-character password to `GMAIL_APP_PASSWORD`
5. Update your profile with your Gmail address in the platform

## 📖 Usage Guide

### For Team Members

#### 1. Login
- Navigate to [https://your-domain.com/team/login](https://your-domain.com/team/login)
- Enter email and password
- You'll be redirected to the dashboard

#### 2. Dashboard
- View key metrics: total customers, open tickets
- See recent activities
- Quick access to main features

#### 3. Managing Tickets
- Go to **Tickets** → View all support tickets
- **Create Ticket**: Click "Create" to create new ticket
- **View Details**: Click ticket to see full details and chat history
- **Respond**: Type message and click Send to reply to customer
- **Update Status**: Change ticket status (Open, In Progress, Closed)
- **Assign**: Assign ticket to other team members

#### 4. Managing Customers
- Go to **Customers** → View all customers
- **Create**: Click "Create Customer" to add new customer
- **Edit**: Click customer to view details and edit information
- **Upload Excel**: Add Excel files to customer record
- **View Activities**: See customer's ticket history

#### 5. Excel File Management
- Open customer profile
- Scroll to "Excel Uploads" section
- **Upload**: Click "Upload File" and select Excel file (.xlsx, .xls, .csv)
- **View**: Click "View" to open file in table format with multi-sheet support
- **Download**: Access uploaded files from customer detail page

#### 6. Email Notifications
- Go to **Profile**
- Enter your Gmail address
- Save changes
- You'll automatically receive emails for:
  - New tickets assigned to you
  - Customer replies on your tickets

#### 7. User Management
- Go to **Users** → View all team members
- **Create**: Click "Create User" to add new team member
- **Edit**: Update user details and role
- **Delete**: Remove team members

#### 8. Activity Logs
- Go to **Activity Logs** to see all team member actions
- Filter by user or action type
- Track who made changes and when

### For Customers

#### 1. Login
- Navigate to [https://your-domain.com/customer/login](https://your-domain.com/customer/login)
- Enter email and password or register for new account

#### 2. Dashboard
- View your submitted tickets
- See ticket statuses at a glance
- Quick access to create new tickets

#### 3. Creating Support Tickets
- Go to **Tickets** → Click "Create Ticket"
- **Product**: Select product category
- **Subject**: Enter ticket title
- **Description**: Provide detailed description
- **Files**: Optionally attach files
- **Submit**: Click to create ticket

#### 4. Tracking Tickets
- Go to **Tickets** to see all your tickets
- Click ticket to view full details
- See all messages from support team
- **Reply**: Type your response and send
- **Status**: See current ticket status

#### 5. Viewing Products
- Go to **Products** to browse available products
- Click product for more details

#### 6. Profile Management
- Go to **Profile**
- Update contact information
- Change password
- Save changes

#### 7. Viewing Excel Files
- Go to **Products** or customer area
- Click "View" on uploaded Excel files
- Browse data in formatted table
- Switch between sheets using tabs

## 🗄️ Database Schema

### Key Tables

**users** - Team members
- id, email, password_hash, first_name, last_name, role, gmail_address, created_at

**customers** - Customer accounts
- id, email, password_hash, first_name, last_name, company, created_at

**tickets** - Support tickets
- id, customer_id, subject, description, status, priority, assigned_to, created_at, updated_at

**messages** - Ticket communications
- id, ticket_id, sender_id, sender_type, message, created_at

**excel_uploads** - Uploaded Excel files
- id, customer_id, file_name, file_url, file_size, created_at

**excel_data** - Parsed Excel file data
- id, excel_upload_id, sheet_name, row_index, row_data

**activity_logs** - Team member actions
- id, performed_by, action, target_type, target_id, details, created_at

**email_logs** - Email tracking
- id, recipient, subject, status, sent_at

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/team/login` - Team login
- `POST /api/auth/team/register` - Team registration
- `POST /api/auth/customer/login` - Customer login
- `POST /api/auth/customer/register` - Customer registration
- `POST /api/auth/logout` - Logout

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PUT /api/tickets/[id]` - Update ticket

### Messages
- `GET /api/messages?ticketId=` - Get ticket messages
- `POST /api/messages` - Send message

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers/create` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer

### Excel
- `POST /api/excel-uploads` - Upload Excel file
- `GET /api/excel-uploads` - Get uploaded files
- `GET /api/excel-uploads/[id]/data` - Get Excel data
- `DELETE /api/excel-uploads/[id]` - Delete file

### User Management
- `GET /api/user-management` - Get all users
- `POST /api/user-management/create` - Create user
- `PUT /api/user-management/[id]` - Update user
- `DELETE /api/user-management/[id]` - Delete user

### Profile
- `GET /api/profile/team` - Get team profile
- `PUT /api/profile/team` - Update team profile

### Activity Logs
- `GET /api/activity-logs` - Get activity logs

## 📧 Email Setup

### Configuration
1. Ensure Gmail account has 2FA enabled
2. Generate App Password from Google Account settings
3. Add credentials to environment variables:
   - `GMAIL_USER` - Your Gmail address
   - `GMAIL_APP_PASSWORD` - 16-character app password
   - `NEXT_PUBLIC_APP_URL` - Your application URL

### Email Triggers
- **New Ticket**: Sent to assigned agent when ticket is created
- **Customer Reply**: Sent to agent when customer sends message
- **Ticket Update**: Sent to customer when ticket status changes (optional)

### Email Templates
- Ticket creation notification with all details
- Customer message notification with message preview
- Professional HTML formatting with company branding

## 🔒 Security Features

- **Password Encryption**: bcryptjs with salt rounds
- **Session Management**: Secure HTTP-only cookies
- **Activity Tracking**: All team member actions logged
- **Role-Based Access**: Different permissions for agents, managers, admins
- **SQL Injection Prevention**: Parameterized queries throughout

## 🐛 Troubleshooting

### Email Notifications Not Working

**Issue**: Not receiving email notifications for tickets

**Solutions**:
1. Verify Gmail address is entered in Profile
2. Check Gmail App Password is correct (16 characters)
3. Ensure 2FA is enabled on Gmail account
4. Check spam folder for emails
5. Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` in environment variables
6. Check email_logs table for failures

### Excel File Upload Fails

**Issue**: "Error uploading Excel file"

**Solutions**:
1. Ensure file is in .xlsx, .xls, or .csv format
2. Check file size is under 50MB
3. Verify Vercel Blob integration is connected
4. Check `BLOB_READ_WRITE_TOKEN` in environment variables
5. Ensure file has proper Excel format with data

### Ticket Creation Error

**Issue**: "Error creating ticket"

**Solutions**:
1. Ensure you're logged in with valid session
2. Check all required fields are filled
3. Verify customer exists
4. Check database connection and migrations are complete

### Sidebar Provider Error

**Issue**: "useSidebar must be used within a SidebarProvider"

**Solutions**:
1. This is a React context error - page refresh usually fixes it
2. Check that all pages use SidebarProvider wrapper
3. Clear browser cache and cookies
4. Try incognito/private browsing mode

### Database Connection Issues

**Issue**: "NeonDbError" or connection timeouts

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check Neon project is active
3. Ensure network access is allowed
4. Verify credentials in environment variables
5. Check if database exists and migrations ran

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the docs page at `/docs`
3. Check console logs for detailed error messages
4. Contact your system administrator

## 📄 License

This project is built with v0.app and deployed on Vercel.

---

**Last Updated**: January 2026

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const

export const CUSTOMER_ROLES = {
  CUSTOMER_ADMIN: "customer_admin",
  CUSTOMER_AGENT: "customer_agent",
} as const

export const TICKET_STATUS = {
  PENDING_APPROVAL: "pending_approval",
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
  REJECTED: "rejected",
} as const

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const PRODUCT_CATEGORIES = {
  COMPUTER: "computer",
  PRINTER: "printer",
  NETWORK_HARDWARE: "network_hardware",
  ACCESSORIES: "accessories",
  SOFTWARE: "software",
  OTHER: "other",
} as const

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  computer: "Computer",
  printer: "Printer",
  network_hardware: "Network Hardware",
  accessories: "Accessories",
  software: "Software",
  other: "Other",
}

export const TICKET_STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pending Approval",
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Rejected",
}

export type Role = (typeof ROLES)[keyof typeof ROLES]
export type CustomerRole = (typeof CUSTOMER_ROLES)[keyof typeof CUSTOMER_ROLES]
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS]
export type Priority = (typeof PRIORITY_LEVELS)[keyof typeof PRIORITY_LEVELS]
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[keyof typeof PRODUCT_CATEGORIES]

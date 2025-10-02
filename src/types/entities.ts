
// Common fields that most entities will have
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User entity for authentication and role management
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'client';
  clientId?: string; // Optional link to client entity (for client users)
  lastLogin?: string;
  isActive: boolean;
  password?: string; // Added password field
}

export interface Client extends BaseEntity {
  name: string;
  email: string;
  address: string;
  workType: string;
  status: "active" | "inactive";
}

export interface Equipment extends BaseEntity {
  clientId: string;
  name: string;
  type: string;
  model: string;
  serialNumber?: string;
  status: "operational" | "needs_service" | "decommissioned";
  notes?: string;
}

export interface Material extends BaseEntity {
  type: string;
  model: string;
  description: string;
  purchaseSites: string;
  purchasePrice: number;
  sellingPrice: number;
  returnValue: number;
  status: "available" | "unavailable";
  stock?: number;
}

export interface Technician extends BaseEntity {
  name: string;
  specialty: string;
  status: "active" | "inactive";
}

export interface Expense extends BaseEntity {
  description: string;
  category: string;
  value: number;
  dueDate: string;
  isPaid: boolean;
  notes?: string;
}

export interface Appointment extends BaseEntity {
    title: string;
    /** Date of the appointment (ISO 8601 format "YYYY-MM-DD" recommended) */
    date: string;
    /** Start time of the appointment (format "HH:MM" recommended, e.g., "09:00", "14:30") */
    startTime: string;
    /** End time of the appointment (format "HH:MM" recommended, optional) */
    endTime?: string; // Changed from string to string? to make it optional
    description?: string;
    clientId?: string;
    serviceId?: string;
    type: "service" | "meeting" | "personal" | "other"; // Keep as string for flexibility or use an enum
    status: "scheduled" | "completed" | "cancelled" ;
    notes?: string;
}

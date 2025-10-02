
// ABOUTME: Type definitions for technician time tracking system
// ABOUTME: Defines interfaces for work time logging per technician per service

interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianWorkLog extends BaseEntity {
  serviceId: string;
  technicianId: string;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime, optional for ongoing work
  description?: string;
  totalMinutes?: number; // Calculated field
}

export interface ServiceTimeTracking {
  serviceId: string;
  totalMinutes: number;
  technicianLogs: TechnicianWorkLog[];
}

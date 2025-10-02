
import { Client, Material,Equipment,Technician } from './entities';

// Common fields that most entities will have
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Re-export entities from entities.ts for convenience
export type { Client, Equipment, Material, Technician } from './entities';

// Flattened ServiceMaterial - no nested material object
export interface ServiceMaterial extends BaseEntity {
  serviceId: string;
  materialId: string;
  quantity: number;
  priceSnapshot: number; // Price at the time of service
}

// Flattened ServiceTechnician - no nested technician object
export interface ServiceTechnician extends BaseEntity {
  serviceId: string;
  technicianId: string;
}

export type PaymentStatus = "paid" | "unpaid" | "pending" | "partial";
export type ServiceStatus = "completed" | "inProgress" | "pending" | "cancelled";
export type InstallmentStatus = "pending" | "paid" | "canceled";
export type ServiceVisitType = "novo" | "retorno";
export type PaymentMethod = "cash" | "credit" | "debit" | "transfer" | "other";

export interface Payment extends BaseEntity {
  serviceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Updated Installment interface with new structure
export interface Installment extends BaseEntity {
  serviceId: string;
  parcelNumber: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  paidDate?: string;
}

export interface InstallmentPlanData {
    id?: string;
    numberOfInstallments: number;
    firstDueDate: string;
    installments: Array<{
        amount: number;
        dueDate: string;
        status: 'pending' | 'paid' | 'canceled';
        createdAt?: string;
        updatedAt?: string;
    }>;
}

// Flattened Service - no nested objects, only IDs
export interface Service extends BaseEntity {
  name: string;
  description?: string;
  clientId: string;
  equipmentId?: string;
  date: string;
  servicePrice: number;
  pickupDeliveryPrice: number;
  serviceStatus: ServiceStatus;
  paymentStatus: PaymentStatus;
  visitType: ServiceVisitType;
  warrantyPeriod?: number;
  serviceTypes?: string[];
  isInstallmentPayment?: boolean;
  totalValue: number;
  roi: number;
  installmentsId?: string[];  // Array of Installment IDs
  serviceNumber?: string;     // Auto-generated service number
  notes?: string; // used for additional information report
}

export interface ServiceWithClientName extends Service {
  clientName: string;
}

// Flattened OrderMaterial - no nested material object
export interface OrderMaterial extends BaseEntity {
    orderId: string;
    materialId: string;
    quantity: number;
    priceSnapshot: number; // Price at the time of order
}

// Flattened Order - no nested objects, only IDs
export interface Order extends BaseEntity {
  orderCode: string;
  store: string;
  estimatedDeliveryTime: string;
  relatedServiceId?: string;
  status: "delivered" | "inRoute" | "paid";
  notes?: string;
}

// Extended types with relationships
export type ServiceMaterialWithDetails = ServiceMaterial & {
  material?: Material;
};

export type ServiceWithDetails = Service & {
  client?: Client;
  equipment?: Equipment;
  materials?: ServiceMaterialWithDetails[];
  technicians?: Technician[];
  installments?: Installment[];
};

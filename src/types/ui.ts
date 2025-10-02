
import type { Service, Order, Client, Equipment, Technician, Material, ServiceTechnician, ServiceMaterial, Payment, Installment, OrderMaterial } from './relationships';

// Adding or extending the ServiceTypeOption interface if it doesn't already exist
export interface ServiceTypeOption {
  name: string;
  price: number;
}

// UI-only types for components that need populated data
export interface ServiceWithRelations extends Service {
  client?: Client;
  equipment?: Equipment;
  technicians?: (ServiceTechnician & { technician: Technician })[];
  materials?: (ServiceMaterial & { material: Material })[];
  payments?: Payment[];
  installments?: Installment[];
}

export interface OrderWithRelations extends Order {
  relatedService?: Service;
  materials: (OrderMaterial & { material: Material })[];
}


// Data Access Layer - Helper functions to resolve relationships by ID
import type {
  Client,
  Material,
  Technician,
  Equipment,
  Service,
  ServiceTechnician,
  ServiceMaterial,
  ServiceWithClientName,
  Order,
  OrderMaterial,
  Payment,
  Installment,
  Appointment,
  ServiceWithRelations,
  OrderWithRelations,
  ServiceTypeOption
} from '@/types';

import {
  getClients,
  getMaterials,
  getTechnicians,
  getEquipments,
  getServices,
  getServiceTechnicians,
  getServiceMaterials,
  getOrders,
  getOrderMaterials,
  getPayments,
  getInstallments,
  getAppointments,
  getServiceTypes
} from './storageManager';

// Basic entity retrieval by ID
export const getClientById = (id: string): Client | undefined => {
  return getClients().find(client => client.id === id);
};

export const getMaterialById = (id: string): Material | undefined => {
  return getMaterials().find(material => material.id === id);
};

export const getTechnicianById = (id: string): Technician | undefined => {
  return getTechnicians().find(technician => technician.id === id);
};

export const getEquipmentById = (id: string): Equipment | undefined => {
  return getEquipments().find(equipment => equipment.id === id);
};

export const getServiceById = (id: string): Service | undefined => {
  return getServices().find(service => service.id === id);
};

export const getOrderById = (id: string): Order | undefined => {
  return getOrders().find(order => order.id === id);
};

// Relationship retrieval functions
export const getServicesByClientId = (clientId: string): Service[] => {
  return getServices().filter(service => service.clientId === clientId);
};

export const getEquipmentsByClientId = (clientId: string): Equipment[] => {
  return getEquipments().filter(equipment => equipment.clientId === clientId);
};

export const getServiceTechniciansByServiceId = (serviceId: string): ServiceTechnician[] => {
  return getServiceTechnicians().filter(st => st.serviceId === serviceId);
};

export const getServiceMaterialsByServiceId = (serviceId: string): ServiceMaterial[] => {
  return getServiceMaterials().filter(sm => sm.serviceId === serviceId);
};

export const getOrderMaterialsByOrderId = (orderId: string): OrderMaterial[] => {
  return getOrderMaterials().filter(om => om.orderId === orderId);
};

export const getPaymentsByServiceId = (serviceId: string): Payment[] => {
  return getPayments().filter(payment => payment.serviceId === serviceId);
};

export const getInstallmentsByServiceId = (serviceId: string): Installment[] => {
  return getInstallments().filter(installment => installment.serviceId === serviceId);
};

export const getAppointmentsByClientId = (clientId: string): Appointment[] => {
  return getAppointments().filter(appointment => appointment.clientId === clientId);
};

export const getAppointmentsByServiceId = (serviceId: string): Appointment[] => {
  return getAppointments().filter(appointment => appointment.serviceId === serviceId);
};

export const getOrdersByServiceId = (serviceId: string): Order[] => {
  return getOrders().filter(order => order.relatedServiceId === serviceId);
};

// Service calculation helper - moved from AppContext
export const calculateServiceTotalAndROI = (service: Omit<Service, 'roi' | 'totalValue' | 'createdAt' | 'updatedAt'>) => {
  // Get service types prices
  const serviceTypeOptions = getServiceTypes();
  const serviceTypesPrice = (service.serviceTypes || []).reduce((acc, typeName) => {
      const typeOption = serviceTypeOptions.find(option => option.name === typeName);
      return acc + (typeOption?.price || 0);
  }, 0);

  // Calculate materials cost from service materials
  const serviceMaterials = getServiceMaterialsByServiceId(service.id || '');
  const materialsCost = serviceMaterials.reduce((acc, sm) => {
      const material = getMaterialById(sm.materialId);
      return acc + (material ? material.purchasePrice * sm.quantity : 0);
  }, 0);

  // Calculate materials selling price
  const materialsSellPrice = serviceMaterials.reduce((acc, sm) => {
      const material = getMaterialById(sm.materialId);
      return acc + (material ? material.sellingPrice * sm.quantity : 0);
  }, 0);

  // Total value = Service types price + Service price + Pickup/delivery + Materials selling price
  const totalValue = serviceTypesPrice + service.servicePrice + service.pickupDeliveryPrice + materialsSellPrice;

  // ROI = Total value - Materials cost
  const roi = totalValue - materialsCost;

  return { totalValue, roi, materialsCost };
};

// Enhanced retrieval with populated relationships
export const getServiceWithRelations = (serviceId: string): ServiceWithRelations | undefined => {
  const service = getServiceById(serviceId);
  if (!service) return undefined;

  const client = getClientById(service.clientId);
  const equipment = service.equipmentId ? getEquipmentById(service.equipmentId) : undefined;
  
  const serviceTechnicians = getServiceTechniciansByServiceId(serviceId).map(st => {
    const technician = getTechnicianById(st.technicianId);
    return { ...st, technician: technician! };
  }).filter(st => st.technician);

  const serviceMaterials = getServiceMaterialsByServiceId(serviceId).map(sm => {
    const material = getMaterialById(sm.materialId);
    return { ...sm, material: material! };
  }).filter(sm => sm.material);

  const payments = getPaymentsByServiceId(serviceId);
  const installments = getInstallmentsByServiceId(serviceId);

  return {
    ...service,
    client,
    equipment,
    technicians: serviceTechnicians,
    materials: serviceMaterials,
    payments,
    installments
  };
};

export const getOrderWithRelations = (orderId: string): OrderWithRelations | undefined => {
  const order = getOrderById(orderId);
  if (!order) return undefined;

  const relatedService = order.relatedServiceId ? getServiceById(order.relatedServiceId) : undefined;
  
  const orderMaterials = getOrderMaterialsByOrderId(orderId).map(om => {
    const material = getMaterialById(om.materialId);
    return { ...om, material: material! };
  }).filter(om => om.material);

  return {
    ...order,
    relatedService,
    materials: orderMaterials
  };
};

// Helper functions for UI components
export const getServicesWithRelations = (): ServiceWithRelations[] => {
  return getServices().map(service => getServiceWithRelations(service.id)!).filter(Boolean);
};

export const getOrdersWithRelations = (): OrderWithRelations[] => {
  return getOrders().map(order => getOrderWithRelations(order.id)!).filter(Boolean);
};

// Search and filter helpers
export const searchServices = (query: string): Service[] => {
  const services = getServices();
  const lowerQuery = query.toLowerCase();
  
  return services.filter(service => {
    const client = getClientById(service.clientId);
    const equipment = service.equipmentId ? getEquipmentById(service.equipmentId) : null;
    
    return (
      service.name.toLowerCase().includes(lowerQuery) ||
      service.description.toLowerCase().includes(lowerQuery) ||
      client?.name.toLowerCase().includes(lowerQuery) ||
      equipment?.name.toLowerCase().includes(lowerQuery)
    );
  });
};

export const searchOrders = (query: string): Order[] => {
  const orders = getOrders();
  const lowerQuery = query.toLowerCase();
  
  return orders.filter(order => {
    const relatedService = order.relatedServiceId ? getServiceById(order.relatedServiceId) : null;
    
    return (
      order.orderCode.toLowerCase().includes(lowerQuery) ||
      order.store.toLowerCase().includes(lowerQuery) ||
      relatedService?.name.toLowerCase().includes(lowerQuery)
    );
  });
};

// Data validation helpers
export const validateServiceRelations = (service: Partial<Service>): string[] => {
  const errors: string[] = [];
  
  if (service.clientId && !getClientById(service.clientId)) {
    errors.push('Cliente não encontrado');
  }
  
  if (service.equipmentId && !getEquipmentById(service.equipmentId)) {
    errors.push('Equipamento não encontrado');
  }
  
  return errors;
};

export const validateOrderRelations = (order: Partial<Order>): string[] => {
  const errors: string[] = [];
  
  if (order.relatedServiceId && !getServiceById(order.relatedServiceId)) {
    errors.push('Serviço relacionado não encontrado');
  }
  
  return errors;
};

/**
 * Alternative version that accepts clients array as parameter
 * (useful when you already have clients loaded)
 */
export function getServicesWithClientNames(services: Service[]): Array<Service & { clientName: string }> {
  const clients = getClients();
  
  return services.map(service => {
    let displayValue = service.totalValue;
    
    if (service.paymentStatus === 'partial') {
      // Calculate remaining balance for partial payments
      const payments = getPaymentsByServiceId(service.id);
      const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      displayValue = service.totalValue - paidAmount;
    }
    
    return {
      ...service,
      clientName: clients.find(c => c.id === service.clientId)?.name || 'Unknown Client',
      // Add the calculated display value
      displayValue
    };
  });
}

export function getClientForService(service: Service, clients: Client[]): Client | undefined {
  return clients.find(c => c.id === service.clientId);
}

export function getEquipmentForService(service: Service, equipments: Equipment[]): Equipment | undefined {
  return service.equipmentId ? equipments.find(e => e.id === service.equipmentId) : undefined;
}

export function getTechniciansForService(service: Service, serviceTechnicians: ServiceTechnician[], technicians: Technician[]): Technician[] {
  const serviceTechs = serviceTechnicians.filter(st => st.serviceId === service.id);
  return serviceTechs.map(st => technicians.find(t => t.id === st.technicianId)).filter(Boolean) as Technician[];
}


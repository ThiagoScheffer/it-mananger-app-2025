
// Data Migration Utility - Convert nested data to normalized structure
import { v4 as uuidv4 } from 'uuid';
import {
  getMetaData,
  saveMetaData,
  loadInitialData,
  saveUsers,
  saveClients,
  saveMaterials,
  saveTechnicians,
  saveServices,
  saveServiceTechnicians,
  saveServiceMaterials,
  saveOrders,
  saveOrderMaterials,
  saveExpenses,
  savePayments,
  saveInstallments,
  saveEquipments,
  saveAppointments,
  saveFinancialData,
  saveServiceTypes
} from './storageManager';

import type {
  Service,
  ServiceTechnician,
  ServiceMaterial,
  Order,
  OrderMaterial
} from '@/types';

// Check if migration is needed
export const needsMigration = (): boolean => {
  const metaData = getMetaData();
  return !metaData || metaData.format !== 'normalized';
};

// Main migration function
export const migrateToNormalizedStructure = (): boolean => {
  try {
    console.log('Starting data normalization migration...');
    
    const data = loadInitialData();
    
    // Migrate services - extract nested objects
    const migratedServices: Service[] = [];
    const migratedServiceTechnicians: ServiceTechnician[] = [];
    const migratedServiceMaterials: ServiceMaterial[] = [];
    
    data.services.forEach((service: any) => {
      // Clean service object - remove nested data
      const cleanService: Service = {
        id: service.id,
        name: service.name,
        date: service.date,
        clientId: service.clientId,
        equipmentId: service.equipmentId,
        paymentStatus: service.paymentStatus,
        serviceStatus: service.serviceStatus,
        description: service.description,
        serviceTypes: service.serviceTypes || [],
        servicePrice: service.servicePrice || 0,
        pickupDeliveryPrice: service.pickupDeliveryPrice || 0,
        totalValue: service.totalValue || 0,
        roi: service.roi || 0,
        visitType: service.visitType || 'novo',
        warrantyPeriod: service.warrantyPeriod,
        createdAt: service.createdAt || new Date().toISOString(),
        updatedAt: service.updatedAt || new Date().toISOString()
      };
      migratedServices.push(cleanService);
      
      // Extract technicians if nested
      if (service.technicians && Array.isArray(service.technicians)) {
        service.technicians.forEach((techAssignment: any) => {
          const serviceTechnician: ServiceTechnician = {
            id: techAssignment.id || uuidv4(),
            serviceId: service.id,
            technicianId: techAssignment.technicianId || techAssignment.technician?.id,
            createdAt: techAssignment.createdAt || new Date().toISOString(),
            updatedAt: techAssignment.updatedAt || new Date().toISOString()
          };
          if (serviceTechnician.technicianId) {
            migratedServiceTechnicians.push(serviceTechnician);
          }
        });
      }
      
      // Extract materials if nested
      if (service.materials && Array.isArray(service.materials)) {
        service.materials.forEach((materialAssignment: any) => {
          const serviceMaterial: ServiceMaterial = {
            id: materialAssignment.id || uuidv4(),
            serviceId: service.id,
            materialId: materialAssignment.materialId || materialAssignment.material?.id,
            quantity: materialAssignment.quantity || 1,
            priceSnapshot: materialAssignment.priceSnapshot || materialAssignment.material?.sellingPrice || 0,
            createdAt: materialAssignment.createdAt || new Date().toISOString(),
            updatedAt: materialAssignment.updatedAt || new Date().toISOString()
          };
          if (serviceMaterial.materialId) {
            migratedServiceMaterials.push(serviceMaterial);
          }
        });
      }
    });
    
    // Migrate orders - extract nested materials
    const migratedOrders: Order[] = [];
    const migratedOrderMaterials: OrderMaterial[] = [];
    
    data.orders.forEach((order: any) => {
      // Clean order object - remove nested data
      const cleanOrder: Order = {
        id: order.id,
        orderCode: order.orderCode,
        store: order.store,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        relatedServiceId: order.relatedServiceId,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString()
      };
      migratedOrders.push(cleanOrder);
      
      // Extract materials if nested
      if (order.materials && Array.isArray(order.materials)) {
        order.materials.forEach((materialAssignment: any) => {
          const orderMaterial: OrderMaterial = {
            id: uuidv4(),
            orderId: order.id,
            materialId: materialAssignment.material?.id || materialAssignment.materialId,
            quantity: materialAssignment.quantity || 1,
            priceSnapshot: materialAssignment.priceSnapshot || materialAssignment.material?.purchasePrice || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          if (orderMaterial.materialId) {
            migratedOrderMaterials.push(orderMaterial);
          }
        });
      }
    });
    
    // Merge existing ServiceTechnicians and ServiceMaterials with migrated ones
    const existingServiceTechnicians = data.serviceTechnicians || [];
    const existingServiceMaterials = data.serviceMaterials || [];
    const existingOrderMaterials = data.orderMaterials || [];
    
    const allServiceTechnicians = [
      ...existingServiceTechnicians,
      ...migratedServiceTechnicians.filter(mst => 
        !existingServiceTechnicians.some(est => est.id === mst.id)
      )
    ];
    
    const allServiceMaterials = [
      ...existingServiceMaterials,
      ...migratedServiceMaterials.filter(msm => 
        !existingServiceMaterials.some(esm => esm.id === msm.id)
      )
    ];
    
    const allOrderMaterials = [
      ...existingOrderMaterials,
      ...migratedOrderMaterials.filter(mom => 
        !existingOrderMaterials.some(eom => eom.id === mom.id)
      )
    ];
    
    // Save all migrated data
    saveUsers(data.users);
    saveClients(data.clients);
    saveMaterials(data.materials);
    saveTechnicians(data.technicians);
    saveServices(migratedServices);
    saveServiceTechnicians(allServiceTechnicians);
    saveServiceMaterials(allServiceMaterials);
    saveOrders(migratedOrders);
    saveOrderMaterials(allOrderMaterials);
    saveExpenses(data.expenses);
    savePayments(data.payments);
    saveEquipments(data.equipments);
    saveAppointments(data.appointments);
    
    if (data.financialData) {
      saveFinancialData(data.financialData);
    }
    
    if (data.customServiceTypes) {
      saveServiceTypes(data.customServiceTypes);
    }
    
    // Mark migration as complete
    saveMetaData({
      format: 'normalized',
      version: '3.0.0',
      exportDate: new Date().toISOString()
    });
    
    console.log('Data normalization migration completed successfully');
    console.log(`Migrated ${migratedServices.length} services`);
    console.log(`Created ${migratedServiceTechnicians.length} service-technician relations`);
    console.log(`Created ${migratedServiceMaterials.length} service-material relations`);
    console.log(`Migrated ${migratedOrders.length} orders`);
    console.log(`Created ${migratedOrderMaterials.length} order-material relations`);
    
    return true;
  } catch (error) {
    console.error('Data migration failed:', error);
    return false;
  }
};

// Validation function to check data integrity after migration
export const validateMigratedData = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const data = loadInitialData();
    
    // Check if all services have valid client references
    data.services.forEach(service => {
      const client = data.clients.find(c => c.id === service.clientId);
      if (!client) {
        errors.push(`Service ${service.id} references non-existent client ${service.clientId}`);
      }
      
      if (service.equipmentId) {
        const equipment = data.equipments.find(e => e.id === service.equipmentId);
        if (!equipment) {
          errors.push(`Service ${service.id} references non-existent equipment ${service.equipmentId}`);
        }
      }
    });
    
    // Check service-technician relations
    data.serviceTechnicians.forEach(st => {
      const service = data.services.find(s => s.id === st.serviceId);
      const technician = data.technicians.find(t => t.id === st.technicianId);
      
      if (!service) {
        errors.push(`ServiceTechnician ${st.id} references non-existent service ${st.serviceId}`);
      }
      if (!technician) {
        errors.push(`ServiceTechnician ${st.id} references non-existent technician ${st.technicianId}`);
      }
    });
    
    // Check service-material relations
    data.serviceMaterials.forEach(sm => {
      const service = data.services.find(s => s.id === sm.serviceId);
      const material = data.materials.find(m => m.id === sm.materialId);
      
      if (!service) {
        errors.push(`ServiceMaterial ${sm.id} references non-existent service ${sm.serviceId}`);
      }
      if (!material) {
        errors.push(`ServiceMaterial ${sm.id} references non-existent material ${sm.materialId}`);
      }
    });
    
    // Check order-material relations
    data.orderMaterials.forEach(om => {
      const order = data.orders.find(o => o.id === om.orderId);
      const material = data.materials.find(m => m.id === om.materialId);
      
      if (!order) {
        errors.push(`OrderMaterial ${om.id} references non-existent order ${om.orderId}`);
      }
      if (!material) {
        errors.push(`OrderMaterial ${om.id} references non-existent material ${om.materialId}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error}`]
    };
  }
};

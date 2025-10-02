
import type { Service, ServiceMaterial, Material, ServiceTechnician, Technician } from '@/types';
import { getMaterialById, getTechnicianById, getServiceMaterialsByServiceId, getServiceTechniciansByServiceId } from './dataHelpers';

// Helper function to calculate service totals including materials
export const calculateServiceWithMaterialTotals = (service: Service): {
  serviceTotal: number;
  materialsCost: number;
  materialsSelling: number;
  totalWithMaterials: number;
} => {
  const serviceMaterials = getServiceMaterialsByServiceId(service.id);
  
  let materialsCost = 0;
  let materialsSelling = 0;

  serviceMaterials.forEach(sm => {
    const material = getMaterialById(sm.materialId);
    if (material) {
      materialsCost += material.purchasePrice * sm.quantity;
      materialsSelling += material.sellingPrice * sm.quantity;
    }
  });

  const serviceTotal = service.servicePrice + service.pickupDeliveryPrice;
  const totalWithMaterials = serviceTotal + materialsSelling;

  return {
    serviceTotal,
    materialsCost,
    materialsSelling,
    totalWithMaterials
  };
};

// Helper function to get service materials with material details
export const getServiceMaterialsWithDetails = (serviceId: string): Array<ServiceMaterial & { material: Material }> => {
  const serviceMaterials = getServiceMaterialsByServiceId(serviceId);
  
  return serviceMaterials.map(sm => {
    const material = getMaterialById(sm.materialId);
    return {
      ...sm,
      materialId: sm.materialId, // Ensure materialId is used correctly
      material: material!
    };
  }).filter(item => item.material);
};

// Helper function to get service technicians with technician details  
export const getServiceTechniciansWithDetails = (serviceId: string): Array<ServiceTechnician & { technician: Technician }> => {
  const serviceTechnicians = getServiceTechniciansByServiceId(serviceId);
  
  return serviceTechnicians.map(st => {
    const technician = getTechnicianById(st.technicianId);
    return {
      ...st,
      technician: technician!
    };
  }).filter(item => item.technician);
};

// Helper function to calculate ROI for a service
export const calculateServiceROI = (service: Service): number => {
  const { totalWithMaterials, materialsCost } = calculateServiceWithMaterialTotals(service);
  return totalWithMaterials - materialsCost;
};

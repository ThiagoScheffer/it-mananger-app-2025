// AppContext.tsx - Refactored to use custom hooks
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import type { ServiceTypeOption } from '@/types';

import { useUsers } from '@/hooks/useUsers';
import { useClients } from '@/hooks/useClients';
import { useMaterials } from '@/hooks/useMaterials';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useFinancials } from '@/hooks/useFinancials';
import { useExpenses } from '@/hooks/useExpenses';
import { InstallmentService } from "@/services/InstallmentService";
import {
    loadInitialData,
    getServices, saveServices,
    getServiceTechnicians, saveServiceTechnicians,
    getServiceMaterials, saveServiceMaterials,
    getOrders, saveOrders,
    getOrderMaterials, saveOrderMaterials,
    getPayments, savePayments,
    getEquipments, saveEquipments,
    getAppointments, saveAppointments,
    getServiceTypes, saveServiceTypesFull,
} from '@/utils/storageManager';

import { createAutomaticBackup } from '@/utils/backupManager';

import {
    getMaterialById,
    getServiceMaterialsByServiceId,
    getServiceTechniciansByServiceId,
    calculateServiceTotalAndROI
} from '@/utils/dataHelpers';

import {
    Service, ServiceTechnician, ServiceMaterial, Order, OrderMaterial,
    Payment, Equipment, Appointment, MonthlyData
} from '@/types';

import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

// --- Service Type Management ---
const defaultServiceTypes: ServiceTypeOption[] = [
    { name: "Formatação Simples", price: 120.00 },
    { name: "Formatação Profissional", price: 250.00 },
    { name: "Limpeza", price: 50.00 },
    { name: "Limpeza avançada", price: 85.00 },
    { name: "Troca de pasta térmica", price: 40.00 },
    { name: "Troca de peças", price: 0.00 },
    { name: "Manutenção", price: 0.00 },
    { name: "Troca de HD/SSD", price: 0.00 },
    { name: "Acesso remoto", price: 90.00 },
    { name: "Instalação de Software", price: 35.00 },
    { name: "Atendimento Local /p Hora", price: 100.00 }
];


// Helper interfaces for new parameters
interface SelectedMaterialData {
    materialId: string;
    quantity: number;
}


interface AppContextType {
    // From hooks
    users: ReturnType<typeof useUsers>['users'];
    clients: ReturnType<typeof useClients>['clients'];
    materials: ReturnType<typeof useMaterials>['materials'];
    technicians: ReturnType<typeof useTechnicians>['technicians'];
    expenses: ReturnType<typeof useExpenses>['expenses'];
    financialData: ReturnType<typeof useFinancials>['financialData'];

    // User operations
    addUser: ReturnType<typeof useUsers>['addUser'];
    updateUser: ReturnType<typeof useUsers>['updateUser'];
    deleteUser: ReturnType<typeof useUsers>['deleteUser'];

    // Client operations
    addClient: ReturnType<typeof useClients>['addClient'];
    updateClient: ReturnType<typeof useClients>['updateClient'];
    deleteClient: ReturnType<typeof useClients>['deleteClient'];

    // Material operations
    addMaterial: ReturnType<typeof useMaterials>['addMaterial'];
    updateMaterial: ReturnType<typeof useMaterials>['updateMaterial'];
    deleteMaterial: ReturnType<typeof useMaterials>['deleteMaterial'];

    // Technician operations
    addTechnician: ReturnType<typeof useTechnicians>['addTechnician'];
    updateTechnician: ReturnType<typeof useTechnicians>['updateTechnician'];
    deleteTechnician: ReturnType<typeof useTechnicians>['deleteTechnician'];

    // Expense operations
    addExpense: ReturnType<typeof useExpenses>['addExpense'];
    updateExpense: ReturnType<typeof useExpenses>['updateExpense'];
    deleteExpense: ReturnType<typeof useExpenses>['deleteExpense'];

    // Financial operations
    updateAccountBalance: ReturnType<typeof useFinancials>['updateAccountBalance'];
    updateFinancialBalance: ReturnType<typeof useFinancials>['updateFinancialBalance'];
    generateMonthlyFinancialData: ReturnType<typeof useFinancials>['generateMonthlyFinancialData'];

    // Remaining state and operations
    services: Service[];
    serviceTechnicians: ServiceTechnician[];
    serviceMaterials: ServiceMaterial[];
    orders: Order[];
    orderMaterials: OrderMaterial[];
    payments: Payment[];
    equipments: Equipment[];
    appointments: Appointment[];

    // Service operations
    addService: (
        serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'roi' | 'totalValue'>,
        selectedMaterials: SelectedMaterialData[],
        selectedTechnicianIds: string[],
    ) => Service;
    updateService: (
        serviceId: string,
        serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'roi' | 'totalValue'>,
        selectedMaterials: SelectedMaterialData[],
        selectedTechnicianIds: string[],
    ) => void;
    deleteService: (id: string) => void;
    getServiceHistory: (id: string, equipment: string) => Service[];
    updateServicePrices: (service: Service, updateMaterialPrices: boolean) => Service;

    // ServiceTechnician operations
    addServiceTechnician: (serviceTech: Omit<ServiceTechnician, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateServiceTechnician: (serviceTech: ServiceTechnician) => void;
    deleteServiceTechnician: (id: string) => void;

    // ServiceMaterial operations
    addServiceMaterial: (serviceMaterial: Omit<ServiceMaterial, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateServiceMaterial: (serviceMaterial: ServiceMaterial) => void;
    deleteServiceMaterial: (id: string) => void;

    // Order operations
    addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateOrder: (order: Order) => void;
    deleteOrder: (id: string) => void;
    addOrderWithMaterials: (
        order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
        materials: { materialId: string; quantity: number }[]
    ) => void;

    updateOrderWithMaterials: (
        order: Order,
        materials: { materialId: string; quantity: number }[]
    ) => void;

    // Payment operations
    addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updatePayment: (payment: Payment) => void;
    deletePayment: (id: string) => void;


    // Equipment operations
    addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateEquipment: (equipment: Equipment) => void;
    deleteEquipment: (id: string) => void;

    // Appointment operations
    addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateAppointment: (appointment: Appointment) => void;
    deleteAppointment: (id: string) => void;

    // Service types
    getTypeOptions: () => ServiceTypeOption[];
    addServiceType: (type: Omit<ServiceTypeOption, 'id'>) => void;
    updateServiceType: (type: ServiceTypeOption) => void;
    deleteServiceType: (name: string) => void;
    getTypePrice: (typeName: string) => number;

    // Financial calculations
    updateFinancialSummary: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    // Use custom hooks
    const userHook = useUsers();
    const clientHook = useClients();
    const materialHook = useMaterials();
    const technicianHook = useTechnicians();
    const expenseHook = useExpenses();
    const financialHook = useFinancials();

    // Remaining state
    const [services, setServices] = useState<Service[]>([]);
    const [serviceTechnicians, setServiceTechnicians] = useState<ServiceTechnician[]>([]);
    const [serviceMaterials, setServiceMaterials] = useState<ServiceMaterial[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderMaterials, setOrderMaterials] = useState<OrderMaterial[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>(getServiceTypes());


    // Load data on mount
    useEffect(() => {
        const data = loadInitialData();

        console.log('Loading initial data... appcontext');

        setServices(data.services);
        setServiceTechnicians(data.serviceTechnicians);
        setServiceMaterials(data.serviceMaterials);
        setOrders(data.orders);
        setOrderMaterials(data.orderMaterials || []);
        setPayments(data.payments);
        setEquipments(data.equipments);
        setAppointments(data.appointments);

        // Load service types
        const loadedServiceTypes = data.customServiceTypes || [];
        const mergedTypes = [...defaultServiceTypes];
        loadedServiceTypes.forEach((typeName: string) => {
            if (!mergedTypes.some(t => t.name === typeName)) {
                const stored = getServiceTypes();
                const foundType = stored.find(t => t.name === typeName);
                if (foundType) {
                    mergedTypes.push(foundType);
                }
            }
        });
        setServiceTypes(mergedTypes);

        // Create automatic backup on load
        createAutomaticBackup();

        // Update financial summary with loaded data
        financialHook.updateFinancialSummary(data.services, expenseHook.expenses);
    }, []);

    // Helper function to calculate material cost from selected materials
    const calculateMaterialsCost = (selectedMaterials: SelectedMaterialData[]): number => {
        return selectedMaterials.reduce((acc, sm) => {
            const material = getMaterialById(sm.materialId);
            return acc + (material ? material.purchasePrice * sm.quantity : 0);
        }, 0);
    };

    // Helper function to calculate service totals
    const calculateServiceFinancials = (
        serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'roi' | 'totalValue'>,
        selectedMaterials: SelectedMaterialData[]
    ) => {

        const serviceTypeOptions = getTypeOptions();
        const serviceTypesPrice = (serviceData.serviceTypes || []).reduce((acc, typeName) => {
            const typeOption = serviceTypeOptions.find(option => option.name === typeName);
            return acc + (typeOption?.price || 0);
        }, 0);
        //console.log('calculateServiceFinancials Types Price:', serviceTypesPrice);
        const materialsCost = calculateMaterialsCost(selectedMaterials);
        const materialsRevenue = selectedMaterials.reduce((acc, sm) => {
            const material = getMaterialById(sm.materialId);
            return acc + (material ? material.sellingPrice * sm.quantity : 0);
        }, 0);

        const totalValue = serviceTypesPrice + serviceData.servicePrice + serviceData.pickupDeliveryPrice + materialsRevenue;
        const totalCost = materialsCost;
        const roi = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;

        return { totalValue, roi, materialsCost };
    };

    // Service operations with financial integration
    const addService = (
        serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'roi' | 'totalValue'>,
        selectedMaterials: SelectedMaterialData[],
        selectedTechnicianIds: string[],
    ): Service => {
        const serviceId = uuidv4();
        const { totalValue, roi, materialsCost } = calculateServiceFinancials(serviceData, selectedMaterials);


        const newService: Service = {
            ...serviceData,
            id: serviceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            roi,
            totalValue,
        };

        const updated = [...services, newService];
        saveServices(updated);
        setServices(updated);

        // Add Materials
        selectedMaterials.forEach(sm => {
            const materialInfo = getMaterialById(sm.materialId);
            if (materialInfo) {
                addServiceMaterial({
                    serviceId: serviceId,
                    materialId: sm.materialId,
                    quantity: sm.quantity,
                    priceSnapshot: materialInfo.sellingPrice,
                });
            }
        });

        // Add Technicians
        selectedTechnicianIds.forEach(technicianId => {
            addServiceTechnician({
                serviceId: serviceId,
                technicianId: technicianId,
            });
        });

        financialHook.updateFinancialSummary(updated, expenseHook.expenses);
        return newService;
    };

    const updateService = (
        serviceId: string,
        serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'roi' | 'totalValue'>,
        selectedMaterials: SelectedMaterialData[],
        selectedTechnicianIds: string[],
    ) => {
        const oldService = services.find(s => s.id === serviceId);
        if (!oldService) {
            console.error("Service not found for update:", serviceId);
            return;
        }

        const { totalValue, roi, materialsCost } = calculateServiceFinancials(serviceData, selectedMaterials);

        // Update Service
        const updatedService: Service = {
            ...oldService,
            ...serviceData,
            id: serviceId,
            totalValue,
            roi,
            updatedAt: new Date().toISOString(),
        };

        const updatedServicesArray = services.map(s => (s.id === serviceId ? updatedService : s));

        saveServices(updatedServicesArray);
        setServices(updatedServicesArray);

        // Calculate old material cost for financial adjustments
        const oldServiceMaterials = getServiceMaterialsByServiceId(serviceId);
        const oldMaterialsCost = oldServiceMaterials.reduce((acc, sm) => {
            const material = getMaterialById(sm.materialId);
            return acc + (material ? material.purchasePrice * sm.quantity : 0);
        }, 0);

        // Update financial balance for material cost difference
        const materialsCostDiff = materialsCost - oldMaterialsCost;
        if (materialsCostDiff !== 0) {
            if (materialsCostDiff > 0) {
                financialHook.updateAccountBalance(materialsCostDiff, 'subtract');
            } else {
                financialHook.updateAccountBalance(Math.abs(materialsCostDiff), 'add');
            }
        }

        // Update financial balance for payment status changes
        if (oldService.paymentStatus !== serviceData.paymentStatus) {
            if (serviceData.paymentStatus === 'paid' && oldService.paymentStatus !== 'paid') {
                financialHook.updateAccountBalance(totalValue, 'add');
            } else if (oldService.paymentStatus === 'paid' && serviceData.paymentStatus !== 'paid') {
                financialHook.updateAccountBalance(oldService.totalValue, 'subtract');
            }
        } else if (serviceData.paymentStatus === 'paid' && oldService.totalValue !== totalValue) {
            const valueDiff = totalValue - oldService.totalValue;
            if (valueDiff > 0) {
                financialHook.updateAccountBalance(valueDiff, 'add');
            } else {
                financialHook.updateAccountBalance(Math.abs(valueDiff), 'subtract');
            }
        }

        saveServices(updatedServicesArray);
        setServices(updatedServicesArray);

        // Update ServiceMaterial entities
        const existingServiceMaterials = getServiceMaterialsByServiceId(serviceId);

        // Delete removed materials
        existingServiceMaterials.forEach(esm => {
            if (!selectedMaterials.find(sm => sm.materialId === esm.materialId)) {
                deleteServiceMaterial(esm.id);
            }
        });

        // Add or update materials
        selectedMaterials.forEach(sm => {
            const existingMaterial = existingServiceMaterials.find(esm => esm.materialId === sm.materialId);
            const materialInfo = getMaterialById(sm.materialId);

            if (existingMaterial && materialInfo) {
                updateServiceMaterial({
                    ...existingMaterial,
                    quantity: sm.quantity,
                    priceSnapshot: materialInfo.sellingPrice
                });
            } else if (materialInfo) {
                addServiceMaterial({
                    serviceId: serviceId,
                    materialId: sm.materialId,
                    quantity: sm.quantity,
                    priceSnapshot: materialInfo.sellingPrice
                });
            }
        });

        // Update ServiceTechnician entities
        const existingServiceTechnicians = getServiceTechniciansByServiceId(serviceId);

        // Delete removed technicians
        existingServiceTechnicians.forEach(est => {
            if (!selectedTechnicianIds.includes(est.technicianId)) {
                deleteServiceTechnician(est.id);
            }
        });

        // Add new technicians
        selectedTechnicianIds.forEach(technicianId => {
            if (!existingServiceTechnicians.find(est => est.technicianId === technicianId)) {
                addServiceTechnician({
                    serviceId: serviceId,
                    technicianId: technicianId
                });
            }
        });



        // Update financial summary with updated service data
        financialHook.updateFinancialSummary(updatedServicesArray, expenseHook.expenses);
    };

    const deleteService = (id: string) => {
        const serviceToDelete = services.find(s => s.id === id);

        if (serviceToDelete) {
            if (serviceToDelete.paymentStatus === 'paid') {
                financialHook.updateAccountBalance(serviceToDelete.totalValue, 'subtract');
            }

            const serviceMatls = getServiceMaterialsByServiceId(id);
            const materialsCost = serviceMatls.reduce((acc, sm) => {
                const material = getMaterialById(sm.materialId);
                return acc + (material ? material.purchasePrice * sm.quantity : 0);
            }, 0);

            if (materialsCost > 0) {
                financialHook.updateAccountBalance(materialsCost, 'add');
            }

        }

        try {
            // Assuming you import deleteServiceInstallments from the hook or service:
            InstallmentService.deleteServiceInstallments(id);
        } catch (err) {
            console.error("Failed to delete installments for service", id, err);
        }

        getServiceTechniciansByServiceId(id).forEach(st => {
            deleteServiceTechnician(st.id);
        });

        getServiceMaterialsByServiceId(id).forEach(sm => {
            deleteServiceMaterial(sm.id);
        });

        // Remove the service from the state and storage
         const updated = services.filter(s => s.id !== id);
        saveServices(updated);
        setServices(updated);

        // Update financial summary with updated service data
        financialHook.updateFinancialSummary(updated, expenseHook.expenses);
    };

    const getServiceHistory = (id: string, equipment: string) => {
        return services.filter(s => s.equipmentId === equipment && s.id !== id);
    };

    const updateServicePrices = (service: Service, updateMaterialPrices: boolean): Service => {
        const updatedService = { ...service };

        if (updateMaterialPrices) {
            const currentServiceMaterials = getServiceMaterialsByServiceId(service.id);
            const updatedServiceMaterials = currentServiceMaterials.map(sm => {
                const currentMaterial = getMaterialById(sm.materialId);
                if (currentMaterial) {
                    return {
                        ...sm,
                        priceSnapshot: currentMaterial.sellingPrice
                    };
                }
                return sm;
            });

            const allServiceMaterials = serviceMaterials.map(sm => {
                const updated = updatedServiceMaterials.find(usm => usm.id === sm.id);
                return updated || sm;
            });
            saveServiceMaterials(allServiceMaterials);
            setServiceMaterials(allServiceMaterials);
        }

        const { totalValue, roi } = calculateServiceTotalAndROI(updatedService);
        updatedService.totalValue = totalValue;
        updatedService.roi = roi;

        return updatedService;
    };

    // Service types functions
    function getTypeOptions(): ServiceTypeOption[] {
        return serviceTypes;
    }

    function addServiceType(type: Omit<ServiceTypeOption, 'id'>) {
        const types = getServiceTypes();
        if (types.some(t => t.name === type.name)) return;
        const updated = [...types, type];
        saveServiceTypesFull(updated);
        setServiceTypes(updated);
    }

    function updateServiceType(type: ServiceTypeOption) {
        let types = getServiceTypes();
        types = types.map(t => t.name === type.name ? type : t);
        saveServiceTypesFull(types);
        setServiceTypes(types);
    }

    const getTypePrice = (typeName: string): number => {
        const typeOption = serviceTypes.find(type => type.name === typeName);
        return typeOption?.price || 0;
    };

    function deleteServiceType(name: string) {
        let types = getServiceTypes();
        types = types.filter(t => t.name !== name);
        saveServiceTypesFull(types);
        setServiceTypes(types);
    }

    const updateFinancialSummary = () => {
        // Update financial summary with current data
        financialHook.updateFinancialSummary(services, expenseHook.expenses);
        console.log('Financial summary update triggered');
    };

    // Generic CRUD operations for remaining entities
    const addServiceTechnician = (serviceTech: Omit<ServiceTechnician, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newServiceTech: ServiceTechnician = {
            ...serviceTech,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...serviceTechnicians, newServiceTech];
        saveServiceTechnicians(updated);
        setServiceTechnicians(updated);
    };

    const updateServiceTechnician = (serviceTech: ServiceTechnician) => {
        const updated = serviceTechnicians.map(st => (st.id === serviceTech.id ? { ...serviceTech, updatedAt: new Date().toISOString() } : st));
        saveServiceTechnicians(updated);
        setServiceTechnicians(updated);
    };

    const deleteServiceTechnician = (id: string) => {
        const updated = serviceTechnicians.filter(st => st.id !== id);
        saveServiceTechnicians(updated);
        setServiceTechnicians(updated);
    };

    const addServiceMaterial = (serviceMaterial: Omit<ServiceMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newServiceMaterial: ServiceMaterial = {
            ...serviceMaterial,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...serviceMaterials, newServiceMaterial];
        saveServiceMaterials(updated);
        setServiceMaterials(updated);
    };

    const updateServiceMaterial = (serviceMaterial: ServiceMaterial) => {
        const updated = serviceMaterials.map(sm => (sm.id === serviceMaterial.id ? { ...serviceMaterial, updatedAt: new Date().toISOString() } : sm));
        saveServiceMaterials(updated);
        setServiceMaterials(updated);
    };

    const deleteServiceMaterial = (id: string) => {
        const updated = serviceMaterials.filter(sm => sm.id !== id);
        saveServiceMaterials(updated);
        setServiceMaterials(updated);
    };

    const addOrderWithMaterials = (
        order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
        materials: { materialId: string; quantity: number }[]
    ) => {
        const orderId = uuidv4();
        const newOrder: Order = {
            ...order,
            id: orderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedOrders = [...orders, newOrder];
        saveOrders(updatedOrders);
        setOrders(updatedOrders);

        const newOrderMaterials = materials.map(m => ({
            id: uuidv4(),
            orderId,
            materialId: m.materialId,
            quantity: m.quantity,
            priceSnapshot: getMaterialById(m.materialId)?.sellingPrice || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        const updatedOrderMaterials = [...orderMaterials, ...newOrderMaterials];
        saveOrderMaterials(updatedOrderMaterials);
        setOrderMaterials(updatedOrderMaterials);
    };


    const updateOrderWithMaterials = (
        order: Order,
        materials: { materialId: string; quantity: number }[]
    ) => {
        // Update order
        const updatedOrder: Order = {
            ...order,
            updatedAt: new Date().toISOString(),
        };

        const updatedOrders = orders.map(o =>
            o.id === updatedOrder.id ? updatedOrder : o
        );
        saveOrders(updatedOrders);
        setOrders(updatedOrders);

        // Remove old OrderMaterials for this order
        const remainingOrderMaterials = orderMaterials.filter(om => om.orderId !== updatedOrder.id);

        // Add new OrderMaterials
        const newOrderMaterials = materials.map(m => ({
            id: uuidv4(),
            orderId: updatedOrder.id,
            materialId: m.materialId,
            quantity: m.quantity,
            priceSnapshot: getMaterialById(m.materialId)?.sellingPrice || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        const finalOrderMaterials = [...remainingOrderMaterials, ...newOrderMaterials];
        saveOrderMaterials(finalOrderMaterials);
        setOrderMaterials(finalOrderMaterials);
    };

    const addOrder = (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newOrder: Order = {
            ...order,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...orders, newOrder];
        saveOrders(updated);
        setOrders(updated);
    };

    const updateOrder = (order: Order) => {
        const updated = orders.map(o => (o.id === order.id ? { ...order, updatedAt: new Date().toISOString() } : o));
        saveOrders(updated);
        setOrders(updated);
    };

    const deleteOrder = (id: string) => {
        const updated = orders.filter(o => o.id !== id);
        saveOrders(updated);
        setOrders(updated);
    };

    const addPayment = (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newPayment: Payment = {
            ...payment,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...payments, newPayment];
        savePayments(updated);
        setPayments(updated);

        financialHook.updateAccountBalance(payment.amount, 'add');
        updateFinancialSummary();
    };

    const updatePayment = (payment: Payment) => {
        const oldPayment = payments.find(p => p.id === payment.id);
        const updated = payments.map(p => (p.id === payment.id ? { ...payment, updatedAt: new Date().toISOString() } : p));
        savePayments(updated);
        setPayments(updated);

        if (oldPayment && oldPayment.amount !== payment.amount) {
            const difference = payment.amount - oldPayment.amount;
            if (difference > 0) {
                financialHook.updateAccountBalance(difference, 'add');
            } else if (difference < 0) {
                financialHook.updateAccountBalance(Math.abs(difference), 'subtract');
            }
        }
        updateFinancialSummary();
    };

    const deletePayment = (id: string) => {
        const paymentToDelete = payments.find(p => p.id === id);
        if (paymentToDelete) {
            financialHook.updateAccountBalance(paymentToDelete.amount, 'subtract');
        }

        const updated = payments.filter(p => p.id !== id);
        savePayments(updated);
        setPayments(updated);
        updateFinancialSummary();
    };

    const addEquipment = (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newEquipment: Equipment = {
            ...equipment,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...equipments, newEquipment];
        saveEquipments(updated);
        setEquipments(updated);
    };

    const updateEquipment = (equipment: Equipment) => {
        const updated = equipments.map(e => (e.id === equipment.id ? { ...equipment, updatedAt: new Date().toISOString() } : e));
        saveEquipments(updated);
        setEquipments(updated);
    };

    const deleteEquipment = (id: string) => {
        const updated = equipments.filter(e => e.id !== id);
        saveEquipments(updated);
        setEquipments(updated);
    };

    const addAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newAppointment: Appointment = {
            ...appointment,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...appointments, newAppointment];
        saveAppointments(updated);
        setAppointments(updated);
    };

    const updateAppointment = (appointment: Appointment) => {
        const updated = appointments.map(a => (a.id === appointment.id ? { ...appointment, updatedAt: new Date().toISOString() } : a));
        saveAppointments(updated);
        setAppointments(updated);
    };

    const deleteAppointment = (id: string) => {
        const updated = appointments.filter(a => a.id !== id);
        saveAppointments(updated);
        setAppointments(updated);
    };

    const contextValue: AppContextType = {
        // From hooks
        users: userHook.users,
        clients: clientHook.clients,
        materials: materialHook.materials,
        technicians: technicianHook.technicians,
        expenses: expenseHook.expenses,
        financialData: financialHook.financialData,

        // Hook operations
        addUser: userHook.addUser,
        updateUser: userHook.updateUser,
        deleteUser: userHook.deleteUser,

        addClient: clientHook.addClient,
        updateClient: clientHook.updateClient,
        deleteClient: clientHook.deleteClient,

        addMaterial: materialHook.addMaterial,
        updateMaterial: materialHook.updateMaterial,
        deleteMaterial: materialHook.deleteMaterial,

        addTechnician: technicianHook.addTechnician,
        updateTechnician: technicianHook.updateTechnician,
        deleteTechnician: technicianHook.deleteTechnician,

        addExpense: (expense) => {
            expenseHook.addExpense(expense, financialHook.updateAccountBalance);
            // Update financial summary after adding expense
            setTimeout(() => financialHook.updateFinancialSummary(services, expenseHook.expenses), 0);
        },
        updateExpense: (expense) => {
            expenseHook.updateExpense(expense, financialHook.updateAccountBalance);
            // Update financial summary after updating expense
            setTimeout(() => financialHook.updateFinancialSummary(services, expenseHook.expenses), 0);
        },
        deleteExpense: (id) => {
            expenseHook.deleteExpense(id, financialHook.updateAccountBalance);
            // Update financial summary after deleting expense
            setTimeout(() => financialHook.updateFinancialSummary(services, expenseHook.expenses), 0);
        },

        updateAccountBalance: financialHook.updateAccountBalance,
        updateFinancialBalance: financialHook.updateFinancialBalance,
        generateMonthlyFinancialData: financialHook.generateMonthlyFinancialData,

        // Remaining operations
        services,
        serviceTechnicians,
        serviceMaterials,
        orders,
        orderMaterials,
        payments,
        equipments,
        appointments,

        addService,
        updateService,
        deleteService,
        getServiceHistory,
        updateServicePrices,

        addServiceTechnician,
        updateServiceTechnician,
        deleteServiceTechnician,

        addServiceMaterial,
        updateServiceMaterial,
        deleteServiceMaterial,
        addOrderWithMaterials,
        updateOrderWithMaterials,

        addOrder,
        updateOrder,
        deleteOrder,

        addPayment,
        updatePayment,
        deletePayment,

        addEquipment,
        updateEquipment,
        deleteEquipment,

        addAppointment,
        updateAppointment,
        deleteAppointment,

        getTypeOptions,
        addServiceType,
        updateServiceType,
        deleteServiceType,
        getTypePrice,

        updateFinancialSummary,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
}



/* eslint-disable @typescript-eslint/no-explicit-any */
// storageManager.ts

import {
    User,
    Client,
    Equipment,
    Material,
    Technician,
    Service,
    ServiceTechnician,
    ServiceMaterial,
    Order,
    OrderMaterial,
    Expense,
    Payment,
    Installment,
    Appointment,
    FinancialData,
    MonthlyData
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Service Type Management
export interface ServiceTypeOption {
    name: string;
    price: number;
}

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

const STORAGE_KEYS = {
    USERS: 'gestor-pro-users',
    CLIENTS: 'gestor-pro-clients',
    MATERIALS: 'gestor-pro-materials',
    TECHNICIANS: 'gestor-pro-technicians',
    SERVICES: 'gestor-pro-services',
    SERVICE_TECHNICIANS: 'gestor-pro-service-technicians',
    SERVICE_MATERIALS: 'gestor-pro-service-materials',
    ORDERS: 'gestor-pro-orders',
    ORDER_MATERIALS: 'gestor-pro-order-materials',
    EXPENSES: 'gestor-pro-expenses',
    PAYMENTS: 'gestor-pro-payments',
    INSTALLMENTS: 'gestor-pro-installments',
    EQUIPMENTS: 'gestor-pro-equipments',
    APPOINTMENTS: 'gestor-pro-appointments',
    FINANCIAL_DATA: 'gestor-pro-financial-data',
    CUSTOM_SERVICE_TYPES: 'custom_service_types',
    SERVICE_TYPES_FULL: 'gestor-pro-service-types-full',
    META: 'gestor-pro-meta',
};

// Utilitário para parse JSON seguro
function safeParse<T>(json: string | null, defaultValue: T): T {
    try {
        if (!json) return defaultValue;
        return JSON.parse(json);
    } catch {
        return defaultValue;
    }
}

// Validation functions for flattened data structures
function isValidUser(obj: any): obj is User {
    return obj && typeof obj.id === 'string' && typeof obj.email === 'string' && typeof obj.name === 'string' && typeof obj.role === 'string';
}

function isValidClient(obj: any): obj is Client {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

function isValidMaterial(obj: any): obj is Material {
    return obj && typeof obj.id === 'string' && typeof obj.type === 'string' && typeof obj.model === 'string';
}

function isValidTechnician(obj: any): obj is Technician {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

function isValidService(obj: any): obj is Service {
    return obj && typeof obj.id === 'string' && typeof obj.clientId === 'string';
}

function isValidServiceTechnician(obj: any): obj is ServiceTechnician {
    return obj && typeof obj.id === 'string' && typeof obj.serviceId === 'string' && typeof obj.technicianId === 'string';
}

function isValidServiceMaterial(obj: any): obj is ServiceMaterial {
    return obj && typeof obj.id === 'string' && typeof obj.serviceId === 'string' && typeof obj.materialId === 'string' && typeof obj.quantity === 'number' && typeof obj.priceSnapshot === 'number';
}

function isValidOrderMaterial(obj: any): obj is OrderMaterial {
    return obj && typeof obj.id === 'string' && typeof obj.orderId === 'string' && typeof obj.materialId === 'string' && typeof obj.quantity === 'number' && typeof obj.priceSnapshot === 'number';
}

function getEntity<T>(key: string, validator: (obj: any) => obj is T): T[] {
    const raw = localStorage.getItem(key);
    const list = safeParse<T[]>(raw, []);
    return list.filter(validator);
}

function saveEntity<T>(key: string, items: T[], validator: (obj: any) => obj is T): void {
    const filtered = items.filter(validator);
    localStorage.setItem(key, JSON.stringify(filtered));
}

// Export functions for each table with validation

export function getUsers(): User[] {
    return getEntity<User>(STORAGE_KEYS.USERS, isValidUser);
}
export function saveUsers(users: User[]): void {
    saveEntity<User>(STORAGE_KEYS.USERS, users, isValidUser);
}

export function getClients(): Client[] {
    return getEntity<Client>(STORAGE_KEYS.CLIENTS, isValidClient);
}
export function saveClients(clients: Client[]): void {
    saveEntity<Client>(STORAGE_KEYS.CLIENTS, clients, isValidClient);
}

export function getMaterials(): Material[] {
    return getEntity<Material>(STORAGE_KEYS.MATERIALS, isValidMaterial);
}
export function saveMaterials(materials: Material[]): void {
    saveEntity<Material>(STORAGE_KEYS.MATERIALS, materials, isValidMaterial);
}

export function getTechnicians(): Technician[] {
    return getEntity<Technician>(STORAGE_KEYS.TECHNICIANS, isValidTechnician);
}
export function saveTechnicians(technicians: Technician[]): void {
    saveEntity<Technician>(STORAGE_KEYS.TECHNICIANS, technicians, isValidTechnician);
}

export function getServices(): Service[] {
    return getEntity<Service>(STORAGE_KEYS.SERVICES, isValidService);
}
export function saveServices(services: Service[]): void {
    saveEntity<Service>(STORAGE_KEYS.SERVICES, services, isValidService);
}

export function getServiceTechnicians(): ServiceTechnician[] {
    return getEntity<ServiceTechnician>(STORAGE_KEYS.SERVICE_TECHNICIANS, isValidServiceTechnician);
}
export function saveServiceTechnicians(items: ServiceTechnician[]): void {
    saveEntity<ServiceTechnician>(STORAGE_KEYS.SERVICE_TECHNICIANS, items, isValidServiceTechnician);
}

export function getServiceMaterials(): ServiceMaterial[] {
    return getEntity<ServiceMaterial>(STORAGE_KEYS.SERVICE_MATERIALS, isValidServiceMaterial);
}
export function saveServiceMaterials(items: ServiceMaterial[]): void {
    saveEntity<ServiceMaterial>(STORAGE_KEYS.SERVICE_MATERIALS, items, isValidServiceMaterial);
}

// Outras entidades sem validação explícita

export function getOrders(): Order[] {
    return safeParse<Order[]>(localStorage.getItem(STORAGE_KEYS.ORDERS), []);
}
export function saveOrders(items: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(items));
}

export function getOrderMaterials(): OrderMaterial[] {
    return getEntity<OrderMaterial>(STORAGE_KEYS.ORDER_MATERIALS, isValidOrderMaterial);
}
export function saveOrderMaterials(items: OrderMaterial[]): void {
    saveEntity<OrderMaterial>(STORAGE_KEYS.ORDER_MATERIALS, items, isValidOrderMaterial);
}

export function getExpenses(): Expense[] {
    return safeParse<Expense[]>(localStorage.getItem(STORAGE_KEYS.EXPENSES), []);
}
export function saveExpenses(items: Expense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(items));
}

export function getPayments(): Payment[] {
    return safeParse<Payment[]>(localStorage.getItem(STORAGE_KEYS.PAYMENTS), []);
}
export function savePayments(items: Payment[]): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(items));
}

export function getInstallments(): Installment[] {
    return safeParse<Installment[]>(localStorage.getItem(STORAGE_KEYS.INSTALLMENTS), []);
}
export function saveInstallments(items: Installment[]): void {
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(items));
}

export function getEquipments(): Equipment[] {
    return safeParse<Equipment[]>(localStorage.getItem(STORAGE_KEYS.EQUIPMENTS), []);
}
export function saveEquipments(items: Equipment[]): void {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENTS, JSON.stringify(items));
}

export function getAppointments(): Appointment[] {
    return safeParse<Appointment[]>(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS), []);
}
export function saveAppointments(items: Appointment[]): void {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(items));
}

export function getFinancialData(): FinancialData | null {
    return safeParse<FinancialData>(localStorage.getItem(STORAGE_KEYS.FINANCIAL_DATA), null);
}
export function saveFinancialData(data: FinancialData): void {
    localStorage.setItem(STORAGE_KEYS.FINANCIAL_DATA, JSON.stringify(data));
    console.log('Financial data saved to localStorage:', data);
}

// Service Types Management
export function getServiceTypes(): ServiceTypeOption[] {
    // Try to get full service types first
    const fullTypes = safeParse<ServiceTypeOption[]>(localStorage.getItem(STORAGE_KEYS.SERVICE_TYPES_FULL), []);
    if (fullTypes.length > 0) {
        return [...defaultServiceTypes, ...fullTypes.filter(t => !defaultServiceTypes.some(d => d.name === t.name))];
    }

    // Fallback to old format (just names)
    const customNames = safeParse<string[]>(localStorage.getItem(STORAGE_KEYS.CUSTOM_SERVICE_TYPES), []);

    // Initialize defaults if nothing exists
    if (customNames.length === 0) {
        saveServiceTypesFull(defaultServiceTypes);
        return defaultServiceTypes;
    }

    // Merge defaults with custom names (with default price 0)
    const merged = [...defaultServiceTypes];
    customNames.forEach(name => {
        if (!merged.some(t => t.name === name)) {
            merged.push({ name, price: 0 });
        }
    });

    return merged;
}

export function saveServiceTypes(types: string[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SERVICE_TYPES, JSON.stringify(types));
}

export function saveServiceTypesFull(types: ServiceTypeOption[]): void {
    // Save only custom types (exclude defaults)
    const customTypes = types.filter(t => !defaultServiceTypes.some(d => d.name === t.name));
    localStorage.setItem(STORAGE_KEYS.SERVICE_TYPES_FULL, JSON.stringify(customTypes));

    // Also save names for backward compatibility
    const allNames = types.map(t => t.name);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SERVICE_TYPES, JSON.stringify(allNames));
}

// MetaData

export interface MetaData {
    format: 'old' | 'new' | 'normalized';
    version: string;
    exportDate?: string;
}

export function getMetaData(): MetaData | null {
    return safeParse<MetaData>(localStorage.getItem(STORAGE_KEYS.META), null);
}
export function saveMetaData(meta: MetaData): void {
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
}

// Migration functions
export function migrateDataToNewStructure(): boolean {
    try {
        const oldDataRaw = localStorage.getItem('gestor-pro-data');
        if (!oldDataRaw) return false;
        const oldData = JSON.parse(oldDataRaw);

        // Corrige IDs numéricos para UUID no services
        const services = (oldData.services ?? []).map((s: any) => ({
            ...s,
            id: typeof s.id === 'number' ? uuidv4() : s.id,
        }));

        const newData = {
            users: oldData.users ?? [],
            clients: oldData.clients ?? [],
            materials: oldData.materials ?? [],
            technicians: oldData.technicians ?? [],
            services,
            serviceTechnicians: oldData.serviceTechnicians ?? [],
            serviceMaterials: oldData.serviceMaterials ?? [],
            orders: oldData.orders ?? [],
            orderMaterials: oldData.orderMaterials ?? [],
            expenses: oldData.expenses ?? [],
            payments: oldData.payments ?? [],
            installments: oldData.installments ?? [],
            equipments: oldData.equipments ?? [],
            appointments: oldData.appointments ?? [],
            financialData: oldData.financialData ?? null,
            customServiceTypes: oldData.customServiceTypes ?? [],
        };

        // Salvar tudo em batch
        saveUsers(newData.users);
        saveClients(newData.clients);
        saveMaterials(newData.materials);
        saveTechnicians(newData.technicians);
        saveServices(newData.services);
        saveServiceTechnicians(newData.serviceTechnicians);
        saveServiceMaterials(newData.serviceMaterials);
        saveOrders(newData.orders);
        saveOrderMaterials(newData.orderMaterials);
        saveExpenses(newData.expenses);
        savePayments(newData.payments);
        saveInstallments(newData.installments);
        saveEquipments(newData.equipments);
        saveAppointments(newData.appointments);
        saveServiceTypes(newData.customServiceTypes);

        if (newData.financialData) saveFinancialData(newData.financialData);

        saveMetaData({
            format: 'new',
            version: '2.0.0',
            exportDate: new Date().toISOString(),
        });

        localStorage.removeItem('gestor-pro-data');

        return true;
    } catch (error) {
        console.error('Erro na migração:', error);
        return false;
    }
}

// Load all data with migration handling
export function loadInitialData() {
    console.log('Loading initial data storage...');

    // Check if we need to migrate to normalized structure
    const metaData = getMetaData();
    if (!metaData || metaData.format !== 'normalized') {
        // Import migration functions
        import('./dataMigration').then(({ needsMigration, migrateToNormalizedStructure }) => {
            if (needsMigration()) {
                console.log('Migrating to normalized data structure...');
                migrateToNormalizedStructure();
            }
        });
    }

    return {
        users: getUsers(),
        clients: getClients(),
        materials: getMaterials(),
        technicians: getTechnicians(),
        services: getServices(),
        serviceTechnicians: getServiceTechnicians(),
        serviceMaterials: getServiceMaterials(),
        orders: getOrders(),
        orderMaterials: getOrderMaterials(),
        expenses: getExpenses(),
        payments: getPayments(),
        installments: getInstallments(),
        equipments: getEquipments(),
        appointments: getAppointments(),
        financialData: getFinancialData(),
        customServiceTypes: getServiceTypes().map(t => t.name),
        metaData: getMetaData(),
    };
}

import { generateMockData } from './mockData';

export const seedDatabase = () => {
    const data = generateMockData();
    console.log('Seeding database with mock data...', data);

    saveClients(data.clients);
    saveTechnicians(data.technicians);
    saveMaterials(data.materials);
    saveServices(data.services);
    saveServiceTechnicians(data.serviceTechnicians);
    saveServiceMaterials(data.serviceMaterials);
    saveExpenses(data.expenses);
    savePayments(data.payments);

    if (data.financialData) {
        saveFinancialData(data.financialData);
    }

    // Force reload of metadata or just let the app reload
    window.location.reload();
};

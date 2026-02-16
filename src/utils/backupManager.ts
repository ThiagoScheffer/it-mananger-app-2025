
import type { AppState } from '@/types';
import {
    getUsers, getClients, getMaterials, getTechnicians, getServices,
    getServiceTechnicians, getServiceMaterials, getOrders, getOrderMaterials,
    getExpenses, getPayments, getInstallments, getEquipments, getAppointments,
    getFinancialData, getServiceTypes,
    saveUsers, saveClients, saveMaterials, saveTechnicians, saveServices,
    saveServiceTechnicians, saveServiceMaterials, saveOrders, saveOrderMaterials,
    saveExpenses, savePayments, saveInstallments, saveEquipments, saveAppointments,
    saveFinancialData, saveServiceTypesFull, saveMetaData
} from '@/utils/storageManager';

// Additional data types for new features
interface ExtendedAppState extends AppState {
    stockMovements?: Array<{
        id: string;
        materialId: string;
        movementType: 'in' | 'out';
        quantity: number;
        reason: string;
        referenceId?: string;
        notes?: string;
        previousStock: number;
        newStock: number;
        createdAt: string;
        updatedAt: string;
    }>;
    technicianWorkLogs?: Array<{
        id: string;
        serviceId: string;
        technicianId: string;
        startTime: string;
        endTime?: string;
        totalMinutes?: number;
        description?: string;
        createdAt: string;
        updatedAt: string;
    }>;
}

export interface BackupMetadata {
    version: string;
    exportDate: string;
    appVersion: string;
    dataVersion: string;
    checksum: string;
}

export interface BackupData {
    metadata: BackupMetadata;
    data: ExtendedAppState;
    serviceTypes: { name: string; price: number }[];
}

export interface BackupValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    stats: Record<string, number> | null;
}

export interface BackupImportResult {
    success: boolean;
    errors: string[];
    warnings: string[];
    importedCounts: Record<string, number>;
    skippedCounts: Record<string, number>;
    isDryRun: boolean;
}

// Generate checksum for data integrity verification
function generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

// Load additional data with fallbacks
function getStockMovements() {
    try {
        const data = localStorage.getItem('gestor-pro-stock-movements');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function getTechnicianWorkLogs() {
    try {
        const data = localStorage.getItem('gestor-pro-time-tracking');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Validation functions for data integrity
function validateDataIntegrity(data: ExtendedAppState): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate foreign key relationships
    const clientIds = new Set(data.clients.map(c => c.id));
    const materialIds = new Set(data.materials.map(m => m.id));
    const technicianIds = new Set(data.technicians.map(t => t.id));
    const serviceIds = new Set(data.services.map(s => s.id));
    const equipmentIds = new Set(data.equipments.map(e => e.id));

    // Check services reference valid clients
    data.services.forEach(service => {
        if (!clientIds.has(service.clientId)) {
            errors.push(`Service ${service.id} references non-existent client ${service.clientId}`);
        }
        if (service.equipmentId && !equipmentIds.has(service.equipmentId)) {
            warnings.push(`Service ${service.id} references non-existent equipment ${service.equipmentId}`);
        }
    });

    // Check service materials reference valid services and materials
    data.serviceMaterials.forEach(sm => {
        if (!serviceIds.has(sm.serviceId)) {
            errors.push(`ServiceMaterial ${sm.id} references non-existent service ${sm.serviceId}`);
        }
        if (!materialIds.has(sm.materialId)) {
            errors.push(`ServiceMaterial ${sm.id} references non-existent material ${sm.materialId}`);
        }
    });

    // Check service technicians reference valid services and technicians
    data.serviceTechnicians.forEach(st => {
        if (!serviceIds.has(st.serviceId)) {
            errors.push(`ServiceTechnician ${st.id} references non-existent service ${st.serviceId}`);
        }
        if (!technicianIds.has(st.technicianId)) {
            errors.push(`ServiceTechnician ${st.id} references non-existent technician ${st.technicianId}`);
        }
    });

    // Check installments reference valid services
    data.installments.forEach(installment => {
        if (!serviceIds.has(installment.serviceId)) {
            errors.push(`Installment ${installment.id} references non-existent service ${installment.serviceId}`);
        }
    });

    // Check payments reference valid services
    data.payments.forEach(payment => {
        if (!serviceIds.has(payment.serviceId)) {
            errors.push(`Payment ${payment.id} references non-existent service ${payment.serviceId}`);
        }
    });

    // Check orders and order materials
    const orderIds = new Set(data.orders.map(o => o.id));
    data.orders.forEach(order => {
        if (order.relatedServiceId && !serviceIds.has(order.relatedServiceId)) {
            warnings.push(`Order ${order.id} references non-existent service ${order.relatedServiceId}`);
        }
    });

    data.orderMaterials.forEach(om => {
        if (!orderIds.has(om.orderId)) {
            errors.push(`OrderMaterial ${om.id} references non-existent order ${om.orderId}`);
        }
        if (!materialIds.has(om.materialId)) {
            errors.push(`OrderMaterial ${om.id} references non-existent material ${om.materialId}`);
        }
    });

    // Check equipment references valid clients
    data.equipments.forEach(equipment => {
        if (!clientIds.has(equipment.clientId)) {
            errors.push(`Equipment ${equipment.id} references non-existent client ${equipment.clientId}`);
        }
    });

    // Check appointments
    data.appointments.forEach(appointment => {
        if (appointment.clientId && !clientIds.has(appointment.clientId)) {
            warnings.push(`Appointment ${appointment.id} references non-existent client ${appointment.clientId}`);
        }
        if (appointment.serviceId && !serviceIds.has(appointment.serviceId)) {
            warnings.push(`Appointment ${appointment.id} references non-existent service ${appointment.serviceId}`);
        }
    });

    // Check stock movements if present
    if (data.stockMovements) {
        data.stockMovements.forEach(movement => {
            if (!materialIds.has(movement.materialId)) {
                errors.push(`StockMovement ${movement.id} references non-existent material ${movement.materialId}`);
            }
        });
    }

    // Check technician work logs if present
    if (data.technicianWorkLogs) {
        data.technicianWorkLogs.forEach(log => {
            if (!serviceIds.has(log.serviceId)) {
                errors.push(`TechnicianWorkLog ${log.id} references non-existent service ${log.serviceId}`);
            }
            if (!technicianIds.has(log.technicianId)) {
                errors.push(`TechnicianWorkLog ${log.id} references non-existent technician ${log.technicianId}`);
            }
        });
    }

    return { errors, warnings };
}

// Export all application data to a backup object
export function createBackup(): BackupData {
    const data: ExtendedAppState = {
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
        financialData: getFinancialData() || {
            summary: {
                balance: 0,
                monthlyRevenue: 0,
                thismonthRevenuePrev: 0,
                monthlyExpenses: 0,
                monthlyProfit: 0,
                profitMargin: 0,
                pendingPayments: 0,
                completedServices: 0,
                avgServiceValue: 0,
                nextMonthProjectedRevenue: 0,
                nextMonthProjectedExpenses: 0,
                nextMonthProjectedProfit: 0,
                totalRevenue: 0,
                totalExpenses: 0,
                totalProfit: 0,
                totalAvgServiceValue: 0,
                totalProfitMargin: 0,
                totalCompletedServices: 0,
                currentMonthProjectedRevenue: 0,
                currentMonthProjectedExpenses: 0,
                currentMonthProjectedProfit: 0,
                totalPendingPayments: 0,
                forecastReliability: 'média',
            },
            monthlyData: [],
        },
        // Add new data types
        stockMovements: getStockMovements(),
        technicianWorkLogs: getTechnicianWorkLogs()
    };

    const serviceTypes = getServiceTypes();
    const dataString = JSON.stringify(data);

    const backup: BackupData = {
        metadata: {
            version: '3.0.0',
            exportDate: new Date().toISOString(),
            appVersion: '3.0.0',
            dataVersion: 'normalized',
            checksum: generateChecksum(dataString)
        },
        data,
        serviceTypes
    };

    return backup;
}

// Export backup to downloadable JSON file
export function exportBackupToFile(): void {
    try {
        const backup = createBackup();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `gestor-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Backup exported successfully');
    } catch (error) {
        console.error('Error exporting backup:', error);
        throw new Error('Failed to export backup');
    }
}

// Validate backup data integrity
export function validateBackup(backup: BackupData): BackupValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check metadata
    if (!backup.metadata) {
        errors.push('Missing metadata');
        return { isValid: false, errors, warnings, stats: null };
    }

    // Check data structure
    if (!backup.data) {
        errors.push('Missing data');
        return { isValid: false, errors, warnings, stats: null };
    }

    // Verify checksum
    const dataString = JSON.stringify(backup.data);
    const calculatedChecksum = generateChecksum(dataString);
    if (backup.metadata.checksum !== calculatedChecksum) {
        errors.push('Data integrity check failed - checksum mismatch');
    }

    // Check required data arrays
    const requiredArrays = [
        'users', 'clients', 'materials', 'technicians', 'services',
        'serviceTechnicians', 'serviceMaterials', 'orders', 'orderMaterials',
        'expenses', 'payments', 'installments', 'equipments', 'appointments'
    ];

    for (const arrayName of requiredArrays) {
        if (!Array.isArray(backup.data[arrayName as keyof ExtendedAppState])) {
            errors.push(`Invalid or missing ${arrayName} array`);
        }
    }

    // Check financial data
    if (!backup.data.financialData || !backup.data.financialData.summary) {
        errors.push('Invalid financial data structure');
    }

    // Validate data integrity (foreign keys, etc.)
    if (errors.length === 0) {
        const integrityResult = validateDataIntegrity(backup.data);
        errors.push(...integrityResult.errors);
        warnings.push(...integrityResult.warnings);
    }

    // Generate statistics
    const stats = errors.length === 0 ? {
        users: backup.data.users.length,
        clients: backup.data.clients.length,
        materials: backup.data.materials.length,
        technicians: backup.data.technicians.length,
        services: backup.data.services.length,
        installments: backup.data.installments.length,
        expenses: backup.data.expenses.length,
        orders: backup.data.orders.length,
        appointments: backup.data.appointments.length,
        stockMovements: backup.data.stockMovements?.length || 0,
        workLogs: backup.data.technicianWorkLogs?.length || 0
    } : null;

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats
    };
}

// Import backup and restore application data
export function restoreFromBackup(backup: BackupData, isDryRun: boolean = false): BackupImportResult {
    try {
        // Validate backup first
        const validation = validateBackup(backup);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors,
                warnings: validation.warnings,
                importedCounts: {},
                skippedCounts: {},
                isDryRun
            };
        }

        const importedCounts: Record<string, number> = {};
        const skippedCounts: Record<string, number> = {};

        if (!isDryRun) {
            // Create backup of current data before restore
            const currentBackup = createBackup();
            localStorage.setItem('gestor-pro-pre-restore-backup', JSON.stringify(currentBackup));

            // Restore all data
            const { data } = backup;

            saveUsers(data.users);
            importedCounts.users = data.users.length;

            saveClients(data.clients);
            importedCounts.clients = data.clients.length;

            saveMaterials(data.materials);
            importedCounts.materials = data.materials.length;

            saveTechnicians(data.technicians);
            importedCounts.technicians = data.technicians.length;

            saveServices(data.services);
            importedCounts.services = data.services.length;

            saveServiceTechnicians(data.serviceTechnicians);
            importedCounts.serviceTechnicians = data.serviceTechnicians.length;

            saveServiceMaterials(data.serviceMaterials);
            importedCounts.serviceMaterials = data.serviceMaterials.length;

            saveOrders(data.orders);
            importedCounts.orders = data.orders.length;

            saveOrderMaterials(data.orderMaterials);
            importedCounts.orderMaterials = data.orderMaterials.length;

            saveExpenses(data.expenses);
            importedCounts.expenses = data.expenses.length;

            savePayments(data.payments);
            importedCounts.payments = data.payments.length;

            saveInstallments(data.installments);
            importedCounts.installments = data.installments.length;

            saveEquipments(data.equipments);
            importedCounts.equipments = data.equipments.length;

            saveAppointments(data.appointments);
            importedCounts.appointments = data.appointments.length;

            saveFinancialData(data.financialData);
            importedCounts.financialData = 1;

            // Restore service types
            if (backup.serviceTypes) {
                saveServiceTypesFull(backup.serviceTypes);
                importedCounts.serviceTypes = backup.serviceTypes.length;
            }

            // Restore new data types if present
            if (data.stockMovements) {
                localStorage.setItem('gestor-pro-stock-movements', JSON.stringify(data.stockMovements));
                importedCounts.stockMovements = data.stockMovements.length;
            }

            if (data.technicianWorkLogs) {
                localStorage.setItem('gestor-pro-time-tracking', JSON.stringify(data.technicianWorkLogs));
                importedCounts.technicianWorkLogs = data.technicianWorkLogs.length;
            }

            // Update metadata
            saveMetaData({
                format: 'normalized',
                version: backup.metadata.version,
                exportDate: backup.metadata.exportDate
            });

            console.log('Backup restored successfully');
        } else {
            // Dry run - just count what would be imported
            const { data } = backup;
            importedCounts.users = data.users.length;
            importedCounts.clients = data.clients.length;
            importedCounts.materials = data.materials.length;
            importedCounts.technicians = data.technicians.length;
            importedCounts.services = data.services.length;
            importedCounts.serviceTechnicians = data.serviceTechnicians.length;
            importedCounts.serviceMaterials = data.serviceMaterials.length;
            importedCounts.orders = data.orders.length;
            importedCounts.orderMaterials = data.orderMaterials.length;
            importedCounts.expenses = data.expenses.length;
            importedCounts.payments = data.payments.length;
            importedCounts.installments = data.installments.length;
            importedCounts.equipments = data.equipments.length;
            importedCounts.appointments = data.appointments.length;

            if (data.stockMovements) {
                importedCounts.stockMovements = data.stockMovements.length;
            }
            if (data.technicianWorkLogs) {
                importedCounts.technicianWorkLogs = data.technicianWorkLogs.length;
            }
        }

        return {
            success: true,
            errors: [],
            warnings: validation.warnings,
            importedCounts,
            skippedCounts,
            isDryRun
        };

    } catch (error) {
        console.error('Error restoring backup:', error);
        return {
            success: false,
            errors: ['Failed to restore backup: ' + (error as Error).message],
            warnings: [],
            importedCounts: {},
            skippedCounts: {},
            isDryRun
        };
    }
}

// Import backup from file
export function importBackupFromFile(file: File): Promise<BackupImportResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const backup: BackupData = JSON.parse(content);
                const result = restoreFromBackup(backup, false);
                resolve(result);
            } catch (error) {
                resolve({
                    success: false,
                    errors: ['Invalid backup file format: ' + (error as Error).message],
                    warnings: [],
                    importedCounts: {},
                    skippedCounts: {},
                    isDryRun: false
                });
            }
        };

        reader.onerror = () => {
            resolve({
                success: false,
                errors: ['Failed to read backup file'],
                warnings: [],
                importedCounts: {},
                skippedCounts: {},
                isDryRun: false
            });
        };

        reader.readAsText(file);
    });
}

// Create automatic backup (can be called periodically)
export function createAutomaticBackup(): void {
    try {
        const backup = createBackup();
        const backupKey = `gestor-pro-auto-backup-${new Date().toISOString().split('T')[0]}`;

        // Keep only last 7 days of automatic backups
        const keys = Object.keys(localStorage).filter(key => key.startsWith('gestor-pro-auto-backup-'));
        if (keys.length >= 7) {
            const oldestKey = keys.sort()[0];
            localStorage.removeItem(oldestKey);
        }

        localStorage.setItem(backupKey, JSON.stringify(backup));
        console.log('Automatic backup created:', backupKey);
    } catch (error) {
        console.error('Error creating automatic backup:', error);
    }
}

// Get list of available automatic backups
export function getAutomaticBackups(): { date: string; key: string }[] {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('gestor-pro-auto-backup-'));
    return keys.map(key => ({
        date: key.replace('gestor-pro-auto-backup-', ''),
        key
    })).sort((a, b) => b.date.localeCompare(a.date));
}

// Restore from automatic backup
export function restoreFromAutomaticBackup(backupKey: string): { success: boolean; errors: string[] } {
    try {
        const backupData = localStorage.getItem(backupKey);
        if (!backupData) {
            return { success: false, errors: ['Backup not found'] };
        }

        const backup: BackupData = JSON.parse(backupData);
        const result = restoreFromBackup(backup, false);

        return {
            success: result.success,
            errors: result.errors
        };
    } catch (error) {
        return {
            success: false,
            errors: ['Failed to restore automatic backup: ' + (error as Error).message]
        };
    }
}

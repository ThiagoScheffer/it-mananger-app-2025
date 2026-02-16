
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import {
    Client,
    Technician,
    Material,
    Service,
    ServiceTechnician,
    ServiceMaterial,
    Expense,
    Payment,
    ServiceStatus,
    PaymentStatus,
    ServiceVisitType,
    FinancialData
} from '@/types';
import { ServiceTypeOption } from '@/utils/storageManager';

export const generateMockData = () => {
    // 1. Technicians
    const technicians: Technician[] = Array.from({ length: 5 }).map(() => ({
        id: uuidv4(),
        name: faker.person.fullName(),
        specialty: faker.person.jobTitle(),
        status: 'active',
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
    }));

    // 2. Materials
    const materials: Material[] = Array.from({ length: 15 }).map(() => {
        const purchasePrice = parseFloat(faker.commerce.price({ min: 10, max: 200 }));
        return {
            id: uuidv4(),
            type: faker.commerce.productAdjective(),
            model: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            purchaseSites: faker.internet.url(),
            purchasePrice: purchasePrice,
            sellingPrice: purchasePrice * 1.5,
            returnValue: 0,
            status: 'available',
            stock: faker.number.int({ min: 0, max: 50 }),
            createdAt: faker.date.past().toISOString(),
            updatedAt: faker.date.recent().toISOString(),
        };
    });

    // 3. Clients
    const clients: Client[] = Array.from({ length: 20 }).map(() => ({
        id: uuidv4(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
        workType: faker.person.jobDescriptor(),
        status: faker.helpers.arrayElement(['active', 'inactive']),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
    }));

    // 4. Services & Related Data
    const services: Service[] = [];
    const serviceTechnicians: ServiceTechnician[] = [];
    const serviceMaterials: ServiceMaterial[] = [];
    const payments: Payment[] = [];

    const defaultServiceTypes: ServiceTypeOption[] = [
        { name: "Formatação Simples", price: 120.00 },
        { name: "Formatação Profissional", price: 250.00 },
        { name: "Limpeza", price: 50.00 },
        { name: "Limpeza avançada", price: 85.00 },
        { name: "Troca de pasta térmica", price: 40.00 },
        { name: "Acesso remoto", price: 90.00 },
        { name: "Instalação de Software", price: 35.00 }
    ];

    // Create 50 services distributed over the last 6 months
    for (let i = 0; i < 50; i++) {
        const client = faker.helpers.arrayElement(clients);
        const serviceDate = faker.date.past({ years: 0.5 });
        const serviceId = uuidv4();

        // Randomly select service types
        const selectedTypes = faker.helpers.arrayElements(defaultServiceTypes, { min: 1, max: 3 });
        const servicePrice = selectedTypes.reduce((sum, t) => sum + t.price, 0);
        const serviceTypeNames = selectedTypes.map(t => t.name);

        // Assign Technicians
        const assignedTechs = faker.helpers.arrayElements(technicians, { min: 1, max: 2 });
        assignedTechs.forEach(tech => {
            serviceTechnicians.push({
                id: uuidv4(),
                serviceId: serviceId,
                technicianId: tech.id,
                createdAt: serviceDate.toISOString(),
                updatedAt: serviceDate.toISOString()
            });
        });

        // Assign Materials
        const assignedMaterials = faker.helpers.arrayElements(materials, { min: 0, max: 2 });
        let materialsRevenue = 0;
        let materialsCost = 0;

        assignedMaterials.forEach(mat => {
            const quantity = faker.number.int({ min: 1, max: 3 });
            serviceMaterials.push({
                id: uuidv4(),
                serviceId: serviceId,
                materialId: mat.id,
                quantity: quantity,
                priceSnapshot: mat.sellingPrice,
                createdAt: serviceDate.toISOString(),
                updatedAt: serviceDate.toISOString()
            });
            materialsRevenue += mat.sellingPrice * quantity;
            materialsCost += mat.purchasePrice * quantity;
        });

        const pickupDeliveryPrice = faker.number.int({ min: 0, max: 50 });
        const totalValue = servicePrice + pickupDeliveryPrice + materialsRevenue;

        const serviceStatus: ServiceStatus = faker.helpers.arrayElement(["completed", "inProgress", "pending", "cancelled"]);
        let paymentStatus: PaymentStatus = "pending";

        if (serviceStatus === 'completed') {
            paymentStatus = faker.helpers.arrayElement(["paid", "unpaid", "pending", "partial"]);
        }

        const roi = totalValue > 0 ? ((totalValue - materialsCost) / totalValue) * 100 : 0;

        services.push({
            id: serviceId,
            clientId: client.id,
            name: selectedTypes[0].name, // Main service name as title
            description: faker.lorem.sentence(),
            date: serviceDate.toISOString(),
            servicePrice: servicePrice,
            pickupDeliveryPrice: pickupDeliveryPrice,
            serviceStatus: serviceStatus,
            paymentStatus: paymentStatus,
            visitType: faker.helpers.arrayElement(["novo", "retorno"]),
            serviceTypes: serviceTypeNames,
            totalValue: totalValue,
            roi: roi,
            createdAt: serviceDate.toISOString(),
            updatedAt: serviceDate.toISOString(),
        });

        // Generate Payment if paid
        if (paymentStatus === 'paid') {
            payments.push({
                id: uuidv4(),
                serviceId: serviceId,
                amount: totalValue,
                paymentDate: faker.date.between({ from: serviceDate, to: new Date() }).toISOString(),
                paymentMethod: faker.helpers.arrayElement(["cash", "credit", "debit", "transfer", "other"]),
                createdAt: serviceDate.toISOString(),
                updatedAt: serviceDate.toISOString(),
            });
        }
    }

    // 5. Expenses
    const expenses: Expense[] = Array.from({ length: 20 }).map(() => ({
        id: uuidv4(),
        description: faker.commerce.productName(),
        category: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Internet', 'Peças', 'Transporte', 'Outros']),
        value: parseFloat(faker.commerce.price({ min: 50, max: 1000 })),
        dueDate: faker.date.future().toISOString(),
        isPaid: faker.datatype.boolean(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
    }));

    // 6. Financial Data (Mocked)
    const financialData: FinancialData = {
        summary: {
            balance: 100000,
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
            forecastReliability: 'low'
        },
        monthlyData: []
    };

    return {
        users: [], // Keep existing users or empty
        clients,
        technicians,
        materials,
        services,
        serviceTechnicians,
        serviceMaterials,
        orders: [],
        orderMaterials: [],
        expenses,
        payments,
        installments: [],
        equipments: [],
        appointments: [],
        financialData: financialData,
        customServiceTypes: defaultServiceTypes.map(t => t.name)
    };
};

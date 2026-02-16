
import { useState } from 'react';
import { FinancialData, FinancialSummary, MonthlyData } from '@/types/financial';
import { Service, Expense, Installment } from '@/types';
import { getFinancialData, saveFinancialData, getServiceTypes } from '@/utils/storageManager';
import { getServiceMaterialsByServiceId, getMaterialById, getInstallmentsByServiceId } from '@/utils/dataHelpers';
import { useAppContext } from '@/context/AppContext';

// Helper functions for filtering by month/year
const filterServicesByMonth = (services: Service[], month: number, year: number) => {
    return services.filter(service => {
        const serviceDate = new Date(service.date);// Use service.date instead of service.createdAt
        return serviceDate.getMonth() === month && serviceDate.getFullYear() === year;
    });
};

const filterExpensesByMonth = (expenses: Expense[], month: number, year: number) => {
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.dueDate);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    });
};

export function getRemainingInstallments(serviceId: string): Installment[] {
    const installments = getInstallmentsByServiceId(serviceId);
    return installments.filter(installment =>
        installment.status !== 'paid'
    );
}
// Function to get the total amount paid for a service
export function getPaidAmount(serviceId: string): number {
    const payments = getInstallmentsByServiceId(serviceId);
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export function getInstallmentPaidAmount(serviceId: string): number {
    const installments = getInstallmentsByServiceId(serviceId);
    return installments.filter(inst => inst.amount > 0 && inst.status === 'paid')
        .reduce((acc, inst) => acc + inst.amount, 0);
}


// Helper functions for calculations
const calculateServicesRevenue = (services: Service[], onlyPaid: boolean = false) => {
    const filteredServices = onlyPaid ? services.filter(s => s.paymentStatus === 'paid') : services;
    return filteredServices.reduce((sum, service) => sum + service.totalValue, 0);
};

const calculateServicesUnPaidPending = (services: Service[]) => {
    return services
        .filter(s => s.paymentStatus != 'paid')
        .reduce((sum, service) => sum + service.totalValue, 0);
};

const calculateServicesProfit = (services: Service[], onlyPaid: boolean = false) => {
    const filteredServices = onlyPaid ? services.filter(s => s.paymentStatus === 'paid') : services;
    return filteredServices.reduce((sum, service) => {
        // Get service types
        const serviceTypeOptions = getServiceTypes();
        const serviceTypesPrice = filteredServices.reduce((acc, service) => {
            return acc + service.serviceTypes.reduce((typeSum, typeName) => {
                const typeOption = serviceTypeOptions.find(option => option.name === typeName);
                return typeSum + (typeOption ? typeOption.price : 0);
            }, 0);
        }, 0);

        // Calculate material costs for this service
        const serviceMaterials = getServiceMaterialsByServiceId(service.id);
        const materialCost = serviceMaterials.reduce((matSum, sm) => {
            const material = getMaterialById(sm.materialId);
            return matSum + (material ? material.purchasePrice * sm.quantity : 0);
        }, 0);

        const materialsSellPrice = serviceMaterials.reduce((acc, sm) => {
            const material = getMaterialById(sm.materialId);
            return acc + (material.sellingPrice * sm.quantity);
        }, 0);

        const totalValue = serviceTypesPrice + service.servicePrice + service.pickupDeliveryPrice + materialsSellPrice;

        return sum + (totalValue - materialCost);
    }, 0);
};

const calculateExpensesTotal = (expenses: Expense[], onlyPaid: boolean = false) => {
    const filteredExpenses = onlyPaid ? expenses.filter(e => e.isPaid) : expenses;
    return filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
};

const generateMonthlyFinancialDataHelper = (services: Service[], expenses: Expense[]): MonthlyData[] => {
    const monthlyData: MonthlyData[] = [];
    const currentDate = new Date();

    // Generate data for the last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();

        // Use service.date instead of service.createdAt
        const monthServices = services.filter(service => {
            const serviceDate = new Date(service.date);
            return serviceDate.getMonth() === month && serviceDate.getFullYear() === year;
        });

        const monthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.dueDate);
            return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        });

        const paidServices = monthServices.filter(s => s.paymentStatus === 'paid');
        const revenue = calculateServicesRevenue(paidServices, true);

        // Calculate material costs for paid services
        const materialCosts = paidServices.reduce((sum, service) => {
            const serviceMaterials = getServiceMaterialsByServiceId(service.id);
            return sum + serviceMaterials.reduce((matSum, sm) => {
                const material = getMaterialById(sm.materialId);
                return matSum + (material ? material.purchasePrice * sm.quantity : 0);
            }, 0);
        }, 0);

        // Get service types
        const serviceTypeOptions = getServiceTypes();
        const serviceTypesPrice = paidServices.reduce((acc, service) => {
            return acc + service.serviceTypes.reduce((typeSum, typeName) => {
                const typeOption = serviceTypeOptions.find(option => option.name === typeName);
                return typeSum + (typeOption ? typeOption.price : 0);
            }, 0);
        }, 0);

        const paidExpenses = calculateExpensesTotal(monthExpenses, true);
        const totalExpenses = paidExpenses + materialCosts;

        monthlyData.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            revenue,
            expenses: totalExpenses
        });
    }

    return monthlyData;
};

export function useFinancials() {
    const [financialData, setFinancialData] = useState<FinancialData>(() => {
        const stored = getFinancialData();
        return stored || {
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
                forecastReliability: 'média'
            },
            monthlyData: []
        };
    });

    const updateAccountBalance = (value: number, operation: 'add' | 'subtract') => {
        setFinancialData(prev => {
            const newBalance = operation === 'add'
                ? prev.summary.balance + value
                : prev.summary.balance - value;

            const updatedData = {
                ...prev,
                summary: {
                    ...prev.summary,
                    balance: newBalance
                }
            };

            saveFinancialData(updatedData);
            return updatedData;
        });
    };

    const updateFinancialBalance = (newBalance: number) => {
        setFinancialData(prev => {
            const updatedData = {
                ...prev,
                summary: {
                    ...prev.summary,
                    balance: newBalance
                }
            };

            saveFinancialData(updatedData);
            return updatedData;
        });
    };

    const updateFinancialSummary = (services: Service[], expenses: Expense[]) => {
        setFinancialData(prev => {
            // 1. Preserve current balance
            const currentBalance = prev.summary.balance;

            // 2. Date information
            const today = new Date();
            const month = today.getMonth();
            const year = today.getFullYear();
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;

            // 3. Filter services and expenses
            const thisMonthServices = filterServicesByMonth(services, month, year);
            const thisMonthExpenses = filterExpensesByMonth(expenses, month, year);
            const paidServices = thisMonthServices.filter(s => s.paymentStatus === 'paid');
            //console.log('Paid services this month:', paidServices.length);
            // 4. Revenue and profit calculations
            const monthlyRevenue = calculateServicesRevenue(paidServices, true);
            //console.log('Monthly revenue (paid services):', monthlyRevenue);
            const projectedRevenue = calculateServicesUnPaidPending(thisMonthServices);
            //console.log('Projected revenue (unpaid services):', projectedRevenue);
            const grossProfit = calculateServicesProfit(paidServices, true);

            // Material costs calculations
            const materialCostsThisMonth = thisMonthServices.reduce((sum, service) => {
                const serviceMaterials = getServiceMaterialsByServiceId(service.id);
                return sum + serviceMaterials.reduce((matSum, sm) => {
                    const material = getMaterialById(sm.materialId);
                    return matSum + (material ? material.purchasePrice * sm.quantity : 0);
                }, 0);
            }, 0);

            const materialCostsThisMonthPaid = thisMonthServices
                .filter(service => service.paymentStatus === 'paid')
                .reduce((sum, service) => {
                    const serviceMaterials = getServiceMaterialsByServiceId(service.id);
                    return sum + serviceMaterials.reduce((matSum, sm) => {
                        const material = getMaterialById(sm.materialId);
                        return matSum + (material ? material.purchasePrice * sm.quantity : 0);
                    }, 0);
                }, 0);

            const paidExpenses = calculateExpensesTotal(thisMonthExpenses, true);
            const monthlyExpenses = paidExpenses + materialCostsThisMonthPaid;
            const monthlyProfit = grossProfit - paidExpenses;
            const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

            // 5. Pending payments
            const pendingPayments = thisMonthServices
                .filter(s => s.paymentStatus !== 'paid')
                .reduce((sum, s) => sum + s.totalValue, 0);

            // 6. Next month projections
            const nextServices = filterServicesByMonth(services, nextMonth, nextYear);
            const nextExpenses = filterExpensesByMonth(expenses, nextMonth, nextYear);
            const nextProjectedRevenue = calculateServicesRevenue(nextServices, false);
            const nextProjectedProfit = calculateServicesProfit(nextServices, false) - calculateExpensesTotal(nextExpenses, false);
            const nextProjectedExpenses = calculateExpensesTotal(nextExpenses, false);

            // 7. Total accumulated calculations
            const allPaidServices = services.filter(s => s.paymentStatus === 'paid');
            const totalRevenue = calculateServicesRevenue(allPaidServices, true);
            const totalGrossProfit = calculateServicesProfit(allPaidServices, true);
            const totalPaidExpensesAll = calculateExpensesTotal(expenses, true);
            const totalMaterialCosts = allPaidServices.reduce((sum, service) => {
                const serviceMaterials = getServiceMaterialsByServiceId(service.id);
                return sum + serviceMaterials.reduce((matSum, sm) => {
                    const material = getMaterialById(sm.materialId);
                    return matSum + (material ? material.purchasePrice * sm.quantity : 0);
                }, 0);
            }, 0);
            const totalExpenses = totalPaidExpensesAll + totalMaterialCosts;
            const totalProfit = totalGrossProfit - totalPaidExpensesAll;
            const totalCompleted = services.length;
            const avgServiceValue = totalCompleted > 0 ? totalRevenue / totalCompleted : 0;
            const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
            const totalPending = services
                .filter(s => s.paymentStatus !== 'paid')
                .reduce((sum, s) => sum + s.totalValue, 0);

            // 8. Generate monthly history
            const monthlyData = generateMonthlyFinancialDataHelper(services, expenses);

            // 9. Build new summary
            const newSummary: FinancialSummary = {
                balance: currentBalance,
                monthlyRevenue,
                thismonthRevenuePrev: projectedRevenue,
                monthlyExpenses,
                monthlyProfit,
                profitMargin,
                pendingPayments,
                completedServices: paidServices.length,
                avgServiceValue: paidServices.length > 0
                    ? paidServices.reduce((sum, s) => sum + s.totalValue, 0) / paidServices.length
                    : 0,
                nextMonthProjectedRevenue: nextProjectedRevenue,
                nextMonthProjectedExpenses: nextProjectedExpenses,
                nextMonthProjectedProfit: nextProjectedProfit,
                totalRevenue,
                totalExpenses,
                totalProfit,
                totalAvgServiceValue: avgServiceValue,
                totalProfitMargin: totalMargin,
                totalCompletedServices: totalCompleted,
                currentMonthProjectedRevenue: calculateServicesRevenue(thisMonthServices, false),
                currentMonthProjectedExpenses: calculateExpensesTotal(thisMonthExpenses, false) + materialCostsThisMonth,
                currentMonthProjectedProfit: calculateServicesProfit(thisMonthServices, false) - calculateExpensesTotal(thisMonthExpenses, false),
                totalPendingPayments: totalPending,
                forecastReliability: 'média' as const,
            };

            // 10. Save and return
            const updatedFinancialData = { summary: newSummary, monthlyData };
            saveFinancialData(updatedFinancialData);
            console.log('Financial summary updated, balance preserved:', currentBalance);
            console.log('Monthly revenue (paid services):', monthlyRevenue);
            console.log('Total pending payments:', totalPending);

            return updatedFinancialData;
        });
    };

    const generateMonthlyFinancialData = (services: Service[], expenses: Expense[]): MonthlyData[] => {
        return generateMonthlyFinancialDataHelper(services, expenses);
    };

    return {
        financialData,
        updateAccountBalance,
        updateFinancialBalance,
        updateFinancialSummary,
        generateMonthlyFinancialData
    };
}

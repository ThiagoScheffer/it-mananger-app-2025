
// ABOUTME: Hook for managing cash flow forecasting functionality
// ABOUTME: Combines expected revenues and planned expenses for financial planning

import { useState, useMemo } from 'react';
import { CashFlowItem, CashFlowPeriod, CashFlowForecast } from '@/types/cashFlow';
import { useAppContext } from '@/context/AppContext';
import { InstallmentService } from '@/services/InstallmentService';
import { getInstallments } from '@/utils/storageManager';
import { addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function useCashFlow() {
  const { services, expenses } = useAppContext();

  const generateCashFlowForecast = (monthsAhead: number = 6): CashFlowForecast => {
    const periods: CashFlowPeriod[] = [];
    const today = new Date();
    const installments = getInstallments();

    for (let i = 0; i < monthsAhead; i++) {
      const periodStart = startOfMonth(addMonths(today, i));
      const periodEnd = endOfMonth(addMonths(today, i));
      
      const items: CashFlowItem[] = [];

      // Add expected revenues from pending services (non-installment)
      services
        .filter(service => service.paymentStatus !== 'paid' && !service.isInstallmentPayment)
        .forEach(service => {
          const serviceDate = parseISO(service.date);
          if (isWithinInterval(serviceDate, { start: periodStart, end: periodEnd })) {
            items.push({
              id: `revenue-${service.id}`,
              type: 'revenue',
              amount: service.totalValue,
              date: service.date,
              description: `Service: ${service.name}`,
              category: 'Service Revenue',
              status: service.paymentStatus === 'pending' ? 'planned' : 'confirmed',
              referenceId: service.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });

      // Add expected revenues from pending installments
      installments
        .filter(installment => installment.status === 'pending')
        .forEach(installment => {
          const dueDate = parseISO(installment.dueDate);
          if (isWithinInterval(dueDate, { start: periodStart, end: periodEnd })) {
            const service = services.find(s => s.id === installment.serviceId);
            items.push({
              id: `installment-${installment.id}`,
              type: 'revenue',
              amount: installment.amount,
              date: installment.dueDate,
              description: `Installment: ${service?.name || 'Unknown Service'}`,
              category: 'Installment Revenue',
              status: 'planned',
              referenceId: installment.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });

      // Add planned expenses
      expenses
        .filter(expense => !expense.isPaid)
        .forEach(expense => {
          const dueDate = parseISO(expense.dueDate);
          if (isWithinInterval(dueDate, { start: periodStart, end: periodEnd })) {
            items.push({
              id: `expense-${expense.id}`,
              type: 'expense',
              amount: expense.value,
              date: expense.dueDate,
              description: expense.description,
              category: expense.category,
              status: 'planned',
              referenceId: expense.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });

      const totalRevenue = items.filter(item => item.type === 'revenue').reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = items.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);

      periods.push({
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        totalRevenue,
        totalExpenses,
        netCashFlow: totalRevenue - totalExpenses,
        items
      });
    }

    const totalForecast = periods.reduce(
      (acc, period) => ({
        revenue: acc.revenue + period.totalRevenue,
        expenses: acc.expenses + period.totalExpenses,
        netFlow: acc.netFlow + period.netCashFlow
      }),
      { revenue: 0, expenses: 0, netFlow: 0 }
    );

    return {
      periods,
      totalForecast
    };
  };

  const getInstallmentCashFlow = (monthsAhead: number = 12) => {
    const installments = getInstallments();
    const periods: { month: string; amount: number; count: number }[] = [];
    const today = new Date();

    for (let i = 0; i < monthsAhead; i++) {
      const periodStart = startOfMonth(addMonths(today, i));
      const periodEnd = endOfMonth(addMonths(today, i));
      
      const monthInstallments = installments.filter(installment => {
        if (installment.status !== 'pending') return false;
        const dueDate = parseISO(installment.dueDate);
        return isWithinInterval(dueDate, { start: periodStart, end: periodEnd });
      });

      periods.push({
        month: periodStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        amount: monthInstallments.reduce((sum, i) => sum + i.amount, 0),
        count: monthInstallments.length
      });
    }

    return periods;
  };

  return {
    generateCashFlowForecast,
    getInstallmentCashFlow
  };
}

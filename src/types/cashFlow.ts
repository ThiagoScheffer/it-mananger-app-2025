
// ABOUTME: Type definitions for cash flow forecasting system
// ABOUTME: Defines interfaces for expected revenues and planned expenses tracking

interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashFlowItem extends BaseEntity {
  type: 'revenue' | 'expense';
  amount: number;
  date: string; // Expected date
  description: string;
  category: string;
  status: 'planned' | 'confirmed' | 'completed';
  referenceId?: string; // Service ID, Expense ID, etc.
}

export interface CashFlowPeriod {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  items: CashFlowItem[];
}

export interface CashFlowForecast {
  periods: CashFlowPeriod[];
  totalForecast: {
    revenue: number;
    expenses: number;
    netFlow: number;
  };
}

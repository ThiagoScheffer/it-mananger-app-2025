
export interface FinancialSummary {
  balance: number;
    monthlyRevenue: number;
    thismonthRevenuePrev: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  profitMargin: number;
  pendingPayments: number;
  completedServices: number;
  avgServiceValue: number;
  // New projection fields
  nextMonthProjectedRevenue: number;
  nextMonthProjectedExpenses: number;
  nextMonthProjectedProfit: number;
  // New total summary fields
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalAvgServiceValue: number;
  totalProfitMargin: number;
  totalCompletedServices: number;
  // Current month projection fields
  currentMonthProjectedRevenue: number;
  currentMonthProjectedExpenses: number;
  currentMonthProjectedProfit: number;
  // New total pending payments
  totalPendingPayments: number;
  // Forecast reliability
  forecastReliability: string;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface Report {
  title: string;
  period: string;
  grossRevenue: number;
  costs: number;
  grossProfit: number;
  operationalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface FinancialData {
    summary: FinancialSummary;
    monthlyData: MonthlyData[];
}

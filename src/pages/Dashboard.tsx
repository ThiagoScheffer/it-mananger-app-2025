import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/ui/status-badge";
import {
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    DollarSign,
    Calendar,
    AlertTriangle,
    Clock,
    CheckCircle,
    ArrowUpDown
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Service, Installment } from "@/types";
import { getServicesWithClientNames } from '@/utils/dataHelpers';
import { useFinancials, getRemainingInstallments, getPaidAmount, getInstallmentPaidAmount } from '@/hooks/useFinancials';

export default function Dashboard() {
    const { services, financialData, updateFinancialSummary, expenses } = useAppContext();
    const initialLoadRef = useRef(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'days', direction: 'asc' });

    useEffect(() => {
        if (!initialLoadRef.current) {
            updateFinancialSummary();
            initialLoadRef.current = true;
        }
    }, [updateFinancialSummary]);

    // Get the last 5 services
    const latestServices = [...services]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    // Get services with different payment statuses
    const pendingDueServices = services.filter(service =>
        (service.paymentStatus === 'unpaid' || service.paymentStatus === 'partial') &&
        new Date(service.date) >= new Date()
    );

    const overdueServices = services.filter(service =>
        (service.paymentStatus === 'unpaid' || service.paymentStatus === 'partial') &&
        new Date(service.date) < new Date()
    );
    // Apply sorting
    const sortedPendingServices = [...pendingDueServices].sort((a, b) => {
        const daysA = Math.ceil((new Date(a.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const daysB = Math.ceil((new Date(b.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return sortConfig.direction === 'asc' ? daysA - daysB : daysB - daysA;
    });

    const sortedOverdueServices = [...overdueServices].sort((a, b) => {
        const daysA = Math.ceil((new Date().getTime() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24));
        const daysB = Math.ceil((new Date().getTime() - new Date(b.date).getTime()) / (1000 * 60 * 60 * 24));
        return sortConfig.direction === 'asc' ? daysA - daysB : daysB - daysA;
    });

    // Get services with different payment statuses
    const pendingDueExpenses = expenses.filter(expense =>
        !expense.isPaid &&
        new Date(expense.dueDate) >= new Date()
    );

    const overdueExpenses = expenses.filter(expense =>
        !expense.isPaid &&
        new Date(expense.dueDate) < new Date()
    );

    // Sort function
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Apply sorting
    const sortedPendingExpenses = [...pendingDueExpenses].sort((a, b) => {
        const daysA = Math.ceil((new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const daysB = Math.ceil((new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return sortConfig.direction === 'asc' ? daysA - daysB : daysB - daysA;
    });

    const sortedOverdueExpenses = [...overdueExpenses].sort((a, b) => {
        const daysA = Math.ceil((new Date().getTime() - new Date(a.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        const daysB = Math.ceil((new Date().getTime() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return sortConfig.direction === 'asc' ? daysA - daysB : daysB - daysA;
    });

    // Prepare data for charts
    const monthlyChartData = financialData.monthlyData.map(item => ({
        ...item,
        profit: item.revenue - item.expenses
    }));

    // Using the AppContext
    function useServiceClientName(service: Service): string {
        const { clients } = useAppContext(); // Assuming you have useAppContext hook
        const client = clients.find(c => c.id === service.clientId);
        return client?.name || 'Unknown Client';
    }
    // Filter services by date (e.g., last 30 days) before getting the latest 5
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrichedLatestServices = getServicesWithClientNames(
        services
            .filter(service => new Date(service.date) >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
    ).map(service => {
        let displayValue = service.totalValue;
        let remainingInstallments: Installment[] = [];

        if (service.paymentStatus === 'partial') {
            remainingInstallments = getRemainingInstallments(service.id);
            const paidAmount = getInstallmentPaidAmount(service.id);
            displayValue = service.totalValue - paidAmount;
        }

        return {
            ...service,
            displayValue,
            remainingInstallments
        };
    });


    const enrichedOverdueServices = getServicesWithClientNames(sortedOverdueServices).map(service => {
        let displayValue = service.totalValue;
        let remainingInstallments: Installment[] = [];

        if (service.paymentStatus === 'partial') {
            remainingInstallments = getRemainingInstallments(service.id);
            const paidAmount = getInstallmentPaidAmount(service.id);
            displayValue = service.totalValue - paidAmount;
        }

        return {
            ...service,
            displayValue,
            remainingInstallments
        };
    });
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex items-center space-x-2 text-2xl text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard
                    title="Revenue this Month"
                    value={`R$ ${financialData.summary.monthlyRevenue.toFixed(2)}`}
                    footer={`${financialData.summary.completedServices} services completed`}
                    icon={<ArrowUpRight className="h-5 w-5 text-green-600" />}
                    valueColor="text-green-700"
                    className="border-l-4 border-green-500"
                />

                <DashboardCard
                    title="Expenses this Month"
                    value={`R$ ${financialData.summary.monthlyExpenses.toFixed(2)}`}
                    footer="Operational costs"
                    icon={<ArrowDownRight className="h-5 w-5 text-red-600" />}
                    valueColor="text-red-600"
                    className="border-l-4 border-red-500"
                />

                <DashboardCard
                    title="Profit this Month"
                    value={`R$ ${financialData.summary.monthlyProfit.toFixed(2)}`}
                    footer={`${financialData.summary.profitMargin.toFixed(1)}% margin`}
                    icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
                    valueColor="text-blue-700"
                    className="border-l-4 border-blue-500"
                />

                <DashboardCard
                    title="Account Balance"
                    value={`R$ ${financialData.summary.balance.toFixed(2)}`}
                    footer="Available balance"
                    icon={<DollarSign className="h-5 w-5 text-amber-600" />}
                    valueColor="text-amber-700"
                    className="border-l-4 border-amber-500"
                />
            </div>

            {/* Charts and Overdue Section */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                <span>Monthly Financial Overview</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: '#6b7280' }}
                                            stroke="#9ca3af"
                                        />
                                        <YAxis
                                            tick={{ fill: '#6b7280' }}
                                            stroke="#9ca3af"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                borderColor: '#e5e7eb',
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="revenue"
                                            name="Revenue"
                                            fill="#3B82F6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="expenses"
                                            name="Expenses"
                                            fill="#EF4444"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="profit"
                                            name="Profit"
                                            fill="#10B981"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Services and Overdue Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span>Recent Services</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left">
                                            <th className="p-3 font-medium text-gray-700">Client</th>
                                            <th className="p-3 font-medium text-gray-700">Service</th>
                                            <th className="p-3 font-medium text-gray-700">Date</th>
                                            <th className="p-3 font-medium text-gray-700">Value</th>
                                            <th className="p-3 font-medium text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {enrichedLatestServices.map(service => (
                                            <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-3 text-gray-800">{service.clientName}</td>
                                                <td className="p-3 text-gray-800">{service.name}</td>
                                                <td className="p-3 text-gray-600">{new Date(service.date).toLocaleDateString()}</td>
                                                <td className="p-3 font-medium text-gray-800">
                                                    R$ {service.totalValue.toFixed(2)}
                                                    {service.paymentStatus === 'partial' && (
                                                        <>
                                                            <span className="text-xs text-purple-600 ml-1">(Partial)</span>
                                                            {service.remainingInstallments.length > 0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    ({service.remainingInstallments.length} installments remaining - R$ {(service.displayValue / service.remainingInstallments.length).toFixed(2)})
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <StatusBadge status={service.paymentStatus} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <span>Pending Expenses</span>
                                </CardTitle>
                                <button
                                    onClick={() => requestSort('days')}
                                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowUpDown className="h-4 w-4 mr-1" />
                                    Sort
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {sortedPendingExpenses.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedPendingExpenses.map(expense => {
                                        const daysRemaining = Math.ceil((new Date(expense.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div
                                                key={expense.id}
                                                className="flex items-center justify-between p-3 rounded-md bg-amber-50 hover:bg-opacity-80 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800">{expense.description}</p>
                                                    <p className="text-sm text-gray-600 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Due in: {new Date(expense.dueDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        R$ {expense.value.toFixed(2)}
                                                    </p>
                                                    <p className={`text-xs ${daysRemaining <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {daysRemaining} days remaining
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-500 space-y-2">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                    <span>No pending expenses</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <span>Overdue Payments</span>
                            </CardTitle>
                            <button
                                onClick={() => requestSort('days')}
                                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ArrowUpDown className="h-4 w-4 mr-1" />
                                Sort
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sortedOverdueServices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-sm md:text-base">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left">
                                            <th className="p-3 font-medium text-gray-700 whitespace-nowrap">Client</th>
                                            <th className="p-3 font-medium text-gray-700 whitespace-nowrap">Service</th>
                                            <th className="p-3 font-medium text-gray-700 whitespace-nowrap">Date</th>
                                            <th className="p-3 font-medium text-gray-700 whitespace-nowrap">Value</th>
                                            <th className="p-3 font-medium text-gray-700 whitespace-nowrap">Status</th>
                                            <th className="p-3 font-medium text-gray-700 whitespace-nowrap">Days</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {enrichedOverdueServices.map(service => {
                                            const daysOverdue = Math.ceil((new Date().getTime() - new Date(service.date).getTime()) / (1000 * 60 * 60 * 24));

                                            return (
                                                <tr key={service.id} className="hover:bg-red-50 transition-colors">
                                                    <td className="p-3 text-gray-800 whitespace-nowrap truncate max-w-[120px] md:max-w-[150px]">
                                                        {service.clientName}
                                                    </td>
                                                    <td className="p-3 text-gray-800 whitespace-nowrap truncate max-w-[150px] md:max-w-[200px]">
                                                        {service.name}
                                                    </td>
                                                    <td className="p-3 text-gray-600 whitespace-nowrap">
                                                        {new Date(service.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 font-medium text-red-700 whitespace-nowrap">
                                                        {service.paymentStatus === 'partial' ? (
                                                            <div className="flex flex-col">
                                                                <span>R$ {service.displayValue.toFixed(2)}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {service.remainingInstallments.length} installment(s) remaining - R$ {(service.displayValue / service.remainingInstallments.length).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span>R$ {service.totalValue.toFixed(2)}</span>
                                                        )}
                                                        {service.paymentStatus === 'partial' && (
                                                            <span className="text-xs text-purple-600 ml-1">(Partial)</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap">
                                                        <StatusBadge status={service.paymentStatus} variant="destructive" />
                                                    </td>
                                                    <td className="p-3 text-red-600 font-medium whitespace-nowrap">
                                                        {daysOverdue}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500 space-y-2">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <span>No overdue payments</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Pencil, DollarSign, ArrowDownRight, ArrowUpRight, RefreshCw, TrendingUp, Calendar } from "lucide-react";
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
import ExpenseDialog from "@/components/dialogs/ExpenseDialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateForecastWithReliability } from "@/utils/forecastHelpers";

export default function FinancialPage() {
  const { financialData, updateFinancialSummary, services, updateFinancialBalance } = useAppContext();
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(financialData.summary.balance.toString());
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const initialLoadRef = useRef(false);
  
  // Update newBalance whenever financialData changes
  useEffect(() => {
    setNewBalance(financialData.summary.balance.toString());
  }, [financialData.summary.balance]);
  
  // Force update only when component mounts
  useEffect(() => {
    // Only update on initial render to avoid infinite loop
    if (!initialLoadRef.current) {
      updateFinancialSummary();
      initialLoadRef.current = true;
      console.log("FinancialPage: Initial financial data update");
    }
  }, [updateFinancialSummary]);
  
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBalance(e.target.value);
  };
  
  const saveBalance = () => {
    const updatedBalance = parseFloat(newBalance) || 0;
    
    // Use the context method to update and persist the balance
    if (updateFinancialBalance) {
      updateFinancialBalance(updatedBalance);
      setEditingBalance(false);
      toast.success("Saldo atualizado com sucesso");
    } else {
      // Fallback method
      financialData.summary.balance = updatedBalance;
      setEditingBalance(false);
      updateFinancialSummary();
      toast.success("Saldo atualizado com sucesso");
    }
  };
  
  const handleRefreshData = () => {
    updateFinancialSummary();
    toast.success("Dados financeiros atualizados");
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  // Calculate total pending payments (all services with pending status)
  const totalPendingPayments = services
    .filter(s => s.paymentStatus === "pending" || s.paymentStatus === "partial")
    .reduce((sum, service) => sum + service.totalValue, 0);

  // Generate forecast based on historical data
  const getMonthlyRevenueForecast = () => {
    // Extract last 12 months of revenue data for forecasting
    const revenueData = [...financialData.monthlyData]
      .slice(-12)
      .map(item => item.revenue);
      
    return generateForecastWithReliability(revenueData);
  };

  const getMonthlyExpensesForecast = () => {
    // Extract last 12 months of expense data for forecasting  
    const expenseData = [...financialData.monthlyData]
      .slice(-12)
      .map(item => item.expenses);
      
    return generateForecastWithReliability(expenseData);
  };

  // Get the forecasts
  const revenueForecast = getMonthlyRevenueForecast();
  const expensesForecast = getMonthlyExpensesForecast();
  const profitForecast = {
    forecast: revenueForecast.forecast - expensesForecast.forecast,
    reliability: revenueForecast.reliability === 'alta' && expensesForecast.reliability === 'alta' 
      ? 'alta' 
      : 'média'
  };

    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' }).toLocaleUpperCase();


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="flex space-x-2">
          <Button className="anibtn-drawstroke" onClick={() => setExpenseDialogOpen(true)}>+ Nova Despesa</Button>
          <Button className="anibtn-drawstroke" variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar dados
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Saldo em Conta</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setEditingBalance(!editingBalance)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-muted-foreground text-sm mb-2">Conta Principal</div>
          
          {editingBalance ? (
            <div className="flex space-x-2 items-end">
              <div className="flex-grow">
                <Input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={handleBalanceChange}
                  className="text-2xl font-bold"
                />
              </div>
              <Button onClick={saveBalance}>Salvar</Button>
            </div>
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(financialData.summary.balance)}</div>
          )}
          
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex justify-between items-center mb-1">
              <span>Receitas do Mês:</span>
              <span className="text-green-600">+{formatCurrency(financialData.summary.monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span>Despesas do Mês:</span>
              <span className="text-red-500">-{formatCurrency(financialData.summary.monthlyExpenses)}</span>
            </div>
          </div>
        </div>
        
        <DashboardCard
          title={"Receitas do Mês [ " + month + " ]"}
          value={formatCurrency(financialData.summary.monthlyRevenue)}
          footer="Valores recebidos"
          icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
          valueColor="text-green-600"
        />
        
        <DashboardCard
          title={"Despesas do Mês [ " + month + " ]"}
          value={formatCurrency(financialData.summary.monthlyExpenses)}
          footer="Custos e materiais"
          icon={<ArrowDownRight className="h-4 w-4 text-red-500" />}
          valueColor="text-red-500"
        />
      </div>

      {/* New section for current month's financial forecast */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Previsão para o Mês Atual</h2>
            <div className="text-sm text-muted-foreground">Baseado em serviços e despesas</div>
          </div>
          <div className="bg-blue-50 p-2 rounded-full">
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-sm text-blue-700 mb-1">Receitas Previstas</div>
            <div className="text-xl font-bold text-blue-800">
                          {formatCurrency(financialData.summary.thismonthRevenuePrev)}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-md">
            <div className="text-sm text-red-700 mb-1">Despesas Previstas</div>
            <div className="text-xl font-bold text-red-800">
                          {formatCurrency(financialData.summary.currentMonthProjectedExpenses)}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <div className="text-sm text-green-700 mb-1">Lucro Estimado</div>
            <div className="text-xl font-bold text-green-800">
                          {formatCurrency(financialData.summary.currentMonthProjectedProfit)}
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Projeção baseada em dados atuais
            </div>
          </div>
        </div>
      </div>
      
      {/* Updated next month projections section with forecasting */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Previsão para o Próximo Mês</h2>
            <div className="text-sm text-muted-foreground">Baseado em dados históricos (Suavização Exponencial)</div>
          </div>
          <div className="bg-blue-50 p-2 rounded-full">
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-sm text-blue-700 mb-1">Receitas Previstas</div>
            <div className="text-xl font-bold text-blue-800">
              {formatCurrency(revenueForecast.forecast)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Confiabilidade: {revenueForecast.reliability}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-md">
            <div className="text-sm text-red-700 mb-1">Despesas Previstas</div>
            <div className="text-xl font-bold text-red-800">
              {formatCurrency(expensesForecast.forecast)}
            </div>
            <div className="text-xs text-red-600 mt-1">
              Confiabilidade: {expensesForecast.reliability}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <div className="text-sm text-green-700 mb-1">Lucro Estimado</div>
            <div className="text-xl font-bold text-green-800">
              {formatCurrency(profitForecast.forecast)}
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Confiabilidade: {profitForecast.reliability}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Histórico Financeiro</h2>
        <div className="text-sm text-muted-foreground mb-4">Últimos 12 meses</div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={financialData.monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" name="Receitas" fill="#3B82F6" />
              <Bar dataKey="expenses" name="Despesas" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current month financial summary - kept from the original */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
          <div className="text-sm text-muted-foreground mb-4">Mês atual</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-600">Receitas:</div>
                <div className="text-right font-medium">{formatCurrency(financialData.summary.monthlyRevenue)}</div>
                
                <div className="text-gray-600">Despesas:</div>
                <div className="text-right font-medium">{formatCurrency(financialData.summary.monthlyExpenses)}</div>
                
                <div className="text-gray-600 font-medium">Lucro:</div>
                              <div className="text-right font-medium text-green-600">{formatCurrency(financialData.summary.monthlyProfit)}</div>
                
                <div className="text-gray-600 text-yellow-500 font-medium">Valores Pendentes:</div>
                <div className="text-right font-medium text-yellow-500">{formatCurrency(financialData.summary.pendingPayments)}</div>
              </div>
            </div>
            
            <div className="border-l pl-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-600">Serviços realizados:</div>
                <div className="text-right font-medium">{financialData.summary.completedServices}</div>
                
                <div className="text-gray-600">Média por serviço:</div>
                <div className="text-right font-medium">{formatCurrency(financialData.summary.avgServiceValue)}</div>
                
                <div className="text-gray-600 font-medium">Margem de lucro:</div>
                <div className="text-right font-medium">{financialData.summary.profitMargin.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="h-24 w-24 mx-auto text-green-500 opacity-20" />
                <div className="mt-2 text-sm text-muted-foreground">
                  Controle financeiro completo
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* New total financial summary with total pending payments */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Resumo Financeiro Total</h2>
          <div className="text-sm text-muted-foreground mb-4">Todos os períodos</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-600">Receitas Totais:</div>
                <div className="text-right font-medium">{formatCurrency(financialData.summary.totalRevenue)}</div>
                
                <div className="text-gray-600">Despesas Totais:</div>
                <div className="text-right font-medium">{formatCurrency(financialData.summary.totalExpenses)}</div>
                
                <div className="text-gray-600 font-medium">Lucro Total:</div>
                <div className="text-right font-medium text-green-600">{formatCurrency(financialData.summary.totalProfit)}</div>
                
                <div className="text-gray-600 font-medium text-yellow-500">Valores Pendentes Totais:</div>
                <div className="text-right font-medium text-yellow-500">{formatCurrency(totalPendingPayments)}</div>
              </div>
            </div>
            
            <div className="border-l pl-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-600">Total de serviços:</div>
                <div className="text-right font-medium">{financialData.summary.totalCompletedServices}</div>
                
                <div className="text-gray-600">Média total por serviço:</div>
                <div className="text-right font-medium">{formatCurrency(financialData.summary.totalAvgServiceValue)}</div>
                
                <div className="text-gray-600 font-medium">Margem de lucro total:</div>
                <div className="text-right font-medium">{financialData.summary.totalProfitMargin.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-24 w-24 mx-auto text-blue-500 opacity-20" />
                <div className="mt-2 text-sm text-muted-foreground">
                  Visão financeira completa
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ExpenseDialog 
        open={expenseDialogOpen} 
        setOpen={setExpenseDialogOpen} 
      />
    </div>
  );
}

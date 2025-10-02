
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";
import MaterialsPage from "./pages/MaterialsPage";
import OrdersPage from "./pages/OrdersPage";
import TechniciansPage from "./pages/TechniciansPage";
import ServicesPage from "./pages/ServicesPage";
import EquipmentPage from "./pages/EquipmentPage";
import FinancialPage from "./pages/FinancialPage";
import ExpensesPage from "./pages/ExpensesPage";
import ToolsPage from "./pages/ToolsPage";
import BackupPage from "./pages/BackupPage";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/cliente" element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <ClientPortalPage />
                </ProtectedRoute>
              } />
              
              <Route element={
                <ProtectedRoute allowedRoles={["admin", "technician"]}>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/materiais" element={<MaterialsPage />} />
                <Route path="/encomendas" element={<OrdersPage />} />
                <Route path="/tecnicos" element={<TechniciansPage />} />
                <Route path="/equipamentos" element={<EquipmentPage />} />
                <Route path="/servicos" element={<ServicesPage />} />
                <Route path="/financeiro" element={<FinancialPage />} />
                <Route path="/vencimentos" element={<ExpensesPage />} />
                <Route path="/agenda" element={<CalendarPage />} />
                <Route path="/ferramentas" element={<ToolsPage />} />
                <Route path="/backup" element={<BackupPage />} />
                
                {/* Admin routes */}
                <Route path="/admin/usuarios" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Filter, History, ChevronDown, ChevronUp, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import ServiceDialog from "@/components/dialogs/ServiceDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PaymentStatus, ServiceStatus, Service } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";
import { getInstallmentsByServiceId, getClientForService, getEquipmentForService, getTechniciansForService, getServiceMaterialsByServiceId, getMaterialById } from '@/utils/dataHelpers';

type SortDirection = "asc" | "desc" | null;
type SortField = "name" | "paymentStatus" | null;

export default function ServicesPage() {
  const { services, clients, equipments, serviceTechnicians, technicians, deleteService, updateFinancialSummary, getServiceHistory, getTypeOptions } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<typeof services[0] | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | undefined>(undefined);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Filter states for payment and service status
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<Record<PaymentStatus, boolean>>({
    paid: true,
    pending: true,
    unpaid: true,
    partial: true
  });

  const [serviceStatusFilter, setServiceStatusFilter] = useState<Record<ServiceStatus, boolean>>({
    completed: true,
    inProgress: true,
    pending: true,
    cancelled: true
  });

  const [showFilters, setShowFilters] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortField, setSortField] = useState<SortField>(null);

  const toggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
    } else {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") {
        setSortField(null);
      }
    }
  };

  const calculateTotalValueForService = (service: Service) => {
    // Get service types prices
    const serviceTypeOptions = getTypeOptions();
    const serviceTypesPrice = (service.serviceTypes || []).reduce((acc, typeName) => {
      const typeOption = serviceTypeOptions.find(option => option.name === typeName);
      return acc + (typeOption?.price || 0);
    }, 0);

     //console.log("Service Types Price:", serviceTypesPrice);
    // Calculate materials selling price
    const serviceMaterials = getServiceMaterialsByServiceId(service.id);
    const materialsSellPrice = serviceMaterials.reduce((acc, sm) => {
      const material = getMaterialById(sm.materialId);
      return acc + (material ? material.sellingPrice * sm.quantity : 0);
    }, 0);

    return serviceTypesPrice + service.servicePrice + service.pickupDeliveryPrice + materialsSellPrice;
  };

  const calculateROIForService = (service: Service) => {
    const totalValue = calculateTotalValueForService(service);
    
    // Calculate materials cost (purchase price)
    const serviceMaterials = getServiceMaterialsByServiceId(service.id);
    const materialsCost = serviceMaterials.reduce((acc, sm) => {
      const material = getMaterialById(sm.materialId);
      return acc + (material ? material.purchasePrice * sm.quantity : 0);
    }, 0);

    return totalValue - materialsCost;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddService = () => {
    setEditingService(undefined);
    setDialogOpen(true);
  };

  const handleEditService = (service: typeof services[0]) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete);
      // Force update financial summary after deletion
      updateFinancialSummary();
      toast.success("Serviço excluído com sucesso");
      setDeleteDialogOpen(false);
    }
  };

  const handlePaymentStatusFilterChange = (status: PaymentStatus) => {
    setPaymentStatusFilter(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const handleServiceStatusFilterChange = (status: ServiceStatus) => {
    setServiceStatusFilter(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const toggleServiceHistory = (serviceId: string) => {
    if (expandedServiceId === serviceId) {
      setExpandedServiceId(null);
    } else {
      setExpandedServiceId(serviceId);
    }
  };

  const filteredServices = services
    .filter(service => {
      const searchTermLower = searchQuery.toLowerCase();
      const dateString = new Date(service.date).toLocaleDateString('pt-BR');

      return (
        service.name.toLowerCase().includes(searchTermLower) ||
        (getClientForService(service, clients)?.name || '').toLowerCase().includes(searchTermLower) ||
        service.description.toLowerCase().includes(searchTermLower) ||
        dateString.includes(searchTermLower)
      );
    })
    .filter(service => paymentStatusFilter[service.paymentStatus])
    .filter(service => serviceStatusFilter[service.serviceStatus])
    .sort((a, b) => {
      if (!sortField || !sortDirection) {
        // Ordenar por data decrescente (mais recente primeiro) ao abrir a página
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      const valA = a[sortField].toLowerCase();
      const valB = b[sortField].toLowerCase();

      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

  // Helper function to find related services by client and equipment
  const getRelatedServices = (service: Service): Service[] => {
    if (!service || !service.clientId) return [];

    if (service.equipmentId) {
      // Get services for the same equipment
      return getServiceHistory(service.clientId, service.equipmentId)
        .filter(s => s.id !== service.id); // Exclude the current service
    } else {
      // Get all client services if no specific equipment
      return getServiceHistory(service.clientId, "")
        .filter(s => s.id !== service.id); // Exclude the current service
    }
  };

  // Count services by payment status
  const paidCount = services.filter(s => s.paymentStatus === 'paid').length;
  const pendingCount = services.filter(s => s.paymentStatus === 'pending').length;
  const unpaidCount = services.filter(s => s.paymentStatus === 'unpaid').length;
  const partialCount = services.filter(s => s.paymentStatus === 'partial').length;

  // Calculate total values
  const totalValue = services.reduce((sum, s) => sum + s.totalValue, 0);
  const paidValue = services
    .filter(s => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.totalValue, 0);
  const pendingValue = services
    .filter(s => s.paymentStatus === 'pending')
    .reduce((sum, s) => sum + s.totalValue, 0);
  const partialValue = services
  .filter(s => s.paymentStatus === 'partial')
  .reduce((sum, s) => {
    const remainingAmount = (getInstallmentsByServiceId(s.id) || [])
      .filter(inst => inst.status !== "paid")  // only unpaid installments
      .reduce((instSum, inst) => instSum + inst.amount, 0);

    return sum + remainingAmount;
  }, 0);
  // Calculate unpaid value
  const unpaidValue = services
    .filter(s => s.paymentStatus === 'unpaid')
    .reduce((sum, s) => sum + s.totalValue, 0);

  return (
    <div className="w-full max-w-[100vw] overflow-hidden px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Button className="anibtn-drawstroke" onClick={handleAddService}>+ Novo Serviço</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 md:p-6 max-w-full overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">Gerenciamento de Serviços</h2>

        <div className="mb-6 flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="relative flex-grow">
            <Input
              placeholder="Buscar por nome, cliente, data (DD/MM/AAAA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <Button
            variant="outline"
            className="flex gap-2 items-center"
            onClick={() => toggleSort('paymentStatus')}
          >
            {sortField === 'paymentStatus' && sortDirection === 'asc' ? (
              <ArrowUpAZ className="h-4 w-4" />
            ) : sortField === 'paymentStatus' && sortDirection === 'desc' ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowUpAZ className="h-4 w-4 text-gray-400" />
            )}
            <span>{isMobile ? "" : "Por Status Pag."}</span>
          </Button>
          <Button
            variant="outline"
            className="flex gap-2 items-center"
            onClick={() => toggleSort('name')}
          >
            {sortField === 'name' && sortDirection === 'asc' ? (
              <ArrowUpAZ className="h-4 w-4" />
            ) : sortField === 'name' && sortDirection === 'desc' ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowUpAZ className="h-4 w-4 text-gray-400" />
            )}
            <span>{isMobile ? "" : "Por Nome"}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            {isMobile ? "" : "Filtros"} {showFilters ? '▲' : '▼'}
          </Button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 border rounded-md bg-gray-50 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Status de Pagamento</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox
                      id="filter-paid"
                      checked={paymentStatusFilter.paid}
                      onCheckedChange={() => handlePaymentStatusFilterChange('paid')}
                      className="border-green-500 data-[state=checked]:bg-green-500"
                    />
                    <label htmlFor="filter-paid" className="ml-2 flex items-center">
                      <StatusBadge status="paid" className="ml-2" />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      id="filter-pending"
                      checked={paymentStatusFilter.pending}
                      onCheckedChange={() => handlePaymentStatusFilterChange('pending')}
                      className="border-yellow-500 data-[state=checked]:bg-yellow-500"
                    />
                    <label htmlFor="filter-pending" className="ml-2 flex items-center">
                      <StatusBadge status="pending" className="ml-2" />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      id="filter-partial"
                      checked={paymentStatusFilter.partial}
                      onCheckedChange={() => handlePaymentStatusFilterChange('partial')}
                      className="border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <label htmlFor="filter-partial" className="ml-2 flex items-center">
                      <StatusBadge status="partial" className="ml-2" />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      id="filter-unpaid"
                      checked={paymentStatusFilter.unpaid}
                      onCheckedChange={() => handlePaymentStatusFilterChange('unpaid')}
                      className="border-red-500 data-[state=checked]:bg-red-500"
                    />
                    <label htmlFor="filter-unpaid" className="ml-2 flex items-center">
                      <StatusBadge status="unpaid" className="ml-2" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Status do Serviço</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox
                      id="filter-completed"
                      checked={serviceStatusFilter.completed}
                      onCheckedChange={() => handleServiceStatusFilterChange('completed')}
                      className="border-green-500 data-[state=checked]:bg-green-500"
                    />
                    <label htmlFor="filter-completed" className="ml-2 flex items-center">
                      <StatusBadge status="completed" className="ml-2" />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      id="filter-inProgress"
                      checked={serviceStatusFilter.inProgress}
                      onCheckedChange={() => handleServiceStatusFilterChange('inProgress')}
                      className="border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <label htmlFor="filter-inProgress" className="ml-2 flex items-center">
                      <StatusBadge status="inProgress" className="ml-2" />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      id="filter-servicesPending"
                      checked={serviceStatusFilter.pending}
                      onCheckedChange={() => handleServiceStatusFilterChange('pending')}
                      className="border-yellow-500 data-[state=checked]:bg-yellow-500"
                    />
                    <label htmlFor="filter-servicesPending" className="ml-2 flex items-center">
                      <StatusBadge status="pending" className="ml-2" />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      id="filter-cancelled"
                      checked={serviceStatusFilter.cancelled}
                      onCheckedChange={() => handleServiceStatusFilterChange('cancelled')}
                      className="border-gray-500 data-[state=checked]:bg-gray-500"
                    />
                    <label htmlFor="filter-cancelled" className="ml-2 flex items-center">
                      <StatusBadge status="cancelled" className="ml-2" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                {/* Optimized column headers */}
                <th className="w-[8%] min-w-[80px] p-2 text-xs sm:text-sm">Data</th>
                <th className="w-[12%] min-w-[100px] p-2 text-xs sm:text-sm">Nome</th>
                <th className="w-[12%] min-w-[100px] p-2 text-xs sm:text-sm">Cliente</th>
                <th className="w-[10%] min-w-[90px] p-2 text-xs sm:text-sm">Equipamento</th>
                <th className="w-[12%] min-w-[100px] p-2 text-xs sm:text-sm">Técnicos</th>
                <th className="w-[8%] min-w-[70px] p-2 text-xs sm:text-sm">Valor</th>
                <th className="w-[6%] min-w-[60px] p-2 text-xs sm:text-sm">ROI</th>
                <th className="w-[10%] min-w-[90px] p-2 text-xs sm:text-sm">Pagamento</th>
                <th className="w-[10%] min-w-[90px] p-2 text-xs sm:text-sm">Serviço</th>
                <th className="w-[6%] min-w-[60px] p-2 text-xs sm:text-sm">Tipo</th>
                <th className="w-[10%] min-w-[90px] p-2 text-xs sm:text-sm">Histórico</th>
                <th className="w-[6%] min-w-[70px] p-2 text-xs sm:text-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredServices.map((service) => {
                const relatedServices = getRelatedServices(service);
                const hasRelatedServices = relatedServices.length > 0;
                const calculatedTotalValue = calculateTotalValueForService(service);
                const calculatedROI = calculateROIForService(service);

                return (
                  <React.Fragment key={service.id}>
                    <tr className="hover:bg-gray-50">
                      {/* Table cells with optimized styling */}
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        {new Date(service.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        {service.name}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        {getClientForService(service, clients)?.name || "Cliente não definido"}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        {getEquipmentForService(service, equipments)?.name || "-"}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        {getTechniciansForService(service, serviceTechnicians, technicians).map(t => t.name).join(', ') || "-"}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        R$ {calculatedTotalValue.toFixed(2)}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        R$ {calculatedROI.toFixed(2)}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        <StatusBadge status={service.paymentStatus} />
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        <StatusBadge status={service.serviceStatus} />
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${service.visitType === 'novo' ?
                            'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'}`}>
                          {service.visitType === 'novo' ? 'Novo' : 'Revisita'}
                        </span>
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        {hasRelatedServices ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center"
                            onClick={() => toggleServiceHistory(service.id)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            {expandedServiceId === service.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">Sem histórico</span>
                        )}
                      </td>
                      <td className="w-[8%] min-w-[80px] truncate p-2 text-xs sm:text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditService(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* History row */}
                    {expandedServiceId === service.id && hasRelatedServices && (
                      <tr className="bg-gray-50">
                        <td colSpan={12} className="p-0">
                          <div className="p-4">
                            <h4 className="mb-2 font-medium text-blue-600">
                              Histórico de Serviços - {getClientForService(service, clients)?.name || "Cliente não definido"} -
                              {getEquipmentForService(service, equipments)?.name || "Sem equipamento definido"}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="py-2 pl-4 pr-3 text-left text-xs font-medium text-gray-500">Data</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Serviço</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Valor</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    <th className="py-2 pl-3 pr-4 text-left text-xs font-medium text-gray-500">Tipo</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {relatedServices.map((relatedService) => (
                                    <tr key={relatedService.id}>
                                      <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500">
                                        {format(new Date(relatedService.date), 'dd/MM/yyyy')}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                                        {relatedService.name}
                                      </td>
                                      <td className="max-w-[200px] truncate px-3 py-2 text-sm text-gray-500">
                                        {relatedService.description}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                                        R$ {calculateTotalValueForService(relatedService).toFixed(2)}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-sm">
                                        <StatusBadge status={relatedService.serviceStatus} />
                                      </td>
                                      <td className="whitespace-nowrap py-2 pl-3 pr-4 text-sm">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                  ${relatedService.visitType === 'novo' ?
                                            'bg-blue-100 text-blue-800' :
                                            'bg-amber-100 text-amber-800'}`}>
                                          {relatedService.visitType === 'novo' ? 'Novo' : 'Revisita'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-sm text-gray-500">
                    Nenhum serviço encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-gray-600 text-sm">Total</div>
            <div className="text-xl md:text-2xl font-semibold mt-1">{services.length}</div>
            <div className="text-sm text-gray-500 mt-1">R$ {totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-green-600 text-sm">Pagos</div>
            <div className="text-xl md:text-2xl font-semibold mt-1 text-green-600">{paidCount}</div>
            <div className="text-sm text-green-500 mt-1">R$ {paidValue.toFixed(2)}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-yellow-600 text-sm">Pendentes</div>
            <div className="text-xl md:text-2xl font-semibold mt-1 text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-yellow-500 mt-1">R$ {pendingValue.toFixed(2)}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-blue-600 text-sm">Parciais</div>
            <div className="text-xl md:text-2xl font-semibold mt-1 text-blue-600">{partialCount}</div>
            <div className="text-sm text-blue-500 mt-1">R$ {partialValue.toFixed(2)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-red-600 text-sm">Não Pagos</div>
            <div className="text-xl md:text-2xl font-semibold mt-1 text-red-600">{unpaidCount}</div>
            <div className="text-sm text-red-500 mt-1">R$ {unpaidValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <ServiceDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        service={editingService}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

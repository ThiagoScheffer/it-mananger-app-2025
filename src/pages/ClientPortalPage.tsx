
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Equipment, Service } from "@/types";
import { format } from "date-fns";
import { AlertTriangle, BarChart2, Calendar, Filter, LogOut, Tablet, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getServices,
    getEquipments
} from '@/utils/storageManager';

const ClientPortalPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientServices, setClientServices] = useState<Service[]>([]);
  const [clientEquipment, setClientEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
    const [paymentDateFilter, setPaymentDateFilter] = useState<'asc' | 'desc' | null>(null);
    const [paymentValueFilter, setPaymentValueFilter] = useState<'asc' | 'desc' | null>(null);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<Record<string, boolean>>({
    paid: true,
    pending: true,
    unpaid: true,
    partial: true
    });

    const [serviceStatusFilter, setServiceStatusFilter] = useState<Record<string, boolean>>({
        completed: true,
        inProgress: true,
        pending: true,
        cancelled: true
    });

  // Fetch client data from localStorage
    useEffect(() => {
        const fetchClientData = () => {
            try {
                setLoading(true);

                if (!user || !user.clientId) {
                    toast({
                        title: "Erro",
                        description: "Não foi possível carregar os dados do cliente.",
                        variant: "destructive",
                    });
                    return;
                }

                // Get all services and filter by clientId
                const allServices = getServices();
                const filteredServices = allServices.filter(service => service.clientId === user.clientId);
                setClientServices(filteredServices);

                // Get all equipment and filter by clientId
                const allEquipment = getEquipments();
                const filteredEquipment = allEquipment.filter(equipment => equipment.clientId === user.clientId);
                setClientEquipment(filteredEquipment);

            } catch (error) {
                console.error("Error fetching client data:", error);
                toast({
                    title: "Erro",
                    description: "Ocorreu um erro ao carregar seus dados.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [user, toast]);
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

    const handleServiceStatusFilterChange = (status: string) => {
        setServiceStatusFilter(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    // Update the filter handlers to reset other filters
    const handleDateFilter = () => {
        const newFilter = paymentDateFilter === 'asc' ? 'desc' :
            paymentDateFilter === 'desc' ? null : 'asc';
        setPaymentDateFilter(newFilter);
        // Reset other filters
        if (newFilter) {
            setPaymentValueFilter(null);
        }
    };

    const handleValueFilter = () => {
        const newFilter = paymentValueFilter === 'asc' ? 'desc' :
            paymentValueFilter === 'desc' ? null : 'asc';
        setPaymentValueFilter(newFilter);
        // Reset other filters
        if (newFilter) {
            setPaymentDateFilter(null);
        }
    };

    // Add these filter handler functions
    const handlePaymentStatusFilterChange = (status: string) => {
        setPaymentStatusFilter(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header for client portal */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
                src="/LogoBanner1.png"
                alt="Gestor Pro Logo"
                className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-semibold text-blue-600">Portal do Cliente</h1>
              <p className="text-sm text-gray-500">Bem-vindo, {user?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="services" className="flex items-center justify-center">
              <Wrench className="mr-2 h-4 w-4" />
              <span>Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center justify-center">
              <Tablet className="mr-2 h-4 w-4" />
              <span>Equipamentos</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center justify-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              <span>Pagamentos</span>
            </TabsTrigger>
          </TabsList>
          
                  <TabsContent value="services">
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">Seus Serviços</h2>
                          <div className="flex gap-2">
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                          <Filter className="mr-2 h-4 w-4" />
                                          Status Serviço
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56">
                                      <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuCheckboxItem
                                          checked={serviceStatusFilter.completed}
                                          onCheckedChange={() => handleServiceStatusFilterChange('completed')}
                                      >
                                          Concluído
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={serviceStatusFilter.inProgress}
                                          onCheckedChange={() => handleServiceStatusFilterChange('inProgress')}
                                      >
                                          Em andamento
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={serviceStatusFilter.pending}
                                          onCheckedChange={() => handleServiceStatusFilterChange('pending')}
                                      >
                                          Pendente
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={serviceStatusFilter.cancelled}
                                          onCheckedChange={() => handleServiceStatusFilterChange('cancelled')}
                                      >
                                          Cancelado
                                      </DropdownMenuCheckboxItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                          <Filter className="mr-2 h-4 w-4" />
                                          Status Pagamento
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56">
                                      <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.paid}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('paid')}
                                      >
                                          Pago
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.pending}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('pending')}
                                      >
                                          Pendente
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.partial}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('partial')}
                                      >
                                          Parcial
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.unpaid}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('unpaid')}
                                      >
                                          Não pago
                                      </DropdownMenuCheckboxItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </div>

                      {clientServices.filter(service =>
                          serviceStatusFilter[service.serviceStatus] &&
                          paymentStatusFilter[service.paymentStatus]
                      ).length === 0 ? (
                          <Card>
                              <CardContent className="pt-6 text-center">
                                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                                  <p>Não há serviços registrados para sua conta.</p>
                              </CardContent>
                          </Card>
                      ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                              {clientServices
                                  .filter(service =>
                                      serviceStatusFilter[service.serviceStatus] &&
                                      paymentStatusFilter[service.paymentStatus]
                                  )
                                  .map((service) => (
                  <Card key={service.id}>
                    <CardHeader>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>
                        Data: {format(new Date(service.date), "dd/MM/yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2"><strong>Descrição:</strong> {service.description}</p>
                      <p className="mb-2">
                        <strong>Status:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.serviceStatus === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : service.serviceStatus === 'inProgress'
                            ? 'bg-blue-100 text-blue-800'
                            : service.serviceStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.serviceStatus === 'completed' 
                            ? 'Concluído' 
                            : service.serviceStatus === 'inProgress'
                            ? 'Em andamento'
                            : service.serviceStatus === 'pending'
                            ? 'Pendente'
                            : 'Cancelado'}
                        </span>
                      </p>
                      <p>
                        <strong>Pagamento:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : service.paymentStatus === 'partial'
                            ? 'bg-blue-100 text-blue-800'
                            : service.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.paymentStatus === 'paid' 
                            ? 'Pago' 
                            : service.paymentStatus === 'partial'
                            ? 'Parcial'
                            : service.paymentStatus === 'pending'
                            ? 'Pendente'
                            : 'Não pago'}
                        </span>
                      </p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-lg font-bold">Total: R$ {service.totalValue.toFixed(2)}</p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="equipment">
            <h2 className="text-xl font-semibold mb-4">Seus Equipamentos</h2>
            {clientEquipment.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                  <p>Não há equipamentos registrados para sua conta.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clientEquipment.map((equipment) => (
                  <Card key={equipment.id}>
                    <CardHeader>
                      <CardTitle>{equipment.name}</CardTitle>
                      <CardDescription>Modelo: {equipment.model}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2"><strong>Tipo:</strong> {equipment.type}</p>
                      <p className="mb-2"><strong>N° de Série:</strong> {equipment.serialNumber || 'N/A'}</p>
                      <p className="mb-2">
                        <strong>Status:</strong>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          equipment.status === 'operational' 
                            ? 'bg-green-100 text-green-800' 
                            : equipment.status === 'needs_service'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {equipment.status === 'operational' 
                            ? 'Operacional' 
                            : equipment.status === 'needs_service'
                            ? 'Necessita manutenção'
                            : 'Desativado'}
                        </span>
                      </p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-gray-500 italic">Notas: {equipment.notes || 'Sem observações'}</p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
                  <TabsContent value="payments">
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">Histórico de Pagamentos</h2>
                          <div className="flex gap-2">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDateFilter()}
                                   className={paymentDateFilter ? 'bg-blue-50' : ''}
                              >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Data {paymentDateFilter === 'asc' ? '↑' : paymentDateFilter === 'desc' ? '↓' : ''}
                              </Button>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleValueFilter()}
                              >
                                  <BarChart2 className="mr-2 h-4 w-4" />
                                  Valor {paymentValueFilter === 'asc' ? '↑' : paymentValueFilter === 'desc' ? '↓' : ''}
                              </Button>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                          <Filter className="mr-2 h-4 w-4" />
                                          Status
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56">
                                      <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.paid}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('paid')}
                                      >
                                          Pago
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.pending}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('pending')}
                                      >
                                          Pendente
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.partial}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('partial')}
                                      >
                                          Parcial
                                      </DropdownMenuCheckboxItem>
                                      <DropdownMenuCheckboxItem
                                          checked={paymentStatusFilter.unpaid}
                                          onCheckedChange={() => handlePaymentStatusFilterChange('unpaid')}
                                      >
                                          Não pago
                                      </DropdownMenuCheckboxItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </div>

                      {clientServices.length === 0 ? (
                          <Card>
                              <CardContent className="pt-6 text-center">
                                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                                  <p>Não há histórico de pagamentos disponível.</p>
                              </CardContent>
                          </Card>
                      ) : (
                          <Card>
                              <CardHeader>
                                  <CardTitle>Pagamentos</CardTitle>
                                  <CardDescription>Histórico de pagamentos de serviços</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                          <thead>
                                              <tr className="bg-gray-100">
                                                  <th className="text-left p-2">Serviço</th>
                                                  <th className="text-left p-2">Data</th>
                                                  <th className="text-left p-2">Valor</th>
                                                  <th className="text-left p-2">Status</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {clientServices
                                                      .filter(service => paymentStatusFilter[service.paymentStatus])
                                                      .sort((a, b) => {
                                                          // Date sorting (already in yyyy-mm-dd format)
                                                          if (paymentDateFilter) {
                                                              const dateA = a.date;
                                                              const dateB = b.date;

                                                              // Direct string comparison
                                                              if (paymentDateFilter === 'asc') {
                                                                  return dateA.localeCompare(dateB);
                                                              } else {
                                                                  return dateB.localeCompare(dateA);
                                                              }
                                                          }
                                                         // console.log('paymentDateFilter', a.date);
                                                          // Then handle value sorting if active
                                                         if (paymentValueFilter) {
                                                              return paymentValueFilter === 'asc'
                                                                  ? a.totalValue - b.totalValue
                                                                  : b.totalValue - a.totalValue;
                                                          }

                                                          /*console.log("Sorting with:", {
                                                              paymentDateFilter,
                                                              dates: clientServices.map(s => s.date)
                                                          });*/

                                                          // Default to original order if no sorting is active
                                                          //return 0;
                                                      })
                                                  .map((service) => (
                                                      <tr key={service.id} className="border-t">
                                                          <td className="p-2">{service.name}</td>
                                                          <td className="p-2">{format(new Date(service.date), "dd/MM/yyyy")}</td>
                                                          <td className="p-2">R$ {service.totalValue.toFixed(2)}</td>
                                                          <td className="p-2">
                                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.paymentStatus === 'paid'
                                                                      ? 'bg-green-100 text-green-800'
                                                                      : service.paymentStatus === 'partial'
                                                                          ? 'bg-blue-100 text-blue-800'
                                                                          : service.paymentStatus === 'pending'
                                                                              ? 'bg-yellow-100 text-yellow-800'
                                                                              : 'bg-red-100 text-red-800'
                                                                  }`}>
                                                                  {service.paymentStatus === 'paid'
                                                                      ? 'Pago'
                                                                      : service.paymentStatus === 'partial'
                                                                          ? 'Parcial'
                                                                          : service.paymentStatus === 'pending'
                                                                              ? 'Pendente'
                                                                              : 'Não pago'}
                                                              </span>
                                                          </td>
                                                      </tr>
                                                  ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </CardContent>
                          </Card>
                      )}
                  </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortalPage;

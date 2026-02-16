import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, PaymentStatus, ServiceStatus, ServiceVisitType, Installment } from "@/types";
import { ServiceMaterial } from "@/types/relationships";
import { toast } from "sonner";
import ServiceTypeSelector from '@/components/service/ServiceTypeSelector';
import MaterialSelector from '@/components/service/MaterialSelector';
import TechnicianSelector from '@/components/service/TechnicianSelector';
import InstallmentManager from '@/components/service/InstallmentManager';
import { getServiceMaterialsByServiceId, getServiceTechniciansByServiceId, getMaterialById } from "@/utils/dataHelpers";
import { Label } from "@radix-ui/react-label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useInstallments } from "@/hooks/useInstallments";
import { InstallmentService } from "@/services/InstallmentService";
import { v4 as uuidv4 } from 'uuid';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  equipmentId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  servicePrice: z.number().min(0, 'Price must be positive'),
  pickupDeliveryPrice: z.number().min(0, 'Price must be positive'),
  serviceStatus: z.enum(['pending', 'inProgress', 'completed', 'cancelled']),
  paymentStatus: z.enum(['unpaid', 'pending', 'partial', 'paid']),
  visitType: z.enum(['novo', 'retorno']),
  warrantyPeriod: z.number().min(0, 'Warranty period must be positive'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  service?: Service;
}

export default function ServiceDialog({ open, setOpen, service }: ServiceDialogProps) {
  const {
    addService,
    updateService,
    deleteService,
    clients,
    equipments,
    technicians,
    getTypeOptions,
  } = useAppContext();

  const {
    createInstallments,
    getServiceInstallments,
    updateServiceInstallments,
    deleteServiceInstallments
  } = useInstallments();

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      equipmentId: '',
      date: new Date().toISOString().split('T')[0],
      servicePrice: 0,
      pickupDeliveryPrice: 0,
      serviceStatus: 'pending',
      paymentStatus: 'unpaid',
      visitType: 'novo',
      warrantyPeriod: 90,
    }
  });

  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantity: number }>>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [plannedInstallments, setPlannedInstallments] = useState<Partial<Installment>[]>([]);
  const [previousTotal, setPreviousTotal] = useState(0);

  // Generate service name suggestion based on client and date
  const generateServiceName = (clientId: string, date: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return '';

    const formattedDate = new Date(date).toLocaleDateString('pt-BR');
    return `${client.name} - ${formattedDate}`;
  };

  // Watch for changes in clientId and date to auto-update service name
  const watchedClientId = form.watch('clientId');
  const watchedDate = form.watch('date');

  useEffect(() => {
    if (!service && watchedClientId && watchedDate) {
      const suggestedName = generateServiceName(watchedClientId, watchedDate);
      form.setValue('name', suggestedName);
    }
  }, [watchedClientId, watchedDate, service, form]);

  useEffect(() => {
    if (open) {
      if (service) {
        // Editing existing service
        form.reset({
          name: service.name,
          description: service.description,
          clientId: service.clientId,
          equipmentId: service.equipmentId || '',
          date: service.date,
          servicePrice: service.servicePrice,
          pickupDeliveryPrice: service.pickupDeliveryPrice,
          serviceStatus: service.serviceStatus,
          paymentStatus: service.paymentStatus,
          visitType: service.visitType,
          warrantyPeriod: service.warrantyPeriod || 90,
        });

        setSelectedServiceTypes(service.serviceTypes || []);

        const serviceMaterials = getServiceMaterialsByServiceId(service.id);
        setSelectedMaterials(
          serviceMaterials.map(sm => ({
            materialId: sm.materialId,
            quantity: sm.quantity
          }))
        );

        const serviceTechnicians = getServiceTechniciansByServiceId(service.id);
        setSelectedTechnicians(serviceTechnicians.map(st => st.technicianId));

        // Load existing installments
        const existingInstallments = getServiceInstallments(service.id);
        setPlannedInstallments(existingInstallments);
        setPreviousTotal(service.totalValue);
      } else {
        // Creating new service
        form.reset({
          name: '',
          description: '',
          clientId: '',
          equipmentId: '',
          date: new Date().toISOString().split('T')[0],
          servicePrice: 0,
          pickupDeliveryPrice: 0,
          serviceStatus: 'pending',
          paymentStatus: 'unpaid',
          visitType: 'novo',
          warrantyPeriod: 90,
        });
        setSelectedServiceTypes([]);
        setSelectedMaterials([]);
        // Auto-select first technician if available
        if (technicians.length > 0) {
          setSelectedTechnicians([technicians[0].id]);
        } else {
          setSelectedTechnicians([]);
        }
        setPlannedInstallments([]);
        setPreviousTotal(0);
      }
    }
  }, [service, open, getServiceInstallments]);

  const calculateTotalValue = () => {
    const formData = form.getValues();

    // Get service types prices
    const serviceTypeOptions = getTypeOptions();
    const serviceTypesPrice = selectedServiceTypes.reduce((acc, typeName) => {
      const typeOption = serviceTypeOptions.find(option => option.name === typeName);
      return acc + (typeOption?.price || 0);
    }, 0);

    // Calculate materials selling price
    const materialsSellPrice = selectedMaterials.reduce((acc, sm) => {
      const material = getMaterialById(sm.materialId);
      return acc + (material ? material.sellingPrice * sm.quantity : 0);
    }, 0);

    return serviceTypesPrice + formData.servicePrice + formData.pickupDeliveryPrice + materialsSellPrice;
  };

  const calculateROI = () => {
    const totalValue = calculateTotalValue();

    // Calculate materials cost (purchase price)
    const materialsCost = selectedMaterials.reduce((acc, sm) => {
      const material = getMaterialById(sm.materialId);
      return acc + (material ? material.purchasePrice * sm.quantity : 0);
    }, 0);

    return totalValue - materialsCost;
  };

  // Handle total value changes and prompt for installment recalculation
  const totalValue = calculateTotalValue();
  useEffect(() => {
    if (service && plannedInstallments.length > 0 && previousTotal > 0) {
      const currentTotal = totalValue;
      if (Math.abs(currentTotal - previousTotal) > 0.01) {
        const shouldRecalculate = window.confirm(
          `The total service value changed from R$ ${previousTotal.toFixed(2)} to R$ ${currentTotal.toFixed(2)}. ` +
          `Do you want to recalculate the pending installments?`
        );

        if (shouldRecalculate && plannedInstallments.length > 0) {
          const firstDueDate = plannedInstallments[0]?.dueDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          updateServiceInstallments(
            service.id,
            currentTotal,
            plannedInstallments.length,
            firstDueDate
          );
        }
        setPreviousTotal(currentTotal);
      }
    }
  }, [totalValue, previousTotal, service, plannedInstallments.length, updateServiceInstallments]);

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const totalValue = calculateTotalValue();
      const roi = calculateROI();

      // Validate installments if they exist
      if (plannedInstallments.length > 0) {
        const validation = InstallmentService.validateInstallmentPlan(plannedInstallments, totalValue);
        if (!validation.isValid) {
          toast.error(`Error in installments: ${validation.errors.join(', ')}`);
          return;
        }
      }

      const serviceData = {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        equipmentId: data.equipmentId || '',
        date: data.date,
        servicePrice: data.servicePrice,
        pickupDeliveryPrice: data.pickupDeliveryPrice,
        serviceStatus: data.serviceStatus,
        paymentStatus: data.paymentStatus,
        visitType: data.visitType,
        warrantyPeriod: data.warrantyPeriod,
        serviceTypes: selectedServiceTypes,
        totalValue,
        roi,
        isInstallmentPayment: plannedInstallments.length > 0,
      };

      if (service) {
        // Update existing service
        updateService(
          service.id,
          serviceData,
          selectedMaterials,
          selectedTechnicians,
        );

        // Handle installment updates
        if (plannedInstallments.length > 0) {
          // Check if installments exist and need updating
          const existingInstallments = getServiceInstallments(service.id);
          if (existingInstallments.length === 0) {
            await createInstallments(service.id, plannedInstallments);
          }
        } else {
          // If no installments planned but service had them, ask to delete
          const existingInstallments = getServiceInstallments(service.id);
          if (existingInstallments.length > 0) {
            const shouldDelete = window.confirm(
              'This service has registered installments. Do you want to remove them?'
            );
            if (shouldDelete) {
              await deleteServiceInstallments(service.id);
            }
          }
        }

        toast.success('Service updated successfully!');
      } else {
        // Create new service
        const createdService = addService(
          serviceData,
          selectedMaterials,
          selectedTechnicians,
        );

        // Create installments after service creation
        //console.log('Planned installments:', plannedInstallments);
        //console.log('Created service ID:', createdService?.id);
        if (plannedInstallments.length > 0 && createdService) {
          await createInstallments(createdService.id, plannedInstallments);
        }

        toast.success('Service created successfully!');
      }

      setOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Error saving service');
    }
  };

  const updateCalculations = () => {
    form.trigger();
  };

  const handleServiceTypeAdd = (type: string) => {
    setSelectedServiceTypes(prev => [...prev, type]);
    updateCalculations();
  };

  const handleServiceTypeRemove = (type: string) => {
    setSelectedServiceTypes(prev => prev.filter(t => t !== type));
    updateCalculations();
  };

  // Transform selectedMaterials to ServiceMaterial[] format for MaterialSelector
  const transformedMaterials: ServiceMaterial[] = selectedMaterials.map(sm => {
    const material = getMaterialById(sm.materialId);
    const now = new Date().toISOString();

    return {
      id: `temp-${sm.materialId}`,
      serviceId: service?.id || "temp",
      materialId: sm.materialId,
      quantity: sm.quantity,
      priceSnapshot: material?.sellingPrice || 0,
      createdAt: now,
      updatedAt: now,
    };
  });

  // Handle updates from MaterialSelector and convert back to simple format
  const handleMaterialsChange = (materials: ServiceMaterial[]) => {
    const simplifiedMaterials = materials.map(sm => ({
      materialId: sm.materialId,
      quantity: sm.quantity,
    }));
    setSelectedMaterials(simplifiedMaterials);
    updateCalculations();
  };

  const handleInstallmentsChange = (installments: Partial<Installment>[]) => {
    setPlannedInstallments(installments);
  };

  const getPaymentStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 font-semibold';
      case 'unpaid':
        return 'text-red-600 font-semibold';
      case 'pending':
        return 'text-orange-600 font-semibold';
      case 'partial':
        return 'text-yellow-600 font-semibold';
      default:
        return '';
    }
  };

  const getServiceStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 font-semibold';
      case 'pending':
      case 'inProgress':
        return 'text-orange-600 font-semibold';
      case 'cancelled':
        return 'text-red-600 font-semibold';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "New Service"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an equipment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {equipments.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="servicePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pickupDeliveryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup/Delivery Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceStatus"
                render={({ field }) => {
                  const statusClass = getServiceStatusClass(field.value);
                  return (
                    <FormItem>
                      <FormLabel>Service Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={statusClass}>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="inProgress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => {
                  const statusClass = getPaymentStatusClass(field.value);
                  return (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={statusClass}>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="novo">New</SelectItem>
                        <SelectItem value="retorno">Return</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warrantyPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Period (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ServiceTypeSelector
              selectedTypes={selectedServiceTypes}
              onAddType={handleServiceTypeAdd}
              onRemoveType={handleServiceTypeRemove}
              onUpdateCalculations={updateCalculations}
            />

            <MaterialSelector
              selectedMaterials={transformedMaterials}
              onMaterialsChange={handleMaterialsChange}
            />

            <TechnicianSelector
              selectedTechnicians={selectedTechnicians}
              onTechniciansChange={setSelectedTechnicians}
            />

            <InstallmentManager
              serviceId={service?.id}
              serviceTotal={totalValue}
              onInstallmentsChange={handleInstallmentsChange}
              initialInstallments={service ? getServiceInstallments(service.id) : []}
              mode={service ? 'edit' : 'create'}
            />

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Financial Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium ml-2">R$ {totalValue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">ROI:</span>
                  <span className="font-medium ml-2">R$ {calculateROI().toFixed()}</span>
                </div>
                {plannedInstallments.length > 0 && (
                  <>
                    <div>
                      <span className="text-gray-600">Installments:</span>
                      <span className="font-medium ml-2">{plannedInstallments.length}x</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Installment Value:</span>
                      <span className="font-medium ml-2">
                        R$ {plannedInstallments.length > 0 ? (totalValue / plannedInstallments.length).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <div className="flex gap-2">
                {form.watch('paymentStatus') !== 'paid' && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      form.setValue('paymentStatus', 'paid');
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    Mark as Paid
                  </Button>
                )}

                <Button type="submit">
                  {service ? 'Update' : 'Create'} Service
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

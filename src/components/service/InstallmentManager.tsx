// ABOUTME: Component for managing service installments with preview and validation
// ABOUTME: Handles installment creation, editing, validation, and payment tracking

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstallmentService, CreateInstallmentPlan } from '@/services/InstallmentService';
import { Installment } from '@/types';
import { addMonths, format } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle, Clock, X } from 'lucide-react';

interface InstallmentManagerProps {
  serviceId?: string;
  serviceTotal: number;
  onInstallmentsChange: (installments: Partial<Installment>[]) => void;
  initialInstallments?: Installment[];
  mode?: 'edit' | 'create';
}

export default function InstallmentManager({
  serviceId,
  serviceTotal,
  onInstallmentsChange,
  initialInstallments = [],
  mode = 'create'
}: InstallmentManagerProps) {
  const [createInstallments, setCreateInstallments] = useState(false);
  const [numberOfInstallments, setNumberOfInstallments] = useState(2);
  const [firstDueDate, setFirstDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [installmentPlan, setInstallmentPlan] = useState<Partial<Installment>[]>([]);
  const [manualOverride, setManualOverride] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize with existing installments in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialInstallments.length > 0) {
      setCreateInstallments(true);
      setInstallmentPlan(initialInstallments);
      setNumberOfInstallments(initialInstallments.length);
      if (initialInstallments[0]?.dueDate) {
        setFirstDueDate(initialInstallments[0].dueDate);
      }
    }
  }, [mode, initialInstallments]);

  // Generate preview plan when parameters change (only for preview, not saving)
  useEffect(() => {
    console.log('Creating installments with:', {
      createInstallments,
      numberOfInstallments,
      firstDueDate,
      serviceTotal,
      manualOverride,
      serviceId,
      mode
    });

    if (createInstallments && !manualOverride && serviceTotal > 0) {
      // Only generate if we don't already have installments or if parameters changed significantly
      const shouldGenerate = mode === 'create' || 
        (mode === 'edit' && installmentPlan.length === 0) ||
        (mode === 'edit' && installmentPlan.length !== numberOfInstallments);

      if (shouldGenerate) {
        const plan: CreateInstallmentPlan = {
          serviceId: serviceId || 'temp',
          numberOfInstallments,
          firstDueDate
        };
        setIsGenerating(true);
        const generatedPlan = InstallmentService.generateInstallmentPlan(plan, serviceTotal);
        console.log('Generated installments:', generatedPlan);
        setInstallmentPlan(generatedPlan);
        // Only notify parent component for preview purposes, don't save to DB yet
        onInstallmentsChange(generatedPlan);
        setIsGenerating(false);
      }
    }
  }, [createInstallments, numberOfInstallments, firstDueDate, serviceTotal, manualOverride, serviceId, mode]);

  const handleCreateInstallmentsChange = (checked: boolean) => {
    setCreateInstallments(checked);
    
    if (!checked) {
      // User wants to remove installments
      setInstallmentPlan([]);
      onInstallmentsChange([]);
      
      // In edit mode, show confirmation dialog for removing existing installments
      if (mode === 'edit' && initialInstallments.length > 0) {
        const hasPaidInstallments = initialInstallments.some(i => i.status === 'paid');
        
        if (hasPaidInstallments) {
          const confirmed = window.confirm(
            'Este serviço possui parcelas pagas. Tem certeza que deseja remover todas as parcelas? ' +
            'Esta ação não pode ser desfeita.'
          );
          if (!confirmed) {
            // User canceled, restore the checkbox
            setCreateInstallments(true);
            setInstallmentPlan(initialInstallments);
            onInstallmentsChange(initialInstallments);
            return;
          }
        } else {
          const confirmed = window.confirm(
            'Tem certeza que deseja remover todas as parcelas deste serviço?'
          );
          if (!confirmed) {
            // User canceled, restore the checkbox
            setCreateInstallments(true);
            setInstallmentPlan(initialInstallments);
            onInstallmentsChange(initialInstallments);
            return;
          }
        }
        
        toast.success('Parcelas serão removidas quando você salvar o serviço.');
      }
    } else if (checked && serviceTotal > 0 && !manualOverride) {
      // Generate preview when checkbox is enabled
      const plan: CreateInstallmentPlan = {
        serviceId: serviceId || 'temp',
        numberOfInstallments,
        firstDueDate
      };
      const generatedPlan = InstallmentService.generateInstallmentPlan(plan, serviceTotal);
      setInstallmentPlan(generatedPlan);
      onInstallmentsChange(generatedPlan);
    }
  };

  const handleManualAmountChange = (index: number, amount: number) => {
    const updatedPlan = [...installmentPlan];
    updatedPlan[index] = { ...updatedPlan[index], amount };
    setInstallmentPlan(updatedPlan);
    onInstallmentsChange(updatedPlan);
  };

  const handleManualDateChange = (index: number, date: string) => {
    const updatedPlan = [...installmentPlan];
    updatedPlan[index] = { ...updatedPlan[index], dueDate: date };
    setInstallmentPlan(updatedPlan);
    onInstallmentsChange(updatedPlan);
  };

  const handleMarkAsPaid = async (installmentId: string, index: number) => {
    if (!installmentId) {
      toast.error('ID da parcela não encontrado');
      return;
    }

    try {
      await InstallmentService.markInstallmentAsPaid(installmentId);

      // Update local state
      const updatedPlan = [...installmentPlan];
      updatedPlan[index] = {
        ...updatedPlan[index],
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0]
      };
      setInstallmentPlan(updatedPlan);
      onInstallmentsChange(updatedPlan);
    } catch (error) {
      console.error('Error marking installment as paid:', error);
      toast.error('Erro ao marcar parcela como paga');
    }
  };

  const handleRecalculate = async () => {
    if (!serviceId) {
      toast.error('ID do serviço não encontrado');
      return;
    }

    const confirmed = window.confirm(
      'Deseja recalcular as parcelas com base no novo valor total? ' +
      'Isso afetará apenas as parcelas pendentes.'
    );

    if (confirmed) {
      try {
        const success = await InstallmentService.updateServiceInstallments(
          serviceId,
          serviceTotal,
          numberOfInstallments,
          firstDueDate
        );

        if (success) {
          // Reload installments
          const updatedInstallments = InstallmentService.getServiceInstallments(serviceId);
          setInstallmentPlan(updatedInstallments);
          onInstallmentsChange(updatedInstallments);
          toast.success('Parcelas recalculadas com sucesso!');
        }
      } catch (error) {
        console.error('Error recalculating installments:', error);
        toast.error('Erro ao recalcular parcelas');
      }
    }
  };

  const validatePlan = () => {
    console.log('Validating installment plan:', {
      installmentPlan, 
      serviceTotal
    });
    return InstallmentService.validateInstallmentPlan(installmentPlan, serviceTotal);
  };

  const validation = validatePlan();

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'canceled':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'canceled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-orange-600 bg-orange-50';
    }
  };

  if (!createInstallments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Parcelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-installments"
              checked={createInstallments}
              onCheckedChange={handleCreateInstallmentsChange}
            />
            <Label htmlFor="create-installments">Criar parcelamento</Label>
          </div>
          {mode === 'edit' && initialInstallments.length > 0 && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠️ Este serviço possui {initialInstallments.length} parcela(s). 
              Marque a opção acima para visualizar ou remover.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Configuração de Parcelamento
          {mode === 'edit' && serviceId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
            >
              Recalcular
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="create-installments"
            checked={createInstallments}
            onCheckedChange={handleCreateInstallmentsChange}
          />
          <Label htmlFor="create-installments">Criar parcelamento</Label>
          {mode === 'edit' && initialInstallments.length > 0 && (
            <span className="text-sm text-gray-500">
              (Desmarque para remover todas as parcelas)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="installments-count">Número de Parcelas</Label>
            <Select
              value={numberOfInstallments.toString()}
              onValueChange={(value) => setNumberOfInstallments(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="first-due-date">Primeiro Vencimento</Label>
            <Input
              id="first-due-date"
              type="date"
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
            />
          </div>
        </div>

        {mode === 'edit' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manual-override"
              checked={manualOverride}
              onCheckedChange={(checked) => setManualOverride(checked === true)}
            />
            <Label htmlFor="manual-override">Editar valores manualmente</Label>
          </div>
        )}

        {/* Installment Preview */}
        <div className="space-y-2">
          <h4 className="font-medium">
            {mode === 'edit' ? 'Parcelas Existentes' : 'Preview das Parcelas'}
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {installmentPlan.map((installment, index) => (
              <div key={index} className={`grid grid-cols-4 gap-2 p-2 border rounded ${getStatusColor(installment.status)}`}>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    {getStatusIcon(installment.status)}
                    Parcela {installment.parcelNumber || index + 1}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={installment.amount || 0}
                    onChange={(e) => handleManualAmountChange(index, parseFloat(e.target.value) || 0)}
                    disabled={!manualOverride || installment.status === 'paid'}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Vencimento</Label>
                  <Input
                    type="date"
                    value={installment.dueDate || ''}
                    onChange={(e) => handleManualDateChange(index, e.target.value)}
                    disabled={!manualOverride || installment.status === 'paid'}
                    className="h-8"
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">
                    {installment.status === 'paid' && installment.paidDate
                      ? `Pago em ${format(new Date(installment.paidDate), 'dd/MM')}`
                      : installment.dueDate
                        ? format(new Date(installment.dueDate), 'dd/MM')
                        : '-'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  {mode === 'edit' && installment.status === 'pending' && installment.id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsPaid(installment.id!, index)}
                      className="h-8 text-xs"
                    >
                      Marcar Pago
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Summary */}
        <div className={`p-3 rounded ${validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex justify-between text-sm">
            <span>Total das Parcelas:</span>
            <span className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
              R$ {validation.totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Valor do Serviço:</span>
            <span>R$ {validation.expectedAmount.toFixed(2)}</span>
          </div>
          {!validation.isValid && (
            <div className="mt-2">
              {validation.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

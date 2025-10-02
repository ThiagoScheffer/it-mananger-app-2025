
// ABOUTME: Hook for managing installment operations and state
// ABOUTME: Provides interface between components and InstallmentService

import { useState, useCallback } from 'react';
import { Installment } from '@/types';
import { InstallmentService } from '@/services/InstallmentService';
import { toast } from 'sonner';

export function useInstallments() {
  const [isLoading, setIsLoading] = useState(false);

  const createInstallments = useCallback(async (serviceId: string, installmentData: Partial<Installment>[]) => {
    setIsLoading(true);
    try {
      const validation = InstallmentService.validateInstallmentPlan(installmentData, 
        installmentData.reduce((sum, i) => sum + (i.amount || 0), 0)
      );
      
      if (!validation.isValid) {
        toast.error(`Erro de validação: ${validation.errors.join(', ')}`);
        return null;
      }

      const result = await InstallmentService.createInstallments(serviceId, installmentData);
      toast.success(`${result.length} parcela(s) criada(s) com sucesso!`);
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar parcelas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsPaid = useCallback(async (installmentId: string, paidDate?: string) => {
    setIsLoading(true);
    try {
      await InstallmentService.markInstallmentAsPaid(installmentId, paidDate);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao marcar parcela como paga');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteServiceInstallments = useCallback(async (serviceId: string) => {
    setIsLoading(true);
    try {
      await InstallmentService.deleteServiceInstallments(serviceId);
      toast.success('Parcelas deletadas com sucesso!');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar parcelas');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelServiceInstallments = useCallback(async (serviceId: string) => {
    setIsLoading(true);
    try {
      await InstallmentService.cancelServiceInstallments(serviceId);
      toast.success('Parcelas canceladas com sucesso!');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar parcelas');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateServiceInstallments = useCallback(async (
    serviceId: string, 
    newTotal: number, 
    numberOfInstallments: number, 
    firstDueDate: string
  ) => {
    setIsLoading(true);
    try {
      const result = await InstallmentService.updateServiceInstallments(
        serviceId, 
        newTotal, 
        numberOfInstallments, 
        firstDueDate
      );
      if (result) {
        toast.success('Parcelas atualizadas com sucesso!');
      }
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar parcelas');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recalculateInstallments = useCallback(async (serviceId: string, newTotal: number, numberOfInstallments: number) => {
    setIsLoading(true);
    try {
      const result = await InstallmentService.recalculateInstallments(serviceId, newTotal, numberOfInstallments);
      if (result) {
        toast.success('Parcelas recalculadas com sucesso!');
      }
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao recalcular parcelas');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getServiceInstallments = useCallback((serviceId: string) => {
    return InstallmentService.getServiceInstallments(serviceId);
  }, []);

  const getInstallmentsSummary = useCallback((serviceId: string) => {
    return InstallmentService.getInstallmentsSummary(serviceId);
  }, []);

  return {
    isLoading,
    createInstallments,
    markAsPaid,
    deleteServiceInstallments,
    cancelServiceInstallments,
    updateServiceInstallments,
    recalculateInstallments,
    getServiceInstallments,
    getInstallmentsSummary
  };
}

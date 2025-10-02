// ABOUTME: Service class for managing installments with validation and transactions
// ABOUTME: Handles CRUD operations, validation, and business logic for installments

import { v4 as uuidv4 } from 'uuid';
import { Installment, Service } from '@/types';
import { getInstallments, saveInstallments, getServices, saveServices } from '@/utils/storageManager';
import { toast } from 'sonner';

export interface CreateInstallmentPlan {
  serviceId: string;
  numberOfInstallments: number;
  firstDueDate: string;
  customAmounts?: number[];
}

export interface InstallmentValidationResult {
  isValid: boolean;
  errors: string[];
  totalAmount: number;
  expectedAmount: number;
}

export interface InstallmentUpdateOptions {
  preservePaid?: boolean;
  preserveCanceled?: boolean;
}

export class InstallmentService {
  
  static validateInstallmentPlan(installments: Partial<Installment>[], expectedTotal: number): InstallmentValidationResult {
    const errors: string[] = [];
    const totalAmount = installments.reduce((sum, installment) => sum + (installment.amount || 0), 0);
    console.log('Validating installments:', installments);
    
    if (Math.abs(totalAmount - expectedTotal) > 0.01) {
      errors.push(`Total de parcelas (R$ ${totalAmount.toFixed(2)}) deve ser igual ao valor do serviço (R$ ${expectedTotal.toFixed(2)})`);
    }
    
    if (installments.length === 0) {
      errors.push('Pelo menos uma parcela deve ser criada');
    }
    
    installments.forEach((installment, index) => {
      if (!installment.amount || installment.amount <= 0) {
        errors.push(`Parcela ${index + 1}: valor deve ser maior que zero`);
      }
      if (!installment.dueDate) {
        errors.push(`Parcela ${index + 1}: data de vencimento é obrigatória`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      totalAmount,
      expectedAmount: expectedTotal
    };
  }
  
  static generateInstallmentPlan(plan: CreateInstallmentPlan, serviceTotal: number): Partial<Installment>[] {
    const { numberOfInstallments, firstDueDate, customAmounts } = plan;
    const installments: Partial<Installment>[] = [];
    
    if (serviceTotal <= 0) {
      console.error('Cannot generate installments: serviceTotal must be greater than 0.');
      return [];
    }

    // Calculate amounts
    let amounts: number[];
    if (customAmounts && customAmounts.length === numberOfInstallments) {
      amounts = customAmounts;
    } else {
      const baseAmount = Math.floor((serviceTotal * 100) / numberOfInstallments) / 100;
      const remainder = Math.round((serviceTotal - (baseAmount * numberOfInstallments)) * 100) / 100;
      amounts = Array(numberOfInstallments).fill(baseAmount);
      if (remainder > 0) {
        amounts[0] += remainder;
      }
    }
    
    console.log('generateInstallmentPlan Calculated amounts:', amounts);

    // Generate installments
    const startDate = new Date(firstDueDate);
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installments.push({
        serviceId: plan.serviceId,
        parcelNumber: i + 1,
        amount: amounts[i],
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending' as const
      });
    }
    
    return installments;
  }
  
  static async createInstallments(serviceId: string, installmentData: Partial<Installment>[]): Promise<Installment[]> {
    try {
      const existingInstallments = getInstallments();
      const now = new Date().toISOString();
      
      const newInstallments: Installment[] = installmentData.map((data, index) => ({
        id: uuidv4(),
        serviceId,
        parcelNumber: data.parcelNumber || index + 1,
        amount: data.amount || 0,
        dueDate: data.dueDate || '',
        status: data.status || 'pending',
        paidDate: data.paidDate,
        createdAt: now,
        updatedAt: now
      }));
      
      const updatedInstallments = [...existingInstallments, ...newInstallments];
      saveInstallments(updatedInstallments);
      
      // Update service to mark as installment payment
      const services = getServices();
      const serviceIndex = services.findIndex(s => s.id === serviceId);
      if (serviceIndex !== -1) {
        services[serviceIndex] = {
          ...services[serviceIndex],
          isInstallmentPayment: true,
          installmentsId: newInstallments.map(i => i.id),
          updatedAt: now
        };
        saveServices(services);
      }
      
      return newInstallments;
    } catch (error) {
      console.error('Error creating installments:', error);
      throw new Error('Falha ao criar parcelas');
    }
  }
  
  static async updateInstallment(installmentId: string, updates: Partial<Installment>): Promise<void> {
    try {
      const installments = getInstallments();
      const index = installments.findIndex(i => i.id === installmentId);
      
      if (index === -1) {
        throw new Error('Parcela não encontrada');
      }
      
      installments[index] = {
        ...installments[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      saveInstallments(installments);
      
      // Update service payment status if all installments are paid
      await this.updateServicePaymentStatus(installments[index].serviceId);
    } catch (error) {
      console.error('Error updating installment:', error);
      throw new Error('Falha ao atualizar parcela');
    }
  }
  
  static async markInstallmentAsPaid(installmentId: string, paidDate?: string): Promise<void> {
    const paymentDate = paidDate || new Date().toISOString().split('T')[0];
    await this.updateInstallment(installmentId, {
      status: 'paid',
      paidDate: paymentDate
    });
    
    toast.success('Parcela marcada como paga!');
  }
  
  static async deleteServiceInstallments(serviceId: string): Promise<void> {
    try {
      const installments = getInstallments();
      const updatedInstallments = installments.filter(i => i.serviceId !== serviceId);
      saveInstallments(updatedInstallments);
      
      // Update service to remove installment payment flag
      const services = getServices();
      const serviceIndex = services.findIndex(s => s.id === serviceId);
      if (serviceIndex !== -1) {
        services[serviceIndex] = {
          ...services[serviceIndex],
          isInstallmentPayment: false,
          installmentsId: undefined,
          updatedAt: new Date().toISOString()
        };
        saveServices(services);
      }
    } catch (error) {
      console.error('Error deleting service installments:', error);
      throw new Error('Falha ao deletar parcelas');
    }
  }
  
  static async cancelServiceInstallments(serviceId: string): Promise<void> {
    try {
      const installments = getInstallments();
      const updatedInstallments = installments.map(installment => {
        if (installment.serviceId === serviceId && installment.status === 'pending') {
          return {
            ...installment,
            status: 'canceled' as const,
            updatedAt: new Date().toISOString()
          };
        }
        return installment;
      });
      
      saveInstallments(updatedInstallments);
    } catch (error) {
      console.error('Error canceling service installments:', error);
      throw new Error('Falha ao cancelar parcelas');
    }
  }
  
  static async updateServiceInstallments(
    serviceId: string, 
    newTotal: number, 
    numberOfInstallments: number, 
    firstDueDate: string,
    options: InstallmentUpdateOptions = { preservePaid: true, preserveCanceled: false }
  ): Promise<boolean> {
    try {
      const installments = getInstallments();
      const serviceInstallments = installments.filter(i => i.serviceId === serviceId);
      
      // Check what installments exist
      const paidInstallments = serviceInstallments.filter(i => i.status === 'paid');
      const canceledInstallments = serviceInstallments.filter(i => i.status === 'canceled');
      const pendingInstallments = serviceInstallments.filter(i => i.status === 'pending');
      
      // Calculate remaining amount after paid installments
      const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
      const remainingAmount = newTotal - paidAmount;
      
      if (remainingAmount <= 0) {
        // All amount already paid, no need for new installments
        const shouldRemovePending = window.confirm(
          'O valor total já foi pago. Deseja remover as parcelas pendentes?'
        );
        
        if (shouldRemovePending) {
          const updatedInstallments = installments.filter(i => 
            i.serviceId !== serviceId || i.status !== 'pending'
          );
          saveInstallments(updatedInstallments);
        }
        return true;
      }
      
      // Calculate new installments for remaining amount
      const remainingParcels = numberOfInstallments - paidInstallments.length;
      if (remainingParcels <= 0) {
        toast.error('Número de parcelas menor que parcelas já pagas');
        return false;
      }
      
      // Generate new installment plan for remaining amount
      const newInstallmentPlan = this.generateInstallmentPlan({
        serviceId,
        numberOfInstallments: remainingParcels,
        firstDueDate
      }, remainingAmount);
      
      // Remove pending installments and add new ones
      let updatedInstallments = installments.filter(i => 
        i.serviceId !== serviceId || i.status !== 'pending'
      );
      
      // Add new installments
      const now = new Date().toISOString();
      const newInstallments: Installment[] = newInstallmentPlan.map((data, index) => ({
        id: uuidv4(),
        serviceId,
        parcelNumber: paidInstallments.length + index + 1,
        amount: data.amount || 0,
        dueDate: data.dueDate || '',
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now
      }));
      
      updatedInstallments = [...updatedInstallments, ...newInstallments];
      saveInstallments(updatedInstallments);
      
      return true;
    } catch (error) {
      console.error('Error updating service installments:', error);
      throw new Error('Falha ao atualizar parcelas');
    }
  }
  
  static async recalculateInstallments(serviceId: string, newTotal: number, numberOfInstallments: number): Promise<boolean> {
    try {
      const installments = getInstallments();
      const serviceInstallments = installments.filter(i => i.serviceId === serviceId);
      
      // Check if any installments are paid or canceled
      const paidOrCanceled = serviceInstallments.filter(i => i.status !== 'pending');
      if (paidOrCanceled.length > 0) {
        const confirmed = window.confirm(
          `Existem ${paidOrCanceled.length} parcela(s) já paga(s) ou cancelada(s). ` +
          `Deseja recalcular apenas as parcelas pendentes?`
        );
        if (!confirmed) return false;
      }
      
      // Get first due date from existing installments
      const firstDueDate = serviceInstallments.length > 0 
        ? serviceInstallments[0].dueDate 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      return await this.updateServiceInstallments(serviceId, newTotal, numberOfInstallments, firstDueDate);
    } catch (error) {
      console.error('Error recalculating installments:', error);
      throw new Error('Falha ao recalcular parcelas');
    }
  }
  
  static async updateServicePaymentStatus(serviceId: string): Promise<void> {
    const installments = this.getServiceInstallments(serviceId);
    const services = getServices();
    const serviceIndex = services.findIndex(s => s.id === serviceId);
    
    if (serviceIndex === -1 || installments.length === 0) return;
    
    const paidInstallments = installments.filter(i => i.status === 'paid');
    const pendingInstallments = installments.filter(i => i.status === 'pending');
    
    let newPaymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    
    if (paidInstallments.length === installments.length) {
      newPaymentStatus = 'paid';
    } else if (paidInstallments.length > 0) {
      newPaymentStatus = 'partial';
    }
    
    services[serviceIndex] = {
      ...services[serviceIndex],
      paymentStatus: newPaymentStatus,
      updatedAt: new Date().toISOString()
    };
    
    saveServices(services);
  }
  
  static getServiceInstallments(serviceId: string): Installment[] {
    const installments = getInstallments();
    return installments.filter(i => i.serviceId === serviceId)
      .sort((a, b) => a.parcelNumber - b.parcelNumber);
  }
  
  static getInstallmentsSummary(serviceId: string) {
    const installments = this.getServiceInstallments(serviceId);
    const total = installments.reduce((sum, i) => sum + i.amount, 0);
    const paid = installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pending = installments.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const canceled = installments.filter(i => i.status === 'canceled').reduce((sum, i) => sum + i.amount, 0);
    
    return {
      total,
      paid,
      pending,
      canceled,
      count: installments.length,
      paidCount: installments.filter(i => i.status === 'paid').length,
      pendingCount: installments.filter(i => i.status === 'pending').length,
      canceledCount: installments.filter(i => i.status === 'canceled').length
    };
  }
}

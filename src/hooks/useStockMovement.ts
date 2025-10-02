
// ABOUTME: Hook for managing material stock movement history
// ABOUTME: Provides methods to track and record stock changes with full audit trail

import { useState } from 'react';
import { StockMovement, MovementType, MovementReason } from '@/types/stockMovement';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'gestor-pro-stock-movements';

function getStockMovements(): StockMovement[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStockMovements(movements: StockMovement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
}

export function useStockMovement() {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(getStockMovements());

  const recordMovement = (
    materialId: string,
    movementType: MovementType,
    quantity: number,
    reason: MovementReason,
    previousStock: number,
    referenceId?: string,
    notes?: string
  ): StockMovement => {
    const newStock = movementType === 'in' 
      ? previousStock + quantity 
      : previousStock - quantity;

    const movement: StockMovement = {
      id: uuidv4(),
      materialId,
      movementType,
      quantity,
      reason,
      referenceId,
      notes,
      previousStock,
      newStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedMovements = [...stockMovements, movement];
    setStockMovements(updatedMovements);
    saveStockMovements(updatedMovements);
    
    return movement;
  };

  const getMaterialMovements = (materialId: string): StockMovement[] => {
    return stockMovements.filter(movement => movement.materialId === materialId);
  };

  const getMovementsByReference = (referenceId: string): StockMovement[] => {
    return stockMovements.filter(movement => movement.referenceId === referenceId);
  };

  return {
    stockMovements,
    recordMovement,
    getMaterialMovements,
    getMovementsByReference
  };
}

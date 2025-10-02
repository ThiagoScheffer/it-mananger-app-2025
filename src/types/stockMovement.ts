
// ABOUTME: Type definitions for material stock movement tracking
// ABOUTME: Defines interfaces for tracking stock changes and movement history

interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'in' | 'out' | 'adjustment';
export type MovementReason = 'purchase' | 'sale' | 'service_use' | 'return' | 'loss' | 'manual_adjustment';

export interface StockMovement extends BaseEntity {
  materialId: string;
  movementType: MovementType;
  quantity: number;
  reason: MovementReason;
  referenceId?: string; // Service ID, Order ID, etc.
  notes?: string;
  previousStock: number;
  newStock: number;
}

export interface StockMovementWithDetails extends StockMovement {
  materialName?: string;
  materialModel?: string;
}


// Re-export all types from split files
export * from './entities';
export * from './relationships';
export * from './financial';
export * from './ui';

// Auth context types
export interface AuthState {
  user: import('./entities').User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// For AppContext state - using flattened data
export interface AppState {
  users: import('./entities').User[];
  clients: import('./entities').Client[];
  equipments: import('./entities').Equipment[];
  materials: import('./entities').Material[];
  technicians: import('./entities').Technician[];
  services: import('./relationships').Service[];
  serviceTechnicians: import('./relationships').ServiceTechnician[];
  serviceMaterials: import('./relationships').ServiceMaterial[];
  orders: import('./relationships').Order[];
  orderMaterials: import('./relationships').OrderMaterial[];
  expenses: import('./entities').Expense[];
  payments: import('./relationships').Payment[];
  installments: import('./relationships').Installment[];
  appointments: import('./entities').Appointment[];
  financialData: import('./financial').FinancialData;
}

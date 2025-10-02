
import { useState } from 'react';
import { Expense } from '@/types';
import { getExpenses, saveExpenses } from '@/utils/storageManager';
import { v4 as uuidv4 } from 'uuid';

export function useExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>(getExpenses());

    const addExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>, updateBalance?: (value: number, operation: 'add' | 'subtract') => void) => {
        const newExpense: Expense = {
            ...expense,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...expenses, newExpense];
        saveExpenses(updated);
        setExpenses(updated);
        
        if (expense.isPaid && updateBalance) {
            updateBalance(expense.value, 'subtract');
        }
    };

    const updateExpense = (expense: Expense, updateBalance?: (value: number, operation: 'add' | 'subtract') => void) => {
        const oldExpense = expenses.find(e => e.id === expense.id);
        const updated = expenses.map(e => (e.id === expense.id ? { ...expense, updatedAt: new Date().toISOString() } : e));
      
        if (oldExpense && updateBalance) {
            if (!oldExpense.isPaid && expense.isPaid) {
                updateBalance(expense.value, 'subtract');
            } else if (oldExpense.isPaid && !expense.isPaid) {
                updateBalance(expense.value, 'add');
            } else if (oldExpense.isPaid && expense.isPaid && oldExpense.value !== expense.value) {
                const difference = expense.value - oldExpense.value;
                updateBalance(Math.abs(difference), difference > 0 ? 'subtract' : 'add');
            }
        }
        
        saveExpenses(updated);
        setExpenses(updated);
    };

    const deleteExpense = (id: string, updateBalance?: (value: number, operation: 'add' | 'subtract') => void) => {
        const expenseToDelete = expenses.find(e => e.id === id);
        if (expenseToDelete?.isPaid && updateBalance) {
            updateBalance(expenseToDelete.value, 'add');
        }
        
        const updated = expenses.filter(e => e.id !== id);
        saveExpenses(updated);
        setExpenses(updated);
    };

    return {
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        setExpenses
    };
}

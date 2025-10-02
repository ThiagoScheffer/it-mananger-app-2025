
import { useState } from 'react';
import { Technician } from '@/types';
import { getTechnicians, saveTechnicians } from '@/utils/storageManager';
import { v4 as uuidv4 } from 'uuid';

export function useTechnicians() {
    const [technicians, setTechnicians] = useState<Technician[]>(getTechnicians());

    const addTechnician = (technician: Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTechnician: Technician = {
            ...technician,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...technicians, newTechnician];
        saveTechnicians(updated);
        setTechnicians(updated);
    };

    const updateTechnician = (technician: Technician) => {
        const updated = technicians.map(t => (t.id === technician.id ? { ...technician, updatedAt: new Date().toISOString() } : t));
        saveTechnicians(updated);
        setTechnicians(updated);
    };

    const deleteTechnician = (id: string) => {
        const updated = technicians.filter(t => t.id !== id);
        saveTechnicians(updated);
        setTechnicians(updated);
    };

    return {
        technicians,
        addTechnician,
        updateTechnician,
        deleteTechnician,
        setTechnicians
    };
}


import { useState } from 'react';
import { Client } from '@/types';
import { getClients, saveClients } from '@/utils/storageManager';
import { v4 as uuidv4 } from 'uuid';

export function useClients() {
    const [clients, setClients] = useState<Client[]>(getClients());

    const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newClient: Client = {
            ...client,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...clients, newClient];
        saveClients(updated);
        setClients(updated);
    };

    const updateClient = (client: Client) => {
        const updated = clients.map(c => (c.id === client.id ? { ...client, updatedAt: new Date().toISOString() } : c));
        saveClients(updated);
        setClients(updated);
    };

    const deleteClient = (id: string) => {
        const updated = clients.filter(c => c.id !== id);
        saveClients(updated);
        setClients(updated);
    };

    return {
        clients,
        addClient,
        updateClient,
        deleteClient,
        setClients
    };
}

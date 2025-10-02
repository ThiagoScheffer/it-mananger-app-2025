
import { useState } from 'react';
import { User } from '@/types';
import { getUsers, saveUsers } from '@/utils/storageManager';
import { v4 as uuidv4 } from 'uuid';

export function useUsers() {
    const [users, setUsers] = useState<User[]>(getUsers());

    const addUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newUser: User = {
            ...user,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [...users, newUser];
        saveUsers(updated);
        setUsers(updated);
    };

    const updateUser = (user: User) => {
        const updated = users.map(u => (u.id === user.id ? { ...user, updatedAt: new Date().toISOString() } : u));
        saveUsers(updated);
        setUsers(updated);
    };

    const deleteUser = (id: string) => {
        const updated = users.filter(u => u.id !== id);
        saveUsers(updated);
        setUsers(updated);
    };

    return {
        users,
        addUser,
        updateUser,
        deleteUser,
        setUsers
    };
}

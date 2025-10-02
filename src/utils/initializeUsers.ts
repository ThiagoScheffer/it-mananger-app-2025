
import { User } from "@/types";
import { v4 as uuidv4 } from "uuid";
import {
    getUsers,
    saveUsers
} from '@/utils/storageManager';

// Function to initialize default users if they don't exist in localStorage
export function initializeDefaultUsers() {
    try {
        const currentUsers = getUsers();

        // If no users exist, create default admin user
        if (currentUsers.length === 0) {
            const adminUser: User = {
                id: uuidv4(),
                email: 'admin@gestorpro.com',
                name: 'Administrador',
                role: 'admin',
                isActive: true,
                password: 'admin', // Basic default password
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            saveUsers([adminUser]);
            console.log('Created default admin user');
        }
    } catch (error) {
        console.error("Error initializing default users:", error);
    }
}

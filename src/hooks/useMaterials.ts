
import { useState } from 'react';
import { Material } from '@/types';
import { getMaterials, saveMaterials } from '@/utils/storageManager';
import { useStockMovement } from './useStockMovement';
import { v4 as uuidv4 } from 'uuid';

export function useMaterials() {
    const [materials, setMaterials] = useState<Material[]>(getMaterials());
    const { recordMovement } = useStockMovement();

    const addMaterial = (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'returnValue'>) => {
        const newMaterial: Material = {
            ...material,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            returnValue: 0,
            stock: material.stock || 0,
        };
        const updated = [...materials, newMaterial];
        saveMaterials(updated);
        setMaterials(updated);

        // Record initial stock movement if stock > 0
        if (newMaterial.stock && newMaterial.stock > 0) {
            recordMovement(
                newMaterial.id,
                'in',
                newMaterial.stock,
                'manual_adjustment',
                0,
                undefined,
                'Initial stock entry'
            );
        }
    };

    const updateMaterial = (material: Material) => {
        const existingMaterial = materials.find(m => m.id === material.id);
        const previousStock = existingMaterial?.stock || 0;
        const newStock = material.stock || 0;

        const updated = materials.map(m => (m.id === material.id ? { ...material, updatedAt: new Date().toISOString() } : m));
        saveMaterials(updated);
        setMaterials(updated);

        // Record stock movement if stock changed
        if (previousStock !== newStock) {
            const quantity = Math.abs(newStock - previousStock);
            const movementType = newStock > previousStock ? 'in' : 'out';
            
            recordMovement(
                material.id,
                movementType,
                quantity,
                'manual_adjustment',
                previousStock,
                undefined,
                'Stock adjustment'
            );
        }
    };

    const deleteMaterial = (id: string) => {
        const updated = materials.filter(m => m.id !== id);
        saveMaterials(updated);
        setMaterials(updated);
    };

    const updateStock = (materialId: string, newStock: number, reason: string = 'manual_adjustment') => {
        const material = materials.find(m => m.id === materialId);
        if (!material) return;

        const previousStock = material.stock || 0;
        const quantity = Math.abs(newStock - previousStock);
        const movementType = newStock > previousStock ? 'in' : 'out';

        // Update material stock
        const updatedMaterial = { ...material, stock: newStock, updatedAt: new Date().toISOString() };
        const updated = materials.map(m => m.id === materialId ? updatedMaterial : m);
        saveMaterials(updated);
        setMaterials(updated);

        // Record stock movement
        if (previousStock !== newStock) {
            recordMovement(
                materialId,
                movementType,
                quantity,
                'manual_adjustment',
                previousStock,
                undefined,
                reason
            );
        }
    };

    return {
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        updateStock,
        setMaterials
    };
}

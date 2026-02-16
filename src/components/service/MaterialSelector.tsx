import { useState, useMemo, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ServiceMaterial } from "@/types/relationships";

interface MaterialSelectorProps {
    selectedMaterials: ServiceMaterial[]; // Using your flattened interface
    onMaterialsChange: (materials: ServiceMaterial[]) => void;
}

export default function MaterialSelector({ selectedMaterials, onMaterialsChange }: MaterialSelectorProps) {
    const { materials } = useAppContext();
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null); // Store the entire material object
    const [quantity, setQuantity] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Find full material object when needed
    const getMaterial = (materialId: string) =>
        materials.find(m => m.id === materialId);

    const GetMaterialinfo = (materials: ServiceMaterial[], materialId: string) => {
        const material = materials.find(m => m.materialId === materialId);
        return material ? {
            ...material,
            material: getMaterial(material.materialId) // Fetch full material details
        } : null;
    }

    // Generate color for material type
    const getMaterialTypeColor = (type: string): string => {
        const colors = [
            "bg-blue-100 text-blue-800",
            "bg-green-100 text-green-800",
            "bg-yellow-100 text-yellow-800",
            "bg-purple-100 text-purple-800",
            "bg-pink-100 text-pink-800",
            "bg-indigo-100 text-indigo-800",
            "bg-red-100 text-red-800",
            "bg-gray-100 text-gray-800",
        ];

        const hash = type.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    // Group and filter materials
    const groupedMaterials = useMemo(() => {
        const filtered = materials
            .filter(m => m.status === "available")
            .filter(m =>
                searchTerm === "" ||
                m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.model.toLowerCase().includes(searchTerm.toLowerCase())
            );

        return filtered.reduce((acc, material) => {
            if (!acc[material.type]) {
                acc[material.type] = [];
            }
            acc[material.type].push(material);
            return acc;
        }, {} as Record<string, typeof materials>);
    }, [materials, searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddMaterial = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedMaterial) {
            toast.error("Select a material");
            return;
        }

        if (quantity <= 0) {
            toast.error("Quantity must be greater than zero");
            return;
        }

        const existingMaterial = selectedMaterials.find(sm => sm.materialId === selectedMaterial.id);
        if (existingMaterial) {
            toast.error("This material has already been added");
            return;
        }
        const now = new Date().toISOString();
        const newServiceMaterial = {
            id: `temp-${Date.now()}`,
            serviceId: "temp",
            materialId: selectedMaterial.id,
            material: selectedMaterial,
            quantity: quantity,
            priceSnapshot: selectedMaterial.sellingPrice,
            createdAt: now, // required
            updatedAt: now,  // required
        };

        onMaterialsChange([...selectedMaterials, newServiceMaterial]);
        setSelectedMaterial(null);
        setSearchTerm("");
        setQuantity(1);
        toast.success("Material added");
    };

    const handleMaterialSelect = (material: any) => {
        setSelectedMaterial(material);
        setSearchTerm(`${material.type} - ${material.model}`);
        setIsOpen(false);
    };

    const handleRemoveMaterial = (materialId: string) => {
        const updated = selectedMaterials.filter(sm => sm.materialId !== materialId);
        onMaterialsChange(updated);
        toast.success("Material removed");
    };

    const handleQuantityChange = (materialId: string, newQuantity: number) => {
        if (newQuantity <= 0) return;

        const updated = selectedMaterials.map(sm =>
            sm.materialId === materialId
                ? { ...sm, quantity: newQuantity }
                : sm
        );
        onMaterialsChange(updated);
    };

    const formatCurrency = (value?: number) => {
        if (typeof value !== "number" || isNaN(value)) {
            return "R$ 0,00";
        }
        return value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    };

    const totalMaterialCost = selectedMaterials.reduce((sum, sm) =>
        sum + (sm.priceSnapshot * sm.quantity), 0
    );

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Materials</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium">Material</label>
                    <div className="relative" ref={selectRef}>
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by model or type..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value === "") {
                                    setSelectedMaterial(null);
                                }
                            }}
                            onClick={toggleDropdown}
                        />

                        {isOpen && (
                            <div className="absolute z-10 mt-1 w-full border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                                {Object.keys(groupedMaterials).length > 0 ? (
                                    Object.entries(groupedMaterials).map(([type, materials]) => (
                                        <div key={type}>
                                            <div className="px-4 py-2 text-sm font-medium flex items-center sticky top-0 bg-gray-50">
                                                <Badge className={`mr-2 ${getMaterialTypeColor(type)}`}>
                                                    {type}
                                                </Badge>
                                                <span className="text-muted-foreground">
                                                    ({materials.length} {materials.length === 1 ? 'item' : 'items'})
                                                </span>
                                            </div>
                                            {materials.map((material) => (
                                                <div
                                                    key={material.id}
                                                    className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                                    onClick={() => handleMaterialSelect(material)}
                                                >
                                                    <span>{material.model}</span>
                                                    <span className="text-muted-foreground ml-2">
                                                        {formatCurrency(material.sellingPrice)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                        No materials found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                </div>

                <div className="flex items-end">
                    <Button
                        onClick={handleAddMaterial}
                        className="w-full"
                        type="button"
                        disabled={!selectedMaterial}
                    >
                        Add Material
                    </Button>
                </div>
            </div>

            {selectedMaterials.length > 0 && (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedMaterials.map((sm) => {
                                const material = getMaterial(sm.materialId);
                                const smWithMaterial = GetMaterialinfo(selectedMaterials, sm.materialId);

                                if (!smWithMaterial || !material) return null; // Skip if material not found

                                return (
                                    <TableRow key={sm.materialId}>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Badge className={`mr-2 ${getMaterialTypeColor(material.type)}`}>
                                                    {material.type}
                                                </Badge>
                                                {material.model}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={sm.quantity}
                                                onChange={(e) => handleQuantityChange(sm.materialId, parseInt(e.target.value) || 1)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>{formatCurrency(sm.priceSnapshot)}</TableCell>
                                        <TableCell>{formatCurrency(sm.priceSnapshot * sm.quantity)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveMaterial(sm.materialId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow>
                                <TableCell colSpan={3} className="font-medium">
                                    Total Materials Cost:
                                </TableCell>
                                <TableCell className="font-medium">
                                    {formatCurrency(totalMaterialCost)}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
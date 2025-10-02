import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, Material, Service } from "@/types";
import { toast } from "sonner";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
} from "@/components/ui/command";
import { getServiceById, getOrderMaterialsByOrderId, getMaterialById } from "@/utils/dataHelpers";

interface OrderDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    order?: Order;
}

interface MaterialItem {
    material: Material;
    quantity: number;
}

export default function OrderDialog({ open, setOpen, order }: OrderDialogProps) {
    const { addOrderWithMaterials, updateOrderWithMaterials, addOrder, updateOrder, materials, services } = useAppContext();

    const [formData, setFormData] = useState({
        orderCode: "",
        store: "",
        estimatedDeliveryTime: "",
        status: "paid" as "paid" | "inRoute" | "delivered",
        relatedServiceId: "",
    });

    const [selectedMaterials, setSelectedMaterials] = useState<MaterialItem[]>([]);

    // Para controle da busca de serviço relacionado
    const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
    const [serviceQuery, setServiceQuery] = useState("");

    // Para controle da busca de materiais
    const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
    const [materialQuery, setMaterialQuery] = useState("");
    const [selectedMaterialId, setSelectedMaterialId] = useState("");
    const [materialQuantity, setMaterialQuantity] = useState(1);

    useEffect(() => {
        if (order) {
            const relatedService = order.relatedServiceId ? getServiceById(order.relatedServiceId) : undefined;
            const orderMats = getOrderMaterialsByOrderId(order.id);
            const materialsWithData = orderMats.map(om => {
                const material = getMaterialById(om.materialId);
                return { material: material!, quantity: om.quantity };
            }).filter(item => item.material);

            setFormData({
                orderCode: order.orderCode,
                store: order.store,
                estimatedDeliveryTime: order.estimatedDeliveryTime.toString(),
                status: order.status,
                relatedServiceId: order.relatedServiceId || "",
            });
            setSelectedMaterials(materialsWithData);
        } else {
            setFormData({
                orderCode: "",
                store: "",
                estimatedDeliveryTime: "",
                status: "inRoute",
                relatedServiceId: "",
            });
            setSelectedMaterials([]);
        }
        setSelectedMaterialId("");
        setMaterialQuantity(1);
        setServiceQuery("");
        setMaterialQuery("");
    }, [order, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value: string) => {
        setFormData(prev => ({ ...prev, status: value as "paid" | "inRoute" | "delivered" }));
    };

    // Serviços filtrados para busca
    const filteredServices = serviceQuery
        ? services.filter(s => s.name.toLowerCase().includes(serviceQuery.toLowerCase()))
        : services;

    // Materiais filtrados para busca
    const filteredMaterials = materialQuery
        ? materials.filter(m =>
            (m.type + " " + m.model).toLowerCase().includes(materialQuery.toLowerCase())
        )
        : materials;

    const addMaterialToOrder = (material: Material, quantity: number) => {
        const existing = selectedMaterials.find(item => item.material.id === material.id);
        if (existing) {
            setSelectedMaterials(prev =>
                prev.map(item =>
                    item.material.id === material.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            );
        } else {
            setSelectedMaterials(prev => [...prev, { material, quantity }]);
        }
        setSelectedMaterialId("");
        setMaterialQuantity(1);
        setMaterialSearchOpen(false);
        setMaterialQuery("");
    };

    const removeMaterialFromOrder = (materialId: string) => {
        setSelectedMaterials(prev => prev.filter(item => item.material.id !== materialId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.orderCode.trim()) {
            toast.error("O código do pedido é obrigatório");
            return;
        }

        if (!formData.store.trim()) {
            toast.error("A loja é obrigatória");
            return;
        }

        if (!selectedMaterials.length) {
            toast.error("Adicione pelo menos um material");
            return;
        }

        // Convert selectedMaterials to the format expected by the functions
        const materialsData = selectedMaterials.map(item => ({
            materialId: item.material.id,
            quantity: item.quantity
        }));

        const orderData = {
            orderCode: formData.orderCode,
            store: formData.store,
            estimatedDeliveryTime: formData.estimatedDeliveryTime,
            status: formData.status,
            relatedServiceId: formData.relatedServiceId,
            materials: materialsData
        };

        if (order) {
            updateOrderWithMaterials({
                ...order,
                ...orderData
            }, materialsData);
            toast.success("Encomenda atualizada com sucesso");
        } else {
            addOrderWithMaterials(orderData, materialsData);
            toast.success("Encomenda adicionada com sucesso");
        }

        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{order ? "Editar Encomenda" : "Nova Encomenda"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <label htmlFor="orderCode" className="text-sm font-medium">
                                Código do Pedido*
                            </label>
                            <Input
                                id="orderCode"
                                name="orderCode"
                                value={formData.orderCode}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="store" className="text-sm font-medium">
                                Loja*
                            </label>
                            <Input
                                id="store"
                                name="store"
                                value={formData.store}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <label htmlFor="estimatedDeliveryTime" className="text-sm font-medium">
                                Tempo Estimado de Entrega
                            </label>
                            <Input
                                id="estimatedDeliveryTime"
                                name="estimatedDeliveryTime"
                                value={formData.estimatedDeliveryTime}
                                onChange={handleChange}
                                placeholder="Ex: 5-7 dias úteis"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="status" className="text-sm font-medium">
                                Status da Encomenda
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="p-2 border rounded"
                            >
                                <option value="paid">Pago</option>
                                <option value="inRoute">Em Rota</option>
                                <option value="delivered">Entregue</option>
                            </select>
                        </div>
                    </div>

                    {/* Serviço Relacionado com busca */}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Serviço Relacionado</label>
                        <button
                            type="button"
                            className="w-full p-2 border rounded text-left"
                            onClick={() => setServiceSearchOpen(true)}
                        >
                            {formData.relatedServiceId
                                ? services.find(s => s.id === formData.relatedServiceId)?.name
                                : "Selecione um serviço (opcional)"}
                        </button>

                        <CommandDialog open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                            <CommandInput
                                placeholder="Buscar serviço..."
                                value={serviceQuery}
                                onValueChange={setServiceQuery}
                                autoFocus
                            />
                            <CommandList>
                                {filteredServices.length === 0 && (
                                    <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                                )}
                                {filteredServices.map(service => (
                                    <CommandItem
                                        key={service.id}
                                        onSelect={() => {
                                            setFormData(prev => ({ ...prev, relatedServiceId: service.id }));
                                            setServiceSearchOpen(false);
                                            setServiceQuery("");
                                        }}
                                    >
                                        {service.name}
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </CommandDialog>
                    </div>

                    {/* Materiais Encomendados com busca */}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Materiais Encomendados*</label>
                        <button
                            type="button"
                            className="w-full p-2 border rounded text-left"
                            onClick={() => setMaterialSearchOpen(true)}
                        >
                            {selectedMaterialId
                                ? (() => {
                                    const mat = materials.find(m => m.id === selectedMaterialId);
                                    return mat ? `${mat.type} - ${mat.model}` : "Selecione um material";
                                })()
                                : "Selecione um material"}
                        </button>

                        <CommandDialog open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                            <CommandInput
                                placeholder="Buscar material..."
                                value={materialQuery}
                                onValueChange={setMaterialQuery}
                                autoFocus
                            />
                            <CommandList>
                                {filteredMaterials.length === 0 && (
                                    <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                                )}
                                {filteredMaterials.map(material => (
                                    <CommandItem
                                        key={material.id}
                                        onSelect={() => setSelectedMaterialId(material.id)}
                                    >
                                        {material.type} - {material.model}
                                    </CommandItem>
                                ))}
                            </CommandList>
                            {selectedMaterialId && (
                                <div className="p-4 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={materialQuantity}
                                        onChange={e => setMaterialQuantity(parseInt(e.target.value) || 1)}
                                        className="w-24"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => addMaterialToOrder(
                                            materials.find(m => m.id === selectedMaterialId)!,
                                            materialQuantity
                                        )}
                                    >
                                        Adicionar
                                    </Button>
                                </div>
                            )}
                        </CommandDialog>

                        {/* Lista de materiais adicionados */}
                        <div className="border rounded-md p-2 max-h-48 overflow-auto">
                            {selectedMaterials.length === 0 && <p className="text-sm text-gray-500">Nenhum material adicionado.</p>}
                            {selectedMaterials.map(item => (
                                <div key={item.material.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                                    <div>
                                        {item.material.type} - {item.material.model} (Qtd: {item.quantity})
                                    </div>
                                    <Button size="icon" variant="destructive" onClick={() => removeMaterialFromOrder(item.material.id)}>
                                        &times;
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

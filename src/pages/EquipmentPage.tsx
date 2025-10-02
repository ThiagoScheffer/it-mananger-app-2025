
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function EquipmentPage() {
  const { clients, equipments, addEquipment, updateEquipment, deleteEquipment } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<typeof equipments[0] | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | undefined>(undefined);
  
  // Form state for adding/editing equipment
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    type: "",
    model: "",
    serialNumber: "",
    status: "operational" as "operational" | "needs_service" | "decommissioned",
    notes: ""
  });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleAddEquipment = () => {
    setEditingEquipment(undefined);
    setFormData({
      name: "",
      clientId: "",
      type: "",
      model: "",
      serialNumber: "",
      status: "operational",
      notes: ""
    });
    setDialogOpen(true);
  };
  
  const handleEditEquipment = (equipment: typeof equipments[0]) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      clientId: equipment.clientId,
      type: equipment.type,
      model: equipment.model,
      serialNumber: equipment.serialNumber || "",
      status: equipment.status,
      notes: equipment.notes || ""
    });
    setDialogOpen(true);
  };
  
  const handleDeleteClick = (id: string) => {
    setEquipmentToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (equipmentToDelete) {
      deleteEquipment(equipmentToDelete);
      toast.success("Equipamento excluído com sucesso");
      setDeleteDialogOpen(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      status: value as "operational" | "needs_service" | "decommissioned" 
    }));
  };
  
  const handleClientChange = (value: string) => {
    setFormData(prev => ({ ...prev, clientId: value }));
  };
  
  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.clientId) {
      toast.error("Nome e Cliente são campos obrigatórios");
      return;
    }
    
    try {
      if (editingEquipment) {
        updateEquipment({
          ...editingEquipment,
          name: formData.name,
          clientId: formData.clientId,
          type: formData.type,
          model: formData.model,
          serialNumber: formData.serialNumber,
          status: formData.status,
          notes: formData.notes
        });
        toast.success("Equipamento atualizado com sucesso");
      } else {
        addEquipment({
          name: formData.name,
          clientId: formData.clientId,
          type: formData.type,
          model: formData.model,
          serialNumber: formData.serialNumber,
          status: formData.status,
          notes: formData.notes
        });
        toast.success("Equipamento adicionado com sucesso");
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error("Erro ao salvar equipamento");
    }
  };

  // Filter equipment based on search query
  const filteredEquipments = equipments.filter(
    (equipment) => {
      const clientName = clients.find(c => c.id === equipment.clientId)?.name || "";
      const searchTermLower = searchQuery.toLowerCase();
      
      return equipment.name.toLowerCase().includes(searchTermLower) ||
        equipment.type.toLowerCase().includes(searchTermLower) ||
        equipment.model.toLowerCase().includes(searchTermLower) ||
        clientName.toLowerCase().includes(searchTermLower);
    }
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipamentos</h1>
        <Button className="anibtn-drawstroke" onClick={handleAddEquipment}>+ Novo Equipamento</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Gerenciamento de Equipamentos</h2>
        
        <div className="mb-6 relative">
          <Input
            placeholder="Buscar por nome, tipo, modelo, cliente..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 border-b">Nome</th>
                <th className="p-3 border-b">Cliente</th>
                <th className="p-3 border-b">Tipo</th>
                <th className="p-3 border-b">Modelo</th>
                <th className="p-3 border-b">Nº de Série</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{equipment.name}</td>
                  <td className="p-3">{clients.find(c => c.id === equipment.clientId)?.name || "Cliente não encontrado"}</td>
                  <td className="p-3">{equipment.type}</td>
                  <td className="p-3">{equipment.model}</td>
                  <td className="p-3">{equipment.serialNumber || "-"}</td>
                  <td className="p-3">
                    <StatusBadge status={equipment.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditEquipment(equipment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(equipment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredEquipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Nenhum equipamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEquipment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do Equipamento*
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="clientId" className="text-sm font-medium">
                  Cliente*
                </label>
                <Select value={formData.clientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Tipo
                  </label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="Ex: Notebook, Desktop, Impressora"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="model" className="text-sm font-medium">
                    Modelo
                  </label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="Ex: Dell XPS 15, HP LaserJet"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label htmlFor="serialNumber" className="text-sm font-medium">
                    Número de Série
                  </label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select value={formData.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operacional</SelectItem>
                      <SelectItem value="needs_service">Precisa de Manutenção</SelectItem>
                      <SelectItem value="decommissioned">Desativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Observações
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Adicione informações relevantes sobre o equipamento"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

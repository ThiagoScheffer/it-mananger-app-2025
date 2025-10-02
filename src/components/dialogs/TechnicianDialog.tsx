
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Technician } from "@/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TechnicianDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  technician?: Technician;
}

export default function TechnicianDialog({ open, setOpen, technician }: TechnicianDialogProps) {
  const { addTechnician, updateTechnician } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    status: "active" as "active" | "inactive"
  });

  useEffect(() => {
    if (technician) {
      setFormData({
        name: technician.name,
        specialty: technician.specialty || "",
        status: technician.status
      });
    } else {
      setFormData({
        name: "",
        specialty: "",
        status: "active"
      });
    }
  }, [technician, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as "active" | "inactive" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("O nome do técnico é obrigatório");
      return;
    }
    
    if (technician) {
      updateTechnician({
        ...technician,
        name: formData.name,
        specialty: formData.specialty,
        status: formData.status
      });
      toast.success("Técnico atualizado com sucesso");
    } else {
      addTechnician({
        name: formData.name,
        specialty: formData.specialty,
        status: formData.status
      });
      toast.success("Técnico adicionado com sucesso");
    }
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{technician ? "Editar Técnico" : "Novo Técnico"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome*
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="specialty" className="text-sm font-medium">
                Especialidade
              </label>
              <Input
                id="specialty"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

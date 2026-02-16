
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

interface TechnicianSelectorProps {
  selectedTechnicians: string[];
  onTechniciansChange: (technicians: string[]) => void;
}

export default function TechnicianSelector({ selectedTechnicians, onTechniciansChange }: TechnicianSelectorProps) {
  const { technicians } = useAppContext();
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");

  const handleAddTechnician = (e: React.MouseEvent) => {
    e.stopPropagation(); // Add this line
    if (!selectedTechnicianId) {
      toast.error("Select a technician");
      return;
    }

    const technician = technicians.find(t => t.id === selectedTechnicianId);
    if (!technician) {
      toast.error("Technician not found");
      return;
    }

    // Check if technician is already added
    const existingTechnician = selectedTechnicians.find(id => id === selectedTechnicianId);
    if (existingTechnician) {
      toast.error("This technician has already been added");
      return;
    }

    onTechniciansChange([...selectedTechnicians, selectedTechnicianId]);
    setSelectedTechnicianId("");
    toast.success("Technician added");
  };

  const handleRemoveTechnician = (technicianId: string) => {
    const updated = selectedTechnicians.filter(id => id !== technicianId);
    onTechniciansChange(updated);
    toast.success("Technician removed");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Technicians</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Technician</label>
          <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a technician" />
            </SelectTrigger>
            <SelectContent>
              {technicians
                .filter(t => t.status === "active")
                .map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.name} - {technician.specialty}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleAddTechnician} className="w-full" type="button">
            Add Technician
          </Button>
        </div>
      </div>

      {selectedTechnicians.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Technicians:</label>
          <div className="flex flex-wrap gap-2">
            {selectedTechnicians.map((technicianId) => {
              const technician = technicians.find(t => t.id === technicianId);
              return (
                <Badge key={technicianId} variant="secondary" className="flex items-center gap-2">
                  {technician?.name || 'Unknown'} - {technician?.specialty || 'N/A'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveTechnician(technicianId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

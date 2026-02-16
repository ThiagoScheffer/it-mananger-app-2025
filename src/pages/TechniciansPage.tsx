
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import TechnicianDialog from "@/components/dialogs/TechnicianDialog";
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
import { toast } from "sonner";

export default function TechniciansPage() {
  const { technicians, deleteTechnician } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<typeof technicians[0] | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<string | undefined>(undefined);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddTechnician = () => {
    setEditingTechnician(undefined);
    setDialogOpen(true);
  };

  const handleEditTechnician = (technician: typeof technicians[0]) => {
    setEditingTechnician(technician);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTechnicianToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (technicianToDelete) {
      deleteTechnician(technicianToDelete);
      toast.success("Technician deleted successfully");
      setDeleteDialogOpen(false);
    }
  };

  const filteredTechnicians = technicians.filter(
    (technician) =>
      technician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (technician.specialty && technician.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Technicians</h1>
        <Button className="anibtn-drawstroke" onClick={handleAddTechnician}>+ New Technician</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Technician Management</h2>

        <div className="mb-6 relative">
          <Input
            placeholder="Search by name, specialty..."
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
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Specialty</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Registration Date</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTechnicians.map((technician) => (
                <tr key={technician.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{technician.name}</td>
                  <td className="p-3">{technician.specialty || "-"}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${technician.status === 'active' ?
                        'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`
                    }>
                      {technician.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">{new Date(technician.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditTechnician(technician)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(technician.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTechnicians.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No technicians found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TechnicianDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        technician={editingTechnician}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this technician? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

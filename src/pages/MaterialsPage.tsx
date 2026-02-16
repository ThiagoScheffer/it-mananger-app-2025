
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Filter, ArrowUpAZ, ArrowDownAZ, Tag } from "lucide-react";
import MaterialDialog from "@/components/dialogs/MaterialDialog";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type SortDirection = "asc" | "desc" | null;
type SortField = "type" | "model" | null;

export default function MaterialsPage() {
  const { materials, deleteMaterial } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<typeof materials[0] | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | undefined>(undefined);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddMaterial = () => {
    setEditingMaterial(undefined);
    setDialogOpen(true);
  };

  const handleEditMaterial = (material: typeof materials[0]) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMaterialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      deleteMaterial(materialToDelete);
      toast.success("Material deleted successfully");
      setDeleteDialogOpen(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
    } else {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") {
        setSortField(null);
      }
    }
  };

  const handleFilterType = (type: string | null) => {
    setFilterType(type);
  };

  // Extract unique material types for filtering
  const uniqueTypes = Array.from(new Set(materials.map(material => material.type)));

  const calculateReturnValue = (material: typeof materials[0]) => {
    if (!material.purchasePrice || !material.sellingPrice) return 0;
    return material.sellingPrice - material.purchasePrice;
  }

  // Apply filters and sorting
  let filteredMaterials = materials.filter(
    (material) =>
      material.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Apply type filter
  if (filterType) {
    filteredMaterials = filteredMaterials.filter(material => material.type === filterType);
  }

  // Apply sorting
  if (sortField && sortDirection) {
    filteredMaterials = [...filteredMaterials].sort((a, b) => {
      const valA = a[sortField].toLowerCase();
      const valB = b[sortField].toLowerCase();

      if (sortDirection === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });
  }

  // Function to get status color based on material status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-300";
      case "unavailable":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  //check if the profit margin is greater than 20% and return the color accordingly
  const getReturnValueStyle = (material: typeof materials[0]) => {
    const { returnValue, sellingPrice } = material;
    if (!sellingPrice || sellingPrice === 0) return "text-gray-700";

    const marginPercent = (calculateReturnValue(material) / sellingPrice) * 100;

    if (marginPercent >= 40) return "text-green-600";
    if (marginPercent >= 20) return "text-blue-600";
    if (marginPercent >= 15) return "bg-orange-50 text-orange-600";
    return "bg-red-50 text-red-600";
  };

  // Function to generate color for material type
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

    // Use a hash function to consistently assign colors to types
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Materials</h1>
        <Button className="anibtn-drawstroke" onClick={handleAddMaterial}>+ New Material</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Material Management</h2>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Input
              placeholder="Search by type, model..."
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

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 items-center">
                  <Filter className="h-4 w-4" />
                  <span>Filter Type</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[200px]">
                <DropdownMenuItem onClick={() => handleFilterType(null)}>
                  All Types
                </DropdownMenuItem>
                {uniqueTypes.map((type) => (
                  <DropdownMenuItem key={type} onClick={() => handleFilterType(type)}>
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="flex gap-2 items-center"
              onClick={() => toggleSort('type')}
            >
              {sortField === 'type' && sortDirection === 'asc' ? (
                <ArrowUpAZ className="h-4 w-4" />
              ) : sortField === 'type' && sortDirection === 'desc' ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpAZ className="h-4 w-4 text-gray-400" />
              )}
              <span>By Type</span>
            </Button>

            <Button
              variant="outline"
              className="flex gap-2 items-center"
              onClick={() => toggleSort('model')}
            >
              {sortField === 'model' && sortDirection === 'asc' ? (
                <ArrowUpAZ className="h-4 w-4" />
              ) : sortField === 'model' && sortDirection === 'desc' ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpAZ className="h-4 w-4 text-gray-400" />
              )}
              <span>By Model</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-1 border-b">Type</th>
                <th className="p-1 border-b">Model</th>
                <th className="p-1 border-b">Description</th>
                <th className="p-1 border-b">Stock</th>
                <th className="p-1 border-b">Status</th>
                <th className="p-1 border-b">Purchase Value</th>
                <th className="p-1 border-b">Sale Value</th>
                <th className="p-1 border-b">Return</th>
                <th className="p-1 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="border-b hover:bg-gray-50">
                  <td className="p-1">
                    <Badge className={getMaterialTypeColor(material.type)} variant="outline">
                      <Tag className="w-3 h-3 mr-1" />
                      {material.type}
                    </Badge>
                  </td>
                  <td className="p-1">{material.model}</td>
                  <td className="p-1 max-w-xs truncate">{material.description}</td>
                  <td className="p-1">{material.stock || 0}</td>
                  <td className="p-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                      {material.status === "available" ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="p-1">R$ {material.purchasePrice.toFixed(2)}</td>
                  <td className="p-1">R$ {material.sellingPrice.toFixed(2)}</td>
                  <td className={`p-1 ${getReturnValueStyle(material)}`}>R$ {(calculateReturnValue(material) ?? 0).toFixed(2)}</td>
                  <td className="p-1">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditMaterial(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No materials found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MaterialDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        material={editingMaterial}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
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

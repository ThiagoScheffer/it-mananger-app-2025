
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Material } from "@/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface MaterialDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  material?: Material;
}

type MaterialFormData = {
  type: string;
  model: string;
  description: string;
  purchaseSites: string;
  purchasePrice: number;
  sellingPrice: number;
  returnValue: number; // This will be calculated later
  status: "available" | "unavailable";
  stock: number;
};

export default function MaterialDialog({ open, setOpen, material }: MaterialDialogProps) {
  const { addMaterial, updateMaterial, materials } = useAppContext();
  const [typeCommandOpen, setTypeCommandOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const [formData, setFormData] = useState<MaterialFormData>({
    type: "",
    model: "",
    description: "",
    purchaseSites: "",
    purchasePrice: 0,
    sellingPrice: 0,
    returnValue: 0, // This will be calculated later
    status: "available" as "available" | "unavailable",
    stock: 0
  });
  const [isCheckingLink, setIsCheckingLink] = useState(false);

  // Function to check if URL exists
  const checkLinkAvailability = async (url: string) => {
    if (!url) return;

    try {
      setIsCheckingLink(true);

      // Add https if missing
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

      const response = await fetch(formattedUrl, {
        method: 'HEAD', // Only request headers, not full content
        mode: 'no-cors' // Bypass CORS for this demo (note: limited reliability)
      });

      // If we get here, the request didn't fail completely
      setFormData(prev => ({
        ...prev,
        status: 'available'
      }));
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        status: 'unavailable'
      }));
    } finally {
      setIsCheckingLink(false);
    }
  };

  // Debounced version to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      checkLinkAvailability(formData.purchaseSites);
    }, 1000); // Wait 1 second after last change

    return () => clearTimeout(timer);
  }, [formData.purchaseSites]);


  useEffect(() => {
    if (material) {
      setFormData({
        type: material.type,
        model: material.model,
        description: material.description || "",
        purchaseSites: material.purchaseSites || "",
        purchasePrice: material.purchasePrice,
        sellingPrice: material.sellingPrice,
        returnValue: material.sellingPrice - material.purchasePrice,
        status: material.status || "available",
        stock: material.stock || 0
      });
    } else {
      setFormData({
        type: "",
        model: "",
        description: "",
        purchaseSites: "",
        purchasePrice: 0,
        sellingPrice: 0,
        returnValue: 0,
        status: "available",
        stock: 0
      });
    }
  }, [material, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "purchasePrice" || name === "sellingPrice" || name === "stock") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as "available" | "unavailable" }));
  };

  // Extract unique material types for autocomplete
  const uniqueTypes = Array.from(new Set(materials.map(material => material.type)));

  const handleTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
    setTypeCommandOpen(false);
  };

  const handleOpenTypeCommand = () => {
    setTypeCommandOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type.trim()) {
      toast.error("Material type is required");
      return;
    }

    if (!formData.model.trim()) {
      toast.error("Material model is required");
      return;
    }

    // nao usado, mas mantido para referencia futura
    /*const returnValue = formData.sellingPrice - formData.purchasePrice;
    const calculateReturnValue = (material: typeof materials[0]) => {
        if (!material.purchasePrice || !material.sellingPrice) return 0;
        return material.sellingPrice - material.purchasePrice;
    }*/


    if (material) {
      updateMaterial({
        ...material,
        type: formData.type,
        model: formData.model,
        description: formData.description,
        purchaseSites: formData.purchaseSites,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        returnValue: formData.returnValue, // Include returnValue only for update
        status: formData.status,
        stock: formData.stock
      });
      toast.success("Material updated successfully");
    } else {
      // For new material, don't include returnValue as it's calculated in addMaterial
      addMaterial({
        type: formData.type,
        model: formData.model,
        description: formData.description,
        purchaseSites: formData.purchaseSites,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        status: formData.status,
        stock: formData.stock
      });
      toast.success("Material added successfully");
    }

    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{material ? "Edit Material" : "New Material"}</DialogTitle>
            <DialogDescription>
              {material ? "Edit material details below." : "Fill in the new material details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Type* (click for suggestions)
                </label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  onClick={handleOpenTypeCommand}
                  // onFocus={handleOpenTypeCommand} // Also open on focus
                  required
                  className="cursor-pointer"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="model" className="text-sm font-medium">
                  Model*
                </label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="purchaseSites" className="text-sm font-medium">
                  Purchase Sites
                </label>
                <Input
                  id="purchaseSites"
                  name="purchaseSites"
                  value={formData.purchaseSites}
                  onChange={handleChange}
                />
                {/* Display clickable link if purchaseSites has a value */}
                {formData.purchaseSites && (
                  <a
                    href={formData.purchaseSites.startsWith('http') ? formData.purchaseSites : `https://${formData.purchaseSites}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formData.purchaseSites}
                  </a>

                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="purchasePrice" className="text-sm font-medium">
                    Purchase Price ($)*
                  </label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="sellingPrice" className="text-sm font-medium">
                    Selling Price ($)*
                  </label>
                  <Input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="stock" className="text-sm font-medium">
                    Stock
                  </label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select value={formData.status} onValueChange={handleStatusChange} disabled={isCheckingLink}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CommandDialog open={typeCommandOpen} onOpenChange={setTypeCommandOpen}>
        <CommandInput
          placeholder="Search existing material types..."
          value={typeSearch}
          onValueChange={setTypeSearch}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const matches = uniqueTypes.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));
              if (matches.length === 0 && typeSearch.trim()) {
                handleTypeSelect(typeSearch.trim());
              }
            }
          }}
        />
        <CommandList className="max-h-[300px] overflow-y-auto">
          <CommandEmpty>No type found. Press Enter to create "{typeSearch}".</CommandEmpty>
          <CommandGroup heading="Existing Material Types">
            {uniqueTypes
              .sort((a, b) => a.localeCompare(b)) // Sort types alphabetically
              .map(type => (
                <CommandItem key={type} onSelect={() => handleTypeSelect(type)} value={type}>
                  {type}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

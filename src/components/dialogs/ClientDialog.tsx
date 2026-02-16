
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Client } from "@/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  client?: Client;
}

export default function ClientDialog({ open, setOpen, client }: ClientDialogProps) {
  const { addClient, updateClient } = useAppContext();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    workType: "",
    status: "active" as "active" | "inactive"
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email || "",
        address: client.address || "",
        workType: client.workType || "",
        status: client.status
      });
    } else {
      setFormData({
        name: "",
        email: "",
        address: "",
        workType: "",
        status: "active"
      });
    }
  }, [client, open]);

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
      toast.error("Client name is required");
      return;
    }

    if (client) {
      updateClient({
        ...client,
        name: formData.name,
        email: formData.email,
        address: formData.address,
        workType: formData.workType,
        status: formData.status,
      });
      toast.success("Client updated successfully");
    } else {
      addClient({
        name: formData.name,
        email: formData.email,
        address: formData.address,
        workType: formData.workType,
        status: formData.status,
      });
      toast.success("Client added successfully");
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name*
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
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="workType" className="text-sm font-medium">
                Work Type
              </label>
              <Input
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
  );
}

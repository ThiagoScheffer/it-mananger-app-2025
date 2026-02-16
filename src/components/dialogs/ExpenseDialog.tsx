
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Expense } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface ExpenseDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  expense?: Expense;
}

export default function ExpenseDialog({ open, setOpen, expense }: ExpenseDialogProps) {
  const { addExpense, updateExpense, updateFinancialSummary } = useAppContext();

  const [formData, setFormData] = useState({
    description: "",
    value: 0,
    category: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    isPaid: false,
    notes: ""
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        value: expense.value,
        category: expense.category,
        dueDate: new Date(expense.dueDate).toISOString().split('T')[0],
        isPaid: expense.isPaid,
        notes: expense.notes || ""
      });
    } else {
      setFormData({
        description: "",
        value: 0,
        category: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        isPaid: false,
        notes: ""
      });
    }
  }, [expense, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "value") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePaidChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPaid: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast.error("Expense description is required");
      return;
    }

    if (!formData.category.trim()) {
      toast.error("Expense category is required");
      return;
    }

    if (formData.value <= 0) {
      toast.error("Expense value must be greater than zero");
      return;
    }

    if (expense) {
      updateExpense({
        ...expense,
        description: formData.description,
        value: formData.value,
        category: formData.category,
        dueDate: formData.dueDate,
        isPaid: formData.isPaid,
        notes: formData.notes
      });

      // Force financial data update and ensure it's recalculated
      updateFinancialSummary();
      toast.success("Expense updated successfully");
    } else {
      addExpense({
        description: formData.description,
        value: formData.value,
        category: formData.category,
        dueDate: formData.dueDate,
        isPaid: formData.isPaid,
        notes: formData.notes
      });

      // Force financial data update and ensure it's recalculated
      updateFinancialSummary();
      toast.success("Expense added successfully");
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "New Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description*
              </label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label htmlFor="value" className="text-sm font-medium">
                  Value ($)*
                </label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category*
                </label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date*
                </label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Payment Status
                </label>
                <div className="flex items-center space-x-2 h-10 pt-2">
                  <Checkbox
                    id="isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={handlePaidChange}
                  />
                  <label
                    htmlFor="isPaid"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Paid
                  </label>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
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

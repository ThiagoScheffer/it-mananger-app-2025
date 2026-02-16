
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import ExpenseDialog from "@/components/dialogs/ExpenseDialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientById } from "@/utils/dataHelpers";

export default function ExpensesPage() {
  const { expenses, deleteExpense, services } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas Categorias");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<typeof expenses[0] | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | undefined>(undefined);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleAddExpense = () => {
    setEditingExpense(undefined);
    setDialogOpen(true);
  };

  const handleEditExpense = (expense: typeof expenses[0]) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete);
      toast.success("Expense deleted successfully");
      setDeleteDialogOpen(false);
    }
  };

  // Get unique categories from expenses
  const categories = ["All Categories", ...new Set(expenses.map(e => e.category))];

  // Filter expenses by search query and category
  const filteredExpenses = expenses.filter(
    (expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All Categories" || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }
  );

  // Get services with overdue payments
  const overdueServices = services.filter(service =>
    service.paymentStatus === 'unpaid' &&
    new Date(service.date) < new Date()
  );

  const totalValue = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button className="anibtn-drawstroke" onClick={handleAddExpense}>+ New Expense</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold flex-grow">Expense Management</h2>
          </div>

          <div className="flex space-x-2 mb-6">
            <div className="relative flex-grow">
              <Input
                placeholder="Search by description..."
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
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 border-b">Description</th>
                  <th className="p-3 border-b">Category</th>
                  <th className="p-3 border-b">Value</th>
                  <th className="p-3 border-b">Due Date</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{expense.description}</td>
                    <td className="p-3">{expense.category}</td>
                    <td className="p-3">R$ {expense.value.toFixed(2)}</td>
                    <td className="p-3">{new Date(expense.dueDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <StatusBadge status={expense.isPaid ? 'paid' : 'unpaid'} />
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setCategoryFilter("All Categories")}>
              Clear filters
            </Button>
            <div className="text-sm text-gray-500">
              Total: {filteredExpenses.length} expenses [ R$ {totalValue.toFixed(2)} ]
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="text-red-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Overdue Service Payments</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 border-b">Client</th>
                  <th className="p-3 border-b">Service</th>
                  <th className="p-3 border-b">Date</th>
                  <th className="p-3 border-b">Value</th>
                </tr>
              </thead>
              <tbody>
                {overdueServices.map((service) => {
                  const client = getClientById(service.clientId);
                  return (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{client?.name || 'Client not found'}</td>
                      <td className="p-3">{service.name}</td>
                      <td className="p-3">{new Date(service.date).toLocaleDateString()}</td>
                      <td className="p-3">R$ {service.totalValue.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {overdueServices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No overdue services
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExpenseDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        expense={editingExpense}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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

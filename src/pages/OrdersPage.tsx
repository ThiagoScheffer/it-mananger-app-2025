import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, SearchIcon } from "lucide-react";
import OrderDialog from "@/components/dialogs/OrderDialog";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { parse, isValid, differenceInDays } from 'date-fns';
import { date } from "zod";

// Helper functions to fetch related data by ID (simulate SQL joins)
function getServiceById(services, id) {
    return services.find(s => s.id === id);
}
function getOrderMaterials(orderMaterials, orderId) {
    return orderMaterials.filter(om => om.orderId === orderId);
}
function getMaterialById(materials, id) {
    return materials.find(m => m.id === id);
}

// Function to check date validity and determine color based on the delivery date
const getDateColor = (estimatedDate: string) => {
    const currentDate = new Date();
    const deliveryDate = parse(estimatedDate, 'dd/MM/yyyy', new Date());

    // If the date is invalid, return no color
    if (!isValid(deliveryDate)) return "";

    const daysRemaining = differenceInDays(deliveryDate, currentDate);

    // If the delivery date is within 5 days
    if (daysRemaining <= 5 && daysRemaining >= 0) return "bg-red-200 text-red-800";  // Red color
    // If the delivery date is overdue
    if (daysRemaining < 0) return "bg-red-500 text-white";  // Dark red
    // If the delivery date is more than 5 days away
    return "bg-blue-200 text-blue-800";  // Blue color
};

export default function OrdersPage() {
    const { orders, materials, services, orderMaterials, deleteOrder } = useAppContext();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<typeof orders[0] | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | undefined>(undefined);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleAddOrder = () => {
        setEditingOrder(undefined);
        setDialogOpen(true);
    };

    const handleEditOrder = (order: typeof orders[0]) => {
        setEditingOrder(order);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setOrderToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (orderToDelete) {
            deleteOrder(orderToDelete);
            toast.success("Order deleted successfully");
            setDeleteDialogOpen(false);
        }
    };


    let filteredOrders = orders.filter(
        (order) =>
            order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (getServiceById(services, order.relatedServiceId)?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (filterStatus) {
        filteredOrders = filteredOrders.filter(order => order.status === filterStatus);
    }

    const orderCodeCounts = filteredOrders.reduce((acc, order) => {
        acc[order.orderCode] = (acc[order.orderCode] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const duplicateOrderCodes = Object.keys(orderCodeCounts)
        .filter((code) => orderCodeCounts[code] > 1);

    const orderCodeGroupMap = duplicateOrderCodes.reduce((map, code, index) => {
        map[code] = index + 1;
        return map;
    }, {} as Record<string, number>);

    const getOrderCodeColor = (orderCode: string): string => {
        const colors = [
            "bg-blue-100 text-blue-800 border-blue-300",
            "bg-green-100 text-green-800 border-green-300",
            "bg-yellow-100 text-yellow-800 border-yellow-300",
            "bg-purple-100 text-purple-800 border-purple-300",
            "bg-pink-100 text-pink-800 border-pink-300",
            "bg-indigo-100 text-indigo-800 border-indigo-300",
            "bg-red-100 text-red-800 border-red-300",
            "bg-gray-100 text-gray-800 border-gray-300",
        ];
        let hash = 0;
        for (let i = 0; i < orderCode.length; i++) {
            hash = orderCode.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const statusLabels: Record<string, string> = {
        delivered: "Delivered",
        inRoute: "In Route",
        paid: "Paid",
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Materials Orders</h1>
                <Button className="anibtn-drawstroke" onClick={handleAddOrder}>+ New Order</Button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Order Management</h2>

                <div className="mb-6 relative">
                    <SearchIcon
                        className="pointer-events-none absolute left-3 top-5 h-[16px] w-[16px] -translate-y-1/2 text-gray-400 transition-colors duration-200 peer-focus:text-gray-600 dark:peer-focus:text-gray-300"
                    />
                    <Input
                        placeholder="Search by code, store..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            variant={filterStatus === null ? "default" : "outline"}
                            onClick={() => setFilterStatus(null)}
                        >
                            All
                        </Button>
                        {["delivered", "inRoute", "paid"].map((status) => (
                            <Button
                                key={status}
                                variant={filterStatus === status ? "default" : "outline"}
                                onClick={() => setFilterStatus(status)}
                            >
                                {statusLabels[status] || status}
                            </Button>
                        ))}
                    </div>

                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="p-3 border-b">Order Code</th>
                                <th className="p-3 border-b">Store</th>
                                <th className="p-3 border-b">Estimated Time</th>
                                <th className="p-3 border-b">Related Service</th>
                                <th className="p-3 border-b">Status</th>
                                <th className="p-3 border-b">Quantity</th>
                                <th className="p-3 border-b">Materials</th>
                                <th className="p-3 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => {
                                const relatedService = getServiceById(services, order.relatedServiceId);
                                const orderMats = getOrderMaterials(orderMaterials, order.id);
                                return (
                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 flex items-center gap-2">
                                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                {order.orderCode}
                                            </span>
                                            {orderCodeGroupMap[order.orderCode] && (
                                                <Badge variant="outline" className={getOrderCodeColor(order.orderCode)}>
                                                    Group {orderCodeGroupMap[order.orderCode]}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="p-3">{order.store}</td>
                                        <td className="p-3">
                                            <span className={getDateColor(order.estimatedDeliveryTime)}>
                                                {order.estimatedDeliveryTime}
                                            </span>
                                        </td>
                                        <td className="p-3">{relatedService?.name || "-"}</td>
                                        <td className="p-3">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-3">{orderMats.reduce((sum, om) => sum + om.quantity, 0)} item(s)</td>
                                        <td className="p-3 max-w-xs">
                                            <div className="flex flex-wrap gap-1">
                                                {orderMats.map((om) => {
                                                    const material = getMaterialById(materials, om.materialId);
                                                    return (
                                                        <span
                                                            key={om.materialId}
                                                            className="bg-gray-100 px-2 py-1 rounded text-sm"
                                                        >
                                                            {material ? material.type : `Unknown Type (${om.materialId})`}  {material ? material.model : `Unknown Material (${om.materialId})`}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEditOrder(order)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteClick(order.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                order={editingOrder}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this order? This action cannot be undone.
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

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
    className?: string;
    variant?: 'default' | 'destructive' | 'outline'; // Add this line
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      // Payment statuses
      case "paid":
        return { label: "Pago", color: "bg-green-100 text-green-800" };
      case "unpaid":
        return { label: "Não Pago", color: "bg-red-100 text-red-800" };
      case "pending":
        return { label: "Pendente", color: "bg-yellow-100 text-yellow-800" };
      case "partial":
        return { label: "Parcial", color: "bg-blue-100 text-blue-800" };
        
      // Service statuses
      case "completed":
        return { label: "Concluído", color: "bg-green-100 text-green-800" };
      case "inProgress":
        return { label: "Em Andamento", color: "bg-blue-100 text-blue-800" };
      case "cancelled":
        return { label: "Cancelado", color: "bg-gray-100 text-gray-800" };
        
      // Order statuses
      case "delivered":
        return { label: "Entregue", color: "bg-green-100 text-green-800" };
      case "inRoute":
        return { label: "Em Rota", color: "bg-blue-100 text-blue-800" };

      // Equipment statuses
      case "operational":
        return { label: "Operacional", color: "bg-green-100 text-green-800" };
      case "needs_service":
        return { label: "Precisa de Manutenção", color: "bg-yellow-100 text-yellow-800" };
      case "decommissioned":
        return { label: "Desativado", color: "bg-gray-100 text-gray-800" };
        
      // Material statuses
      case "available":
        return { label: "Disponível", color: "bg-green-100 text-green-800" };
      case "unavailable":
        return { label: "Indisponível", color: "bg-red-100 text-red-800" };
        
      // Default
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const { label, color } = getStatusConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {label}
    </span>
  );
}

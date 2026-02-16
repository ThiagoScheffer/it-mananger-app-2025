
import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string | number;
  footer?: string;
  icon?: ReactNode;
  trend?: "up" | "down";
  valueColor?: string;
  isMonetary?: boolean;
  className?: string; // Add this line
}

export function DashboardCard({
  title,
  value,
  footer,
  icon,
  trend,
  valueColor = "text-foreground",
  isMonetary = false
}: DashboardCardProps) {

  // For monetary values, ensure we don't display negative values with a dash
  const displayValue = isMonetary
    ? (typeof value === 'number' && value < 0
      ? "$ 0.00"
      : typeof value === 'number'
        ? `$ ${value.toFixed(2)}`
        : value)
    : value;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{displayValue}</div>
        {trend && (
          <div className="flex items-center pt-1">
            {trend === "up" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-emerald-500"
              >
                <path
                  fillRule="evenodd"
                  d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-rose-500"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
      </CardContent>
      {footer && <CardFooter className="pt-0 text-xs text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}

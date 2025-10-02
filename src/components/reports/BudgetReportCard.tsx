
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface BudgetReportCardProps {
  openBudgetReport: () => void;
}

export function BudgetReportCard({ openBudgetReport }: BudgetReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          Orçamento de Serviços por Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Gere um relatório detalhado dos serviços de um cliente, incluindo valores pendentes e não pagos.
        </p>
        <Button className="anibtn-drawstrokelong" onClick={openBudgetReport}>
          Gerar Relatório de Cliente
        </Button>
      </CardContent>
    </Card>
  );
}

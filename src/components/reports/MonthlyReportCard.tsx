import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface MonthlyReportCardProps {
  openMonthlyReport: () => void;
}

export function MonthlyReportCard({ openMonthlyReport }: MonthlyReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Relatório Mensal de Serviços
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Gere um relatório detalhado dos serviços por mês, incluindo valores pendentes e não pagos.
        </p>
        <Button className="anibtn-drawstrokelong" onClick={openMonthlyReport}>
          Gerar Relatório Mensal
        </Button>
      </CardContent>
    </Card>
  );
}
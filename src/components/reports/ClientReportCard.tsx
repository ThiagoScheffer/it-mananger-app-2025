
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface ClientReportCardProps {
  openClientReport: () => void;
}

export function ClientReportCard({ openClientReport }: ClientReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          Relatório de Serviços por Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Gere um relatório detalhado dos serviços de um cliente, incluindo valores pendentes e não pagos.
        </p>
        <Button className="anibtn-drawstrokelong" onClick={openClientReport}>
          Gerar Relatório de Cliente
        </Button>
      </CardContent>
    </Card>
  );
}


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
          Service Budget by Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a detailed report of a client's services, including pending and unpaid values.
        </p>
        <Button className="anibtn-drawstrokelong" onClick={openBudgetReport}>
          Generate Client Report
        </Button>
      </CardContent>
    </Card>
  );
}

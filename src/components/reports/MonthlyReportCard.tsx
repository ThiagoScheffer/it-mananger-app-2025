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
          Monthly Service Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a detailed service report by month, including pending and unpaid values.
        </p>
        <Button className="anibtn-drawstrokelong" onClick={openMonthlyReport}>
          Generate Monthly Report
        </Button>
      </CardContent>
    </Card>
  );
}
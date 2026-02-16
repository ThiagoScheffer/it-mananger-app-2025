
import { useState } from "react";
import { Report } from "@/types";
import { DREReport } from "@/components/reports/DREReport";
import { ClientReportCard } from "@/components/reports/ClientReportCard";
import { ClientReportDialog } from "@/components/dialogs/ClientReportDialog";

import { BudgetReportCard } from "@/components/reports/BudgetReportCard";
import BudgetDialog from "@/components/dialogs/BudgetDialog";
import { MonthlyReportCard } from "@/components/reports/MonthlyReportCard";
import { MonthlyReportDialog } from "@/components/dialogs/MonthlyReportDialog";

export default function ToolsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [clientReportOpen, setClientReportOpen] = useState(false);
  const [clientBudgetReport, setBudgetDialogOpen] = useState(false);
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false);

  const openClientReport = () => {
    setClientReportOpen(true);
  };

  const openBudgetReport = () => {
    setBudgetDialogOpen(true);
  };

  const openMonthlyReport = () => {
    setMonthlyReportOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tools</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DREReport report={report} setReport={setReport} />
        <ClientReportCard openClientReport={openClientReport} />
        <BudgetReportCard openBudgetReport={openBudgetReport} />
        <MonthlyReportCard openMonthlyReport={openMonthlyReport} />
      </div>

      <BudgetDialog open={clientBudgetReport} setOpen={setBudgetDialogOpen} />
      <ClientReportDialog open={clientReportOpen} setOpen={setClientReportOpen} />
      <MonthlyReportDialog open={monthlyReportOpen} setOpen={setMonthlyReportOpen} />
    </div>
  );
}

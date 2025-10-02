import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Report } from "@/types";
import { toast } from "sonner";
import {
    FileText,
    FileSpreadsheet,
    Download
} from "lucide-react";
import { format } from "date-fns";
import { useAppContext } from "@/context/AppContext";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getServiceMaterialsByServiceId, getMaterialById } from "@/utils/dataHelpers";

interface DREReportProps {
    report: Report | null;
    setReport: (report: Report | null) => void;
}
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function DREReport({ report, setReport }: DREReportProps) {
    const { services, expenses } = useAppContext();
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const generateDREReport = async () => {
        try {
            // Find paid services only for revenue calculation
            const paidServices = services.filter(s => s.paymentStatus === "paid");

            // Calculate gross revenue (sum of selling prices)
            const grossRevenue = paidServices.reduce((total, service) => {
                const serviceMaterials = getServiceMaterialsByServiceId(service.id);
                const materialsSelling = serviceMaterials.reduce(
                    (sum, sm) => {
                        const material = getMaterialById(sm.materialId);
                        return sum + (material ? material.sellingPrice * sm.quantity : 0);
                    },
                    0
                );
                return total + service.servicePrice + service.pickupDeliveryPrice + materialsSelling;
            }, 0);

            // Calculate costs (CMV) - sum of purchase prices and return values
            const costs = paidServices.reduce((total, service) => {
                const serviceMaterials = getServiceMaterialsByServiceId(service.id);
                const materialsCost = serviceMaterials.reduce(
                    (sum, sm) => {
                        const material = getMaterialById(sm.materialId);
                        return sum + (material ? material.purchasePrice * sm.quantity : 0);
                    },
                    0
                );
                return total + materialsCost;
            }, 0);

            // Calculate operational expenses (from expenses)
            const operationalExpenses = expenses.filter(e => e.isPaid).reduce(
                (total, expense) => total + expense.value,
                0
            );

            // Calculate gross profit
            const grossProfit = grossRevenue - costs;

            // Calculate net profit
            const netProfit = grossProfit - operationalExpenses;

            // Calculate profit margin
            const profitMargin = grossRevenue > 0
                ? (netProfit / grossRevenue) * 100
                : 0;

            // Create the report
            const newReport: Report = {
                title: "Demonstrativo de Resultado do Exercício (DRE)",
                period: `${format(new Date(), "MMMM yyyy")}`,
                grossRevenue,
                costs,
                grossProfit,
                operationalExpenses,
                netProfit,
                profitMargin
            };

            setReport(newReport);
            toast.success("Relatório DRE gerado com sucesso");
        } catch (error) {
            console.error("Erro ao gerar relatório DRE:", error);
            toast.error("Erro ao gerar relatório DRE");
        }
    };

    const downloadAsExcel = () => {
        if (!report) {
            toast.error("Nenhum relatório para exportar");
            return;
        }

        try {
            // Prepare worksheet data
            const wsData = [
                ["Demonstrativo de Resultado do Exercício (DRE)"],
                [`Período: ${report.period}`],
                [""], // Empty row for spacing
                ["Descrição", "Valor (R$)"], // Header row
                ["Receita Bruta", report.grossRevenue],
                ["Custos (CMV)", report.costs],
                ["Lucro Bruto", report.grossProfit],
                ["Despesas Operacionais", report.operationalExpenses],
                ["Lucro Líquido", report.netProfit],
                ["Margem de Lucro (%)", report.profitMargin],
            ];

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths
            ws['!cols'] = [
                { wch: 30 }, // Description column width
                { wch: 15 }  // Value column width
            ];

            // Helper function to apply styles safely
            const applyStyle = (cell: XLSX.CellObject | undefined, style: any) => {
                if (cell) {
                    cell.s = style;
                }
            };

            // Style the title row
            applyStyle(ws['A1'], {
                font: { bold: true, sz: 16 },
                alignment: { horizontal: "center" }
            });
            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]; // Merge title cells

            // Style the period row
            applyStyle(ws['A2'], {
                font: { italic: true },
                alignment: { horizontal: "center" }
            });
            ws['!merges'] = ws['!merges'] || [];
            ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }); // Merge period cells

            // Style header row
            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center" }
            };
            applyStyle(ws['A4'], headerStyle);
            applyStyle(ws['B4'], headerStyle);

            // Format currency values
            const currencyRows = [4, 5, 6, 7, 8]; // Rows with currency values (0-based index)
            currencyRows.forEach(row => {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 });
                if (ws[cellAddress]) {
                    ws[cellAddress].z = '"R$"#,##0.00';
                    ws[cellAddress].t = 'n'; // Number type
                }
            });

            // Format percentage value
            const percentageCell = XLSX.utils.encode_cell({ r: 9, c: 1 });
            if (ws[percentageCell]) {
                ws[percentageCell].z = '0.00"%";';
                ws[percentageCell].t = 'n';
            }

            // Create and save workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DRE");
            XLSX.writeFile(wb, `DRE_${report.period.replace(/[^a-z0-9]/gi, '_')}.xlsx`);

            toast.success("Relatório exportado como Excel");
        } catch (error) {
            console.error("Erro ao exportar para Excel:", error);
            toast.error("Falha ao exportar relatório");
        }
    };

    const downloadAsPDF = async () => {
       if (!report) {
            toast.error("Nenhum relatório para exportar");
            return;
        }

        try {
            toast.info("Gerando PDF, aguarde...");
            setIsGeneratingPDF(true);

            const reportElement = document.getElementById('dre-report-content');
            if (!reportElement) throw new Error("Elemento do relatório não encontrado");

            const canvas = await html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#fff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`DRE_${report.period.replace(/[^a-z0-9]/gi, '_')}.pdf`);
            toast.success("Relatório exportado como PDF");
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Falha ao exportar PDF");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    useEffect(() => {
        if (report) {
            downloadAsPDF();
        }
    }, [report]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Relatório DRE
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Gere um relatório DRE (Demonstrativo de Resultado do Exercício) com base nos serviços e despesas registrados.
                    </p>
                    <Button className="anibtn-drawstrokelong" onClick={generateDREReport}>
                        Gerar Relatório DRE
                    </Button>
                </CardContent>
            </Card>

            {report && (
                <Card className="mt-8" id="dre-report-content">
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>{report.title}</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Período: {report.period}</p>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="summary" className="w-full">
                            <TabsList>
                                <TabsTrigger value="summary">Resumo</TabsTrigger>
                                <TabsTrigger value="detailed">Detalhado</TabsTrigger>
                            </TabsList>
                            <TabsContent value="summary" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <h3 className="font-medium text-lg">Receitas e Custos</h3>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex justify-between">
                                                <span>Receita Bruta:</span>
                                                <span className="font-medium">R$ {report.grossRevenue.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-red-500">
                                                <span>(-) Custos (CMV):</span>
                                                <span className="font-medium">R$ {report.costs.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 font-medium">
                                                <span>= Lucro Bruto:</span>
                                                <span>R$ {report.grossProfit.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <h3 className="font-medium text-lg">Despesas e Lucro</h3>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex justify-between text-red-500">
                                                <span>(-) Despesas Operacionais:</span>
                                                <span className="font-medium">R$ {report.operationalExpenses.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 font-medium text-green-600">
                                                <span>= Lucro Líquido:</span>
                                                <span>R$ {report.netProfit.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between mt-4">
                                                <span>Margem de Lucro:</span>
                                                <span className={report.profitMargin > 0 ? "font-medium text-green-600" : "font-medium text-red-500"}>
                                                    {report.profitMargin.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="detailed">
                                <table className="w-full mt-4">
                                    <thead>
                                        <tr className="text-left border-b">
                                            <th className="pb-2">Descrição</th>
                                            <th className="pb-2 text-right">Valor (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="py-2 font-medium">Receita Bruta</td>
                                            <td className="py-2 text-right">{report.grossRevenue.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b text-red-500">
                                            <td className="py-2">(-) Custos (CMV)</td>
                                            <td className="py-2 text-right">{report.costs.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b font-medium">
                                            <td className="py-2">= Lucro Bruto</td>
                                            <td className="py-2 text-right">{report.grossProfit.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b text-red-500">
                                            <td className="py-2">(-) Despesas Operacionais</td>
                                            <td className="py-2 text-right">{report.operationalExpenses.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b font-medium text-green-600">
                                            <td className="py-2">= Lucro Líquido</td>
                                            <td className="py-2 text-right">{report.netProfit.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2">Margem de Lucro (%)</td>
                                            <td className={`py-2 text-right ${report.profitMargin > 0 ? "text-green-600" : "text-red-500"}`}>
                                                {report.profitMargin.toFixed(2)}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </>
    );
}

import { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { pt } from 'date-fns/locale';
import { 
  FileText,
  FileSpreadsheet, 
  Download, 
  Calendar,
  DollarSign,
  Filter,
  Check,
  Maximize
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getClientById, getInstallmentsByServiceId } from "@/utils/dataHelpers";

interface MonthlyReportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type ReportField = {
  id: string;
  name: string;
  checked: boolean;
};

export function MonthlyReportDialog({ open, setOpen }: MonthlyReportDialogProps) {
  const { clients, services } = useAppContext();
  const previewRef = useRef<HTMLDivElement>(null);

  // Report configuration state
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [minValue, setMinValue] = useState<string>("");
  const [statuses, setStatuses] = useState<string[]>(["paid", "unpaid", "partial", "pending"]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Report fields to include
  const [reportFields, setReportFields] = useState<ReportField[]>([
    { id: "clientName", name: "Cliente", checked: true },
    { id: "serviceName", name: "Serviço", checked: true },
    { id: "date", name: "Data", checked: true },
    { id: "totalValue", name: "Valor Total", checked: true },
    { id: "paymentStatus", name: "Status de Pagamento", checked: true },
    { id: "pendingValue", name: "Valor Pendente", checked: true },
    { id: "serviceStatus", name: "Status do Serviço", checked: true },
    { id: "daysOverdue", name: "Dias em Atraso", checked: true },
    { id: "description", name: "Descrição", checked: false }
  ]);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("config");
  
  // Generated report data
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<{
    totalAmount: number;
    pendingAmount: number;
    itemCount: number;
    oldestItem: string | null;
    highestValue: number;
    months: string[];
  }>({
    totalAmount: 0,
    pendingAmount: 0,
    itemCount: 0,
    oldestItem: null,
    highestValue: 0,
    months: []
  });

  // Generate available months from services data
  const getAvailableMonths = () => {
    if (services.length === 0) return [];
    
    const serviceDates = services.map(s => new Date(s.date));
    const minDate = new Date(Math.min(...serviceDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...serviceDates.map(d => d.getTime())));
    
    return eachMonthOfInterval({
      start: startOfMonth(minDate),
      end: startOfMonth(maxDate)
    }).map(date => format(date, 'yyyy-MM'));
  };

  const availableMonths = getAvailableMonths();

  const handleCheckboxChange = (id: string) => {
    setReportFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, checked: !field.checked } : field
      )
    );
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prevMonths =>
      prevMonths.includes(month)
        ? prevMonths.filter(m => m !== month)
        : [...prevMonths, month]
    );
  };

  const toggleStatus = (status: string) => {
    setStatuses(prevStatuses =>
      prevStatuses.includes(status)
        ? prevStatuses.filter(s => s !== status)
        : [...prevStatuses, status]
    );
  };

  const isStatusSelected = (status: string): boolean => {
    return statuses.includes(status);
  };

  const isMonthSelected = (month: string): boolean => {
    return selectedMonths.includes(month);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const generateReport = () => {
    if (selectedMonths.length === 0) {
      toast.error("Selecione pelo menos um mês para gerar o relatório");
      return;
    }

    // Filter services based on criteria
    const filteredServices = services.filter(service => {
      // Check month
      const serviceMonth = format(new Date(service.date), 'yyyy-MM');
      if (!selectedMonths.includes(serviceMonth)) return false;

      // Check payment status
      if (!statuses.includes(service.paymentStatus)) return false;

      // Check minimum value if specified
      if (minValue && service.totalValue < parseFloat(minValue)) return false;

      return true;
    });

    // Process data for the report
    const processedData = filteredServices.map(service => {
      const client = getClientById(service.clientId);
      const serviceDate = new Date(service.date);
      const currentDate = new Date();
      const daysOverdue = Math.floor((currentDate.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate pendingValue based on payment status
      let pendingValue = 0;
      if (service.paymentStatus === "unpaid") {
        pendingValue = service.totalValue;
      } else if (service.paymentStatus === "partial") {
        const installments = getInstallmentsByServiceId(service.id);
        const paidAmount = installments
          .filter(inst => inst.status === "paid")
          .reduce((sum, inst) => sum + inst.amount, 0);
        pendingValue = service.totalValue - paidAmount;
      } else if (service.paymentStatus === "pending") {
        pendingValue = service.totalValue;
      }

      return {
        id: service.id,
        clientName: client?.name || "Cliente não encontrado",
        serviceName: service.name,
        date: format(new Date(service.date), "dd/MM/yyyy"),
        originalDate: service.date,
        totalValue: service.totalValue,
        pendingValue: pendingValue,
        paymentStatus: service.paymentStatus === "unpaid" ? "Não Pago" :
                     service.paymentStatus === "pending" ? "Pendente" : 
                     service.paymentStatus === "partial" ? "Parcialmente Pago" : 
                     service.paymentStatus === "paid" ? "Pago" : "Desconhecido",
        serviceStatus: service.serviceStatus === "inProgress" ? "Em Andamento" : 
                     service.serviceStatus === "completed" ? "Concluído" : 
                     service.serviceStatus === "cancelled" ? "Cancelado" : 
                     service.serviceStatus === "pending" ? "Pendente" : "Desconhecido",
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
        description: service.description || "-"
      };
    });

    // Sort by date, oldest first
    processedData.sort((a, b) => 
      new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime()
    );

    // Calculate summary
    const totalAmount = processedData.reduce((sum, item) => sum + item.totalValue, 0);
    const pendingAmount = processedData.reduce((sum, item) => sum + item.pendingValue, 0);
    const oldestItem = processedData.length > 0 ? processedData[0].date : null;
    const highestValue = processedData.length > 0 ? 
      Math.max(...processedData.map(item => item.totalValue)) : 0;

    // Update state
    setReportData(processedData);
    setReportSummary({
      totalAmount,
      pendingAmount,
      itemCount: processedData.length,
      oldestItem,
      highestValue,
      months: selectedMonths
    });

    // Switch to preview tab
    setActiveTab("preview");

    if (processedData.length === 0) {
      toast.info("Nenhum serviço encontrado com os critérios selecionados");
    } else {
      toast.success(`Relatório gerado com ${processedData.length} serviços`);
    }
  };

  const downloadAsExcel = () => {
    if (reportData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    try {
      const visibleFields = reportFields.filter(field => field.checked);

      // Create worksheet data
      const wsData = [
        // Header row
        visibleFields.map(field => field.name),

        // Data rows
        ...reportData.map(item => {
          return visibleFields.map(field => {
            switch (field.id) {
              case 'totalValue':
              case 'pendingValue':
                return item[field.id];
              case 'date':
                return new Date(item.originalDate);
              default:
                return item[field.id];
            }
          });
        }),

        // Summary row
        [
          'TOTAL',
          ...visibleFields.map(field => {
            if (field.id === 'totalValue') return reportSummary.totalAmount;
            if (field.id === 'pendingValue') return reportSummary.pendingAmount;
            return '';
          })
        ]
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = visibleFields.map(() => ({ wch: 20 }));

      // Apply styles
      const applyStyle = (cell: XLSX.CellObject | undefined, style: any) => {
        if (cell) {
          cell.s = style;
        }
      };

      // Style header row
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z1');
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        applyStyle(ws[cellAddress], {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center" }
        });
      }

      // Style summary row
      const summaryRow = wsData.length - 1;
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: summaryRow, c: C });
        applyStyle(ws[cellAddress], {
          font: { bold: true },
          fill: { fgColor: { rgb: "F2F2F2" } },
          numFmt: C === 0 ? undefined : '"R$ "#,##0.00'
        });
      }

      // Format currency columns
      visibleFields.forEach((field, index) => {
        if (field.id === 'totalValue' || field.id === 'pendingValue') {
          for (let R = 1; R < summaryRow; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: index });
            if (ws[cellAddress]) {
              ws[cellAddress].z = '"R$ "#,##0.00';
            }
          }
        }
      });

      // Create and save workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório");
      XLSX.writeFile(wb, `Relatorio_Mensal_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      toast.success("Relatório exportado como Excel");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

    const downloadAsPDF = async () => {
        if (reportData.length === 0) {
            toast.error("Nenhum dado para exportar");
            return;
        }

        try {
            toast.info("Gerando PDF, aguarde...");

            // Create a temporary container for PDF generation
            const pdfContainer = document.createElement('div');
            pdfContainer.id = 'pdf-export-container';
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '-9999px';
            pdfContainer.style.width = '794px'; // A4 width in pixels (210mm)
            pdfContainer.style.padding = '20px';
            pdfContainer.style.backgroundColor = 'white';

            // Create the report content from scratch to ensure we capture everything
            const reportContent = document.createElement('div');

            // Add title and metadata
            const title = document.createElement('h1');
            title.textContent = 'Relatório Mensal de Serviços';
            title.style.fontSize = '18pt';
            title.style.marginBottom = '20px';
            reportContent.appendChild(title);

            // Add summary information
            const summary = document.createElement('div');
            summary.innerHTML = `
      <div style="margin-bottom: 15px;">
        <strong>Período:</strong> ${reportSummary.months.map(month =>
            format(new Date(`${month}-01`), 'MMMM yyyy')).join(', ')}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div><strong>Total de Serviços:</strong> ${reportSummary.itemCount}</div>
        <div><strong>Valor Total:</strong> R$ ${reportSummary.totalAmount.toFixed(2)}</div>
        <div><strong>Valor Pendente:</strong> R$ ${reportSummary.pendingAmount.toFixed(2)}</div>
        <div><strong>Maior Valor:</strong> R$ ${reportSummary.highestValue.toFixed(2)}</div>
      </div>
    `;
            reportContent.appendChild(summary);

            // Create the table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '20px';

            // Add table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f3f4f6';

            reportFields
                .filter(field => field.checked)
                .forEach(field => {
                    const th = document.createElement('th');
                    th.textContent = field.name;
                    th.style.padding = '8px';
                    th.style.border = '1px solid #ddd';
                    th.style.textAlign = 'left';
                    th.style.fontSize = '8pt';//o nome das colunas
                    th.style.overflowWrap = '';
                    headerRow.appendChild(th);
                });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Add table body
            const tbody = document.createElement('tbody');
            reportData.forEach(item => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #ddd';

                reportFields
                    .filter(field => field.checked)
                    .forEach(field => {
                        const td = document.createElement('td');
                        td.style.padding = '8px';
                        td.style.fontSize = '8pt'; // tamanho da fonte do conteudo
                        let content = item[field.id];
                        if (field.id === "totalValue" || field.id === "pendingValue") {
                            content = `R$ ${item[field.id].toFixed(2)}`;
                        } else if (field.id === "daysOverdue" && item[field.id] > 30) {
                            content = `<span style="color: red; font-weight: bold;">${item[field.id]} dias</span>`;
                        }

                        td.innerHTML = content;
                        row.appendChild(td);
                    });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            reportContent.appendChild(table);

            pdfContainer.appendChild(reportContent);
            document.body.appendChild(pdfContainer);

            // Generate PDF
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();

            const canvas = await html2canvas(pdfContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Split content into pages if needed
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Clean up
            document.body.removeChild(pdfContainer);

            // Save PDF
            pdf.save(`Relatorio_Mensal_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast.success("PDF gerado com sucesso!");

        } catch (error) {
            console.error("Erro ao exportar para PDF:", error);
            toast.error("Erro ao gerar PDF");
        }
    };

     const groupedByYear = availableMonths.reduce((acc: Record<string, string[]>, month) => {
        const [year] = month.split("-");
        if (!acc[year]) acc[year] = [];
        acc[year].push(month);
        return acc;
    }, {});
    
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Relatório Mensal de Serviços</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                    <Label>Meses por Ano</Label>
                    <Tabs defaultValue={Object.keys(groupedByYear)[0]} className="w-full">
                         <TabsList className="overflow-x-auto flex">
                            {Object.keys(groupedByYear).map((year) => (
                                <TabsTrigger key={year} value={year} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-600 border border-blue-600 rounded-md px-4 py-1 transition-colors" >
                                    {year}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.entries(groupedByYear).map(([year, months]) => (
                            <TabsContent key={year} value={year}>
                                <ScrollArea className="h-[200px] border rounded-md p-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {months.map((month) => (
                                            <Button
                                                key={month}
                                                type="button"
                                                variant={isMonthSelected(month) ? "default" : "outline"}
                                                className="flex items-center justify-start"
                                                onClick={() => toggleMonth(month)}
                                            >
                                                {isMonthSelected(month) && <Check className="w-4 h-4 mr-2" />}
                                                {format(new Date(`${month}-01`), 'MMMM', { locale: pt })}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
              
              <div className="grid gap-2">
                <Label htmlFor="minValue">Valor Mínimo (R$)</Label>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  <Input
                    id="minValue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valor mínimo"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Status de Pagamento</Label>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    type="button" 
                    variant={isStatusSelected("unpaid") ? "default" : "outline"}
                    className="flex items-center"
                    onClick={() => toggleStatus("unpaid")}
                  >
                    {isStatusSelected("unpaid") && <Check className="w-4 h-4 mr-1" />}
                    Não Pago
                  </Button>
                  <Button
                    type="button"
                    variant={isStatusSelected("pending") ? "default" : "outline"}
                    className="flex items-center"
                    onClick={() => toggleStatus("pending")}
                  >
                    {isStatusSelected("pending") && <Check className="w-4 h-4 mr-1" />}
                    Pendente
                  </Button>
                  <Button 
                    type="button" 
                    variant={isStatusSelected("partial") ? "default" : "outline"}
                    className="flex items-center"
                    onClick={() => toggleStatus("partial")}
                  >
                    {isStatusSelected("partial") && <Check className="w-4 h-4 mr-1" />}
                    Parcialmente Pago
                  </Button>
                  <Button 
                    type="button" 
                    variant={isStatusSelected("paid") ? "default" : "outline"}
                    className="flex items-center"
                    onClick={() => toggleStatus("paid")}
                  >
                    {isStatusSelected("paid") && <Check className="w-4 h-4 mr-1" />}
                    Pago
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Campos do Relatório</Label>
                 <ScrollArea className="h-[150px] border rounded-md p-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {reportFields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={field.checked}
                        onCheckedChange={() => handleCheckboxChange(field.id)}
                      />
                      <label
                        htmlFor={`field-${field.id}`}
                        className="text-sm font-medium leading-none"
                      >
                        {field.name}
                      </label>
                    </div>
                  ))}
                </div>
                </ScrollArea>
                <Button onClick={generateReport} className="mt-0">
                    <Filter className="mr-2 h-4 w-4" />
                    Gerar Relatório
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {reportData.length > 0 ? (
              <div id="report-preview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium text-base mb-2">Resumo do Relatório</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total de Serviços:</span>
                        <span className="font-medium">{reportSummary.itemCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Total:</span>
                        <span className="font-medium">R$ {reportSummary.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Pendente:</span>
                        <span className="font-medium">R$ {reportSummary.pendingAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Serviço Mais Antigo:</span>
                        <span className="font-medium">{reportSummary.oldestItem}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maior Valor:</span>
                        <span className="font-medium">R$ {reportSummary.highestValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium text-base mb-2">Período</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">
                          {reportSummary.months.map(month => 
                              format(new Date(`${month}-01`), 'MMMM yyyy', { locale: pt })
                          ).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[300px]">
                    <div className="min-w-full">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {reportFields.filter(field => field.checked).map((field) => (
                              <th
                                key={field.id}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {field.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((item) => (
                            <tr key={item.id} className={item.daysOverdue > 30 ? "bg-red-50" : ""}>
                              {reportFields.map((field) => {
                                if (!field.checked) return null;
                                
                                let cellContent = item[field.id];
                                
                                if (field.id === "totalValue" || field.id === "pendingValue") {
                                  cellContent = `R$ ${item[field.id].toFixed(2)}`;
                                }
                                
                                if (field.id === "daysOverdue") {
                                  cellContent = (
                                    <span className={item[field.id] > 30 ? "text-red-600 font-medium" : ""}>
                                      {item[field.id]} dias
                                    </span>
                                  );
                                }
                                
                                return (
                                  <td key={field.id} className="px-3 py-2 text-sm">
                                    {cellContent}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">Nenhum dado disponível</h3>
                <p className="mt-2 text-sm">
                  Selecione os critérios e gere um relatório para visualizá-lo aqui.
                </p>
                <Button onClick={() => setActiveTab("config")} className="mt-4">
                  Configurar Relatório
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="space-y-6">
            {reportData.length > 0 ? (
              <>
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Exportar Relatório</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Escolha um formato para exportar o relatório de 
                    <span className="font-medium"> {reportSummary.itemCount} </span> 
                    serviços no valor total de 
                    <span className="font-medium"> R$ {reportSummary.totalAmount.toFixed(2)}</span>
                    {reportSummary.pendingAmount > 0 && (
                      <>, com <span className="font-medium">R$ {reportSummary.pendingAmount.toFixed(2)}</span> pendentes</>
                    )}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button
                      onClick={downloadAsExcel}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center"
                    >
                      <FileSpreadsheet className="h-8 w-8 mb-2" />
                      <span>Exportar para Excel</span>
                    </Button>
                    
                    <Button
                      onClick={downloadAsPDF}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center"
                    >
                      <Download className="h-8 w-8 mb-2" />
                      <span>Exportar para PDF</span>
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4 text-sm">
                  <h4 className="font-medium mb-2">Observações:</h4>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    <li>O arquivo Excel será gerado no formato XLSX</li>
                    <li>Serviços com mais de 30 dias em atraso são destacados</li>
                    <li>O relatório contém apenas os campos selecionados na configuração</li>
                    <li>Os valores pendentes são calculados com base no status de pagamento</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">Nenhum dado disponível para exportação</h3>
                <p className="mt-2 text-sm">
                  Gere um relatório antes de tentar exportá-lo.
                </p>
                <Button onClick={() => setActiveTab("config")} className="mt-4">
                  Configurar Relatório
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}

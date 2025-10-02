import { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { format } from "date-fns";
import { 
  FileText,
  FileSpreadsheet, 
  Download, 
  Calendar,
  DollarSign,
  User,
  Filter,
  Check,
  Maximize
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getInstallmentsByServiceId } from "@/utils/dataHelpers";

interface ClientReportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type ReportField = {
  id: string;
  name: string;
  checked: boolean;
};

export function ClientReportDialog({ open, setOpen }: ClientReportDialogProps) {
  const { clients, services } = useAppContext();

    // Create a ref for the preview content
    const previewRef = useRef<HTMLDivElement>(null);

  // Report configuration state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [minValue, setMinValue] = useState<string>("");
  const [statuses, setStatuses] = useState<string[]>(["paid","unpaid", "partial", "pending"]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Report fields to include
  const [reportFields, setReportFields] = useState<ReportField[]>([
    { id: "name", name: "Nome do Serviço", checked: true },
    { id: "date", name: "Data", checked: true },
    { id: "totalValue", name: "Valor Total", checked: true },
    { id: "paymentStatus", name: "Status de Pagamento", checked: true },
    { id: "pendingValue", name: "Valor Pendente", checked: true },
    { id: "serviceStatus", name: "Status do Serviço", checked: true },
    { id: "daysOverdue", name: "Dias em Atraso", checked: true },
    { id: "description", name: "Descrição", checked: false }
  ]);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("preview");
  
  // Generated report data
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<{
    totalAmount: number;
    pendingAmount: number;
    itemCount: number;
    oldestItem: string | null;
    highestValue: number;
  }>({
    totalAmount: 0,
    pendingAmount: 0,
    itemCount: 0,
    oldestItem: null,
    highestValue: 0
  });

  const handleCheckboxChange = (id: string) => {
    setReportFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, checked: !field.checked } : field
      )
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const generateReport = () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente para gerar o relatório");
      return;
    }

    // Filter services based on criteria
    const filteredServices = services.filter(service => {
      // Check client
      if (service.clientId !== selectedClientId) return false;

      // Check date range
      const serviceDate = new Date(service.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Include the entire end day
      
      if (serviceDate < start || serviceDate > end) return false;

      // Check payment status
      if (!statuses.includes(service.paymentStatus)) return false;

      // Check minimum value if specified
      if (minValue && service.totalValue < parseFloat(minValue)) return false;

      return true;
    });

    // Process data for the report
    const processedData = filteredServices.map(service => {
      // Calculate days overdue
      const serviceDate = new Date(service.date);
      const currentDate = new Date();
      const daysOverdue = Math.floor((currentDate.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate pendingValue based on payment status using helper function
      let pendingValue = 0;
      if (service.paymentStatus === "unpaid") {
        pendingValue = service.totalValue;
      } else if (service.paymentStatus === "partial") {
        // Calculate from paid installments if available using helper function
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
        name: service.name,
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
      highestValue
    });

    // Switch to preview tab
    setActiveTab("preview");

    if (processedData.length === 0) {
      toast.info("Nenhum serviço encontrado com os critérios selecionados");
    } else {
      toast.success(`Relatório gerado com ${processedData.length} serviços`);
    }
    };

    // 1. First, create a ref for the preview content
   // const report-preview = useRef<HTMLDivElement>(null);

    const downloadAsExcel = () => {
        if (reportData.length === 0) {
            toast.error("Nenhum dado para exportar");
            return;
        }

        try {
            const client = clients.find(c => c.id === selectedClientId);
            const clientName = client ? client.name.replace(/[^a-z0-9]/gi, '_') : "Cliente";

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

            // Apply styles only if cell exists
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
            XLSX.writeFile(wb, `Relatorio_${clientName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

            toast.success("Relatório exportado como Excel");
        } catch (error) {
            console.error("Erro ao exportar para Excel:", error);
            toast.error("Erro ao exportar relatório");
        }
    };

    // 3. Update the downloadAsPDF function to use previewRef
    const downloadAsPDF = async () => {
        if (reportData.length === 0) {
            toast.error("Nenhum dado para exportar");
            return;
        }

        try {
            toast.info("Gerando PDF, aguarde...");

            setActiveTab("preview");
            await new Promise(resolve => setTimeout(resolve, 500));

            const previewElement = document.getElementById('report-preview');
            if (!previewElement) throw new Error("Elemento do relatório não encontrado");

            // Remover limitações direto no previewElement
            const originalMaxHeight = previewElement.style.maxHeight;
            const originalOverflow = previewElement.style.overflow;

            previewElement.style.maxHeight = 'none';
            previewElement.style.overflow = 'visible';

            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(previewElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                scrollY: -window.scrollY,
                backgroundColor: '#fff',
            });

            // Restaurar estilos
            previewElement.style.maxHeight = originalMaxHeight;
            previewElement.style.overflow = originalOverflow;

            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let remainingHeight = imgHeight;
            //let position = 20;

            const imgData = canvas.toDataURL('image/png');

            if (imgHeight <= pdfHeight - 40) {
                pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            } else {
                const sourceHeightPerPage = (canvas.height * (pdfHeight - 40)) / imgHeight;
                let y = 0;

                while (remainingHeight > 0) {
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceHeightPerPage;

                    const ctx = pageCanvas.getContext('2d');
                    if (!ctx) break;

                    ctx.drawImage(
                        canvas,
                        0,
                        y,
                        canvas.width,
                        sourceHeightPerPage,
                        0,
                        0,
                        canvas.width,
                        sourceHeightPerPage
                    );

                    const pageImgData = pageCanvas.toDataURL('image/png');
                    pdf.addImage(pageImgData, 'PNG', 20, 20, imgWidth, pdfHeight - 40);

                    y += sourceHeightPerPage;
                    remainingHeight -= pdfHeight - 40;

                    if (remainingHeight > 0) {
                        pdf.addPage();
                    }
                }
            }

            pdf.save(`Relatorio_${clients.find(c => c.id === selectedClientId)?.name.replace(/[^a-z0-9]/gi, '_') || 'Cliente'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            toast.success("PDF gerado com sucesso!");
        } catch (error) {
            console.error("Erro ao exportar para PDF:", error);
            toast.error("Erro ao gerar PDF");
        }
    };





    return (

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Relatório de Serviços por Cliente</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                {[...clients]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(client => (
                        <SelectItem key={client.id} value={client.id}>
                            {client.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Data Final</Label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
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
                    <h3 className="font-medium text-base mb-2">Cliente</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">
                          {clients.find(c => c.id === selectedClientId)?.name || "Cliente não encontrado"}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span>Período: {format(new Date(startDate), "dd/MM/yyyy")} a {format(new Date(endDate), "dd/MM/yyyy")}</span>
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
                            <tr key={item.id} className={item.daysOverdue > 30 ? "bg-red-0" : ""}>
                              {reportFields.map((field) => {
                                if (!field.checked) return null;
                                
                                let cellContent = item[field.id];
                                
                                if (field.id === "totalValue") {
                                  cellContent = `R$ ${item[field.id].toFixed(2)}`;
                                }
                                
                                if (field.id === "pendingValue") {
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
                    <li>O arquivo Excel será gerado no formato CSV (compatível com Excel)</li>
                    <li>Os valores negativos serão destacados em vermelho</li>
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

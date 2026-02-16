// components/dialogs/BudgetDialog.tsx
import { useState, useRef, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getServiceMaterialsByServiceId, getMaterialById } from "@/utils/dataHelpers";
import { getServiceTypes } from "@/utils/storageManager";
interface BudgetDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface BudgetItem {
    id: string;
    quantity: string;
    description: string;
    price: string;
}

interface FormData {
    servicePrice: number;
    pickupDeliveryPrice: number;
}

interface Material {
    id: string;
    model: string;
    sellingPrice: number;
    purchasePrice: number;
    type: string;
}

interface ServiceMaterial {
    id: string;
    materialId: string;
    material?: Material;
    quantity: number;
    priceSnapshot: number;
}

const ServiceTypeOption = getServiceTypes();
const profileTypes = ["Desktop", "Notebook", "Material", "Services", "-"];
const serviceTypes = ["Editor", "Home", "Parts", "Adobe", "Remote", "-"];
const profileLevels = ["Entry", "Advanced", "Professional", "Workstation", "Office", "-"];

// template
const templateOptions = [
    { value: "ModelSimples.docx", label: "Standard Model" },
    { value: "ModelCompleto.docx", label: "Build Model" }
    // { value: "Model3.docx", label: "Modelo Detalhado" }
];

export default function BudgetDialog({ open, setOpen }: BudgetDialogProps) {
    const { clients, services, materials } = useAppContext();
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0].value);
    const [validUntil, setValidUntil] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
    );
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<BudgetItem[]>([
        { id: "1", quantity: "", description: "", price: "" },
    ]);
    const previewRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState<FormData>({
        servicePrice: 0,
        pickupDeliveryPrice: 0
    });
    const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<ServiceMaterial[]>([]);
    const [selectedProfileType, setSelectedProfileType] = useState("");
    const [selectedServiceType, setSelectedServiceType] = useState("");
    const [selectedProfileLevel, setSelectedProfileLevel] = useState("");

    // Filter services based on selected client
    const filteredServices = useMemo(() => {
        if (!selectedClientId) return services;
        return services.filter(service => service.clientId === selectedClientId);
    }, [services, selectedClientId]);

    const handleClientSelect = (clientId: string) => {
        setSelectedClientId(clientId);
        // Reset service selection when client changes
        setSelectedServiceId("");
        setSelectedServiceTypes([]);
        setSelectedMaterials([]);
        setFormData({ servicePrice: 0, pickupDeliveryPrice: 0 });
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                id: Date.now().toString(),
                quantity: "",
                description: "",
                price: "",
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof BudgetItem, value: string) => {
        setItems(
            items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleServiceSelect = (serviceId: string) => {
        setSelectedServiceId(serviceId);

        const service = services.find(s => s.id === serviceId);
        if (service) {
            setSelectedServiceTypes(service.serviceTypes || []);

            // Correct way: load materials from serviceMaterials
            const serviceMaterials = getServiceMaterialsByServiceId(service.id);
            setSelectedMaterials(serviceMaterials.map(sm => ({
                ...sm,
                material: getMaterialById(sm.materialId)
            })));

            setFormData({
                servicePrice: service.servicePrice || 0,
                pickupDeliveryPrice: service.pickupDeliveryPrice || 0
            });

            // Auto-detect profile type based on service description
            const detectedProfile = profileTypes.find(type =>
                service.description?.includes(type)
            ) || "";
            setSelectedProfileType(detectedProfile);

            // Auto-detect service type
            let detectedServiceType = "";
            if (service.name?.includes("Desktop")) detectedServiceType = "desktop";
            else if (service.name?.includes("Notebook")) detectedServiceType = "notebook";
            else if (serviceMaterials.length > 0) detectedServiceType = "material";
            else detectedServiceType = "services";
            setSelectedServiceType(detectedServiceType);
        } else {
            // Reset state if no service found
            setSelectedServiceTypes([]);
            setSelectedMaterials([]);
            setFormData({ servicePrice: 0, pickupDeliveryPrice: 0 });
        }
    };

    const calculateTotals = useMemo(() => {
        const selectedService = services.find(s => s.id === selectedServiceId);

        const serviceTypesSum = selectedServiceTypes.reduce((sum, type) => {

            const typeOption = ServiceTypeOption.find(opt => opt.name === type);
            return sum + (typeOption?.price || 0);
        }, 0);

        const materialsSum = selectedMaterials.reduce((sum, material) => {
            return sum + ((material.material?.sellingPrice || material.priceSnapshot || 0) * material.quantity);
        }, 0);

        const manualItemsSum = items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || "0") * parseFloat(item.price || "0"));
        }, 0);

        return {
            servicePrice: selectedService?.servicePrice || formData.servicePrice,
            pickupDeliveryPrice: selectedService?.pickupDeliveryPrice || formData.pickupDeliveryPrice,
            serviceTypesSum,
            materialsSum,
            manualItemsSum,
            totalValue: serviceTypesSum + materialsSum + manualItemsSum +
                (selectedService?.servicePrice || formData.servicePrice) +
                (selectedService?.pickupDeliveryPrice || formData.pickupDeliveryPrice)
        };
    }, [selectedServiceId, services, selectedServiceTypes, selectedMaterials, items, formData]);

    const generateDocx = async () => {
        if (!selectedClientId) {
            toast.error("Select a client to generate the budget");
            return;
        }

        const client = clients.find((c) => c.id === selectedClientId);
        if (!client) {
            toast.error("Select a valid client");
            return;
        }
        // const client = clients.find((c) => c.id === selectedClientId);
        //const response = await fetch(`/${selectedTemplate}`);
        const service = services.find((s) => s.id === selectedServiceId);

        try {
            const response = await fetch(`/${selectedTemplate}`);
            const arrayBuffer = await response.arrayBuffer();

            const zip = new PizZip(arrayBuffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true
            });

            // Prepare service types data
            const serviceTypeItems = selectedServiceTypes.map((type) => {
                const typeOption = ServiceTypeOption.find(opt => opt.name === type);
                return {
                    quantity: 1,
                    description: type,
                    price: typeOption?.price || 0
                };
            });

            // Prepare materials data
            const materialItems = selectedMaterials.map(material => ({
                quantity: material.quantity,
                description: material.material?.model || "Material",
                price: material.priceSnapshot || material.material?.sellingPrice || 0
            }));

            // Prepare manual items data
            const manualItems = items.filter(item =>
                item.description && item.quantity && item.price
            ).map(item => ({
                quantity: parseFloat(item.quantity),
                description: item.description,
                price: parseFloat(item.price)
            }));

            // Combine all items (service types first, then materials, then manual items)
            const allItems = [...serviceTypeItems, ...materialItems, ...manualItems];

            // Prepare data for the template
            const budgetData = {
                budgetnumber: `ORC-${Date.now().toString().slice(-6)}`,
                Data: format(new Date(), "dd/MM/yyyy"),
                ValidUntil: format(new Date(validUntil), "dd/MM/yyyy"),
                ClientName: client?.name || "",
                ServiceType: service?.name || "Custom Service",
                ForType: "General Use",
                Profiletype: selectedProfileType || "Desktop",
                WindowsVersion: "Windows 11 Custom",
                email: client?.email || "",
                cnpj: "",
                telefone: "",
                TotalValue: `R$ ${calculateTotals.totalValue.toFixed(2)}`,
                notes: notes ?? "", //handles null/undefined
                ServiceCategory: selectedServiceType,
                ProfileLevel: selectedProfileLevel
            };

            // Add items to the data (up to 10 items)
            allItems.slice(0, 10).forEach((item, index) => {
                budgetData[`Qt${index + 1}`] = item.quantity;
                budgetData[`Desc${index + 1}`] = item.description;
                budgetData[`Price${index + 1}`] = item.price.toFixed(2);
                // console.log(budgetData[`Qt${index + 1}`], index + 1);
                // console.log(budgetData[`Desc${index + 1}`], index + 1);
                //console.log(budgetData[`Price${index + 1}`], index + 1);
            });

            // Fill empty items (up to 10)
            for (let i = allItems.length; i < 11; i++) {
                budgetData[`Qt${i + 1}`] = "";
                budgetData[`Desc${i + 1}`] = "";
                budgetData[`Price${i + 1}`] = "";
                //console.log(budgetData[`Qt${i + 1}`], i + 1);
                // console.log(budgetData[`Desc${i + 1}`], i + 1);
                // console.log(budgetData[`Price${i + 1}`], i + 1);
            }

            doc.render(budgetData);

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                compression: "DEFLATE"
            });

            const clientName = client?.name.replace(/[^a-z0-9]/gi, "_") || "client";
            saveAs(out, `Budget_${clientName}_${format(new Date(), "yyyy-MM-dd")}.docx`);

            toast.success("Budget generated in DOCX");
        } catch (error) {
            console.error("Error generating document:", error);
            toast.error("Error generating document");
        }
    };

    const generatePdf = async () => {
        if (!previewRef.current) {
            toast.error("Nothing to export");
            return;
        }

        try {
            toast.info("Generating PDF, please wait...");

            const client = clients.find((c) => c.id === selectedClientId);
            const pdf = new jsPDF("p", "pt", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();

            await new Promise((resolve) => setTimeout(resolve, 300));

            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const imgWidth = width - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
            pdf.save(
                `Budget_${client?.name.replace(/[^a-z0-9]/gi, "_") || "client"}_${format(
                    new Date(),
                    "yyyy-MM-dd"
                )}.pdf`
            );

            toast.success("PDF generated successfully!");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error generating PDF");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Budget</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="template">Document Model</Label>
                        <Select
                            value={selectedTemplate}
                            onValueChange={setSelectedTemplate}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {templateOptions.map((template) => (
                                    <SelectItem key={template.value} value={template.value}>
                                        {template.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="client">Client</Label>
                            <Select
                                value={selectedClientId}
                                onValueChange={setSelectedClientId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="service">Service (Optional)</Label>
                            <Select
                                value={selectedServiceId}
                                onValueChange={handleServiceSelect}
                                disabled={!selectedClientId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        selectedClientId
                                            ? "Select a service"
                                            : "Select a client first"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredServices.length > 0 ? (
                                        filteredServices
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map((service) => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name}
                                                </SelectItem>
                                            ))
                                    ) : (
                                        <SelectItem value="" disabled>
                                            {selectedClientId
                                                ? "No service found for this client"
                                                : "Select a client first"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="profileType">Profile Type</Label>
                            <Select
                                value={selectedProfileType}
                                onValueChange={setSelectedProfileType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select profile type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profileTypes.filter(t => t).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="serviceType">Service Type</Label>
                            <Select
                                value={selectedServiceType}
                                onValueChange={setSelectedServiceType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceTypes.filter(t => t).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="profileLevel">Profile Level</Label>
                            <Select
                                value={selectedProfileLevel}
                                onValueChange={setSelectedProfileLevel}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profileLevels.filter(t => t).map((level) => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="validUntil">Valid until</Label>
                        <Input
                            id="validUntil"
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Budget Items</Label>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-12 gap-2 items-end"
                                >
                                    <div className="col-span-2">
                                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                                        <Input
                                            id={`quantity-${item.id}`}
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateItem(item.id, "quantity", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="col-span-7">
                                        <Label htmlFor={`description-${item.id}`}>Description</Label>
                                        <Input
                                            id={`description-${item.id}`}
                                            value={item.description}
                                            onChange={(e) =>
                                                updateItem(item.id, "description", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor={`price-${item.id}`}>Unit Price</Label>
                                        <Input
                                            id={`price-${item.id}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) =>
                                                updateItem(item.id, "price", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length <= 1}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addItem}>
                                + Add Item
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional information about the budget"
                        />
                    </div>

                    <div className="border rounded-lg p-4" ref={previewRef}>
                        <h3 className="text-lg font-bold mb-4">Preview</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Client:</span>
                                <span className="font-medium">
                                    {clients.find((c) => c.id === selectedClientId)?.name ||
                                        "Not selected"}
                                </span>
                            </div>
                            {selectedServiceId && (
                                <div className="flex justify-between">
                                    <span>Service:</span>
                                    <span className="font-medium">
                                        {services.find((s) => s.id === selectedServiceId)?.name}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Expiration Date:</span>
                                <span className="font-medium">
                                    {validUntil
                                        ? format(new Date(validUntil), "dd/MM/yyyy")
                                        : "Not defined"}
                                </span>
                            </div>
                            {selectedProfileType && (
                                <div className="flex justify-between">
                                    <span>Profile Type:</span>
                                    <span className="font-medium">{selectedProfileType}</span>
                                </div>
                            )}
                            {selectedServiceType && (
                                <div className="flex justify-between">
                                    <span>Service Type:</span>
                                    <span className="font-medium">{selectedServiceType}</span>
                                </div>
                            )}
                            {selectedProfileLevel && (
                                <div className="flex justify-between">
                                    <span>Profile Level:</span>
                                    <span className="font-medium">{selectedProfileLevel}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <h4 className="font-medium mb-2">Itens:</h4>
                            <div className="space-y-2">
                                {/* Service Types */}
                                {selectedServiceTypes.map((type, index) => {
                                    const typeOption = ServiceTypeOption.find(opt => opt.name === type);
                                    return (
                                        <div key={`service-type-${index}`} className="flex justify-between">
                                            <span>{index + 1}. {type}</span>
                                            <span>
                                                1 × R$ {typeOption?.price.toFixed(2) || "0.00"} = R$ {typeOption?.price.toFixed(2) || "0.00"}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Materials */}
                                {selectedMaterials.map((material, index) => (
                                    <div key={`material-${material.id}`} className="flex justify-between">
                                        <span>
                                            {selectedServiceTypes.length + index + 1}. {material.material?.model || "Material"}
                                        </span>
                                        <span>
                                            {material.quantity} × R$ {(material.priceSnapshot || material.material?.sellingPrice || 0).toFixed(2)} = R$
                                            {(material.quantity * (material.priceSnapshot || material.material?.sellingPrice || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                ))}

                                {/* Manual Items */}
                                {items.filter(item => item.description && item.quantity && item.price).map((item, index) => (
                                    <div key={`manual-${item.id}`} className="flex justify-between">
                                        <span>
                                            {selectedServiceTypes.length + selectedMaterials.length + index + 1}. {item.description}
                                        </span>
                                        <span>
                                            {item.quantity} × R$ {parseFloat(item.price || "0").toFixed(2)} = R$
                                            {(parseFloat(item.quantity || "0") * parseFloat(item.price || "0")).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>R$ {calculateTotals.totalValue.toFixed(2)}</span>
                            </div>
                        </div>

                        {notes && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium mb-2">Notes:</h4>
                                <p className="text-sm">{notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={generatePdf} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button onClick={generateDocx}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Budget (DOCX)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
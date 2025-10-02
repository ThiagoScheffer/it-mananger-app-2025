import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar"; // Assuming these are ShadCN UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner"; // Assuming sonner for toasts
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale"; // For Portuguese date formatting
import {
    CalendarRange,
    Calendar as CalendarIcon,
    Clock,
    Search,
    Trash2,
    Edit,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext"; // Your custom AppContext
import { Appointment } from "@/types"; // Your custom types
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import * as Tooltip from "@radix-ui/react-tooltip";
// Helper to format a Date object or a valid date string to "yyyy-MM-dd"
const formatDateToString = (date: Date | string | undefined): string => {
    if (!date) return format(new Date(), "yyyy-MM-dd"); // Default to today if undefined
    if (date instanceof Date && isValid(date)) {
        return format(date, "yyyy-MM-dd");
    }
    if (typeof date === "string") {
        const parsed = parseISO(date); // Try parsing ISO string first
        if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
        // If not ISO, try generic parsing (less reliable, ensure input string is consistent)
        const genericParsed = new Date(date);
        if (isValid(genericParsed)) return format(genericParsed, "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd"); // Fallback
};

// Helper to parse a "yyyy-MM-dd" string or an existing Date object to a Date object
const parseStringToDate = (dateString: string | Date | undefined): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) {
        return isValid(dateString) ? dateString : undefined;
    }
    if (typeof dateString === "string") {
        // Attempt to parse various common date string formats, prioritizing ISO
        let date = parseISO(dateString); // Handles "YYYY-MM-DDTHH:mm:ss.sssZ" and "YYYY-MM-DD"
        if (isValid(date)) return date;

        // Fallback for "YYYY-MM-DD" if not already parsed by parseISO
        // and for other simple date formats if necessary.
        // Adding timezone context can help avoid off-by-one day issues.
        const parts = dateString.split('-');
        if (parts.length === 3) {
            date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (isValid(date)) return date;
        }
        // Generic fallback (can be unreliable with ambiguous formats)
        date = new Date(dateString);
        return isValid(date) ? date : undefined;
    }
    return undefined;
};

// Default appointment structure for new entries
const defaultNewAppointment: Partial<Appointment> = {
    title: "",
    date: formatDateToString(new Date()), // Default to today's date as string
    startTime: "09:00", // Default start time
    endTime: "", // Optional
    type: "personal",
    status: "scheduled",
    notes: "",
    description: "",
};

export default function CalendarPage() {
    const {
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
    } = useAppContext();

    // State for the main calendar selection
    const [date, setDate] = useState<Date | undefined>(new Date());

    // State for the "Add New Appointment" dialog form
    const [newAppointment, setNewAppointment] =
        useState<Partial<Appointment>>(defaultNewAppointment);

    // State for controlling the "Add New Appointment" dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // State for controlling the "Edit Appointment" dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // State for the appointment currently being edited
    const [editingAppointment, setEditingAppointment] =
        useState<Appointment | null>(null);

    // State for the search query in the overview table
    const [searchQuery, setSearchQuery] = useState("");

    // Effect to update newAppointment.date when the main calendar date changes
    // and the add dialog is about to open or is already open.
    useEffect(() => {
        if (date) {
            setNewAppointment((prev) => ({
                ...prev,
                date: formatDateToString(date), // Keep date as string
            }));
        }
    }, [date]);


    // Handler for selecting a date on the main calendar
    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        // The useEffect above will handle updating newAppointment.date
    };

    // Handler to open the "Add Appointment" dialog and reset form
    const handleOpenAddDialog = () => {
        setNewAppointment({
            ...defaultNewAppointment,
            date: date ? formatDateToString(date) : formatDateToString(new Date()), // Set date based on current calendar or today
        });
        setIsAddDialogOpen(true);
    };


    // Handler for submitting the "Add New Appointment" form
    const handleAddAppointment = () => {
        if (!newAppointment.title || !newAppointment.date || !newAppointment.startTime) {
            toast.error("Título, Data e Hora de Início são obrigatórios.");
            return;
        }

        // Construct the appointment object based on the Appointment type
        // Ensure all required fields from BaseEntity (id, createdAt, updatedAt) are handled by the context/backend
        const appointmentToAdd: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "client"> = {
            title: newAppointment.title!,
            date: formatDateToString(newAppointment.date), // Ensure date is string "yyyy-MM-dd"
            startTime: newAppointment.startTime!,
            endTime: newAppointment.endTime || undefined, // Optional
            type: newAppointment.type || "personal",
            status: newAppointment.status || "scheduled",
            notes: newAppointment.notes || undefined,
            description: newAppointment.description || undefined,
            clientId: newAppointment.clientId || undefined,
            serviceId: newAppointment.serviceId || undefined,
        };

        // Call the context function to add the appointment
        // The context function should generate id, createdAt, updatedAt
        addAppointment(appointmentToAdd as Appointment); // Cast if context expects full Appointment

        setIsAddDialogOpen(false); // Close the dialog
        toast.success("Compromisso adicionado com sucesso!");
    };

    // Handler for clicking the "Edit" button on an appointment
    const handleEditClick = (appointment: Appointment) => {
        // Set the editingAppointment state with a copy of the appointment data
        // Ensure the date is in "yyyy-MM-dd" string format for consistency if it's coming from various sources
        setEditingAppointment({
            ...appointment,
            date: formatDateToString(appointment.date),
        });
        setIsEditDialogOpen(true); // Open the edit dialog
    };

    // Handler for submitting the "Edit Appointment" form
    const handleEditAppointment = () => {
        if (!editingAppointment) {
            toast.error("Nenhum compromisso para editar.");
            return;
        }
        if (!editingAppointment.title || !editingAppointment.date || !editingAppointment.startTime) {
            toast.error("Título, Data e Hora de Início são obrigatórios na edição.");
            return;
        }

        // Construct the updated appointment object
        const appointmentToUpdate: Appointment = {
            ...editingAppointment,
            date: formatDateToString(editingAppointment.date), // Ensure date is string "yyyy-MM-dd"
            // Ensure other fields are correctly sourced from editingAppointment state
            title: editingAppointment.title,
            startTime: editingAppointment.startTime,
            endTime: editingAppointment.endTime || undefined,
            type: editingAppointment.type,
            status: editingAppointment.status,
            notes: editingAppointment.notes || undefined,
            description: editingAppointment.description || undefined,
        };

        updateAppointment(appointmentToUpdate); // Call context function to update
        setIsEditDialogOpen(false); // Close the dialog
        setEditingAppointment(null); // Clear editing state
        toast.success("Compromisso atualizado com sucesso!");
    };

    // Handler for removing an appointment
    const handleRemoveAppointment = (appointmentId: string) => {
        deleteAppointment(appointmentId);
        toast.success("Compromisso removido com sucesso!");
    };

    // Filters appointments for the currently selected date on the main calendar
    const getAppointmentsForDate = (selectedDate: Date | undefined): Appointment[] => {
        if (!selectedDate || !isValid(selectedDate)) return [];
        const targetDateString = formatDateToString(selectedDate);
        return appointments.filter(
            (app) => formatDateToString(app.date) === targetDateString
        );
    };

    // Memoized list of appointments for the currently selected date
    const currentDateAppointments = getAppointmentsForDate(date);

    // Filters appointments for the overview table based on the search query
    const filteredAppointments = appointments
        .filter((appointment) => {
            if (!searchQuery) return true; // Show all if no query
            const query = searchQuery.toLowerCase();
            // Search in title, type, notes, and description
            return (
                appointment.title.toLowerCase().includes(query) ||
                (appointment.type &&
                    appointment.type.toLowerCase().includes(query)) ||
                (appointment.notes &&
                    appointment.notes.toLowerCase().includes(query)) ||
                (appointment.description &&
                    appointment.description.toLowerCase().includes(query))
            );
        })
        .sort((a, b) => {
            // Sort by date, then by startTime
            const dateA = parseStringToDate(a.date)?.getTime() || 0;
            const dateB = parseStringToDate(b.date)?.getTime() || 0;
            if (dateA !== dateB) return dateA - dateB;
            // If dates are the same, sort by startTime
            return (a.startTime || "").localeCompare(b.startTime || "");
        });


    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header: Page Title and Add Appointment Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Agenda de Compromissos</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenAddDialog} className="anibtn-drawstroke sm:w-auto">
                            <CalendarIcon className="mr-2 h-4 w-4" /> Adicionar Compromisso
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Compromisso</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Title Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="add-title">Título</Label>
                                <Input
                                    id="add-title"
                                    value={newAppointment.title || ""}
                                    onChange={(e) =>
                                        setNewAppointment((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                    placeholder="Ex: Reunião com cliente"
                                />
                            </div>

                            {/* Date Field */}
                            <div className="grid gap-2">
                                <Label>Data</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full flex justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newAppointment.date && isValid(parseStringToDate(newAppointment.date))
                                                ? format(parseStringToDate(newAppointment.date)!, "dd/MM/yyyy")
                                                : "Selecione uma data"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={parseStringToDate(newAppointment.date)}
                                            onSelect={(d) =>
                                                setNewAppointment((prev) => ({
                                                    ...prev,
                                                    date: d ? formatDateToString(d) : undefined,
                                                }))
                                            }
                                            className="rounded-md border"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Start Time and End Time Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="add-startTime">Hora de Início</Label>
                                    <Input
                                        id="add-startTime"
                                        type="time"
                                        value={newAppointment.startTime || ""}
                                        onChange={(e) =>
                                            setNewAppointment((prev) => ({
                                                ...prev,
                                                startTime: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="add-endTime">Hora de Término (Opcional)</Label>
                                    <Input
                                        id="add-endTime"
                                        type="time"
                                        value={newAppointment.endTime || ""}
                                        onChange={(e) =>
                                            setNewAppointment((prev) => ({
                                                ...prev,
                                                endTime: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            {/* Type Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="add-type">Tipo</Label>
                                <Input // Consider using a Select component if types are predefined
                                    id="add-type"
                                    value={newAppointment.type || ""}
                                    onChange={(e) =>
                                        setNewAppointment((prev) => ({ ...prev, type: e.target.value as Appointment['type'] }))
                                    }
                                    placeholder="Ex: Pessoal, Serviço, Reunião"
                                />
                            </div>
                            {/* Status Field (Consider if this should be user-editable or default) */}
                            <div className="grid gap-2">
                                <Label htmlFor="add-status">Status</Label>
                                <Input // Consider using a Select component for status
                                    id="add-status"
                                    value={newAppointment.status || ""}
                                    onChange={(e) =>
                                        setNewAppointment((prev) => ({ ...prev, status: e.target.value as Appointment['status'] }))
                                    }
                                    placeholder="Ex: Agendado, Concluído"
                                />
                            </div>

                            {/* Notes Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="add-notes">Observações (Opcional)</Label>
                                <Input
                                    id="add-notes"
                                    value={newAppointment.notes || ""}
                                    onChange={(e) =>
                                        setNewAppointment((prev) => ({ ...prev, notes: e.target.value }))
                                    }
                                    placeholder="Detalhes adicionais"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button onClick={handleAddAppointment}>Salvar Compromisso</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Content: Calendar and Appointments for Selected Date */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Card */}
                <Card className="lg:col-span-1 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl text-gray-700">
                            <CalendarRange className="mr-2 h-5 w-5 text-blue-600" />
                            Calendário
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-2 md:p-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            className="rounded-md border w-full"
                            locale={ptBR} // For Portuguese month/day names
                        />
                    </CardContent>
                </Card>

                {/* Appointments for Selected Date Card */}
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl text-gray-700">
                            <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                            {date && isValid(date)
                                ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                : "Selecione uma data"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentDateAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {currentDateAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className={`p-4 rounded-lg border-l-4 ${appointment.type === "service"
                                                ? "border-blue-500 bg-blue-50"
                                                : appointment.type === "meeting"
                                                    ? "border-green-500 bg-green-50"
                                                    : appointment.type === "personal"
                                                        ? "border-purple-500 bg-purple-50"
                                                        : "border-gray-500 bg-gray-50"
                                            } shadow-sm hover:shadow-md transition-shadow`}
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                            <div className="flex-1 mb-2 sm:mb-0">
                                                <h3 className="font-semibold text-lg text-gray-800">{appointment.title}</h3>
                                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                                    <Clock className="mr-1.5 h-4 w-4" />
                                                    {appointment.startTime}
                                                    {appointment.endTime && ` - ${appointment.endTime}`}
                                                    {appointment.type && (
                                                        <span className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                                                            {appointment.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 self-start sm:self-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(appointment)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Editar Compromisso"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveAppointment(appointment.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                    aria-label="Remover Compromisso"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {appointment.notes && (
                                            <p className="text-sm mt-2 text-gray-500">{appointment.notes}</p>
                                        )}
                                        {appointment.description && (
                                            <p className="text-sm mt-1 text-gray-500 italic">{appointment.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CalendarIcon className="h-12 w-12 text-gray-400 mb-3" />
                                <p className="text-gray-500">Nenhum compromisso para esta data.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={handleOpenAddDialog}
                                >
                                    Adicionar Compromisso
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Overview Table of All Appointments */}
            <Card className="mt-8 shadow-lg">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
                    <CardTitle className="text-xl text-gray-700">Visão Geral de Compromissos</CardTitle>
                    <div className="w-full md:w-auto md:max-w-sm relative">
                        <Input
                            placeholder="Buscar compromissos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAppointments.length > 0 ? (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Início</TableHead>
                                        <TableHead>Fim</TableHead>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="max-w-xs">Observações</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAppointments.map((appointment) => (
                                        <TableRow key={appointment.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                {isValid(parseStringToDate(appointment.date))
                                                    ? format(parseStringToDate(appointment.date)!, "dd/MM/yy")
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>{appointment.startTime}</TableCell>
                                            <TableCell>{appointment.endTime || "-"}</TableCell>
                                            <TableCell className="font-medium text-gray-800">{appointment.title}</TableCell>
                                            <TableCell>
                                                {appointment.type && (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                                        {appointment.type}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {appointment.status && (
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700' // scheduled or other
                                                        }`}>
                                                        {appointment.status}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs text-sm text-gray-600">
                                                {appointment.notes ? (
                                                    <Tooltip.Root delayDuration={100}>
                                                        <Tooltip.Trigger asChild>
                                                            <span className="inline-block max-w-xs truncate cursor-default">
                                                                {appointment.notes}
                                                            </span>
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Portal>
                                                            <Tooltip.Content
                                                                className="max-w-xs p-2 text-sm bg-white rounded shadow-lg border border-gray-200 z-[100]"
                                                                side="top"
                                                                align="start"
                                                                sideOffset={5}
                                                                collisionPadding={10}
                                                            >
                                                                <p className="whitespace-pre-line break-words">
                                                                    {appointment.notes}
                                                                </p>
                                                                <Tooltip.Arrow className="fill-gray-200" />
                                                            </Tooltip.Content>
                                                        </Tooltip.Portal>
                                                    </Tooltip.Root>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditClick(appointment)}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        aria-label="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveAppointment(appointment.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        aria-label="Remover"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Search className="h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-gray-500">
                                {searchQuery ? "Nenhum compromisso encontrado para sua busca." : "Nenhum compromisso registrado ainda."}
                            </p>
                            {!searchQuery && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={handleOpenAddDialog}
                                >
                                    Adicionar Primeiro Compromisso
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Appointment Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Compromisso</DialogTitle>
                    </DialogHeader>
                    {editingAppointment && (
                        <>
                            <div className="grid gap-4 py-4">
                                {/* Title Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-title">Título</Label>
                                    <Input
                                        id="edit-title"
                                        value={editingAppointment.title || ""}
                                        onChange={(e) =>
                                            setEditingAppointment((prev) =>
                                                prev ? { ...prev, title: e.target.value } : null
                                            )
                                        }
                                    />
                                </div>

                                {/* Date Field */}
                                <div className="grid gap-2">
                                    <Label>Data</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full flex justify-start text-left font-normal"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editingAppointment.date && isValid(parseStringToDate(editingAppointment.date))
                                                    ? format(parseStringToDate(editingAppointment.date)!, "dd/MM/yyyy")
                                                    : "Selecione uma data"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={parseStringToDate(editingAppointment.date)}
                                                onSelect={(d) =>
                                                    setEditingAppointment((prev) =>
                                                        prev
                                                            ? { ...prev, date: d ? formatDateToString(d) : prev.date }
                                                            : null
                                                    )
                                                }
                                                className="rounded-md border"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Start Time and End Time Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-startTime">Hora de Início</Label>
                                        <Input
                                            id="edit-startTime"
                                            type="time"
                                            value={editingAppointment.startTime || ""}
                                            onChange={(e) =>
                                                setEditingAppointment((prev) =>
                                                    prev ? { ...prev, startTime: e.target.value } : null
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-endTime">Hora de Término (Opcional)</Label>
                                        <Input
                                            id="edit-endTime"
                                            type="time"
                                            value={editingAppointment.endTime || ""}
                                            onChange={(e) =>
                                                setEditingAppointment((prev) =>
                                                    prev ? { ...prev, endTime: e.target.value } : null
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Type Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-type">Tipo</Label>
                                    <Input // Consider Select
                                        id="edit-type"
                                        value={editingAppointment.type || ""}
                                        onChange={(e) =>
                                            setEditingAppointment((prev) =>
                                                prev ? { ...prev, type: e.target.value as Appointment['type'] } : null
                                            )
                                        }
                                    />
                                </div>
                                {/* Status Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Input // Consider Select
                                        id="edit-status"
                                        value={editingAppointment.status || ""}
                                        onChange={(e) =>
                                            setEditingAppointment((prev) =>
                                                prev ? { ...prev, status: e.target.value as Appointment['status'] } : null
                                            )
                                        }
                                    />
                                </div>


                                {/* Notes Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-notes">Observações (Opcional)</Label>
                                    <Input
                                        id="edit-notes"
                                        value={editingAppointment.notes || ""}
                                        onChange={(e) =>
                                            setEditingAppointment((prev) =>
                                                prev ? { ...prev, notes: e.target.value } : null
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" onClick={() => setEditingAppointment(null)}>Cancelar</Button>
                                </DialogClose>
                                <Button onClick={handleEditAppointment}>Salvar Alterações</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

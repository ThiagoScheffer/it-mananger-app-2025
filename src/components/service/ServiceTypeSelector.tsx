// ServiceTypeSelector.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

interface ServiceTypeSelectorProps {
    selectedTypes: string[];
    onAddType: (type: string) => void;
    onRemoveType: (type: string) => void;
    onUpdateCalculations: () => void;
}

export default function ServiceTypeSelector({
    selectedTypes,
    onAddType,
    onRemoveType,
    onUpdateCalculations
}: ServiceTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [customType, setCustomType] = useState("");
    const [customPrice, setCustomPrice] = useState<number | "">("");

    const {
        getTypeOptions,
        addServiceType,
        deleteServiceType,
        getTypePrice
    } = useAppContext();

    const serviceTypes = getTypeOptions();

    const addNewServiceType = () => {
        addServiceType({
            name: customType,
            price: Number(customPrice)
        });

        // Clear inputs
        setCustomType("");
        setCustomPrice("");

        // Close popover
        setIsOpen(false);

        // Add to selected types
        onAddType(customType.trim());
        onUpdateCalculations();

        toast.success("New service type added");
    };

    const handleSelectType = (typeName: string) => {
        if (selectedTypes.includes(typeName)) {
            return;
        }

        onAddType(typeName);
        onUpdateCalculations();
        setIsOpen(false);
        setSearchQuery("");
    };

    const filteredServiceTypes = searchQuery
        ? serviceTypes.filter(type =>
            type.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : serviceTypes;

    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium">
                Service Types
            </label>
            <div className="flex space-x-2">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isOpen}
                            className="w-full justify-between"
                        >
                            Select service type
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                            <CommandInput
                                placeholder="Search service type..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                            <CommandList className="max-h-[300px] scroll-smooth" ref={(ref) => {
                                ref?.addEventListener('wheel', (e) => {
                                    e.stopPropagation();
                                    ref.scrollBy(0, e.deltaY);
                                }, { passive: false });
                            }}>
                                <CommandEmpty>
                                    <div className="p-4 border-t">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Type not found. Add new:
                                        </p>
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                placeholder="Service name"
                                                value={customType}
                                                onChange={(e) => setCustomType(e.target.value)}
                                                className="flex-grow"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Price"
                                                value={customPrice}
                                                onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                                className="w-24"
                                            />
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={addNewServiceType}
                                            disabled={!customType.trim() || !customPrice || Number(customPrice) <= 0}
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>
                                </CommandEmpty>
                                <CommandGroup heading="Service Types">
                                    {filteredServiceTypes.map((type) => (
                                        <CommandItem
                                            key={type.name}
                                            value={type.name}
                                            onSelect={() => handleSelectType(type.name)}
                                            className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                                        >
                                            <div className="flex justify-between w-full items-center">
                                                <span>{type.name}</span>
                                                <div className="flex items-center">
                                                    <span className="text-muted-foreground">
                                                        R$ {getTypePrice(type.name).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <div className="p-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Add new service type:
                                    </p>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            placeholder="Service name"
                                            value={customType}
                                            onChange={(e) => setCustomType(e.target.value)}
                                            className="flex-grow"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Price"
                                            value={customPrice}
                                            onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-24"
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={addNewServiceType}
                                        disabled={!customType.trim() || !customPrice || Number(customPrice) <= 0}
                                    >
                                        <Plus className="mr-1 h-4 w-4" />
                                        Add
                                    </Button>
                                </div>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="border rounded-md p-2">
                {selectedTypes.length > 0 ? (
                    <div className="space-y-2">
                        {selectedTypes.map((type) => (
                            <div key={type} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div className="flex-1">
                                    <span className="text-sm">{type}</span>
                                    <Badge variant="outline" className="ml-2">
                                        R$ {getTypePrice(type).toFixed(2)}
                                    </Badge>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        onRemoveType(type);
                                        onUpdateCalculations();
                                    }}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-2">
                        No service types added
                    </div>
                )}
            </div>
        </div>
    );
}
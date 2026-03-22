import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveLists } from "@/hooks/useActiveLists";

// Define the form schema with areaId
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phoneNo: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  email: z.string().email().or(z.literal("")).optional(),
  areaId: z.number({
    message: "Please select an area",
  }),
  status: z.boolean(),
});

export type SalesmanFormData = z.infer<typeof formSchema>;

interface SalesmanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSalesman?: {
    id: number;
    name: string;
    phoneNo: string;
    email: string;
    areaId: number | null;
    status: boolean;
  } | null;
  onSave: (data: SalesmanFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function SalesmanForm({
  open,
  onOpenChange,
  editingSalesman,
  onSave,
  isSubmitting = false,
}: SalesmanFormProps) {
  const { areas } = useActiveLists();
  const [areaOpen, setAreaOpen] = useState(false);

  const form = useForm<SalesmanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNo: "",
      email: "",
      areaId: undefined,
      status: true,
    },
  });

  // Reset form when editingSalesman changes
  useEffect(() => {
    if (editingSalesman) {
      form.reset({
        name: editingSalesman.name,
        phoneNo: editingSalesman.phoneNo,
        email: editingSalesman.email || "",
        areaId: editingSalesman.areaId || undefined,
        status: editingSalesman.status,
      });
    } else {
      form.reset({
        name: "",
        phoneNo: "",
        email: "",
        areaId: undefined,
        status: true,
      });
    }
  }, [editingSalesman, form]);

  const getAreaName = (id: number | null | undefined) => {
    if (!id) return "Select Area *";
    const area = areas.find((a) => a.id === id);
    return area ? area.name : "Select Area *";
  };

  const onSubmit = (data: SalesmanFormData) => {
    onSave(data, editingSalesman?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingSalesman ? "Edit Salesman" : "Add New Salesman"}
          </DialogTitle>
          <DialogDescription>
            {editingSalesman
              ? "Update the salesman's details."
              : "Add a new salesman to your sales team with contact information and area."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91 9876543210"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Area - Command Dropdown */}
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Area *</FormLabel>
                    <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={areaOpen}
                          className="w-full justify-between"
                          disabled={isSubmitting}
                        >
                          {getAreaName(field.value)}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search area..." />
                          <CommandList>
                            <CommandEmpty>No area found.</CommandEmpty>
                            <CommandGroup>
                              {areas.map((area) => (
                                <CommandItem
                                  key={area.id}
                                  value={area.id.toString()}
                                  onSelect={() => {
                                    field.onChange(area.id);
                                    setAreaOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === area.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {area.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="john@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      field.onChange(value === "true")
                    }
                    value={field.value ? "true" : "false"}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingSalesman
                    ? "Update Salesman"
                    : "Create Salesman"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

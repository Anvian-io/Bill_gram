// components/forms/VanForm.tsx
import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Van name must be at least 2 characters.",
  }),
  registrationNumber: z.string().min(5, {
    message: "Registration number must be at least 5 characters.",
  }),
  model: z.string().min(2, {
    message: "Model must be at least 2 characters.",
  }),
  capacity: z.coerce.number().min(1, {
    message: "Capacity must be at least 1 kg.",
  }),
  driverName: z.string().min(2, {
    message: "Driver name must be at least 2 characters.",
  }),
  driverContact: z.string().min(10, {
    message: "Driver contact must be at least 10 digits.",
  }),
  currentLocation: z.string().min(2, {
    message: "Current location must be at least 2 characters.",
  }),
  assignedRoute: z.string().min(1, {
    message: "Assigned route is required.",
  }),
  lastServiceDate: z.string().min(1, {
    message: "Last service date is required.",
  }),
  nextServiceDate: z.string().min(1, {
    message: "Next service date is required.",
  }),
  maintenanceStatus: z.enum(["OK", "Due Soon", "Overdue"]),
  insuranceExpiry: z.string().min(1, {
    message: "Insurance expiry date is required.",
  }),
  status: z.enum(["Active", "Inactive"]),
});

export type VanFormData = z.infer<typeof formSchema>;

interface VanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVan?: {
    id: number;
    name: string;
    registrationNumber: string;
    model: string;
    capacity: number;
    driverName: string;
    driverContact: string;
    currentLocation: string;
    assignedRoute: string;
    lastServiceDate: string;
    nextServiceDate: string;
    maintenanceStatus: "OK" | "Due Soon" | "Overdue";
    insuranceExpiry: string;
    status: "Active" | "Inactive";
  } | null;
  onSave: (data: VanFormData, id?: number) => void;
}

export default function VanForm({
  open,
  onOpenChange,
  editingVan,
  onSave,
}: VanFormProps) {
  const form = useForm<VanFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      registrationNumber: "",
      model: "",
      capacity: 1000,
      driverName: "",
      driverContact: "",
      currentLocation: "",
      assignedRoute: "",
      lastServiceDate: new Date().toISOString().split("T")[0],
      nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      maintenanceStatus: "OK",
      insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "Active",
    },
  });

  // Reset form when editingVan changes
  useEffect(() => {
    if (editingVan) {
      form.reset({
        name: editingVan.name,
        registrationNumber: editingVan.registrationNumber,
        model: editingVan.model,
        capacity: editingVan.capacity,
        driverName: editingVan.driverName,
        driverContact: editingVan.driverContact,
        currentLocation: editingVan.currentLocation,
        assignedRoute: editingVan.assignedRoute,
        lastServiceDate: editingVan.lastServiceDate,
        nextServiceDate: editingVan.nextServiceDate,
        maintenanceStatus: editingVan.maintenanceStatus,
        insuranceExpiry: editingVan.insuranceExpiry,
        status: editingVan.status,
      });
    } else {
      form.reset({
        name: "",
        registrationNumber: "",
        model: "",
        capacity: 1000,
        driverName: "",
        driverContact: "",
        currentLocation: "",
        assignedRoute: "",
        lastServiceDate: new Date().toISOString().split("T")[0],
        nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        maintenanceStatus: "OK",
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: "Active",
      });
    }
  }, [editingVan, form]);

  const onSubmit = (data: VanFormData) => {
    try {
      onSave(data, editingVan?.id);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save van:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVan ? "Edit Van" : "Add New Van"}</DialogTitle>
          <DialogDescription>
            {editingVan
              ? "Update van information and maintenance details."
              : "Add a new delivery van to your fleet with all necessary details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Van Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Van Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Van Alpha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Registration Number */}
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="DL01AB1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tata Ace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Capacity */}
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Driver Name */}
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ramesh Kumar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Driver Contact */}
              <FormField
                control={form.control}
                name="driverContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Contact *</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Location */}
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="South Delhi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assigned Route */}
              <FormField
                control={form.control}
                name="assignedRoute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Route *</FormLabel>
                    <FormControl>
                      <Input placeholder="Route A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Service Date */}
              <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Service Date */}
              <FormField
                control={form.control}
                name="nextServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Service Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Maintenance Status */}
              <FormField
                control={form.control}
                name="maintenanceStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Due Soon">Due Soon</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Insurance Expiry */}
              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Expiry Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingVan ? "Update Van" : "Create Van"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

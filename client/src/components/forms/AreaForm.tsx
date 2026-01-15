// components/forms/AreaForm.tsx
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
    message: "Area name must be at least 2 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  pincode: z.string().min(6, {
    message: "Pincode must be at least 6 characters.",
  }),
  region: z.string().min(2, {
    message: "Region must be at least 2 characters.",
  }),
  salesman: z.string().min(2, {
    message: "Salesman name must be at least 2 characters.",
  }),
  customerCount: z.coerce.number().min(0, {
    message: "Customer count must be a positive number.",
  }),
  salesTarget: z.coerce.number().min(0, {
    message: "Sales target must be a positive number.",
  }),
  currentSales: z.coerce.number().min(0, {
    message: "Current sales must be a positive number.",
  }),
  status: z.enum(["Active", "Inactive", "Under Review"]),
});

export type AreaFormData = z.infer<typeof formSchema>;

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArea?: {
    id: number;
    name: string;
    description: string;
    city: string;
    state: string;
    pincode: string;
    region: string;
    salesman: string;
    customerCount: number;
    salesTarget: number;
    currentSales: number;
    status: "Active" | "Inactive" | "Under Review";
  } | null;
  onSave: (data: AreaFormData, id?: number) => void;
}

export default function AreaForm({
  open,
  onOpenChange,
  editingArea,
  onSave,
}: AreaFormProps) {
  const form = useForm<AreaFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      city: "",
      state: "",
      pincode: "",
      region: "",
      salesman: "",
      customerCount: 0,
      salesTarget: 0,
      currentSales: 0,
      status: "Active",
    },
  });

  // Reset form when editingArea changes
  useEffect(() => {
    if (editingArea) {
      form.reset({
        name: editingArea.name,
        description: editingArea.description,
        city: editingArea.city,
        state: editingArea.state,
        pincode: editingArea.pincode,
        region: editingArea.region,
        salesman: editingArea.salesman,
        customerCount: editingArea.customerCount,
        salesTarget: editingArea.salesTarget,
        currentSales: editingArea.currentSales,
        status: editingArea.status,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        city: "",
        state: "",
        pincode: "",
        region: "",
        salesman: "",
        customerCount: 0,
        salesTarget: 0,
        currentSales: 0,
        status: "Active",
      });
    }
  }, [editingArea, form]);

  const onSubmit = (data: AreaFormData) => {
    try {
      onSave(data, editingArea?.id);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save area:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingArea ? "Edit Area" : "Add New Area"}
          </DialogTitle>
          <DialogDescription>
            {editingArea
              ? "Update area information and performance metrics."
              : "Add a new geographical area for sales and distribution management."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., South Delhi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Region */}
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Delhi NCR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Delhi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* State */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Delhi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pincode */}
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode *</FormLabel>
                    <FormControl>
                      <Input placeholder="110001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Salesman */}
              <FormField
                control={form.control}
                name="salesman"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salesman *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rajesh Kumar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Count */}
              <FormField
                control={form.control}
                name="customerCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
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

              {/* Sales Target */}
              <FormField
                control={form.control}
                name="salesTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Target (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Sales */}
              <FormField
                control={form.control}
                name="currentSales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Sales (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
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
                        <SelectItem value="Under Review">
                          Under Review
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the area characteristics and market"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingArea ? "Update Area" : "Create Area"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
    message: "Supplier name must be at least 2 characters.",
  }),
  phoneNo: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().optional(),
  gstIN: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format (e.g., 27AAPFU0939F1ZV)",
    )
    .or(z.literal(""))
    .optional(),
  status: z.boolean().default(true),
});

export type SupplierFormData = z.infer<typeof formSchema>;

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier?: {
    id: number;
    name: string;
    phoneNo: string;
    email: string;
    address: string | null;
    gstIN: string | null;
    status: boolean;
  } | null;
  onSave: (data: SupplierFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function SupplierForm({
  open,
  onOpenChange,
  editingSupplier,
  onSave,
  isSubmitting = false,
}: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      phoneNo: "",
      email: "",
      address: "",
      gstIN: "",
      status: true,
    },
  });

  // Reset form when editingSupplier changes
  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        name: editingSupplier.name,
        phoneNo: editingSupplier.phoneNo,
        email: editingSupplier.email || "",
        address: editingSupplier.address || "",
        gstIN: editingSupplier.gstIN || "",
        status: editingSupplier.status,
      });
    } else {
      form.reset({
        name: "",
        phoneNo: "",
        email: "",
        address: "",
        gstIN: "",
        status: true,
      });
    }
  }, [editingSupplier, form]);

  const onSubmit = (data: SupplierFormData) => {
    onSave(data, editingSupplier?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {editingSupplier
              ? "Update supplier information."
              : "Add a new supplier to your database with contact information."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ABC Distributors"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Number */}
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

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="supplier@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GSTIN */}
              <FormField
                control={form.control}
                name="gstIN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="27AAPFU0939F1ZV"
                        {...field}
                        disabled={isSubmitting}
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
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Complete address with landmark"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingSupplier
                    ? "Update Supplier"
                    : "Create Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

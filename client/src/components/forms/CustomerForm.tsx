// components/forms/CustomerForm.tsx
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
    message: "Customer name must be at least 2 characters.",
  }),
  type: z.enum([
    "Retail Store",
    "Supermarket",
    "Hypermarket",
    "Chain Store",
    "Kirana",
    "Distributor",
  ]),
  contactPerson: z.string().min(2, {
    message: "Contact person name must be at least 2 characters.",
  }),
  mobile: z.string().min(10, {
    message: "Mobile number must be at least 10 digits.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
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
  creditLimit: z.coerce.number().min(0, {
    message: "Credit limit must be a positive number.",
  }),
  outstandingBalance: z.coerce.number().min(0, {
    message: "Outstanding balance must be a positive number.",
  }),
  salesman: z.string().min(2, {
    message: "Salesman name must be at least 2 characters.",
  }),
  status: z.enum(["Active", "Inactive", "Credit Hold", "Blocked"]),
});

export type CustomerFormData = z.infer<typeof formSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer?: {
    id: number;
    name: string;
    type:
      | "Retail Store"
      | "Supermarket"
      | "Hypermarket"
      | "Chain Store"
      | "Kirana"
      | "Distributor";
    contactPerson: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    creditLimit: number;
    outstandingBalance: number;
    salesman: string;
    status: "Active" | "Inactive" | "Credit Hold" | "Blocked";
  } | null;
  onSave: (data: CustomerFormData, id?: number) => void;
}

export default function CustomerForm({
  open,
  onOpenChange,
  editingCustomer,
  onSave,
}: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      type: "Retail Store",
      contactPerson: "",
      mobile: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      creditLimit: 0,
      outstandingBalance: 0,
      salesman: "",
      status: "Active",
    },
  });

  // Reset form when editingCustomer changes
  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        type: editingCustomer.type,
        contactPerson: editingCustomer.contactPerson,
        mobile: editingCustomer.mobile,
        email: editingCustomer.email,
        address: editingCustomer.address,
        city: editingCustomer.city,
        state: editingCustomer.state,
        pincode: editingCustomer.pincode,
        creditLimit: editingCustomer.creditLimit,
        outstandingBalance: editingCustomer.outstandingBalance,
        salesman: editingCustomer.salesman,
        status: editingCustomer.status,
      });
    } else {
      form.reset({
        name: "",
        type: "Retail Store",
        contactPerson: "",
        mobile: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        creditLimit: 0,
        outstandingBalance: 0,
        salesman: "",
        status: "Active",
      });
    }
  }, [editingCustomer, form]);

  const onSubmit = (data: CustomerFormData) => {
    try {
      onSave(data, editingCustomer?.id);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
          <DialogDescription>
            {editingCustomer
              ? "Update customer information and credit details."
              : "Add a new customer to your database with contact and credit information."}
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
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Reliance Fresh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Retail Store">
                          Retail Store
                        </SelectItem>
                        <SelectItem value="Supermarket">Supermarket</SelectItem>
                        <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                        <SelectItem value="Chain Store">Chain Store</SelectItem>
                        <SelectItem value="Kirana">Kirana</SelectItem>
                        <SelectItem value="Distributor">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Person */}
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mr. Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mobile */}
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
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
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="customer@example.com" {...field} />
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
                        <SelectItem value="Credit Hold">Credit Hold</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Limit */}
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Outstanding Balance */}
              <FormField
                control={form.control}
                name="outstandingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Balance (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
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
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Complete address with landmark"
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
                {editingCustomer ? "Update Customer" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

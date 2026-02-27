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
import { Textarea } from "@/components/ui/textarea";
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

// Customer type options
const customerTypeOptions = [
  "Retail Store",
  "Supermarket",
  "Hypermarket",
  "Chain Store",
  "Kirana",
  "Distributor",
  "Wholesaler",
  "Corporate",
  "Online Store",
  "Other",
];

// Define the form schema
const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  personName: z.string().min(2, {
    message: "Person name must be at least 2 characters.",
  }),
  phoneNo: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  email: z.string().email().or(z.literal("")).optional(),
  customerType: z.string().optional(),
  city: z.string().optional(),
  areaId: z.number().nullable().optional(),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  pincode: z.string().optional(),
  status: z.boolean(),
});

export type CustomerFormData = z.infer<typeof formSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer?: {
    id: number;
    companyName: string;
    personName: string;
    phoneNo: string;
    email: string;
    customerType: string | null;
    city: string | null;
    areaId: number | null;
    address: string;
    pincode: string | null;
    status: boolean;
  } | null;
  onSave: (data: CustomerFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function CustomerForm({
  open,
  onOpenChange,
  editingCustomer,
  onSave,
  isSubmitting = false,
}: CustomerFormProps) {
  const { areas } = useActiveLists();
  const [areaOpen, setAreaOpen] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      personName: "",
      phoneNo: "",
      email: "",
      customerType: "",
      city: "",
      areaId: null,
      address: "",
      pincode: "",
      status: true,
    },
  });

  // Reset form when editingCustomer changes
  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        companyName: editingCustomer.companyName,
        personName: editingCustomer.personName,
        phoneNo: editingCustomer.phoneNo,
        email: editingCustomer.email || "",
        customerType: editingCustomer.customerType || "",
        city: editingCustomer.city || "",
        areaId: editingCustomer.areaId,
        address: editingCustomer.address,
        pincode: editingCustomer.pincode || "",
        status: editingCustomer.status,
      });
    } else {
      form.reset({
        companyName: "",
        personName: "",
        phoneNo: "",
        email: "",
        customerType: "",
        city: "",
        areaId: null,
        address: "",
        pincode: "",
        status: true,
      });
    }
  }, [editingCustomer, form]);

  const getAreaName = (id: number | null | undefined) => {
    if (!id) return "Select Area";
    const area = areas.find((a) => a.id === id);
    return area ? area.name : "Select Area";
  };

  const onSubmit = (data: CustomerFormData) => {
    onSave(data, editingCustomer?.id);
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
              ? "Update customer information."
              : "Add a new customer to your database with contact information."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Reliance Fresh"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Person */}
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Mr. Sharma"
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
                        placeholder="customer@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Type */}
              <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customerTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Delhi"
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
                    <FormLabel>Area</FormLabel>
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
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  field.onChange(null);
                                  setAreaOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === null ||
                                      field.value === undefined
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                None
                              </CommandItem>
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

              {/* Pincode */}
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="110001"
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
                  <FormLabel>Full Address *</FormLabel>
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
                  : editingCustomer
                    ? "Update Customer"
                    : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

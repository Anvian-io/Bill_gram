// components/forms/ProductCompanyForm.tsx
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
import { FormActiveStatusField } from "@/components/custom_ui/FormActiveStatusField";

// Define the form schema with boolean status
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  contactPerson: z.string().min(2, {
    message: "Contact person name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(5, {
    message: "Phone number must be at least 5 characters.",
  }),
  website: z.string().url().or(z.literal("")).optional(),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  status: z.boolean(),
});

export type ProductCompanyFormData = z.infer<typeof formSchema>;

interface ProductCompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompany?: {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    status: boolean;
  } | null;
  onSave: (data: ProductCompanyFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function ProductCompanyForm({
  open,
  onOpenChange,
  editingCompany,
  onSave,
  isSubmitting = false,
}: ProductCompanyFormProps) {
  const form = useForm<ProductCompanyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      status: true,
    },
  });

  // Reset form when editingCompany changes
  useEffect(() => {
    if (editingCompany) {
      form.reset({
        name: editingCompany.name,
        contactPerson: editingCompany.contactPerson,
        email: editingCompany.email,
        phone: editingCompany.phone,
        website: editingCompany.website || "",
        address: editingCompany.address,
        status: editingCompany.status,
      });
    } else {
      form.reset({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        status: true,
      });
    }
  }, [editingCompany, form]);

  const onSubmit = (data: ProductCompanyFormData) => {
    onSave(data, editingCompany?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCompany ? "Edit Company" : "Add New Company"}
          </DialogTitle>
          <DialogDescription>
            {editingCompany
              ? "Update the details of the product company."
              : "Add a new product company to your system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 137 Degrees"
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
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John Smith"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., contact@company.com"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +1 (555) 123-4567"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., www.company.com"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full company address"
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <FormActiveStatusField
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
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
                  : editingCompany
                    ? "Update Company"
                    : "Create Company"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

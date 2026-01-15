// components/forms/SalesmanForm.tsx
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
    message: "Name must be at least 2 characters.",
  }),
  mobile: z.string().regex(/^\+?[\d\s-]+$/, {
    message: "Please enter a valid mobile number.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  area: z.string().min(2, {
    message: "Area must be at least 2 characters.",
  }),
  target: z.string().min(1, {
    message: "Target is required.",
  }),
  achieved: z.string().min(1, {
    message: "Achieved amount is required.",
  }),
  commission: z.string().min(1, {
    message: "Commission rate is required.",
  }),
  status: z.enum(["Active", "Inactive", "On Leave"]),
});

export type SalesmanFormData = z.infer<typeof formSchema>;

interface SalesmanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSalesman?: {
    id: number;
    name: string;
    mobile: string;
    email: string;
    area: string;
    target: number;
    achieved: number;
    commission: number;
    status: "Active" | "Inactive" | "On Leave";
  } | null;
  onSave: (data: SalesmanFormData, id?: number) => void;
}

export default function SalesmanForm({
  open,
  onOpenChange,
  editingSalesman,
  onSave,
}: SalesmanFormProps) {
  const form = useForm<SalesmanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      area: "",
      target: "",
      achieved: "",
      commission: "",
      status: "Active",
    },
  });

  // Reset form when editingSalesman changes
  useEffect(() => {
    if (editingSalesman) {
      form.reset({
        name: editingSalesman.name,
        mobile: editingSalesman.mobile,
        email: editingSalesman.email,
        area: editingSalesman.area,
        target: editingSalesman.target.toString(),
        achieved: editingSalesman.achieved.toString(),
        commission: editingSalesman.commission.toString(),
        status: editingSalesman.status,
      });
    } else {
      form.reset({
        name: "",
        mobile: "",
        email: "",
        area: "",
        target: "",
        achieved: "",
        commission: "",
        status: "Active",
      });
    }
  }, [editingSalesman, form]);

  const onSubmit = (data: SalesmanFormData) => {
    try {
      onSave(data, editingSalesman?.id);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save salesman:", error);
    }
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
              ? "Update the salesman's details and performance metrics."
              : "Add a new salesman to your sales team with their contact information and targets."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Area *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., South Delhi, Noida" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="achieved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achieved (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="425000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="8.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
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
                      <SelectItem value="On Leave">On Leave</SelectItem>
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
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingSalesman ? "Update Salesman" : "Create Salesman"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

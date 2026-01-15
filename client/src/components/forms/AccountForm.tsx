// components/forms/AccountForm.tsx
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
    message: "Account name must be at least 2 characters.",
  }),
  type: z.enum(["Asset", "Liability", "Revenue", "Expense", "Equity"]),
  group: z.string().min(2, {
    message: "Group must be at least 2 characters.",
  }),
  subGroup: z.string().optional(),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  openingBalance: z.coerce.number({
    message: "Opening balance must be a number.",
  }),
  currentBalance: z.coerce.number({
    message: "Current balance must be a number.",
  }),
  creditLimit: z.coerce.number().min(0, {
    message: "Credit limit must be a positive number.",
  }),
  status: z.enum(["Active", "Inactive", "Closed"]),
});

export type AccountFormData = z.infer<typeof formSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount?: {
    id: number;
    name: string;
    type: "Asset" | "Liability" | "Revenue" | "Expense" | "Equity";
    group: string;
    subGroup?: string;
    description: string;
    openingBalance: number;
    currentBalance: number;
    creditLimit: number;
    status: "Active" | "Inactive" | "Closed";
  } | null;
  onSave: (data: AccountFormData, id?: number) => void;
}

export default function AccountForm({
  open,
  onOpenChange,
  editingAccount,
  onSave,
}: AccountFormProps) {
  const form = useForm<AccountFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      type: "Asset",
      group: "",
      subGroup: "",
      description: "",
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 0,
      status: "Active",
    },
  });

  // Reset form when editingAccount changes
  useEffect(() => {
    if (editingAccount) {
      form.reset({
        name: editingAccount.name,
        type: editingAccount.type,
        group: editingAccount.group,
        subGroup: editingAccount.subGroup || "",
        description: editingAccount.description,
        openingBalance: editingAccount.openingBalance,
        currentBalance: editingAccount.currentBalance,
        creditLimit: editingAccount.creditLimit,
        status: editingAccount.status,
      });
    } else {
      form.reset({
        name: "",
        type: "Asset",
        group: "",
        subGroup: "",
        description: "",
        openingBalance: 0,
        currentBalance: 0,
        creditLimit: 0,
        status: "Active",
      });
    }
  }, [editingAccount, form]);

  const onSubmit = (data: AccountFormData) => {
    try {
      onSave(data, editingAccount?.id);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save account:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {editingAccount
              ? "Update account information and financial details."
              : "Add a new account to your chart of accounts."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cash Account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type *</FormLabel>
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
                        <SelectItem value="Asset">Asset</SelectItem>
                        <SelectItem value="Liability">Liability</SelectItem>
                        <SelectItem value="Revenue">Revenue</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Group */}
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Current Assets" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sub Group */}
              <FormField
                control={form.control}
                name="subGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Group (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Cash & Cash Equivalents"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Opening Balance */}
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Balance (₹)</FormLabel>
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

              {/* Current Balance */}
              <FormField
                control={form.control}
                name="currentBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance (₹)</FormLabel>
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

              {/* Credit Limit */}
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (₹)</FormLabel>
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
                        <SelectItem value="Closed">Closed</SelectItem>
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
                      placeholder="Describe the purpose of this account..."
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
                {editingAccount ? "Update Account" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

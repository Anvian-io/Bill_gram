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

// Define the form schema with boolean status
const formSchema = z.object({
  accountHolder: z.string().min(2, {
    message: "Account holder name must be at least 2 characters.",
  }),
  ifscCode: z.string().min(5, {
    message: "IFSC code must be at least 5 characters.",
  }),
  bankName: z.string().min(2, {
    message: "Bank name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  qrCode: z.string().optional(),
  gpayNo: z.string().optional(),
  status: z.boolean(),
});

export type AccountFormData = z.infer<typeof formSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount?: {
    id: number;
    accountHolder: string;
    ifscCode: string;
    bankName: string;
    description: string;
    qrCode: string | null;
    gpayNo: string | null;
    status: boolean;
  } | null;
  onSave: (data: AccountFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function AccountForm({
  open,
  onOpenChange,
  editingAccount,
  onSave,
  isSubmitting = false,
}: AccountFormProps) {
  const form = useForm<AccountFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountHolder: "",
      ifscCode: "",
      bankName: "",
      description: "",
      qrCode: "",
      gpayNo: "",
      status: true,
    },
  });

  // Reset form when editingAccount changes
  useEffect(() => {
    if (editingAccount) {
      form.reset({
        accountHolder: editingAccount.accountHolder,
        ifscCode: editingAccount.ifscCode,
        bankName: editingAccount.bankName,
        description: editingAccount.description || "",
        qrCode: editingAccount.qrCode || "",
        gpayNo: editingAccount.gpayNo || "",
        status: editingAccount.status,
      });
    } else {
      form.reset({
        accountHolder: "",
        ifscCode: "",
        bankName: "",
        description: "",
        qrCode: "",
        gpayNo: "",
        status: true,
      });
    }
  }, [editingAccount, form]);

  const onSubmit = (data: AccountFormData) => {
    onSave(data, editingAccount?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {editingAccount
              ? "Update bank account information and digital payment details."
              : "Add a new bank account to your financial records."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., John Doe"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SBIN0001234"
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
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="State Bank of India"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this account..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qrCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://qrcode.example.com/..."
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
                name="gpayNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPay Number</FormLabel>
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
            </div>

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
                  : editingAccount
                    ? "Update Account"
                    : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

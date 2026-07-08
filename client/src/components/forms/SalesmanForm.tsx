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
import { FormActiveStatusField } from "@/components/custom_ui/FormActiveStatusField";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phoneNo: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
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
  const form = useForm<SalesmanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNo: "",
      email: "",
      status: true,
    },
  });

  useEffect(() => {
    if (editingSalesman) {
      form.reset({
        name: editingSalesman.name,
        phoneNo: editingSalesman.phoneNo,
        email: editingSalesman.email || "",
        status: editingSalesman.status,
      });
    } else {
      form.reset({
        name: "",
        phoneNo: "",
        email: "",
        status: true,
      });
    }
  }, [editingSalesman, form]);

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
              : "Add a new salesman to your sales team."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            data-entry-form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
                    <FormLabel>Phone Number</FormLabel>
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
            </div>

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

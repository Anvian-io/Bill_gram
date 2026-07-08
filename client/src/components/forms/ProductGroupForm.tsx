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
import { type ProductGroupFormData } from "@/types/productGroup";

// Define the form schema with boolean status
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Group name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.boolean(),
});

interface ProductGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup?: {
    id: number;
    name: string;
    description: string;
    status: boolean;
  } | null;
  onSave: (data: ProductGroupFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function ProductGroupForm({
  open,
  onOpenChange,
  editingGroup,
  onSave,
  isSubmitting = false,
}: ProductGroupFormProps) {
  const form = useForm<ProductGroupFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: true,
    },
  });

  // Reset form when editingGroup changes
  useEffect(() => {
    if (editingGroup) {
      form.reset({
        name: editingGroup.name,
        description: editingGroup.description,
        status: editingGroup.status,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        status: true,
      });
    }
  }, [editingGroup, form]);

  const onSubmit = (data: ProductGroupFormData) => {
    onSave(data, editingGroup?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "Edit Product Group" : "Add Product Group"}
          </DialogTitle>
          <DialogDescription>
            {editingGroup
              ? "Update the details of your product group."
              : "Create a new product group to organize your products."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., ELITE, PREMIUM"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the product group"
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
                  : editingGroup
                    ? "Update Group"
                    : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

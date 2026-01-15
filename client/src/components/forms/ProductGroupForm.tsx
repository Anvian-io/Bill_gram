// components/ProductGroupForm.tsx
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
import { toast } from "sonner";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Group name must be at least 2 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
});

export type ProductGroupFormData = z.infer<typeof formSchema>;

interface ProductGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup?: {
    id: number;
    name: string;
    description: string;
  } | null;
  onSave: (data: ProductGroupFormData, id?: number) => void;
}

export default function ProductGroupForm({
  open,
  onOpenChange,
  editingGroup,
  onSave,
}: ProductGroupFormProps) {
  const form = useForm<ProductGroupFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when editingGroup changes
  useEffect(() => {
    if (editingGroup) {
      form.reset({
        name: editingGroup.name,
        description: editingGroup.description,
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [editingGroup, form]);

  const onSubmit = (data: ProductGroupFormData) => {
    try {
      onSave(data, editingGroup?.id);
      toast.success(
        editingGroup
          ? "Product group updated successfully!"
          : "Product group created successfully!"
      );
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to save product group");
    }
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
                    <Input placeholder="e.g., ELITE, PREMIUM" {...field} />
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
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the product group"
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
                {editingGroup ? "Update Group" : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

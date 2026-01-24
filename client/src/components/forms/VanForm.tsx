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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema with boolean status
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Van name must be at least 2 characters.",
  }),
  vehicleNo: z.string().optional(),
  model: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  status: z.boolean(),
});

export type VanFormData = z.infer<typeof formSchema>;

interface VanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVan?: {
    id: number;
    name: string;
    vehicleNo: string | null;
    model: string | null;
    area: string | null;
    city: string | null;
    status: boolean;
  } | null;
  onSave: (data: VanFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function VanForm({
  open,
  onOpenChange,
  editingVan,
  onSave,
  isSubmitting = false,
}: VanFormProps) {
  const form = useForm<VanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      vehicleNo: "",
      model: "",
      area: "",
      city: "",
      status: true,
    },
  });

  // Reset form when editingVan changes
  useEffect(() => {
    if (editingVan) {
      form.reset({
        name: editingVan.name,
        vehicleNo: editingVan.vehicleNo || "",
        model: editingVan.model || "",
        area: editingVan.area || "",
        city: editingVan.city || "",
        status: editingVan.status,
      });
    } else {
      form.reset({
        name: "",
        vehicleNo: "",
        model: "",
        area: "",
        city: "",
        status: true,
      });
    }
  }, [editingVan, form]);

  const onSubmit = (data: VanFormData) => {
    onSave(data, editingVan?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVan ? "Edit Van" : "Add New Van"}</DialogTitle>
          <DialogDescription>
            {editingVan
              ? "Update van information and location details."
              : "Add a new delivery van to your fleet with basic information."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Van Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Van Alpha"
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
                name="vehicleNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DL01AB1234"
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
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tata Ace"
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
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="South Delhi"
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Delhi"
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
                  : editingVan
                    ? "Update Van"
                    : "Create Van"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

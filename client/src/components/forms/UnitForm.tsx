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
import { type UnitFormData } from "@/types/unit";

// Define the form schema (simplified - no baseUnit or conversionFactor)
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Unit name must be at least 2 characters.",
  }),
  symbol: z.string().min(1, {
    message: "Symbol is required.",
  }),
  status: z.boolean(),
});

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUnit?: {
    id: number;
    name: string;
    symbol: string;
    status: boolean;
  } | null;
  onSave: (data: UnitFormData, id?: number) => void;
  isSubmitting?: boolean;
}

export default function UnitForm({
  open,
  onOpenChange,
  editingUnit,
  onSave,
  isSubmitting = false,
}: UnitFormProps) {
  const form = useForm<UnitFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      status: true,
    },
  });

  // Reset form when editingUnit changes
  useEffect(() => {
    if (editingUnit) {
      form.reset({
        name: editingUnit.name,
        symbol: editingUnit.symbol,
        status: editingUnit.status,
      });
    } else {
      form.reset({
        name: "",
        symbol: "",
        status: true,
      });
    }
  }, [editingUnit, form]);

  const onSubmit = (data: UnitFormData) => {
    onSave(data, editingUnit?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingUnit ? "Edit Unit" : "Add New Unit"}
          </DialogTitle>
          <DialogDescription>
            {editingUnit
              ? "Update the details of your measurement unit."
              : "Create a new measurement unit for your products."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Kilogram, Liter"
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
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., kg, L, pc"
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
                  : editingUnit
                    ? "Update Unit"
                    : "Create Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

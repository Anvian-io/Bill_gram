// components/UnitForm.tsx
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Unit name must be at least 2 characters.",
  }),
  symbol: z.string().min(1, {
    message: "Symbol is required.",
  }),
  baseUnit: z.boolean().default(false),
  conversionFactor: z.number().min(0.0001, {
    message: "Conversion factor must be greater than 0.",
  }),
});

export type UnitFormData = z.infer<typeof formSchema>;

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUnit?: {
    id: number;
    name: string;
    symbol: string;
    baseUnit: boolean;
    conversionFactor: number;
  } | null;
  onSave: (data: UnitFormData, id?: number) => void;
}

export default function UnitForm({
  open,
  onOpenChange,
  editingUnit,
  onSave,
}: UnitFormProps) {
  const form = useForm<UnitFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      symbol: "",
      baseUnit: false,
      conversionFactor: 1,
    },
  });

  // Reset form when editingUnit changes
  useEffect(() => {
    if (editingUnit) {
      form.reset({
        name: editingUnit.name,
        symbol: editingUnit.symbol,
        baseUnit: editingUnit.baseUnit,
        conversionFactor: editingUnit.conversionFactor,
      });
    } else {
      form.reset({
        name: "",
        symbol: "",
        baseUnit: false,
        conversionFactor: 1,
      });
    }
  }, [editingUnit, form]);

  const onSubmit = (data: UnitFormData) => {
    try {
      onSave(data, editingUnit?.id);
      toast.success(
        editingUnit
          ? "Unit updated successfully!"
          : "Unit created successfully!"
      );
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to save unit");
    }
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
                    <Input placeholder="e.g., Kilogram, Liter" {...field} />
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
                    <Input placeholder="e.g., kg, L, pc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conversionFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversion Factor *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="e.g., 1, 0.001"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 1)
                      }
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Base units should have factor = 1. Derived units: e.g., gram
                    = 0.001 (1 g = 0.001 kg)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseUnit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Base Unit</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mark this as a base measurement unit
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {editingUnit ? "Update Unit" : "Create Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

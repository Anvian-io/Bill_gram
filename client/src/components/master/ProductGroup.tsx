// ProductGroup.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Layers,
  Download,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import ProductGroupForm, {
  type ProductGroupFormData,
} from "../forms/ProductGroupForm";
import { toast } from "sonner";
import { CustomAlert } from "../custom_ui";

// Define type for product group
interface ProductGroup {
  id: number;
  name: string;
  description: string;
  productCount: number;
  status: "Active" | "Inactive";
}

export default function ProductGroup() {
  // State for product groups
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([
    {
      id: 1,
      name: "ELITE",
      description: "Premium product line",
      productCount: 45,
      status: "Active",
    },
    {
      id: 2,
      name: "PREMIUM",
      description: "High quality products",
      productCount: 32,
      status: "Active",
    },
    {
      id: 3,
      name: "STANDARD",
      description: "Regular product line",
      productCount: 67,
      status: "Active",
    },
    {
      id: 4,
      name: "BASIC",
      description: "Economy products",
      productCount: 23,
      status: "Inactive",
    },
    {
      id: 5,
      name: "SEASONAL",
      description: "Seasonal offerings",
      productCount: 12,
      status: "Active",
    },
  ]);

  // State for form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);

  // State for delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ProductGroup | null>(null);

  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Handle form save
  const handleSave = (data: ProductGroupFormData, id?: number) => {
    if (id) {
      // Update existing group
      setProductGroups((prev) =>
        prev.map((group) => (group.id === id ? { ...group, ...data } : group))
      );
    } else {
      // Add new group
      const newGroup: ProductGroup = {
        id: Math.max(...productGroups.map((g) => g.id)) + 1,
        ...data,
        productCount: 0,
        status: "Active",
      };
      setProductGroups((prev) => [...prev, newGroup]);
    }
  };

  // Handle edit
  const handleEdit = (group: ProductGroup) => {
    setEditingGroup(group);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingGroup(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (groupToDelete) {
      setProductGroups((prev) =>
        prev.filter((group) => group.id !== groupToDelete.id)
      );
      toast.success("Product group deleted successfully!");
      setGroupToDelete(null);
    }
  };

  // Confirm delete
  const confirmDelete = (group: ProductGroup) => {
    setGroupToDelete(group);
    setDeleteOpen(true);
  };

  // Filter product groups based on search
  const filteredGroups = productGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Product Groups
            </h2>
            <p className="text-muted-foreground">
              Organize products into categories for better management
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product Group
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search product groups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Product Groups Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>
                          {group.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {group.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {group.productCount} products
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            group.status === "Active" ? "default" : "secondary"
                          }
                          className={
                            group.status === "Active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {group.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(group)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No product groups found
                        </h3>
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? "Try adjusting your search terms"
                            : "Create your first product group to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Group Form Dialog */}
        <ProductGroupForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingGroup={editingGroup}
          onSave={handleSave}
        />

        {/* Delete Confirmation using CustomAlert */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Are you sure?"
          subText={
            groupToDelete
              ? `This action will delete the product group "${groupToDelete.name}". This action cannot be undone.`
              : "This action cannot be undone."
          }
          nextButtonText="Delete"
          cancelButtonText="Cancel"
          onNext={handleDelete}
          variant="destructive"
          showCancel={true}
          className="sm:max-w-[425px]"
        />
      </div>
    </motion.div>
  );
}

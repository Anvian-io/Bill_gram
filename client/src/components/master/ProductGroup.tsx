// import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Layers } from "lucide-react";
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

export default function ProductGroup() {
  // Sample data for product groups
  const productGroups = [
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
  ];

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
            <h2 className="text-xl font-semibold">Product Groups</h2>
            <p className="text-muted-foreground">
              Organize products into categories for better management
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product Group
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search product groups..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Layers className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
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
                {productGroups.map((group) => (
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
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Empty State */}
        {/* <div className="text-center py-12">
          <Layers className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No product groups found</h3>
          <p className="text-muted-foreground mb-4">
            Start by creating your first product group
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Product Group
          </Button>
        </div> */}
      </div>
    </motion.div>
  );
}

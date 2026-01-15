import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Ruler } from "lucide-react";
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

export default function Unit() {
  // Sample data for units
  const units = [
    { id: 1, name: "Piece", symbol: "pc", baseUnit: true, conversionFactor: 1 },
    {
      id: 2,
      name: "Kilogram",
      symbol: "kg",
      baseUnit: true,
      conversionFactor: 1,
    },
    {
      id: 3,
      name: "Gram",
      symbol: "g",
      baseUnit: false,
      conversionFactor: 0.001,
    },
    { id: 4, name: "Liter", symbol: "L", baseUnit: true, conversionFactor: 1 },
    {
      id: 5,
      name: "Milliliter",
      symbol: "ml",
      baseUnit: false,
      conversionFactor: 0.001,
    },
    { id: 6, name: "Meter", symbol: "m", baseUnit: true, conversionFactor: 1 },
    {
      id: 7,
      name: "Centimeter",
      symbol: "cm",
      baseUnit: false,
      conversionFactor: 0.01,
    },
    {
      id: 8,
      name: "Dozen",
      symbol: "doz",
      baseUnit: false,
      conversionFactor: 12,
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
            <h2 className="text-xl font-semibold">Units of Measurement</h2>
            <p className="text-muted-foreground">
              Manage measurement units for your products
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Unit
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search units..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Ruler className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Units Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Conversion Factor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                          <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        {unit.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-secondary rounded text-sm">
                        {unit.symbol}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={unit.baseUnit ? "default" : "outline"}
                        className={
                          unit.baseUnit
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        }
                      >
                        {unit.baseUnit ? "Base Unit" : "Derived Unit"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {unit.conversionFactor === 1
                        ? "1"
                        : unit.conversionFactor}
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

        {/* Unit Information Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ruler className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">About Units</h3>
                <p className="text-sm text-muted-foreground">
                  Base units are the fundamental measurement units. Derived
                  units are defined in relation to base units using conversion
                  factors. For example: 1 kg = 1000 g, so gram has a conversion
                  factor of 0.001.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// Updated Unit Component
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Ruler,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CustomAlert } from "@/components/custom_ui";
import UnitForm, { type UnitFormData } from "@/components/forms/UnitForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";

// Define type for unit
interface Unit {
  id: number;
  name: string;
  symbol: string;
  baseUnit: boolean;
  conversionFactor: number;
}

export default function Unit() {
  // State for units
  const [units, setUnits] = useState<Unit[]>([
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
    {
      id: 9,
      name: "Ton",
      symbol: "t",
      baseUnit: false,
      conversionFactor: 1000,
    },
    {
      id: 10,
      name: "Pound",
      symbol: "lb",
      baseUnit: false,
      conversionFactor: 0.453592,
    },
    {
      id: 11,
      name: "Ounce",
      symbol: "oz",
      baseUnit: false,
      conversionFactor: 0.0283495,
    },
    {
      id: 12,
      name: "Gallon",
      symbol: "gal",
      baseUnit: false,
      conversionFactor: 3.78541,
    },
    { id: 13, name: "Box", symbol: "box", baseUnit: true, conversionFactor: 1 },
    {
      id: 14,
      name: "Carton",
      symbol: "ctn",
      baseUnit: true,
      conversionFactor: 1,
    },
    { id: 15, name: "Pack", symbol: "pk", baseUnit: true, conversionFactor: 1 },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    symbol: "",
    baseUnit: "all" as "all" | "base" | "derived",
    minConversion: "",
    maxConversion: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter units
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !unit.name.toLowerCase().includes(searchLower) &&
        !unit.symbol.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !unit.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (
        filters.symbol &&
        !unit.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      )
        return false;
      if (filters.baseUnit !== "all") {
        const isBaseUnit = unit.baseUnit;
        if (filters.baseUnit === "base" && !isBaseUnit) return false;
        if (filters.baseUnit === "derived" && isBaseUnit) return false;
      }
      if (
        filters.minConversion &&
        unit.conversionFactor < Number(filters.minConversion)
      )
        return false;
      if (
        filters.maxConversion &&
        unit.conversionFactor > Number(filters.maxConversion)
      )
        return false;

      return true;
    });
  }, [units, filters]);

  // Paginated data
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUnits.slice(startIndex, endIndex);
  }, [filteredUnits, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUnits.length / itemsPerPage)
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Handle filter changes
  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      name: "",
      symbol: "",
      baseUnit: "all",
      minConversion: "",
      maxConversion: "",
    });
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: filterName === "baseUnit" ? "all" : "",
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = (data: UnitFormData, id?: number) => {
    if (id) {
      // Update existing unit
      setUnits((prev) =>
        prev.map((unit) =>
          unit.id === id
            ? {
                ...unit,
                ...data,
              }
            : unit
        )
      );
      toast.success("Unit updated successfully!");
    } else {
      // Add new unit
      const newUnit: Unit = {
        id: Math.max(...units.map((u) => u.id)) + 1,
        ...data,
      };
      setUnits((prev) => [...prev, newUnit]);
      toast.success("Unit created successfully!");
    }
    setFormOpen(false);
  };

  // Handle edit
  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingUnit(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (unitToDelete) {
      setUnits((prev) => prev.filter((unit) => unit.id !== unitToDelete.id));
      toast.success("Unit deleted successfully!");
      setUnitToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (unit: Unit) => {
    setUnitToDelete(unit);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredUnits.length);

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== "search" && value && value !== "all"
  ).length;

  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-heading">
                Units of Measurement
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage measurement units for your products
              </p>
            </div>

            {/* Search Bar */}
            <motion.div
              className="relative w-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="absolute left-3 top-6 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search units by name or symbol..."
                className="pl-10 py-6 text-base"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => handleFilterChange("search", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div className="flex flex-wrap items-center gap-3">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </motion.div>

              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </motion.div>

              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={handleAddNew}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Unit
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div className="mb-2" variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount} active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 text-muted-foreground"
                      >
                        Clear all
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-8"
                    >
                      {showFilters ? "Hide" : "Show"} Filters
                    </Button>
                  </div>
                </div>

                {/* Filter Controls */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                        {/* Unit Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="unitName"
                            className="text-sm font-medium"
                          >
                            Unit Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="unitName"
                              placeholder="Enter unit name"
                              value={filters.name}
                              onChange={(e) =>
                                handleFilterChange("name", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.name && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("name")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Symbol Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="symbol"
                            className="text-sm font-medium"
                          >
                            Symbol
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="symbol"
                              placeholder="Enter symbol"
                              value={filters.symbol}
                              onChange={(e) =>
                                handleFilterChange("symbol", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.symbol && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("symbol")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">
                            Type
                          </Label>
                          <Select
                            value={filters.baseUnit}
                            onValueChange={(
                              value: "all" | "base" | "derived"
                            ) => handleFilterChange("baseUnit", value)}
                          >
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="base">Base Units</SelectItem>
                              <SelectItem value="derived">
                                Derived Units
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Conversion Factor Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Conversion Factor Range
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              step="0.0001"
                              value={filters.minConversion}
                              onChange={(e) =>
                                handleFilterChange(
                                  "minConversion",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              step="0.0001"
                              value={filters.maxConversion}
                              onChange={(e) =>
                                handleFilterChange(
                                  "maxConversion",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {filteredUnits.length} units
            {filteredUnits.length !== units.length && " (filtered)"}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Units Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Unit Name</TableHead>
                      <TableHead className="font-semibold">Symbol</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold text-right">
                        Conversion Factor
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {paginatedUnits.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Ruler className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No units found matching your filters.</p>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="link"
                                  onClick={clearFilters}
                                  className="mt-2"
                                >
                                  Clear all filters
                                </Button>
                              </motion.div>
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      ) : (
                        paginatedUnits.map((unit, index) => (
                          <motion.tr
                            key={unit.id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            variants={rowVariants}
                            className="group border-1"
                            layout
                            transition={{
                              layout: { duration: 0.3 },
                            }}
                          >
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <motion.div
                                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20"
                                  whileHover={{ rotate: 5 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {unit.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {unit.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <code className="px-3 py-1.5 bg-secondary rounded-md text-sm font-mono">
                                  {unit.symbol}
                                </code>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant={
                                    unit.baseUnit ? "default" : "outline"
                                  }
                                  className={
                                    unit.baseUnit
                                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                                  }
                                >
                                  {unit.baseUnit ? "Base Unit" : "Derived Unit"}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="text-right group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant="outline"
                                  className="font-mono text-base"
                                >
                                  {unit.conversionFactor === 1
                                    ? "1"
                                    : unit.conversionFactor
                                        .toFixed(4)
                                        .replace(/\.?0+$/, "")}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="text-right group-hover:bg-secondary/30 cursor-pointer">
                              <div className="flex justify-end gap-2">
                                <motion.div
                                  variants={buttonVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(unit)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div
                                  variants={buttonVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDelete(unit)}
                                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Custom Pagination */}
        {filteredUnits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </motion.div>
        )}

        {/* Information Card */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Ruler className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    About Units of Measurement
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-green-600">
                        Base Units
                      </span>{" "}
                      are the fundamental measurement units that define the
                      scale for a particular type of measurement.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-blue-600">
                        Derived Units
                      </span>{" "}
                      are defined in relation to base units using conversion
                      factors. For example: 1 kilogram = 1000 grams, so gram has
                      a conversion factor of 0.001.
                    </p>
                    <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                      <p className="text-sm font-medium mb-1">Example:</p>
                      <p className="text-xs text-muted-foreground">
                        • Base Unit: Kilogram (kg) → Conversion Factor: 1<br />
                        • Derived Unit: Gram (g) → Conversion Factor: 0.001 (1 g
                        = 0.001 kg)
                        <br />• Derived Unit: Milligram (mg) → Conversion
                        Factor: 0.000001 (1 mg = 0.000001 kg)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Unit Form Dialog */}
        <UnitForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingUnit={editingUnit}
          onSave={handleSave}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Unit"
          subText={
            unitToDelete
              ? `Are you sure you want to delete "${unitToDelete.name} (${unitToDelete.symbol})"? This action cannot be undone.`
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

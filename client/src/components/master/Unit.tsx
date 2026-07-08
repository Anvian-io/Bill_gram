import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Plus,
  Edit,
  Trash2,
  Search,
  X,
  Ruler,
  RefreshCw,
  Trash,
  Eye,
  EyeOff,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
import { FilterStatusField } from "@/components/custom_ui/FilterStatusField";
import { motion, AnimatePresence } from "framer-motion";
import { ItemsPerPageSelect } from "@/components/custom_ui/ItemsPerPageSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { CustomAlert } from "@/components/custom_ui";
import UnitForm from "@/components/forms/UnitForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";
import { unitService } from "@/services/unitService";
import { type Unit, type UnitFormData } from "@/types/unit";
import { useDebounce } from "@/utils/debounce"; // Import the debounce hook

// Define the API response structure
interface UnitsResponse {
  data: {
    units: Unit[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export default function UnitComponent() {
  const { layoutMode } = useTheme();
  // State for units
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  // Bulk delete state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    symbol: "",
    status: "all" as "all" | "active" | "inactive",
    showDeleted: false,
  });

  // Local state for immediate input updates (to fix focus issue)
  const [localSearch, setLocalSearch] = useState("");
  const [localName, setLocalName] = useState("");
  const [localSymbol, setLocalSymbol] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);


  // Create debounced filter functions
  const debouncedSetSearchFilter = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetNameFilter = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, name: value }));
  }, 300);

  const debouncedSetSymbolFilter = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, symbol: value }));
  }, 300);

  // Handle search input with local state
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSetSearchFilter(value);
  };

  // Handle name filter input with local state
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalName(value);
    debouncedSetNameFilter(value);
  };

  // Handle symbol filter input with local state
  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSymbol(value);
    debouncedSetSymbolFilter(value);
  };

  // Safely handle units data
  const displayUnits = useMemo(() => {
    if (!units || !Array.isArray(units)) {
      return [];
    }
    return units;
  }, [units]);

  // Fetch units
  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add filters
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.name) {
        params.name = filters.name;
      }
      if (filters.symbol) {
        params.symbol = filters.symbol;
      }
      if (filters.status !== "all") {
        params.status = filters.status === "active";
      }
      if (filters.showDeleted) {
        params.showDeleted = "true";
      }

      const response = await unitService.getUnits(
        currentPage,
        itemsPerPage,
        params,
      );

      // Type the response as UnitsResponse
      const apiResponse = response as unknown as UnitsResponse;

      if (apiResponse?.data) {
        const unitsData = apiResponse.data.units || [];
        const pagination = apiResponse.data.pagination || {};

        setUnits(Array.isArray(unitsData) ? unitsData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setUnits([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching units:", error);
      toast.error("Failed to fetch units", {
        description: error.response?.data?.message || "Please try again later",
      });
      setUnits([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  // Initial fetch
  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Sync local states with filters when filters change externally
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setLocalName(filters.name);
  }, [filters.name]);

  useEffect(() => {
    setLocalSymbol(filters.symbol);
  }, [filters.symbol]);

  // Handle filter changes (for non-input filters)
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
      status: "all",
      showDeleted: false,
    });
    setLocalSearch("");
    setLocalName("");
    setLocalSymbol("");
  };

  // // Clear specific filter
  // const clearFilter = (filterName: keyof typeof filters) => {
  //   if (filterName === "search") {
  //     setLocalSearch("");
  //   } else if (filterName === "name") {
  //     setLocalName("");
  //   } else if (filterName === "symbol") {
  //     setLocalSymbol("");
  //   }

  //   setFilters((prev) => ({
  //     ...prev,
  //     [filterName]:
  //       filterName === "status"
  //         ? "all"
  //         : filterName === "showDeleted"
  //           ? false
  //           : "",
  //   }));
  // };

  // Clear search input
  const clearSearch = () => {
    setLocalSearch("");
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  // Clear name filter
  const clearName = () => {
    setLocalName("");
    setFilters((prev) => ({ ...prev, name: "" }));
  };

  // Clear symbol filter
  const clearSymbol = () => {
    setLocalSymbol("");
    setFilters((prev) => ({ ...prev, symbol: "" }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = async (data: UnitFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing unit
        await unitService.updateUnit(id, data);
        toast.success("Unit updated successfully!");
      } else {
        // Add new unit
        await unitService.createUnit(data);
        toast.success("Unit created successfully!");
      }
      void refreshActiveLists();
      setFormOpen(false);
      fetchUnits(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save unit", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
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
  const handleDelete = async () => {
    if (unitToDelete) {
      try {
        // console.log("Deleting unit with ID:", unitToDelete);
        await unitService.deleteUnit(unitToDelete.id);
        toast.success("Unit deleted successfully!");
        void refreshActiveLists();
        fetchUnits(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete unit", {
          description: error.response?.data?.message || "Please try again",
        });
      } finally {
        setUnitToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUnits.length === 0) {
      toast.warning("Please select units to delete");
      return;
    }

    try {
      const result = await unitService.bulkDeleteUnits(selectedUnits);
      toast.success(result.message);
      void refreshActiveLists();
      fetchUnits(); // Refresh the list
      setSelectedUnits([]);
      setBulkDeleteOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete units", {
        description: error.response?.data?.message || "Please try again",
      });
    }
  };

  // Confirm delete
  const confirmDelete = (unit: Unit) => {
    setUnitToDelete(unit);
    setDeleteOpen(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchUnits();
    toast.info("Refreshing data...");
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "search" &&
      key !== "name" &&
      key !== "symbol" &&
      ((key === "showDeleted" && value) || (value && value !== "all")),
  ).length;

  // Format date for display
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

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
                value={localSearch}
                onChange={handleSearchChange}
              />
              {localSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div className="flex flex-wrap items-center gap-3">
              {selectedUnits.length > 0 && (
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setBulkDeleteOpen(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedUnits.length})
                  </Button>
                </motion.div>
              )}

              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
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
                  disabled={isLoading}
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
              <div className="flex flex-col gap-4 p-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Unit Name Filter - FIXED: Now uses local state */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="unitName"
                              placeholder="Unit Name"
                              value={localName}
                              onChange={handleNameChange}
                              className="flex-1"
                            />
                            {localName && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={clearName}
                                disabled={isLoading}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Symbol Filter - FIXED: Now uses local state */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="symbol"
                              placeholder="Symbol"
                              value={localSymbol}
                              onChange={handleSymbolChange}
                              className="flex-1"
                            />
                            {localSymbol && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={clearSymbol}
                                disabled={isLoading}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <FilterStatusField
                            value={filters.status}
                            onValueChange={(value) =>
                              handleFilterChange("status", value)
                            }
                            disabled={isLoading}
                          />
                        </div>

                        {/* Show Deleted Filter */}
                        <div>
                          <div className="flex items-center gap-3">
                            <Switch
                              id="showDeleted"
                              checked={filters.showDeleted}
                              onCheckedChange={(checked) =>
                                handleFilterChange("showDeleted", checked)
                              }
                              disabled={isLoading}
                            />
                            <Label
                              htmlFor="showDeleted"
                              className={`text-sm cursor-pointer ${
                                filters.showDeleted
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {filters.showDeleted ? (
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Showing Deleted
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <EyeOff className="h-4 w-4" />
                                  Hide Deleted
                                </div>
                              )}
                            </Label>
                          </div>
                        </div>
                      </div>
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
            {/* {isLoading ? (
              "Loading..."
            ) :  */}
            (
            <>
              Showing {startIndex} to {endIndex} of {totalItems} units
              {filters.status !== "all" ||
              filters.name ||
              filters.symbol ||
              filters.search ||
              filters.showDeleted
                ? " (filtered)"
                : ""}
              {filters.showDeleted && " (including deleted)"}
            </>
            ){/* } */}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <ItemsPerPageSelect
              value={itemsPerPage}
              onChange={setItemsPerPage}
              disabled={isLoading}
            />
          </div>
        </motion.div>

        {/* Units Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Unit Name</TableHead>
                      <TableHead className="font-semibold">Symbol</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Info</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr
                          key="loading"
                          // initial={{ opacity: 0 }}
                          // animate={{ opacity: 1 }}
                          // exit={{ opacity: 0 }}
                          // transition={{ duration: 0.3 }}
                        >
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading units...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : displayUnits.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell
                            colSpan={6}
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
                        displayUnits.map((unit, index) => (
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
                                    {unit.deleted && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-xs"
                                      >
                                        <Trash className="h-3 w-3 mr-1" />
                                        Deleted
                                      </Badge>
                                    )}
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
                              <div className="flex items-center gap-2">
                                <motion.div
                                  variants={badgeVariants}
                                  whileHover="hover"
                                >
                                  <Badge
                                    variant={
                                      unit.status ? "default" : "secondary"
                                    }
                                    className={
                                      unit.status
                                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                    }
                                  >
                                    {unit.status ? "Active" : "Inactive"}
                                  </Badge>
                                </motion.div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-medium text-green-400">
                                      Created:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(unit.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(unit.updatedAt)}
                                  </p>
                                </div>
                              </div>
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
                                    disabled={unit.deleted}
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
                                    disabled={unit.deleted}
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
        {!isLoading && displayUnits.length > 0 && totalPages > 1 && (
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

        {/* Unit Form Dialog */}
        <UnitForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingUnit={editingUnit}
          onSave={handleSave}
          isSubmitting={isSubmitting}
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

        {/* Bulk Delete Confirmation */}
        <CustomAlert
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          mainText="Delete Selected Units"
          subText={`Are you sure you want to delete ${selectedUnits.length} unit(s)? This action cannot be undone.`}
          nextButtonText={`Delete ${selectedUnits.length} Units`}
          cancelButtonText="Cancel"
          onNext={handleBulkDelete}
          variant="destructive"
          showCancel={true}
          className="sm:max-w-[425px]"
        />
      </div>
    </motion.div>
  );
}

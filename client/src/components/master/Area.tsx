import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useMemo } from "react";
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
  MapPin,
  RefreshCw,
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
import AreaForm, { type AreaFormData } from "@/components/forms/AreaForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";
import { areaService } from "@/services/areaService";
import { type Area, type AreaFilters } from "@/types/area";
import { useDebounce } from "@/utils/debounce";

// Define the API response structure
interface AreasResponse {
  data: {
    areas: Area[];
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

export default function AreaComponent() {
  const { layoutMode } = useTheme();
  // State for areas
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AreaFilters>({
    search: "",
    name: "",
    state: "",
    region: "",
    city: "",
    status: "all",
    showDeleted: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);


  // Local state for immediate input values (before debounce)
  const [searchInput, setSearchInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [cityInput, setCityInput] = useState<string>("");
  const [stateInput, setStateInput] = useState<string>("");
  const [regionInput, setRegionInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, name: value }));
  }, 300);

  const debouncedSetCity = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, city: value }));
  }, 300);

  const debouncedSetState = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, state: value }));
  }, 300);

  const debouncedSetRegion = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, region: value }));
  }, 300);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  // Handle name input change with debounce
  const handleNameChange = (value: string) => {
    setNameInput(value);
    debouncedSetName(value);
  };

  // Handle city input change with debounce
  const handleCityChange = (value: string) => {
    setCityInput(value);
    debouncedSetCity(value);
  };

  // Handle state input change with debounce
  const handleStateChange = (value: string) => {
    setStateInput(value);
    debouncedSetState(value);
  };

  // Handle region input change with debounce
  const handleRegionChange = (value: string) => {
    setRegionInput(value);
    debouncedSetRegion(value);
  };

  // Safely handle areas data
  const displayAreas = useMemo(() => {
    if (!areas || !Array.isArray(areas)) {
      return [];
    }
    return areas;
  }, [areas]);

  // Fetch areas
  const fetchAreas = async () => {
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
      if (filters.state) {
        params.state = filters.state;
      }
      if (filters.region) {
        params.region = filters.region;
      }
      if (filters.city) {
        params.city = filters.city;
      }
      if (filters.status !== "all") {
        params.status = filters.status === "active";
      }
      if (filters.showDeleted) {
        params.showDeleted = "true";
      }

      const response = await areaService.getAreas(
        currentPage,
        itemsPerPage,
        params,
      );

      // Type the response as AreasResponse
      const apiResponse = response as unknown as AreasResponse;

      if (apiResponse?.data) {
        const areasData = apiResponse.data.areas || [];
        const pagination = apiResponse.data.pagination || {};

        setAreas(Array.isArray(areasData) ? areasData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setAreas([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching areas:", error);
      toast.error("Failed to fetch areas", {
        description: error.message || "Please try again later",
      });
      setAreas([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAreas();
  }, [currentPage, itemsPerPage, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Handle filter changes for non-text fields
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
      state: "",
      region: "",
      city: "",
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setNameInput("");
    setCityInput("");
    setStateInput("");
    setRegionInput("");
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "status"
          ? "all"
          : filterName === "showDeleted"
            ? false
            : "",
    }));

    // Also clear the corresponding input state
    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "name":
        setNameInput("");
        break;
      case "city":
        setCityInput("");
        break;
      case "state":
        setStateInput("");
        break;
      case "region":
        setRegionInput("");
        break;
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = async (data: AreaFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing area
        await areaService.updateArea(id, data);
        toast.success("Area updated successfully!");
      } else {
        // Add new area
        await areaService.createArea(data);
        toast.success("Area created successfully!");
      }
      void refreshActiveLists();
      setFormOpen(false);
      fetchAreas(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save area", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingArea(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (areaToDelete) {
      try {
        await areaService.deleteArea(areaToDelete.id);
        toast.success("Area deleted successfully!");
        void refreshActiveLists();
        fetchAreas(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete area", {
          description: error.message || "Please try again",
        });
      } finally {
        setAreaToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Confirm delete
  const confirmDelete = (area: Area) => {
    setAreaToDelete(area);
    setDeleteOpen(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchAreas();
    toast.info("Refreshing data...");
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "search" &&
      ((key === "showDeleted" && value) ||
        (value && value !== "all" && value !== "")),
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

  // Get status badge color
  const getStatusColor = (status: boolean) => {
    return status
      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
      : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
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
              <h1 className="text-3xl font-bold text-heading">Areas</h1>
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
                placeholder="Search areas by name, state, region, or city..."
                className="pl-10 py-6 text-base"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                // disabled={isLoading}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setSearchInput("");
                    handleFilterChange("search", "");
                  }}
                  disabled={isLoading}
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
                  Add Area
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
                        {/* Area Name Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="areaName"
                              placeholder="Area Name"
                              value={nameInput}
                              onChange={(e) => handleNameChange(e.target.value)}
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {nameInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setNameInput("");
                                  clearFilter("name");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* City Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="city"
                              placeholder="City"
                              value={cityInput}
                              onChange={(e) => handleCityChange(e.target.value)}
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {cityInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setCityInput("");
                                  clearFilter("city");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* State Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="state"
                              placeholder="State"
                              value={stateInput}
                              onChange={(e) =>
                                handleStateChange(e.target.value)
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {stateInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setStateInput("");
                                  clearFilter("state");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Region Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="region"
                              placeholder="Region"
                              value={regionInput}
                              onChange={(e) =>
                                handleRegionChange(e.target.value)
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {regionInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setRegionInput("");
                                  clearFilter("region");
                                }}
                                disabled={isLoading}
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
              Showing {startIndex} to {endIndex} of {totalItems} areas
              {filters.status !== "all" ||
              filters.name ||
              filters.state ||
              filters.region ||
              filters.city ||
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

        {/* Areas Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">
                        Area Details
                      </TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
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
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading areas...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : displayAreas.length === 0 ? (
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
                              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No areas found matching your filters.</p>
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
                        displayAreas.map((area, index) => (
                          <motion.tr
                            key={area.id}
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
                                  className="p-2 rounded-lg bg-primary/10"
                                  whileHover={{ rotate: 5 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <MapPin className="h-5 w-5 text-primary" />
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {area.name}
                                    {area.deleted && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-xs"
                                      >
                                        Deleted
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {area.description || "No description"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: {area.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                {area.city && (
                                  <div className="text-sm">{area.city}</div>
                                )}
                                {area.state && (
                                  <div className="text-sm text-muted-foreground">
                                    {area.state}
                                  </div>
                                )}
                                {area.region && (
                                  <div className="text-xs text-muted-foreground">
                                    Region: {area.region}
                                  </div>
                                )}
                                {area.pincode && (
                                  <div className="text-xs text-muted-foreground">
                                    Pincode: {area.pincode}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge className={getStatusColor(area.status)}>
                                  {area.status ? "Active" : "Inactive"}
                                </Badge>
                              </motion.div>
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
                                    {formatDateTime(area.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(area.updatedAt)}
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
                                    onClick={() => handleEdit(area)}
                                    className="h-8 w-8"
                                    disabled={area.deleted}
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
                                    onClick={() => confirmDelete(area)}
                                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    disabled={area.deleted}
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
        {!isLoading && displayAreas.length > 0 && totalPages > 1 && (
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

        {/* Area Form Dialog */}
        <AreaForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingArea={editingArea}
          onSave={handleSave}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Area"
          subText={
            areaToDelete
              ? `Are you sure you want to delete "${areaToDelete.name}"? This action cannot be undone.`
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

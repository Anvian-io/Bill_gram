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
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Users,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Eye,
  EyeOff,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CustomAlert } from "@/components/custom_ui";
import SalesmanForm, {
  type SalesmanFormData,
} from "@/components/forms/SalesmanForm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";
import { salesmanService } from "@/services/salesmanService";
import { type Salesman, type SalesmanFilters } from "@/types/salesman";
import { useDebounce } from "@/utils/debounce";

// Define the API response structure
interface SalesmenResponse {
  data: {
    salesmen: Salesman[];
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

export default function SalesmanComponent() {
  // State for salesmen
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [salesmanToDelete, setSalesmanToDelete] = useState<Salesman | null>(
    null,
  );

  // Filter state
  const [filters, setFilters] = useState<SalesmanFilters>({
    search: "",
    name: "",
    area: "",
    status: "all",
    showDeleted: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for immediate input values (before debounce)
  const [searchInput, setSearchInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [areaInput, setAreaInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, name: value }));
  }, 300);

  const debouncedSetArea = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, area: value }));
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

  // Handle area input change with debounce
  const handleAreaChange = (value: string) => {
    setAreaInput(value);
    debouncedSetArea(value);
  };

  // Safely handle salesmen data
  const displaySalesmen = useMemo(() => {
    if (!salesmen || !Array.isArray(salesmen)) {
      return [];
    }
    return salesmen;
  }, [salesmen]);

  // Fetch salesmen
  const fetchSalesmen = async () => {
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
      if (filters.area) {
        params.area = filters.area;
      }
      if (filters.status !== "all") {
        params.status = filters.status === "active";
      }
      if (filters.showDeleted) {
        params.showDeleted = "true";
      }

      const response = await salesmanService.getSalesmen(
        currentPage,
        itemsPerPage,
        params,
      );

      // Type the response as SalesmenResponse
      const apiResponse = response as unknown as SalesmenResponse;

      if (apiResponse?.data) {
        const salesmenData = apiResponse.data.salesmen || [];
        const pagination = apiResponse.data.pagination || {};

        setSalesmen(Array.isArray(salesmenData) ? salesmenData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setSalesmen([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching salesmen:", error);
      toast.error("Failed to fetch salesmen", {
        description: error.response?.data?.message || "Please try again later",
      });
      setSalesmen([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSalesmen();
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
      area: "",
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setNameInput("");
    setAreaInput("");
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
      case "area":
        setAreaInput("");
        break;
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = async (data: SalesmanFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing salesman
        await salesmanService.updateSalesman(id, data);
        toast.success("Salesman updated successfully!");
      } else {
        // Add new salesman
        await salesmanService.createSalesman(data);
        toast.success("Salesman created successfully!");
      }
      setFormOpen(false);
      fetchSalesmen(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save salesman", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (salesman: Salesman) => {
    setEditingSalesman(salesman);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingSalesman(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (salesmanToDelete) {
      try {
        await salesmanService.deleteSalesman(salesmanToDelete.id);
        toast.success("Salesman deleted successfully!");
        fetchSalesmen(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete salesman", {
          description: error.response?.data?.message || "Please try again",
        });
      } finally {
        setSalesmanToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Confirm delete
  const confirmDelete = (salesman: Salesman) => {
    setSalesmanToDelete(salesman);
    setDeleteOpen(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchSalesmen();
    toast.info("Refreshing data...");
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "search" &&
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

  // Get avatar initials
  const getAvatarInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate avatar color based on ID
  const getAvatarColor = (id: number) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-amber-500",
      "bg-cyan-500",
    ];
    return colors[id % colors.length];
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
                Sales Team Management
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
                placeholder="Search by name, phone, area, or email..."
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
                  Add Salesman
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
                        disabled={isLoading}
                      >
                        Clear all
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-8"
                      disabled={isLoading}
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
                        {/* Name Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="name"
                              placeholder="Enter name"
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

                        {/* Area Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="area" className="text-sm font-medium">
                            Area
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="area"
                              placeholder="Enter area"
                              value={areaInput}
                              onChange={(e) => handleAreaChange(e.target.value)}
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {areaInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setAreaInput("");
                                  clearFilter("area");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="status"
                            className="text-sm font-medium"
                          >
                            Status
                          </Label>
                          <Select
                            value={filters.status}
                            onValueChange={(
                              value: "all" | "active" | "inactive",
                            ) => handleFilterChange("status", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Show Deleted Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="showDeleted"
                            className="text-sm font-medium"
                          >
                            Show Deleted
                          </Label>
                          <div className="flex items-center gap-3 pt-2">
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
            {/* {isLoading ? (
              "Loading..."
            ) :  */}
            (
              <>
                Showing {startIndex} to {endIndex} of {totalItems} salesmen
                {filters.status !== "all" ||
                filters.name ||
                filters.area ||
                filters.search ||
                filters.showDeleted
                  ? " (filtered)"
                  : ""}
                {filters.showDeleted && " (including deleted)"}
              </>
            )
            {/* } */}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
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

        {/* Salesmen Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Salesman</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Area</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Info</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.tr
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading salesmen...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : displaySalesmen.length === 0 ? (
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
                              <Users className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No salesmen found matching your filters.</p>
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
                        displaySalesmen.map((salesman, index) => (
                          <motion.tr
                            key={salesman.id}
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
                                  className="relative"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <Avatar
                                    className={`h-10 w-10 ${getAvatarColor(salesman.id)}`}
                                  >
                                    <AvatarFallback className="text-white">
                                      {getAvatarInitials(salesman.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {salesman.name}
                                    {salesman.deleted && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-xs"
                                      >
                                        Deleted
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {salesman.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {salesman.phoneNo}
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {salesman.email || "No email"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge variant="outline" className="gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {salesman.area}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant={
                                    salesman.status ? "default" : "secondary"
                                  }
                                  className={
                                    salesman.status
                                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                  }
                                >
                                  {salesman.status ? "Active" : "Inactive"}
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
                                    {formatDateTime(salesman.createdAt)}
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
                                    onClick={() => handleEdit(salesman)}
                                    className="h-8 w-8"
                                    disabled={salesman.deleted}
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
                                    onClick={() => confirmDelete(salesman)}
                                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    disabled={salesman.deleted}
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
        {!isLoading && displaySalesmen.length > 0 && totalPages > 1 && (
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

        {/* Salesman Form Dialog */}
        <SalesmanForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingSalesman={editingSalesman}
          onSave={handleSave}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Salesman"
          subText={
            salesmanToDelete
              ? `Are you sure you want to delete "${salesmanToDelete.name}"? This action cannot be undone.`
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

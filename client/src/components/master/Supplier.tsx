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
  Building,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Eye,
  EyeOff,
  Receipt,
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
import SupplierForm, {
  type SupplierFormData,
} from "@/components/forms/SupplierForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supplierService } from "@/services/supplierService";
import { type Supplier, type SupplierFilters } from "@/types/supplier";
import { useDebounce } from "@/utils/debounce";

// Define the API response structure
interface SuppliersResponse {
  data: {
    suppliers: Supplier[];
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

export default function SupplierComponent() {
  const { layoutMode } = useTheme();
  // State for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );

  // Filter state
  const [filters, setFilters] = useState<SupplierFilters>({
    search: "",
    name: "",
    phoneNo: "",
    email: "",
    address: "",
    gstIN: "",
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
  const [phoneNoInput, setPhoneNoInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [addressInput, setAddressInput] = useState<string>("");
  const [gstINInput, setGstINInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, name: value }));
  }, 300);

  const debouncedSetPhoneNo = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, phoneNo: value }));
  }, 300);

  const debouncedSetEmail = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, email: value }));
  }, 300);

  const debouncedSetAddress = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, address: value }));
  }, 300);

  const debouncedSetGstIN = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, gstIN: value }));
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

  // Handle phone number input change with debounce
  const handlePhoneNoChange = (value: string) => {
    setPhoneNoInput(value);
    debouncedSetPhoneNo(value);
  };

  // Handle email input change with debounce
  const handleEmailChange = (value: string) => {
    setEmailInput(value);
    debouncedSetEmail(value);
  };

  // Handle address input change with debounce
  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    debouncedSetAddress(value);
  };

  // Handle GSTIN input change with debounce
  const handleGstINChange = (value: string) => {
    setGstINInput(value);
    debouncedSetGstIN(value);
  };

  // Safely handle suppliers data
  const displaySuppliers = useMemo(() => {
    if (!suppliers || !Array.isArray(suppliers)) {
      return [];
    }
    return suppliers;
  }, [suppliers]);

  // Fetch suppliers
  const fetchSuppliers = async () => {
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
      if (filters.phoneNo) {
        params.phoneNo = filters.phoneNo;
      }
      if (filters.email) {
        params.email = filters.email;
      }
      if (filters.address) {
        params.address = filters.address;
      }
      if (filters.gstIN) {
        params.gstIN = filters.gstIN;
      }
      if (filters.status !== "all") {
        params.status = filters.status === "active";
      }
      if (filters.showDeleted) {
        params.showDeleted = "true";
      }

      const response = await supplierService.getSuppliers(
        currentPage,
        itemsPerPage,
        params,
      );

      // Type the response as SuppliersResponse
      const apiResponse = response as unknown as SuppliersResponse;

      if (apiResponse?.data) {
        const suppliersData = apiResponse.data.suppliers || [];
        const pagination = apiResponse.data.pagination || {};

        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setSuppliers([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers", {
        description: error.response?.data?.message || "Please try again later",
      });
      setSuppliers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
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
      phoneNo: "",
      email: "",
      address: "",
      gstIN: "",
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setNameInput("");
    setPhoneNoInput("");
    setEmailInput("");
    setAddressInput("");
    setGstINInput("");
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
      case "phoneNo":
        setPhoneNoInput("");
        break;
      case "email":
        setEmailInput("");
        break;
      case "address":
        setAddressInput("");
        break;
      case "gstIN":
        setGstINInput("");
        break;
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = async (data: SupplierFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing supplier
        await supplierService.updateSupplier(id, data);
        toast.success("Supplier updated successfully!");
      } else {
        // Add new supplier
        await supplierService.createSupplier(data);
        toast.success("Supplier created successfully!");
      }
      void refreshActiveLists();
      setFormOpen(false);
      fetchSuppliers(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save supplier", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingSupplier(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (supplierToDelete) {
      try {
        await supplierService.deleteSupplier(supplierToDelete.id);
        toast.success("Supplier deleted successfully!");
        void refreshActiveLists();
        fetchSuppliers(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete supplier", {
          description: error.response?.data?.message || "Please try again",
        });
      } finally {
        setSupplierToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Confirm delete
  const confirmDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteOpen(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchSuppliers();
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

  // Get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
              <h1 className="text-3xl font-bold text-heading">Suppliers</h1>
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
                placeholder="Search by name, phone, email, address, or GSTIN..."
                className="pl-10 py-6 text-base"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
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
                  Add Supplier
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Name Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="name"
                              placeholder="Supplier Name"
                              value={nameInput}
                              onChange={(e) => handleNameChange(e.target.value)}
                              className="flex-1"
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

                        {/* Phone Number Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="phoneNo"
                              placeholder="Phone Number"
                              value={phoneNoInput}
                              onChange={(e) =>
                                handlePhoneNoChange(e.target.value)
                              }
                              className="flex-1"
                            />
                            {phoneNoInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setPhoneNoInput("");
                                  clearFilter("phoneNo");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Email Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="email"
                              placeholder="Email Address"
                              value={emailInput}
                              onChange={(e) =>
                                handleEmailChange(e.target.value)
                              }
                              className="flex-1"
                            />
                            {emailInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setEmailInput("");
                                  clearFilter("email");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Address Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="address"
                              placeholder="Address"
                              value={addressInput}
                              onChange={(e) =>
                                handleAddressChange(e.target.value)
                              }
                              className="flex-1"
                            />
                            {addressInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setAddressInput("");
                                  clearFilter("address");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* GSTIN Filter */}
                        <div>
                          <div className="flex gap-2">
                            <Input
                              id="gstIN"
                              placeholder="GSTIN"
                              value={gstINInput}
                              onChange={(e) =>
                                handleGstINChange(e.target.value)
                              }
                              className="flex-1"
                            />
                            {gstINInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setGstINInput("");
                                  clearFilter("gstIN");
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
            {isLoading
              ? "Loading..."
              : `Showing ${startIndex} to ${endIndex} of ${totalItems} suppliers${
                  filters.status !== "all" ||
                  filters.name ||
                  filters.phoneNo ||
                  filters.email ||
                  filters.address ||
                  filters.gstIN ||
                  filters.search ||
                  filters.showDeleted
                    ? " (filtered)"
                    : ""
                }${filters.showDeleted && " (including deleted)"}`}
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

        {/* Suppliers Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Supplier</TableHead>
                      <TableHead className="font-semibold">
                        Contact Info
                      </TableHead>
                      <TableHead className="font-semibold">Address</TableHead>
                      <TableHead className="font-semibold">GSTIN</TableHead>
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
                        <motion.tr key="loading">
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading suppliers...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : displaySuppliers.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Building className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No suppliers found matching your filters.</p>
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
                        displaySuppliers.map((supplier, index) => (
                          <motion.tr
                            key={supplier.id}
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
                                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(supplier.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {supplier.name}
                                    {supplier.deleted && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-xs"
                                      >
                                        Deleted
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: {supplier.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {supplier.phoneNo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate">
                                    {supplier.email || "No email"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {supplier.address || "No address"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm font-mono">
                                  {supplier.gstIN || "Not provided"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  className={getStatusColor(supplier.status)}
                                >
                                  {supplier.status ? "Active" : "Inactive"}
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
                                    {formatDateTime(supplier.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(supplier.updatedAt)}
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
                                    onClick={() => handleEdit(supplier)}
                                    className="h-8 w-8"
                                    disabled={supplier.deleted}
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
                                    onClick={() => confirmDelete(supplier)}
                                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    disabled={supplier.deleted}
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
        {!isLoading && displaySuppliers.length > 0 && totalPages > 1 && (
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

        {/* Supplier Form Dialog */}
        <SupplierForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingSupplier={editingSupplier}
          onSave={handleSave}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Supplier"
          subText={
            supplierToDelete
              ? `Are you sure you want to delete "${supplierToDelete.name}"? This action cannot be undone.`
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

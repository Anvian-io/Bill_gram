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
  UserCircle,
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
import CustomerForm, {
  type CustomerFormData,
} from "@/components/forms/CustomerForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { customerService } from "@/services/customerService";
import { type Customer, type CustomerFilters } from "@/types/customer";

// Define the API response structure
interface CustomersResponse {
  data: {
    customers: Customer[];
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

// Customer type options
// const customerTypeOptions = [
//   "Retail Store",
//   "Supermarket",
//   "Hypermarket",
//   "Chain Store",
//   "Kirana",
//   "Distributor",
//   "Wholesaler",
//   "Corporate",
//   "Online Store",
//   "Other",
// ];

export default function CustomerComponent() {
  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  // Filter state
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    companyName: "",
    personName: "",
    phoneNo: "",
    city: "",
    customerType: "",
    status: "all",
    showDeleted: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Safely handle customers data
  const displayCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) {
      return [];
    }
    return customers;
  }, [customers]);

  // Fetch customers
  const fetchCustomers = async () => {
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
      if (filters.companyName) {
        params.companyName = filters.companyName;
      }
      if (filters.personName) {
        params.personName = filters.personName;
      }
      if (filters.phoneNo) {
        params.phoneNo = filters.phoneNo;
      }
      if (filters.city) {
        params.city = filters.city;
      }
      if (filters.customerType) {
        params.customerType = filters.customerType;
      }
      if (filters.status !== "all") {
        params.status = filters.status === "active";
      }
      if (filters.showDeleted) {
        params.showDeleted = "true";
      }

      const response = await customerService.getCustomers(
        currentPage,
        itemsPerPage,
        params,
      );

      // Type the response as CustomersResponse
      const apiResponse = response as unknown as CustomersResponse;

      if (apiResponse?.data) {
        const customersData = apiResponse.data.customers || [];
        const pagination = apiResponse.data.pagination || {};

        setCustomers(Array.isArray(customersData) ? customersData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setCustomers([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers", {
        description: error.response?.data?.message || "Please try again later",
      });
      setCustomers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, itemsPerPage, filters]);

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
      companyName: "",
      personName: "",
      phoneNo: "",
      city: "",
      customerType: "",
      status: "all",
      showDeleted: false,
    });
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
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = async (data: CustomerFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing customer
        await customerService.updateCustomer(id, data);
        toast.success("Customer updated successfully!");
      } else {
        // Add new customer
        await customerService.createCustomer(data);
        toast.success("Customer created successfully!");
      }
      setFormOpen(false);
      fetchCustomers(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save customer", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (customerToDelete) {
      try {
        await customerService.deleteCustomer(customerToDelete.id);
        toast.success("Customer deleted successfully!");
        fetchCustomers(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete customer", {
          description: error.response?.data?.message || "Please try again",
        });
      } finally {
        setCustomerToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Confirm delete
  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteOpen(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchCustomers();
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

  // Get type badge color
  const getTypeColor = (type: string | null) => {
    if (!type)
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";

    const typeLower = type.toLowerCase();
    if (typeLower.includes("retail"))
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
    if (typeLower.includes("supermarket"))
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400";
    if (typeLower.includes("hypermarket"))
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400";
    if (typeLower.includes("chain"))
      return "bg-pink-100 text-pink-800 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400";
    if (typeLower.includes("kirana"))
      return "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400";
    if (typeLower.includes("distributor") || typeLower.includes("wholesaler"))
      return "bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400";
    if (typeLower.includes("corporate"))
      return "bg-cyan-100 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400";
    return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
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
              <h1 className="text-3xl font-bold text-heading">Customers</h1>
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
                placeholder="Search by company name, person, phone, or city..."
                className="pl-10 py-6 text-base"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                // disabled={isLoading}
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => handleFilterChange("search", "")}
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
                  Add Customer
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
                        {/* Company Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="companyName"
                            className="text-sm font-medium"
                          >
                            Company Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="companyName"
                              placeholder="Enter company name"
                              value={filters.companyName}
                              onChange={(e) =>
                                handleFilterChange(
                                  "companyName",
                                  e.target.value,
                                )
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {filters.companyName && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("companyName")}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Person Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="personName"
                            className="text-sm font-medium"
                          >
                            Contact Person
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="personName"
                              placeholder="Enter person name"
                              value={filters.personName}
                              onChange={(e) =>
                                handleFilterChange("personName", e.target.value)
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {filters.personName && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("personName")}
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
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                Showing {startIndex} to {endIndex} of {totalItems} customers
                {filters.status !== "all" ||
                filters.companyName ||
                filters.personName ||
                filters.phoneNo ||
                filters.city ||
                filters.customerType ||
                filters.search ||
                filters.showDeleted
                  ? " (filtered)"
                  : ""}
                {filters.showDeleted && " (including deleted)"}
              </>
            )}
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

        {/* Customers Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">
                        Contact Info
                      </TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Address</TableHead>
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
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading customers...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : displayCustomers.length === 0 ? (
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
                              <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No customers found matching your filters.</p>
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
                        displayCustomers.map((customer, index) => (
                          <motion.tr
                            key={customer.id}
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
                                      {getInitials(customer.companyName)}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {customer.companyName}
                                    {customer.deleted && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-xs"
                                      >
                                        Deleted
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {customer.personName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: {customer.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {customer.phoneNo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate">
                                    {customer.email || "No email"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  className={getTypeColor(
                                    customer.customerType,
                                  )}
                                >
                                  {customer.customerType || "Not Specified"}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {customer.address}
                                  </span>
                                </div>
                                {customer.city && (
                                  <p className="text-xs text-muted-foreground">
                                    {customer.city}
                                    {customer.pincode &&
                                      ` - ${customer.pincode}`}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  className={getStatusColor(customer.status)}
                                >
                                  {customer.status ? "Active" : "Inactive"}
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
                                    {formatDateTime(customer.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(customer.updatedAt)}
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
                                    onClick={() => handleEdit(customer)}
                                    className="h-8 w-8"
                                    disabled={customer.deleted}
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
                                    onClick={() => confirmDelete(customer)}
                                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    disabled={customer.deleted}
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
        {!isLoading && displayCustomers.length > 0 && totalPages > 1 && (
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

        {/* Customer Form Dialog */}
        <CustomerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingCustomer={editingCustomer}
          onSave={handleSave}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Customer"
          subText={
            customerToDelete
              ? `Are you sure you want to delete "${customerToDelete.companyName}"? This action cannot be undone.`
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

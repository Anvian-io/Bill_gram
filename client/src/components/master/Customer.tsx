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
  Check,
  ChevronsUpDown,
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
import { useDebounce } from "@/utils/debounce";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

export default function CustomerComponent() {
  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get areas from hook
  const { areas } = useActiveLists();

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
    areaId: "all",
    customerType: "",
    status: "all",
    showDeleted: false,
  });

  // State for Command dropdowns
  const [areaOpen, setAreaOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for immediate input values (before debounce)
  const [searchInput, setSearchInput] = useState<string>("");
  const [companyNameInput, setCompanyNameInput] = useState<string>("");
  const [personNameInput, setPersonNameInput] = useState<string>("");
  const [phoneNoInput, setPhoneNoInput] = useState<string>("");
  const [cityInput, setCityInput] = useState<string>("");
  const [customerTypeInput, setCustomerTypeInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetCompanyName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, companyName: value }));
  }, 300);

  const debouncedSetPersonName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, personName: value }));
  }, 300);

  const debouncedSetPhoneNo = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, phoneNo: value }));
  }, 300);

  const debouncedSetCity = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, city: value }));
  }, 300);

  const debouncedSetCustomerType = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, customerType: value }));
  }, 300);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  // Handle company name input change with debounce
  const handleCompanyNameChange = (value: string) => {
    setCompanyNameInput(value);
    debouncedSetCompanyName(value);
  };

  // Handle person name input change with debounce
  const handlePersonNameChange = (value: string) => {
    setPersonNameInput(value);
    debouncedSetPersonName(value);
  };

  // Handle phone number input change with debounce
  const handlePhoneNoChange = (value: string) => {
    setPhoneNoInput(value);
    debouncedSetPhoneNo(value);
  };

  // Handle city input change with debounce
  const handleCityChange = (value: string) => {
    setCityInput(value);
    debouncedSetCity(value);
  };

  // Handle customer type input change with debounce
  const handleCustomerTypeChange = (value: string) => {
    setCustomerTypeInput(value);
    debouncedSetCustomerType(value);
  };

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
      if (filters.areaId && filters.areaId !== "all") {
        params.areaId = parseInt(filters.areaId);
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
        description: error.message || "Please try again later",
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
      companyName: "",
      personName: "",
      phoneNo: "",
      city: "",
      areaId: "all",
      customerType: "",
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setCompanyNameInput("");
    setPersonNameInput("");
    setPhoneNoInput("");
    setCityInput("");
    setCustomerTypeInput("");
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
            : filterName === "areaId"
              ? "all"
              : "",
    }));

    // Also clear the corresponding input state
    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "companyName":
        setCompanyNameInput("");
        break;
      case "personName":
        setPersonNameInput("");
        break;
      case "phoneNo":
        setPhoneNoInput("");
        break;
      case "city":
        setCityInput("");
        break;
      case "customerType":
        setCustomerTypeInput("");
        break;
    }
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
        description: error.message || "Please try again",
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
          description: error.message || "Please try again",
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

  // Get area name helper
  const getAreaName = (id: string) => {
    if (id === "all") return "All Areas";
    const area = areas.find((a) => a.id.toString() === id);
    return area ? area.name : "Select Area";
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
                              value={companyNameInput}
                              onChange={(e) =>
                                handleCompanyNameChange(e.target.value)
                              }
                              className="flex-1"
                              disabled={isLoading}
                            />
                            {companyNameInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setCompanyNameInput("");
                                  clearFilter("companyName");
                                }}
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
                              value={personNameInput}
                              onChange={(e) =>
                                handlePersonNameChange(e.target.value)
                              }
                              className="flex-1"
                            />
                            {personNameInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setPersonNameInput("");
                                  clearFilter("personName");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Phone Number Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="phoneNo"
                            className="text-sm font-medium"
                          >
                            Phone Number
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="phoneNo"
                              placeholder="Enter phone number"
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

                        {/* City Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium">
                            City
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="city"
                              placeholder="Enter city"
                              value={cityInput}
                              onChange={(e) => handleCityChange(e.target.value)}
                              className="flex-1"
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

                        {/* Area Filter - Command Dropdown */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Area</Label>
                          <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={areaOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getAreaName(filters.areaId as string)}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search area..." />
                                <CommandList>
                                  <CommandEmpty>No area found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange("areaId", "all");
                                        setAreaOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          filters.areaId === "all"
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      All Areas
                                    </CommandItem>
                                    {areas.map((area) => (
                                      <CommandItem
                                        key={area.id}
                                        value={area.id.toString()}
                                        onSelect={() => {
                                          handleFilterChange(
                                            "areaId",
                                            area.id.toString(),
                                          );
                                          setAreaOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.areaId ===
                                              area.id.toString()
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {area.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Customer Type Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="customerType"
                            className="text-sm font-medium"
                          >
                            Customer Type
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="customerType"
                              placeholder="Enter customer type"
                              value={customerTypeInput}
                              onChange={(e) =>
                                handleCustomerTypeChange(e.target.value)
                              }
                              className="flex-1"
                            />
                            {customerTypeInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setCustomerTypeInput("");
                                  clearFilter("customerType");
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
            Showing {startIndex} to {endIndex} of {totalItems} customers
            {filters.status !== "all" ||
            filters.companyName ||
            filters.personName ||
            filters.phoneNo ||
            filters.city ||
            filters.areaId !== "all" ||
            filters.customerType ||
            filters.search ||
            filters.showDeleted
              ? " (filtered)"
              : ""}
            {filters.showDeleted && " (including deleted)"}
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
                      <TableHead className="font-semibold">Area</TableHead>
                      <TableHead className="font-semibold">Address</TableHead>
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
                          <TableCell colSpan={8} className="text-center py-12">
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
                            colSpan={8}
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
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge variant="outline" className="gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {areas.find((a) => a.id === customer.areaId)
                                    ?.name || "N/A"}
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

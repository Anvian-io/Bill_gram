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
  UserCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define type for customer
interface Customer {
  id: number;
  name: string;
  code: string;
  type:
    | "Retail Store"
    | "Supermarket"
    | "Hypermarket"
    | "Chain Store"
    | "Kirana"
    | "Distributor";
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  creditLimit: number;
  outstandingBalance: number;
  creditUsedPercentage: number;
  salesman: string;
  status: "Active" | "Inactive" | "Credit Hold" | "Blocked";
  createdAt: string;
  updatedAt: string;
}

export default function Customer() {
  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      name: "Reliance Fresh",
      code: "CUST001",
      type: "Retail Store",
      contactPerson: "Mr. Sharma",
      mobile: "+91 9876543210",
      email: "orders@reliance.com",
      address: "Shop No. 12, Ground Floor",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      creditLimit: 500000,
      outstandingBalance: 125000,
      creditUsedPercentage: 25,
      salesman: "Rajesh Kumar",
      status: "Active",
      createdAt: "2024-01-15 09:30:00",
      updatedAt: "2024-03-20 14:45:00",
    },
    {
      id: 2,
      name: "Big Bazaar",
      code: "CUST002",
      type: "Supermarket",
      contactPerson: "Ms. Gupta",
      mobile: "+91 8765432109",
      email: "purchase@bigbazaar.com",
      address: "Rajouri Garden, Main Road",
      city: "Delhi",
      state: "Delhi",
      pincode: "110027",
      creditLimit: 1000000,
      outstandingBalance: 325000,
      creditUsedPercentage: 32.5,
      salesman: "Priya Sharma",
      status: "Active",
      createdAt: "2024-02-10 11:20:00",
      updatedAt: "2024-03-18 10:15:00",
    },
    {
      id: 3,
      name: "More Retail",
      code: "CUST003",
      type: "Hypermarket",
      contactPerson: "Mr. Reddy",
      mobile: "+91 7654321098",
      email: "vendor@more.com",
      address: "Saket, DLF Mall",
      city: "Delhi",
      state: "Delhi",
      pincode: "110017",
      creditLimit: 750000,
      outstandingBalance: 0,
      creditUsedPercentage: 0,
      salesman: "Amit Patel",
      status: "Active",
      createdAt: "2024-01-05 08:45:00",
      updatedAt: "2024-03-22 16:30:00",
    },
    {
      id: 4,
      name: "DMart",
      code: "CUST004",
      type: "Chain Store",
      contactPerson: "Mr. Patel",
      mobile: "+91 6543210987",
      email: "suppliers@dmart.com",
      address: "Sector 12, Dwarka",
      city: "Delhi",
      state: "Delhi",
      pincode: "110078",
      creditLimit: 2000000,
      outstandingBalance: 850000,
      creditUsedPercentage: 42.5,
      salesman: "Sneha Reddy",
      status: "Credit Hold",
      createdAt: "2023-12-20 13:10:00",
      updatedAt: "2024-02-28 09:25:00",
    },
    {
      id: 5,
      name: "Local Kirana Store",
      code: "CUST005",
      type: "Kirana",
      contactPerson: "Mr. Singh",
      mobile: "+91 5432109876",
      email: "kirana@local.com",
      address: "Gali No. 5, Karol Bagh",
      city: "Delhi",
      state: "Delhi",
      pincode: "110005",
      creditLimit: 100000,
      outstandingBalance: 25000,
      creditUsedPercentage: 25,
      salesman: "Vikram Singh",
      status: "Active",
      createdAt: "2024-03-01 10:00:00",
      updatedAt: "2024-03-15 11:45:00",
    },
    {
      id: 6,
      name: "Metro Cash & Carry",
      code: "CUST006",
      type: "Hypermarket",
      contactPerson: "Ms. Verma",
      mobile: "+91 4321098765",
      email: "procurement@metro.com",
      address: "Sector 18, Noida",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      creditLimit: 1500000,
      outstandingBalance: 450000,
      creditUsedPercentage: 30,
      salesman: "Rajesh Kumar",
      status: "Active",
      createdAt: "2024-02-28 15:30:00",
      updatedAt: "2024-03-10 14:20:00",
    },
    {
      id: 7,
      name: "Spencer's Retail",
      code: "CUST007",
      type: "Supermarket",
      contactPerson: "Mr. Joshi",
      mobile: "+91 3210987654",
      email: "vendors@spencers.com",
      address: "MG Road, Gurgaon",
      city: "Gurgaon",
      state: "Haryana",
      pincode: "122002",
      creditLimit: 800000,
      outstandingBalance: 200000,
      creditUsedPercentage: 25,
      salesman: "Priya Sharma",
      status: "Active",
      createdAt: "2024-01-25 12:15:00",
      updatedAt: "2024-03-19 13:40:00",
    },
    {
      id: 8,
      name: "Star Distributors",
      code: "CUST008",
      type: "Distributor",
      contactPerson: "Mr. Agarwal",
      mobile: "+91 2109876543",
      email: "info@stardist.com",
      address: "Industrial Area, Faridabad",
      city: "Faridabad",
      state: "Haryana",
      pincode: "121003",
      creditLimit: 3000000,
      outstandingBalance: 1200000,
      creditUsedPercentage: 40,
      salesman: "Amit Patel",
      status: "Credit Hold",
      createdAt: "2024-03-10 09:00:00",
      updatedAt: "2024-03-21 15:10:00",
    },
    {
      id: 9,
      name: "Easy Day Store",
      code: "CUST009",
      type: "Retail Store",
      contactPerson: "Ms. Kapoor",
      mobile: "+91 1098765432",
      email: "store@easyday.com",
      address: "Sector 22, Chandigarh",
      city: "Chandigarh",
      state: "Chandigarh",
      pincode: "160022",
      creditLimit: 600000,
      outstandingBalance: 180000,
      creditUsedPercentage: 30,
      salesman: "Sneha Reddy",
      status: "Active",
      createdAt: "2023-11-15 14:20:00",
      updatedAt: "2024-01-30 10:55:00",
    },
    {
      id: 10,
      name: "Best Buy Mart",
      code: "CUST010",
      type: "Kirana",
      contactPerson: "Mr. Tiwari",
      mobile: "+91 0987654321",
      email: "contact@bestbuymart.com",
      address: "Lajpat Nagar, Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110024",
      creditLimit: 150000,
      outstandingBalance: 75000,
      creditUsedPercentage: 50,
      salesman: "Vikram Singh",
      status: "Blocked",
      createdAt: "2024-01-12 08:30:00",
      updatedAt: "2024-03-23 17:05:00",
    },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    type: "all" as "all" | Customer["type"],
    status: "all" as "all" | Customer["status"],
    minCreditLimit: "",
    maxCreditLimit: "",
    city: "",
    salesman: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !customer.name.toLowerCase().includes(searchLower) &&
        !customer.code.toLowerCase().includes(searchLower) &&
        !customer.contactPerson.toLowerCase().includes(searchLower) &&
        !customer.mobile.includes(filters.search)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !customer.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (filters.type !== "all" && customer.type !== filters.type)
        return false;
      if (filters.status !== "all" && customer.status !== filters.status)
        return false;
      if (
        filters.minCreditLimit &&
        customer.creditLimit < Number(filters.minCreditLimit)
      )
        return false;
      if (
        filters.maxCreditLimit &&
        customer.creditLimit > Number(filters.maxCreditLimit)
      )
        return false;
      if (
        filters.city &&
        !customer.city.toLowerCase().includes(filters.city.toLowerCase())
      )
        return false;
      if (
        filters.salesman &&
        !customer.salesman
          .toLowerCase()
          .includes(filters.salesman.toLowerCase())
      )
        return false;

      return true;
    });
  }, [customers, filters]);

  // Paginated data
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / itemsPerPage)
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
      type: "all",
      status: "all",
      minCreditLimit: "",
      maxCreditLimit: "",
      city: "",
      salesman: "",
    });
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "type" || filterName === "status" ? "all" : "",
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = (data: CustomerFormData, id?: number) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Calculate credit used percentage
    const creditUsedPercentage = data.outstandingBalance
      ? (data.outstandingBalance / data.creditLimit) * 100
      : 0;

    if (id) {
      // Update existing customer
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? {
                ...customer,
                ...data,
                creditUsedPercentage,
                updatedAt: now,
              }
            : customer
        )
      );
      toast.success("Customer updated successfully!");
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: Math.max(...customers.map((c) => c.id)) + 1,
        code: `CUST${String(
          Math.max(
            ...customers.map((c) => parseInt(c.code.replace("CUST", "")))
          ) + 1
        ).padStart(3, "0")}`,
        ...data,
        creditUsedPercentage,
        status: "Active" as Customer["status"],
        createdAt: now,
        updatedAt: now,
      };
      setCustomers((prev) => [...prev, newCustomer]);
      toast.success("Customer created successfully!");
    }
    setFormOpen(false);
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
  const handleDelete = () => {
    if (customerToDelete) {
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerToDelete.id)
      );
      toast.success("Customer deleted successfully!");
      setCustomerToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredCustomers.length
  );

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== "search" && value && value !== "all"
  ).length;

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get status badge color
  const getStatusColor = (status: Customer["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
      case "Credit Hold":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Blocked":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get type badge color
  const getTypeColor = (type: Customer["type"]) => {
    switch (type) {
      case "Retail Store":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
      case "Supermarket":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400";
      case "Hypermarket":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400";
      case "Chain Store":
        return "bg-pink-100 text-pink-800 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400";
      case "Kirana":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400";
      case "Distributor":
        return "bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(
      (c) => c.status === "Active"
    ).length;
    const totalCreditLimit = customers.reduce(
      (sum, c) => sum + c.creditLimit,
      0
    );
    const totalOutstanding = customers.reduce(
      (sum, c) => sum + c.outstandingBalance,
      0
    );
    const avgCreditLimit =
      totalCustomers > 0 ? totalCreditLimit / totalCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      totalCreditLimit,
      totalOutstanding,
      avgCreditLimit,
    };
  }, [customers]);

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
                placeholder="Search customers by name, code, or contact..."
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
                        {/* Customer Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="customerName"
                            className="text-sm font-medium"
                          >
                            Customer Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="customerName"
                              placeholder="Enter customer name"
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

                        {/* Type Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">
                            Type
                          </Label>
                          <Select
                            value={filters.type}
                            onValueChange={(value: "all" | Customer["type"]) =>
                              handleFilterChange("type", value)
                            }
                          >
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="Retail Store">
                                Retail Store
                              </SelectItem>
                              <SelectItem value="Supermarket">
                                Supermarket
                              </SelectItem>
                              <SelectItem value="Hypermarket">
                                Hypermarket
                              </SelectItem>
                              <SelectItem value="Chain Store">
                                Chain Store
                              </SelectItem>
                              <SelectItem value="Kirana">Kirana</SelectItem>
                              <SelectItem value="Distributor">
                                Distributor
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                              value: "all" | Customer["status"]
                            ) => handleFilterChange("status", value)}
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Credit Hold">
                                Credit Hold
                              </SelectItem>
                              <SelectItem value="Blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Credit Limit Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Credit Limit Range (₹)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={filters.minCreditLimit}
                              onChange={(e) =>
                                handleFilterChange(
                                  "minCreditLimit",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={filters.maxCreditLimit}
                              onChange={(e) =>
                                handleFilterChange(
                                  "maxCreditLimit",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
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
                              value={filters.city}
                              onChange={(e) =>
                                handleFilterChange("city", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.city && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("city")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Salesman Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="salesman"
                            className="text-sm font-medium"
                          >
                            Salesman
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="salesman"
                              placeholder="Enter salesman name"
                              value={filters.salesman}
                              onChange={(e) =>
                                handleFilterChange("salesman", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.salesman && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("salesman")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
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
            Showing {startIndex} to {endIndex} of {filteredCustomers.length}{" "}
            customers
            {filteredCustomers.length !== customers.length && " (filtered)"}
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
                      <TableHead className="font-semibold">
                        Credit Information
                      </TableHead>
                      <TableHead className="font-semibold">Salesman</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {paginatedCustomers.length === 0 ? (
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
                        paginatedCustomers.map((customer, index) => (
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
                                      {getInitials(customer.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {customer.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {customer.code}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                      {customer.city}, {customer.state}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Contact: {customer.contactPerson}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {customer.mobile}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate">
                                    {customer.email}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {customer.address}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge className={getTypeColor(customer.type)}>
                                  {customer.type}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Limit:
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(customer.creditLimit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-1">
                                    <span className="text-muted-foreground">
                                      Outstanding:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        customer.outstandingBalance >
                                        customer.creditLimit * 0.8
                                          ? "text-red-600"
                                          : customer.outstandingBalance > 0
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {formatCurrency(
                                        customer.outstandingBalance
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Used:
                                    </span>
                                    <span>
                                      {customer.creditUsedPercentage.toFixed(1)}
                                      %
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${
                                        customer.creditUsedPercentage > 80
                                          ? "bg-red-500"
                                          : customer.creditUsedPercentage > 50
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${customer.creditUsedPercentage}%`,
                                      }}
                                      transition={{
                                        duration: 1,
                                        delay: index * 0.1,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant="outline"
                                  className="font-medium"
                                >
                                  {customer.salesman}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  className={getStatusColor(customer.status)}
                                >
                                  {customer.status}
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
                                    onClick={() => handleEdit(customer)}
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
                                    onClick={() => confirmDelete(customer)}
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
        {filteredCustomers.length > 0 && (
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
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Customer"
          subText={
            customerToDelete
              ? `Are you sure you want to delete "${customerToDelete.name}"? This action cannot be undone and will also delete associated transactions.`
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

// Helper component for Check icon
const Check = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

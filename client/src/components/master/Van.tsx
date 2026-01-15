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
  Truck,
  Users,
  MapPin,
  Calendar,
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
import VanForm, { type VanFormData } from "@/components/forms/VanForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";

// Define type for van
interface Van {
  id: number;
  registrationNumber: string;
  name: string;
  model: string;
  capacity: number; // kg
  driverName: string;
  driverContact: string;
  currentLocation: string;
  assignedRoute: string;
  lastServiceDate: string;
  nextServiceDate: string;
  maintenanceStatus: "OK" | "Due Soon" | "Overdue";
  insuranceExpiry: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export default function Van() {
  // State for vans
  const [vans, setVans] = useState<Van[]>([
    {
      id: 1,
      registrationNumber: "DL01AB1234",
      name: "Van Alpha",
      model: "Tata Ace",
      capacity: 1000,
      driverName: "Ramesh Kumar",
      driverContact: "+91 9876543210",
      currentLocation: "South Delhi",
      assignedRoute: "Route A",
      lastServiceDate: "2024-01-15",
      nextServiceDate: "2024-04-15",
      maintenanceStatus: "OK",
      insuranceExpiry: "2024-12-31",
      status: "Active",
      createdAt: "2024-01-15 09:30:00",
      updatedAt: "2024-03-20 14:45:00",
    },
    {
      id: 2,
      registrationNumber: "DL01CD5678",
      name: "Van Beta",
      model: "Mahindra Supro",
      capacity: 800,
      driverName: "Suresh Patel",
      driverContact: "+91 8765432109",
      currentLocation: "Warehouse",
      assignedRoute: "Route B",
      lastServiceDate: "2024-02-01",
      nextServiceDate: "2024-05-01",
      maintenanceStatus: "Due Soon",
      insuranceExpiry: "2025-01-15",
      status: "Active",
      createdAt: "2024-02-10 11:20:00",
      updatedAt: "2024-03-18 10:15:00",
    },
    {
      id: 3,
      registrationNumber: "DL01EF9012",
      name: "Van Gamma",
      model: "Ashok Leyland Dost",
      capacity: 1200,
      driverName: "Mahesh Sharma",
      driverContact: "+91 7654321098",
      currentLocation: "North Delhi",
      assignedRoute: "Route C",
      lastServiceDate: "2024-01-20",
      nextServiceDate: "2024-04-20",
      maintenanceStatus: "OK",
      insuranceExpiry: "2024-11-30",
      status: "Active",
      createdAt: "2024-01-05 08:45:00",
      updatedAt: "2024-03-22 16:30:00",
    },
    {
      id: 4,
      registrationNumber: "DL01GH3456",
      name: "Van Delta",
      model: "Tata Intra",
      capacity: 1500,
      driverName: "Rajesh Yadav",
      driverContact: "+91 6543210987",
      currentLocation: "Service Center",
      assignedRoute: "Route D",
      lastServiceDate: "2024-02-10",
      nextServiceDate: "2024-05-10",
      maintenanceStatus: "Overdue",
      insuranceExpiry: "2024-10-15",
      status: "Inactive",
      createdAt: "2023-12-20 13:10:00",
      updatedAt: "2024-02-28 09:25:00",
    },
    {
      id: 5,
      registrationNumber: "DL01IJ7890",
      name: "Van Epsilon",
      model: "Mahindra Jeeto",
      capacity: 600,
      driverName: "Anil Verma",
      driverContact: "+91 5432109876",
      currentLocation: "Warehouse",
      assignedRoute: "Route E",
      lastServiceDate: "2024-01-25",
      nextServiceDate: "2024-04-25",
      maintenanceStatus: "OK",
      insuranceExpiry: "2025-02-28",
      status: "Active",
      createdAt: "2024-03-01 10:00:00",
      updatedAt: "2024-03-15 11:45:00",
    },
    {
      id: 6,
      registrationNumber: "DL01KL1234",
      name: "Van Zeta",
      model: "Tata Ace Gold",
      capacity: 1100,
      driverName: "Vikram Singh",
      driverContact: "+91 4321098765",
      currentLocation: "East Delhi",
      assignedRoute: "Route F",
      lastServiceDate: "2023-12-15",
      nextServiceDate: "2024-03-15",
      maintenanceStatus: "Overdue",
      insuranceExpiry: "2024-09-30",
      status: "Inactive",
      createdAt: "2024-02-28 15:30:00",
      updatedAt: "2024-03-10 14:20:00",
    },
    {
      id: 7,
      registrationNumber: "DL01MN5678",
      name: "Van Eta",
      model: "Mahindra Supro Maxi",
      capacity: 900,
      driverName: "Priya Sharma",
      driverContact: "+91 3210987654",
      currentLocation: "West Delhi",
      assignedRoute: "Route G",
      lastServiceDate: "2024-02-20",
      nextServiceDate: "2024-05-20",
      maintenanceStatus: "Due Soon",
      insuranceExpiry: "2024-12-15",
      status: "Active",
      createdAt: "2024-01-25 12:15:00",
      updatedAt: "2024-03-19 13:40:00",
    },
    {
      id: 8,
      registrationNumber: "DL01OP9012",
      name: "Van Theta",
      model: "Ashok Leyland Dost Plus",
      capacity: 1300,
      driverName: "Amit Patel",
      driverContact: "+91 2109876543",
      currentLocation: "Central Delhi",
      assignedRoute: "Route H",
      lastServiceDate: "2024-02-05",
      nextServiceDate: "2024-05-05",
      maintenanceStatus: "OK",
      insuranceExpiry: "2025-03-31",
      status: "Active",
      createdAt: "2024-03-10 09:00:00",
      updatedAt: "2024-03-21 15:10:00",
    },
    {
      id: 9,
      registrationNumber: "DL01QR3456",
      name: "Van Iota",
      model: "Tata Intra V20",
      capacity: 1600,
      driverName: "Sneha Reddy",
      driverContact: "+91 1098765432",
      currentLocation: "South Delhi",
      assignedRoute: "Route I",
      lastServiceDate: "2024-01-10",
      nextServiceDate: "2024-04-10",
      maintenanceStatus: "OK",
      insuranceExpiry: "2024-11-15",
      status: "Active",
      createdAt: "2023-11-15 14:20:00",
      updatedAt: "2024-01-30 10:55:00",
    },
    {
      id: 10,
      registrationNumber: "DL01ST7890",
      name: "Van Kappa",
      model: "Mahindra Jeeto Plus",
      capacity: 700,
      driverName: "Rajesh Kumar",
      driverContact: "+91 0987654321",
      currentLocation: "North Delhi",
      assignedRoute: "Route J",
      lastServiceDate: "2024-02-28",
      nextServiceDate: "2024-05-28",
      maintenanceStatus: "Due Soon",
      insuranceExpiry: "2025-01-31",
      status: "Active",
      createdAt: "2024-01-12 08:30:00",
      updatedAt: "2024-03-23 17:05:00",
    },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingVan, setEditingVan] = useState<Van | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vanToDelete, setVanToDelete] = useState<Van | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    registrationNumber: "",
    model: "",
    status: "all" as "all" | Van["status"],
    location: "",
    driverName: "",
    minCapacity: "",
    maxCapacity: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter vans
  const filteredVans = useMemo(() => {
    return vans.filter((van) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !van.name.toLowerCase().includes(searchLower) &&
        !van.registrationNumber.toLowerCase().includes(searchLower) &&
        !van.driverName.toLowerCase().includes(searchLower) &&
        !van.model.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !van.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (
        filters.registrationNumber &&
        !van.registrationNumber
          .toLowerCase()
          .includes(filters.registrationNumber.toLowerCase())
      )
        return false;
      if (
        filters.model &&
        !van.model.toLowerCase().includes(filters.model.toLowerCase())
      )
        return false;
      if (filters.status !== "all" && van.status !== filters.status)
        return false;
      if (
        filters.location &&
        !van.currentLocation
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      )
        return false;
      if (
        filters.driverName &&
        !van.driverName.toLowerCase().includes(filters.driverName.toLowerCase())
      )
        return false;
      if (filters.minCapacity && van.capacity < Number(filters.minCapacity))
        return false;
      if (filters.maxCapacity && van.capacity > Number(filters.maxCapacity))
        return false;

      return true;
    });
  }, [vans, filters]);

  // Paginated data
  const paginatedVans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVans.slice(startIndex, endIndex);
  }, [filteredVans, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredVans.length / itemsPerPage));

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
      registrationNumber: "",
      model: "",
      status: "all",
      location: "",
      driverName: "",
      minCapacity: "",
      maxCapacity: "",
    });
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: filterName === "status" ? "all" : "",
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = (data: VanFormData, id?: number) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (id) {
      // Update existing van
      setVans((prev) =>
        prev.map((van) =>
          van.id === id
            ? {
                ...van,
                ...data,
                updatedAt: now,
              }
            : van
        )
      );
      toast.success("Van updated successfully!");
    } else {
      // Add new van
      const newVan: Van = {
        id: Math.max(...vans.map((v) => v.id)) + 1,
        ...data,
        status: "Active" as Van["status"],
        createdAt: now,
        updatedAt: now,
      };
      setVans((prev) => [...prev, newVan]);
      toast.success("Van created successfully!");
    }
    setFormOpen(false);
  };

  // Handle edit
  const handleEdit = (van: Van) => {
    setEditingVan(van);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingVan(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (vanToDelete) {
      setVans((prev) => prev.filter((van) => van.id !== vanToDelete.id));
      toast.success("Van deleted successfully!");
      setVanToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (van: Van) => {
    setVanToDelete(van);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredVans.length);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format simple date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusColor = (status: Van["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get maintenance status badge color
  const getMaintenanceStatusColor = (status: Van["maintenanceStatus"]) => {
    switch (status) {
      case "OK":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Due Soon":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Overdue":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Check if insurance is expiring soon (within 30 days)
  const isInsuranceExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= today;
  };

  // Check if insurance is expired
  const isInsuranceExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalVans = vans.length;
    const activeVans = vans.filter((v) => v.status === "Active").length;
    const totalCapacity = vans.reduce((sum, v) => sum + v.capacity, 0);
    const avgCapacity = totalVans > 0 ? totalCapacity / totalVans : 0;
    const overdueMaintenance = vans.filter(
      (v) => v.maintenanceStatus === "Overdue"
    ).length;
    const insuranceExpiringSoon = vans.filter((v) =>
      isInsuranceExpiringSoon(v.insuranceExpiry)
    ).length;

    return {
      totalVans,
      activeVans,
      totalCapacity,
      avgCapacity,
      overdueMaintenance,
      insuranceExpiringSoon,
    };
  }, [vans]);

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
              <h1 className="text-3xl font-bold text-heading">Delivery Vans</h1>
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
                placeholder="Search vans by registration, name, or driver..."
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
                  Add New Van
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
                        {/* Van Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="vanName"
                            className="text-sm font-medium"
                          >
                            Van Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="vanName"
                              placeholder="Enter van name"
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

                        {/* Registration Number Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="registrationNumber"
                            className="text-sm font-medium"
                          >
                            Registration Number
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="registrationNumber"
                              placeholder="DL01AB1234"
                              value={filters.registrationNumber}
                              onChange={(e) =>
                                handleFilterChange(
                                  "registrationNumber",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            {filters.registrationNumber && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() =>
                                  clearFilter("registrationNumber")
                                }
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
                            onValueChange={(value: "all" | Van["status"]) =>
                              handleFilterChange("status", value)
                            }
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Model Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="model"
                            className="text-sm font-medium"
                          >
                            Model
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="model"
                              placeholder="Enter model"
                              value={filters.model}
                              onChange={(e) =>
                                handleFilterChange("model", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.model && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("model")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Location Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="location"
                            className="text-sm font-medium"
                          >
                            Current Location
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="location"
                              placeholder="Enter location"
                              value={filters.location}
                              onChange={(e) =>
                                handleFilterChange("location", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.location && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("location")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Driver Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="driverName"
                            className="text-sm font-medium"
                          >
                            Driver Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="driverName"
                              placeholder="Enter driver name"
                              value={filters.driverName}
                              onChange={(e) =>
                                handleFilterChange("driverName", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.driverName && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("driverName")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Capacity Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Capacity Range (kg)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={filters.minCapacity}
                              onChange={(e) =>
                                handleFilterChange(
                                  "minCapacity",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={filters.maxCapacity}
                              onChange={(e) =>
                                handleFilterChange(
                                  "maxCapacity",
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
            Showing {startIndex} to {endIndex} of {filteredVans.length} vans
            {filteredVans.length !== vans.length && " (filtered)"}
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

        {/* Vans Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">
                        Van Details
                      </TableHead>
                      <TableHead className="font-semibold">
                        Driver & Location
                      </TableHead>
                      <TableHead className="font-semibold">
                        Specifications
                      </TableHead>
                      <TableHead className="font-semibold">
                        Maintenance & Insurance
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Info</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {paginatedVans.length === 0 ? (
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
                              <Truck className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No vans found matching your filters.</p>
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
                        paginatedVans.map((van, index) => (
                          <motion.tr
                            key={van.id}
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
                                  <Truck className="h-5 w-5 text-primary" />
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {van.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {van.registrationNumber}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                      {van.model}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Assigned: {van.assignedRoute}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium text-sm">
                                      {van.driverName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-5">
                                    {van.driverContact}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {van.currentLocation}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Capacity
                                  </div>
                                  <div className="font-medium">
                                    {van.capacity.toLocaleString()} kg
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Last Service
                                  </div>
                                  <div className="text-sm">
                                    {formatDate(van.lastServiceDate)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Maintenance
                                    </span>
                                    <Badge
                                      className={getMaintenanceStatusColor(
                                        van.maintenanceStatus
                                      )}
                                    >
                                      {van.maintenanceStatus}
                                    </Badge>
                                  </div>
                                  <div className="text-xs mt-1">
                                    Next: {formatDate(van.nextServiceDate)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Insurance
                                  </div>
                                  <div
                                    className={`text-sm ${
                                      isInsuranceExpired(van.insuranceExpiry)
                                        ? "text-red-600"
                                        : isInsuranceExpiringSoon(
                                            van.insuranceExpiry
                                          )
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    Expires: {formatDate(van.insuranceExpiry)}
                                    {isInsuranceExpired(
                                      van.insuranceExpiry
                                    ) && (
                                      <span className="text-xs ml-1">⚠️</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge className={getStatusColor(van.status)}>
                                  {van.status}
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
                                    {formatDateTime(van.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(van.updatedAt)}
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
                                    onClick={() => handleEdit(van)}
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
                                    onClick={() => confirmDelete(van)}
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
        {filteredVans.length > 0 && (
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

        {/* Van Form Dialog */}
        <VanForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingVan={editingVan}
          onSave={handleSave}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Van"
          subText={
            vanToDelete
              ? `Are you sure you want to delete "${vanToDelete.name}" (${vanToDelete.registrationNumber})? This action cannot be undone and will remove all associated records.`
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

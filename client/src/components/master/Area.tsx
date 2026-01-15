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
  MapPin,
  Users,
  Building2,
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
import AreaForm, { type AreaFormData } from "@/components/forms/AreaForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";

// Define type for area
interface Area {
  id: number;
  code: string;
  name: string;
  description: string;
  city: string;
  state: string;
  pincode: string;
  region: string;
  salesman: string;
  customerCount: number;
  salesTarget: number;
  currentSales: number;
  targetAchievement: number;
  status: "Active" | "Inactive" | "Under Review";
  createdAt: string;
  updatedAt: string;
}

export default function Area() {
  // State for areas
  const [areas, setAreas] = useState<Area[]>([
    {
      id: 1,
      code: "AREA001",
      name: "South Delhi",
      description: "Premium residential and commercial area",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      region: "Delhi NCR",
      salesman: "Rajesh Kumar",
      customerCount: 42,
      salesTarget: 5000000,
      currentSales: 3850000,
      targetAchievement: 77,
      status: "Active",
      createdAt: "2024-01-15 09:30:00",
      updatedAt: "2024-03-20 14:45:00",
    },
    {
      id: 2,
      code: "AREA002",
      name: "North Delhi",
      description: "Business district with corporate clients",
      city: "Delhi",
      state: "Delhi",
      pincode: "110006",
      region: "Delhi NCR",
      salesman: "Priya Sharma",
      customerCount: 38,
      salesTarget: 4500000,
      currentSales: 4200000,
      targetAchievement: 93.3,
      status: "Active",
      createdAt: "2024-02-10 11:20:00",
      updatedAt: "2024-03-18 10:15:00",
    },
    {
      id: 3,
      code: "AREA003",
      name: "East Delhi",
      description: "Growing residential area",
      city: "Delhi",
      state: "Delhi",
      pincode: "110092",
      region: "Delhi NCR",
      salesman: "Amit Patel",
      customerCount: 35,
      salesTarget: 4000000,
      currentSales: 2800000,
      targetAchievement: 70,
      status: "Active",
      createdAt: "2024-01-05 08:45:00",
      updatedAt: "2024-03-22 16:30:00",
    },
    {
      id: 4,
      code: "AREA004",
      name: "West Delhi",
      description: "Industrial and commercial hub",
      city: "Delhi",
      state: "Delhi",
      pincode: "110018",
      region: "Delhi NCR",
      salesman: "Sneha Reddy",
      customerCount: 45,
      salesTarget: 5500000,
      currentSales: 4950000,
      targetAchievement: 90,
      status: "Active",
      createdAt: "2023-12-20 13:10:00",
      updatedAt: "2024-02-28 09:25:00",
    },
    {
      id: 5,
      code: "AREA005",
      name: "Central Delhi",
      description: "Government and historical area",
      city: "Delhi",
      state: "Delhi",
      pincode: "110002",
      region: "Delhi NCR",
      salesman: "Vikram Singh",
      customerCount: 28,
      salesTarget: 3000000,
      currentSales: 1500000,
      targetAchievement: 50,
      status: "Inactive",
      createdAt: "2024-03-01 10:00:00",
      updatedAt: "2024-03-15 11:45:00",
    },
    {
      id: 6,
      code: "AREA006",
      name: "Gurgaon Sector",
      description: "Corporate offices and IT parks",
      city: "Gurgaon",
      state: "Haryana",
      pincode: "122002",
      region: "Delhi NCR",
      salesman: "Rajesh Kumar",
      customerCount: 52,
      salesTarget: 6000000,
      currentSales: 5400000,
      targetAchievement: 90,
      status: "Active",
      createdAt: "2024-02-28 15:30:00",
      updatedAt: "2024-03-10 14:20:00",
    },
    {
      id: 7,
      code: "AREA007",
      name: "Noida Sector",
      description: "Residential and commercial complexes",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      region: "Delhi NCR",
      salesman: "Priya Sharma",
      customerCount: 40,
      salesTarget: 4800000,
      currentSales: 3840000,
      targetAchievement: 80,
      status: "Active",
      createdAt: "2024-01-25 12:15:00",
      updatedAt: "2024-03-19 13:40:00",
    },
    {
      id: 8,
      code: "AREA008",
      name: "Faridabad Industrial",
      description: "Industrial area with manufacturing units",
      city: "Faridabad",
      state: "Haryana",
      pincode: "121003",
      region: "Delhi NCR",
      salesman: "Amit Patel",
      customerCount: 32,
      salesTarget: 3500000,
      currentSales: 2450000,
      targetAchievement: 70,
      status: "Active",
      createdAt: "2024-03-10 09:00:00",
      updatedAt: "2024-03-21 15:10:00",
    },
    {
      id: 9,
      code: "AREA009",
      name: "Ghaziabad",
      description: "Residential township area",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincode: "201002",
      region: "Delhi NCR",
      salesman: "Sneha Reddy",
      customerCount: 25,
      salesTarget: 2800000,
      currentSales: 1680000,
      targetAchievement: 60,
      status: "Under Review",
      createdAt: "2023-11-15 14:20:00",
      updatedAt: "2024-01-30 10:55:00",
    },
    {
      id: 10,
      code: "AREA010",
      name: "Greater Noida",
      description: "Educational and residential hub",
      city: "Greater Noida",
      state: "Uttar Pradesh",
      pincode: "201310",
      region: "Delhi NCR",
      salesman: "Vikram Singh",
      customerCount: 30,
      salesTarget: 3200000,
      currentSales: 2240000,
      targetAchievement: 70,
      status: "Active",
      createdAt: "2024-01-12 08:30:00",
      updatedAt: "2024-03-23 17:05:00",
    },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    city: "",
    state: "",
    region: "",
    salesman: "",
    status: "all" as "all" | Area["status"],
    minCustomerCount: "",
    minTargetAchievement: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter areas
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !area.name.toLowerCase().includes(searchLower) &&
        !area.code.toLowerCase().includes(searchLower) &&
        !area.city.toLowerCase().includes(searchLower) &&
        !area.description.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !area.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (
        filters.city &&
        !area.city.toLowerCase().includes(filters.city.toLowerCase())
      )
        return false;
      if (
        filters.state &&
        !area.state.toLowerCase().includes(filters.state.toLowerCase())
      )
        return false;
      if (
        filters.region &&
        !area.region.toLowerCase().includes(filters.region.toLowerCase())
      )
        return false;
      if (
        filters.salesman &&
        !area.salesman.toLowerCase().includes(filters.salesman.toLowerCase())
      )
        return false;
      if (filters.status !== "all" && area.status !== filters.status)
        return false;
      if (
        filters.minCustomerCount &&
        area.customerCount < Number(filters.minCustomerCount)
      )
        return false;
      if (
        filters.minTargetAchievement &&
        area.targetAchievement < Number(filters.minTargetAchievement)
      )
        return false;

      return true;
    });
  }, [areas, filters]);

  // Paginated data
  const paginatedAreas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAreas.slice(startIndex, endIndex);
  }, [filteredAreas, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAreas.length / itemsPerPage)
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
      city: "",
      state: "",
      region: "",
      salesman: "",
      status: "all",
      minCustomerCount: "",
      minTargetAchievement: "",
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
  const handleSave = (data: AreaFormData, id?: number) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Calculate target achievement
    const targetAchievement = data.currentSales
      ? (data.currentSales / data.salesTarget) * 100
      : 0;

    if (id) {
      // Update existing area
      setAreas((prev) =>
        prev.map((area) =>
          area.id === id
            ? {
                ...area,
                ...data,
                targetAchievement,
                updatedAt: now,
              }
            : area
        )
      );
      toast.success("Area updated successfully!");
    } else {
      // Add new area
      const newArea: Area = {
        id: Math.max(...areas.map((a) => a.id)) + 1,
        code: `AREA${String(
          Math.max(...areas.map((a) => parseInt(a.code.replace("AREA", "")))) +
            1
        ).padStart(3, "0")}`,
        ...data,
        targetAchievement,
        customerCount: data.customerCount || 0,
        createdAt: now,
        updatedAt: now,
      };
      setAreas((prev) => [...prev, newArea]);
      toast.success("Area created successfully!");
    }
    setFormOpen(false);
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
  const handleDelete = () => {
    if (areaToDelete) {
      setAreas((prev) => prev.filter((area) => area.id !== areaToDelete.id));
      toast.success("Area deleted successfully!");
      setAreaToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (area: Area) => {
    setAreaToDelete(area);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredAreas.length);

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: Area["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get achievement badge color
  const getAchievementColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAreas = areas.length;
    const activeAreas = areas.filter((a) => a.status === "Active").length;
    const totalCustomers = areas.reduce((sum, a) => sum + a.customerCount, 0);
    const totalSalesTarget = areas.reduce((sum, a) => sum + a.salesTarget, 0);
    const totalCurrentSales = areas.reduce((sum, a) => sum + a.currentSales, 0);
    const avgAchievement =
      totalAreas > 0
        ? areas.reduce((sum, a) => sum + a.targetAchievement, 0) / totalAreas
        : 0;

    return {
      totalAreas,
      activeAreas,
      totalCustomers,
      totalSalesTarget,
      totalCurrentSales,
      avgAchievement,
      overallAchievement:
        totalSalesTarget > 0 ? (totalCurrentSales / totalSalesTarget) * 100 : 0,
    };
  }, [areas]);

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
                placeholder="Search areas by name, code, or city..."
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
                        {/* Area Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="areaName"
                            className="text-sm font-medium"
                          >
                            Area Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="areaName"
                              placeholder="Enter area name"
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
                            onValueChange={(value: "all" | Area["status"]) =>
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
                              <SelectItem value="Under Review">
                                Under Review
                              </SelectItem>
                            </SelectContent>
                          </Select>
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

                        {/* Customer Count Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Min Customer Count
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Minimum customers"
                              type="number"
                              value={filters.minCustomerCount}
                              onChange={(e) =>
                                handleFilterChange(
                                  "minCustomerCount",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            {filters.minCustomerCount && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("minCustomerCount")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Target Achievement Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Min Target Achievement (%)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Minimum achievement"
                              type="number"
                              min="0"
                              max="100"
                              value={filters.minTargetAchievement}
                              onChange={(e) =>
                                handleFilterChange(
                                  "minTargetAchievement",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            {filters.minTargetAchievement && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() =>
                                  clearFilter("minTargetAchievement")
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Region Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="region"
                            className="text-sm font-medium"
                          >
                            Region
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="region"
                              placeholder="Enter region"
                              value={filters.region}
                              onChange={(e) =>
                                handleFilterChange("region", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.region && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("region")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* State Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="state"
                            className="text-sm font-medium"
                          >
                            State
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="state"
                              placeholder="Enter state"
                              value={filters.state}
                              onChange={(e) =>
                                handleFilterChange("state", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.state && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("state")}
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
            Showing {startIndex} to {endIndex} of {filteredAreas.length} areas
            {filteredAreas.length !== areas.length && " (filtered)"}
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

        {/* Areas Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">
                        Area Details
                      </TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">
                        Sales Performance
                      </TableHead>
                      <TableHead className="font-semibold">
                        Salesman & Status
                      </TableHead>
                      <TableHead className="font-semibold">Info</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {paginatedAreas.length === 0 ? (
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
                        paginatedAreas.map((area, index) => (
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
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {area.code}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                      Region: {area.region}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {area.description}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{area.city}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {area.state}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Pincode: {area.pincode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-xs text-muted-foreground">
                                      Customers
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span className="font-medium">
                                        {area.customerCount}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">
                                      Target
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(area.salesTarget)}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">
                                      Achievement:
                                    </span>
                                    <span className="font-medium">
                                      {area.targetAchievement.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${getAchievementColor(
                                        area.targetAchievement
                                      )}`}
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${area.targetAchievement}%`,
                                      }}
                                      transition={{
                                        duration: 1,
                                        delay: index * 0.1,
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Sales: {formatCurrency(area.currentSales)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <motion.div
                                  variants={badgeVariants}
                                  whileHover="hover"
                                >
                                  <Badge
                                    variant="outline"
                                    className="font-medium"
                                  >
                                    {area.salesman}
                                  </Badge>
                                </motion.div>
                                <motion.div
                                  variants={badgeVariants}
                                  whileHover="hover"
                                >
                                  <Badge
                                    className={getStatusColor(area.status)}
                                  >
                                    {area.status}
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
        {filteredAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
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
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Area"
          subText={
            areaToDelete
              ? `Are you sure you want to delete "${areaToDelete.name}"? This action cannot be undone and will reassign customers to other areas.`
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

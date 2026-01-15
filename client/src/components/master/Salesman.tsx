// components/Salesman.tsx
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
  Users,
  Phone,
  Mail,
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
import SalesmanForm, {
  type SalesmanFormData,
} from "@/components/forms/SalesmanForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";

// Define type for salesman
interface Salesman {
  id: number;
  name: string;
  code: string;
  mobile: string;
  email: string;
  area: string;
  target: number;
  achieved: number;
  commission: number;
  status: "Active" | "Inactive" | "On Leave";
  createdAt: string;
  updatedAt: string;
  avatarColor: string;
}

export default function Salesman() {
  // State for salesmen
  const [salesmen, setSalesmen] = useState<Salesman[]>([
    {
      id: 1,
      name: "Rajesh Kumar",
      code: "SLS001",
      mobile: "+91 9876543210",
      email: "rajesh@example.com",
      area: "South Delhi",
      target: 500000,
      achieved: 425000,
      commission: 8.5,
      status: "Active",
      createdAt: "2024-01-15 09:30:00",
      updatedAt: "2024-03-20 14:45:00",
      avatarColor: "bg-blue-500",
    },
    {
      id: 2,
      name: "Priya Sharma",
      code: "SLS002",
      mobile: "+91 8765432109",
      email: "priya@example.com",
      area: "North Delhi",
      target: 450000,
      achieved: 380000,
      commission: 7.5,
      status: "Active",
      createdAt: "2024-02-10 11:20:00",
      updatedAt: "2024-03-18 10:15:00",
      avatarColor: "bg-purple-500",
    },
    {
      id: 3,
      name: "Amit Patel",
      code: "SLS003",
      mobile: "+91 7654321098",
      email: "amit@example.com",
      area: "East Delhi",
      target: 400000,
      achieved: 420000,
      commission: 9.0,
      status: "Active",
      createdAt: "2024-01-05 08:45:00",
      updatedAt: "2024-03-22 16:30:00",
      avatarColor: "bg-green-500",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      code: "SLS004",
      mobile: "+91 6543210987",
      email: "sneha@example.com",
      area: "West Delhi",
      target: 550000,
      achieved: 510000,
      commission: 8.0,
      status: "Active",
      createdAt: "2023-12-20 13:10:00",
      updatedAt: "2024-02-28 09:25:00",
      avatarColor: "bg-pink-500",
    },
    {
      id: 5,
      name: "Vikram Singh",
      code: "SLS005",
      mobile: "+91 5432109876",
      email: "vikram@example.com",
      area: "Central Delhi",
      target: 600000,
      achieved: 580000,
      commission: 8.2,
      status: "On Leave",
      createdAt: "2024-03-01 10:00:00",
      updatedAt: "2024-03-15 11:45:00",
      avatarColor: "bg-orange-500",
    },
    {
      id: 6,
      name: "Anjali Mehta",
      code: "SLS006",
      mobile: "+91 4321098765",
      email: "anjali@example.com",
      area: "Noida",
      target: 480000,
      achieved: 350000,
      commission: 6.5,
      status: "Active",
      createdAt: "2024-02-28 15:30:00",
      updatedAt: "2024-03-10 14:20:00",
      avatarColor: "bg-teal-500",
    },
    {
      id: 7,
      name: "Rahul Verma",
      code: "SLS007",
      mobile: "+91 3210987654",
      email: "rahul@example.com",
      area: "Gurgaon",
      target: 520000,
      achieved: 520000,
      commission: 8.8,
      status: "Active",
      createdAt: "2024-01-25 12:15:00",
      updatedAt: "2024-03-19 13:40:00",
      avatarColor: "bg-indigo-500",
    },
    {
      id: 8,
      name: "Neha Gupta",
      code: "SLS008",
      mobile: "+91 2109876543",
      email: "neha@example.com",
      area: "Faridabad",
      target: 420000,
      achieved: 390000,
      commission: 7.2,
      status: "Inactive",
      createdAt: "2024-03-10 09:00:00",
      updatedAt: "2024-03-21 15:10:00",
      avatarColor: "bg-red-500",
    },
    {
      id: 9,
      name: "Sanjay Mishra",
      code: "SLS009",
      mobile: "+91 1098765432",
      email: "sanjay@example.com",
      area: "Ghaziabad",
      target: 470000,
      achieved: 470000,
      commission: 8.0,
      status: "Active",
      createdAt: "2023-11-15 14:20:00",
      updatedAt: "2024-01-30 10:55:00",
      avatarColor: "bg-amber-500",
    },
    {
      id: 10,
      name: "Pooja Joshi",
      code: "SLS010",
      mobile: "+91 0987654321",
      email: "pooja@example.com",
      area: "Meerut",
      target: 390000,
      achieved: 410000,
      commission: 9.2,
      status: "Active",
      createdAt: "2024-01-12 08:30:00",
      updatedAt: "2024-03-23 17:05:00",
      avatarColor: "bg-cyan-500",
    },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [salesmanToDelete, setSalesmanToDelete] = useState<Salesman | null>(
    null
  );

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    area: "",
    status: "all" as "all" | "Active" | "Inactive" | "On Leave",
    minTarget: "",
    maxTarget: "",
    minAchieved: "",
    maxAchieved: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Calculate achievement percentage
  const calculatePercentage = (achieved: number, target: number) => {
    return Math.round((achieved / target) * 100);
  };

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 80) return "bg-blue-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
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

  // Filter salesmen
  const filteredSalesmen = useMemo(() => {
    return salesmen.filter((salesman) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !salesman.name.toLowerCase().includes(searchLower) &&
        !salesman.code.toLowerCase().includes(searchLower) &&
        !salesman.area.toLowerCase().includes(searchLower) &&
        !salesman.email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !salesman.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (
        filters.area &&
        !salesman.area.toLowerCase().includes(filters.area.toLowerCase())
      )
        return false;
      if (filters.status !== "all" && salesman.status !== filters.status)
        return false;
      if (filters.minTarget && salesman.target < Number(filters.minTarget))
        return false;
      if (filters.maxTarget && salesman.target > Number(filters.maxTarget))
        return false;
      if (
        filters.minAchieved &&
        salesman.achieved < Number(filters.minAchieved)
      )
        return false;
      if (
        filters.maxAchieved &&
        salesman.achieved > Number(filters.maxAchieved)
      )
        return false;

      return true;
    });
  }, [salesmen, filters]);

  // Paginated data
  const paginatedSalesmen = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSalesmen.slice(startIndex, endIndex);
  }, [filteredSalesmen, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSalesmen.length / itemsPerPage)
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Calculate team summary
  const teamSummary = useMemo(() => {
    const totalTarget = filteredSalesmen.reduce(
      (sum, salesman) => sum + salesman.target,
      0
    );
    const totalAchieved = filteredSalesmen.reduce(
      (sum, salesman) => sum + salesman.achieved,
      0
    );
    const avgCommission =
      filteredSalesmen.reduce((sum, salesman) => sum + salesman.commission, 0) /
      filteredSalesmen.length;

    return {
      totalTarget,
      totalAchieved,
      avgCommission: avgCommission || 0,
      achievementPercentage:
        Math.round((totalAchieved / totalTarget) * 100) || 0,
    };
  }, [filteredSalesmen]);

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
      area: "",
      status: "all",
      minTarget: "",
      maxTarget: "",
      minAchieved: "",
      maxAchieved: "",
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
  const handleSave = (data: SalesmanFormData, id?: number) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const avatarColors = [
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

    if (id) {
      // Update existing salesman
      setSalesmen((prev) =>
        prev.map((salesman) =>
          salesman.id === id
            ? {
                ...salesman,
                ...data,
                target: Number(data.target),
                achieved: Number(data.achieved),
                commission: Number(data.commission),
                updatedAt: now,
              }
            : salesman
        )
      );
      toast.success("Salesman updated successfully!");
    } else {
      // Add new salesman
      const newSalesman: Salesman = {
        id: Math.max(...salesmen.map((s) => s.id)) + 1,
        ...data,
        code: `SLS${String(Math.max(...salesmen.map((s) => s.id)) + 1).padStart(
          3,
          "0"
        )}`,
        target: Number(data.target),
        achieved: Number(data.achieved),
        commission: Number(data.commission),
        status: "Active",
        createdAt: now,
        updatedAt: now,
        avatarColor:
          avatarColors[Math.floor(Math.random() * avatarColors.length)],
      };
      setSalesmen((prev) => [...prev, newSalesman]);
      toast.success("Salesman created successfully!");
    }
    setFormOpen(false);
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
  const handleDelete = () => {
    if (salesmanToDelete) {
      setSalesmen((prev) =>
        prev.filter((salesman) => salesman.id !== salesmanToDelete.id)
      );
      toast.success("Salesman deleted successfully!");
      setSalesmanToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (salesman: Salesman) => {
    setSalesmanToDelete(salesman);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredSalesmen.length
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
                placeholder="Search by name, code, area, or email..."
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
                        {/* Name Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="name"
                              placeholder="Enter name"
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

                        {/* Area Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="area" className="text-sm font-medium">
                            Area
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="area"
                              placeholder="Enter area"
                              value={filters.area}
                              onChange={(e) =>
                                handleFilterChange("area", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.area && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("area")}
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
                              value: "all" | "Active" | "Inactive" | "On Leave"
                            ) => handleFilterChange("status", value)}
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="On Leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Target Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Target Range (₹)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={filters.minTarget}
                              onChange={(e) =>
                                handleFilterChange("minTarget", e.target.value)
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={filters.maxTarget}
                              onChange={(e) =>
                                handleFilterChange("maxTarget", e.target.value)
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
            Showing {startIndex} to {endIndex} of {filteredSalesmen.length}{" "}
            salesmen
            {filteredSalesmen.length !== salesmen.length && " (filtered)"}
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
                      <TableHead className="font-semibold">
                        Target vs Achieved
                      </TableHead>
                      <TableHead className="font-semibold">
                        Commission
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
                      {paginatedSalesmen.length === 0 ? (
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
                        paginatedSalesmen.map((salesman, index) => {
                          const percentage = calculatePercentage(
                            salesman.achieved,
                            salesman.target
                          );
                          return (
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
                                      className={`h-10 w-10 ${salesman.avatarColor}`}
                                    >
                                      <AvatarFallback className="text-white">
                                        {getAvatarInitials(salesman.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                  <div>
                                    <p className="font-medium text-heading">
                                      {salesman.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {salesman.code}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    {salesman.mobile}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    {salesman.email}
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
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(salesman.achieved)}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatCurrency(salesman.target)}
                                    </span>
                                  </div>
                                  <Progress
                                    value={Math.min(percentage, 100)}
                                    className={`h-2 ${getProgressColor(
                                      percentage
                                    )}`}
                                  />
                                  <div className="text-xs text-center text-muted-foreground">
                                    {percentage}% achieved
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <motion.div
                                  className="inline-flex items-center gap-1"
                                  variants={badgeVariants}
                                  whileHover="hover"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="font-semibold"
                                  >
                                    {salesman.commission}%
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    commission
                                  </p>
                                </motion.div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <motion.div
                                  variants={badgeVariants}
                                  whileHover="hover"
                                >
                                  <Badge
                                    variant={
                                      salesman.status === "Active"
                                        ? "default"
                                        : salesman.status === "On Leave"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className={
                                      salesman.status === "Active"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                        : salesman.status === "On Leave"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                                        : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                    }
                                  >
                                    {salesman.status}
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
                                  <div className="flex items-center">
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-xs font-medium text-orange-400">
                                        Updated:
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(salesman.updatedAt)}
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
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Custom Pagination */}
        {filteredSalesmen.length > 0 && (
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
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Salesman"
          subText={
            salesmanToDelete
              ? `Are you sure you want to delete "${salesmanToDelete.name}"? This action cannot be undone and will remove all associated performance data.`
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

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
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
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
import ProductCompanyForm, {
  type ProductCompanyFormData,
} from "@/components/forms/ProductCompanyForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define type for product company
interface ProductCompany {
  id: number;
  name: string;
  logo: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  productCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export default function ProductCompany() {
  // State for product companies
  const [companies, setCompanies] = useState<ProductCompany[]>([
    {
      id: 1,
      name: "137 Degrees",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=137",
      contactPerson: "John Smith",
      email: "john@137degrees.com",
      phone: "+1 (555) 123-4567",
      website: "www.137degrees.com",
      address: "123 Business St, New York, NY",
      productCount: 58,
      status: "Active",
      createdAt: "2024-01-15 09:30:00",
      updatedAt: "2024-03-20 14:45:00",
    },
    {
      id: 2,
      name: "Parle Agro",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Parle",
      contactPerson: "Sarah Johnson",
      email: "sarah@parle.com",
      phone: "+1 (555) 987-6543",
      website: "www.parleagro.com",
      address: "456 Industry Ave, Chicago, IL",
      productCount: 42,
      status: "Active",
      createdAt: "2024-02-10 11:20:00",
      updatedAt: "2024-03-18 10:15:00",
    },
    {
      id: 3,
      name: "Nestle India",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Nestle",
      contactPerson: "Michael Chen",
      email: "michael@nestle.in",
      phone: "+91 9876543210",
      website: "www.nestle.in",
      address: "789 Corporate Rd, Mumbai, India",
      productCount: 127,
      status: "Active",
      createdAt: "2024-01-05 08:45:00",
      updatedAt: "2024-03-22 16:30:00",
    },
    {
      id: 4,
      name: "Britannia Industries",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Britannia",
      contactPerson: "Priya Sharma",
      email: "priya@britannia.com",
      phone: "+91 8765432109",
      website: "www.britannia.com",
      address: "321 Factory St, Delhi, India",
      productCount: 89,
      status: "Inactive",
      createdAt: "2023-12-20 13:10:00",
      updatedAt: "2024-02-28 09:25:00",
    },
    {
      id: 5,
      name: "Amul",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Amul",
      contactPerson: "Raj Patel",
      email: "raj@amul.com",
      phone: "+91 7654321098",
      website: "www.amul.com",
      address: "654 Dairy Rd, Gujarat, India",
      productCount: 156,
      status: "Active",
      createdAt: "2024-03-01 10:00:00",
      updatedAt: "2024-03-15 11:45:00",
    },
    {
      id: 6,
      name: "Coca-Cola",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Coca",
      contactPerson: "David Brown",
      email: "david@cocacola.com",
      phone: "+1 (555) 234-5678",
      website: "www.coca-cola.com",
      address: "789 Beverage Blvd, Atlanta, GA",
      productCount: 203,
      status: "Active",
      createdAt: "2024-02-28 15:30:00",
      updatedAt: "2024-03-10 14:20:00",
    },
    {
      id: 7,
      name: "PepsiCo",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Pepsi",
      contactPerson: "Lisa White",
      email: "lisa@pepsico.com",
      phone: "+1 (555) 345-6789",
      website: "www.pepsico.com",
      address: "987 Refreshment Rd, Purchase, NY",
      productCount: 178,
      status: "Active",
      createdAt: "2024-01-25 12:15:00",
      updatedAt: "2024-03-19 13:40:00",
    },
    {
      id: 8,
      name: "Unilever",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Unilever",
      contactPerson: "Robert Green",
      email: "robert@unilever.com",
      phone: "+44 20 7822 5252",
      website: "www.unilever.com",
      address: "100 Victoria Embankment, London, UK",
      productCount: 312,
      status: "Active",
      createdAt: "2024-03-10 09:00:00",
      updatedAt: "2024-03-21 15:10:00",
    },
    {
      id: 9,
      name: "Procter & Gamble",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=PG",
      contactPerson: "Emily Davis",
      email: "emily@pg.com",
      phone: "+1 (513) 983-1100",
      website: "www.pg.com",
      address: "1 Procter & Gamble Plaza, Cincinnati, OH",
      productCount: 267,
      status: "Active",
      createdAt: "2023-11-15 14:20:00",
      updatedAt: "2024-01-30 10:55:00",
    },
    {
      id: 10,
      name: "Johnson & Johnson",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=JNJ",
      contactPerson: "Thomas Wilson",
      email: "thomas@jnj.com",
      phone: "+1 (732) 524-0400",
      website: "www.jnj.com",
      address: "1 Johnson & Johnson Plaza, New Brunswick, NJ",
      productCount: 189,
      status: "Inactive",
      createdAt: "2024-01-12 08:30:00",
      updatedAt: "2024-03-23 17:05:00",
    },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ProductCompany | null>(
    null
  );

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<ProductCompany | null>(
    null
  );

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    contactPerson: "",
    email: "",
    status: "all" as "all" | "Active" | "Inactive",
    minProducts: "",
    maxProducts: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !company.name.toLowerCase().includes(searchLower) &&
        !company.contactPerson.toLowerCase().includes(searchLower) &&
        !company.email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !company.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (
        filters.contactPerson &&
        !company.contactPerson
          .toLowerCase()
          .includes(filters.contactPerson.toLowerCase())
      )
        return false;
      if (
        filters.email &&
        !company.email.toLowerCase().includes(filters.email.toLowerCase())
      )
        return false;
      if (filters.status !== "all" && company.status !== filters.status)
        return false;
      if (
        filters.minProducts &&
        company.productCount < Number(filters.minProducts)
      )
        return false;
      if (
        filters.maxProducts &&
        company.productCount > Number(filters.maxProducts)
      )
        return false;

      return true;
    });
  }, [companies, filters]);

  // Paginated data
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCompanies.slice(startIndex, endIndex);
  }, [filteredCompanies, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / itemsPerPage)
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
      contactPerson: "",
      email: "",
      status: "all",
      minProducts: "",
      maxProducts: "",
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
  const handleSave = (data: ProductCompanyFormData, id?: number) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (id) {
      // Update existing company
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === id
            ? {
                ...company,
                ...data,
                logo: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`,
                updatedAt: now,
              }
            : company
        )
      );
      toast.success("Company updated successfully!");
    } else {
      // Add new company
      const newCompany: ProductCompany = {
        id: Math.max(...companies.map((c) => c.id)) + 1,
        ...data,
        logo: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`,
        productCount: 0,
        website: data.website ?? "",
        status: "Active",
        createdAt: now,
        updatedAt: now,
      };
      setCompanies((prev) => [...prev, newCompany]);
      toast.success("Company created successfully!");
    }
    setFormOpen(false);
  };

  // Handle edit
  const handleEdit = (company: ProductCompany) => {
    setEditingCompany(company);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCompany(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (companyToDelete) {
      setCompanies((prev) =>
        prev.filter((company) => company.id !== companyToDelete.id)
      );
      toast.success("Company deleted successfully!");
      setCompanyToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (company: ProductCompany) => {
    setCompanyToDelete(company);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredCompanies.length
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(
      (c) => c.status === "Active"
    ).length;
    const totalProducts = companies.reduce(
      (sum, company) => sum + company.productCount,
      0
    );

    return {
      totalCompanies,
      activeCompanies,
      totalProducts,
      inactiveCompanies: totalCompanies - activeCompanies,
    };
  }, [companies]);

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
                Product Companies
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
                placeholder="Search companies by name, contact, or email..."
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
                  Add Company
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

                        {/* Contact Person Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="contactPerson"
                            className="text-sm font-medium"
                          >
                            Contact Person
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="contactPerson"
                              placeholder="Enter contact person"
                              value={filters.contactPerson}
                              onChange={(e) =>
                                handleFilterChange(
                                  "contactPerson",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            {filters.contactPerson && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("contactPerson")}
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
                              value: "all" | "Active" | "Inactive"
                            ) => handleFilterChange("status", value)}
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

                        {/* Product Count Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Product Count Range
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={filters.minProducts}
                              onChange={(e) =>
                                handleFilterChange(
                                  "minProducts",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={filters.maxProducts}
                              onChange={(e) =>
                                handleFilterChange(
                                  "maxProducts",
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
            Showing {startIndex} to {endIndex} of {filteredCompanies.length}{" "}
            companies
            {filteredCompanies.length !== companies.length && " (filtered)"}
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

        {/* Companies Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Company</TableHead>
                      <TableHead className="font-semibold">
                        Contact Info
                      </TableHead>
                      <TableHead className="font-semibold">Address</TableHead>
                      <TableHead className="font-semibold text-center">
                        Products
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
                      {paginatedCompanies.length === 0 ? (
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
                              <p>No companies found matching your filters.</p>
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
                        paginatedCompanies.map((company, index) => (
                          <motion.tr
                            key={company.id}
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
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={company.logo}
                                      alt={company.name}
                                    />
                                    <AvatarFallback>
                                      {company.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {company.name}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                    <a
                                      href={`https://${company.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {company.website}
                                    </a>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: {company.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {company.contactPerson}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate">
                                    {company.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {company.phone}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground line-clamp-2">
                                  {company.address}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant="outline"
                                  className="font-semibold"
                                >
                                  {company.productCount}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  products
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
                                    company.status === "Active"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    company.status === "Active"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                  }
                                >
                                  {company.status}
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
                                    {formatDateTime(company.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(company.updatedAt)}
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
                                    onClick={() => handleEdit(company)}
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
                                    onClick={() => confirmDelete(company)}
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
        {filteredCompanies.length > 0 && (
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

        {/* Information Card */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    About Product Companies
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Product Companies are manufacturers, suppliers, or brands
                      that provide products for your inventory. Managing
                      companies helps you track product origins, contact
                      information, and supplier relationships.
                    </p>
                    <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                      <p className="text-sm font-medium mb-1">
                        Key Information:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>
                          • Active companies are currently supplying products
                        </li>
                        <li>
                          • Product count shows total products from each company
                        </li>
                        <li>
                          • Contact information is essential for ordering and
                          support
                        </li>
                        <li>
                          • Website links provide quick access to company
                          information
                        </li>
                        <li>
                          • Created/Updated timestamps track company record
                          activity
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Company Form Dialog */}
        <ProductCompanyForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingCompany={editingCompany}
          onSave={handleSave}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Company"
          subText={
            companyToDelete
              ? `Are you sure you want to delete "${companyToDelete.name}"? This will remove the company and all associated data. This action cannot be undone.`
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

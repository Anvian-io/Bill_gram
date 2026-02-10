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
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  Calendar,
  Plus,
  FileText,
  User,
  MapPin,
  Truck,
  UserCog,
  Percent,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Hash,
  IndianRupee,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../components/FramerVariants";
import { toast } from "sonner";
import { CustomAlert } from "@/components/custom_ui";
import { useDebounce } from "@/utils/debounce";
import SalesForm from "../components/forms/SalesForm";
import type { Sales, SalesFormData } from "@/types/sales";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Date utility functions
const parseDateFromString = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;

  const formats = [
    "dd/MM/yyyy",
    "dd-MM-yyyy",
    "dd.MM.yyyy",
    "dd/MM/yy",
    "yyyy-MM-dd",
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(dateString, fmt, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Continue to next format
    }
  }

  return undefined;
};

const formatDateToDisplay = (date: Date | undefined): string => {
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
};

// Main Sales Page Component
export default function Sales() {
  // State for sales
  const [sales, setSales] = useState<Sales[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSales, setEditingSales] = useState<Sales | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [salesToDelete, setSalesToDelete] = useState<Sales | null>(null);

  // Get data from Redux store using the hook
  const { areas, customers, salesmen, vans } = useActiveLists();

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    invoiceNo: "",
    area: "all" as string | "all",
    customer: "all" as string | "all",
    van: "all" as string | "all",
    salesman: "all" as string | "all",
    minAmount: "",
    maxAmount: "",
    invoiceDate: undefined as Date | undefined,
    status: "all" as
      | "all"
      | "Pending"
      | "Paid"
      | "Partially Paid"
      | "Cancelled"
      | "Delivered",
  });

  // State for Command dropdowns
  const [areaOpen, setAreaOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [vanOpen, setVanOpen] = useState(false);
  const [salesmanOpen, setSalesmanOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for immediate input values
  const [searchInput, setSearchInput] = useState<string>("");
  const [invoiceNoInput, setInvoiceNoInput] = useState<string>("");
  const [minAmountInput, setMinAmountInput] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetInvoiceNo = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, invoiceNo: value }));
  }, 300);

  const debouncedSetMinAmount = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, minAmount: value }));
  }, 300);

  const debouncedSetMaxAmount = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, maxAmount: value }));
  }, 300);

  // Handle input changes with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const handleInvoiceNoChange = (value: string) => {
    setInvoiceNoInput(value);
    debouncedSetInvoiceNo(value);
  };

  const handleMinAmountChange = (value: string) => {
    setMinAmountInput(value);
    debouncedSetMinAmount(value);
  };

  const handleMaxAmountChange = (value: string) => {
    setMaxAmountInput(value);
    debouncedSetMaxAmount(value);
  };

  const handleInvoiceDateInputChange = (value: string) => {
    setInvoiceDateInput(value);
    const parsedDate = parseDateFromString(value);
    if (parsedDate) {
      setFilters((prev) => ({ ...prev, invoiceDate: parsedDate }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, invoiceDate: undefined }));
    }
  };

  const handleInvoiceDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, invoiceDate: date }));
    if (date) {
      setInvoiceDateInput(formatDateToDisplay(date));
    } else {
      setInvoiceDateInput("");
    }
  };

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
      invoiceNo: "",
      area: "all",
      customer: "all",
      van: "all",
      salesman: "all",
      minAmount: "",
      maxAmount: "",
      invoiceDate: undefined,
      status: "all",
    });
    setSearchInput("");
    setInvoiceNoInput("");
    setMinAmountInput("");
    setMaxAmountInput("");
    setInvoiceDateInput("");
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "area" ||
        filterName === "customer" ||
        filterName === "van" ||
        filterName === "salesman" ||
        filterName === "status"
          ? "all"
          : filterName === "invoiceDate"
            ? undefined
            : "",
    }));

    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "invoiceNo":
        setInvoiceNoInput("");
        break;
      case "minAmount":
        setMinAmountInput("");
        break;
      case "maxAmount":
        setMaxAmountInput("");
        break;
      case "invoiceDate":
        setInvoiceDateInput("");
        break;
    }
  };

  // Fetch sales data (mock for now - replace with actual API call)
  const fetchSales = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockSales: Sales[] = [
        {
          id: 1,
          invoiceNo: "S501622",
          invoiceDate: "2024-01-15",
          area: {
            id: 1,
            name: "Mumbai Central",
          },
          customer: {
            id: 1,
            name: "Reliance Fresh",
            code: "C001",
          },
          van: {
            id: 1,
            name: "Delivery Van 1",
            number: "MH01AB1234",
          },
          salesman: {
            id: 1,
            name: "Amit Sharma",
            code: "S001",
          },
          address: "Mumbai Central",
          gstDetails: "Against GST",
          items: [
            {
              id: 1,
              productId: 1,
              productCode: "G6",
              description: "ECLARIS JAR",
              rate: 130.0,
              aQty: 10,
              mQty: 10,
              totalAmount: 1300.0,
              taxRate: 5,
              taxAmount: 65.0,
              sch1Percent: 0,
              sch1Amount: 0,
              sch2Percent: 0,
              sch2Amount: 0,
            },
          ],
          remarks: "",
          grossAmount: 6100.0,
          boxUnit: 20.0,
          cessInsurance: 0,
          scheme1: 0,
          discountPercent: 5,
          tax: 305.0,
          amountAdd: 0,
          creditAmount: 0,
          finalAmount: 6405.0,
          status: "Paid",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
        },
      ];

      setSales(mockSales);
      setTotalItems(mockSales.length);
      setTotalPages(Math.ceil(mockSales.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to fetch sales", {
        description: "Please try again later",
      });
      setSales([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSales();
  }, [currentPage, itemsPerPage]);

  // Filter sales based on current filters
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches =
          sale.invoiceNo.toLowerCase().includes(searchLower) ||
          sale.customer.name.toLowerCase().includes(searchLower) ||
          sale.area.name.toLowerCase().includes(searchLower) ||
          sale.van.name.toLowerCase().includes(searchLower) ||
          sale.salesman.name.toLowerCase().includes(searchLower) ||
          (sale.remarks && sale.remarks.toLowerCase().includes(searchLower)) ||
          sale.items.some(
            (item) =>
              item.productCode.toLowerCase().includes(searchLower) ||
              item.description.toLowerCase().includes(searchLower),
          );
        if (!matches) return false;
      }

      // Invoice No filter
      if (filters.invoiceNo && !sale.invoiceNo.includes(filters.invoiceNo)) {
        return false;
      }

      // Area filter
      if (filters.area !== "all" && sale.area.id.toString() !== filters.area) {
        return false;
      }

      // Customer filter
      if (
        filters.customer !== "all" &&
        sale.customer.id.toString() !== filters.customer
      ) {
        return false;
      }

      // Van filter
      if (filters.van !== "all" && sale.van.id.toString() !== filters.van) {
        return false;
      }

      // Salesman filter
      if (
        filters.salesman !== "all" &&
        sale.salesman.id.toString() !== filters.salesman
      ) {
        return false;
      }

      // Amount range filter
      if (
        filters.minAmount &&
        sale.finalAmount < parseFloat(filters.minAmount)
      ) {
        return false;
      }
      if (
        filters.maxAmount &&
        sale.finalAmount > parseFloat(filters.maxAmount)
      ) {
        return false;
      }

      // Invoice date filter
      if (filters.invoiceDate) {
        const saleDate = new Date(sale.invoiceDate);
        const filterDate = new Date(filters.invoiceDate);
        if (
          saleDate.getDate() !== filterDate.getDate() ||
          saleDate.getMonth() !== filterDate.getMonth() ||
          saleDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== "all" && sale.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [sales, filters]);

  // Update pagination based on filtered sales
  useEffect(() => {
    setTotalItems(filteredSales.length);
    setTotalPages(Math.ceil(filteredSales.length / itemsPerPage));
  }, [filteredSales, itemsPerPage]);

  // Get current page sales
  const currentSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      });
    } catch {
      return "Invalid date";
    }
  };

  // Handle Add Sales
  const handleAddSales = () => {
    setEditingSales(null);
    setIsModalOpen(true);
  };

  // Handle Edit Sales
  const handleEditSales = (sale: Sales) => {
    setEditingSales(sale);
    setIsModalOpen(true);
  };

  // Handle Delete Sales
  const confirmDeleteSales = (sale: Sales) => {
    setSalesToDelete(sale);
    setDeleteOpen(true);
  };

  const handleDeleteSales = async () => {
    if (salesToDelete) {
      try {
        setSales(sales.filter((s) => s.id !== salesToDelete.id));
        toast.success("Sales deleted successfully!");
      } catch (error: any) {
        toast.error("Failed to delete sales", {
          description: "Please try again",
        });
      } finally {
        setSalesToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Handle Save Sales
  const handleSaveSales = async (data: SalesFormData, id?: number) => {
    setIsSubmitting(true);

    try {
      const area = areas.find((a) => a.id === data.areaId);
      const customer = customers.find((c) => c.id === data.customerId);
      const van = vans.find((v) => v.id === data.vanId);
      const salesman = salesmen.find((s) => s.id === data.salesmanId);

      if (!area || !customer || !van || !salesman) {
        throw new Error("Required fields not found");
      }

      if (id) {
        // Update existing sales
        const updatedSales: Sales = {
          id,
          invoiceNo: data.invoiceNo,
          invoiceDate: data.invoiceDate,
          area: {
            id: area.id,
            name: area.name,
          },
          customer: {
            id: customer.id,
            name: customer.companyName || customer.personName || customer.name,
            code: `C${customer.id.toString().padStart(3, "0")}`,
          },
          van: {
            id: van.id,
            name: van.name,
            number: van.vehicleNo || "",
          },
          salesman: {
            id: salesman.id,
            name: salesman.name,
            code: `S${salesman.id.toString().padStart(3, "0")}`,
          },
          address: data.address,
          gstDetails: data.gstDetails || "Against GST",
          items: data.items.map((item, index) => ({
            id: index + 1,
            productId: item.productId,
            productCode: item.productCode,
            description: item.description,
            rate: item.rate,
            aQty: item.aQty,
            mQty: item.mQty,
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            sch1Percent: item.sch1Percent,
            sch1Amount: item.sch1Amount,
            sch2Percent: item.sch2Percent,
            sch2Amount: item.sch2Amount,
          })),
          remarks: data.remarks || "",
          grossAmount: data.grossAmount,
          boxUnit: data.boxUnit,
          cessInsurance: data.cessInsurance,
          scheme1: data.scheme1,
          discountPercent: data.discountPercent,
          tax: data.tax,
          amountAdd: data.amountAdd,
          creditAmount: data.creditAmount,
          finalAmount: data.finalAmount,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSales(sales.map((s) => (s.id === id ? updatedSales : s)));
        toast.success("Sales updated successfully!");
      } else {
        // Add new sales
        const newSales: Sales = {
          id: sales.length + 1,
          invoiceNo: data.invoiceNo,
          invoiceDate: data.invoiceDate,
          area: {
            id: area.id,
            name: area.name,
          },
          customer: {
            id: customer.id,
            name: customer.companyName || customer.personName || customer.name,
            code: `C${customer.id.toString().padStart(3, "0")}`,
          },
          van: {
            id: van.id,
            name: van.name,
            number: van.vehicleNo || "",
          },
          salesman: {
            id: salesman.id,
            name: salesman.name,
            code: `S${salesman.id.toString().padStart(3, "0")}`,
          },
          address: data.address,
          gstDetails: data.gstDetails || "Against GST",
          items: data.items.map((item, index) => ({
            id: index + 1,
            productId: item.productId,
            productCode: item.productCode,
            description: item.description,
            rate: item.rate,
            aQty: item.aQty,
            mQty: item.mQty,
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            sch1Percent: item.sch1Percent,
            sch1Amount: item.sch1Amount,
            sch2Percent: item.sch2Percent,
            sch2Amount: item.sch2Amount,
          })),
          remarks: data.remarks || "",
          grossAmount: data.grossAmount,
          boxUnit: data.boxUnit,
          cessInsurance: data.cessInsurance,
          scheme1: data.scheme1,
          discountPercent: data.discountPercent,
          tax: data.tax,
          amountAdd: data.amountAdd,
          creditAmount: data.creditAmount,
          finalAmount: data.finalAmount,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSales([newSales, ...sales]);
        toast.success("Sales created successfully!");
      }

      setIsModalOpen(false);
      fetchSales(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save sales", {
        description: error.message || "Please try again",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchSales();
    toast.info("Refreshing sales data...");
  };

  // Active filters count
  const activeFiltersCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        value &&
        value !== "all" &&
        !(value instanceof Date),
    ).length + (filters.invoiceDate ? 1 : 0);

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Get display names for Command dropdowns
  const getAreaName = (id: string) => {
    if (id === "all") return "All Areas";
    const area = areas.find((a) => a.id.toString() === id);
    return area ? area.name : "Select Area";
  };

  const getCustomerName = (id: string) => {
    if (id === "all") return "All Customers";
    const customer = customers.find((c) => c.id.toString() === id);
    return customer
      ? customer.companyName || customer.personName
      : "Select Customer";
  };

  const getVanName = (id: string) => {
    if (id === "all") return "All Vans";
    const van = vans.find((v) => v.id.toString() === id);
    return van ? van.name : "Select Van";
  };

  const getSalesmanName = (id: string) => {
    if (id === "all") return "All Salesmen";
    const salesman = salesmen.find((s) => s.id.toString() === id);
    return salesman ? salesman.name : "Select Salesman";
  };

  return (
    <>
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
                  Sales Management
                </h1>
                <motion.p
                  className="text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Manage and track your sales invoices
                </motion.p>
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
                  placeholder="Search by invoice no, customer, area, van, salesman..."
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
                    onClick={handleAddSales}
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    New Sales
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
                          {/* Invoice No Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="invoiceNo"
                              className="text-sm font-medium"
                            >
                              Invoice No
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="invoiceNo"
                                placeholder="Enter invoice no"
                                value={invoiceNoInput}
                                onChange={(e) =>
                                  handleInvoiceNoChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              {invoiceNoInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setInvoiceNoInput("");
                                    clearFilter("invoiceNo");
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
                                  {getAreaName(filters.area)}
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
                                          handleFilterChange("area", "all");
                                          setAreaOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.area === "all"
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
                                              "area",
                                              area.id.toString(),
                                            );
                                            setAreaOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.area ===
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

                          {/* Customer Filter - Command Dropdown */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Customer
                            </Label>
                            <Popover
                              open={customerOpen}
                              onOpenChange={setCustomerOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={customerOpen}
                                  className="w-full justify-between"
                                  disabled={isLoading}
                                >
                                  {getCustomerName(filters.customer)}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search customer..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      No customer found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange("customer", "all");
                                          setCustomerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.customer === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Customers
                                      </CommandItem>
                                      {customers.map((customer) => (
                                        <CommandItem
                                          key={customer.id}
                                          value={customer.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "customer",
                                              customer.id.toString(),
                                            );
                                            setCustomerOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.customer ===
                                                customer.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {customer.companyName ||
                                            customer.personName}
                                          {customer.phoneNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({customer.phoneNo})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Van Filter - Command Dropdown */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Van</Label>
                            <Popover open={vanOpen} onOpenChange={setVanOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={vanOpen}
                                  className="w-full justify-between"
                                  disabled={isLoading}
                                >
                                  {getVanName(filters.van)}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search van..." />
                                  <CommandList>
                                    <CommandEmpty>No van found.</CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange("van", "all");
                                          setVanOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.van === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Vans
                                      </CommandItem>
                                      {vans.map((van) => (
                                        <CommandItem
                                          key={van.id}
                                          value={van.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "van",
                                              van.id.toString(),
                                            );
                                            setVanOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.van === van.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {van.name}
                                          {van.vehicleNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({van.vehicleNo})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Salesman Filter - Command Dropdown */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Salesman
                            </Label>
                            <Popover
                              open={salesmanOpen}
                              onOpenChange={setSalesmanOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={salesmanOpen}
                                  className="w-full justify-between"
                                  disabled={isLoading}
                                >
                                  {getSalesmanName(filters.salesman)}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search salesman..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      No salesman found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange("salesman", "all");
                                          setSalesmanOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.salesman === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Salesmen
                                      </CommandItem>
                                      {salesmen.map((salesman) => (
                                        <CommandItem
                                          key={salesman.id}
                                          value={salesman.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "salesman",
                                              salesman.id.toString(),
                                            );
                                            setSalesmanOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.salesman ===
                                                salesman.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {salesman.name}
                                          {salesman.phoneNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({salesman.phoneNo})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Amount Range Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Amount Range
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Min"
                                type="number"
                                value={minAmountInput}
                                onChange={(e) =>
                                  handleMinAmountChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Max"
                                type="number"
                                value={maxAmountInput}
                                onChange={(e) =>
                                  handleMaxAmountChange(e.target.value)
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Invoice Date */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Invoice Date
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={invoiceDateInput}
                                  onChange={(e) =>
                                    handleInvoiceDateInputChange(e.target.value)
                                  }
                                  placeholder="dd/mm/yyyy or select"
                                  className="pr-10"
                                />
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                                    >
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="end"
                                  >
                                    <CalendarComponent
                                      mode="single"
                                      selected={filters.invoiceDate}
                                      onSelect={handleInvoiceDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {invoiceDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setInvoiceDateInput("");
                                    clearFilter("invoiceDate");
                                  }}
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
                              onValueChange={(value) =>
                                handleFilterChange("status", value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Partially Paid">
                                  Partially Paid
                                </SelectItem>
                                <SelectItem value="Cancelled">
                                  Cancelled
                                </SelectItem>
                                <SelectItem value="Delivered">
                                  Delivered
                                </SelectItem>
                              </SelectContent>
                            </Select>
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
              Showing {startIndex} to {endIndex} of {totalItems} sales
              {activeFiltersCount > 0 && " (filtered)"}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Items per page:
                </div>
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
            </div>
          </motion.div>

          {/* Sales Table */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-semibold">
                          Invoice No
                        </TableHead>
                        <TableHead className="font-semibold">
                          Customer
                        </TableHead>
                        <TableHead className="font-semibold">Area</TableHead>
                        <TableHead className="font-semibold">Van</TableHead>
                        <TableHead className="font-semibold">
                          Salesman
                        </TableHead>
                        <TableHead className="font-semibold">
                          Invoice Date
                        </TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">
                          Gross Amount
                        </TableHead>
                        <TableHead className="font-semibold">Tax</TableHead>
                        <TableHead className="font-semibold">
                          Final Amount
                        </TableHead>
                        <TableHead className="font-semibold">
                          Discount %
                        </TableHead>
                        <TableHead className="font-semibold">
                          GST Details
                        </TableHead>
                        <TableHead className="font-semibold">
                          Created & Updated
                        </TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
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
                            <TableCell
                              colSpan={15}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  Loading sales...
                                </p>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ) : currentSales.length === 0 ? (
                          <motion.tr
                            key="no-data"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell
                              colSpan={15}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <motion.div
                                className="flex flex-col items-center justify-center"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No sales found matching your filters.</p>
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
                          currentSales.map((sale, index) => (
                            <motion.tr
                              key={sale.id}
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
                                <div className="font-mono font-medium text-primary">
                                  {sale.invoiceNo}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium">
                                    {sale.customer.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Code: {sale.customer.code}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <Badge variant="outline" className="bg-blue-500">
                                  {sale.area.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium text-sm">
                                    {sale.van.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {sale.van.number}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium text-sm">
                                    {sale.salesman.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Code: {sale.salesman.code}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {formatDateTime(sale.invoiceDate)}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <Badge
                                      variant="outline"
                                      className="font-mono"
                                    >
                                      {sale.items.length} items
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Total Qty:{" "}
                                    {sale.items.reduce(
                                      (sum, item) => sum + item.aQty,
                                      0,
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">
                                    ₹{sale.grossAmount.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700"
                                >
                                  ₹{sale.tax.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-bold text-green-700">
                                  ₹{sale.finalAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {sale.discountPercent > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-700"
                                  >
                                    {sale.discountPercent}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="text-xs text-muted-foreground">
                                  {sale.gstDetails}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="space-y-1">
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-green-400">
                                      Created:
                                    </span>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(sale.createdAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(sale.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSales(sale)}
                                    className="h-8 w-8 hover:bg-green-100"
                                    disabled={isLoading}
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDeleteSales(sale)}
                                    className="h-8 w-8 hover:bg-red-100"
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
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
          {!isLoading && currentSales.length > 0 && totalPages > 1 && (
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
        </div>
      </motion.div>

      {/* Sales Form Modal */}
      <SalesForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingSales={editingSales}
        onSave={handleSaveSales}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <CustomAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        mainText="Delete Sales"
        subText={
          salesToDelete
            ? `Are you sure you want to delete sales "${salesToDelete.invoiceNo}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        nextButtonText="Delete"
        cancelButtonText="Cancel"
        onNext={handleDeleteSales}
        variant="destructive"
        showCancel={true}
        className="sm:max-w-[425px]"
      />
    </>
  );
}

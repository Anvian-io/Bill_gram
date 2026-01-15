import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
import { useNavigate } from "react-router-dom";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../components/FramerVariants";
// Define the type for product data
interface Product {
  id: string;
  bNo: string;
  mfgDate: string | null;
  expDate: string | null;
  barcode: string;
  basicPrice: number;
  openingStock: number;
  mrp: number;
  pRate: number;
  sRate: number;
  margin: number;
  productName: string;
  brand: string;
  hsnCode: string;
  productGroup: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export default function ProductInventory() {
  // Sample data based on the screenshot
  const navigate = useNavigate();
  const initialData: Product[] = [
    {
      id: "1",
      bNo: "1602770024177",
      mfgDate: "2025-01-15",
      expDate: "2026-01-15",
      barcode: "10079",
      basicPrice: 95.0,
      openingStock: 7,
      mrp: 150.0,
      pRate: 95.0,
      sRate: 107.14,
      margin: 12.14,
      productName: "MILKY BAR 5 RS",
      brand: "137 Degrees",
      hsnCode: "18069010",
      productGroup: "ELITE",
      status: "Low Stock",
    },
    {
      id: "2",
      bNo: "1602770024178",
      mfgDate: "2025-02-10",
      expDate: "2026-02-10",
      barcode: "10080",
      basicPrice: 120.0,
      openingStock: 25,
      mrp: 180.0,
      pRate: 120.0,
      sRate: 140.0,
      margin: 20.0,
      productName: "CHOCO DELIGHT",
      brand: "137 Degrees",
      hsnCode: "18069011",
      productGroup: "PREMIUM",
      status: "In Stock",
    },
    {
      id: "3",
      bNo: "1602770024179",
      mfgDate: null,
      expDate: null,
      barcode: "10081",
      basicPrice: 75.0,
      openingStock: 0,
      mrp: 120.0,
      pRate: 75.0,
      sRate: 90.0,
      margin: 15.0,
      productName: "NUTTY CRUNCH",
      brand: "Parle Agro",
      hsnCode: "18069012",
      productGroup: "ELITE",
      status: "Out of Stock",
    },
    {
      id: "4",
      bNo: "1602770024180",
      mfgDate: "2025-03-20",
      expDate: "2026-03-20",
      barcode: "10082",
      basicPrice: 200.0,
      openingStock: 15,
      mrp: 300.0,
      pRate: 200.0,
      sRate: 250.0,
      margin: 50.0,
      productName: "CARAMEL BLAST",
      brand: "137 Degrees",
      hsnCode: "18069013",
      productGroup: "STANDARD",
      status: "In Stock",
    },
    {
      id: "5",
      bNo: "1602770024181",
      mfgDate: "2025-01-05",
      expDate: "2026-01-05",
      barcode: "10083",
      basicPrice: 150.0,
      openingStock: 3,
      mrp: 225.0,
      pRate: 150.0,
      sRate: 175.0,
      margin: 25.0,
      productName: "FRUITY SWIRL",
      brand: "Parle Agro",
      hsnCode: "18069014",
      productGroup: "ELITE",
      status: "Low Stock",
    },
    // Add more sample data for pagination testing
    {
      id: "6",
      bNo: "1602770024182",
      mfgDate: "2025-04-10",
      expDate: "2026-04-10",
      barcode: "10084",
      basicPrice: 85.0,
      openingStock: 12,
      mrp: 130.0,
      pRate: 85.0,
      sRate: 102.0,
      margin: 17.0,
      productName: "VANILLA DREAM",
      brand: "137 Degrees",
      hsnCode: "18069015",
      productGroup: "PREMIUM",
      status: "In Stock",
    },
    {
      id: "7",
      bNo: "1602770024183",
      mfgDate: "2025-05-15",
      expDate: "2026-05-15",
      barcode: "10085",
      basicPrice: 110.0,
      openingStock: 8,
      mrp: 165.0,
      pRate: 110.0,
      sRate: 132.0,
      margin: 22.0,
      productName: "DARK CHOCOLATE",
      brand: "Parle Agro",
      hsnCode: "18069016",
      productGroup: "ELITE",
      status: "Low Stock",
    },
    {
      id: "8",
      bNo: "1602770024184",
      mfgDate: "2025-06-20",
      expDate: "2026-06-20",
      barcode: "10086",
      basicPrice: 95.0,
      openingStock: 20,
      mrp: 142.5,
      pRate: 95.0,
      sRate: 114.0,
      margin: 19.0,
      productName: "MILK CHOCOLATE",
      brand: "137 Degrees",
      hsnCode: "18069017",
      productGroup: "STANDARD",
      status: "In Stock",
    },
    {
      id: "9",
      bNo: "1602770024185",
      mfgDate: null,
      expDate: null,
      barcode: "10087",
      basicPrice: 130.0,
      openingStock: 0,
      mrp: 195.0,
      pRate: 130.0,
      sRate: 156.0,
      margin: 26.0,
      productName: "WHITE CHOCOLATE",
      brand: "Parle Agro",
      hsnCode: "18069018",
      productGroup: "PREMIUM",
      status: "Out of Stock",
    },
    {
      id: "10",
      bNo: "1602770024186",
      mfgDate: "2025-07-25",
      expDate: "2026-07-25",
      barcode: "10088",
      basicPrice: 180.0,
      openingStock: 18,
      mrp: 270.0,
      pRate: 180.0,
      sRate: 216.0,
      margin: 36.0,
      productName: "HAZELNUT DELIGHT",
      brand: "137 Degrees",
      hsnCode: "18069019",
      productGroup: "ELITE",
      status: "In Stock",
    },
  ];

  // State for products and filters
  const [products, setProducts] = useState<Product[]>(initialData);
  const [filters, setFilters] = useState({
    search: "",
    bNo: "",
    barcode: "",
    productName: "",
    brand: "all",
    productGroup: "all",
    minStock: "",
    maxStock: "",
    mfgDateFrom: undefined as Date | undefined,
    mfgDateTo: undefined as Date | undefined,
    expDateFrom: undefined as Date | undefined,
    expDateTo: undefined as Date | undefined,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter products based on all filter criteria
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Global search filter (searches multiple fields)
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !product.productName.toLowerCase().includes(searchLower) &&
        !product.brand.toLowerCase().includes(searchLower) &&
        !product.barcode.toLowerCase().includes(searchLower) &&
        !product.bNo.toLowerCase().includes(searchLower) &&
        !product.hsnCode.toLowerCase().includes(searchLower) &&
        !product.productGroup.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual field filters
      if (filters.bNo && !product.bNo.includes(filters.bNo)) return false;
      if (filters.barcode && !product.barcode.includes(filters.barcode))
        return false;
      if (
        filters.productName &&
        !product.productName
          .toLowerCase()
          .includes(filters.productName.toLowerCase())
      )
        return false;
      if (filters.brand !== "all" && product.brand !== filters.brand)
        return false;
      if (
        filters.productGroup !== "all" &&
        product.productGroup !== filters.productGroup
      )
        return false;
      if (filters.minStock && product.openingStock < Number(filters.minStock))
        return false;
      if (filters.maxStock && product.openingStock > Number(filters.maxStock))
        return false;

      // Manufacturing date filter
      if (filters.mfgDateFrom && product.mfgDate) {
        const mfgDate = new Date(product.mfgDate);
        if (mfgDate < filters.mfgDateFrom) return false;
      }
      if (filters.mfgDateTo && product.mfgDate) {
        const mfgDate = new Date(product.mfgDate);
        if (mfgDate > filters.mfgDateTo) return false;
      }

      // Expiry date filter
      if (filters.expDateFrom && product.expDate) {
        const expDate = new Date(product.expDate);
        if (expDate < filters.expDateFrom) return false;
      }
      if (filters.expDateTo && product.expDate) {
        const expDate = new Date(product.expDate);
        if (expDate > filters.expDateTo) return false;
      }

      return true;
    });
  }, [products, filters]);

  // Calculate paginated data
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage)
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
      bNo: "",
      barcode: "",
      productName: "",
      brand: "all",
      productGroup: "all",
      minStock: "",
      maxStock: "",
      mfgDateFrom: undefined,
      mfgDateTo: undefined,
      expDateFrom: undefined,
      expDateTo: undefined,
    });
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "brand" || filterName === "productGroup" ? "all" : "",
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get unique values for dropdown filters
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)));
  const uniqueGroups = Array.from(new Set(products.map((p) => p.productGroup)));

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredProducts.length
  );

  const handleAddProduct = () => {
    navigate("/product-inventory/new");
  };

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "search" &&
      value &&
      value !== "all" &&
      !(
        value instanceof Date &&
        value.toString() === new Date(undefined as any).toString()
      )
  ).length;

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
                Product Inventory
              </h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Manage and track your product inventory
              </motion.p>
            </div>

            {/* 🔍 Search Bar (between header & buttons) */}
            <motion.div
              className="relative w-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="absolute left-3 top-6 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products by name, brand, barcode, B.No, HSN Code, or group..."
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
                  onClick={handleAddProduct}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  + Add Product
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
                        {/* B.No Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="bNo" className="text-sm font-medium">
                            B.No
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="bNo"
                              placeholder="Enter B.No"
                              value={filters.bNo}
                              onChange={(e) =>
                                handleFilterChange("bNo", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.bNo && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("bNo")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Barcode Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="barcode"
                            className="text-sm font-medium"
                          >
                            Barcode
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="barcode"
                              placeholder="Enter barcode"
                              value={filters.barcode}
                              onChange={(e) =>
                                handleFilterChange("barcode", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.barcode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("barcode")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Product Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="productName"
                            className="text-sm font-medium"
                          >
                            Product Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="productName"
                              placeholder="Enter product name"
                              value={filters.productName}
                              onChange={(e) =>
                                handleFilterChange(
                                  "productName",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            {filters.productName && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("productName")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Brand Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="brand"
                            className="text-sm font-medium"
                          >
                            Brand
                          </Label>
                          <Select
                            value={filters.brand}
                            onValueChange={(value) =>
                              handleFilterChange("brand", value)
                            }
                          >
                            <SelectTrigger id="brand">
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Brands</SelectItem>
                              {uniqueBrands.map((brand) => (
                                <SelectItem key={brand} value={brand}>
                                  {brand}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Product Group Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="productGroup"
                            className="text-sm font-medium"
                          >
                            Product Group
                          </Label>
                          <Select
                            value={filters.productGroup}
                            onValueChange={(value) =>
                              handleFilterChange("productGroup", value)
                            }
                          >
                            <SelectTrigger id="productGroup">
                              <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Groups</SelectItem>
                              {uniqueGroups.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Stock Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Stock Range
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={filters.minStock}
                              onChange={(e) =>
                                handleFilterChange("minStock", e.target.value)
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={filters.maxStock}
                              onChange={(e) =>
                                handleFilterChange("maxStock", e.target.value)
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>

                        {/* Manufacturing Date Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Manufacturing Date
                          </Label>
                          <div className="flex gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-[150px] justify-start text-left font-normal",
                                    !filters.mfgDateFrom &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {filters.mfgDateFrom ? (
                                    format(filters.mfgDateFrom, "dd/MM/yyyy") // Changed from "PPP"
                                  ) : (
                                    <span>From</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={filters.mfgDateFrom}
                                  onSelect={(date) =>
                                    handleFilterChange("mfgDateFrom", date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-[150px] justify-start text-left font-normal",
                                    !filters.mfgDateTo &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {filters.mfgDateTo ? (
                                    format(filters.mfgDateTo, "dd/MM/yyyy") // Changed from "PPP"
                                  ) : (
                                    <span>To</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={filters.mfgDateTo}
                                  onSelect={(date) =>
                                    handleFilterChange("mfgDateTo", date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Expiry Date Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Expiry Date
                          </Label>
                          <div className="flex gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-[150px] justify-start text-left font-normal",
                                    !filters.expDateFrom &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {filters.expDateFrom ? (
                                    format(filters.expDateFrom, "dd/MM/yyyy") // Changed from "PPP"
                                  ) : (
                                    <span>From</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={filters.expDateFrom}
                                  onSelect={(date) =>
                                    handleFilterChange("expDateFrom", date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-[150px] justify-start text-left font-normal",
                                    !filters.expDateTo &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {filters.expDateTo ? (
                                    format(filters.expDateTo, "dd/MM/yyyy") // Changed from "PPP"
                                  ) : (
                                    <span>To</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={filters.expDateTo}
                                  onSelect={(date) =>
                                    handleFilterChange("expDateTo", date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
            Showing {startIndex} to {endIndex} of {filteredProducts.length}{" "}
            products
            {filteredProducts.length !== products.length && " (filtered)"}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Sorted by: <span className="font-medium">Latest Added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Items per page:
              </div>
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
          </div>
        </motion.div>

        {/* Product Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">
                        Product Name
                      </TableHead>
                      <TableHead className="font-semibold">B No.</TableHead>
                      <TableHead className="font-semibold">MFG Date</TableHead>
                      <TableHead className="font-semibold">EXP Date</TableHead>
                      <TableHead className="font-semibold">Barcode</TableHead>
                      <TableHead className="font-semibold">
                        Basic Price
                      </TableHead>
                      <TableHead className="font-semibold">
                        Opening Stock
                      </TableHead>
                      <TableHead className="font-semibold">MRP</TableHead>
                      <TableHead className="font-semibold">P.Rate</TableHead>
                      <TableHead className="font-semibold">S.Rate</TableHead>
                      <TableHead className="font-semibold">Margin</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {paginatedProducts.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell
                            colSpan={13}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Filter className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No products found matching your filters.</p>
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
                        paginatedProducts.map((product, index) => (
                          <motion.tr
                            key={product.id}
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
                              <div>
                                <p className="font-medium">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {product.brand} • {product.hsnCode}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.code
                                className="text-xs bg-secondary px-2 py-1 rounded inline-block"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                {product.bNo}
                              </motion.code>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              {product.mfgDate ? (
                                <span className="text-sm">
                                  {product.mfgDate}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Not set
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              {product.expDate ? (
                                <span className="text-sm">
                                  {product.expDate}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Not set
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge variant="outline" className="font-mono">
                                  {product.barcode}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="font-medium group-hover:bg-secondary/30 cursor-pointer ">
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                ₹{product.basicPrice.toFixed(2)}
                              </motion.span>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <motion.span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    product.openingStock > 10
                                      ? "bg-green-500"
                                      : product.openingStock > 0
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  animate={{
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                  }}
                                />
                                <span
                                  className={
                                    product.openingStock <= 3
                                      ? "text-red-600 font-semibold"
                                      : product.openingStock <= 10
                                      ? "text-yellow-600 font-semibold"
                                      : ""
                                  }
                                >
                                  {product.openingStock}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold group-hover:bg-secondary/30 cursor-pointer">
                              ₹{product.mrp.toFixed(2)}
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              ₹{product.pRate.toFixed(2)}
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              ₹{product.sRate.toFixed(2)}
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                >
                                  ₹{product.margin.toFixed(2)}
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
                                    product.status === "In Stock"
                                      ? "default"
                                      : product.status === "Low Stock"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className={
                                    product.status === "In Stock"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                      : product.status === "Low Stock"
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                                      : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                  }
                                >
                                  {product.status}
                                </Badge>
                              </motion.div>
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
        {filteredProducts.length > 0 && (
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
  );
}

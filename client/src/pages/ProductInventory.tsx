import { useState, useMemo, useEffect } from "react";
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
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  Calendar,
  Plus,
  Package,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Building,
  Percent,
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
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../components/FramerVariants";
import ProductFormModal from "@/components/forms/ProductForm";
import { toast } from "sonner";
import { CustomAlert } from "@/components/custom_ui";
import { productService } from "@/services/productService";
import { type Product, type ProductFormData } from "@/types/product";
import { useActiveLists } from "@/hooks/useActiveLists";
import { useDebounce } from "@/utils/debounce";
import { getFullImageUrl } from "@/utils/imageUtils";

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
    } catch {
      // continue
    }
  }
  return undefined;
};

const formatDateToDisplay = (date: Date | undefined): string => {
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
};

const formatDateForAPI = (date: Date | undefined): string | undefined => {
  if (!date) return undefined;
  return format(date, "yyyy-MM-dd");
};

// Define the API response structure
interface ProductsResponse {
  data: {
    products: Product[];
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

export default function ProductInventory() {
  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Filter state – added from/to dates for mfg and exp
  const [filters, setFilters] = useState({
    search: "",
    productCode: "",
    productBrand: "",
    barcode: "",
    productName: "",
    brand: "all" as string | "all",
    productGroup: "all" as string | "all",
    minStock: "",
    maxStock: "",
    mfgFromDate: undefined as Date | undefined,
    mfgToDate: undefined as Date | undefined,
    expFromDate: undefined as Date | undefined,
    expToDate: undefined as Date | undefined,
    status: "all" as "all" | "active" | "inactive",
    showDeleted: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for immediate input values (before debounce)
  const [searchInput, setSearchInput] = useState<string>("");
  const [productCodeInput, setProductCodeInput] = useState<string>("");
  const [productBrandInput, setProductBrandInput] = useState<string>("");
  const [minStockInput, setMinStockInput] = useState<string>("");
  const [maxStockInput, setMaxStockInput] = useState<string>("");

  // Manufacturing date inputs
  const [mfgFromDateInput, setMfgFromDateInput] = useState<string>("");
  const [mfgToDateInput, setMfgToDateInput] = useState<string>("");

  // Expiry date inputs
  const [expFromDateInput, setExpFromDateInput] = useState<string>("");
  const [expToDateInput, setExpToDateInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetProductCode = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, productCode: value }));
  }, 300);

  const debouncedSetProductBrand = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, productBrand: value }));
  }, 300);

  const debouncedSetMinStock = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, minStock: value }));
  }, 300);

  const debouncedSetMaxStock = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, maxStock: value }));
  }, 300);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const handleProductCodeChange = (value: string) => {
    setProductCodeInput(value);
    debouncedSetProductCode(value);
  };

  const handleProductBrandChange = (value: string) => {
    setProductBrandInput(value);
    debouncedSetProductBrand(value);
  };

  const handleMinStockChange = (value: string) => {
    setMinStockInput(value);
    debouncedSetMinStock(value);
  };

  const handleMaxStockChange = (value: string) => {
    setMaxStockInput(value);
    debouncedSetMaxStock(value);
  };

  // Manufacturing date handlers
  const handleMfgFromDateInputChange = (value: string) => {
    setMfgFromDateInput(value);
    const parsed = parseDateFromString(value);
    setFilters((prev) => ({ ...prev, mfgFromDate: parsed }));
  };
  const handleMfgFromDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, mfgFromDate: date }));
    setMfgFromDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleMfgToDateInputChange = (value: string) => {
    setMfgToDateInput(value);
    const parsed = parseDateFromString(value);
    setFilters((prev) => ({ ...prev, mfgToDate: parsed }));
  };
  const handleMfgToDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, mfgToDate: date }));
    setMfgToDateInput(date ? formatDateToDisplay(date) : "");
  };

  // Expiry date handlers
  const handleExpFromDateInputChange = (value: string) => {
    setExpFromDateInput(value);
    const parsed = parseDateFromString(value);
    setFilters((prev) => ({ ...prev, expFromDate: parsed }));
  };
  const handleExpFromDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, expFromDate: date }));
    setExpFromDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleExpToDateInputChange = (value: string) => {
    setExpToDateInput(value);
    const parsed = parseDateFromString(value);
    setFilters((prev) => ({ ...prev, expToDate: parsed }));
  };
  const handleExpToDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, expToDate: date }));
    setExpToDateInput(date ? formatDateToDisplay(date) : "");
  };

  const { productCompanies, groups } = useActiveLists();

  // Safely handle products data
  const displayProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }
    return products;
  }, [products]);

  // Get product status based on total stock
  const getProductStatus = (
    totalStock: number,
  ): "In Stock" | "Low Stock" | "Out of Stock" => {
    if (totalStock === 0) return "Out of Stock";
    if (totalStock <= 10) return "Low Stock";
    return "In Stock";
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Calculate total opening stock for a product
  const calculateTotalOpeningStock = (product: Product) => {
    if (!product.batches || !Array.isArray(product.batches)) return 0;
    return product.batches.reduce(
      (sum, batch) => sum + (batch.openingStock || 0),
      0,
    );
  };

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add filters
      if (filters.search) params.search = filters.search;
      if (filters.productCode) params.productCode = filters.productCode;
      if (filters.productBrand) params.productBrand = filters.productBrand;
      if (filters.barcode) params.barcode = filters.barcode;
      if (filters.productName) params.productName = filters.productName;
      if (filters.brand !== "all") params.productCompanyId = filters.brand;
      if (filters.productGroup !== "all")
        params.productGroupId = filters.productGroup;
      if (filters.status !== "all") params.status = filters.status === "active";
      if (filters.showDeleted) params.showDeleted = "true";
      if (filters.minStock) params.minStock = filters.minStock;
      if (filters.maxStock) params.maxStock = filters.maxStock;

      // Manufacturing date range
      if (filters.mfgFromDate) {
        params.mfgFromDate = formatDateForAPI(filters.mfgFromDate);
      }
      if (filters.mfgToDate) {
        params.mfgToDate = formatDateForAPI(filters.mfgToDate);
      }

      // Expiry date range
      if (filters.expFromDate) {
        params.expFromDate = formatDateForAPI(filters.expFromDate);
      }
      if (filters.expToDate) {
        params.expToDate = formatDateForAPI(filters.expToDate);
      }

      const response = await productService.getProducts(
        currentPage,
        itemsPerPage,
        params,
      );

      const apiResponse = response as unknown as ProductsResponse;

      if (apiResponse?.data) {
        const productsData = apiResponse.data.products || [];
        const pagination = apiResponse.data.pagination || {};

        setProducts(Array.isArray(productsData) ? productsData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products", {
        description: error.response?.data?.message || "Please try again later",
      });
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.productCode,
    filters.productBrand,
    filters.barcode,
    filters.productName,
    filters.brand,
    filters.productGroup,
    filters.minStock,
    filters.maxStock,
    filters.mfgFromDate,
    filters.mfgToDate,
    filters.expFromDate,
    filters.expToDate,
    filters.status,
    filters.showDeleted,
    itemsPerPage,
  ]);

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
      productCode: "",
      productBrand: "",
      barcode: "",
      productName: "",
      brand: "all",
      productGroup: "all",
      minStock: "",
      maxStock: "",
      mfgFromDate: undefined,
      mfgToDate: undefined,
      expFromDate: undefined,
      expToDate: undefined,
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setProductCodeInput("");
    setProductBrandInput("");
    setMinStockInput("");
    setMaxStockInput("");
    setMfgFromDateInput("");
    setMfgToDateInput("");
    setExpFromDateInput("");
    setExpToDateInput("");
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "brand" ||
        filterName === "productGroup" ||
        filterName === "status"
          ? "all"
          : filterName === "showDeleted"
            ? false
            : filterName === "mfgFromDate" ||
                filterName === "mfgToDate" ||
                filterName === "expFromDate" ||
                filterName === "expToDate"
              ? undefined
              : "",
    }));

    // Also clear the corresponding input state
    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "productCode":
        setProductCodeInput("");
        break;
      case "productBrand":
        setProductBrandInput("");
        break;
      case "minStock":
        setMinStockInput("");
        break;
      case "maxStock":
        setMaxStockInput("");
        break;
      case "mfgFromDate":
        setMfgFromDateInput("");
        break;
      case "mfgToDate":
        setMfgToDateInput("");
        break;
      case "expFromDate":
        setExpFromDateInput("");
        break;
      case "expToDate":
        setExpToDateInput("");
        break;
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get unique values for dropdown filters
  const uniqueBrands = productCompanies;
  const uniqueGroups = groups;

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle Add Product - Open Modal
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Handle Edit Product
  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Handle Delete Product
  const confirmDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (productToDelete) {
      try {
        await productService.deleteProduct(productToDelete.id);
        toast.success("Product deleted successfully!");
        fetchProducts(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete product", {
          description: error.response?.data?.message || "Please try again",
        });
      } finally {
        setProductToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Handle View Product
  const handleViewProduct = async (product: Product) => {
    try {
      const productDetail = await productService.getProduct(product.id);
      setEditingProduct(productDetail);
      setIsModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to load product details", {
        description: error.response?.data?.message || "Please try again",
      });
    }
  };

  // Handle Save Product (from modal)
  const handleSaveProduct = async (data: ProductFormData, id?: number) => {
    setIsSubmitting(true);

    try {
      if (id) {
        await productService.updateProduct(id, data);
        toast.success("Product updated successfully!");
      } else {
        await productService.createProduct(data);
        toast.success("Product created successfully!");
      }

      setIsModalOpen(false);
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product", {
        description: error.response?.data?.message || "Please try again",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchProducts();
    toast.info("Refreshing product data...");
  };

  // Active filters count – now includes the new date range fields
  const activeFiltersCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        value &&
        value !== "all" &&
        !(key === "showDeleted" && !value) &&
        !(
          key === "mfgFromDate" ||
          key === "mfgToDate" ||
          key === "expFromDate" ||
          key === "expToDate"
        ) &&
        !(value instanceof Date),
    ).length +
    (filters.mfgFromDate ? 1 : 0) +
    (filters.mfgToDate ? 1 : 0) +
    (filters.expFromDate ? 1 : 0) +
    (filters.expToDate ? 1 : 0);

  return (
    <>
      <motion.div
        className="min-h-screen bg-background p-3"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-8xl mx-auto">
          {/* Header (unchanged) */}
          <motion.div
            className="flex flex-col gap-6 mb-6 w-full"
            variants={headerVariants}
          >
            <div className="flex justify-between gap-4">
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
                  placeholder="Search products by name, brand, barcode, HSN Code, or group..."
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
                    onClick={handleAddProduct}
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
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
                          {/* Product Code Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="productCode"
                              className="text-sm font-medium"
                            >
                              Product Code
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="productCode"
                                placeholder="Enter product code"
                                value={productCodeInput}
                                onChange={(e) =>
                                  handleProductCodeChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              {productCodeInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("productCode")}
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Product Brand Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="productBrand"
                              className="text-sm font-medium"
                            >
                              Product Brand
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="productBrand"
                                placeholder="Enter product brand"
                                value={productBrandInput}
                                onChange={(e) =>
                                  handleProductBrandChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              {productBrandInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("productBrand")}
                                  disabled={isLoading}
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
                              disabled={isLoading}
                            >
                              <SelectTrigger id="brand">
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {uniqueBrands.map((company) => (
                                  <SelectItem
                                    key={company.id}
                                    value={company.id.toString()}
                                  >
                                    {company.name}
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
                              disabled={isLoading}
                            >
                              <SelectTrigger id="productGroup">
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Groups</SelectItem>
                                {uniqueGroups.map((group) => (
                                  <SelectItem
                                    key={group.id}
                                    value={group.id.toString()}
                                  >
                                    {group.name}
                                  </SelectItem>
                                ))}
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
                                <SelectItem value="inactive">
                                  Inactive
                                </SelectItem>
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
                                value={minStockInput}
                                onChange={(e) =>
                                  handleMinStockChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Max"
                                type="number"
                                value={maxStockInput}
                                onChange={(e) =>
                                  handleMaxStockChange(e.target.value)
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Manufacturing Date Range */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Mfg Date From
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={mfgFromDateInput}
                                  onChange={(e) =>
                                    handleMfgFromDateInputChange(e.target.value)
                                  }
                                  placeholder="dd/mm/yyyy"
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
                                      selected={filters.mfgFromDate}
                                      onSelect={handleMfgFromDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {mfgFromDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("mfgFromDate")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Mfg Date To
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={mfgToDateInput}
                                  onChange={(e) =>
                                    handleMfgToDateInputChange(e.target.value)
                                  }
                                  placeholder="dd/mm/yyyy"
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
                                      selected={filters.mfgToDate}
                                      onSelect={handleMfgToDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {mfgToDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("mfgToDate")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Expiry Date Range */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Exp Date From
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={expFromDateInput}
                                  onChange={(e) =>
                                    handleExpFromDateInputChange(e.target.value)
                                  }
                                  placeholder="dd/mm/yyyy"
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
                                      selected={filters.expFromDate}
                                      onSelect={handleExpFromDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {expFromDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("expFromDate")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Exp Date To
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={expToDateInput}
                                  onChange={(e) =>
                                    handleExpToDateInputChange(e.target.value)
                                  }
                                  placeholder="dd/mm/yyyy"
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
                                      selected={filters.expToDate}
                                      onSelect={handleExpToDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {expToDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("expToDate")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Show Deleted Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Show Deleted
                            </Label>
                            <div className="flex items-center gap-3 pt-2">
                              <input
                                type="checkbox"
                                id="showDeleted"
                                checked={filters.showDeleted}
                                onChange={(e) =>
                                  handleFilterChange(
                                    "showDeleted",
                                    e.target.checked,
                                  )
                                }
                                disabled={isLoading}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor="showDeleted"
                                className={`text-sm cursor-pointer ${
                                  filters.showDeleted
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {filters.showDeleted
                                  ? "Showing Deleted"
                                  : "Hide Deleted"}
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
              Showing {startIndex} to {endIndex} of {totalItems} products
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

          {/* Product Table (unchanged) */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold">
                          Description
                        </TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">
                          Carton Unit
                        </TableHead>
                        <TableHead className="font-semibold">
                          GST Rate
                        </TableHead>
                        <TableHead className="font-semibold">Batches</TableHead>
                        <TableHead className="font-semibold">
                          Total Stock
                        </TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">
                          Created & Updated
                        </TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
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
                            <TableCell
                              colSpan={10}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  Loading products...
                                </p>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ) : displayProducts.length === 0 ? (
                          <motion.tr
                            key="no-data"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell
                              colSpan={10}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <motion.div
                                className="flex flex-col items-center justify-center"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <Package className="h-12 w-12 text-muted-foreground/50 mb-2" />
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
                          displayProducts.map((product, index) => {
                            const totalOpeningStock =
                              product.totalOpeningStock ||
                              calculateTotalOpeningStock(product);
                            const status = getProductStatus(totalOpeningStock);
                            const batchCount =
                              product.batches?.length ||
                              product._count?.batches ||
                              0;

                            return (
                              <motion.tr
                                key={product.id}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                variants={rowVariants}
                                className="group border"
                                layout
                                transition={{
                                  layout: { duration: 0.3 },
                                }}
                              >
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    {product.mainImage ? (
                                      <motion.div
                                        className="relative h-12 w-12 rounded-md overflow-hidden"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <img
                                          src={getFullImageUrl(
                                            product.mainImage,
                                          )}
                                          alt={product.productBrand}
                                          className="h-full w-full object-cover"
                                        />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        className="h-12 w-12 rounded-md bg-secondary flex items-center justify-center"
                                        whileHover={{ rotate: 5 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                      </motion.div>
                                    )}
                                    <div>
                                      <p className="font-medium">
                                        {product.productBrand}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {product.productCode}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer max-w-xs">
                                  <div className="text-sm text-muted-foreground h-16 overflow-y-auto prose prose-sm text-wrap w-60">
                                    {product.description || "No description"}
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  {product.productCompany ? (
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {product.productCompany.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  {product.cartonPack ? (
                                    <motion.div
                                      variants={badgeVariants}
                                      whileHover="hover"
                                    >
                                      <Badge
                                        variant="outline"
                                        className="font-mono"
                                      >
                                        {product.cartonPack}
                                      </Badge>
                                    </motion.div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {product.gstRate || 0}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                    <motion.div
                                      variants={badgeVariants}
                                      whileHover="hover"
                                    >
                                      <Badge
                                        variant="outline"
                                        className="font-mono"
                                      >
                                        {batchCount}
                                      </Badge>
                                    </motion.div>
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <motion.span
                                      className={`inline-block w-2 h-2 rounded-full ${
                                        totalOpeningStock > 10
                                          ? "bg-green-500"
                                          : totalOpeningStock > 0
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
                                        totalOpeningStock <= 3
                                          ? "text-red-600 font-semibold"
                                          : totalOpeningStock <= 10
                                            ? "text-yellow-600 font-semibold"
                                            : ""
                                      }
                                    >
                                      {totalOpeningStock}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <motion.div
                                    variants={badgeVariants}
                                    whileHover="hover"
                                  >
                                    <Badge
                                      variant={
                                        status === "In Stock"
                                          ? "default"
                                          : status === "Low Stock"
                                            ? "secondary"
                                            : "destructive"
                                      }
                                      className={
                                        status === "In Stock"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                          : status === "Low Stock"
                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                      }
                                    >
                                      {status}
                                    </Badge>
                                  </motion.div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-green-400">
                                        Created:
                                      </span>
                                      <p className="text-xs text-muted-foreground ml-1">
                                        {formatDateTime(product.createdAt)}
                                      </p>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-orange-400">
                                        Updated:
                                      </span>
                                      <p className="text-xs text-muted-foreground ml-1">
                                        {formatDateTime(product.updatedAt)}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewProduct(product)}
                                      className="h-8 w-8 hover:bg-blue-100"
                                      disabled={isLoading}
                                    >
                                      <Eye className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditProduct(product)}
                                      className="h-8 w-8 hover:bg-green-100"
                                      disabled={isLoading}
                                    >
                                      <Edit className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        confirmDeleteProduct(product)
                                      }
                                      className="h-8 w-8 hover:bg-red-100"
                                      disabled={isLoading || product.deleted}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
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
          {!isLoading && displayProducts.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
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

      {/* Product Form Modal */}
      <ProductFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingProduct={editingProduct}
        onSave={handleSaveProduct}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <CustomAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        mainText="Delete Product"
        subText={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.productBrand}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        nextButtonText="Delete"
        cancelButtonText="Cancel"
        onNext={handleDeleteProduct}
        variant="destructive"
        showCancel={true}
        className="sm:max-w-106.25"
      />
    </>
  );
}

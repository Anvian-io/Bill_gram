import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { FilterStatusField } from "@/components/custom_ui/FilterStatusField";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomDateInput } from "@/components/custom_ui/CustomDateInput";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  badgeVariants,
} from "../FramerVariants";
import ProductFormModal from "@/components/forms/ProductForm";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { CustomAlert } from "@/components/custom_ui";
import { productService } from "@/services/productService";
import { type Product, type ProductFormData } from "@/types/product";
import { useActiveLists } from "@/hooks/useActiveLists";
import { useDebounce } from "@/utils/debounce";
import { getFullImageUrl } from "@/utils/imageUtils";
import { CheckIsExpanded } from "@/utils/commonHelper";

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
  const { layoutMode } = useTheme();
  const navigate = useNavigate();
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
    mfgFromDate: null as string | null,
    mfgToDate: null as string | null,
    expFromDate: null as string | null,
    expToDate: null as string | null,
    status: "all" as "all" | "active" | "inactive",
    showDeleted: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Local state for immediate input values (before debounce)
  const [searchInput, setSearchInput] = useState<string>("");
  const [productCodeInput, setProductCodeInput] = useState<string>("");
  const [productBrandInput, setProductBrandInput] = useState<string>("");
  const [minStockInput, setMinStockInput] = useState<string>("");
  const [maxStockInput, setMaxStockInput] = useState<string>("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [productGroupOpen, setProductGroupOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showSearchBar) {
      searchInputRef.current?.focus();
    }
  }, [showSearchBar]);

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
        params.mfgFromDate = filters.mfgFromDate;
      }
      if (filters.mfgToDate) {
        params.mfgToDate = filters.mfgToDate;
      }

      // Expiry date range
      if (filters.expFromDate) {
        params.expFromDate = filters.expFromDate;
      }
      if (filters.expToDate) {
        params.expToDate = filters.expToDate;
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
      mfgFromDate: null,
      mfgToDate: null,
      expFromDate: null,
      expToDate: null,
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setProductCodeInput("");
    setProductBrandInput("");
    setMinStockInput("");
    setMaxStockInput("");
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
              ? null
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

  const getBrandLabel = (brandId: string) => {
    if (brandId === "all") return "";
    return uniqueBrands.find((b) => b.id.toString() === brandId)?.name || "";
  };

  const getGroupLabel = (groupId: string) => {
    if (groupId === "all") return "";
    return uniqueGroups.find((g) => g.id.toString() === groupId)?.name || "";
  };

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
        void refreshActiveLists();
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

      void refreshActiveLists();
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
        ),
    ).length +
    (filters.mfgFromDate ? 1 : 0) +
    (filters.mfgToDate ? 1 : 0) +
    (filters.expFromDate ? 1 : 0) +
    (filters.expToDate ? 1 : 0);

  return (
    <>
      <motion.div
        className="min-h-screen bg-background p-3 pb-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div
          className={`mx-auto ${
            CheckIsExpanded()
              ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-9xl"
              : "max-w-9xl lg:max-w-5xl xl:max-w-8xl 2xl:max-w-10xl"
          }`}
        >
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
                          <div>
                            <div className="flex gap-2">
                              <Input
                                id="productCode"
                                placeholder="Product Code"
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
                          <div>
                            <div className="flex gap-2">
                              <Input
                                id="productBrand"
                                placeholder="Product Brand"
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
                          <div>
                            <InlineSearchField
                              open={brandOpen}
                              onOpenChange={setBrandOpen}
                              displayValue={getBrandLabel(filters.brand)}
                              placeholder="Brand"
                              emptyMessage="No brand found."
                              disabled={isLoading}
                            >
                              <CommandGroup>
                                <CommandItem
                                  value="all brands"
                                  onSelect={() => {
                                    handleFilterChange("brand", "all");
                                    setBrandOpen(false);
                                  }}
                                >
                                  All Brands
                                </CommandItem>
                                {uniqueBrands.map((company) => (
                                  <CommandItem
                                    key={company.id}
                                    value={`${company.id} ${company.name}`}
                                    onSelect={() => {
                                      handleFilterChange(
                                        "brand",
                                        company.id.toString(),
                                      );
                                      setBrandOpen(false);
                                    }}
                                  >
                                    {company.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </InlineSearchField>
                          </div>

                          {/* Product Group Filter */}
                          <div>
                            <InlineSearchField
                              open={productGroupOpen}
                              onOpenChange={setProductGroupOpen}
                              displayValue={getGroupLabel(filters.productGroup)}
                              placeholder="Product Group"
                              emptyMessage="No group found."
                              disabled={isLoading}
                            >
                              <CommandGroup>
                                <CommandItem
                                  value="all groups"
                                  onSelect={() => {
                                    handleFilterChange("productGroup", "all");
                                    setProductGroupOpen(false);
                                  }}
                                >
                                  All Groups
                                </CommandItem>
                                {uniqueGroups.map((group) => (
                                  <CommandItem
                                    key={group.id}
                                    value={`${group.id} ${group.name}`}
                                    onSelect={() => {
                                      handleFilterChange(
                                        "productGroup",
                                        group.id.toString(),
                                      );
                                      setProductGroupOpen(false);
                                    }}
                                  >
                                    {group.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </InlineSearchField>
                          </div>

                          {/* Status Filter */}
                          <div>
                            <FilterStatusField
                              value={filters.status}
                              onValueChange={(value) =>
                                handleFilterChange("status", value)
                              }
                              disabled={isLoading}
                            />
                          </div>

                          {/* Stock Range Filter */}
                          <div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Min Stock"
                                type="number"
                                value={minStockInput}
                                onChange={(e) =>
                                  handleMinStockChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Max Stock"
                                type="number"
                                value={maxStockInput}
                                onChange={(e) =>
                                  handleMaxStockChange(e.target.value)
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <CustomDateInput
                            value={filters.mfgFromDate}
                            onChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                mfgFromDate: value,
                              }))
                            }
                            placeholder="Mfg Date From"
                            disabled={isLoading}
                          />

                          <CustomDateInput
                            value={filters.mfgToDate}
                            onChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                mfgToDate: value,
                              }))
                            }
                            placeholder="Mfg Date To"
                            disabled={isLoading}
                          />

                          <CustomDateInput
                            value={filters.expFromDate}
                            onChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                expFromDate: value,
                              }))
                            }
                            placeholder="Exp Date From"
                            disabled={isLoading}
                          />

                          <CustomDateInput
                            value={filters.expToDate}
                            onChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                expToDate: value,
                              }))
                            }
                            placeholder="Exp Date To"
                            disabled={isLoading}
                          />

                          {/* Show Deleted Filter */}
                          <div>
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
                <div className="overflow-x-auto w-full">
                  <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
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

      {/* Fixed bottom-left search */}
      <div className="fixed bottom-6 left-20 z-50 flex items-center gap-2">
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search products by name, brand..."
                className="w-64 sm:w-80 pl-10 pr-10 h-12 rounded-full shadow-xl bg-background"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isLoading}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full"
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
          )}
        </AnimatePresence>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl bg-background"
          onClick={() => setShowSearchBar((prev) => !prev)}
          disabled={isLoading}
          aria-label={showSearchBar ? "Close search" : "Search products"}
        >
          {showSearchBar ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Fixed bottom-right actions */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl bg-background"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh products"
        >
          <RefreshCw
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl bg-primary hover:bg-primary/90"
          onClick={handleAddProduct}
          disabled={isLoading}
          aria-label="Add product"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

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

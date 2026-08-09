import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  Search,
  X,
  Plus,
  Package,
  RefreshCw,
  Image as ImageIcon,
  Building,
  Info,
  Lock,
  Unlock,
  Filter,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { ItemsPerPageSelect } from "@/components/custom_ui/ItemsPerPageSelect";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { FilterStatusField } from "@/components/custom_ui/FilterStatusField";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function DateInfoBadge({
  createdAt,
  updatedAt,
  formatDateTime,
}: {
  createdAt: string;
  updatedAt: string;
  formatDateTime: (dateString: string) => string;
}) {
  return (
    <div className="relative group/info inline-block">
      <Badge
        variant="outline"
        className="text-xs cursor-default gap-1 px-2 py-0.5"
      >
        <Info className="h-3 w-3" />
        Info
      </Badge>
      <div className="pointer-events-none absolute z-50 hidden group-hover/info:block bottom-full left-0 mb-2 w-48">
        <Card className="shadow-lg border bg-popover">
          <CardContent className="p-3 space-y-2">
            <div>
              <span className="text-xs font-medium text-green-500">
                Created:
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(createdAt)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-orange-500">
                Updated:
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProductInventory() {
  const { layoutMode } = useTheme();
  const [, setSearchParams] = useSearchParams();
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
    description: "",
    saleUnit: "all" as string | "all",
    purchaseUnit: "all" as string | "all",
    hsnSacCode: "",
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

  // Local state for immediate input values (before debounce)
  const [searchInput, setSearchInput] = useState<string>("");
  const [productCodeInput, setProductCodeInput] = useState<string>("");
  const [productBrandInput, setProductBrandInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [hsnSacCodeInput, setHsnSacCodeInput] = useState<string>("");
  const [minStockInput, setMinStockInput] = useState<string>("");
  const [maxStockInput, setMaxStockInput] = useState<string>("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [saleUnitOpen, setSaleUnitOpen] = useState(false);
  const [purchaseUnitOpen, setPurchaseUnitOpen] = useState(false);
  const [productGroupOpen, setProductGroupOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showMainFilter, setShowMainFilter] = useState(false);
  const [lockingProductId, setLockingProductId] = useState<number | null>(null);
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

  const debouncedSetDescription = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, description: value }));
  }, 300);

  const debouncedSetHsnSacCode = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, hsnSacCode: value }));
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

  const handleDescriptionChange = (value: string) => {
    setDescriptionInput(value);
    debouncedSetDescription(value);
  };

  const handleHsnSacCodeChange = (value: string) => {
    setHsnSacCodeInput(value);
    debouncedSetHsnSacCode(value);
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

  const { productCompanies, groups, units } = useActiveLists();

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
      if (filters.description) params.description = filters.description;
      if (filters.saleUnit !== "all") params.saleUnit = filters.saleUnit;
      if (filters.purchaseUnit !== "all")
        params.purchaseUnit = filters.purchaseUnit;
      if (filters.hsnSacCode) params.hsnSacCode = filters.hsnSacCode;
      if (filters.barcode) params.barcode = filters.barcode;
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
    filters.description,
    filters.saleUnit,
    filters.purchaseUnit,
    filters.hsnSacCode,
    filters.barcode,
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
      description: "",
      saleUnit: "all",
      purchaseUnit: "all",
      hsnSacCode: "",
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
    setDescriptionInput("");
    setHsnSacCodeInput("");
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
        filterName === "status" ||
        filterName === "saleUnit" ||
        filterName === "purchaseUnit"
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
      case "description":
        setDescriptionInput("");
        break;
      case "hsnSacCode":
        setHsnSacCodeInput("");
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

  const getUnitSymbol = (unitValue: string | null | undefined) => {
    if (!unitValue) return null;
    const unit = units.find((u) => u.id.toString() === unitValue);
    return unit?.symbol || unitValue;
  };

  const getUnitFilterLabel = (unitId: string) => {
    if (unitId === "all") return "";
    const unit = units.find((u) => u.id.toString() === unitId);
    return unit ? unit.symbol : "";
  };

  const getProductDisplayName = (product: Product) =>
    product.productShortName || product.productBrand || product.productCode;

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle Add Product - navigate to add product page
  const handleAddProduct = () => {
    setSearchParams({ id: "new" }, { replace: true });
  };

  // Handle Edit Product
  const handleEditProduct = async (product: Product) => {
    setSearchParams({ id: product.id.toString() }, { replace: true });
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
    // toast.info("Refreshing product data...");
  };

  const handleToggleLock = async (product: Product) => {
    const nextLocked = !product.isLocked;
    setLockingProductId(product.id);
    try {
      const updated = await productService.toggleProductLock(
        product.id,
        nextLocked,
      );
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, isLocked: updated.isLocked }
            : item,
        ),
      );
      toast.success(
        nextLocked
          ? "Product locked successfully"
          : "Product unlocked successfully",
      );
    } catch (error: any) {
      toast.error("Failed to update product lock", {
        description: error.message || "Please try again",
      });
    } finally {
      setLockingProductId(null);
    }
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
        className="min-h-screen bg-background p-2 pb-24"
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
          {/* Toolbar */}
          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-1"
            data-slot="table-toolbar"
            variants={itemVariants}
          >
            <p className="text-sm text-muted-foreground">
              Showing {startIndex} to {endIndex} of {totalItems} products
              {activeFiltersCount > 0 && " (filtered)"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Total products:{" "}
                <span className="font-medium text-foreground">
                  {totalItems}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                onClick={() => setShowMainFilter((prev) => !prev)}
                disabled={isLoading}
              >
                <Filter className="h-4 w-4" />
                {showMainFilter ? "Hide Main Filter" : "Show Main Filter"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-3"
                onClick={handleAddProduct}
                disabled={isLoading}
                aria-label="Add product"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh products"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Items per page:
                </div>
                <ItemsPerPageSelect
                  value={itemsPerPage}
                  onChange={setItemsPerPage}
                  disabled={isLoading}
                />
              </div>
            </div>
          </motion.div>

          {/* Main Filter Section */}
          <AnimatePresence>
            {showMainFilter && (
              <motion.div
                className="mb-4"
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-1">
                    <div className="flex flex-col gap-4 p-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                              {filters.showDeleted
                                ? "Showing Deleted"
                                : "Hide Deleted"}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Table */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <Table
                    className={cn(
                      "table-fixed",
                      layoutMode === "classic" && "classic-table",
                    )}
                  >
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead className="font-semibold w-[180px] max-w-[180px] whitespace-normal text-center">
                          Product
                        </TableHead>
                        <TableHead className="font-semibold w-[128px] max-w-[128px] whitespace-normal text-center">
                          Description
                        </TableHead>
                        <TableHead className="font-semibold w-[140px] max-w-[140px] whitespace-normal text-center">
                          Company
                        </TableHead>
                        <TableHead className="font-semibold min-w-[110px] text-center">
                          Sale Unit
                        </TableHead>
                        <TableHead className="font-semibold min-w-[110px] text-center">
                          Purchase Unit
                        </TableHead>
                        <TableHead className="font-semibold min-w-[120px] text-center">
                          HSN/SAC Code
                        </TableHead>
                        <TableHead className="font-semibold min-w-[130px] text-center">
                          Total Stock
                        </TableHead>
                        <TableHead className="font-semibold w-[96px] max-w-[96px] whitespace-normal px-1 text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold w-[72px] max-w-[72px] px-2 text-center">
                          Info
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableHead className="py-2 w-[180px] max-w-[180px] whitespace-normal">
                          <div className="space-y-1">
                            {/* <Input
                              placeholder="Brand"
                              value={productBrandInput}
                              onChange={(e) =>
                                handleProductBrandChange(e.target.value)
                              }
                              className="h-8 text-xs font-normal"
                              disabled={isLoading}
                            /> */}
                            <Input
                              placeholder="Code"
                              value={productCodeInput}
                              onChange={(e) =>
                                handleProductCodeChange(e.target.value)
                              }
                              className="h-8 text-xs font-normal"
                              disabled={isLoading}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="py-2 w-[128px] max-w-[128px] whitespace-normal">
                          <Input
                            placeholder="Description"
                            value={descriptionInput}
                            onChange={(e) =>
                              handleDescriptionChange(e.target.value)
                            }
                            className="h-8 text-xs font-normal"
                            disabled={isLoading}
                          />
                        </TableHead>
                        <TableHead className="py-2 w-[140px] max-w-[140px] whitespace-normal">
                          <InlineSearchField
                            open={brandOpen}
                            onOpenChange={setBrandOpen}
                            displayValue={getBrandLabel(filters.brand)}
                            placeholder="Company"
                            emptyMessage="No company found."
                            disabled={isLoading}
                            inputClassName="h-8 text-xs"
                          >
                            <CommandGroup>
                              <CommandItem
                                value="all brands"
                                onSelect={() => {
                                  handleFilterChange("brand", "all");
                                  setBrandOpen(false);
                                }}
                              >
                                All Companies
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
                        </TableHead>
                        <TableHead className="py-2 min-w-[110px]">
                          <InlineSearchField
                            open={saleUnitOpen}
                            onOpenChange={setSaleUnitOpen}
                            displayValue={getUnitFilterLabel(filters.saleUnit)}
                            placeholder="Sale Unit"
                            emptyMessage="No unit found."
                            disabled={isLoading}
                            inputClassName="h-8 text-xs"
                          >
                            <CommandGroup>
                              <CommandItem
                                value="all sale units"
                                onSelect={() => {
                                  handleFilterChange("saleUnit", "all");
                                  setSaleUnitOpen(false);
                                }}
                              >
                                All Units
                              </CommandItem>
                              {units.map((unit) => (
                                <CommandItem
                                  key={unit.id}
                                  value={`${unit.id} ${unit.symbol} ${unit.name}`}
                                  onSelect={() => {
                                    handleFilterChange(
                                      "saleUnit",
                                      unit.id.toString(),
                                    );
                                    setSaleUnitOpen(false);
                                  }}
                                >
                                  {unit.symbol} ({unit.name})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </InlineSearchField>
                        </TableHead>
                        <TableHead className="py-2 min-w-[110px]">
                          <InlineSearchField
                            open={purchaseUnitOpen}
                            onOpenChange={setPurchaseUnitOpen}
                            displayValue={getUnitFilterLabel(
                              filters.purchaseUnit,
                            )}
                            placeholder="Purchase Unit"
                            emptyMessage="No unit found."
                            disabled={isLoading}
                            inputClassName="h-8 text-xs"
                          >
                            <CommandGroup>
                              <CommandItem
                                value="all purchase units"
                                onSelect={() => {
                                  handleFilterChange("purchaseUnit", "all");
                                  setPurchaseUnitOpen(false);
                                }}
                              >
                                All Units
                              </CommandItem>
                              {units.map((unit) => (
                                <CommandItem
                                  key={unit.id}
                                  value={`${unit.id} ${unit.symbol} ${unit.name}`}
                                  onSelect={() => {
                                    handleFilterChange(
                                      "purchaseUnit",
                                      unit.id.toString(),
                                    );
                                    setPurchaseUnitOpen(false);
                                  }}
                                >
                                  {unit.symbol} ({unit.name})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </InlineSearchField>
                        </TableHead>
                        <TableHead className="py-2 min-w-[120px]">
                          <Input
                            placeholder="HSN/SAC Code"
                            value={hsnSacCodeInput}
                            onChange={(e) =>
                              handleHsnSacCodeChange(e.target.value)
                            }
                            className="h-8 text-xs font-normal"
                            disabled={isLoading}
                          />
                        </TableHead>
                        <TableHead className="py-2 min-w-[130px]">
                          <div className="flex gap-1">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={minStockInput}
                              onChange={(e) =>
                                handleMinStockChange(e.target.value)
                              }
                              className="h-8 text-xs font-normal"
                              disabled={isLoading}
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={maxStockInput}
                              onChange={(e) =>
                                handleMaxStockChange(e.target.value)
                              }
                              className="h-8 text-xs font-normal"
                              disabled={isLoading}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="py-2 w-[96px] max-w-[96px] px-1" />
                        <TableHead className="py-2 w-[72px] max-w-[72px] px-2" />
                        <TableHead className="py-2" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                          <TableRow>
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
                          </TableRow>
                        ) : displayProducts.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No products found matching your filters.</p>
                                  <Button
                                    variant="link"
                                    onClick={clearFilters}
                                    className="mt-2"
                                  >
                                    Clear all filters
                                  </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayProducts.map((product, index) => {
                            const totalOpeningStock =
                              product.totalOpeningStock ||
                              calculateTotalOpeningStock(product);
                            const status = getProductStatus(totalOpeningStock);
                            const productDisplayName =
                              getProductDisplayName(product);

                            return (
                              <TableRow
                                key={product.id}
                                className="group border"
                              >
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[180px] max-w-[180px] whitespace-normal align-top">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {product.mainImage ? (
                                      <motion.div
                                        className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <img
                                          src={getFullImageUrl(
                                            product.mainImage,
                                          )}
                                          alt={productDisplayName}
                                          className="h-full w-full object-cover"
                                        />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        className="h-12 w-12 shrink-0 rounded-md bg-secondary flex items-center justify-center"
                                        whileHover={{ rotate: 5 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                      </motion.div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className="font-medium truncate"
                                        title={productDisplayName}
                                      >
                                        {productDisplayName}
                                      </p>
                                      <p
                                        className="text-xs text-muted-foreground truncate"
                                        title={product.productCode}
                                      >
                                        {product.productCode}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[128px] max-w-[128px] whitespace-normal align-top">
                                  <div className="text-sm text-muted-foreground max-h-10 overflow-y-auto break-words [overflow-wrap:anywhere] w-full leading-snug">
                                    {product.description || "No description"}
                                  </div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[140px] max-w-[140px] whitespace-normal align-top">
                                  {product.productCompany ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      <span
                                        className="text-sm truncate"
                                        title={product.productCompany.name}
                                      >
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
                                  {getUnitSymbol(product.saleUnit) ? (
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-xs"
                                    >
                                      {getUnitSymbol(product.saleUnit)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  {getUnitSymbol(product.purchaseUnit) ? (
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-xs"
                                    >
                                      {getUnitSymbol(product.purchaseUnit)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                  <code className="text-sm font-mono">
                                    {product.hsnSacCode || "-"}
                                  </code>
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
                                <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[96px] max-w-[96px] whitespace-normal px-1 align-top">
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
                                      className={cn(
                                        "text-[10px] px-1.5 py-0.5 whitespace-normal text-center leading-tight",
                                        status === "In Stock"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                          : status === "Low Stock"
                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400",
                                      )}
                                    >
                                      {status}
                                    </Badge>
                                  </motion.div>
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30 w-[72px] max-w-[72px] px-2">
                                  <DateInfoBadge
                                    createdAt={product.createdAt}
                                    updatedAt={product.updatedAt}
                                    formatDateTime={formatDateTime}
                                  />
                                </TableCell>
                                <TableCell className="group-hover:bg-secondary/30">
                                  <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-2 py-0.5 shrink-0",
                                        product.isLocked ||
                                          product.deleted ||
                                          isLoading
                                          ? "opacity-50 cursor-not-allowed"
                                          : "cursor-pointer hover:bg-green-100 text-green-700 border-green-200",
                                      )}
                                      onClick={() => {
                                        if (
                                          !product.isLocked &&
                                          !product.deleted &&
                                          !isLoading
                                        ) {
                                          handleEditProduct(product);
                                        }
                                      }}
                                    >
                                      edit
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-2 py-0.5 shrink-0",
                                        product.isLocked ||
                                          product.deleted ||
                                          isLoading
                                          ? "opacity-50 cursor-not-allowed"
                                          : "cursor-pointer hover:bg-red-100 text-red-700 border-red-200",
                                      )}
                                      onClick={() => {
                                        if (
                                          !product.isLocked &&
                                          !product.deleted &&
                                          !isLoading
                                        ) {
                                          confirmDeleteProduct(product);
                                        }
                                      }}
                                    >
                                      delete
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-2 py-0.5 cursor-pointer gap-1 shrink-0",
                                        product.isLocked
                                          ? "hover:bg-amber-100 text-amber-700 border-amber-200"
                                          : "hover:bg-secondary text-muted-foreground",
                                      )}
                                      onClick={() => handleToggleLock(product)}
                                    >
                                      {lockingProductId === product.id ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : product.isLocked ? (
                                        <Unlock className="h-3 w-3" />
                                      ) : (
                                        <Lock className="h-3 w-3" />
                                      )}
                                      {product.isLocked ? "unlock" : "lock"}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
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
            ? `Are you sure you want to delete "${getProductDisplayName(productToDelete)}"? This action cannot be undone.`
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

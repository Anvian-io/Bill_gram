import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";

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
    status: "all",
    minStock: "",
    maxStock: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Filter products based on all filter criteria
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter (searches multiple fields)
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !product.productName.toLowerCase().includes(searchLower) &&
        !product.brand.toLowerCase().includes(searchLower) &&
        !product.barcode.toLowerCase().includes(searchLower) &&
        !product.bNo.toLowerCase().includes(searchLower)
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
      if (filters.status !== "all" && product.status !== filters.status)
        return false;
      if (filters.minStock && product.openingStock < Number(filters.minStock))
        return false;
      if (filters.maxStock && product.openingStock > Number(filters.maxStock))
        return false;

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
  const handleFilterChange = (field: string, value: string) => {
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
      status: "all",
      minStock: "",
      maxStock: "",
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Optional: Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get unique values for dropdown filters
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)));
  const uniqueGroups = Array.from(new Set(products.map((p) => p.productGroup)));
  const statusOptions = ["In Stock", "Low Stock", "Out of Stock"];

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredProducts.length
  );

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-heading">
              Product Inventory
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              + Add Product
            </Button>
          </div>
        </div>
        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {filteredProducts.length}{" "}
            products
            {filteredProducts.length !== products.length && " (filtered)"}
          </p>
          <div className="text-sm text-muted-foreground">
            Sorted by: <span className="font-medium">Latest Added</span>
          </div>
        </div>

        {/* Product Table */}
        <Card className="mb-6">
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
                    <TableHead className="font-semibold">Basic Price</TableHead>
                    <TableHead className="font-semibold">
                      Opening Stock
                    </TableHead>
                    <TableHead className="font-semibold">MRP</TableHead>
                    <TableHead className="font-semibold">P.Rate</TableHead>
                    <TableHead className="font-semibold">S.Rate</TableHead>
                    <TableHead className="font-semibold">Margin</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={13}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Filter className="h-12 w-12 text-muted-foreground/50 mb-2" />
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
                    paginatedProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-secondary/30"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.brand} • {product.hsnCode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary px-2 py-1 rounded">
                            {product.bNo}
                          </code>
                        </TableCell>
                        <TableCell>
                          {product.mfgDate ? (
                            <span className="text-sm">{product.mfgDate}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.expDate ? (
                            <span className="text-sm">{product.expDate}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {product.barcode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{product.basicPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                product.openingStock > 10
                                  ? "bg-green-500"
                                  : product.openingStock > 0
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
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
                        <TableCell className="font-semibold">
                          ₹{product.mrp.toFixed(2)}
                        </TableCell>
                        <TableCell>₹{product.pRate.toFixed(2)}</TableCell>
                        <TableCell>₹{product.sRate.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                          >
                            ₹{product.margin.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              title="Edit Product"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Custom Pagination */}
        {filteredProducts.length > 0 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}

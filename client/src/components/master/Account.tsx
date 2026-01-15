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
  CreditCard,
  FileText,
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
import AccountForm, {
  type AccountFormData,
} from "@/components/forms/AccountForm";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../FramerVariants";

// Define type for account
interface Account {
  id: number;
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Revenue" | "Expense" | "Equity";
  group: string;
  subGroup?: string;
  description: string;
  openingBalance: number;
  currentBalance: number;
  debitTotal: number;
  creditTotal: number;
  creditLimit: number;
  status: "Active" | "Inactive" | "Closed";
  transactionCount: number;
  lastTransactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function Account() {
  // State for accounts
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      code: "ACC001",
      name: "Cash Account",
      type: "Asset",
      group: "Current Assets",
      subGroup: "Cash & Cash Equivalents",
      description: "Main cash account for daily transactions",
      openingBalance: 1000000,
      currentBalance: 1250000,
      debitTotal: 3500000,
      creditTotal: 2250000,
      creditLimit: 0,
      status: "Active",
      transactionCount: 245,
      lastTransactionDate: "2024-02-15",
      createdAt: "2024-01-01 09:00:00",
      updatedAt: "2024-03-20 14:45:00",
    },
    {
      id: 2,
      code: "ACC002",
      name: "Bank of India",
      type: "Asset",
      group: "Bank Accounts",
      subGroup: "Current Account",
      description: "Primary business bank account",
      openingBalance: 3000000,
      currentBalance: 3250000,
      debitTotal: 5200000,
      creditTotal: 4950000,
      creditLimit: 0,
      status: "Active",
      transactionCount: 156,
      lastTransactionDate: "2024-02-14",
      createdAt: "2024-01-02 11:20:00",
      updatedAt: "2024-03-18 10:15:00",
    },
    {
      id: 3,
      code: "ACC003",
      name: "Accounts Receivable",
      type: "Asset",
      group: "Current Assets",
      subGroup: "Trade Receivables",
      description: "Amounts owed by customers",
      openingBalance: 1500000,
      currentBalance: 1850000,
      debitTotal: 2800000,
      creditTotal: 2450000,
      creditLimit: 0,
      status: "Active",
      transactionCount: 324,
      lastTransactionDate: "2024-02-15",
      createdAt: "2024-01-03 08:45:00",
      updatedAt: "2024-03-22 16:30:00",
    },
    {
      id: 4,
      code: "ACC004",
      name: "Inventory Account",
      type: "Asset",
      group: "Current Assets",
      subGroup: "Stock Inventory",
      description: "Value of goods held for sale",
      openingBalance: 2500000,
      currentBalance: 2750000,
      debitTotal: 3200000,
      creditTotal: 2950000,
      creditLimit: 0,
      status: "Active",
      transactionCount: 189,
      lastTransactionDate: "2024-02-13",
      createdAt: "2024-01-04 13:10:00",
      updatedAt: "2024-02-28 09:25:00",
    },
    {
      id: 5,
      code: "ACC005",
      name: "Accounts Payable",
      type: "Liability",
      group: "Current Liabilities",
      subGroup: "Trade Payables",
      description: "Amounts owed to suppliers",
      openingBalance: 1000000,
      currentBalance: 850000,
      debitTotal: 1200000,
      creditTotal: 1050000,
      creditLimit: 0,
      status: "Active",
      transactionCount: 278,
      lastTransactionDate: "2024-02-15",
      createdAt: "2024-01-05 10:00:00",
      updatedAt: "2024-03-15 11:45:00",
    },
    {
      id: 6,
      code: "ACC006",
      name: "Sales Revenue",
      type: "Revenue",
      group: "Operating Revenue",
      subGroup: "Product Sales",
      description: "Revenue from product sales",
      openingBalance: 0,
      currentBalance: 9850000,
      debitTotal: 0,
      creditTotal: 9850000,
      creditLimit: 0,
      status: "Active",
      transactionCount: 456,
      lastTransactionDate: "2024-02-15",
      createdAt: "2024-01-06 15:30:00",
      updatedAt: "2024-03-10 14:20:00",
    },
    {
      id: 7,
      code: "ACC007",
      name: "Purchase Account",
      type: "Expense",
      group: "Cost of Goods Sold",
      subGroup: "Direct Materials",
      description: "Cost of inventory purchases",
      openingBalance: 0,
      currentBalance: 6250000,
      debitTotal: 6250000,
      creditTotal: 0,
      creditLimit: 0,
      status: "Active",
      transactionCount: 312,
      lastTransactionDate: "2024-02-14",
      createdAt: "2024-01-07 12:15:00",
      updatedAt: "2024-03-19 13:40:00",
    },
    {
      id: 8,
      code: "ACC008",
      name: "Salary Expense",
      type: "Expense",
      group: "Operating Expenses",
      subGroup: "Employee Compensation",
      description: "Employee salaries and wages",
      openingBalance: 0,
      currentBalance: 1250000,
      debitTotal: 1250000,
      creditTotal: 0,
      creditLimit: 0,
      status: "Active",
      transactionCount: 45,
      lastTransactionDate: "2024-02-10",
      createdAt: "2024-01-08 09:00:00",
      updatedAt: "2024-03-21 15:10:00",
    },
    {
      id: 9,
      code: "ACC009",
      name: "Loan Payable",
      type: "Liability",
      group: "Long-term Liabilities",
      subGroup: "Bank Loans",
      description: "Long-term business loan",
      openingBalance: 5000000,
      currentBalance: 4800000,
      debitTotal: 200000,
      creditTotal: 0,
      creditLimit: 0,
      status: "Active",
      transactionCount: 12,
      lastTransactionDate: "2024-01-31",
      createdAt: "2023-11-15 14:20:00",
      updatedAt: "2024-01-30 10:55:00",
    },
    {
      id: 10,
      code: "ACC010",
      name: "Owner's Equity",
      type: "Equity",
      group: "Shareholder's Equity",
      subGroup: "Capital",
      description: "Owner's investment in the business",
      openingBalance: 5000000,
      currentBalance: 5000000,
      debitTotal: 0,
      creditTotal: 0,
      creditLimit: 0,
      status: "Active",
      transactionCount: 2,
      lastTransactionDate: "2024-01-01",
      createdAt: "2024-01-12 08:30:00",
      updatedAt: "2024-03-23 17:05:00",
    },
  ]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    code: "",
    type: "all" as "all" | Account["type"],
    group: "",
    status: "all" as "all" | Account["status"],
    minBalance: "",
    maxBalance: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      // Global search
      const searchLower = filters.search.toLowerCase();
      if (
        filters.search &&
        !account.name.toLowerCase().includes(searchLower) &&
        !account.code.toLowerCase().includes(searchLower) &&
        !account.description.toLowerCase().includes(searchLower) &&
        !account.group.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Individual filters
      if (
        filters.name &&
        !account.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      if (
        filters.code &&
        !account.code.toLowerCase().includes(filters.code.toLowerCase())
      )
        return false;
      if (filters.type !== "all" && account.type !== filters.type) return false;
      if (
        filters.group &&
        !account.group.toLowerCase().includes(filters.group.toLowerCase())
      )
        return false;
      if (filters.status !== "all" && account.status !== filters.status)
        return false;
      if (
        filters.minBalance &&
        Math.abs(account.currentBalance) < Number(filters.minBalance)
      )
        return false;
      if (
        filters.maxBalance &&
        Math.abs(account.currentBalance) > Number(filters.maxBalance)
      )
        return false;

      return true;
    });
  }, [accounts, filters]);

  // Paginated data
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAccounts.slice(startIndex, endIndex);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / itemsPerPage)
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
      code: "",
      type: "all",
      group: "",
      status: "all",
      minBalance: "",
      maxBalance: "",
    });
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "type" || filterName === "status" ? "all" : "",
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = (data: AccountFormData, id?: number) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (id) {
      // Update existing account
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === id
            ? {
                ...account,
                ...data,
                updatedAt: now,
              }
            : account
        )
      );
      toast.success("Account updated successfully!");
    } else {
      // Add new account
      const newAccount: Account = {
        id: Math.max(...accounts.map((a) => a.id)) + 1,
        code: `ACC${String(
          Math.max(
            ...accounts.map((a) => parseInt(a.code.replace("ACC", "")))
          ) + 1
        ).padStart(3, "0")}`,
        ...data,
        openingBalance: data.openingBalance || 0,
        currentBalance: data.currentBalance || 0,
        debitTotal: 0,
        creditTotal: 0,
        transactionCount: 0,
        lastTransactionDate: now.split(" ")[0],
        status: "Active" as Account["status"],
        createdAt: now,
        updatedAt: now,
      };
      setAccounts((prev) => [...prev, newAccount]);
      toast.success("Account created successfully!");
    }
    setFormOpen(false);
  };

  // Handle edit
  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (accountToDelete) {
      setAccounts((prev) =>
        prev.filter((account) => account.id !== accountToDelete.id)
      );
      toast.success("Account deleted successfully!");
      setAccountToDelete(null);
      setDeleteOpen(false);
    }
  };

  // Confirm delete
  const confirmDelete = (account: Account) => {
    setAccountToDelete(account);
    setDeleteOpen(true);
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredAccounts.length
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

  // Format simple date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  // Get account type badge color
  const getAccountTypeColor = (type: Account["type"]) => {
    switch (type) {
      case "Asset":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Liability":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400";
      case "Revenue":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
      case "Expense":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400";
      case "Equity":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get status badge color
  const getStatusColor = (status: Account["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
      case "Closed":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.status === "Active").length;
    const totalAssets = accounts
      .filter((a) => a.type === "Asset")
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
    const totalLiabilities = accounts
      .filter((a) => a.type === "Liability")
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
    const totalRevenue = accounts
      .filter((a) => a.type === "Revenue")
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
    const totalExpenses = accounts
      .filter((a) => a.type === "Expense")
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
    const totalEquity = accounts
      .filter((a) => a.type === "Equity")
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalTransactions = accounts.reduce(
      (sum, a) => sum + a.transactionCount,
      0
    );

    return {
      totalAccounts,
      activeAccounts,
      totalAssets,
      totalLiabilities,
      totalRevenue,
      totalExpenses,
      totalEquity,
      netProfit,
      totalTransactions,
    };
  }, [accounts]);

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
              <h1 className="text-3xl font-bold text-heading">Account Heads</h1>
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
                placeholder="Search accounts by name, code, or description..."
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
                  Add Account
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
                        {/* Account Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="accountName"
                            className="text-sm font-medium"
                          >
                            Account Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="accountName"
                              placeholder="Enter account name"
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

                        {/* Account Code Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="accountCode"
                            className="text-sm font-medium"
                          >
                            Account Code
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="accountCode"
                              placeholder="ACC001"
                              value={filters.code}
                              onChange={(e) =>
                                handleFilterChange("code", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.code && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("code")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">
                            Type
                          </Label>
                          <Select
                            value={filters.type}
                            onValueChange={(value: "all" | Account["type"]) =>
                              handleFilterChange("type", value)
                            }
                          >
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="Asset">Asset</SelectItem>
                              <SelectItem value="Liability">
                                Liability
                              </SelectItem>
                              <SelectItem value="Revenue">Revenue</SelectItem>
                              <SelectItem value="Expense">Expense</SelectItem>
                              <SelectItem value="Equity">Equity</SelectItem>
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
                            onValueChange={(value: "all" | Account["status"]) =>
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
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Group Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="group"
                            className="text-sm font-medium"
                          >
                            Group
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="group"
                              placeholder="Current Assets"
                              value={filters.group}
                              onChange={(e) =>
                                handleFilterChange("group", e.target.value)
                              }
                              className="flex-1"
                            />
                            {filters.group && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("group")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Balance Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Balance Range (₹)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              value={filters.minBalance}
                              onChange={(e) =>
                                handleFilterChange("minBalance", e.target.value)
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              value={filters.maxBalance}
                              onChange={(e) =>
                                handleFilterChange("maxBalance", e.target.value)
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
            Showing {startIndex} to {endIndex} of {filteredAccounts.length}{" "}
            accounts
            {filteredAccounts.length !== accounts.length && " (filtered)"}
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

        {/* Accounts Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">
                        Account Details
                      </TableHead>
                      <TableHead className="font-semibold">
                        Type & Group
                      </TableHead>
                      <TableHead className="font-semibold">
                        Transactions
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
                      {paginatedAccounts.length === 0 ? (
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
                              <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No accounts found matching your filters.</p>
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
                        paginatedAccounts.map((account, index) => (
                          <motion.tr
                            key={account.id}
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
                                  <CreditCard className="h-5 w-5 text-primary" />
                                </motion.div>
                                <div>
                                  <p className="font-medium text-heading">
                                    {account.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {account.code}
                                    </Badge>
                                    {account.subGroup && (
                                      <p className="text-xs text-muted-foreground">
                                        {account.subGroup}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {account.description}
                                  </p>
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
                                    className={getAccountTypeColor(
                                      account.type
                                    )}
                                  >
                                    {account.type}
                                  </Badge>
                                </motion.div>
                                <div className="text-sm text-muted-foreground">
                                  {account.group}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">
                                    {account.transactionCount}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Last:{" "}
                                  {formatDate(account.lastTransactionDate)}
                                </div>
                                <div className="flex gap-1 text-xs">
                                  <span className="text-green-600">
                                    Dr: {formatCurrency(account.debitTotal)}
                                  </span>
                                  <span className="text-red-600">
                                    Cr: {formatCurrency(account.creditTotal)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  className={getStatusColor(account.status)}
                                >
                                  {account.status}
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
                                    {formatDateTime(account.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-1">
                                    {formatDateTime(account.updatedAt)}
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
                                    onClick={() => handleEdit(account)}
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
                                    onClick={() => confirmDelete(account)}
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
        {filteredAccounts.length > 0 && (
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

        {/* Account Form Dialog */}
        <AccountForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingAccount={editingAccount}
          onSave={handleSave}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Account"
          subText={
            accountToDelete
              ? `Are you sure you want to delete "${accountToDelete.name}" (${accountToDelete.code})? This action cannot be undone and will affect all related transactions.`
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

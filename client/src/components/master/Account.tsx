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
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Phone,
  RefreshCw,
  Eye,
  EyeOff,
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
import { Switch } from "@/components/ui/switch";
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
import { accountService } from "@/services/accountService";
import { type Account, type AccountFilters } from "@/types/account";
import { useDebounce } from "@/utils/debounce";

// Define the API response structure
interface AccountsResponse {
  data: {
    accounts: Account[];
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

export default function AccountComponent() {
  // State for accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AccountFilters>({
    search: "",
    accountHolder: "",
    bankName: "",
    ifscCode: "",
    status: "all",
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
  const [accountHolderInput, setAccountHolderInput] = useState<string>("");
  const [bankNameInput, setBankNameInput] = useState<string>("");
  const [ifscCodeInput, setIfscCodeInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetAccountHolder = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, accountHolder: value }));
  }, 300);

  const debouncedSetBankName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, bankName: value }));
  }, 300);

  const debouncedSetIfscCode = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, ifscCode: value }));
  }, 300);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  // Handle account holder input change with debounce
  const handleAccountHolderChange = (value: string) => {
    setAccountHolderInput(value);
    debouncedSetAccountHolder(value);
  };

  // Handle bank name input change with debounce
  const handleBankNameChange = (value: string) => {
    setBankNameInput(value);
    debouncedSetBankName(value);
  };

  // Handle IFSC code input change with debounce
  const handleIfscCodeChange = (value: string) => {
    setIfscCodeInput(value);
    debouncedSetIfscCode(value);
  };

  // Safely handle accounts data
  const displayAccounts = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) {
      return [];
    }
    return accounts;
  }, [accounts]);

  // Fetch accounts
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add filters
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.accountHolder) {
        params.accountHolder = filters.accountHolder;
      }
      if (filters.bankName) {
        params.bankName = filters.bankName;
      }
      if (filters.ifscCode) {
        params.ifscCode = filters.ifscCode;
      }
      if (filters.status !== "all") {
        params.status = filters.status === "active";
      }
      if (filters.showDeleted) {
        params.showDeleted = "true";
      }

      const response = await accountService.getAccounts(
        currentPage,
        itemsPerPage,
        params,
      );

      // Type the response as AccountsResponse
      const apiResponse = response as unknown as AccountsResponse;

      if (apiResponse?.data) {
        const accountsData = apiResponse.data.accounts || [];
        const pagination = apiResponse.data.pagination || {};

        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.error("Unexpected response structure:", response);
        setAccounts([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch accounts", {
        description: error.message || "Please try again later",
      });
      setAccounts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [currentPage, itemsPerPage, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

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
      accountHolder: "",
      bankName: "",
      ifscCode: "",
      status: "all",
      showDeleted: false,
    });
    setSearchInput("");
    setAccountHolderInput("");
    setBankNameInput("");
    setIfscCodeInput("");
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "status"
          ? "all"
          : filterName === "showDeleted"
            ? false
            : "",
    }));

    // Also clear the corresponding input state
    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "accountHolder":
        setAccountHolderInput("");
        break;
      case "bankName":
        setBankNameInput("");
        break;
      case "ifscCode":
        setIfscCodeInput("");
        break;
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form save
  const handleSave = async (data: AccountFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing account
        await accountService.updateAccount(id, data);
        toast.success("Account updated successfully!");
      } else {
        // Add new account
        await accountService.createAccount(data);
        toast.success("Account created successfully!");
      }
      setFormOpen(false);
      fetchAccounts(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to save account", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
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
  const handleDelete = async () => {
    if (accountToDelete) {
      try {
        await accountService.deleteAccount(accountToDelete.id);
        toast.success("Account deleted successfully!");
        fetchAccounts(); // Refresh the list
      } catch (error: any) {
        toast.error("Failed to delete account", {
          description: error.message || "Please try again",
        });
      } finally {
        setAccountToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Confirm delete
  const confirmDelete = (account: Account) => {
    setAccountToDelete(account);
    setDeleteOpen(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchAccounts();
    toast.info("Refreshing data...");
  };

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Active filters count
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "search" &&
      ((key === "showDeleted" && value) || (value && value !== "all")),
  ).length;

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
          className="flex flex-col gap=6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-heading">Bank Accounts</h1>
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
                placeholder="Search accounts by holder, bank, or IFSC..."
                className="pl-10 py-6 text-base"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                // disabled={isLoading}
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
                  onClick={handleAddNew}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
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
              <div className="flex flex-col gap-4 p-1">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap=2">
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
                        {/* Account Holder Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="accountHolder"
                            className="text-sm font-medium"
                          >
                            Account Holder
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="accountHolder"
                              placeholder="Enter account holder name"
                              value={accountHolderInput}
                              onChange={(e) =>
                                handleAccountHolderChange(e.target.value)
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {accountHolderInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setAccountHolderInput("");
                                  clearFilter("accountHolder");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Bank Name Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="bankName"
                            className="text-sm font-medium"
                          >
                            Bank Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="bankName"
                              placeholder="Enter bank name"
                              value={bankNameInput}
                              onChange={(e) =>
                                handleBankNameChange(e.target.value)
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {bankNameInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setBankNameInput("");
                                  clearFilter("bankName");
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* IFSC Code Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="ifscCode"
                            className="text-sm font-medium"
                          >
                            IFSC Code
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="ifscCode"
                              placeholder="Enter IFSC code"
                              value={ifscCodeInput}
                              onChange={(e) =>
                                handleIfscCodeChange(e.target.value)
                              }
                              className="flex-1"
                              // disabled={isLoading}
                            />
                            {ifscCodeInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setIfscCodeInput("");
                                  clearFilter("ifscCode");
                                }}
                                disabled={isLoading}
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
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Show Deleted Filter */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="showDeleted"
                            className="text-sm font-medium"
                          >
                            Show Deleted
                          </Label>
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
                              {filters.showDeleted ? (
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Showing Deleted
                                </div>
                              ) : (
                                <div className="flex items-center gap=2">
                                  <EyeOff className="h-4 w-4" />
                                  Hide Deleted
                                </div>
                              )}
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
            {/* {isLoading ? (
              "Loading..."
            ) :  */}
            (
            <>
              Showing {startIndex} to {endIndex} of {totalItems} accounts
              {filters.status !== "all" ||
              filters.accountHolder ||
              filters.bankName ||
              filters.ifscCode ||
              filters.search ||
              filters.showDeleted
                ? " (filtered)"
                : ""}
              {filters.showDeleted && " (including deleted)"}
            </>
            ){/* } */}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
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
                        Bank Information
                      </TableHead>
                      <TableHead className="font-semibold">
                        Digital Payment
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Info</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading accounts...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : displayAccounts.length === 0 ? (
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
                        displayAccounts.map((account, index) => (
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
                                    {account.accountHolder}
                                    {account.deleted && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-xs"
                                      >
                                        Deleted
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {account.id}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {account.description}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Banknote className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium text-sm">
                                      {account.bankName}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    IFSC Code
                                  </div>
                                  <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                                    {account.ifscCode}
                                  </code>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-2">
                                {account.qrCode && (
                                  <div className="flex items-center gap=2">
                                    <QrCode className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      QR Code Available
                                    </span>
                                  </div>
                                )}
                                {account.gpayNo && (
                                  <div className="flex items-center gap=2">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      GPay: {account.gpayNo}
                                    </span>
                                  </div>
                                )}
                                {!account.qrCode && !account.gpayNo && (
                                  <span className="text-sm text-muted-foreground">
                                    No digital payment info
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <motion.div
                                variants={badgeVariants}
                                whileHover="hover"
                              >
                                <Badge
                                  variant={
                                    account.status ? "default" : "secondary"
                                  }
                                  className={
                                    account.status
                                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                  }
                                >
                                  {account.status ? "Active" : "Inactive"}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <div className="flex items-center gap=1">
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
                                    disabled={account.deleted}
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
                                    disabled={account.deleted}
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
        {!isLoading && displayAccounts.length > 0 && totalPages > 1 && (
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
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Account"
          subText={
            accountToDelete
              ? `Are you sure you want to delete "${accountToDelete.accountHolder}" account? This action cannot be undone.`
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

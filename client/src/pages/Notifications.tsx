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
import { RefreshCw,
  Search,
  X,
  MailOpen,
  Mail,
  Clock,
  Layout,
  CheckCheck,
  Bell,
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
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../components/FramerVariants";
import { useDebounce } from "@/utils/debounce";
import type { Notification } from "@/services/notificationService";
import { notificationAPI, webSocketService } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

// Available page filter options (based on your schema's "page" field)
const PAGE_OPTIONS = [
  { value: "all", label: "All Pages" },
  { value: "Master", label: "Master" },
  { value: "Sales", label: "Sales" },
  { value: "Report", label: "Report" },
  { value: "product", label: "Product Inventory" },
  { value: "Purchase", label: "Purchase" },
  { value: "Profile", label: "Profile" },
];

// Notification type badge color mapping
const typeColorMap: Record<string, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  create: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  update: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  delete: "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
};

export default function NotificationPage() {
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Delete / mark read confirmation (optional, for bulk actions)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notificationToMark, setNotificationToMark] = useState<Notification | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
  search: "",
  title: "",
  message: "",
  pageName: "all",   // was 'page'
  unreadOnly: false,
});

  // Local input states for debounced fields
  const [searchInput, setSearchInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // Debounced filter setters
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);
  const debouncedSetTitle = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, title: value }));
  }, 300);
  const debouncedSetMessage = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, message: value }));
  }, 300);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);


  // WebSocket real‑time updates (optional)
  useEffect(() => {
  webSocketService.setOnNotificationCallback((newNotification) => {
    toast.info(`New notification: ${newNotification.title}`);
    // Go to first page to show the newest notification
    setCurrentPage(1);
    // No need to call fetchNotifications() – it will be triggered by the page change
  });
  webSocketService.connect();

  return () => {
    webSocketService.disconnect();
  };
}, []); 

  // Fetch notifications
const fetchNotifications = async () => {
  setIsLoading(true);
  try {
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (filters.search) params.search = filters.search;
    if (filters.title) params.title = filters.title;
    if (filters.message) params.message = filters.message;
    if (filters.pageName !== "all") params.pageName = filters.pageName;
    if (filters.unreadOnly) params.unreadOnly = true;

    const response = await notificationAPI.getNotifications(params);
    console.log('API response notification:', response);

    // ✅ Now response.data is ApiResponse, so we drill into .data.data
    const payload = response.data?.data;   // this is PaginatedNotifications
    setNotifications(payload?.notifications ?? []);
    setTotalItems(payload?.pagination?.total ?? 0);
    setTotalPages(payload?.pagination?.totalPages ?? 1);
  } catch (error: any) {
    toast.error("Failed to fetch notifications", {
      description: error.message,
    });
    setNotifications([]);
    setTotalItems(0);
    setTotalPages(1);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, itemsPerPage, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Handlers for filter changes
  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const handleTitleChange = (value: string) => {
    setTitleInput(value);
    debouncedSetTitle(value);
  };

  const handleMessageChange = (value: string) => {
    setMessageInput(value);
    debouncedSetMessage(value);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      title: "",
      message: "",
      pageName: "all",
      unreadOnly: false,
    });
    setSearchInput("");
    setTitleInput("");
    setMessageInput("");
  };

  const clearFilter = (field: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [field]: field === "pageName" ? "all" : field === "unreadOnly" ? false : "",
    }));
    // Clear corresponding input
    if (field === "search") setSearchInput("");
    if (field === "title") setTitleInput("");
    if (field === "message") setMessageInput("");
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await notificationAPI.markAsRead(notification.id);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (error: any) {
      toast.error("Failed to mark as read", { description: error.message });
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error("Failed to mark all as read", { description: error.message });
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Refresh
  const handleRefresh = () => {
    fetchNotifications();
    toast.info("Refreshing notifications...");
  };

  // Pagination helpers
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "search" &&
      ((key === "unreadOnly" && value) || (value && value !== "all"))
  ).length;

  // Format time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
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
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-heading">Notifications</h1>
            </div>

            {/* Global Search */}
            <motion.div
              className="relative w-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="absolute left-3 top-6 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title or message..."
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
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div className="flex flex-wrap items-center gap-3">
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </motion.div>

              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll || notifications.every((n) => n.read)}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Title Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-medium">
                            Title
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="title"
                              placeholder="Filter by title"
                              value={titleInput}
                              onChange={(e) => handleTitleChange(e.target.value)}
                              className="flex-1"
                            />
                            {titleInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setTitleInput("");
                                  clearFilter("title");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Message Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-sm font-medium">
                            Description
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="message"
                              placeholder="Filter by description"
                              value={messageInput}
                              onChange={(e) => handleMessageChange(e.target.value)}
                              className="flex-1"
                            />
                            {messageInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  setMessageInput("");
                                  clearFilter("message");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Page Dropdown */}
                        <div className="space-y-2">
                          <Label htmlFor="page" className="text-sm font-medium">
                            Page
                          </Label>
                          <Select
                            value={filters.pageName}
                            onValueChange={(value) => handleFilterChange("pageName", value)}
                          >
                            <SelectTrigger id="page">
                              <SelectValue placeholder="Select page" />
                            </SelectTrigger>
                            <SelectContent>
                              {PAGE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Unread Only Toggle */}
                        <div className="space-y-2">
                          <Label htmlFor="unreadOnly" className="text-sm font-medium">
                            Show Unread Only
                          </Label>
                          <div className="flex items-center gap-3 pt-2">
                            <Switch
                              id="unreadOnly"
                              checked={filters.unreadOnly}
                              onCheckedChange={(checked) =>
                                handleFilterChange("unreadOnly", checked)
                              }
                            />
                            <Label
                              htmlFor="unreadOnly"
                              className={`text-sm cursor-pointer ${
                                filters.unreadOnly
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MailOpen className="h-4 w-4" />
                                {filters.unreadOnly ? "Showing unread" : "Include read"}
                              </div>
                            </Label>
                          </div>
                        </div>
                      </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count & Items Per Page */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `Showing ${startIndex} to ${endIndex} of ${totalItems} notifications${
                  activeFiltersCount > 0 ? " (filtered)" : ""
                }`}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Notifications Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Notification</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Page</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Time</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <TableRow key="loading">
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading notifications...
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : notifications.length === 0 ? (
                        <TableRow key="no-data">
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No notifications found.</p>
                              {activeFiltersCount > 0 && (
                                <Button variant="link" onClick={clearFilters} className="mt-2">
                                  Clear filters
                                </Button>
                              )}
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        notifications.map((notification, index) => (
                          <motion.tr
                            key={notification.id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            variants={rowVariants}
                            className={`group border-b ${
                              !notification.read ? "bg-primary/5" : ""
                            }`}
                            layout
                          >
                            <TableCell className="group-hover:bg-secondary/30">
                              <div className="space-y-1">
                                <p className="font-medium text-heading">
                                  {notification.title}
                                  {!notification.read && (
                                    <Badge variant="default" className="ml-2 text-xs bg-blue-500">
                                      New
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30">
                              <motion.div variants={badgeVariants} whileHover="hover">
                                <Badge
                                  className={
                                    typeColorMap[notification.type] ||
                                    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                  }
                                >
                                  {notification.type}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30">
                              <div className="flex items-center gap-2">
                                <Layout className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm capitalize">
                                  {notification.page || "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30">
                              <Badge
                                variant={notification.read ? "secondary" : "default"}
                                className={
                                  notification.read
                                    ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                }
                              >
                                {notification.read ? "Read" : "Unread"}
                              </Badge>
                            </TableCell>
                            <TableCell className="group-hover:bg-secondary/30">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right group-hover:bg-secondary/30">
                              <div className="flex justify-end gap-2">
                                {!notification.read && (
                                  <motion.div
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleMarkAsRead(notification)}
                                      className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                      title="Mark as read"
                                    >
                                      <MailOpen className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                )}
                                {/* Optional: delete action if your API supports it */}
                                {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button> */}
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

        {/* Pagination */}
        {!isLoading && notifications.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
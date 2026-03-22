import { useEffect, useMemo, useState } from "react";
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
  Filter,
  RefreshCw,
  Search,
  X,
  MailOpen,
  Clock,
  Layout,
  CheckCheck,
  Bell,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "@/components/FramerVariants";
import { useDebounce } from "@/utils/debounce";
import type {
  Notification,
  NotificationQueryParams,
} from "@/services/notificationService";
import { notificationAPI } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

const typeColorMap: Record<string, string> = {
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  create:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  update:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  delete: "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
};

interface NotificationHistoryPanelProps {
  title: string;
  pageName: string;
}

export default function NotificationHistoryPanel({
  title,
  pageName,
}: NotificationHistoryPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingVisible, setIsMarkingVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    title: "",
    message: "",
    unreadOnly: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!searchParams.has("id")) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("id");
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetTitle = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, title: value }));
  }, 300);

  const debouncedSetMessage = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, message: value }));
  }, 300);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params: NotificationQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        pageName,
      };

      if (filters.search) params.search = filters.search;
      if (filters.title) params.title = filters.title;
      if (filters.message) params.message = filters.message;
      if (filters.unreadOnly) params.unreadOnly = true;

      const response = await notificationAPI.getNotifications(params);
      const payload = response.data?.data;

      setNotifications(payload?.notifications ?? []);
      setTotalItems(payload?.pagination?.total ?? 0);
      setTotalPages(payload?.pagination?.totalPages ?? 1);
    } catch (error: any) {
      toast.error(`Failed to fetch ${pageName.toLowerCase()} notifications`, {
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
  }, [currentPage, itemsPerPage, filters, pageName]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage, pageName]);

  const handleFilterChange = (
    field: keyof typeof filters,
    value: string | boolean,
  ) => {
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
      unreadOnly: false,
    });
    setSearchInput("");
    setTitleInput("");
    setMessageInput("");
  };

  const clearFilter = (field: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [field]: field === "unreadOnly" ? false : "",
    }));

    if (field === "search") setSearchInput("");
    if (field === "title") setTitleInput("");
    if (field === "message") setMessageInput("");
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) {
      return;
    }

    try {
      await notificationAPI.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      toast.success("Notification marked as read");
    } catch (error: any) {
      toast.error("Failed to mark as read", { description: error.message });
    }
  };

  const handleMarkVisibleAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.read);

    if (unreadNotifications.length === 0) {
      return;
    }

    setIsMarkingVisible(true);

    try {
      const results = await Promise.allSettled(
        unreadNotifications.map((notification) =>
          notificationAPI.markAsRead(notification.id).then(() => notification.id),
        ),
      );

      const markedIds = new Set(
        results
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<number> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value),
      );

      if (markedIds.size > 0) {
        setNotifications((prev) =>
          prev.map((notification) =>
            markedIds.has(notification.id)
              ? { ...notification, read: true }
              : notification,
          ),
        );
      }

      if (markedIds.size === unreadNotifications.length) {
        toast.success("Visible notifications marked as read");
      } else if (markedIds.size > 0) {
        toast.warning(
          `${markedIds.size} of ${unreadNotifications.length} notifications marked as read`,
        );
      } else {
        toast.error("Failed to mark visible notifications as read");
      }
    } finally {
      setIsMarkingVisible(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
    toast.info(`Refreshing ${pageName.toLowerCase()} notifications...`);
  };

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, value]) =>
          key !== "search" && ((key === "unreadOnly" && value) || Boolean(value)),
      ).length,
    [filters],
  );

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const hasUnreadNotifications = notifications.some((notification) => !notification.read);

  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-8xl mx-auto">
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-heading">{title}</h1>
                <Badge variant="secondary" className="text-sm">
                  {pageName}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Track recent {pageName.toLowerCase()} notifications and activity.
              </p>
            </div>

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
                onChange={(event) => handleSearchChange(event.target.value)}
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
                  onClick={handleMarkVisibleAsRead}
                  disabled={isMarkingVisible || !hasUnreadNotifications}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark shown as read
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="mb-2" variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4 p-1">
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

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor={`${pageName}-title`} className="text-sm font-medium">
                            Title
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`${pageName}-title`}
                              placeholder="Filter by title"
                              value={titleInput}
                              onChange={(event) => handleTitleChange(event.target.value)}
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

                        <div className="space-y-2">
                          <Label
                            htmlFor={`${pageName}-message`}
                            className="text-sm font-medium"
                          >
                            Description
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`${pageName}-message`}
                              placeholder="Filter by description"
                              value={messageInput}
                              onChange={(event) => handleMessageChange(event.target.value)}
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

                        <div className="space-y-2">
                          <Label
                            htmlFor={`${pageName}-unreadOnly`}
                            className="text-sm font-medium"
                          >
                            Show Unread Only
                          </Label>
                          <div className="flex items-center gap-3 pt-2">
                            <Switch
                              id={`${pageName}-unreadOnly`}
                              checked={filters.unreadOnly}
                              onCheckedChange={(checked) =>
                                handleFilterChange("unreadOnly", checked)
                              }
                            />
                            <Label
                              htmlFor={`${pageName}-unreadOnly`}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
            <select
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

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
                              <p>No {pageName.toLowerCase()} notifications found.</p>
                              {(activeFiltersCount > 0 || searchInput) && (
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
                                  {notification.page || "-"}
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

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CloudCog,
  Wifi,
  WifiOff,
  HardDrive,
  LogOut,
  Upload,
  Download,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  Clock,
  Database,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { backupService } from "@/services/backupService";
import type {
  GoogleDriveStatus,
  BackupHistoryItem,
  ConnectivityStatus,
} from "@/types/backup";

// ─── Helper components ────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: BackupHistoryItem["status"] }> = ({
  status,
}) => {
  const map = {
    success: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Success",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    failed: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Failed",
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    skipped: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: "Skipped",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
  };
  const { icon, label, cls } = map[status] || map.failed;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
};

const TriggerBadge: React.FC<{ trigger: BackupHistoryItem["trigger"] }> = ({
  trigger,
}) => {
  const map = {
    auto: {
      label: "Auto",
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    manual: {
      label: "Manual",
      cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    restore: {
      label: "Restore",
      cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
  };
  const { label, cls } = map[trigger] || map.manual;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatSize = (kb?: number) => {
  if (!kb) return "—";
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const Restore_Backup: React.FC = () => {
  const location = useLocation();

  // Connectivity
  const [connectivity, setConnectivity] = useState<ConnectivityStatus | null>(null);

  // Drive status
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatus | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);

  // Backup trigger
  const [backingUp, setBackingUp] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // History
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const HISTORY_LIMIT = 10;

  // Restore
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User
  const [userId, setUserId] = useState<number | null>(null);

  // ── Get user from localStorage ────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUserId(u.id);
      } catch {}
    }
  }, []);

  // ── Handle OAuth redirect query params ───────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("connected") === "true") {
      toast.success("Google Drive connected successfully!");
      refreshDriveStatus();
      window.history.replaceState({}, "", "/backup");
    } else if (params.get("error")) {
      toast.error(`Connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", "/backup");
    }
  }, [location.search]);

  // ── Connectivity polling ─────────────────────────────────────────────────
  const checkConnectivity = useCallback(async () => {
    const status = await backupService.getConnectivityStatus();
    setConnectivity(status);
  }, []);

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [checkConnectivity]);

  // ── Drive status ─────────────────────────────────────────────────────────
  const refreshDriveStatus = useCallback(async () => {
    setDriveLoading(true);
    try {
      const status = await backupService.getDriveStatus();
      setDriveStatus(status);
    } catch {
      setDriveStatus({ connected: false });
    } finally {
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDriveStatus();
  }, [refreshDriveStatus]);

  // ── Backup history ────────────────────────────────────────────────────────
  const loadHistory = useCallback(
    async (page: number) => {
      setHistoryLoading(true);
      try {
        const res = await backupService.getHistory(page, HISTORY_LIMIT);
        setHistory(res.history);
        setHistoryTotal(res.pagination.total);
        setHistoryTotalPages(res.pagination.totalPages);
      } catch {
        toast.error("Failed to load backup history");
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHistory(historyPage);
  }, [historyPage, loadHistory]);

  // ── Connect Google Drive ──────────────────────────────────────────────────
  const handleConnectDrive = async () => {
    if (!userId) {
      toast.error("User not found. Please refresh and try again.");
      return;
    }
    try {
      const rawUrl = await backupService.getAuthUrl();
      // Append state (userId) so the callback knows who to save the token for
      const url = new URL(rawUrl);
      url.searchParams.set("state", String(userId));
      window.open(url.toString(), "_blank", "width=600,height=700");
    } catch (err: any) {
      toast.error(err.message || "Failed to get auth URL");
    }
  };

  // ── Disconnect Google Drive ───────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!confirm("Disconnect Google Drive? Auto-backups will be paused.")) return;
    try {
      await backupService.disconnectDrive();
      toast.success("Google Drive disconnected");
      setDriveStatus({ connected: false });
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect");
    }
  };

  // ── Trigger manual backup ─────────────────────────────────────────────────
  const handleManualBackup = async () => {
    if (!connectivity?.online) {
      toast.error("No internet connection. Cannot backup.");
      return;
    }
    setBackingUp(true);
    try {
      const result = await backupService.triggerBackup();
      toast.success(
        `Backup complete! ${formatSize(result.fileSizeKb)} uploaded to Drive.`
      );
      loadHistory(1);
      setHistoryPage(1);
    } catch (err: any) {
      toast.error(err.message || "Backup failed");
      loadHistory(1);
      setHistoryPage(1);
    } finally {
      setBackingUp(false);
    }
  };

  // Download backup zip
  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const fileName = await backupService.downloadBackupZip();
      toast.success(`${fileName} downloaded successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // ── Restore: file selection ───────────────────────────────────────────────
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".zip")) {
      setRestoreFile(file);
    } else {
      toast.error("Please drop a .zip file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setRestoreFile(file);
  };

  // ── Restore: upload ───────────────────────────────────────────────────────
  const handleRestore = async () => {
    if (!restoreFile) return;
    if (
      !confirm(
        "⚠️ This will REPLACE your current database with the backup. This cannot be undone. Continue?"
      )
    )
      return;

    setRestoring(true);
    try {
      const result = await backupService.restoreFromUpload(restoreFile);
      toast.success(
        `Database restored from ${result.fileName}. Please restart the app if data looks stale.`
      );
      setRestoreFile(null);
      loadHistory(1);
      setHistoryPage(1);
    } catch (err: any) {
      toast.error(err.message || "Restore failed");
      loadHistory(1);
      setHistoryPage(1);
    } finally {
      setRestoring(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isOnline = connectivity?.online ?? null;
  const isConnected = driveStatus?.connected ?? false;
  const canBackup = isOnline === true && isConnected;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Page Header ──────────────────────────────────────────── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Backup & Restore
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automatic daily backups to Google Drive at 12:00 AM
            </p>
          </div>

          {/* Internet Connectivity Badge */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm border ${
              isOnline === null
                ? "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                : isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
            }`}
          >
            {isOnline === null ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {isOnline === null
              ? "Checking..."
              : isOnline
                ? "Online"
                : "Offline"}
            {connectivity && (
              <span className="text-xs opacity-60 ml-1">
                •{" "}
                {new Date(connectivity.checkedAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </motion.div>
        </motion.div>

        {/* ── Top Row: Drive + Backup Actions ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Drive Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border p-4 border-gray-200 dark:border-gray-800 shadow-lg h-full">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CloudCog className="h-5 w-5 text-primary" />
                  Google Drive
                </CardTitle>
                <CardDescription>
                  Connect your Google account for cloud backups
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {driveLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Checking connection...
                  </div>
                ) : isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                          Connected
                        </p>
                        {driveStatus?.email && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {driveStatus.email}
                          </p>
                        )}
                        {driveStatus?.connectedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Since {formatDate(driveStatus.connectedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 gap-2 w-full"
                      onClick={handleDisconnect}
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect Google Drive
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Not Connected
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Connect to enable automatic daily backups
                        </p>
                      </div>
                    </div>
                    <Button
                      className="gap-2 w-full bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={handleConnectDrive}
                    >
                      <CloudCog className="h-4 w-4" />
                      Connect Google Drive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Backup Actions Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border p-4 border-gray-200 dark:border-gray-800 shadow-lg h-full">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Backup Now
                </CardTitle>
                <CardDescription>
                  Manually trigger an immediate backup to Google Drive
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {!isConnected && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Connect Google Drive first to enable backups
                  </div>
                )}
                {!isOnline && isOnline !== null && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
                    No internet connection. Backup requires internet access.
                  </div>
                )}
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Auto-backup runs daily at <strong>12:00 AM IST</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" />
                    <span>
                      Backs up your entire <strong>Shopkeeper</strong> data
                      folder
                    </span>
                  </div>
                </div>
                <Button
                  className="gap-2 w-full bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  onClick={handleManualBackup}
                  disabled={!canBackup || backingUp}
                >
                  {backingUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Backing Up...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Backup Now
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={handleDownloadBackup}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Backup (.zip)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Backup History ─────────────────────────────────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Backup History
                  </CardTitle>
                  <CardDescription>
                    {historyTotal > 0
                      ? `${historyTotal} record${historyTotal !== 1 ? "s" : ""} total`
                      : "No backups recorded yet"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => loadHistory(historyPage)}
                  disabled={historyLoading}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <HardDrive className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No backup history yet</p>
                  <p className="text-xs">
                    Run a manual backup or wait for the midnight auto-backup
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                          <TableHead className="text-xs font-semibold">
                            Date & Time
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Type
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            File
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Size
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Drive
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                          >
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(item.createdAt)}
                            </TableCell>
                            <TableCell>
                              <TriggerBadge trigger={item.trigger} />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <StatusBadge status={item.status} />
                                {item.errorMsg && (
                                  <p
                                    className="text-xs text-red-500 max-w-[180px] truncate"
                                    title={item.errorMsg}
                                  >
                                    {item.errorMsg}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell
                              className="text-xs text-muted-foreground max-w-[180px] truncate"
                              title={item.fileName}
                            >
                              {item.fileName || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatSize(item.fileSizeKb)}
                            </TableCell>
                            <TableCell>
                              {item.driveLink ? (
                                <a
                                  href={item.driveLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  View <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-muted-foreground">
                        Page {historyPage} of {historyTotalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={historyPage <= 1}
                          onClick={() => setHistoryPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={historyPage >= historyTotalPages}
                          onClick={() => setHistoryPage((p) => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Restore Section ───────────────────────────────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border p-4 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-primary" />
                Restore Database
              </CardTitle>
              <CardDescription>
                Upload a previously downloaded backup zip to restore your
                database
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : restoreFile
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-300 dark:border-gray-700 hover:border-primary/60 hover:bg-primary/5"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {restoreFile ? (
                    <div className="space-y-2">
                      <FileArchive className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 break-all">
                        {restoreFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(restoreFile.size / 1024)}
                      </p>
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRestoreFile(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Drag & drop your backup zip
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse — accepts <strong>.zip</strong> only
                      </p>
                    </div>
                  )}
                </div>

                {/* Restore Info + Button */}
                <div className="space-y-4">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Important — Read before restoring
                    </p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li>
                        This will <strong>replace</strong> your current database
                      </li>
                      <li>The action cannot be undone</li>
                      <li>A restore log will be saved in Backup History</li>
                      <li>Reload the app after restoring if needed</li>
                    </ul>
                  </div>

                  <Button
                    className="gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    onClick={handleRestore}
                    disabled={!restoreFile || restoring}
                  >
                    {restoring ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Restore Database
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Restore_Backup;

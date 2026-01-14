import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Database } from "lucide-react";
import { useState } from "react";

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");

  const handleBackupDatabase = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus("Creating backup...");

      // Check if we're in Electron environment
      if (window.electronAPI) {
        const result = await window.electronAPI.backupDatabase();

        if (result.success) {
          setBackupStatus(`✅ Backup saved to: ${result.path}`);
          setTimeout(() => setBackupStatus(""), 5000);
        } else {
          setBackupStatus(`❌ Backup failed: ${result.error}`);
          setTimeout(() => setBackupStatus(""), 5000);
        }
      } else {
        setBackupStatus("❌ Backup only available in desktop app");
        setTimeout(() => setBackupStatus(""), 3000);
      }
    } catch (error) {
      console.error("Backup error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error);
      setBackupStatus(`❌ Error: ${errorMessage}`);
      setTimeout(() => setBackupStatus(""), 5000);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Button
            onClick={handleBackupDatabase}
            disabled={isBackingUp}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isBackingUp ? (
              <>
                <Database className="h-4 w-4 animate-pulse" />
                Backing up...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download DB
              </>
            )}
          </Button>
          <Button onClick={logout}>Logout</Button>
        </div>
      </div>

      {backupStatus && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            backupStatus.startsWith("✅")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <p className="text-sm font-medium">{backupStatus}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.shop_name || user?.username}!</CardTitle>
            <CardDescription>Your shop management dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Here you can manage your shop inventory, sales, and purchases.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shop Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Phone:</strong> {user?.phone || "Not provided"}
              </p>
              <p>
                <strong>Registered on:</strong>{" "}
                {new Date(user?.created_at || "").toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
            <CardDescription>Backup and protect your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Regular backups help protect your shop data. Backups are saved to
              your Documents folder.
            </p>
            <Button
              onClick={handleBackupDatabase}
              disabled={isBackingUp}
              className="w-full"
              variant="secondary"
            >
              {isBackingUp ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-pulse" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

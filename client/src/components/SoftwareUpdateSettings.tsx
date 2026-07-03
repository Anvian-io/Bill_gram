import { Download, RefreshCw, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSoftwareUpdate } from "@/hooks/useSoftwareUpdate";

export default function SoftwareUpdateSettings() {
  const {
    isElectron,
    state,
    currentVersion,
    availableVersion,
    progress,
    errorMessage,
    infoMessage,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useSoftwareUpdate();

  if (!isElectron) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border border-gray-200 p-4 shadow-xl backdrop-blur-sm bg-white/95 dark:border-gray-800 dark:bg-gray-900/95">
        <CardHeader className="border-b border-gray-100 pb-4 dark:border-gray-800">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <RefreshCw className="h-5 w-5 text-primary" />
            Check for Updates
          </CardTitle>
          <CardDescription>
            Check if a newer version of Bill Gram is available and install it here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Current version: <strong>v{currentVersion || "unknown"}</strong>
        </p>

        {state === "available" && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm dark:border-teal-900/40 dark:bg-teal-950/30">
            <p className="font-medium text-teal-950 dark:text-teal-50">
              Update available: v{availableVersion}
            </p>
            <Button size="sm" className="mt-3" onClick={downloadUpdate}>
              <Download className="mr-2 h-4 w-4" />
              Download update
            </Button>
          </div>
        )}

        {state === "downloading" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Downloading update... {progress}%</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {state === "downloaded" && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm dark:border-teal-900/40 dark:bg-teal-950/30">
            <p className="font-medium text-teal-950 dark:text-teal-50">
              Update ready: v{availableVersion}
            </p>
            <Button size="sm" className="mt-3" onClick={installUpdate}>
              <Rocket className="mr-2 h-4 w-4" />
              Restart and update
            </Button>
          </div>
        )}

        {state === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        {state === "idle" && infoMessage && (
          <p className="text-sm text-green-700 dark:text-green-400">{infoMessage}</p>
        )}

        {state === "idle" && !infoMessage && (
          <p className="text-sm text-muted-foreground">
            Click the button below to check the update server for a new version.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={checkForUpdates}
          disabled={state === "checking" || state === "downloading"}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${state === "checking" ? "animate-spin" : ""}`}
          />
          {state === "checking" ? "Checking..." : "Check for updates"}
        </Button>
      </CardContent>
    </Card>
    </motion.div>
  );
}
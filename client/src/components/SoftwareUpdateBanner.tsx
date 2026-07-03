import { Download, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSoftwareUpdate } from "@/hooks/useSoftwareUpdate";

export default function SoftwareUpdateBanner() {
  const {
    isElectron,
    state,
    currentVersion,
    availableVersion,
    progress,
    downloadUpdate,
    installUpdate,
  } = useSoftwareUpdate();

  if (!isElectron) {
    return null;
  }

  const showBanner =
    state === "available" ||
    state === "downloading" ||
    state === "downloaded";

  if (!showBanner) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-teal-200 bg-teal-50 px-4 py-3 text-teal-950 shadow-sm dark:border-teal-900/40 dark:bg-teal-950/40 dark:text-teal-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          {state === "available" && (
            <>
              <p className="text-sm font-semibold">
                Update available
                {availableVersion ? `: v${availableVersion}` : ""}
              </p>
              <p className="text-xs text-teal-800 dark:text-teal-200">
                You are on v{currentVersion || "unknown"}. Download the update to
                install without reinstalling the app.
              </p>
            </>
          )}

          {state === "downloading" && (
            <>
              <p className="text-sm font-semibold">
                Downloading update... {progress}%
              </p>
              <Progress value={progress} className="h-2 max-w-md" />
            </>
          )}

          {state === "downloaded" && (
            <>
              <p className="text-sm font-semibold">
                Update ready to install
                {availableVersion ? `: v${availableVersion}` : ""}
              </p>
              <p className="text-xs text-teal-800 dark:text-teal-200">
                The app will restart and apply the update.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state === "available" && (
            <Button size="sm" onClick={downloadUpdate}>
              <Download className="mr-2 h-4 w-4" />
              Download update
            </Button>
          )}

          {state === "downloaded" && (
            <Button size="sm" onClick={installUpdate}>
              <Rocket className="mr-2 h-4 w-4" />
              Restart and update
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

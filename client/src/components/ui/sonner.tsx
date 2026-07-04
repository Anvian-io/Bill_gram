import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeProvider";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      position="top-center"
      offset={16}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:shadow-lg group-[.toaster]:border group-[.toaster]:rounded-[var(--toast-border-radius)]",
          success:
            "group-[.toaster]:!bg-[var(--toast-success-bg)] group-[.toaster]:!text-[var(--toast-success-text)] group-[.toaster]:!border-[var(--toast-success-border)]",
          error:
            "group-[.toaster]:!bg-[var(--toast-error-bg)] group-[.toaster]:!text-[var(--toast-error-text)] group-[.toaster]:!border-[var(--toast-error-border)]",
          warning:
            "group-[.toaster]:!bg-[var(--toast-warning-bg)] group-[.toaster]:!text-[var(--toast-warning-text)] group-[.toaster]:!border-[var(--toast-warning-border)]",
          info:
            "group-[.toaster]:!bg-[var(--toast-info-bg)] group-[.toaster]:!text-[var(--toast-info-text)] group-[.toaster]:!border-[var(--toast-info-border)]",
          description: "group-[.toast]:opacity-85",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: (
          <CircleCheckIcon
            className="size-4 shrink-0"
            style={{ color: "var(--toast-success-icon)" }}
          />
        ),
        info: (
          <InfoIcon
            className="size-4 shrink-0"
            style={{ color: "var(--toast-info-icon)" }}
          />
        ),
        warning: (
          <TriangleAlertIcon
            className="size-4 shrink-0"
            style={{ color: "var(--toast-warning-icon)" }}
          />
        ),
        error: (
          <OctagonXIcon
            className="size-4 shrink-0"
            style={{ color: "var(--toast-error-icon)" }}
          />
        ),
        loading: (
          <Loader2Icon
            className="size-4 shrink-0 animate-spin"
            style={{ color: "var(--primary)" }}
          />
        ),
      }}
      {...props}
    />
  );
};

export { Toaster };

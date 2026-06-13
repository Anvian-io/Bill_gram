import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success: "group-[.toaster]:!bg-[var(--toast-success-bg)] group-[.toaster]:!text-[var(--toast-success-text)] group-[.toaster]:!border-[var(--toast-success-border)]",
          error: "group-[.toaster]:!bg-[var(--toast-error-bg)] group-[.toaster]:!text-[var(--toast-error-text)] group-[.toaster]:!border-[var(--toast-error-border)]",
          warning: "group-[.toaster]:!bg-[var(--toast-warning-bg)] group-[.toaster]:!text-[var(--toast-warning-text)] group-[.toaster]:!border-[var(--toast-warning-border)]",
          info: "group-[.toaster]:!bg-[var(--toast-info-bg)] group-[.toaster]:!text-[var(--toast-info-text)] group-[.toaster]:!border-[var(--toast-info-border)]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: (
          <CircleCheckIcon
            className="size-4"
            style={{ color: "var(--toast-success-icon)" }}
          />
        ),
        info: (
          <InfoIcon
            className="size-4"
            style={{ color: "var(--toast-info-icon)" }}
          />
        ),
        warning: (
          <TriangleAlertIcon
            className="size-4"
            style={{ color: "var(--toast-warning-icon)" }}
          />
        ),
        error: (
          <OctagonXIcon
            className="size-4"
            style={{ color: "var(--toast-error-icon)" }}
          />
        ),
        loading: (
          <Loader2Icon
            className="size-4 animate-spin"
            style={{ color: "var(--toast-default-icon)" }}
          />
        ),
      }}
      style={
        {
          // Border radius
          "--border-radius": "var(--toast-border-radius)",

          // Success colors
          "--success-bg": "var(--toast-success-bg)",
          "--success-text": "var(--toast-success-text)",
          "--success-border": "var(--toast-success-border)",

          // Error colors
          "--error-bg": "var(--toast-error-bg)",
          "--error-text": "var(--toast-error-text)",
          "--error-border": "var(--toast-error-border)",

          // Warning colors
          "--warning-bg": "var(--toast-warning-bg)",
          "--warning-text": "var(--toast-warning-text)",
          "--warning-border": "var(--toast-warning-border)",

          // Info colors
          "--info-bg": "var(--toast-info-bg)",
          "--info-text": "var(--toast-info-text)",
          "--info-border": "var(--toast-info-border)",

          // Loading/Default colors
          "--normal-bg": "var(--toast-default-bg)",
          "--normal-text": "var(--toast-default-text)",
          "--normal-border": "var(--toast-default-border)",

          // Common properties
          "--gray1": "var(--gray1)",
          "--gray2": "var(--gray2)",
          "--gray3": "var(--gray3)",
          "--gray4": "var(--gray4)",
          "--gray5": "var(--gray5)",
          "--gray6": "var(--gray6)",
          "--gray7": "var(--gray7)",
          "--gray8": "var(--gray8)",
          "--gray9": "var(--gray9)",
          "--gray10": "var(--gray10)",
          "--gray11": "var(--gray11)",
          "--gray12": "var(--gray12)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

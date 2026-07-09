import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useRef } from "react";

interface CustomAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainText: string;
  subText: string;
  nextButtonText: string;
  cancelButtonText?: string;
  onNext: () => void;
  variant?: "default" | "destructive";
  showCancel?: boolean;
  className?: string;
}

export function CustomAlert({
  open,
  onOpenChange,
  mainText,
  subText,
  nextButtonText,
  cancelButtonText = "Cancel",
  onNext,
  variant = "default",
  showCancel = true,
  className,
}: CustomAlertProps) {
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.modalBlockingHover = "true";
    return () => {
      delete document.body.dataset.modalBlockingHover;
    };
  }, [open]);

  const handleNext = () => {
    onNext();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={className}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          actionButtonRef.current?.focus();
        }}
        onKeyDownCapture={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          handleNext();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-heading">
            {mainText}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {subText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel className="hover:bg-button-bg hover:text-hover-text">
              {cancelButtonText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            ref={actionButtonRef}
            onClick={handleNext}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          >
            {nextButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

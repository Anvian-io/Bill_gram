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
  const handleNext = () => {
    onNext();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={className}>
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

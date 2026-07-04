import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MasterFieldWithAddProps {
  children: React.ReactNode;
  onAdd?: () => void;
  disabled?: boolean;
  className?: string;
  addLabel?: string;
}

export function MasterFieldWithAdd({
  children,
  onAdd,
  disabled = false,
  className,
  addLabel = "Add new",
}: MasterFieldWithAddProps) {
  if (!onAdd) {
    return <>{children}</>;
  }

  return (
    <div className={cn("flex w-full items-stretch gap-1", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={onAdd}
        disabled={disabled}
        title={addLabel}
        aria-label={addLabel}
        data-no-enter-next
        data-skip-arrow-nav
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

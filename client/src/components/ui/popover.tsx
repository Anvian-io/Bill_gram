import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { useHoverOpenDelay } from "@/hooks/useHoverOpenDelay"
import { useHoverContainerDismiss } from "@/hooks/useHoverPanelDismiss"

const PopoverHoverContext = React.createContext<{
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
} | null>(null);

function Popover({
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const isOpen = props.open !== undefined ? props.open : open;
  const { scheduleOpen, cancelScheduledOpen } = useHoverOpenDelay();

  const closePopover = React.useCallback(() => {
    setOpen(false);
    props.onOpenChange?.(false);
  }, [props]);

  const openPopover = React.useCallback(() => {
    setOpen(true);
    props.onOpenChange?.(true);
  }, [props]);

  const { cancelDismiss, dismissOnLeave } = useHoverContainerDismiss(
    wrapperRef,
    closePopover,
  );

  const handleMouseEnter = React.useCallback(() => {
    cancelDismiss();
    scheduleOpen(openPopover);
  }, [cancelDismiss, openPopover, scheduleOpen]);

  const handleMouseLeave = React.useCallback(() => {
    cancelScheduledOpen();
    if (isOpen) {
      dismissOnLeave();
    }
  }, [cancelScheduledOpen, dismissOnLeave, isOpen]);

  return (
    <PopoverHoverContext.Provider value={{ handleMouseEnter, handleMouseLeave }}>
      <PopoverPrimitive.Root 
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          props.onOpenChange?.(nextOpen);
        }}
        {...props}
      >
        <div ref={wrapperRef} className="relative w-full">{children}</div>
      </PopoverPrimitive.Root>
    </PopoverHoverContext.Provider>
  )
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const hoverCtx = React.useContext(PopoverHoverContext);
  return (
    <PopoverPrimitive.Trigger 
      data-slot="popover-trigger" 
      onMouseEnter={hoverCtx?.handleMouseEnter}
      onMouseLeave={hoverCtx?.handleMouseLeave}
      {...props} 
    />
  )
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  portalled = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  portalled?: boolean;
}) {
  const hoverCtx = React.useContext(PopoverHoverContext);

  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      onMouseEnter={hoverCtx?.handleMouseEnter}
      onMouseLeave={hoverCtx?.handleMouseLeave}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--radix-popover-content-transform-origin) rounded-md border shadow-md outline-hidden",
        portalled
          ? "w-72"
          : "absolute top-full left-0 mt-1 w-full",
        className
      )}
      {...props}
    />
  );

  if (portalled) {
    return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
  }

  return content;
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

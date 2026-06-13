import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const PopoverHoverContext = React.createContext<{
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
} | null>(null);

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleMouseEnter = React.useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, []);

  return (
    <PopoverHoverContext.Provider value={{ handleMouseEnter, handleMouseLeave }}>
      <PopoverPrimitive.Root 
        open={props.open !== undefined ? props.open : open}
        onOpenChange={(o) => {
          setOpen(o);
          props.onOpenChange?.(o);
        }}
        {...props} 
      />
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
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const hoverCtx = React.useContext(PopoverHoverContext);
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        onMouseEnter={hoverCtx?.handleMouseEnter}
        onMouseLeave={hoverCtx?.handleMouseLeave}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

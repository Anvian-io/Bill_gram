import * as React from "react"

import { cn } from "@/lib/utils"
import { useHoverFocusInput } from "@/hooks/useHoverFocusInput"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  alwaysEditable?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      alwaysEditable,
      readOnly,
      disabled,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const {
      ref: hoverRef,
      skip,
      isEditable,
      handleMouseEnter,
      handleMouseLeave,
      handleFocus,
      handleBlur,
    } = useHoverFocusInput(undefined, { alwaysEditable, readOnly, disabled });

    const mergedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        hoverRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref, hoverRef],
    );

    return (
      <textarea
        data-slot="textarea"
        ref={mergedRef}
        disabled={disabled}
        readOnly={skip ? readOnly : !isEditable || readOnly}
        onMouseEnter={(event) => {
          handleMouseEnter();
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          handleMouseLeave();
          onMouseLeave?.(event);
        }}
        onFocus={(event) => {
          handleFocus();
          onFocus?.(event);
        }}
        onBlur={(event) => {
          handleBlur();
          onBlur?.(event);
        }}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          !skip &&
            !isEditable &&
            "cursor-default read-only:bg-muted/20 read-only:hover:bg-muted/40",
          className
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea";

export { Textarea }

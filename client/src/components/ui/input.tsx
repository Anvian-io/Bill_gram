import * as React from "react";
import { cn } from "@/lib/utils";
import { useHoverFocusInput } from "@/hooks/useHoverFocusInput";

export interface InputProps extends React.ComponentProps<"input"> {
  alwaysEditable?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
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
    } = useHoverFocusInput(type, { alwaysEditable, readOnly, disabled });

    const mergedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        hoverRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref, hoverRef],
    );

    return (
      <input
        type={type}
        data-slot="input"
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
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/70 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          !skip &&
            !isEditable &&
            "cursor-default read-only:bg-muted/20 read-only:hover:bg-muted/40",
          type === "number" &&
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };

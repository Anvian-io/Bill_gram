import type { ChangeEvent, Ref } from "react";

/**
 * Formats a numeric value for display in a number input.
 * Zero and empty values render as an empty field.
 */
export function formatNumberInputValue(
  value: string | number | null | undefined,
): string | number {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (!Number.isNaN(numericValue) && numericValue === 0) {
    return "";
  }

  return value;
}

/**
 * Parses a number input string into a numeric form value.
 * Empty input is treated as zero for calculations.
 */
export function parseNumberInputValue(value: string): number {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalizes number input changes for react-hook-form.
 * Keeps empty values as "" and parses valid numbers.
 */
export function normalizeNumberInputChange(value: string): "" | number {
  if (value.trim() === "") {
    return "";
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

/**
 * Binds a react-hook-form number field to Input with empty-zero display.
 */
export function bindNumberField<
  T extends {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    name: string;
    ref: Ref<HTMLInputElement>;
  },
>(field: T) {
  return {
    name: field.name,
    ref: field.ref,
    onBlur: field.onBlur,
    value: (field.value ?? "") as string | number,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      field.onChange(normalizeNumberInputChange(event.target.value));
    },
  };
}

import * as React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border bg-white text-black shadow-sm dark:bg-gray-900 dark:text-white ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return (
    <div className={`p-4 ${className}`} {...props} />
  );
}
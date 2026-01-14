// Parent component
import React from "react";

interface MainLayoutProps {
  isExpanded?: boolean;
  children?: React.ReactNode;
}

export function MainLayout({ isExpanded = false, children }: MainLayoutProps) {
  return (
    <div
      className={`flex-1 transition-all duration-300 ease-in-out 
            ${isExpanded ? "sm:ml-64" : "sm:ml-16"}`}
    >
      {children}
    </div>
  );
}
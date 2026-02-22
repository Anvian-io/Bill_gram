import React, { useState, useRef, useEffect } from "react";
import PurchaseSummary from "./PurchaseSummary";
import PurchaseRegister from "./PurchaseRegister";

export default function Purchase() {
  const [activeTab, setActiveTab] = useState<"summary" | "register">("summary");

  // Refs for measuring tab positions
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const summaryTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);

  // State for the sliding indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position based on active tab
  const updateIndicator = () => {
    const activeRef = activeTab === "summary" ? summaryTabRef : registerTabRef;
    if (activeRef.current && tabsContainerRef.current) {
      const containerRect = tabsContainerRef.current.getBoundingClientRect();
      const activeRect = activeRef.current.getBoundingClientRect();

      // Calculate left offset relative to the container
      const left = activeRect.left - containerRect.left;
      const width = activeRect.width;

      setIndicatorStyle({ left, width });
    }
  };

  // Run on mount, activeTab change, and window resize
  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-9xl mx-auto">
        <div className="flex flex-col">
          {/* Sticky tab navigation with sliding indicator */}
          <div
            ref={tabsContainerRef}
            className="sticky top-0 z-10 bg-background border-b border-gray-200 relative"
          >
            {/* Sliding indicator (border + background) */}
            <div
              className="absolute bottom-0 h-full bg-primary/10 border-b-2 border-primary transition-all duration-300 ease-in-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />

            {/* Summary Tab */}
            <button
              ref={summaryTabRef}
              onClick={() => setActiveTab("summary")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none
                ${
                  activeTab === "summary"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Purchase Summary
            </button>

            {/* Register Tab */}
            <button
              ref={registerTabRef}
              onClick={() => setActiveTab("register")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none
                ${
                  activeTab === "register"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Purchase Register
            </button>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "summary" ? <PurchaseSummary /> : <PurchaseRegister />}
          </div>
        </div>
      </div>
    </div>
  );
}
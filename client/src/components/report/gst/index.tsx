import React, { useState, useRef, useEffect } from "react";
import PurchaseGST from "./PurchaseGST";
import SalesGST from "./SalesGST";
import B2B from "./B2B";
import B2C from "./B2C";
import PurchaseMonthlyGST from "./PurchaseMonthlyGST";
import SalesMonthlyGST from "./SalesMonthlyGST";

export default function GST() {
  const [activeTab, setActiveTab] = useState<
    | "purchaseGst"
    | "salesGst"
    | "b2b"
    | "b2c"
    | "purchaseMonthlyGst"
    | "salesMonthlyGst"
  >("purchaseGst");

  // Refs for measuring tab positions
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const purchaseGstTabRef = useRef<HTMLButtonElement>(null);
  const salesGstTabRef = useRef<HTMLButtonElement>(null);
  const b2bTabRef = useRef<HTMLButtonElement>(null);
  const b2cTabRef = useRef<HTMLButtonElement>(null);
  const purchaseMonthlyGstTabRef = useRef<HTMLButtonElement>(null);
  const salesMonthlyGstTabRef = useRef<HTMLButtonElement>(null);

  // State for the sliding indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Map active tab to its ref
  const getActiveTabRef = () => {
    switch (activeTab) {
      case "purchaseGst":
        return purchaseGstTabRef;
      case "salesGst":
        return salesGstTabRef;
      case "b2b":
        return b2bTabRef;
      case "b2c":
        return b2cTabRef;
      case "purchaseMonthlyGst":
        return purchaseMonthlyGstTabRef;
      case "salesMonthlyGst":
        return salesMonthlyGstTabRef;
      default:
        return purchaseGstTabRef;
    }
  };

  // Update indicator position based on active tab
  const updateIndicator = () => {
    const activeRef = getActiveTabRef();
    if (activeRef.current && tabsContainerRef.current) {
      const containerRect = tabsContainerRef.current.getBoundingClientRect();
      const activeRect = activeRef.current.getBoundingClientRect();

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
            className="sticky top-0 z-10 bg-background border-b border-gray-200 relative overflow-x-auto whitespace-nowrap"
          >
            {/* Sliding indicator (border + background) */}
            <div
              className="absolute bottom-0 h-full bg-primary/10 border-b-2 border-primary transition-all duration-300 ease-in-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />

            {/* Purchase GST Tab */}
            <button
              ref={purchaseGstTabRef}
              onClick={() => setActiveTab("purchaseGst")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none inline-block
                ${
                  activeTab === "purchaseGst"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Purchase GST
            </button>

            {/* Sales GST Tab */}
            <button
              ref={salesGstTabRef}
              onClick={() => setActiveTab("salesGst")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none inline-block
                ${
                  activeTab === "salesGst"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Sales GST
            </button>

            {/* B2B Tab */}
            <button
              ref={b2bTabRef}
              onClick={() => setActiveTab("b2b")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none inline-block
                ${
                  activeTab === "b2b"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              B2B
            </button>

            {/* B2C Tab */}
            <button
              ref={b2cTabRef}
              onClick={() => setActiveTab("b2c")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none inline-block
                ${
                  activeTab === "b2c"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              B2C
            </button>

            {/* Purchase Monthly GST Tab */}
            <button
              ref={purchaseMonthlyGstTabRef}
              onClick={() => setActiveTab("purchaseMonthlyGst")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none inline-block
                ${
                  activeTab === "purchaseMonthlyGst"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Purchase Monthly GST
            </button>

            {/* Sales Monthly GST Tab */}
            <button
              ref={salesMonthlyGstTabRef}
              onClick={() => setActiveTab("salesMonthlyGst")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none inline-block
                ${
                  activeTab === "salesMonthlyGst"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Sales Monthly GST
            </button>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "purchaseGst" && <PurchaseGST />}
            {activeTab === "salesGst" && <SalesGST />}
            {activeTab === "b2b" && <B2B />}
            {activeTab === "b2c" && <B2C />}
            {activeTab === "purchaseMonthlyGst" && <PurchaseMonthlyGST />}
            {activeTab === "salesMonthlyGst" && <SalesMonthlyGST />}
          </div>
        </div>
      </div>
    </div>
  );
}

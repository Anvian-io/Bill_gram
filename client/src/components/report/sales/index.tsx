import React, { useState, useRef, useEffect } from "react";
import SalesSummary from "./SalesSummary";
import SalesRegister from "./SalesRegister";
import AreaWise from "./AreaWise";
import SalesmanWise from "./SalesmanWise";

export default function Sales() {
  const [activeTab, setActiveTab] = useState<
    "summary" | "register" | "areaWise" | "salesmanWise"
  >("summary");

  // Refs for measuring tab positions
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const summaryTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);
  const areaWiseTabRef = useRef<HTMLButtonElement>(null);
  const salesmanWiseTabRef = useRef<HTMLButtonElement>(null);

  // State for the sliding indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Map active tab to its ref
  const getActiveTabRef = () => {
    switch (activeTab) {
      case "summary":
        return summaryTabRef;
      case "register":
        return registerTabRef;
      case "areaWise":
        return areaWiseTabRef;
      case "salesmanWise":
        return salesmanWiseTabRef;
      default:
        return summaryTabRef;
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

            {/* Sales Summary Tab */}
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
              Sales Summary
            </button>

            {/* Sales Register Tab */}
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
              Sales Register
            </button>

            {/* Area Wise Tab */}
            <button
              ref={areaWiseTabRef}
              onClick={() => setActiveTab("areaWise")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none
                ${
                  activeTab === "areaWise"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Area Wise
            </button>

            {/* Salesman Wise Tab */}
            <button
              ref={salesmanWiseTabRef}
              onClick={() => setActiveTab("salesmanWise")}
              className={`
                relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                focus:outline-none
                ${
                  activeTab === "salesmanWise"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Salesman Wise
            </button>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "summary" && <SalesSummary />}
            {activeTab === "register" && <SalesRegister />}
            {activeTab === "areaWise" && <AreaWise />}
            {activeTab === "salesmanWise" && <SalesmanWise />}
          </div>
        </div>
      </div>
    </div>
  );
}

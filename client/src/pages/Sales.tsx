import React, { useState, useRef, useEffect } from "react";
import AddSales from "@/components/sales/AddSales";
import SalesList from "@/components/sales/SalesList";
import SalesHistory from "@/components/sales/SalesHistory";

export default function Sales() {
  const [activeTab, setActiveTab] = useState<"add" | "sales" | "history">(
    "add",
  );

  // Refs for measuring tab positions
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const salesTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);

  // State for the sliding indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position based on active tab
  const updateIndicator = () => {
    // Determine which ref is active
    let activeRef;
    if (activeTab === "add") activeRef = addTabRef;
    else if (activeTab === "sales") activeRef = salesTabRef;
    else activeRef = historyTabRef;

    if (activeRef?.current && tabsContainerRef.current) {
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
    <div className="h-[calc(100vh-4rem)] bg-background">
      <div className="h-full overflow-y-auto">
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

              {/* Add Sales Tab */}
              <button
                ref={addTabRef}
                onClick={() => setActiveTab("add")}
                className={`
                  relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                  focus:outline-none
                  ${
                    activeTab === "add"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Add Sales
              </button>

              {/* Sales Tab */}
              <button
                ref={salesTabRef}
                onClick={() => setActiveTab("sales")}
                className={`
                  relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                  focus:outline-none
                  ${
                    activeTab === "sales"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Sales
              </button>

              {/* Sales History Tab */}
              <button
                ref={historyTabRef}
                onClick={() => setActiveTab("history")}
                className={`
                  relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                  focus:outline-none
                  ${
                    activeTab === "history"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Sales History
              </button>
            </div>

            {/* Tab content */}
            <div>
              <div className={activeTab === "add" ? "block" : "hidden"}>
                <AddSales />
              </div>
              <div className={activeTab === "sales" ? "block" : "hidden"}>
                <SalesList />
              </div>
              <div className={activeTab === "history" ? "block" : "hidden"}>
                <SalesHistory />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

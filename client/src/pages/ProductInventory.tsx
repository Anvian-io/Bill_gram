import React, { useState, useRef, useEffect } from "react";
import AddProduct from "@/components/product/AddProduct";
import ProductInventoryList from "@/components/product/ProductInventory";
import ProductHistory from "@/components/product/ProductHistory";

export default function ProductInventory() {
  const [activeTab, setActiveTab] = useState<"add" | "inventory" | "history">(
    "inventory",
  );

  // Refs for measuring tab positions
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const inventoryTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);

  // State for the sliding indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position based on active tab
  const updateIndicator = () => {
    // Determine which ref is active
    let activeRef;
    if (activeTab === "add") activeRef = addTabRef;
    else if (activeTab === "inventory") activeRef = inventoryTabRef;
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

              {/* Add Product Tab */}
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
                Add Product
              </button>

              {/* Product Inventory Tab */}
              <button
                ref={inventoryTabRef}
                onClick={() => setActiveTab("inventory")}
                className={`
                  relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                  focus:outline-none
                  ${
                    activeTab === "inventory"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Product Inventory
              </button>

              {/* History Tab */}
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
                History
              </button>
            </div>

            {/* Tab content */}
            <div>
              <div className={activeTab === "add" ? "block" : "hidden"}>
                <AddProduct />
              </div>
              <div className={activeTab === "inventory" ? "block" : "hidden"}>
                <ProductInventoryList />
              </div>
              <div className={activeTab === "history" ? "block" : "hidden"}>
                <ProductHistory />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

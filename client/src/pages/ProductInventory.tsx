import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddProduct from "@/components/product/AddProduct";
import ProductInventoryList from "@/components/product/ProductInventory";
import ProductHistory from "@/components/product/ProductHistory";

type ProductTab = "add" | "inventory" | "history";

export default function ProductInventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProductTab>("inventory");

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const inventoryTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const handleTabChange = (tab: ProductTab) => {
    setActiveTab(tab);
    if (tab === "add") {
      setSearchParams({ id: "new" }, { replace: true });
    } else {
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
    }
  };

  const updateIndicator = () => {
    let activeRef;
    if (activeTab === "add") activeRef = addTabRef;
    else if (activeTab === "inventory") activeRef = inventoryTabRef;
    else activeRef = historyTabRef;

    if (activeRef?.current && tabsContainerRef.current) {
      const containerRect = tabsContainerRef.current.getBoundingClientRect();
      const activeRect = activeRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }
  };

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
            <div
              ref={tabsContainerRef}
              className="sticky top-0 z-10 bg-background border-b border-gray-200 relative"
            >
              <div
                className="absolute bottom-0 h-full bg-primary/10 border-b-2 border-primary transition-all duration-300 ease-in-out"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                }}
              />

              <button
                ref={addTabRef}
                onClick={() => handleTabChange("add")}
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

              <button
                ref={inventoryTabRef}
                onClick={() => handleTabChange("inventory")}
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

              <button
                ref={historyTabRef}
                onClick={() => handleTabChange("history")}
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

            <div>
              {activeTab === "add" && <AddProduct />}
              {activeTab === "inventory" && <ProductInventoryList />}
              {activeTab === "history" && <ProductHistory />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

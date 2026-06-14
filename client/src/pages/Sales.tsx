import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddSales from "@/components/sales/AddSales";
import SalesList from "@/components/sales/SalesList";
import SalesHistory from "@/components/sales/SalesHistory";

type SalesTab = "add" | "return" | "sales" | "history";

export default function Sales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SalesTab>("add");

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const returnTabRef = useRef<HTMLButtonElement>(null);
  const salesTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const handleTabChange = (tab: SalesTab) => {
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
    else if (activeTab === "return") activeRef = returnTabRef;
    else if (activeTab === "sales") activeRef = salesTabRef;
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
                Add Sales
              </button>

              <button
                ref={returnTabRef}
                onClick={() => handleTabChange("return")}
                className={`
                  relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                  focus:outline-none
                  ${
                    activeTab === "return"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Sales Return
              </button>

              <button
                ref={salesTabRef}
                onClick={() => handleTabChange("sales")}
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
                Sales History
              </button>
            </div>

            <div>
              {activeTab === "add" && <AddSales />}
              {activeTab === "return" && <AddSales mode="return" />}
              {activeTab === "sales" && <SalesList />}
              {activeTab === "history" && <SalesHistory />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

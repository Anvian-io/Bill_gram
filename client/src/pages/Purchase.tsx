import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddPurchase from "@/components/purchase/AddPurchase";
import PurchaseList from "@/components/purchase/PurchaseList";
import PurchaseHistory from "@/components/purchase/PurchaseHistory";

type PurchaseTab = "add" | "return" | "purchase" | "history";

export default function Purchase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PurchaseTab>("add");

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const returnTabRef = useRef<HTMLButtonElement>(null);
  const purchaseTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const handleTabChange = (tab: PurchaseTab) => {
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
    else if (activeTab === "purchase") activeRef = purchaseTabRef;
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
    if (searchParams.has("id")) {
      setActiveTab("add");
    }
  }, [searchParams]);

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
                Add Purchase
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
                Purchase Return
              </button>

              <button
                ref={purchaseTabRef}
                onClick={() => handleTabChange("purchase")}
                className={`
                  relative z-10 py-2 px-4 font-medium text-sm transition-colors duration-200
                  focus:outline-none
                  ${
                    activeTab === "purchase"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Purchase
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
                Purchase History
              </button>
            </div>

            <div>
              {activeTab === "add" && <AddPurchase />}
              {activeTab === "return" && <AddPurchase mode="return" />}
              {activeTab === "purchase" && <PurchaseList />}
              {activeTab === "history" && <PurchaseHistory />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

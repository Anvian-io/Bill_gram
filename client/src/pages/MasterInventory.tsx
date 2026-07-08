import React, { useEffect, useState } from "react";
import { useHoverOpen } from "@/hooks/useHoverOpen";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Ruler,
  Building,
  Users,
  UserCircle,
  MapPin,
  Truck,
  CreditCard,
  Pin,
  PinOff,
  Menu,
} from "lucide-react";
import ProductGroup from "../components/master/ProductGroup";
import Unit from "../components/master/Unit";
import ProductCompany from "../components/master/ProductCompany";
import Salesman from "../components/master/Salesman";
import Customer from "../components/master/Customer";
import Area from "../components/master/Area";
import Van from "../components/master/Van";
import Account from "../components/master/Account";
import Supplier from "@/components/master/Supplier";
import { cn } from "@/lib/utils";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: number;
  category?: string;
}

const PINNED_MASTER_KEY = "pinnedMasterNavItems";

export default function MasterInventory() {
  const [activeSection, setActiveSection] = useState<string>("product-group");
  const {
    open: isExpanded,
    onMouseEnter,
    onMouseLeave,
  } = useHoverOpen(300);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [pinnedItems, setPinnedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_MASTER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const sidebarItems: SidebarItem[] = [
    {
      id: "product-group",
      label: "Product Group",
      icon: <Layers className="h-5 w-5" />,
      component: <ProductGroup />,
      // badge: 25,
      category: "product",
    },
    {
      id: "unit",
      label: "Unit",
      icon: <Ruler className="h-5 w-5" />,
      component: <Unit />,
      // badge: 15,
      category: "product",
    },
    {
      id: "product-company",
      label: "Product Company",
      icon: <Building className="h-5 w-5" />,
      component: <ProductCompany />,
      // badge: 42,
      category: "product",
    },
    {
      id: "supplier",
      label: "Supplier",
      icon: <Building className="h-5 w-5" />,
      component: <Supplier />,
      // badge: 12,
      category: "sales",
    },
    {
      id: "salesman",
      label: "Salesman",
      icon: <Users className="h-5 w-5" />,
      component: <Salesman />,
      // badge: 8,
      category: "sales",
    },
    {
      id: "customer",
      label: "Shops",
      icon: <UserCircle className="h-5 w-5" />,
      component: <Customer />,
      // badge: 156,
      category: "sales",
    },
    {
      id: "area",
      label: "Area",
      icon: <MapPin className="h-5 w-5" />,
      component: <Area />,
      // badge: 24,
      category: "sales",
    },
    {
      id: "van",
      label: "Van",
      icon: <Truck className="h-5 w-5" />,
      component: <Van />,
      // badge: 12,
      category: "sales",
    },
    {
      id: "account",
      label: "Account",
      icon: <CreditCard className="h-5 w-5" />,
      component: <Account />,
      // badge: 36,
      category: "finance",
    },
  ];

  const categories = [
    { id: "all", label: "All", color: "bg-blue-100 text-blue-800" },
    { id: "product", label: "Product", color: "bg-green-100 text-green-800" },
    { id: "sales", label: "Sales", color: "bg-purple-100 text-purple-800" },
    { id: "finance", label: "Finance", color: "bg-amber-100 text-amber-800" },
  ];

  useEffect(() => {
    localStorage.setItem(PINNED_MASTER_KEY, JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  const filteredItems = (
    activeCategory === "all"
      ? sidebarItems
      : sidebarItems.filter((item) => item.category === activeCategory)
  ).sort((a, b) => {
    const aPinned = pinnedItems.includes(a.id);
    const bPinned = pinnedItems.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const togglePinItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      <motion.aside
        className="relative shrink-0 h-full border-r border-border bg-card shadow-sm z-20 overflow-hidden"
        animate={{ width: isExpanded ? 280 : 72 }}
        initial={false}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex h-full flex-col py-4 px-2">
          <div className="mb-4 flex items-center px-2 h-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15 shrink-0">
              <Menu className="h-5 w-5 text-foreground" />
            </div>
            <span
              className={cn(
                "ml-3 font-semibold text-foreground whitespace-nowrap transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0",
              )}
            >
              Master Data
            </span>
          </div>

          {/* {isExpanded && (
            <motion.div
              className="mb-4 px-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex gap-1 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                      activeCategory === category.id
                        ? category.color
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )} */}

          <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1">
            {filteredItems.map((item) => {
              const isActive = activeSection === item.id;
              const isPinned = pinnedItems.includes(item.id);

              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-foreground hover:text-primary hover:bg-primary/10",
                    )}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex items-center justify-between flex-1 overflow-hidden"
                        >
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {/* {item.badge !== undefined && (
                            <Badge
                              variant={isActive ? "secondary" : "outline"}
                              className="ml-2"
                            >
                              {item.badge}
                            </Badge>
                          )} */}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => togglePinItem(item.id, e)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all",
                        isPinned
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                      )}
                      title={isPinned ? "Unpin item" : "Pin item"}
                    >
                      {isPinned ? (
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <PinOff className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      <div className="flex-1 min-w-0 overflow-auto">
        <div className="h-full p-1">
          <Card className="border-none shadow-sm h-full">
            <CardContent className="h-full p-0">
              {sidebarItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "h-full",
                    activeSection === item.id ? "block" : "hidden",
                  )}
                >
                  {item.component}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

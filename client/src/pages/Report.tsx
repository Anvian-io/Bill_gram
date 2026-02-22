import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ShoppingCart,
  DollarSign,
  Calculator,
} from "lucide-react";
import { Purchase, Sales, GST } from "@/components/report";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: number;
  category: "purchase" | "sales" | "gst";
}

export default function Report() {
  const [activeSection, setActiveSection] = useState<string>("purchase");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const sidebarItems: SidebarItem[] = [
    {
      id: "purchase",
      label: "Purchase",
      icon: <ShoppingCart className="h-5 w-5" />,
      component: <Purchase />,
      badge: 12,
      category: "purchase",
    },
    {
      id: "sales",
      label: "Sales",
      icon: <DollarSign className="h-5 w-5" />,
      component: <Sales />,
      badge: 24,
      category: "sales",
    },
    {
      id: "gst",
      label: "GST",
      icon: <Calculator className="h-5 w-5" />,
      component: <GST />,
      badge: 4,
      category: "gst",
    },
  ];

  const categories = [
    { id: "all", label: "All", color: "bg-blue-100 text-blue-800" },
    { id: "purchase", label: "Purchase", color: "bg-green-100 text-green-800" },
    { id: "sales", label: "Sales", color: "bg-purple-100 text-purple-800" },
    { id: "gst", label: "GST", color: "bg-amber-100 text-amber-800" },
  ];

  const filteredItems =
    activeCategory === "all"
      ? sidebarItems
      : sidebarItems.filter((item) => item.category === activeCategory);

  const activeItem = sidebarItems.find((item) => item.id === activeSection);

  const sidebarVariants = {
    collapsed: { width: 70, transition: { duration: 0.3 } },
    expanded: { width: 280, transition: { duration: 0.3 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-background">
      {/* Left Sidebar */}
      <motion.div
        className="flex-shrink-0 border-r border-border bg-card h-full overflow-y-auto"
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        initial={false}
      >
        <div className="h-full py-4 px-3">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-6 px-2">
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-semibold text-foreground"
              >
                Reports
              </motion.h2>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-secondary"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </motion.button>
          </div>

          {/* Category Filter */}
          {!isCollapsed && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                      activeCategory === category.id
                        ? category.color
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sidebar Items */}
          <nav className="space-y-1">
            {filteredItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <div className="flex-shrink-0">{item.icon}</div>

                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center justify-between flex-1 overflow-hidden"
                    >
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge
                          variant={
                            activeSection === item.id ? "secondary" : "outline"
                          }
                          className="ml-2"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Main Content Area - Fixed layout with internal scrolling */}
      <div className="flex-1 overflow-hidden h-full flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex-1 flex flex-col min-h-0"
          >

            {/* Content - Scrollable area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-background">
              {activeItem?.component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

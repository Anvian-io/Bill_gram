import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Package,
  Layers,
  Ruler,
  Building,
  Users,
  UserCircle,
  MapPin,
  Truck,
  CreditCard,
  Wallet,
  Banknote,
  PieChart,
} from "lucide-react";
// import ProductInventory from "./ProductInventory";
import ProductGroup from "../components/master/ProductGroup";
import Unit from "../components/master/Unit";
import ProductCompany from "../components/master/ProductCompany";
import Salesman from "../components/master/Salesman";
import Customer from "../components/master/Customer";
import Area from "../components/master/Area";
import Van from "../components/master/Van";
import Account from "../components/master/Account";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: number;
  category?: string;
}

export default function MasterInventory() {
  const [activeSection, setActiveSection] = useState<string>("product-group");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const sidebarItems: SidebarItem[] = [
    // Product Management
    {
      id: "product-group",
      label: "Product Group",
      icon: <Layers className="h-5 w-5" />,
      component: <ProductGroup />,
      badge: 25,
      category: "product",
    },
    {
      id: "unit",
      label: "Unit",
      icon: <Ruler className="h-5 w-5" />,
      component: <Unit />,
      badge: 15,
      category: "product",
    },
    {
      id: "product-company",
      label: "Product Company",
      icon: <Building className="h-5 w-5" />,
      component: <ProductCompany />,
      badge: 42,
      category: "product",
    },

    // Sales Management
    {
      id: "salesman",
      label: "Salesman",
      icon: <Users className="h-5 w-5" />,
      component: <Salesman />,
      badge: 8,
      category: "sales",
    },
    {
      id: "customer",
      label: "Customer",
      icon: <UserCircle className="h-5 w-5" />,
      component: <Customer />,
      badge: 156,
      category: "sales",
    },
    {
      id: "area",
      label: "Area",
      icon: <MapPin className="h-5 w-5" />,
      component: <Area />,
      badge: 24,
      category: "sales",
    },
    {
      id: "van",
      label: "Van",
      icon: <Truck className="h-5 w-5" />,
      component: <Van />,
      badge: 12,
      category: "sales",
    },

    // Account Management
    {
      id: "account",
      label: "Account",
      icon: <CreditCard className="h-5 w-5" />,
      component: <Account />,
      badge: 36,
      category: "finance",
    },
  ];

  // Category sections
  const categories = [
    { id: "all", label: "All", color: "bg-blue-100 text-blue-800" },
    { id: "product", label: "Product", color: "bg-green-100 text-green-800" },
    { id: "sales", label: "Sales", color: "bg-purple-100 text-purple-800" },
    { id: "finance", label: "Finance", color: "bg-amber-100 text-amber-800" },
  ];

  const filteredItems =
    activeCategory === "all"
      ? sidebarItems
      : sidebarItems.filter((item) => item.category === activeCategory);

  const activeItem = sidebarItems.find((item) => item.id === activeSection);

  // Animation variants
  const sidebarVariants = {
    collapsed: { width: 70, transition: { duration: 0.3 } },
    expanded: { width: 280, transition: { duration: 0.3 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-background">
      {/* Left Sidebar */}
      <motion.div
        className={`flex-shrink-0 border-r border-border bg-card ${
          isCollapsed ? "overflow-hidden" : ""
        }`}
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
                Master Data
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

          {/* Collapsed View Labels */}
          {isCollapsed && (
            <div className="absolute left-full top-0 ml-2 mt-4">
              {sidebarItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute"
                  style={{
                    top: `${sidebarItems.indexOf(item) * 60 + 20}px`,
                  }}
                >
                  <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg text-sm whitespace-nowrap">
                    {item.label}
                    {item.badge && (
                      <Badge className="ml-2" variant="secondary">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="h-full p-6"
          >
            {/* Content Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {activeItem?.icon}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-heading">
                      {activeItem?.label} Management
                    </h1>
                    <p className="text-muted-foreground">
                      Manage and organize your {activeItem?.label.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeItem?.badge && (
                    <Badge variant="secondary" className="px-3 py-1">
                      {activeItem.badge} Total
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Items
                        </p>
                        <p className="text-2xl font-bold">
                          {activeItem?.badge || 0}
                        </p>
                      </div>
                      {/* <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/30">
                        {activeItem?.icon &&
                          React.cloneElement(
                            activeItem.icon as React.ReactElement,
                            {
                              className:
                                "h-5 w-5 text-blue-600 dark:text-blue-400",
                            }
                          )}
                      </div> */}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold">
                          {Math.floor((activeItem?.badge || 0) * 0.85)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <div className="h-5 w-5 rounded-full bg-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Inactive
                        </p>
                        <p className="text-2xl font-bold">
                          {Math.floor((activeItem?.badge || 0) * 0.15)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <div className="h-5 w-5 rounded-full bg-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          This Month
                        </p>
                        <p className="text-2xl font-bold">
                          +{Math.floor((activeItem?.badge || 0) * 0.1)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <div className="h-5 w-5 text-purple-600 dark:text-purple-400">
                          ↗
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Content Area */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">{activeItem?.component}</CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

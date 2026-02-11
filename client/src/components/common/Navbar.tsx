import React, { useState, useEffect } from "react";
import { Menu, Moon, Sun, X, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "../../contexts/ThemeProvider";
import { Header } from "./Header";
import { type NavItem, navItems } from "@/lib/route_variables";
import { Link, useLocation } from "react-router-dom"; // Remove useNavigate

interface NavbarProps {
  children: React.ReactNode;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export function Navbar({ children, isExpanded, setIsExpanded }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState<
    { label: string; path?: string }[]
  >([]);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const location = useLocation();

  // Load pinned items from localStorage on component mount
  useEffect(() => {
    const savedPinnedItems = localStorage.getItem("pinnedNavItems");
    if (savedPinnedItems) {
      try {
        setPinnedItems(JSON.parse(savedPinnedItems));
      } catch (error) {
        console.error("Error parsing pinned items from localStorage:", error);
      }
    }
  }, []);

  // Save pinned items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("pinnedNavItems", JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  // Set current page based on current route
  useEffect(() => {
    const currentItem = navItems.find(
      (item) => item.href === location.pathname
    );

    if (currentItem) {
      setCurrentPage([
        {
          label: currentItem.pages,
          path: currentItem.href,
        },
      ]);
    } else {
      setCurrentPage([
        {
          label: "Home",
          path: "/",
        },
      ]);
    }
  }, [location.pathname]);

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavItemClick = (item: NavItem) => {
    // Only update current page and close mobile menu
    setCurrentPage([
      {
        label: item.pages,
        path: item.href,
      },
    ]);
    setIsMobileMenuOpen(false);
    // REMOVED: navigate(item.href); // Let the Link component handle navigation
  };

  const togglePinItem = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setPinnedItems((prev) => {
      if (prev.includes(href)) {
        return prev.filter((item) => item !== href);
      } else {
        return [...prev, href];
      }
    });
  };

  // Sort nav items: pinned items first, then others
  const getSortedNavItems = () => {
    const sorted = [...navItems].sort((a, b) => {
      const aPinned = pinnedItems.includes(a.href);
      const bPinned = pinnedItems.includes(b.href);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

    return sorted;
  };

  const sortedNavItems = getSortedNavItems();
  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

  return (
    <div className="h-screen bg-background text-foreground">
      <div className="flex h-full">
        {/* Desktop Sidebar - hidden on mobile */}
        <nav
          className={`
            hidden sm:block
            fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
            ${isExpanded ? "w-64" : "w-16"}
            bg-sidebar border-r border-sidebar-border shadow-lg
          `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-start h-16 px-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sidebar-accent">
                  <Menu className="w-5 h-5 text-sidebar-foreground" />
                </div>
                <span
                  className={`font-semibold text-lg text-sidebar-foreground transition-opacity duration-300 ${
                    isExpanded ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Dashboard
                </span>
              </div>
            </div>

            {/* Navigation - Fixed height with scroll */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
              <ul className="space-y-2">
                {sortedNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  const isPinned = pinnedItems.includes(item.href);

                  return (
                    <li key={index}>
                      <div className="relative group">
                        <Link
                          to={item.href}
                          onClick={() => handleNavItemClick(item)}
                          className={`
                            flex items-center px-3 py-3 rounded-lg transition-all duration-200
                            ${
                              isActive
                                ? "text-primary bg-primary/10 border border-primary/20"
                                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                            }
                          `}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span
                            className={`ml-3 transition-all duration-300 whitespace-nowrap ${
                              isExpanded
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-2"
                            }`}
                          >
                            {item.label}
                          </span>
                        </Link>

                        {/* Pin button - only visible when sidebar is expanded */}
                        {(isExpanded || isMobileMenuOpen) && (
                          <button
                            onClick={(e) => togglePinItem(item.href, e)}
                            className={`
                              absolute right-2 top-1/2 transform -translate-y-1/2
                              p-1.5 rounded-md transition-all duration-200
                              ${
                                isPinned
                                  ? "text-primary bg-primary/10"
                                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                              }
                              opacity-100 group-hover:opacity-100
                              ${isExpanded ? "" : "hidden"}
                            `}
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
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="flex-shrink-0 p-3 border-t border-border">
              <Button
                onClick={handleThemeChange}
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 py-3 h-auto text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                <span
                  className={`ml-3 transition-all duration-300 whitespace-nowrap ${
                    isExpanded
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-2"
                  }`}
                >
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Sidebar Overlay */}
        <div
          className={`sm:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileMenu}
          />

          {/* Mobile Sidebar */}
          <nav
            className={`fixed left-0 top-0 h-full w-64 z-50 bg-sidebar border-r border-sidebar-border shadow-lg transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header with Close Button */}
              <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sidebar-accent">
                    <Menu className="w-5 h-5 text-sidebar-foreground" />
                  </div>
                  <span className="font-semibold text-lg text-sidebar-foreground">
                    Dashboard
                  </span>
                </div>
                <Button
                  onClick={toggleMobileMenu}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation - Fixed height with scroll */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-2">
                  {sortedNavItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    const isPinned = pinnedItems.includes(item.href);

                    return (
                      <li key={index}>
                        <div className="relative group">
                          <Link
                            to={item.href}
                            onClick={() => handleNavItemClick(item)}
                            className={`
                              flex items-center px-1 py-3 rounded-lg transition-all duration-200
                              ${
                                isActive
                                  ? "text-primary bg-primary/10 border border-primary/20"
                                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                              }
                            `}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="ml-3 whitespace-nowrap">
                              {item.label}
                            </span>
                          </Link>

                          {/* Pin button - always visible on mobile */}
                          <button
                            onClick={(e) => togglePinItem(item.href, e)}
                            className={`
                              absolute right-2 top-1/2 transform -translate-y-1/2
                              p-1.5 rounded-md transition-all duration-200
                              ${
                                isPinned
                                  ? "text-primary bg-primary/10"
                                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                              }
                            `}
                            title={isPinned ? "Unpin item" : "Pin item"}
                          >
                            {isPinned ? (
                              <Pin className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <PinOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0 p-3 border-t border-border">
                <Button
                  onClick={handleThemeChange}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start px-3 py-3 h-auto text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                  <span className="ml-3 whitespace-nowrap">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </Button>
              </div>
            </div>
          </nav>
        </div>

        {/* Mobile Menu Button - only visible on mobile */}
        <Button
          onClick={toggleMobileMenu}
          className="h-16 w-16 rounded-none sm:hidden fixed top-0 left-0 z-30 p-2 border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          variant="ghost"
          size="sm"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sidebar-accent">
            <Menu className="w-5 h-5" />
          </div>
        </Button>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out h-full 
            ${isExpanded ? "sm:ml-64" : "sm:ml-16"} 
            ml-0 
            bg-background`}
        >
          <Header isExpanded={isExpanded} pages={currentPage} />
          <div className="mt-16 flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

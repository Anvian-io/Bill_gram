import {
  Home,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  // Store,
  Download,
  User,
  // Settings,
  Layers,
  type LucideIcon,
  Bell,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  id: string;
  pages: string;
}

export const navItems: NavItem[] = [
  {
    icon: Home,
    label: "Dashboard",
    href: "/",
    id: "dashboard",
    pages: "Dashboard",
  },
  {
    icon: Layers,
    label: "Master",
    href: "/master",
    id: "master",
    pages: "Master",
  },
  {
    icon: Package,
    label: "Products & Inventory",
    href: "/product-inventory",
    id: "products",
    pages: "Products",
  },
  {
    icon: ShoppingCart,
    label: "Sales",
    href: "/sales",
    id: "sales",
    pages: "Sales",
  },
  {
    icon: Receipt,
    label: "Purchases",
    href: "/purchases",
    id: "purchases",
    pages: "Purchases",
  },
  {
    icon: FileText,
    label: "Reports",
    href: "/reports",
    id: "reports",
    pages: "Reports",
  },
  {
    icon: Download,
    label: "Backup & Restore",
    href: "/backup",
    id: "backup",
    pages: "Backup",
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
    id: "profile",
    pages: "Profile",
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "/notifications",
    id: "notifications",
    pages: "Notifications",
  },
];


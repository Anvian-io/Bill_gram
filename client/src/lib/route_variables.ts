import {
  Home,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  // Store,
  Download,
  User,
  Settings,
  Layers,
  type LucideIcon,
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
    pages: "Home",
  },
  {
    icon: Layers,
    label: "Master",
    href: "/master",
    id: "master",
    pages: "Home, Master",
  },
  {
    icon: Package,
    label: "Products & Inventory",
    href: "/product-inventory",
    id: "products",
    pages: "Home, Products",
  },
  {
    icon: ShoppingCart,
    label: "Sales",
    href: "/sales",
    id: "sales",
    pages: "Home, Sales",
  },
  {
    icon: Receipt,
    label: "Purchases",
    href: "/purchases",
    id: "purchases",
    pages: "Home, Purchases",
  },
  {
    icon: FileText,
    label: "Reports",
    href: "/reports",
    id: "reports",
    pages: "Home, Reports",
  },
  // {
  //   icon: Store,
  //   label: "Shops",
  //   href: "/shops",
  //   id: "shops",
  //   pages: "Home, Shops",
  // },
  // {
  //   icon: QrCode,
  //   label: "QR Payments",
  //   href: "/qr-payments",
  //   id: "qr-payments",
  //   pages: "Home, QR Payments",
  // },
  {
    icon: Download,
    label: "Backup & Restore",
    href: "/backup",
    id: "backup",
    pages: "Home, Backup",
  },
  // {
  //   icon: Shield,
  //   label: "License",
  //   href: "/license",
  //   id: "license",
  //   pages: "Home, License",
  // },
  // {
  //   icon: Users,
  //   label: "Users",
  //   href: "/users",
  //   id: "users",
  //   pages: "Home, Users",
  // },
  // {
  //   icon: UserCog,
  //   label: "Roles & Permissions",
  //   href: "/roles",
  //   id: "roles",
  //   pages: "Home, Roles",
  // },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
    id: "profile",
    pages: "Home, Profile",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
    id: "settings",
    pages: "Home, Settings",
  },
];

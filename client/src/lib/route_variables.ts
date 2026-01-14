import {
  Home,
  User,
  FileText,
  Car,
  MessageSquareText,
  UserCog,
  BriefcaseBusiness,
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
    label: "Home",
    href: "/",
    id: "home",
    pages: "Home",
  },
  {
    icon: Car,
    label: "Cars",
    href: "/cars",
    id: "cars",
    pages: "Home, Cars",
  },
  {
    icon: FileText,
    label: "Invoices",
    href: "/invoices",
    id: "invoices",
    pages: "Home, Invoices",
  },
  {
    icon: MessageSquareText,
    label: "Feedback",
    href: "/feedback",
    id: "feedback",
    pages: "Home, Feedback",
  },
  {
    icon: User,
    label: "Users",
    href: "/user_management",
    id: "users",
    pages: "Home, Users",
  },
  {
    icon: UserCog,
    label: "Roles",
    href: "/roles",
    id: "roles",
    pages: "Home, Roles",
  },
  // {
  //   icon: BriefcaseBusiness,
  //   label: "Website Services",
  //   href: "/website-services",
  //   id: "services",
  //   pages: "Home, Services"
  // },
  {
    icon: BriefcaseBusiness,
    label: "Profile",
    href: "/profile",
    id: "profile",
    pages: "Home, profile",
  },
  {
    icon: BriefcaseBusiness,
    label: "Notifications",
    href: "/all-notifications",
    id: "all-notifications",
    pages: "Home, Notifications",
  },
];

import {
  Banknote,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  UserCog,
  Users,
} from "lucide-react";
import { Role } from "../types/entities";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

export const roleLabels: Record<Role, string> = {
  PUBLIC: "Visitor",
  ARTISAN: "Artisan",
  ADMIN: "Administrator",
  ASSOCIATION_HEAD: "Association Head",
  SUPER_ADMIN: "Super Administrator",
};

export const artisanNav: NavItem[] = [
  { label: "Dashboard", to: "/artisan", icon: LayoutDashboard },
  { label: "My Profile", to: "/artisan/profile", icon: Users },
  { label: "Documents", to: "/artisan/documents", icon: FileText },
  { label: "Payments", to: "/artisan/payments", icon: Banknote },
  { label: "Settings", to: "/artisan/settings", icon: Settings },
];

const staffCore = (base: string): NavItem[] => [
  { label: "Dashboard", to: base, icon: LayoutDashboard },
  { label: "Artisans", to: `${base}/artisans`, icon: Users },
  { label: "Associations", to: `${base}/associations`, icon: Building2 },
  { label: "Categories", to: `${base}/categories`, icon: Tags },
  { label: "Payments", to: `${base}/payments`, icon: Banknote },
  { label: "Reports", to: `${base}/reports`, icon: FileText },
];

export const adminNav: NavItem[] = [
  ...staffCore("/admin"),
  { label: "Staff Accounts", to: "/admin/staff", icon: UserCog },
  { label: "Audit Logs", to: "/admin/audit", icon: ShieldCheck },
];

export const associationNav: NavItem[] = [
  { label: "Dashboard", to: "/association", icon: LayoutDashboard },
  { label: "My Artisans", to: "/association/artisans", icon: Users },
  { label: "Payments", to: "/association/payments", icon: Banknote },
  { label: "Reports", to: "/association/reports", icon: FileText },
];

export const superAdminNav: NavItem[] = [
  ...staffCore("/super-admin"),
  { label: "Staff Accounts", to: "/super-admin/staff", icon: UserCog },
  { label: "Platform Settings", to: "/super-admin/settings", icon: Settings },
  { label: "Audit Logs", to: "/super-admin/audit", icon: ShieldCheck },
];

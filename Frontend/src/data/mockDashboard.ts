import {
  CategorySlice,
  MembershipPoint,
  RecentArtisan,
  RevenuePoint,
  StatCardData,
} from "../types/dashboard";

export const statCards: StatCardData[] = [
  {
    id: "artisans",
    label: "Total Artisans",
    value: "2,348",
    delta: "+4.6%",
    trend: "up",
    icon: "users",
  },
  {
    id: "associations",
    label: "Active Associations",
    value: "6",
    delta: "+1",
    trend: "up",
    icon: "building",
  },
  {
    id: "revenue",
    label: "Revenue This Month",
    value: "₦4,218,500",
    delta: "+12.3%",
    trend: "up",
    icon: "banknote",
  },
  {
    id: "overdue",
    label: "Overdue Accounts",
    value: "162",
    delta: "-3.1%",
    trend: "down",
    icon: "alert-triangle",
  },
];

export const revenueTrend: RevenuePoint[] = [
  { month: "Apr", collected: 2850000, expected: 3200000 },
  { month: "May", collected: 3120000, expected: 3300000 },
  { month: "Jun", collected: 2980000, expected: 3350000 },
  { month: "Jul", collected: 3460000, expected: 3400000 },
  { month: "Aug", collected: 3710000, expected: 3600000 },
  { month: "Sep", collected: 3905000, expected: 3800000 },
  { month: "Oct", collected: 4218500, expected: 4000000 },
];

export const membershipTrend: MembershipPoint[] = [
  { month: "Apr", active: 1980, overdue: 210 },
  { month: "May", active: 2040, overdue: 195 },
  { month: "Jun", active: 2105, overdue: 220 },
  { month: "Jul", active: 2188, overdue: 180 },
  { month: "Aug", active: 2251, overdue: 175 },
  { month: "Sep", active: 2302, overdue: 168 },
  { month: "Oct", active: 2348, overdue: 162 },
];

export const categoryBreakdown: CategorySlice[] = [
  { name: "Tailoring", value: 520, color: "#1f633e" },
  { name: "Electrical", value: 410, color: "#3a9d3f" },
  { name: "Plumbing", value: 365, color: "#4c9e6a" },
  { name: "Carpentry", value: 330, color: "#7ebf92" },
  { name: "Mechanics", value: 420, color: "#cfa030" },
  { name: "Others", value: 303, color: "#aed8b8" },
];

export const recentArtisans: RecentArtisan[] = [
  {
    id: "AON-2381",
    name: "Adebayo Fashina",
    category: "Electrical",
    association: "Association of Electricians",
    status: "Active",
    joined: "2 days ago",
  },
  {
    id: "AON-2380",
    name: "Funmilayo Ogunleye",
    category: "Tailoring",
    association: "Association of Tailors",
    status: "Pending",
    joined: "3 days ago",
  },
  {
    id: "AON-2379",
    name: "Kazeem Balogun",
    category: "Plumbing",
    association: "Association of Plumbers",
    status: "Overdue",
    joined: "5 days ago",
  },
  {
    id: "AON-2378",
    name: "Esther Adewale",
    category: "Carpentry",
    association: "Association of Carpenters",
    status: "Active",
    joined: "6 days ago",
  },
  {
    id: "AON-2377",
    name: "Tunde Okediran",
    category: "Mechanics",
    association: "Association of Mechanics",
    status: "Active",
    joined: "1 week ago",
  },
];
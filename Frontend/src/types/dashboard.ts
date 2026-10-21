export type TrendDirection = "up" | "down" | "flat";

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: TrendDirection;
  hint?: string;
  icon: string;
}

export interface RevenuePoint {
  month: string;
  collected: number;
  expected: number;
}

export interface MembershipPoint {
  month: string;
  active: number;
  overdue: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export interface RecentArtisan {
  id: string;
  name: string;
  category: string;
  association: string;
  status: string;
  joined: string;
}

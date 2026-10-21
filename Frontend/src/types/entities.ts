export type Role = "PUBLIC" | "ARTISAN" | "ADMIN" | "ASSOCIATION_HEAD" | "SUPER_ADMIN";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ASSOCIATION_HEAD";
  association?: string; // association name, for heads
  status: "Active" | "Disabled";
  created: string;
}

export interface ArtisanDocument {
  id: string;
  name: string;
  type: "Identification" | "Certificate" | "Other";
  uploaded: string;
  review: "Approved" | "Under review";
}

export interface Settings {
  fee: number;
  dueDay: number;
  graceDays: number;
  reminderDays: string;
  adminsCanCreateStaff: boolean;
  revenueBasis: "gross" | "net";
  gateway: string;
  emailProvider: string;
  supportEmail: string;
}

export type ArtisanStatus = "Active" | "Overdue" | "Pending" | "Suspended";

export interface Artisan {
  id: string;
  name: string;
  category: string;
  association: string;
  town: string;
  area: string;
  phone: string;
  email: string;
  status: ArtisanStatus;
  verification: "Verified" | "Unverified";
  joined: string;
  avatarInitials: string;
  photo?: string;
  businessName: string;
  businessDescription: string;
  whatsapp?: string;
  businessAddress?: string;
  shopNumber?: string;
  dob?: string;
  idType?: string;
  idNumber?: string;
  createdAt: string; // ISO date
  createdBy: string;
  verifiedBy?: string;
  mustChangePassword: boolean;
  documents: ArtisanDocument[];
}

export interface Association {
  id: string;
  name: string;
  code: string;
  category: string; // trade this association represents, e.g. "Tailoring"
  head: string;
  members: number;
  status: "Active" | "Inactive";
  town?: string;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  artisanCount: number;
  status: "Active" | "Inactive";
}

export interface Payment {
  id: string;
  artisan: string;
  artisanId: string;
  association: string;
  amount: number;
  gatewayFee: number;
  period: string;
  status: "Paid" | "Pending" | "Overdue" | "Failed" | "Refunded";
  reference: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "payment" | "account" | "reminder" | "system";
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}
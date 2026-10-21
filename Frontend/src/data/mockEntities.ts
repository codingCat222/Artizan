import {
  Artisan,
  StaffUser,
  Settings,
  Association,
  AuditLogEntry,
  Category,
  NotificationItem,
  Payment,
} from "../types/entities";

export const categories: Category[] = [
  { id: "cat-1", name: "Tailoring", description: "Garment making and alterations", artisanCount: 520, status: "Active" },
  { id: "cat-2", name: "Electrical", description: "Wiring, installation, repairs", artisanCount: 410, status: "Active" },
  { id: "cat-3", name: "Plumbing", description: "Pipe fitting and water systems", artisanCount: 365, status: "Active" },
  { id: "cat-4", name: "Carpentry", description: "Furniture and woodwork", artisanCount: 330, status: "Active" },
  { id: "cat-5", name: "Mechanics", description: "Auto repair and servicing", artisanCount: 420, status: "Active" },
  { id: "cat-6", name: "Painting", description: "Building and decorative painting", artisanCount: 160, status: "Active" },
  { id: "cat-7", name: "Welding", description: "Metal fabrication and welding", artisanCount: 143, status: "Inactive" },
];

export const associations: Association[] = [
  { id: "assoc-1", name: "Abeokuta Chapter", code: "AAON-ABK", head: "Chief Rasheed Olatunji", members: 612, status: "Active", town: "Abeokuta", contactEmail: "abeokuta@aan-ogun.org" },
  { id: "assoc-2", name: "Sagamu Chapter", code: "AAON-SAG", head: "Alhaja Morenike Aina", members: 384, status: "Active", town: "Sagamu", contactEmail: "sagamu@aan-ogun.org" },
  { id: "assoc-3", name: "Ijebu-Ode Chapter", code: "AAON-IJB", head: "Mr. Olumide Fagbemi", members: 298, status: "Active", town: "Ijebu-Ode", contactEmail: "ijebuode@aan-ogun.org" },
  { id: "assoc-4", name: "Ota Chapter", code: "AAON-OTA", head: "Mrs. Blessing Udoh", members: 456, status: "Active", town: "Ota", contactEmail: "ota@aan-ogun.org" },
  { id: "assoc-5", name: "Ilaro Chapter", code: "AAON-ILR", head: "Mr. Segun Adeyemi", members: 198, status: "Inactive", town: "Ilaro", contactEmail: "ilaro@aan-ogun.org" },
];

const names = [
  "Adebayo Fashina", "Funmilayo Ogunleye", "Kazeem Balogun", "Esther Adewale",
  "Tunde Okediran", "Hauwa Suleiman", "Chinedu Okafor", "Bisi Adebanjo",
  "Yusuf Abdulsalam", "Grace Okonkwo", "Wasiu Lawal", "Ngozi Eze",
  "Rotimi Bakare", "Amina Yusuf", "Kelechi Nwachukwu", "Folasade Akintola",
];

const towns = ["Abeokuta", "Sagamu", "Ijebu-Ode", "Ota", "Ilaro"];
const statuses: Artisan["status"][] = ["Active", "Active", "Active", "Overdue", "Pending"];

export const artisans: Artisan[] = names.map((name, i) => {
  const cat = categories[i % categories.length];
  const assoc = associations[i % associations.length];
  const initials = name.split(" ").map((p) => p[0]).join("");
  return {
    id: `AON-23${80 - i}`,
    name,
    category: cat.name,
    association: assoc.name,
    town: assoc.town,
    area: `${towns[i % towns.length]} Central`,
    phone: `080${(10000000 + i * 137).toString().slice(0, 8)}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
    status: statuses[i % statuses.length],
    verification: i === 7 ? "Unverified" : "Verified",
    joined: `${i + 1} ${i === 0 ? "day" : "days"} ago`,
    whatsapp: `080${(10000000 + i * 137).toString().slice(0, 8)}`,
    businessAddress: `${i + 3} Market Road, ${towns[i % towns.length]} Central`,
    shopNumber: `Shop ${i + 1}`,
    createdAt: i < 3 ? `2026-10-${String(14 - i).padStart(2, "0")}` : `2026-0${(i % 6) + 1}-12`,
    createdBy: assoc.head,
    verifiedBy: assoc.head,
    mustChangePassword: false,
    idType: "National ID (NIN)",
    idNumber: `1234567${i}9012`,
    documents: [
      { id: `d-${i}-1`, name: "National ID (NIN).pdf", type: "Identification", uploaded: "12 Jun 2026", review: "Approved" },
      { id: `d-${i}-2`, name: "Trade certificate.pdf", type: "Certificate", uploaded: "12 Jun 2026", review: "Approved" },
    ],
    avatarInitials: initials,
    businessName: `${name.split(" ")[0]}'s ${cat.name} Works`,
    businessDescription: `Professional ${cat.name.toLowerCase()} services in ${assoc.town}, Ogun State.`,
  };
});

const fee = 200;
const gw = (n: number) => Math.round(n * 0.015 + 10);
export const payments: Payment[] = artisans.flatMap((a, i) => {
  if (a.status === "Pending") return [];
  const mk = (period: string, status: Payment["status"], date: string, n: number): Payment => ({
    id: `PAY-${1000 + i * 10 + n}`,
    artisan: a.name,
    artisanId: a.id,
    association: a.association,
    amount: fee,
    gatewayFee: status === "Paid" || status === "Refunded" ? gw(fee) : 0,
    period,
    status,
    reference: `REF-${(7000000 + i * 131 + n * 17).toString(36).toUpperCase()}`,
    date,
  });
  const list: Payment[] = [];
  if (new Date(a.createdAt) < new Date("2026-09-01")) list.push(mk("September 2026", i === 5 ? "Refunded" : "Paid", `${fmtD(3 + (i % 4))} Sep 2026`, 1));
  if (new Date(a.createdAt) < new Date("2026-10-01")) {
    const st: Payment["status"] = a.status === "Overdue" ? (i % 2 ? "Failed" : "Overdue") : i === 2 ? "Pending" : "Paid";
    list.push(mk("October 2026", st, st === "Overdue" ? "—" : `${fmtD(2 + (i % 8))} Oct 2026`, 2));
  }
  return list;
});
function fmtD(n: number) { return String(n); }

export const staffUsers: StaffUser[] = [
  { id: "u-0", name: "Super Admin", email: "super@aan-ogun.org", role: "SUPER_ADMIN", status: "Active", created: "1 Jan 2026" },
  { id: "u-1", name: "Olufemi Akande", email: "admin@aan-ogun.org", role: "ADMIN", status: "Active", created: "5 Jan 2026" },
  { id: "u-2", name: "Ruth Ibitoye", email: "ruth.ibitoye@aan-ogun.org", role: "ADMIN", status: "Active", created: "2 Mar 2026" },
  ...associations
    .filter((x) => x.head)
    .map((x, i): StaffUser => ({
      id: `u-h${i + 1}`,
      name: x.head,
      email: `head.${x.town.toLowerCase().replace(/[^a-z]/g, "")}@aan-ogun.org`,
      role: "ASSOCIATION_HEAD",
      association: x.name,
      status: "Active",
      created: "10 Jan 2026",
    })),
];

export const defaultSettings: Settings = {
  fee,
  dueDay: 5,
  graceDays: 7,
  reminderDays: "7, 3, 1",
  adminsCanCreateStaff: false,
  revenueBasis: "gross",
  gateway: "Not yet selected",
  emailProvider: "Not yet selected",
  supportEmail: "support@aan-ogun.org",
};

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Payment received", description: "Your October facilitation fee was confirmed.", time: "2h ago", read: false, type: "payment" },
  { id: "n2", title: "Fee due in 5 days", description: "Your November facilitation fee is due on Nov 5.", time: "1d ago", read: false, type: "reminder" },
  { id: "n3", title: "Profile updated", description: "Your business address was updated successfully.", time: "3d ago", read: true, type: "account" },
  { id: "n4", title: "Welcome to the platform", description: "Your account was activated by Abeokuta Chapter.", time: "1w ago", read: true, type: "system" },
];

export const auditLogs: AuditLogEntry[] = [
  { id: "a1", actor: "Super Admin", action: "Created administrator account", target: "admin@aan-ogun.org", timestamp: "Oct 16, 2026 — 09:12" },
  { id: "a2", actor: "Chief Rasheed Olatunji", action: "Registered artisan", target: "Adebayo Fashina", timestamp: "Oct 14, 2026 — 14:40" },
  { id: "a3", actor: "System", action: "Hid listing after grace period", target: "Kazeem Balogun", timestamp: "Oct 13, 2026 — 00:05" },
  { id: "a4", actor: "Admin", action: "Updated facilitation fee", target: "₦2,500/month", timestamp: "Oct 10, 2026 — 11:20" },
  { id: "a5", actor: "System", action: "Restored listing after payment", target: "Esther Adewale", timestamp: "Oct 9, 2026 — 08:02" },
];

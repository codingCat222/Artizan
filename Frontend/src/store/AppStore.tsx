import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import {
  artisans as seedArtisans,
  associations as seedAssociations,
  auditLogs as seedAudit,
  categories as seedCategories,
  defaultSettings,
  payments as seedPayments,
  staffUsers as seedStaff,
} from "../data/mockEntities";
import { currentPeriod, daysUntil, hasPaid, owesCurrent } from "../lib/billing";
import { fmtDate, stamp, TODAY } from "../lib/format";
import {
  Artisan,
  Association,
  AuditLogEntry,
  Category,
  Payment,
  Settings,
  StaffUser,
} from "../types/entities";

export interface NewArtisanInput {
  name: string;
  dob?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  businessName: string;
  shopNumber?: string;
  businessAddress: string;
  businessDescription?: string;
  town: string;
  area: string;
  category: string;
  association: string;
  idType?: string;
  idNumber?: string;
  documentNames: string[];
}

interface Store {
  artisans: Artisan[];
  associations: Association[];
  categories: (Category & { artisanCount: number })[];
  payments: Payment[];
  staff: StaffUser[];
  audit: AuditLogEntry[];
  settings: Settings;

  log: (actor: string, action: string, target: string) => void;
  addArtisan: (i: NewArtisanInput, actor: string) => { artisan?: Artisan; error?: string };
  updateArtisan: (id: string, patch: Partial<Artisan>, actor: string, action: string) => void;
  activateArtisan: (id: string) => void;
  markPasswordChanged: (id: string) => void;
  saveAssociation: (a: Partial<Association> & { name: string }, actor: string) => string | null;
  toggleAssociation: (id: string, actor: string) => void;
  saveCategory: (c: Partial<Category> & { name: string }, actor: string) => string | null;
  toggleCategory: (id: string, actor: string) => void;
  addStaff: (u: Omit<StaffUser, "id" | "created" | "status">, actor: string) => string | null;
  setStaffStatus: (id: string, status: StaffUser["status"], actor: string) => void;
  deleteStaff: (id: string, actor: string) => void;
  saveSettings: (s: Settings, actor: string) => void;
  beginPayment: (artisanId: string) => Payment | null;
  verifyPayment: (reference: string, outcome: "success" | "failed") => "paid" | "failed" | "duplicate";
  refundPayment: (id: string, actor: string) => void;
  runBillingJob: (actor: string) => { hidden: number; reminders: number };
}

const Ctx = createContext<Store | null>(null);
let seq = 100;
const uid = (p: string) => `${p}-${++seq}`;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [artisans, setArtisans] = useState<Artisan[]>(seedArtisans);
  const [associations, setAssociations] = useState<Association[]>(seedAssociations);
  const [cats, setCats] = useState<Category[]>(seedCategories);
  const [payments, setPayments] = useState<Payment[]>(seedPayments);
  const [staff, setStaff] = useState<StaffUser[]>(seedStaff);
  const [audit, setAudit] = useState<AuditLogEntry[]>(seedAudit);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const log = useCallback((actor: string, action: string, target: string) => {
    setAudit((l) => [{ id: uid("a"), actor, action, target, timestamp: stamp() }, ...l]);
  }, []);

  const categories = useMemo(
    () => cats.map((c) => ({ ...c, artisanCount: artisans.filter((a) => a.category === c.name).length })),
    [cats, artisans],
  );

  const store: Store = {
    artisans, associations, categories, payments, staff, audit, settings, log,

    addArtisan: (i, actor) => {
      if (artisans.some((a) => a.email.toLowerCase() === i.email.toLowerCase()))
        return { error: "An artisan with this email address already exists." };
      if (!i.category || !i.association) return { error: "Category and association are required." };
      const max = Math.max(...artisans.map((a) => Number(a.id.split("-")[1])));
      const a: Artisan = {
        id: `AON-${max + 1}`,
        name: i.name,
        category: i.category,
        association: i.association,
        town: i.town,
        area: i.area,
        phone: i.phone,
        email: i.email,
        status: "Pending", // until the artisan activates the account
        verification: "Verified", // BR-007: staff-created profiles are approved by default
        joined: "Just now",
        avatarInitials: i.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
        businessName: i.businessName,
        businessDescription: i.businessDescription || `${i.category} services in ${i.town}.`,
        whatsapp: i.whatsapp,
        businessAddress: i.businessAddress,
        shopNumber: i.shopNumber,
        dob: i.dob,
        idType: i.idType,
        idNumber: i.idNumber,
        createdAt: TODAY.toISOString().slice(0, 10),
        createdBy: actor,
        verifiedBy: actor,
        mustChangePassword: true,
        documents: i.documentNames.map((n, k) => ({
          id: uid("d"), name: n, type: k === 0 && i.idType ? "Identification" : "Certificate",
          uploaded: fmtDate(TODAY), review: "Approved",
        })),
      };
      setArtisans((l) => [a, ...l]);
      log(actor, "Registered artisan", `${a.name} (${a.association})`);
      return { artisan: a };
    },

    updateArtisan: (id, patch, actor, action) => {
      const target = artisans.find((a) => a.id === id);
      setArtisans((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      if (target) log(actor, action, target.name);
    },

    activateArtisan: (id) => {
      const a = artisans.find((x) => x.id === id);
      setArtisans((l) => l.map((x) => (x.id === id ? { ...x, status: "Active", mustChangePassword: false } : x)));
      if (a) log(a.name, "Activated account", a.id);
    },

    markPasswordChanged: (id) => {
      const a = artisans.find((x) => x.id === id);
      setArtisans((l) => l.map((x) => (x.id === id ? { ...x, mustChangePassword: false } : x)));
      if (a) log(a.name, "Changed password", a.id);
    },

    saveAssociation: (a, actor) => {
      const dup = associations.some(
        (x) => x.id !== a.id && (x.name.toLowerCase() === a.name.toLowerCase() || (a.code && x.code === a.code)),
      );
      if (dup) return "An association with this name or code already exists.";
      if (a.id) {
        const old = associations.find((x) => x.id === a.id);
        setAssociations((l) => l.map((x) => (x.id === a.id ? { ...x, ...a } : x)));
        // keep artisan + staff references consistent if renamed
        if (old && old.name !== a.name) {
          setArtisans((l) => l.map((x) => (x.association === old.name ? { ...x, association: a.name } : x)));
          setStaff((l) => l.map((x) => (x.association === old.name ? { ...x, association: a.name } : x)));
        }
        log(actor, "Updated association", a.name);
      } else {
        setAssociations((l) => [
          ...l,
          {
            id: uid("assoc"), name: a.name, code: a.code ?? "", head: "", members: 0, status: "Active",
            town: a.town ?? "", contactEmail: a.contactEmail ?? "", contactPhone: a.contactPhone, description: a.description,
          },
        ]);
        log(actor, "Created association", a.name);
      }
      return null;
    },
    toggleAssociation: (id, actor) => {
      const a = associations.find((x) => x.id === id);
      if (!a) return;
      const status = a.status === "Active" ? "Inactive" : "Active";
      setAssociations((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
      log(actor, status === "Inactive" ? "Deactivated association" : "Reactivated association", a.name);
    },

    saveCategory: (c, actor) => {
      if (cats.some((x) => x.id !== c.id && x.name.toLowerCase() === c.name.toLowerCase()))
        return "A category with this name already exists.";
      if (c.id) {
        const old = cats.find((x) => x.id === c.id);
        setCats((l) => l.map((x) => (x.id === c.id ? { ...x, ...c } : x)));
        if (old && old.name !== c.name)
          setArtisans((l) => l.map((x) => (x.category === old.name ? { ...x, category: c.name } : x)));
        log(actor, "Updated category", c.name);
      } else {
        setCats((l) => [...l, { id: uid("cat"), name: c.name, description: c.description ?? "", artisanCount: 0, status: "Active" }]);
        log(actor, "Created category", c.name);
      }
      return null;
    },
    toggleCategory: (id, actor) => {
      const c = cats.find((x) => x.id === id);
      if (!c) return;
      const status = c.status === "Active" ? "Inactive" : "Active";
      setCats((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
      log(actor, status === "Inactive" ? "Deactivated category" : "Reactivated category", c.name);
    },

    addStaff: (u, actor) => {
      if (staff.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) return "This email is already in use.";
      setStaff((l) => [...l, { ...u, id: uid("u"), status: "Active", created: fmtDate(TODAY) }]);
      if (u.role === "ASSOCIATION_HEAD" && u.association)
        setAssociations((l) => l.map((x) => (x.name === u.association ? { ...x, head: u.name } : x)));
      log(actor, u.role === "ADMIN" ? "Created administrator account" : "Created association head account", u.email);
      return null;
    },
    setStaffStatus: (id, status, actor) => {
      const u = staff.find((x) => x.id === id);
      setStaff((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
      if (u) log(actor, status === "Disabled" ? "Disabled staff account" : "Enabled staff account", u.email);
    },
    deleteStaff: (id, actor) => {
      const u = staff.find((x) => x.id === id);
      if (!u || u.role === "SUPER_ADMIN") return;
      setStaff((l) => l.filter((x) => x.id !== id));
      if (u.association) setAssociations((l) => l.map((x) => (x.head === u.name ? { ...x, head: "" } : x)));
      log(actor, "Deleted staff account", u.email);
    },

    saveSettings: (s, actor) => {
      const old = settings;
      setSettings(s);
      if (old.fee !== s.fee) log(actor, "Updated facilitation fee", `₦${old.fee} → ₦${s.fee}`);
      if (old.graceDays !== s.graceDays || old.dueDay !== s.dueDay || old.reminderDays !== s.reminderDays)
        log(actor, "Updated billing schedule", `due day ${s.dueDay}, grace ${s.graceDays}d`);
      if (old.adminsCanCreateStaff !== s.adminsCanCreateStaff)
        log(actor, "Changed administrator permissions", s.adminsCanCreateStaff ? "Admins may create staff" : "Admins may not create staff");
    },

    beginPayment: (artisanId) => {
      const a = artisans.find((x) => x.id === artisanId);
      if (!a) return null;
      const period = currentPeriod(settings).label;
      if (hasPaid(payments, artisanId, period)) return null;
      const existing = payments.find((x) => x.artisanId === artisanId && x.period === period && x.status === "Pending");
      if (existing) return existing;
      const p: Payment = {
        id: uid("PAY"), artisan: a.name, artisanId, association: a.association, amount: settings.fee, gatewayFee: 0,
        period, status: "Pending", reference: `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        date: fmtDate(TODAY),
      };
      setPayments((l) => [p, ...l.filter((x) => !(x.artisanId === artisanId && x.period === period && x.status === "Overdue"))]);
      log("System", "Payment initiated", `${p.reference} · ${a.name}`);
      return p;
    },

    // Mimics the server-side verification step. Idempotent: repeated notifications do nothing.
    verifyPayment: (reference, outcome) => {
      const p = payments.find((x) => x.reference === reference);
      if (!p) return "failed";
      if (p.status === "Paid") return "duplicate";
      if (outcome === "failed") {
        setPayments((l) => l.map((x) => (x.reference === reference ? { ...x, status: "Failed" } : x)));
        log("System", "Payment failed", `${reference} · ${p.artisan}`);
        return "failed";
      }
      const gatewayFee = Math.round(p.amount * 0.015 + 10);
      setPayments((l) => l.map((x) => (x.reference === reference ? { ...x, status: "Paid", gatewayFee, date: fmtDate(TODAY) } : x)));
      log("System", "Payment verified", `${reference} · ${p.artisan}`);
      const a = artisans.find((x) => x.id === p.artisanId);
      if (a && a.status === "Overdue") {
        setArtisans((l) => l.map((x) => (x.id === a.id ? { ...x, status: "Active" } : x)));
        log("System", "Restored listing after payment", a.name);
      }
      return "paid";
    },

    refundPayment: (id, actor) => {
      const p = payments.find((x) => x.id === id);
      if (!p || p.status !== "Paid") return;
      setPayments((l) => l.map((x) => (x.id === id ? { ...x, status: "Refunded" } : x)));
      log(actor, "Refunded payment", `${p.reference} · ${p.artisan}`);
    },

    // Demo of the scheduled job: hide anyone still unpaid after the grace period.
    runBillingJob: (actor) => {
      const per = currentPeriod(settings);
      const pastGrace = TODAY > per.graceEnd;
      let hidden = 0;
      const toHide = pastGrace
        ? artisans.filter((a) => a.status === "Active" && owesCurrent(a, payments, settings))
        : [];
      if (toHide.length) {
        const ids = new Set(toHide.map((a) => a.id));
        setArtisans((l) => l.map((a) => (ids.has(a.id) ? { ...a, status: "Overdue" } : a)));
        toHide.forEach((a) => log("System", "Hid listing after grace period", a.name));
        hidden = toHide.length;
      }
      const reminders = settings.reminderDays
        .split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n)).includes(daysUntil(per.due))
        ? artisans.filter((a) => owesCurrent(a, payments, settings)).length
        : 0;
      log(actor, "Ran billing check", `${hidden} hidden, ${reminders} reminders`);
      return { hidden, reminders };
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

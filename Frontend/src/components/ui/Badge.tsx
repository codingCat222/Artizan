type Tone = "green" | "gold" | "red" | "gray";

const tones: Record<Tone, string> = {
  green: "bg-fresh-50 text-fresh-600 border border-fresh-400/30",
  gold: "bg-gold-400/10 text-gold-600 border border-gold-400/40",
  red: "bg-red-50 text-red-600 border border-red-300",
  gray: "bg-forest-50 text-forest-700/70 border border-forest-100",
};

const statusTone: Record<string, Tone> = {
  Active: "green",
  Paid: "green",
  Verified: "green",
  Pending: "gold",
  Unverified: "gold",
  Overdue: "red",
  Failed: "red",
  Suspended: "red",
  Inactive: "gray",
  Disabled: "gray",
  Refunded: "gray",
  Approved: "green",
  "Under review": "gold",
};

export default function Badge({ status }: { status: string }) {
  const tone = statusTone[status] ?? "gray";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {status}
    </span>
  );
}

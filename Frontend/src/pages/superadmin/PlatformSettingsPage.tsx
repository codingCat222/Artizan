import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { useStore } from "../../store/AppStore";
import { useAuth } from "../../store/AuthContext";

export default function PlatformSettingsPage() {
  const { settings, saveSettings, runBillingJob } = useStore();
  const { session } = useAuth();
  const [f, setF] = useState({
    fee: String(settings.fee), dueDay: String(settings.dueDay), graceDays: String(settings.graceDays),
    reminderDays: settings.reminderDays, supportEmail: settings.supportEmail,
  });
  const [adminsCanCreate, setAdminsCanCreate] = useState(settings.adminsCanCreateStaff);
  const [basis, setBasis] = useState(settings.revenueBasis);
  const [gateway, setGateway] = useState(settings.gateway);
  const [emailProvider, setEmailProvider] = useState(settings.emailProvider);
  const [msg, setMsg] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const actor = session?.name ?? "Super Admin";

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number(f.fee), due = Number(f.dueDay), grace = Number(f.graceDays);
    if (!(fee > 0)) return setMsg({ tone: "error", text: "Monthly fee must be greater than zero." });
    if (!(due >= 1 && due <= 28)) return setMsg({ tone: "error", text: "Due day must be between 1 and 28." });
    if (!(grace >= 0 && grace <= 60)) return setMsg({ tone: "error", text: "Grace period must be between 0 and 60 days." });
    if (!/^\s*\d+(\s*,\s*\d+)*\s*$/.test(f.reminderDays)) return setMsg({ tone: "error", text: "Reminders must be comma-separated day counts, e.g. 7, 3, 1." });
    saveSettings({ ...settings, fee, dueDay: due, graceDays: grace, reminderDays: f.reminderDays, supportEmail: f.supportEmail,
      adminsCanCreateStaff: adminsCanCreate, revenueBasis: basis, gateway, emailProvider }, actor);
    setMsg({ tone: "success", text: "Settings saved. Changes apply to future billing periods and are recorded in the audit log." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Settings" subtitle="Billing, permissions and system-wide policies" />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <form onSubmit={save} className="space-y-6">
        <Card>
          <h3 className="font-semibold text-forest-900">Facilitation fee & billing schedule</h3>
          <p className="mt-1 text-xs text-forest-700/60">The final fee, due date, grace period and reminder schedule must be approved by the business before launch.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Monthly fee (₦)" type="number" value={f.fee} onChange={set("fee")} />
            <Input label="Due day of month" type="number" value={f.dueDay} onChange={set("dueDay")} />
            <Input label="Grace period (days)" type="number" value={f.graceDays} onChange={set("graceDays")} />
            <Input label="Reminders (days before due)" value={f.reminderDays} onChange={set("reminderDays")} />
          </div>
          <p className="mt-3 text-xs text-forest-700/60">After the grace period ends without a verified payment, the artisan is hidden from public search until they pay.</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-forest-900">Permissions & reporting</h3>
          <label className="mt-4 flex items-start gap-3 text-sm text-forest-800">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-forest-700" checked={adminsCanCreate} onChange={(e) => setAdminsCanCreate(e.target.checked)} />
            <span>Allow ordinary administrators to create other administrator accounts<br /><span className="text-xs text-forest-700/60">Deleting or disabling administrators always stays with the super administrator.</span></span>
          </label>
          <div className="mt-4 sm:w-80">
            <Select label="Revenue figures show" value={basis} onChange={(e) => setBasis(e.target.value as "gross" | "net")}
              options={[{ label: "Gross collections", value: "gross" }, { label: "Net of gateway charges", value: "net" }]} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-forest-900">Integrations</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select label="Payment gateway" value={gateway} onChange={(e) => setGateway(e.target.value)}
              options={["Not yet selected", "Paystack", "Flutterwave", "Other"].map((x) => ({ label: x, value: x }))} />
            <Select label="Email provider" value={emailProvider} onChange={(e) => setEmailProvider(e.target.value)}
              options={["Not yet selected", "SendGrid", "Mailgun", "Amazon SES", "Other"].map((x) => ({ label: x, value: x }))} />
            <Input label="Support email" type="email" value={f.supportEmail} onChange={set("supportEmail")} />
          </div>
          <p className="mt-3 text-xs text-forest-700/60">Gateway secrets are never stored in the browser; they're configured on the server. SMS is out of scope for this release.</p>
        </Card>
        <div className="flex justify-end"><Button type="submit">Save settings</Button></div>
      </form>

      <Card>
        <h3 className="font-semibold text-forest-900">Run billing check (demo)</h3>
        <p className="mt-1 text-sm text-forest-700/70">
          In production this runs automatically each day: it sends reminders and hides artisans who are still unpaid after the grace period.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => {
          const r = runBillingJob(actor);
          setMsg({ tone: "info", text: `Billing check complete: ${r.hidden} listing(s) hidden, ${r.reminders} reminder(s) due today.` });
        }}>Run now</Button>
      </Card>
    </div>
  );
}

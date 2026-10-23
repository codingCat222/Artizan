import { Lock } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Confirm from "../../components/ui/Confirm";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { fmtDate, isValidPhone, naira } from "../../lib/format";
import { errorMessage, useApi } from "../../lib/useApi";
import { ArtisanDetail, artisansApi, isListed } from "../../services/artisans";
import { associationsApi } from "../../services/associations";
import { categoriesApi } from "../../services/categories";
import { useAuth, useBase } from "../../store/AuthContext";

const ID_TYPES = ["National ID (NIN)", "Voter's card", "Driver's licence", "International passport"];

export default function ArtisanDetailsPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const isHead = session?.role === "ASSOCIATION_HEAD";
  const base = useBase();
  const q = useApi(() => artisansApi.get(id!), [id]);
  const categories = useApi(categoriesApi.list);
  const associations = useApi(() => (isHead ? Promise.resolve([]) : associationsApi.list()), [isHead]);

  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | "suspend" | "reactivate" | "reset">(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [f, setF] = useState<Record<string, string>>({});

  const artisan = q.data;

  // Unknown id, or (for heads) another association's artisan: the server answers 404 for both.
  if (!artisan)
    return (
      <div className="space-y-4">
        {q.loading ? (
          <p className="text-sm text-forest-700/70">Loading...</p>
        ) : (
          <>
            <PageHeader title="Artisan not found" subtitle="This record doesn't exist or you don't have access to it." />
            {q.error && q.error !== "Artisan not found." && <Notice tone="error">{q.error}</Notice>}
          </>
        )}
        <Link to={`${base}/artisans`} className="text-sm font-medium text-forest-600 hover:underline">← Back to artisans</Link>
      </div>
    );

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    setNotice(null);
    try {
      await fn();
      if (success) setNotice({ tone: "success", text: success });
      q.reload();
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    }
  };

  const openEdit = (a: ArtisanDetail) => {
    setF({
      name: a.name, dob: a.dob, phone: a.phone, whatsapp: a.whatsapp, email: a.email, businessName: a.businessName,
      shopNumber: a.shopNumber, businessAddress: a.businessAddress, businessDescription: a.businessDescription,
      town: a.town, area: a.area, category: a.category, associationId: a.associationId, idType: a.idType, idNumber: "",
    });
    setErr("");
    setEditing(true);
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(f.phone)) return setErr("Enter a valid Nigerian phone number.");
    if (f.whatsapp && !isValidPhone(f.whatsapp)) return setErr("Enter a valid WhatsApp number.");
    setSaving(true);
    setErr("");
    try {
      await artisansApi.update(artisan.id, {
        name: f.name, dob: f.dob, phone: f.phone, whatsapp: f.whatsapp, email: f.email,
        businessName: f.businessName, shopNumber: f.shopNumber, businessAddress: f.businessAddress,
        businessDescription: f.businessDescription, town: f.town, area: f.area, category: f.category,
        associationId: isHead ? undefined : f.associationId, idType: f.idType, idNumber: f.idNumber,
      });
      setEditing(false);
      q.reload();
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  const doConfirm = async () => {
    const action = confirm;
    setConfirm(null);
    if (action === "reset") await run(() => artisansApi.requirePasswordReset(artisan.id), "Done. They'll be asked to choose a new password the next time they sign in.");
    else await run(() => artisansApi.setStatus(artisan.id, action === "suspend" ? "Suspended" : "Active"));
  };

  return (
    <div className="space-y-6">
      <Link to={`${base}/artisans`} className="text-sm font-medium text-forest-600 hover:underline">← Back to artisans</Link>
      <PageHeader
        title={artisan.name}
        subtitle={`${artisan.ref} · ${artisan.association}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => openEdit(artisan)}>Edit Artisan</Button>
            {artisan.status !== "Pending" && <Button variant="secondary" onClick={() => setConfirm("reset")}>Require password reset</Button>}
            {artisan.status === "Suspended" ? (
              <Button onClick={() => setConfirm("reactivate")}>Reactivate</Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirm("suspend")}>Suspend</Button>
            )}
          </>
        }
      />

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      {artisan.status === "Pending" && (
        <Notice tone="warn">
          Awaiting activation. The artisan has been emailed a one-time link.{" "}
          <button className="font-medium underline" onClick={() => run(() => artisansApi.resendActivation(artisan.id), `A new activation email was sent to ${artisan.email}.`)}>
            Resend activation email
          </button>
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-forest-900">Profile Details</h3>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["Category", artisan.category], ["Association", artisan.association], ["Town / City", artisan.town], ["Specific location", artisan.area],
              ["Phone", artisan.phone], ["WhatsApp", artisan.whatsapp || "—"], ["Email", artisan.email], ["Business name", artisan.businessName],
              ["Business address", artisan.businessAddress || "—"], ["Shop number", artisan.shopNumber || "—"],
              ["Registered by", artisan.createdBy], ["Registered", fmtDate(artisan.createdAt)],
            ].map(([l, v]) => (
              <div key={l}><dt className="text-xs font-medium text-forest-700/50">{l}</dt><dd className="mt-0.5 text-sm font-medium text-forest-900">{v}</dd></div>
            ))}
          </dl>
        </Card>

        <Card>
          <h3 className="font-semibold text-forest-900">Status</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-forest-700/70">Account</span><Badge status={artisan.status} /></div>
            <div className="flex items-center justify-between"><span className="text-forest-700/70">Verification</span><Badge status={artisan.verification} /></div>
            <div className="flex items-center justify-between"><span className="text-forest-700/70">Public listing</span><span className={isListed(artisan) ? "font-semibold text-fresh-600" : "font-semibold text-forest-700/60"}>{isListed(artisan) ? "Visible" : "Hidden"}</span></div>
            {artisan.verifiedBy && <p className="text-xs text-forest-700/50">Verified by {artisan.verifiedBy}</p>}
            <Button variant="secondary" size="sm" className="w-full"
              onClick={() => run(() => artisansApi.setVerification(artisan.id, artisan.verification === "Verified" ? "Unverified" : "Verified"))}>
              {artisan.verification === "Verified" ? "Remove verification" : "Mark as verified"}
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold text-forest-900"><Lock size={15} /> Private records (staff only)</h3>
        <p className="mt-1 text-xs text-forest-700/60">Never shown on the public profile.</p>
        <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-forest-700/50">ID type</dt><dd className="font-medium text-forest-900">{artisan.idType || "—"}</dd></div>
          <div><dt className="text-xs text-forest-700/50">ID number</dt><dd className="font-medium text-forest-900">{artisan.idNumberMasked || "—"}</dd></div>
          <div><dt className="text-xs text-forest-700/50">Date of birth</dt><dd className="font-medium text-forest-900">{artisan.dob ? fmtDate(artisan.dob) : "—"}</dd></div>
        </dl>
        <ul className="mt-4 divide-y divide-forest-50 text-sm">
          {artisan.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2.5">
              <span className="text-forest-900">{d.name} <span className="text-xs text-forest-700/50">· {d.type} · {fmtDate(d.uploaded)}</span></span>
              <Badge status={d.review} />
            </li>
          ))}
          {artisan.documents.length === 0 && <li className="py-3 text-forest-700/60">No documents uploaded.</li>}
        </ul>
      </Card>

      <Card className="p-0">
        <div className="px-6 pt-5"><h3 className="font-semibold text-forest-900">Payment history</h3></div>
        <Table min={560} head={<><Th>Period</Th><Th>Amount</Th><Th>Reference</Th><Th>Status</Th><Th>Date</Th></>}>
          {artisan.payments.map((p) => (
            <tr key={p.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{p.period}</Td><Td>{naira(p.amount)}</Td>
              <Td className="text-forest-700/60">{p.reference}</Td><Td><Badge status={p.status} /></Td><Td className="text-forest-700/60">{fmtDate(p.date)}</Td>
            </tr>
          ))}
          {artisan.payments.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-forest-700/60">No payments yet.</td></tr>}
        </Table>
      </Card>

      <Confirm
        open={confirm !== null} danger={confirm === "suspend"}
        title={confirm === "suspend" ? "Suspend this artisan?" : confirm === "reset" ? "Require a password reset?" : "Reactivate this artisan?"}
        message={confirm === "reset"
          ? `${artisan.name} will be signed out and asked to choose a new password the next time they sign in.`
          : confirm === "suspend"
            ? `${artisan.name} will be blocked from signing in and removed from public search. Their records are kept.`
            : `${artisan.name} will be able to sign in again and, if all other requirements are met, appear in public search.`}
        confirmLabel={confirm === "suspend" ? "Suspend" : confirm === "reset" ? "Confirm" : "Reactivate"}
        onCancel={() => setConfirm(null)}
        onConfirm={doConfirm}
      />

      <Modal open={editing} onClose={() => setEditing(false)} wide title="Edit artisan" subtitle={artisan.ref}>
        <form onSubmit={save} className="space-y-4">
          {err && <Notice tone="error">{err}</Notice>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Full name" value={f.name ?? ""} onChange={set("name")} required />
            <Input label="Date of birth" type="date" value={f.dob ?? ""} onChange={set("dob")} />
            <Input label="Phone number" value={f.phone ?? ""} onChange={set("phone")} required />
            <Input label="WhatsApp number" value={f.whatsapp ?? ""} onChange={set("whatsapp")} />
            <Input label="Email" type="email" value={f.email ?? ""} onChange={set("email")} required />
            <Input label="Business name" value={f.businessName ?? ""} onChange={set("businessName")} required />
            <Input label="Shop number" value={f.shopNumber ?? ""} onChange={set("shopNumber")} />
            <Input label="Business address" value={f.businessAddress ?? ""} onChange={set("businessAddress")} required />
            <Input label="Business description" value={f.businessDescription ?? ""} onChange={set("businessDescription")} />
            <Input label="Town / city" value={f.town ?? ""} onChange={set("town")} required />
            <Input label="Specific location" value={f.area ?? ""} onChange={set("area")} required />
            <Select label="Category" value={f.category ?? ""} onChange={set("category")}
              options={(categories.data ?? []).filter((c) => c.status === "Active" || c.name === artisan.category).map((c) => ({ label: c.name, value: c.name }))} />
            {isHead ? (
              <Input label="Association (cannot be changed by a head)" value={artisan.association} disabled readOnly />
            ) : (
              <Select label="Association" value={f.associationId ?? ""} onChange={set("associationId")}
                options={(associations.data ?? []).filter((a) => a.status === "Active" || a.id === artisan.associationId).map((a) => ({ label: a.name, value: a.id }))} />
            )}
            <Select label="ID type" value={f.idType ?? ""} onChange={set("idType")}
              options={[{ label: "None", value: "" }, ...ID_TYPES.map((x) => ({ label: x, value: x }))]} />
            <Input label="ID number" value={f.idNumber ?? ""} onChange={set("idNumber")} placeholder={artisan.idNumberMasked ? "Leave blank to keep current" : ""} />
          </div>
          <div className="flex justify-end gap-2 border-t border-forest-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
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
import { isListed } from "../../lib/billing";
import { isValidPhone, naira } from "../../lib/format";
import { useStore } from "../../store/AppStore";
import { useAuth, useBase } from "../../store/AuthContext";
import { useScope } from "../../store/useScope";

export default function ArtisanDetailsPage() {
  const { id } = useParams();
  const { artisans, associations, categories, payments, updateArtisan } = useStore();
  const { session } = useAuth();
  const scope = useScope();
  const base = useBase();
  const artisan = artisans.find((a) => a.id === id);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | "suspend" | "reactivate" | "reset">(null);
  const [err, setErr] = useState("");
  const [f, setF] = useState<Record<string, string>>({});

  // Association heads can never open another association's artisan (also enforced by the backend).
  if (!artisan || !scope.canAccess(artisan.association))
    return (
      <div className="space-y-4">
        <PageHeader title="Artisan not found" subtitle="This record doesn't exist or you don't have access to it." />
        <Link to={`${base}/artisans`} className="text-sm font-medium text-forest-600 hover:underline">← Back to artisans</Link>
      </div>
    );

  const actor = session?.name ?? "Staff";
  const mine = payments.filter((p) => p.artisanId === artisan.id);

  const openEdit = () => {
    setF({
      name: artisan.name, phone: artisan.phone, whatsapp: artisan.whatsapp ?? "", email: artisan.email,
      businessName: artisan.businessName, shopNumber: artisan.shopNumber ?? "", businessAddress: artisan.businessAddress ?? "",
      businessDescription: artisan.businessDescription, town: artisan.town, area: artisan.area,
      category: artisan.category, association: artisan.association, idType: artisan.idType ?? "", idNumber: artisan.idNumber ?? "",
    });
    setErr("");
    setEditing(true);
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(f.phone)) return setErr("Enter a valid Nigerian phone number.");
    if (artisans.some((a) => a.id !== artisan.id && a.email.toLowerCase() === f.email.toLowerCase())) return setErr("That email is already in use.");
    const patch = { ...f, association: scope.isHead ? artisan.association : f.association };
    const moved = patch.association !== artisan.association;
    updateArtisan(artisan.id, { ...patch, avatarInitials: f.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() }, actor, moved ? "Updated artisan (association changed)" : "Updated artisan");
    setEditing(false);
  };

  const towns = Array.from(new Set(artisans.map((a) => a.town).filter(Boolean)));
  const masked = artisan.idNumber ? `${"•".repeat(Math.max(artisan.idNumber.length - 3, 0))}${artisan.idNumber.slice(-3)}` : "—";

  return (
    <div className="space-y-6">
      <Link to={`${base}/artisans`} className="text-sm font-medium text-forest-600 hover:underline">← Back to artisans</Link>
      <PageHeader
        title={artisan.name}
        subtitle={`${artisan.id} · ${artisan.association}`}
        actions={
          <>
            <Button variant="secondary" onClick={openEdit}>Edit Artisan</Button>
            {artisan.status !== "Pending" && <Button variant="secondary" onClick={() => setConfirm("reset")}>Require password reset</Button>}
            {artisan.status === "Suspended" ? (
              <Button onClick={() => setConfirm("reactivate")}>Reactivate</Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirm("suspend")}>Suspend</Button>
            )}
          </>
        }
      />

      {artisan.status === "Pending" && (
        <Notice tone="warn">
          Awaiting activation. The artisan has been emailed a one-time link.{" "}
          <Link to={`/activate?artisan=${artisan.id}`} className="font-medium underline">Demo: open activation link</Link>
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
              ["Registered by", artisan.createdBy], ["Registered", artisan.joined],
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
            <Button
              variant="secondary" size="sm" className="w-full"
              onClick={() => updateArtisan(artisan.id, { verification: artisan.verification === "Verified" ? "Unverified" : "Verified", verifiedBy: actor }, actor, artisan.verification === "Verified" ? "Removed verification" : "Verified artisan")}
            >
              {artisan.verification === "Verified" ? "Remove verification" : "Mark as verified"}
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold text-forest-900"><Lock size={15} /> Private records (staff only)</h3>
        <p className="mt-1 text-xs text-forest-700/60">Never shown on the public profile.</p>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div><dt className="text-xs text-forest-700/50">ID type</dt><dd className="font-medium text-forest-900">{artisan.idType || "—"}</dd></div>
          <div><dt className="text-xs text-forest-700/50">ID number</dt><dd className="font-medium text-forest-900">{masked}</dd></div>
          <div><dt className="text-xs text-forest-700/50">Date of birth</dt><dd className="font-medium text-forest-900">{artisan.dob || "—"}</dd></div>
        </dl>
        <ul className="mt-4 divide-y divide-forest-50 text-sm">
          {artisan.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2.5">
              <span className="text-forest-900">{d.name} <span className="text-xs text-forest-700/50">· {d.type} · {d.uploaded}</span></span>
              <div className="flex items-center gap-3">
                <Badge status={d.review} />
                {d.review === "Under review" && (
                  <button className="text-xs font-medium text-forest-600 hover:underline"
                    onClick={() => updateArtisan(artisan.id, { documents: artisan.documents.map((x) => (x.id === d.id ? { ...x, review: "Approved" } : x)) }, actor, "Approved document")}>
                    Approve
                  </button>
                )}
              </div>
            </li>
          ))}
          {artisan.documents.length === 0 && <li className="py-3 text-forest-700/60">No documents uploaded.</li>}
        </ul>
      </Card>

      <Card className="p-0">
        <div className="px-6 pt-5"><h3 className="font-semibold text-forest-900">Payment history</h3></div>
        <Table min={560} head={<><Th>Period</Th><Th>Amount</Th><Th>Reference</Th><Th>Status</Th><Th>Date</Th></>}>
          {mine.map((p) => (
            <tr key={p.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{p.period}</Td><Td>{naira(p.amount)}</Td>
              <Td className="text-forest-700/60">{p.reference}</Td><Td><Badge status={p.status} /></Td><Td className="text-forest-700/60">{p.date}</Td>
            </tr>
          ))}
          {mine.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-forest-700/60">No payments yet.</td></tr>}
        </Table>
      </Card>

      <Confirm
        open={confirm !== null} danger={confirm === "suspend"}
        title={confirm === "suspend" ? "Suspend this artisan?" : confirm === "reset" ? "Require a password reset?" : "Reactivate this artisan?"}
        message={confirm === "reset"
          ? `${artisan.name} will be asked to choose a new password the next time they sign in.`
          : confirm === "suspend"
            ? `${artisan.name} will be blocked from signing in and removed from public search. Their records are kept.`
            : `${artisan.name} will be able to sign in again and, if all other requirements are met, appear in public search.`}
        confirmLabel={confirm === "suspend" ? "Suspend" : confirm === "reset" ? "Confirm" : "Reactivate"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === "reset") {
            updateArtisan(artisan.id, { mustChangePassword: true }, actor, "Required password reset");
            setConfirm(null);
            return;
          }
          updateArtisan(artisan.id, { status: confirm === "suspend" ? "Suspended" : "Active" }, actor, confirm === "suspend" ? "Suspended artisan" : "Reactivated artisan");
          setConfirm(null);
        }}
      />

      <Modal open={editing} onClose={() => setEditing(false)} wide title="Edit artisan" subtitle={artisan.id}>
        <form onSubmit={save} className="space-y-4">
          {err && <Notice tone="error">{err}</Notice>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Full name" value={f.name ?? ""} onChange={set("name")} required />
            <Input label="Phone number" value={f.phone ?? ""} onChange={set("phone")} required />
            <Input label="WhatsApp number" value={f.whatsapp ?? ""} onChange={set("whatsapp")} />
            <Input label="Email" type="email" value={f.email ?? ""} onChange={set("email")} required />
            <Input label="Business name" value={f.businessName ?? ""} onChange={set("businessName")} required />
            <Input label="Shop number" value={f.shopNumber ?? ""} onChange={set("shopNumber")} />
            <Input label="Business address" value={f.businessAddress ?? ""} onChange={set("businessAddress")} />
            <Input label="Business description" value={f.businessDescription ?? ""} onChange={set("businessDescription")} />
            <Select label="Town / city" value={f.town ?? ""} onChange={set("town")} options={towns.map((t) => ({ label: t, value: t }))} />
            <Input label="Specific location" value={f.area ?? ""} onChange={set("area")} required />
            <Select label="Category" value={f.category ?? ""} onChange={set("category")}
              options={categories.filter((c) => c.status === "Active" || c.name === artisan.category).map((c) => ({ label: c.name, value: c.name }))} />
            {scope.isHead ? (
              <Input label="Association (cannot be changed by a head)" value={artisan.association} disabled readOnly />
            ) : (
              <Select label="Association" value={f.association ?? ""} onChange={set("association")}
                options={associations.filter((a) => a.status === "Active" || a.name === artisan.association).map((a) => ({ label: a.name, value: a.name }))} />
            )}
            <Select label="ID type" value={f.idType ?? ""} onChange={set("idType")}
              options={[{ label: "None", value: "" }, ...["National ID (NIN)", "Voter's card", "Driver's licence", "International passport"].map((x) => ({ label: x, value: x }))]} />
            <Input label="ID number" value={f.idNumber ?? ""} onChange={set("idNumber")} />
          </div>
          <div className="flex justify-end gap-2 border-t border-forest-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

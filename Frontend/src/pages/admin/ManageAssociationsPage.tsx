import { Plus } from "lucide-react";
import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Confirm from "../../components/ui/Confirm";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { errorMessage, useApi } from "../../lib/useApi";
import { associationsApi } from "../../services/associations";
import { useStore } from "../../store/AppStore";
import { Association } from "../../types/entities";

const blank = { name: "", code: "", category: "", description: "", contactEmail: "", contactPhone: "" };

export default function ManageAssociationsPage() {
  // Categories still come from the sample-data store until the categories module is built.
  const { categories } = useStore();
  const q = useApi(associationsApi.list);
  const associations = q.data ?? [];
  const [saving, setSaving] = useState(false);
  const [actionErr, setActionErr] = useState("");
  const [editing, setEditing] = useState<Association | "new" | null>(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<Association | null>(null);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const open = (a: Association | "new") => {
    setF(a === "new" ? blank : { name: a.name, code: a.code, category: a.category, description: a.description ?? "", contactEmail: a.contactEmail, contactPhone: a.contactPhone ?? "" });
    setErr(""); setEditing(a);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (editing !== "new" && editing) await associationsApi.update(editing.id, f);
      else await associationsApi.create(f);
      setEditing(null);
      q.reload();
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (a: Association) => {
    setActionErr("");
    try {
      await associationsApi.setStatus(a.id, a.status === "Active" ? "Inactive" : "Active");
      q.reload();
    } catch (e) {
      setActionErr(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Associations" subtitle={`${associations.length} associations`}
        actions={<Button onClick={() => open("new")}><Plus size={15} /> New Association</Button>} />
      {q.error && <Notice tone="error">{q.error} <button className="ml-2 font-medium underline" onClick={q.reload}>Retry</button></Notice>}
      {actionErr && <Notice tone="error">{actionErr}</Notice>}
      <Card className="p-0">
        <Table min={820} head={<><Th>Name</Th><Th>Code</Th><Th>Category</Th><Th>Association head</Th><Th>Artisans</Th><Th>Status</Th><Th /></>}>
          {associations.map((a) => (
            <tr key={a.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{a.name}</Td>
              <Td className="text-forest-700/70">{a.code || "—"}</Td>
              <Td className="text-forest-700/70">{a.category}</Td>
              <Td className="text-forest-700/80">{a.head || <span className="text-forest-700/40">Unassigned</span>}</Td>
              <Td className="text-forest-700/80">{a.members}</Td>
              <Td><Badge status={a.status} /></Td>
              <Td className="space-x-3 text-right">
                <button className="font-medium text-forest-600 hover:underline" onClick={() => open(a)}>Edit</button>
                <button className="font-medium text-forest-600 hover:underline"
                  onClick={() => (a.status === "Active" ? setConfirm(a) : toggle(a))}>
                  {a.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </Td>
            </tr>
          ))}
          {associations.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-forest-700/60">{q.loading ? "Loading..." : "No associations yet. Create one to get started."}</td></tr>}
        </Table>
      </Card>
      <p className="text-xs text-forest-700/60">Association heads are assigned from Staff Accounts.</p>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New association" : "Edit association"}>
        <form onSubmit={submit} className="space-y-3">
          {err && <Notice tone="error">{err}</Notice>}
          <Input label="Association name *" value={f.name} onChange={set("name")} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code / abbreviation" value={f.code} onChange={set("code")} placeholder="AAON-TLR" />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-forest-900">Category *</span>
              <select
                value={f.category}
                onChange={(e) => setF((s) => ({ ...s, category: e.target.value }))}
                required
                className="w-full rounded-lg border border-forest-700/20 bg-white px-3 py-2 text-sm text-forest-900 outline-none focus:border-forest-600"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <Input label="Description" value={f.description} onChange={set("description")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact email" type="email" value={f.contactEmail} onChange={set("contactEmail")} />
            <Input label="Contact phone" type="tel" value={f.contactPhone} onChange={set("contactPhone")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!confirm} danger title="Deactivate association?"
        message={`${confirm?.name} will no longer be available when registering artisans. Its artisans and payment records are kept.`}
        confirmLabel="Deactivate" onCancel={() => setConfirm(null)}
        onConfirm={() => { const a = confirm; setConfirm(null); if (a) toggle(a); }} />
    </div>
  );
}
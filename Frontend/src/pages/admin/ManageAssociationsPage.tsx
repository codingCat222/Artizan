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
import { Association } from "../../types/entities";
import { useStore } from "../../store/AppStore";
import { useAuth } from "../../store/AuthContext";

const blank = { name: "", code: "", town: "", description: "", contactEmail: "", contactPhone: "" };

export default function ManageAssociationsPage() {
  const { associations, artisans, saveAssociation, toggleAssociation } = useStore();
  const { session } = useAuth();
  const [editing, setEditing] = useState<Association | "new" | null>(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<Association | null>(null);
  const actor = session?.name ?? "Staff";
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const open = (a: Association | "new") => {
    setF(a === "new" ? blank : { name: a.name, code: a.code, town: a.town, description: a.description ?? "", contactEmail: a.contactEmail, contactPhone: a.contactPhone ?? "" });
    setErr(""); setEditing(a);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = saveAssociation({ ...f, id: editing !== "new" && editing ? editing.id : undefined }, actor);
    if (r) return setErr(r);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Associations" subtitle={`${associations.length} associations`}
        actions={<Button onClick={() => open("new")}><Plus size={15} /> New Association</Button>} />
      <Card className="p-0">
        <Table min={820} head={<><Th>Name</Th><Th>Code</Th><Th>Town</Th><Th>Association head</Th><Th>Artisans</Th><Th>Status</Th><Th /></>}>
          {associations.map((a) => (
            <tr key={a.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{a.name}</Td>
              <Td className="text-forest-700/70">{a.code || "—"}</Td>
              <Td className="text-forest-700/70">{a.town}</Td>
              <Td className="text-forest-700/80">{a.head || <span className="text-forest-700/40">Unassigned</span>}</Td>
              <Td className="text-forest-700/80">{artisans.filter((x) => x.association === a.name).length}</Td>
              <Td><Badge status={a.status} /></Td>
              <Td className="space-x-3 text-right">
                <button className="font-medium text-forest-600 hover:underline" onClick={() => open(a)}>Edit</button>
                <button className="font-medium text-forest-600 hover:underline"
                  onClick={() => (a.status === "Active" ? setConfirm(a) : toggleAssociation(a.id, actor))}>
                  {a.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <p className="text-xs text-forest-700/60">Association heads are assigned from Staff Accounts.</p>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New association" : "Edit association"}>
        <form onSubmit={submit} className="space-y-3">
          {err && <Notice tone="error">{err}</Notice>}
          <Input label="Association name *" value={f.name} onChange={set("name")} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code / abbreviation" value={f.code} onChange={set("code")} placeholder="AAON-ABK" />
            <Input label="Town / city" value={f.town} onChange={set("town")} required />
          </div>
          <Input label="Description" value={f.description} onChange={set("description")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact email" type="email" value={f.contactEmail} onChange={set("contactEmail")} />
            <Input label="Contact phone" type="tel" value={f.contactPhone} onChange={set("contactPhone")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!confirm} danger title="Deactivate association?"
        message={`${confirm?.name} will no longer be available when registering artisans. Its artisans and payment records are kept.`}
        confirmLabel="Deactivate" onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confirm) toggleAssociation(confirm.id, actor); setConfirm(null); }} />
    </div>
  );
}

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
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { StaffUser } from "../../types/entities";
import { useStore } from "../../store/AppStore";
import { useAuth } from "../../store/AuthContext";

type Kind = "ADMIN" | "ASSOCIATION_HEAD";

/** Staff-account management. Super admin: everything. Admin: association heads (+ admins only if the setting allows). */
export default function ManageStaffPage() {
  const { staff, associations, settings, addStaff, setStaffStatus, deleteStaff } = useStore();
  const { session } = useAuth();
  const isSuper = session?.role === "SUPER_ADMIN";
  const actor = session?.name ?? "Staff";
  const [adding, setAdding] = useState<Kind | null>(null);
  const [f, setF] = useState({ name: "", email: "", association: "" });
  const [err, setErr] = useState("");
  const [del, setDel] = useState<StaffUser | null>(null);
  const canCreateAdmin = isSuper || settings.adminsCanCreateStaff;

  const open = (k: Kind) => { setF({ name: "", email: "", association: "" }); setErr(""); setAdding(k); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adding === "ASSOCIATION_HEAD" && !f.association) return setErr("Choose the association this head will manage.");
    const r = addStaff({ name: f.name, email: f.email, role: adding!, association: adding === "ASSOCIATION_HEAD" ? f.association : undefined }, actor);
    if (r) return setErr(r);
    setAdding(null);
  };

  const section = (title: string, kind: Kind, list: StaffUser[], canAdd: boolean, canManage: boolean) => (
    <Card className="p-0">
      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="font-semibold text-forest-900">{title}</h3>
        {canAdd && <Button size="sm" onClick={() => open(kind)}><Plus size={14} /> Add</Button>}
      </div>
      <Table min={680} head={<><Th>Name</Th><Th>Email</Th>{kind === "ASSOCIATION_HEAD" && <Th>Association</Th>}<Th>Status</Th><Th /></>}>
        {list.map((u) => (
          <tr key={u.id} className={rowCls}>
            <Td className="font-medium text-forest-900">{u.name}{u.role === "SUPER_ADMIN" && <span className="ml-2 text-xs text-forest-700/50">(Super administrator)</span>}</Td>
            <Td className="text-forest-700/70">{u.email}</Td>
            {kind === "ASSOCIATION_HEAD" && <Td className="text-forest-700/80">{u.association}</Td>}
            <Td><Badge status={u.status} /></Td>
            <Td className="space-x-3 text-right">
              {canManage && u.role !== "SUPER_ADMIN" && u.email !== session?.email && (
                <>
                  <button className="font-medium text-forest-600 hover:underline" onClick={() => setStaffStatus(u.id, u.status === "Active" ? "Disabled" : "Active", actor)}>
                    {u.status === "Active" ? "Disable" : "Enable"}
                  </button>
                  <button className="font-medium text-red-600 hover:underline" onClick={() => setDel(u)}>Delete</button>
                </>
              )}
            </Td>
          </tr>
        ))}
        {list.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-forest-700/60">None yet.</td></tr>}
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Accounts" subtitle="Administrators and association heads" />
      {!isSuper && !settings.adminsCanCreateStaff && (
        <Notice tone="info">Only the super administrator can create or manage administrator accounts.</Notice>
      )}
      {section("Association heads", "ASSOCIATION_HEAD", staff.filter((u) => u.role === "ASSOCIATION_HEAD"), true, true)}
      {section("Administrators", "ADMIN", staff.filter((u) => u.role !== "ASSOCIATION_HEAD"), canCreateAdmin, isSuper)}

      <Modal open={adding !== null} onClose={() => setAdding(null)} title={adding === "ADMIN" ? "Add administrator" : "Add association head"}
        subtitle="They'll receive an email with a secure activation link.">
        <form onSubmit={submit} className="space-y-3">
          {err && <Notice tone="error">{err}</Notice>}
          <Input label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          <Input label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          {adding === "ASSOCIATION_HEAD" && (
            <Select label="Association" value={f.association} onChange={(e) => setF({ ...f, association: e.target.value })}
              options={[{ label: "Select association", value: "" }, ...associations.filter((a) => a.status === "Active").map((a) => ({ label: a.name, value: a.name }))]} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAdding(null)}>Cancel</Button>
            <Button type="submit">Create account</Button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!del} danger title="Delete this account?"
        message={`${del?.email} will lose access immediately. This is recorded in the audit log.`}
        confirmLabel="Delete" onCancel={() => setDel(null)}
        onConfirm={() => { if (del) deleteStaff(del.id, actor); setDel(null); }} />
    </div>
  );
}

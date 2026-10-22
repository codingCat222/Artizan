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
import { errorMessage, useApi } from "../../lib/useApi";
import { associationsApi } from "../../services/associations";
import { settingsApi } from "../../services/settings";
import { StaffMember, staffApi } from "../../services/staff";
import { useAuth } from "../../store/AuthContext";

type Kind = "ADMIN" | "ASSOCIATION_HEAD";

/** Staff-account management. Super admin: everything. Admin: association heads (+ admins only if the setting allows). */
export default function ManageStaffPage() {
  const { session } = useAuth();
  const isSuper = session?.role === "SUPER_ADMIN";
  const staffQ = useApi(staffApi.list);
  const assocQ = useApi(associationsApi.list);
  const settingsQ = useApi(settingsApi.get);

  const staff = staffQ.data ?? [];
  const associations = assocQ.data ?? [];
  const canCreateAdmin = isSuper || !!settingsQ.data?.adminsCanCreateStaff;

  const [adding, setAdding] = useState<Kind | null>(null);
  const [f, setF] = useState({ name: "", email: "", associationId: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<StaffMember | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const open = (k: Kind) => { setF({ name: "", email: "", associationId: "" }); setErr(""); setAdding(k); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adding === "ASSOCIATION_HEAD" && !f.associationId) return setErr("Choose the association this head will manage.");
    setSaving(true);
    setErr("");
    try {
      await staffApi.create({
        name: f.name.trim(),
        email: f.email.trim(),
        role: adding!,
        associationId: adding === "ASSOCIATION_HEAD" ? f.associationId : undefined,
      });
      setAdding(null);
      setNotice({ tone: "success", text: `Account created. An invitation email was sent to ${f.email.trim()}.` });
      staffQ.reload();
      assocQ.reload();
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    setNotice(null);
    try {
      await fn();
      staffQ.reload();
      assocQ.reload();
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    }
  };

  const section = (title: string, kind: Kind, list: StaffMember[], canAdd: boolean, canManage: boolean) => (
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
            {kind === "ASSOCIATION_HEAD" && <Td className="text-forest-700/80">{u.association ?? "—"}</Td>}
            <Td><Badge status={u.status} /></Td>
            <Td className="space-x-3 text-right">
              {canManage && u.role !== "SUPER_ADMIN" && u.email !== session?.email && (
                <>
                  <button className="font-medium text-forest-600 hover:underline"
                    onClick={() => act(() => staffApi.setStatus(u.id, u.status === "Active" ? "Disabled" : "Active"))}>
                    {u.status === "Active" ? "Disable" : "Enable"}
                  </button>
                  <button className="font-medium text-red-600 hover:underline" onClick={() => setDel(u)}>Delete</button>
                </>
              )}
            </Td>
          </tr>
        ))}
        {list.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-forest-700/60">{staffQ.loading ? "Loading..." : "None yet."}</td></tr>}
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Accounts" subtitle="Administrators and association heads" />
      {!isSuper && settingsQ.data && !settingsQ.data.adminsCanCreateStaff && (
        <Notice tone="info">Only the super administrator can create or manage administrator accounts.</Notice>
      )}
      {staffQ.error && <Notice tone="error">{staffQ.error} <button className="ml-2 font-medium underline" onClick={staffQ.reload}>Retry</button></Notice>}
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      {section("Association heads", "ASSOCIATION_HEAD", staff.filter((u) => u.role === "ASSOCIATION_HEAD"), true, true)}
      {section("Administrators", "ADMIN", staff.filter((u) => u.role !== "ASSOCIATION_HEAD"), canCreateAdmin, isSuper)}

      <Modal open={adding !== null} onClose={() => setAdding(null)} title={adding === "ADMIN" ? "Add administrator" : "Add association head"}
        subtitle="They'll receive an email with a secure link to set their password.">
        <form onSubmit={submit} className="space-y-3">
          {err && <Notice tone="error">{err}</Notice>}
          <Input label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          <Input label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          {adding === "ASSOCIATION_HEAD" && (
            <Select label="Association" value={f.associationId} onChange={(e) => setF({ ...f, associationId: e.target.value })}
              options={[{ label: "Select association", value: "" }, ...associations.filter((a) => a.status === "Active").map((a) => ({ label: a.name, value: a.id }))]} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAdding(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create account"}</Button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!del} danger title="Delete this account?"
        message={`${del?.email} will lose access immediately. This is recorded in the audit log.`}
        confirmLabel="Delete" onCancel={() => setDel(null)}
        onConfirm={() => { const u = del; setDel(null); if (u) act(() => staffApi.remove(u.id)); }} />
    </div>
  );
}
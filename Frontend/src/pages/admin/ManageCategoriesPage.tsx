import { Plus } from "lucide-react";
import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { Category } from "../../types/entities";
import { useStore } from "../../store/AppStore";
import { useAuth } from "../../store/AuthContext";

export default function ManageCategoriesPage() {
  const { categories, saveCategory, toggleCategory } = useStore();
  const { session } = useAuth();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const actor = session?.name ?? "Staff";

  const open = (c: Category | "new") => {
    setName(c === "new" ? "" : c.name); setDescription(c === "new" ? "" : c.description); setErr(""); setEditing(c);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Categories" subtitle={`${categories.length} trade categories`}
        actions={<Button onClick={() => open("new")}><Plus size={15} /> New Category</Button>} />
      <Card className="p-0">
        <Table min={600} head={<><Th>Name</Th><Th>Description</Th><Th>Artisans</Th><Th>Status</Th><Th /></>}>
          {categories.map((c) => (
            <tr key={c.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{c.name}</Td>
              <Td className="text-forest-700/70">{c.description || "—"}</Td>
              <Td className="text-forest-700/80">{c.artisanCount}</Td>
              <Td><Badge status={c.status} /></Td>
              <Td className="space-x-3 text-right">
                <button className="font-medium text-forest-600 hover:underline" onClick={() => open(c)}>Edit</button>
                <button className="font-medium text-forest-600 hover:underline" onClick={() => toggleCategory(c.id, actor)}>
                  {c.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <p className="text-xs text-forest-700/60">Inactive categories can't be chosen for new artisans or used as a public search filter; existing artisans keep theirs.</p>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = saveCategory({ id: editing !== "new" && editing ? editing.id : undefined, name: name.trim(), description }, actor);
            if (r) return setErr(r);
            setEditing(null);
          }}
        >
          {err && <Notice tone="error">{err}</Notice>}
          <Input label="Category name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

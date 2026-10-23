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
import { errorMessage, useApi } from "../../lib/useApi";
import { CategoryDto, categoriesApi } from "../../services/categories";

export default function ManageCategoriesPage() {
  const q = useApi(categoriesApi.list);
  const categories = q.data ?? [];
  const [editing, setEditing] = useState<CategoryDto | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionErr, setActionErr] = useState("");

  const open = (c: CategoryDto | "new") => {
    setName(c === "new" ? "" : c.name);
    setDescription(c === "new" ? "" : c.description);
    setErr("");
    setEditing(c);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const body = { name: name.trim(), description: description.trim() };
      if (editing !== "new" && editing) await categoriesApi.update(editing.id, body);
      else await categoriesApi.create(body);
      setEditing(null);
      q.reload();
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: CategoryDto) => {
    setActionErr("");
    try {
      await categoriesApi.setStatus(c.id, c.status === "Active" ? "Inactive" : "Active");
      q.reload();
    } catch (e) {
      setActionErr(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Categories" subtitle={`${categories.length} trade categories`}
        actions={<Button onClick={() => open("new")}><Plus size={15} /> New Category</Button>} />
      {q.error && <Notice tone="error">{q.error} <button className="ml-2 font-medium underline" onClick={q.reload}>Retry</button></Notice>}
      {actionErr && <Notice tone="error">{actionErr}</Notice>}
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
                <button className="font-medium text-forest-600 hover:underline" onClick={() => toggle(c)}>
                  {c.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </Td>
            </tr>
          ))}
          {categories.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-forest-700/60">{q.loading ? "Loading..." : "No categories yet."}</td></tr>}
        </Table>
      </Card>
      <p className="text-xs text-forest-700/60">Inactive categories can't be chosen for new artisans or used as a public search filter; existing artisans keep theirs. Renaming a category updates every artisan using it.</p>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"}>
        <form className="space-y-3" onSubmit={submit}>
          {err && <Notice tone="error">{err}</Notice>}
          <Input label="Category name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
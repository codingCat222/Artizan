import { FileText, Lock, Upload } from "lucide-react";
import { useRef, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { fmtDate, TODAY } from "../../lib/format";
import { useStore } from "../../store/AppStore";
import { useMe } from "../../store/useMe";

const MAX_MB = 5;

export default function MyDocumentsPage() {
  const me = useMe();
  const { updateArtisan } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return setMsg({ tone: "error", text: "Only PDF, JPG or PNG files are accepted." });
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ tone: "error", text: `File must be smaller than ${MAX_MB} MB.` });
    updateArtisan(
      me.id,
      { documents: [...me.documents, { id: `d-${Date.now()}`, name: file.name, type: "Certificate", uploaded: fmtDate(TODAY), review: "Under review" }] },
      me.name, "Submitted document for review",
    );
    setMsg({ tone: "success", text: "Document submitted. Staff will review it before it's approved." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Identification and certificates on file"
        actions={<><input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFile} /><Button onClick={() => ref.current?.click()}><Upload size={15} /> Upload document</Button></>}
      />
      <Notice tone="info"><span className="inline-flex items-center gap-1.5"><Lock size={14} /> Your documents are private. They are never shown on your public profile.</span></Notice>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card className="p-0">
        <ul className="divide-y divide-forest-50">
          {me.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-forest-50 p-2 text-forest-700"><FileText size={18} /></div>
                <div><p className="font-medium text-forest-900">{d.name}</p><p className="text-xs text-forest-700/60">{d.type} · uploaded {d.uploaded}</p></div>
              </div>
              <Badge status={d.review} />
            </li>
          ))}
          {me.documents.length === 0 && <li className="px-5 py-10 text-center text-forest-700/60">No documents on file.</li>}
        </ul>
      </Card>
      <p className="text-xs text-forest-700/60">Accepted: PDF, JPG, PNG up to {MAX_MB} MB (limits to be confirmed by the business).</p>
    </div>
  );
}

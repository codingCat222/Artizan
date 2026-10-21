import { Camera, Lock } from "lucide-react";
import { useRef, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { isValidPhone } from "../../lib/format";
import { useStore } from "../../store/AppStore";
import { useMe } from "../../store/useMe";

export default function MyProfilePage() {
  const me = useMe();
  const { artisans, associations, updateArtisan } = useStore();
  const towns = Array.from(new Set(associations.map((a) => a.town).filter(Boolean)));
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    phone: me.phone, whatsapp: me.whatsapp ?? "", email: me.email, businessAddress: me.businessAddress ?? "",
    shopNumber: me.shopNumber ?? "", town: me.town, area: me.area, businessDescription: me.businessDescription,
  });
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(f.phone)) return setMsg({ tone: "error", text: "Enter a valid Nigerian phone number." });
    if (f.whatsapp && !isValidPhone(f.whatsapp)) return setMsg({ tone: "error", text: "Enter a valid WhatsApp number." });
    if (artisans.some((a) => a.id !== me.id && a.email.toLowerCase() === f.email.toLowerCase()))
      return setMsg({ tone: "error", text: "That email address is already used by another account." });
    updateArtisan(me.id, f, me.name, "Updated own profile");
    setMsg({ tone: "success", text: "Profile updated." });
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) return setMsg({ tone: "error", text: "Photo must be a JPG or PNG image." });
    if (file.size > 2 * 1024 * 1024) return setMsg({ tone: "error", text: "Photo must be smaller than 2 MB." });
    updateArtisan(me.id, { photo: URL.createObjectURL(file) }, me.name, "Updated profile photograph");
    setMsg({ tone: "success", text: "Profile photograph updated." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your contact and business information" />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            {me.photo ? (
              <img src={me.photo} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-forest-700 text-2xl font-bold text-white">{me.avatarInitials}</div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1.5 -right-1.5 rounded-lg border border-forest-100 bg-white p-1.5 shadow-card" aria-label="Change photo">
              <Camera size={14} className="text-forest-700" />
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPhoto} />
          </div>
          <div>
            <p className="font-semibold text-forest-900">{me.name}</p>
            <p className="text-sm text-forest-700/60">{me.businessName}</p>
            <div className="mt-1.5 flex gap-2"><Badge status={me.status} /><Badge status={me.verification} /></div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold text-forest-900"><Lock size={15} /> Managed by your association</h3>
        <p className="mt-1 text-xs text-forest-700/60">These details can only be changed by an administrator or your association head.</p>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Full name", me.name], ["Artisan ID", me.id], ["Category", me.category],
            ["Association", me.association], ["Verification", me.verification],
            ["ID on file", me.idType ? `${me.idType} · ${"•".repeat(Math.max((me.idNumber ?? "").length - 3, 0))}${(me.idNumber ?? "").slice(-3)}` : "—"],
          ].map(([l, v]) => (
            <div key={l}><dt className="text-xs font-medium text-forest-700/50">{l}</dt><dd className="mt-0.5 text-sm font-medium text-forest-900">{v}</dd></div>
          ))}
        </dl>
      </Card>

      <form onSubmit={save}>
        <Card>
          <h3 className="font-semibold text-forest-900">Contact & business details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Phone number" value={f.phone} onChange={set("phone")} required />
            <Input label="WhatsApp number" value={f.whatsapp} onChange={set("whatsapp")} />
            <Input label="Email address" type="email" value={f.email} onChange={set("email")} required />
            <Input label="Shop number" value={f.shopNumber} onChange={set("shopNumber")} />
            <Input label="Business address" value={f.businessAddress} onChange={set("businessAddress")} required />
            <Select label="Town / city" value={f.town} onChange={set("town")} options={towns.map((t) => ({ label: t, value: t }))} />
            <Input label="Specific location (area, street)" value={f.area} onChange={set("area")} required />
            <Input label="Business description" value={f.businessDescription} onChange={set("businessDescription")} />
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit">Save changes</Button></div>
        </Card>
      </form>
    </div>
  );
}

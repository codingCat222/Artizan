import { useState } from "react";
import { errorMessage, useApi } from "../lib/useApi";
import { isValidPhone } from "../lib/format";
import { ArtisanDto, artisansApi } from "../services/artisans";
import { associationsApi } from "../services/associations";
import { categoriesApi } from "../services/categories";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Notice from "./ui/Notice";
import Select from "./ui/Select";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Association heads: association is inherited and locked (FRD BR-005). Shows the name; the server enforces it. */
  lockedAssociation?: string;
  /** Called after an artisan is registered so the list can refresh. */
  onCreated?: () => void;
}

const empty = {
  name: "", dob: "", phone: "", whatsapp: "", email: "", businessName: "", shopNumber: "",
  businessAddress: "", businessDescription: "", town: "", area: "", category: "", associationId: "",
  idType: "", idNumber: "",
};

const ID_TYPES = ["National ID (NIN)", "Voter's card", "Driver's licence", "International passport"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-forest-900">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function ArtisanFormModal({ open, onClose, lockedAssociation, onCreated }: Props) {
  const categories = useApi(categoriesApi.list);
  // Heads can't list associations (and don't need to: theirs is assigned automatically).
  const associations = useApi(() => (lockedAssociation ? Promise.resolve([]) : associationsApi.list()), [lockedAssociation]);
  const [f, setF] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<ArtisanDto | null>(null);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const close = () => {
    setF(empty); setError(""); setCreated(null);
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidPhone(f.phone)) return setError("Enter a valid Nigerian phone number (e.g. 08012345678).");
    if (f.whatsapp && !isValidPhone(f.whatsapp)) return setError("Enter a valid WhatsApp number.");
    if (f.idType && !f.idNumber.trim()) return setError("Enter the ID number for the selected ID type.");
    setSaving(true);
    try {
      const artisan = await artisansApi.create({
        ...f,
        associationId: lockedAssociation ? undefined : f.associationId,
      });
      setCreated(artisan);
      onCreated?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title="Register Artisan"
      subtitle="Only register artisans already verified by their association. The artisan activates their own account by email."
    >
      {created ? (
        <div className="space-y-4">
          <Notice tone="success">
            <strong>{created.name}</strong> was registered under <strong>{created.association}</strong> ({created.ref}).
            An activation email has been sent to <strong>{created.email}</strong> with a secure one-time link to choose a
            password. The action has been recorded in the audit log.
          </Notice>
          <p className="text-xs text-forest-700/60">
            If they don't receive it, open their profile and use "Resend activation email". We never send passwords by email.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setF(empty); setCreated(null); }}>Register another</Button>
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={submit}>
          {error && <Notice tone="error">{error}</Notice>}
          <Section title="Personal information">
            <Input label="Full name *" value={f.name} onChange={set("name")} required />
            <Input label="Date of birth" type="date" value={f.dob} onChange={set("dob")} />
          </Section>
          <Section title="Contact information">
            <Input label="Phone number *" type="tel" value={f.phone} onChange={set("phone")} required />
            <Input label="WhatsApp number" type="tel" value={f.whatsapp} onChange={set("whatsapp")} />
            <Input label="Email address * (used for activation)" type="email" value={f.email} onChange={set("email")} required />
          </Section>
          <Section title="Business information">
            <Input label="Business name *" value={f.businessName} onChange={set("businessName")} required />
            <Input label="Shop number" value={f.shopNumber} onChange={set("shopNumber")} />
            <Input label="Business address *" value={f.businessAddress} onChange={set("businessAddress")} required />
            <Input label="Business description" value={f.businessDescription} onChange={set("businessDescription")} />
          </Section>
          <Section title="Location">
            <Input label="Town / city *" value={f.town} onChange={set("town")} placeholder="e.g. Abeokuta" required />
            <Input label="Specific location * (area, neighbourhood, street)" value={f.area} onChange={set("area")} required />
          </Section>
          <Section title="Classification">
            <Select
              label="Artisan category *" required value={f.category} onChange={set("category")}
              options={[
                { label: "Select category", value: "" },
                ...(categories.data ?? []).filter((c) => c.status === "Active").map((c) => ({ label: c.name, value: c.name })),
              ]}
            />
            {lockedAssociation ? (
              <Input label="Association (assigned automatically)" value={lockedAssociation} disabled readOnly />
            ) : (
              <Select
                label="Association *" required value={f.associationId} onChange={set("associationId")}
                options={[
                  { label: "Select association", value: "" },
                  ...(associations.data ?? []).filter((a) => a.status === "Active").map((a) => ({ label: a.name, value: a.id })),
                ]}
              />
            )}
          </Section>
          <Section title="Identification (private, never shown publicly)">
            <Select
              label="ID type" value={f.idType} onChange={set("idType")}
              options={[{ label: "Select ID type", value: "" }, ...ID_TYPES.map((t) => ({ label: t, value: t }))]}
            />
            <Input label="ID number" value={f.idNumber} onChange={set("idNumber")} />
          </Section>
          <p className="text-xs text-forest-700/60">Document and photo uploads aren't available yet; they'll be added with the documents module.</p>
          <div className="flex justify-end gap-2 border-t border-forest-100 pt-4">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Artisan"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
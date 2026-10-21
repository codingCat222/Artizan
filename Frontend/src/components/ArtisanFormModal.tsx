import { useState } from "react";
import { Link } from "react-router-dom";
import { isValidPhone } from "../lib/format";
import { Artisan } from "../types/entities";
import { NewArtisanInput, useStore } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Notice from "./ui/Notice";
import Select from "./ui/Select";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Association heads: association is inherited and locked (FRD BR-005). */
  lockedAssociation?: string;
}

const empty = {
  name: "", dob: "", phone: "", whatsapp: "", email: "", businessName: "", shopNumber: "",
  businessAddress: "", businessDescription: "", town: "", area: "", category: "", association: "",
  idType: "", idNumber: "",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-forest-900">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function ArtisanFormModal({ open, onClose, lockedAssociation }: Props) {
  const { categories, associations, addArtisan } = useStore();
  const { session } = useAuth();
  const [f, setF] = useState(empty);
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Artisan | null>(null);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const towns = Array.from(new Set(associations.map((a) => a.town).filter(Boolean)));

  const close = () => {
    setF(empty); setFiles([]); setError(""); setCreated(null);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidPhone(f.phone)) return setError("Enter a valid Nigerian phone number (e.g. 08012345678).");
    if (f.whatsapp && !isValidPhone(f.whatsapp)) return setError("Enter a valid WhatsApp number.");
    if (f.idType && !f.idNumber.trim()) return setError("Enter the ID number for the selected ID type.");
    const input: NewArtisanInput = {
      ...f,
      association: lockedAssociation ?? f.association,
      documentNames: files,
    };
    const r = addArtisan(input, session?.name ?? "Staff");
    if (r.error) return setError(r.error);
    setCreated(r.artisan!);
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
            <strong>{created.name}</strong> was registered under <strong>{created.association}</strong> ({created.id}).
            The action has been recorded in the audit log.
          </Notice>
          <div className="rounded-xl border border-forest-100 bg-forest-50/60 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-700/60">Email sent to {created.email}</p>
            <p className="mt-2 font-semibold text-forest-900">Activate your AAON account</p>
            <p className="mt-1 text-forest-700/80">
              Hello {created.name.split(" ")[0]}, your profile has been created. Use the secure one-time link below to
              choose your password. We never send passwords by email.
            </p>
            <Link to={`/activate?artisan=${created.id}`} className="mt-2 inline-block font-medium text-forest-600 hover:underline">
              Activate account →
            </Link>
          </div>
          <p className="text-xs text-forest-700/60">Demo only: in production the link is delivered by email.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setF(empty); setFiles([]); setCreated(null); }}>Register another</Button>
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
            <Select
              label="Town / city *" required value={f.town} onChange={set("town")}
              options={[{ label: "Select town", value: "" }, ...towns.map((t) => ({ label: t, value: t }))]}
            />
            <Input label="Specific location * (area, neighbourhood, street)" value={f.area} onChange={set("area")} required />
          </Section>
          <Section title="Classification">
            <Select
              label="Artisan category *" required value={f.category} onChange={set("category")}
              options={[
                { label: "Select category", value: "" },
                ...categories.filter((c) => c.status === "Active").map((c) => ({ label: c.name, value: c.name })),
              ]}
            />
            {lockedAssociation ? (
              <Input label="Association (assigned automatically)" value={lockedAssociation} disabled readOnly />
            ) : (
              <Select
                label="Association *" required value={f.association} onChange={set("association")}
                options={[
                  { label: "Select association", value: "" },
                  ...associations.filter((a) => a.status === "Active").map((a) => ({ label: a.name, value: a.name })),
                ]}
              />
            )}
          </Section>
          <Section title="Identification & documents (private, never shown publicly)">
            <Select
              label="ID type" value={f.idType} onChange={set("idType")}
              options={[
                { label: "Select ID type", value: "" },
                { label: "National ID (NIN)", value: "National ID (NIN)" },
                { label: "Voter's card", value: "Voter's card" },
                { label: "Driver's licence", value: "Driver's licence" },
                { label: "International passport", value: "International passport" },
              ]}
            />
            <Input label="ID number" value={f.idNumber} onChange={set("idNumber")} />
            <Input
              label="ID document & certificates (PDF, JPG or PNG)" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((x) => x.name))}
            />
            <Input label="Profile photograph" type="file" accept=".jpg,.jpeg,.png" />
          </Section>
          <div className="flex justify-end gap-2 border-t border-forest-100 pt-4">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit">Create Artisan</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

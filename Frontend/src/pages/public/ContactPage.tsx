import { Clock, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import PageBanner from "../../components/PageBanner";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import Select from "../../components/ui/Select";
import { isValidPhone } from "../../lib/format";

const blank = { name: "", phone: "", email: "", lga: "", trade: "", subject: "", message: "" };

export default function ContactPage() {
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(f.phone)) return setError("Enter a valid phone number, e.g. 08012345678.");
    if (!f.subject) return setError("Please choose an enquiry subject.");
    setError(""); setSent(true); setF(blank);
  };

  const info = [
    [Phone, "Telephone", "Official phone number to be confirmed"],
    [Mail, "Email Address", "Official email address to be confirmed"],
    [MapPin, "Office Address", "Verified chapter office address to be confirmed"],
    [Clock, "Office Hours", "Confirmed office days and hours to be added"],
    [User, "State President", "Comrade Anthony Ayodele"],
  ] as const;

  return (
    <div>
      <PageBanner title="Contact Us" image="/aaon/community-portrait.jpg" />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[3fr_2fr]">
          <div>
            <span className="inline-block rounded-full bg-forest-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-forest-600">Get in Touch</span>
            <h2 className="mt-4 text-3xl font-bold text-forest-800">Contact AAON Ogun State Chapter</h2>
            <p className="mt-3 text-forest-700/80">Would you like to enquire about membership, connect your trade group with the association, raise an issue affecting artisans, or discuss a partnership?</p>

            {sent ? (
              <div className="mt-6 space-y-4">
                <Notice tone="success">Thank you. Your enquiry has been received and the chapter will follow up with you.</Notice>
                <Button variant="secondary" onClick={() => setSent(false)}>Send another enquiry</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && <Notice tone="error">{error}</Notice>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full name" value={f.name} onChange={set("name")} required />
                  <Input label="Phone number" type="tel" value={f.phone} onChange={set("phone")} required />
                  <Input label="Email address (optional)" type="email" value={f.email} onChange={set("email")} />
                  <Input label="Local Government Area" value={f.lga} onChange={set("lga")} />
                  <Input label="Trade or profession" value={f.trade} onChange={set("trade")} />
                  <Select label="Enquiry subject" value={f.subject} onChange={set("subject")}
                    options={[{ label: "Select an enquiry subject", value: "" }, ...["Membership", "Connect a trade group", "Issue affecting artisans", "Partnership", "Other"].map((x) => ({ label: x, value: x }))]} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="msg" className="text-sm font-medium text-forest-800">Message</label>
                  <textarea id="msg" rows={5} required value={f.message} onChange={set("message")}
                    className="rounded-xl border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100" />
                </div>
                <p className="text-xs text-forest-700/60">
                  By submitting this form, you consent to AAON Ogun State Chapter using the information provided to respond to your enquiry. Please do not
                  submit sensitive personal or financial information through this form.
                </p>
                <Button type="submit">Send Enquiry</Button>
              </form>
            )}
          </div>

          <aside className="space-y-4 self-start rounded-2xl bg-forest-50 p-6">
            <h3 className="text-lg font-bold text-forest-800">Chapter Office Information</h3>
            <p className="text-sm text-forest-700/70">Artisans Association of Nigeria (AAON), Ogun State Chapter. Official details will be published once confirmed.</p>
            {info.map(([Icon, t, d]) => (
              <div key={t} className="flex gap-3">
                <div className="rounded-xl bg-white p-2.5 text-forest-500 shadow-card"><Icon size={18} /></div>
                <div><p className="text-sm font-semibold text-forest-800">{t}</p><p className="text-sm text-forest-700/70">{d}</p></div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </div>
  );
}

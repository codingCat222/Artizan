import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { passwordProblem } from "../../lib/format";
import { authApi } from "../../services/auth";
import { useStore } from "../../store/AppStore";
import { useMe } from "../../store/useMe";

export default function AccountSettingsPage() {
  const me = useMe();
  const { log } = useStore();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const p = passwordProblem(pw);
    if (p) return setMsg({ tone: "error", text: p });
    if (pw !== pw2) return setMsg({ tone: "error", text: "New passwords do not match." });
    setSaving(true);
    try {
      await authApi.changePassword(cur, pw);
      log(me.name, "Changed password", me.id);
      setCur(""); setPw(""); setPw2("");
      setMsg({ tone: "success", text: "Password changed." });
    } catch (err) {
      setMsg({ tone: "error", text: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Account Settings" subtitle="Sign-in details and security" />
      <Card>
        <h3 className="font-semibold text-forest-900">Sign-in</h3>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div><dt className="text-xs text-forest-700/50">Username / email</dt><dd className="font-medium text-forest-900">{me.email}</dd></div>
          <div><dt className="text-xs text-forest-700/50">Artisan ID</dt><dd className="font-medium text-forest-900">{me.id}</dd></div>
          <div><dt className="text-xs text-forest-700/50">Account created by</dt><dd className="font-medium text-forest-900">{me.createdBy}</dd></div>
        </dl>
      </Card>
      <form onSubmit={submit}>
        <Card className="space-y-4">
          <h3 className="font-semibold text-forest-900">Change password</h3>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Current password" type="password" value={cur} onChange={(e) => setCur(e.target.value)} required />
            <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <Input label="Confirm new password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </div>
          <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Update password"}</Button></div>
        </Card>
      </form>
    </div>
  );
}
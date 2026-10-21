import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { useAuth } from "../../store/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const r = login(identifier);
      setLoading(false);
      if (r.ok) navigate(r.redirect);
      else setError(r.error);
    }, 300);
  };

  const demo = [
    ["Super admin", "super@aan-ogun.org"],
    ["Administrator", "admin@aan-ogun.org"],
    ["Association head", "head.abeokuta@aan-ogun.org"],
    ["Artisan", "adebayo.fashina@mail.com"],
  ];

  return (
    <AuthShell title="Login" subtitle="Ogun State Chapter">
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="Email or Username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com" required />
        <Input label="Password" type="password" placeholder="••••••••" required />
        <div className="flex justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-forest-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
      </form>
      <p className="mt-4 text-center text-xs text-forest-700/60">
        Accounts are created by the association or an administrator. There is no public sign-up.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-forest-200 bg-forest-50/50 p-3 text-xs text-forest-700/70">
        {/* <p className="mb-2 font-semibold text-forest-900">Demo accounts (any password)</p> */}
        {/* <ul className="space-y-1">
          {demo.map(([l, e]) => (
            <li key={l}>
              <button type="button" className="text-left hover:underline" onClick={() => setIdentifier(e)}>
                <span className="font-medium">{l}:</span> {e}
              </button>
            </li>
          ))}
        </ul> */}
      </div>
    </AuthShell>
  );
}

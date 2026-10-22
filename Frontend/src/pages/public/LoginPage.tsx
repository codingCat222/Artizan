import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { landingFor, useAuth } from "../../store/AuthContext";

export default function LoginPage() {
  const { session, loading: restoring, login } = useAuth();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in (or just signed in): go straight to the right dashboard.
  if (session) return <Navigate to={landingFor(session)} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await login(identifier, password);
    setLoading(false);
    if (!r.ok) setError(r.error);
    // On success the session updates and the guard above redirects.
  };

  return (
    <AuthShell title="Login" subtitle="Ogun State Chapter">
      <form onSubmit={submit} className="space-y-4">
        {notice && <Notice tone="success">{notice}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <Input
          label="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-forest-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading || restoring}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-forest-700/60">
        Accounts are created by the association or an administrator. There is no public sign-up.
      </p>
    </AuthShell>
  );
}
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { passwordProblem } from "../../lib/format";
import { authApi } from "../../services/auth";

/** Opened from the one-time link in the artisan's activation email: /activate?token=... (FRD 5.3). */
export default function ActivatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token)
    return (
      <AuthShell title="Activation link">
        <Notice tone="warn">This activation link is invalid or has already been used.</Notice>
        <Link to="/login" className="mt-4 block text-sm font-medium text-forest-600 hover:underline">Go to login</Link>
      </AuthShell>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const problem = passwordProblem(pw);
    if (problem) return setError(problem);
    if (pw !== pw2) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await authApi.activate(token, pw);
      navigate("/login", { replace: true, state: { notice: "Account activated. You can now log in." } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Activate your account" subtitle="Welcome to the platform">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-forest-700/70">Choose a password to finish setting up your artisan account.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
        <Input label="Confirm password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
        <p className="text-xs text-forest-700/60">At least 8 characters, with both letters and numbers.</p>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Activating..." : "Activate account"}</Button>
      </form>
    </AuthShell>
  );
}
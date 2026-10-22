import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { passwordProblem } from "../../lib/format";
import { authApi } from "../../services/auth";

/** Opened from the link in the password-reset email: /reset-password?token=... */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token)
    return (
      <AuthShell title="Reset link">
        <Notice tone="warn">This reset link is invalid or has expired. Please request a new one.</Notice>
        <Link to="/forgot-password" className="mt-4 block text-sm font-medium text-forest-600 hover:underline">Request a new link</Link>
      </AuthShell>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const p = passwordProblem(pw);
    if (p) return setError(p);
    if (pw !== pw2) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await authApi.resetPassword(token, pw);
      navigate("/login", { replace: true, state: { notice: "Password reset successfully. You can now log in." } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
        <Input label="Confirm password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
        <p className="text-xs text-forest-700/60">At least 8 characters, with both letters and numbers.</p>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Reset password"}</Button>
        <Link to="/login" className="block text-center text-sm font-medium text-forest-600 hover:underline">Back to login</Link>
      </form>
    </AuthShell>
  );
}
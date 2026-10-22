import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { passwordProblem } from "../../lib/format";
import { authApi } from "../../services/auth";
import { homeFor, useAuth } from "../../store/AuthContext";

/** Forced first-login password change (FRD 4.2, 5.3). */
export default function ChangePasswordPage() {
  const { session, loading: restoring, reload } = useAuth();
  const navigate = useNavigate();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (restoring) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!session.mustChangePassword) return <Navigate to={homeFor(session.role)} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const problem = passwordProblem(pw);
    if (problem) return setError(problem);
    if (pw !== pw2) return setError("Passwords do not match.");
    if (pw === cur) return setError("New password must be different from the current password.");
    setLoading(true);
    try {
      await authApi.changePassword(cur, pw);
      await reload(); // clears mustChangePassword, the guard above then redirects
      navigate(homeFor(session.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Change your password" subtitle="Required on first login">
      <form onSubmit={submit} className="space-y-4">
        <Notice tone="info">For your security, replace the temporary password before continuing.</Notice>
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="Temporary / current password" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
        <Input label="Confirm new password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save and continue"}</Button>
      </form>
    </AuthShell>
  );
}
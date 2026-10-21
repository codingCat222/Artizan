import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { passwordProblem } from "../../lib/format";
import { useStore } from "../../store/AppStore";
import { useAuth } from "../../store/AuthContext";

/** Forced first-login password change (FRD 4.2, 5.3). */
export default function ChangePasswordPage() {
  const { session } = useAuth();
  const { markPasswordChanged } = useStore();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");

  if (!session || session.role !== "ARTISAN" || !session.artisanId) return <Navigate to="/login" replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(pw);
    if (problem) return setError(problem);
    if (pw !== pw2) return setError("Passwords do not match.");
    markPasswordChanged(session.artisanId!);
    navigate("/artisan");
  };

  return (
    <AuthShell title="Change your password" subtitle="Required on first login">
      <form onSubmit={submit} className="space-y-4">
        <Notice tone="info">For your security, replace the temporary password before continuing.</Notice>
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <Input label="Confirm new password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
        <Button type="submit" className="w-full">Save and continue</Button>
      </form>
    </AuthShell>
  );
}

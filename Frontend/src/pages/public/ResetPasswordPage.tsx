import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { passwordProblem } from "../../lib/format";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  return (
    <AuthShell title="Choose a new password">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const p = passwordProblem(pw);
          if (p) return setError(p);
          if (pw !== pw2) return setError("Passwords do not match.");
          navigate("/login");
        }}
        className="space-y-4"
      >
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <Input label="Confirm password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
        <Button type="submit" className="w-full">Reset password</Button>
        <Link to="/login" className="block text-center text-sm font-medium text-forest-600 hover:underline">Back to login</Link>
      </form>
    </AuthShell>
  );
}

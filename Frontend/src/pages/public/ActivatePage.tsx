import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { passwordProblem } from "../../lib/format";
import { useStore } from "../../store/AppStore";

/** Opened from the one-time link in the artisan's activation email (FRD 5.3). */
export default function ActivatePage() {
  const [params] = useSearchParams();
  const { artisans, activateArtisan } = useStore();
  const navigate = useNavigate();
  const artisan = artisans.find((a) => a.id === params.get("artisan"));
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");

  if (!artisan || artisan.status !== "Pending")
    return (
      <AuthShell title="Activation link">
        <Notice tone="warn">This activation link is invalid or has already been used.</Notice>
        <Link to="/login" className="mt-4 block text-sm font-medium text-forest-600 hover:underline">Go to login</Link>
      </AuthShell>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(pw);
    if (problem) return setError(problem);
    if (pw !== pw2) return setError("Passwords do not match.");
    activateArtisan(artisan.id);
    navigate("/login");
  };

  return (
    <AuthShell title="Activate your account" subtitle={`Welcome, ${artisan.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-forest-700/70">Choose a password to finish setting up your artisan account.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <Input label="Confirm password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
        <Button type="submit" className="w-full">Activate account</Button>
      </form>
    </AuthShell>
  );
}

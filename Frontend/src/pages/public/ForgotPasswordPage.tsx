import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import { authApi } from "../../services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password">
      {sent ? (
        <div className="space-y-4">
          <Notice tone="success">
            If an account exists for that email, a password reset link has been sent. The link expires after a short time.
          </Notice>
          <Link to="/login" className="block text-sm font-medium text-forest-600 hover:underline">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-forest-700/70">Enter your account email and we'll send you a reset link.</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
          <Link to="/login" className="block text-center text-sm font-medium text-forest-600 hover:underline">Back to login</Link>
        </form>
      )}
    </AuthShell>
  );
}
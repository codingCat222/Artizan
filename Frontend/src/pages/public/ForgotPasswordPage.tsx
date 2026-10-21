import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title="Reset your password">
      {sent ? (
        <div className="space-y-4">
          <Notice tone="success">
            If an account exists for that email, a password reset link has been sent. The link expires after a short time.
          </Notice>
          <p className="text-xs text-forest-700/60">
            Demo only: <Link to="/reset-password" className="font-medium text-forest-600 hover:underline">open the reset link</Link>
          </p>
          <Link to="/login" className="block text-sm font-medium text-forest-600 hover:underline">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
          <p className="text-sm text-forest-700/70">Enter your account email and we'll send you a reset link.</p>
          <Input label="Email" type="email" required />
          <Button type="submit" className="w-full">Send reset link</Button>
          <Link to="/login" className="block text-center text-sm font-medium text-forest-600 hover:underline">Back to login</Link>
        </form>
      )}
    </AuthShell>
  );
}

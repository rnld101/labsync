import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder — wire to Cognito ForgotPassword when backend supports it
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="mb-8 flex items-center gap-2 text-sm text-text-muted hover:text-text-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-text-dark">Check your email</h1>
            <p className="mt-2 text-sm text-text-muted">
              If an account exists for <span className="font-medium text-text-dark">{email}</span>,
              we've sent password reset instructions.
            </p>
            <Link
              to="/login"
              className="mt-6 block text-sm font-medium text-primary hover:underline"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-dark">Forgot password</h1>
              <p className="mt-1.5 text-sm text-text-muted">
                Enter your email and we'll send reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Send reset link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

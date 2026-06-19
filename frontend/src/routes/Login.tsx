import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/AuthContext";
import { isStaff } from "@/lib/auth";
import { Eye, EyeOff, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const claims = await login(email.trim(), password);
      navigate(isStaff(claims) ? "/staff" : "/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-700 to-primary p-12 lg:flex lg:w-[45%]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">LabLumen</span>
        </div>

        <div>
          <blockquote className="text-3xl font-semibold leading-snug text-white">
            "Understand your health in seconds."
          </blockquote>
          <p className="mt-4 text-sm text-white/60">
            AI-powered lab report analysis. Book tests, track results, and chat with AI about your health.
          </p>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} LabLumen. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-dark">LabLumen</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark">Welcome back</h1>
            <p className="mt-1.5 text-sm text-text-muted">Sign in to your LabLumen account</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
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
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-text-dark" htmlFor="password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-text-dark transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger-50 px-4 py-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {submitting && <Spinner size="sm" className="text-white" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

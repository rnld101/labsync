import { FlaskConical, Sparkles, Calendar, FileText, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-text-dark">LabLumen</span>
        </div>
        <Link
          to="/login"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered lab results
        </div>
        <h1 className="text-4xl font-bold leading-tight text-text-dark md:text-6xl">
          Understand your health
          <br />
          <span className="text-primary">in 10 seconds.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-text-muted">
          Book lab tests, receive AI-analyzed reports, and chat with an AI about your results.
          No medical jargon. Just clarity.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-surface px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-text-dark">Everything you need</h2>
            <p className="mt-2 text-text-muted">Simple, private, and focused on understanding.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Easy Booking",
                description:
                  "Schedule lab tests for yourself and family in minutes. Choose your tests, date, and time.",
              },
              {
                icon: Sparkles,
                title: "AI Analysis",
                description:
                  "Every report is analyzed by AI. Get a plain-English summary of your results instantly.",
              },
              {
                icon: FileText,
                title: "Chat with AI",
                description:
                  "Ask questions about your results in plain language. Get answers that make sense.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-elevation-1">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-text-dark">{title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-2xl items-center gap-4 text-center sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-text-dark">Privacy first</p>
            <p className="mt-0.5 text-sm text-text-muted">
              Your lab results are encrypted and only accessible to you. We never share your health data.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} LabLumen
      </footer>
    </div>
  );
}

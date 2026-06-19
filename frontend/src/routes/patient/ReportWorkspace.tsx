import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Spinner, ThinkingDots } from "@/components/ui/spinner";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { api, type ChatHistoryItem, type Report } from "@/lib/api";
import {
  computeOverallStatus,
  getStatusColor,
  getStatusDot,
  getStatusLabel,
  parseBiomarkers,
  type Biomarker,
} from "@/lib/biomarker-parser";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

// ─── Data hooks ────────────────────────────────────────────────────────────────

function useReport(reportId: string) {
  return useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: api.listReports,
    refetchInterval: (query) =>
      query.state.data?.some((r) => !r.has_summary && !r.processing_failed) ? 4000 : false,
    select: (data) => data,
  });
}

function useReportPdfUrl(reportId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["report-view", reportId],
    queryFn: () => api.viewReport(reportId),
    enabled,
    staleTime: 4 * 60 * 1000, // re-fetch before 5-min expiry
  });
}

// ─── AI Status Hero ─────────────────────────────────────────────────────────

function extractSentence(summary: string | null): string {
  if (!summary) return "";
  // First sentence of the summary
  const m = summary.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : summary.slice(0, 120);
}

interface HeroProps {
  report: Report;
  biomarkers: Biomarker[];
}

function AIStatusHero({ report, biomarkers }: HeroProps) {
  const overall = computeOverallStatus(biomarkers);
  const headline = extractSentence(report.summary);

  if (!report.has_summary && !report.processing_failed) {
    return (
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-10 md:px-10">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-slate-300 animate-pulse" />
          <p className="text-sm font-medium text-slate-300">AI analysis in progress…</p>
        </div>
        <div className="mt-3 max-w-sm space-y-2">
          <Skeleton className="h-5 bg-white/10" />
          <Skeleton className="h-5 bg-white/10 w-2/3" />
        </div>
      </div>
    );
  }

  if (report.processing_failed) {
    return (
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-8 md:px-10">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-semibold">AI analysis unavailable</p>
        </div>
        <p className="mt-1 text-sm text-slate-300">
          We couldn't generate a summary for this report. The PDF is still available below.
        </p>
      </div>
    );
  }

  const isAllNormal = overall === "all_normal";

  return (
    <div
      className={cn(
        "px-6 py-10 md:px-10",
        isAllNormal
          ? "bg-gradient-to-r from-primary-700 to-primary"
          : "bg-gradient-to-r from-amber-700 to-primary-700",
      )}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-white/70" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            AI Assessment
          </p>
          <p className="mt-1.5 text-xl font-semibold leading-snug text-white md:text-2xl">
            {headline}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {isAllNormal ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
                All values in normal range
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <AlertTriangle className="h-3.5 w-3.5" />
                {biomarkers.filter(
                  (b) => b.status === "elevated" || b.status === "low" || b.status === "borderline"
                ).length}{" "}
                values need attention
              </span>
            )}
            <span className="text-xs text-white/50">
              Generated{" "}
              {new Date(report.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {" · "}
              For {report.patient_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Biomarker Card ─────────────────────────────────────────────────────────

function BiomarkerCard({ marker }: { marker: Biomarker }) {
  return (
    <div
      className={cn(
        "w-40 shrink-0 rounded-xl border p-3.5 transition-shadow hover:shadow-elevation-1",
        getStatusColor(marker.status),
      )}
    >
      <p className="truncate text-xs font-medium opacity-70">{marker.name}</p>
      <p className="mt-1 text-xl font-bold leading-none">
        {marker.value}
        <span className="ml-0.5 text-xs font-normal opacity-60">{marker.unit}</span>
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", getStatusDot(marker.status))} />
        <span className="text-xs font-medium">{getStatusLabel(marker.status)}</span>
      </div>
      {marker.reference && (
        <p className="mt-1 text-[10px] opacity-50">Ref: {marker.reference}</p>
      )}
    </div>
  );
}

// ─── Chat Panel ─────────────────────────────────────────────────────────────

const SUGGESTED = [
  "What should I do if a value is outside normal range?",
  "Is this result serious?",
  "What does this mean for my health?",
  "Should I see a specialist?",
];

interface ChatPanelProps {
  reportId: string;
  reportReady: boolean;
  history: ChatHistoryItem[];
  onHistory: (h: ChatHistoryItem[]) => void;
}

function ChatPanel({ reportId, reportReady, history, onHistory }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (question: string) =>
      api.chatWithReport(reportId, question, history),
    onSuccess: (data, question) => {
      onHistory([
        ...history,
        { role: "user", content: question },
        { role: "assistant", content: data.answer },
      ]);
    },
    onError: () => toast("Failed to get a response. Please try again.", "error"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, mutation.isPending]);

  function send(question: string) {
    const q = question.trim();
    if (!q || mutation.isPending) return;
    setInput("");
    mutation.mutate(q);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Suggested questions
            </p>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                disabled={!reportReady || mutation.isPending}
                onClick={() => send(q)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-text-dark hover:border-primary hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{q}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {history.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-white border border-slate-100 text-text-dark rounded-bl-sm shadow-elevation-1",
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-100 bg-white px-4 py-3 shadow-elevation-1">
              <ThinkingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <p className="border-t border-slate-100 px-4 py-2 text-center text-[10px] text-text-muted">
        AI responses are for informational purposes only. Consult your doctor for medical advice.
      </p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={reportReady ? "Ask about your results…" : "AI analysis loading…"}
            disabled={!reportReady || mutation.isPending}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-text-dark placeholder:text-slate-400",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "max-h-32 overflow-y-auto",
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || !reportReady || mutation.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary-700"
            aria-label="Send"
          >
            {mutation.isPending ? <Spinner size="sm" className="text-white" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ReportWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [mobileTab, setMobileTab] = useState("summary");
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [pdfRequested, setPdfRequested] = useState(false);

  const { data: reports, isLoading } = useReport(id!);
  const report = reports?.find((r) => r.report_id === id);

  const { data: pdfData } = useReportPdfUrl(id!, pdfRequested && !!report);

  useEffect(() => {
    if (pdfData?.url) window.open(pdfData.url, "_blank", "noopener");
  }, [pdfData?.url]);

  const biomarkers = report?.summary ? parseBiomarkers(report.summary) : [];
  const reportReady = !!report?.has_summary;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="h-14 border-b border-slate-100 bg-white px-6 flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32 ml-auto" />
        </div>
        <div className="h-36 bg-slate-200 animate-shimmer" />
        <div className="p-6 space-y-4">
          <SkeletonText lines={6} />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <FileText className="h-12 w-12 text-slate-300" />
        <p className="text-lg font-semibold text-text-dark">Report not found</p>
        <Link to="/app/reports" className="text-sm text-primary hover:underline">
          ← Back to reports
        </Link>
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Sticky header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 md:px-6">
        <Link
          to="/app/reports"
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Reports</span>
        </Link>
        <span className="text-slate-200">/</span>
        <span className="truncate text-sm font-medium text-text-dark">{report.test_name}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-text-muted sm:inline">{report.patient_name}</span>
          <button
            onClick={() => setPdfRequested(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View PDF
          </button>
        </span>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Status Hero */}
        <AIStatusHero report={report} biomarkers={biomarkers} />

        {/* Biomarker strip — only when data available */}
        {biomarkers.length > 0 && (
          <div className="border-b border-slate-100 bg-white px-6 py-4 md:px-10">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {biomarkers.map((b) => (
                <BiomarkerCard key={b.name} marker={b} />
              ))}
            </div>
          </div>
        )}

        {/* Mobile tabs */}
        <div className="md:hidden">
          <Tabs
            tabs={[
              { id: "summary", label: "Summary" },
              { id: "chat",    label: "Chat with AI" },
            ]}
            active={mobileTab}
            onChange={setMobileTab}
            className="bg-white px-4"
          />
          <TabPanel id="summary" active={mobileTab}>
            <div className="px-6 py-8">
              {report.has_summary ? (
                <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-text-dark prose-p:text-text-dark prose-li:text-text-dark">
                  <ReactMarkdown>{report.summary!}</ReactMarkdown>
                </article>
              ) : !report.processing_failed ? (
                <SkeletonText lines={8} />
              ) : (
                <p className="text-sm text-text-muted">AI summary unavailable for this report.</p>
              )}
            </div>
          </TabPanel>
          <TabPanel id="chat" active={mobileTab}>
            <div style={{ height: "calc(100vh - 200px)" }}>
              <ChatPanel
                reportId={id!}
                reportReady={reportReady}
                history={chatHistory}
                onHistory={setChatHistory}
              />
            </div>
          </TabPanel>
        </div>

        {/* Desktop two-column */}
        <div className="hidden md:block">
          <div className="grid h-full grid-cols-5 divide-x divide-slate-100">
            {/* AI Analysis — col 3/5, scrolls with page */}
            <div className="col-span-3 px-10 py-10">
              {report.has_summary ? (
                <>
                  <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Detailed Analysis
                  </h2>
                  <article className="prose max-w-none prose-headings:font-semibold prose-headings:text-text-dark prose-headings:text-base prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-text-dark prose-li:text-text-dark prose-li:text-[15px] prose-strong:text-text-dark">
                    <ReactMarkdown>{report.summary!}</ReactMarkdown>
                  </article>
                </>
              ) : !report.processing_failed ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Spinner size="sm" />
                    <span className="text-sm">AI is analyzing your report…</span>
                  </div>
                  <SkeletonText lines={12} />
                </div>
              ) : (
                <div className="rounded-bento border border-danger-50 bg-danger-50 p-6">
                  <p className="font-semibold text-danger">Analysis failed</p>
                  <p className="mt-1 text-sm text-text-muted">
                    We were unable to generate a summary. Please view the PDF directly.
                  </p>
                </div>
              )}
            </div>

            {/* Chat Panel — col 2/5, sticky */}
            <div className="col-span-2">
              <div
                className="sticky top-0 overflow-hidden"
                style={{ height: "calc(100vh - 3.5rem)" }}
              >
                <div className="flex h-full flex-col">
                  <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Chat with AI
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatPanel
                      reportId={id!}
                      reportReady={reportReady}
                      history={chatHistory}
                      onHistory={setChatHistory}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

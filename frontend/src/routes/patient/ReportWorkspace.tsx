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
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  X,
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .trim();
}

function extractSentence(summary: string | null): string {
  if (!summary) return "";
  const clean = stripMarkdown(summary);
  const m = clean.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : clean.slice(0, 140);
}

// ─── Data hooks ─────────────────────────────────────────────────────────────

function useReportPdfUrl(reportId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["report-view", reportId],
    queryFn: () => api.viewReport(reportId),
    enabled,
    staleTime: 4 * 60 * 1000,
    gcTime: 0, // don't keep in cache after component unmounts
  });
}

// ─── AI Status Hero ──────────────────────────────────────────────────────────

function AIStatusHero({ report, biomarkers }: { report: Report; biomarkers: Biomarker[] }) {
  const overall   = computeOverallStatus(biomarkers);
  const headline  = extractSentence(report.summary);
  const isAllNormal = overall === "all_normal";

  if (!report.has_summary && !report.processing_failed) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
        <Spinner size="sm" />
        <p className="text-sm text-text-muted">AI is analyzing your report…</p>
      </div>
    );
  }

  if (report.processing_failed) {
    return (
      <div className="flex items-center gap-2 border-b border-warning/20 bg-warning-50 px-6 py-3">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <p className="text-sm text-warning">AI analysis unavailable for this report.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "px-6 py-5",
        isAllNormal
          ? "bg-gradient-to-r from-primary-700 to-primary"
          : "bg-gradient-to-r from-amber-700 to-primary-700",
      )}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            AI Assessment
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-white md:text-lg">
            {headline}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isAllNormal ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <CheckCircle2 className="h-3 w-3" /> All values normal
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <AlertTriangle className="h-3 w-3" />
                {biomarkers.filter(
                  (b) => b.status !== "normal" && b.status !== "unknown",
                ).length}{" "}
                values need attention
              </span>
            )}
            <span className="text-xs text-white/50">
              {new Date(report.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
              })}{" · "}
              {report.patient_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Biomarker Card ───────────────────────────────────────────────────────────

function BiomarkerCard({ marker }: { marker: Biomarker }) {
  return (
    <div
      className={cn(
        "w-36 shrink-0 rounded-xl border p-3 transition-shadow hover:shadow-elevation-1",
        getStatusColor(marker.status),
      )}
    >
      <p className="truncate text-xs font-medium opacity-70">{marker.name}</p>
      <p className="mt-1 text-lg font-bold leading-none">
        {marker.value}
        <span className="ml-0.5 text-xs font-normal opacity-60">{marker.unit}</span>
      </p>
      <div className="mt-2 flex items-center gap-1">
        <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(marker.status))} />
        <span className="text-xs font-medium">{getStatusLabel(marker.status)}</span>
      </div>
    </div>
  );
}

// ─── AI Summary Panel ─────────────────────────────────────────────────────────

function AISummaryPanel({ report }: { report: Report }) {
  if (!report.has_summary && !report.processing_failed) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-text-muted">
          <Spinner size="sm" />
          <span className="text-sm">Generating AI analysis…</span>
        </div>
        <SkeletonText lines={10} />
      </div>
    );
  }

  if (report.processing_failed) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-danger-50 bg-danger-50 p-4">
          <p className="font-semibold text-danger">Analysis failed</p>
          <p className="mt-1 text-sm text-text-muted">
            The AI couldn't analyze this report. The PDF is shown on the left.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-6">
      <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-text-dark prose-headings:text-sm prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-text-dark prose-li:text-text-dark prose-li:text-[14px] prose-strong:text-text-dark">
        <ReactMarkdown>{report.summary!}</ReactMarkdown>
      </article>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

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
    mutationFn: (question: string) => api.chatWithReport(reportId, question, history),
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-white border border-slate-100 text-text-dark rounded-bl-sm shadow-elevation-1",
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
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

      <p className="shrink-0 border-t border-slate-100 px-4 py-2 text-center text-[10px] text-text-muted">
        AI responses are informational only. Consult your doctor for medical advice.
      </p>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 p-3">
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
              "disabled:cursor-not-allowed disabled:opacity-60 max-h-32 overflow-y-auto",
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || !reportReady || mutation.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary-700"
            aria-label="Send"
          >
            {mutation.isPending
              ? <Spinner size="sm" className="text-white" />
              : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────

function PDFViewer({ url, loading }: { url?: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Spinner size="lg" />
          <p className="text-sm">Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="text-sm">PDF unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="Lab Report PDF"
      className="h-full w-full border-0"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [mobileTab, setMobileTab]       = useState("pdf");
  const [chatHistory, setChatHistory]   = useState<ChatHistoryItem[]>([]);
  const [chatOpen, setChatOpen]         = useState(false);

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: api.listReports,
    refetchInterval: (q) =>
      q.state.data?.some((r) => !r.has_summary && !r.processing_failed) ? 4000 : false,
  });

  const report     = reports?.find((r) => r.report_id === id);
  const reportReady = !!report?.has_summary;

  // Always fetch PDF URL when we have a report
  const { data: pdfData, isLoading: pdfLoading } = useReportPdfUrl(id!, !!report);
  const biomarkers = report?.summary ? parseBiomarkers(report.summary) : [];

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="h-14 border-b border-slate-100 bg-white px-6 flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
          <div className="w-80 border-l border-slate-100 p-6 space-y-3">
            <SkeletonText lines={8} />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <FileText className="h-12 w-12 text-slate-300" />
        <p className="text-lg font-semibold text-text-dark">Report not found</p>
        <Link to="/app/reports" className="text-sm text-primary hover:underline">← Back to reports</Link>
      </div>
    );
  }

  // ── Main layout ──
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
        <span className="ml-auto text-xs text-text-muted hidden sm:block">{report.patient_name}</span>
      </header>

      {/* AI hero — compact, full-width */}
      <AIStatusHero report={report} biomarkers={biomarkers} />

      {/* Biomarker strip */}
      {biomarkers.length > 0 && (
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-3">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-0.5">
            {biomarkers.map((b) => <BiomarkerCard key={b.name} marker={b} />)}
          </div>
        </div>
      )}

      {/* ── Mobile: tabs ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <Tabs
          tabs={[
            { id: "pdf",     label: "Report PDF" },
            { id: "summary", label: "AI Summary" },
            { id: "chat",    label: "Chat" },
          ]}
          active={mobileTab}
          onChange={setMobileTab}
          className="bg-white px-4 shrink-0"
        />
        <div className="flex-1 overflow-hidden">
          <TabPanel id="pdf" active={mobileTab}>
            <div style={{ height: "calc(100vh - 220px)" }}>
              <PDFViewer url={pdfData?.url} loading={pdfLoading} />
            </div>
          </TabPanel>
          <TabPanel id="summary" active={mobileTab}>
            <div className="h-full overflow-y-auto">
              <AISummaryPanel report={report} />
            </div>
          </TabPanel>
          <TabPanel id="chat" active={mobileTab}>
            <div style={{ height: "calc(100vh - 220px)" }}>
              <ChatPanel
                reportId={id!}
                reportReady={reportReady}
                history={chatHistory}
                onHistory={setChatHistory}
              />
            </div>
          </TabPanel>
        </div>
      </div>

      {/* ── Desktop: PDF left | Right panel ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* PDF viewer — left 3/5 */}
        <div className="flex-[3] overflow-hidden border-r border-slate-100">
          <PDFViewer url={pdfData?.url} loading={pdfLoading} />
        </div>

        {/* Right panel — 2/5: AI Summary OR Chat */}
        <div className="flex flex-[2] flex-col overflow-hidden bg-white">
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {chatOpen ? "Chat with AI" : "AI Summary"}
            </p>
            {chatOpen && (
              <button
                onClick={() => setChatOpen(false)}
                className="rounded-md p-1 text-text-muted hover:bg-slate-100 hover:text-text-dark transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {chatOpen ? (
              <ChatPanel
                reportId={id!}
                reportReady={reportReady}
                history={chatHistory}
                onHistory={setChatHistory}
              />
            ) : (
              <AISummaryPanel report={report} />
            )}
          </div>
        </div>
      </div>

      {/* Chat FAB — desktop only, bottom-right */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-elevation-3 hover:bg-primary-700 transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI chat"
        >
          <MessageCircle className="h-4 w-4" />
          Chat with AI
        </button>
      )}
    </div>
  );
}

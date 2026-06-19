import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { StepIndicator } from "@/components/ui/step-indicator";
import { useToast } from "@/components/ui/toast";
import { api, type LabTest, type PatientProfile, type PatientProfileCreate } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Plus, UserCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────

interface WizardState {
  patientId: string;
  testIds: string[];
  date: string;
  timeSlot: string;
}

const STEPS = [
  { id: 1, label: "Patient"  },
  { id: 2, label: "Tests"    },
  { id: 3, label: "Date"     },
  { id: 4, label: "Time"     },
  { id: 5, label: "Confirm"  },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00",
];

// ── New Profile Sheet ──────────────────────────────────────────────────────

const GENDERS = ["male", "female", "other"];
const RELATIONSHIPS = ["self", "spouse", "child", "parent", "sibling", "other"];

interface NewProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

function NewProfileSheet({ open, onClose, onCreated }: NewProfileSheetProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<PatientProfileCreate>({
    first_name: "", last_name: "", phone_number: "",
    date_of_birth: "", biological_gender: "male", relationship_to_owner: "self",
  });

  const mutation = useMutation({
    mutationFn: () => api.createPatient(form),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast("Profile created", "success");
      onCreated(data.patient_id);
      onClose();
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const set = (k: keyof PatientProfileCreate, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.first_name && form.last_name && form.date_of_birth;

  return (
    <Sheet open={open} onClose={onClose} title="New Patient Profile" side="right">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">First Name</label>
            <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Last Name</label>
            <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Phone Number</label>
          <Input type="tel" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Date of Birth</label>
          <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Biological Gender</label>
          <Select value={form.biological_gender} onChange={(e) => set("biological_gender", e.target.value)}>
            {GENDERS.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Relationship</label>
          <Select value={form.relationship_to_owner} onChange={(e) => set("relationship_to_owner", e.target.value)}>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </Select>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!valid || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors mt-2"
        >
          {mutation.isPending ? <Spinner size="sm" className="text-white" /> : null}
          Create Profile
        </button>
      </div>
    </Sheet>
  );
}

// ── Step 1: Patient Select ─────────────────────────────────────────────────

function StepPatient({
  selected, onSelect,
}: { selected: string; onSelect: (id: string) => void }) {
  const { data: patients = [], isLoading } = useQuery<PatientProfile[]>({
    queryKey: ["patients"],
    queryFn: api.listPatients,
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-text-dark">Who is this test for?</h2>
      <p className="mb-6 text-sm text-text-muted">Select a patient profile or create a new one.</p>

      <div className="space-y-2">
        {isLoading && <Spinner />}
        {patients.map((p) => (
          <button
            key={p.patient_id}
            onClick={() => onSelect(p.patient_id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
              selected === p.patient_id
                ? "border-primary bg-primary-50 ring-2 ring-primary/20"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {p.first_name[0]}{p.last_name[0]}
            </div>
            <div>
              <p className="font-medium text-text-dark">{p.first_name} {p.last_name}</p>
              <p className="text-xs text-text-muted">{p.relationship_to_owner} · DOB {p.date_of_birth}</p>
            </div>
            {selected === p.patient_id && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </button>
        ))}

        <button
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-left text-sm text-text-muted hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add new patient profile
        </button>
      </div>

      <NewProfileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onCreated={onSelect} />
    </div>
  );
}

// ── Step 2: Test Select ────────────────────────────────────────────────────

function StepTests({
  selected, onToggle,
}: { selected: string[]; onToggle: (id: string) => void }) {
  const { data: tests = [], isLoading } = useQuery<LabTest[]>({
    queryKey: ["lab-tests"],
    queryFn: api.listLabTests,
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-text-dark">Select tests</h2>
      <p className="mb-6 text-sm text-text-muted">Choose one or more lab tests.</p>

      <div className="space-y-2">
        {isLoading && <Spinner />}
        {tests.filter((t) => t.is_active).map((t) => {
          const isSelected = selected.includes(t.test_id);
          return (
            <button
              key={t.test_id}
              onClick={() => onToggle(t.test_id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary-50 ring-2 ring-primary/20"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                isSelected ? "border-primary bg-primary" : "border-slate-300 bg-white",
              )}>
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-dark">{t.name}</p>
                {t.description && <p className="mt-0.5 text-xs text-text-muted">{t.description}</p>}
              </div>
              <p className="shrink-0 text-sm font-semibold text-text-dark">
                ₦{Number(t.base_cost).toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 3: Date Picker ────────────────────────────────────────────────────

function StepDate({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Build a 4-week calendar grid
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const days: Date[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-text-dark">Choose a date</h2>
      <p className="mb-6 text-sm text-text-muted">Select an appointment date.</p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((d) => (
          <div key={d} className="py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{d}</div>
        ))}
        {days.map((d) => {
          const str = d.toISOString().split("T")[0];
          const isPast = str < todayStr;
          const isSelected = str === selected;
          const isToday = str === todayStr;

          return (
            <button
              key={str}
              disabled={isPast}
              onClick={() => onSelect(str)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-all",
                isPast && "cursor-not-allowed text-slate-300",
                !isPast && !isSelected && "hover:bg-slate-100 text-text-dark",
                isToday && !isSelected && "font-bold text-primary",
                isSelected && "bg-primary text-white ring-2 ring-primary/20",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Time Picker ────────────────────────────────────────────────────

function StepTime({ selected, onSelect }: { selected: string; onSelect: (t: string) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-text-dark">Pick a time</h2>
      <p className="mb-6 text-sm text-text-muted">All times shown in local timezone.</p>

      <div className="flex flex-wrap gap-2">
        {TIME_SLOTS.map((slot) => {
          const [h, m] = slot.split(":").map(Number);
          const label = new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit",
          });
          return (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                selected === slot
                  ? "border-primary bg-primary text-white ring-2 ring-primary/20"
                  : "border-slate-200 bg-white text-text-dark hover:border-primary hover:text-primary",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Confirm ────────────────────────────────────────────────────────

function StepConfirm({
  state,
  patients,
  tests,
}: {
  state: WizardState;
  patients: PatientProfile[];
  tests: LabTest[];
}) {
  const patient = patients.find((p) => p.patient_id === state.patientId);
  const selectedTests = tests.filter((t) => state.testIds.includes(t.test_id));
  const total = selectedTests.reduce((sum, t) => sum + Number(t.base_cost), 0);
  const [h, m] = state.timeSlot.split(":").map(Number);
  const timeLabel = new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-text-dark">Confirm booking</h2>
      <p className="mb-6 text-sm text-text-muted">Review your appointment details.</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <Row label="Patient">
          {patient ? `${patient.first_name} ${patient.last_name}` : "—"}
        </Row>
        <Row label="Date">
          {new Date(state.date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </Row>
        <Row label="Time">{timeLabel}</Row>
        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Tests</p>
          {selectedTests.map((t) => (
            <div key={t.test_id} className="flex items-center justify-between py-1">
              <span className="text-sm text-text-dark">{t.name}</span>
              <span className="text-sm font-medium">₦{Number(t.base_cost).toLocaleString()}</span>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-semibold text-text-dark">Total</span>
            <span className="font-bold text-text-dark">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-text-dark">{children}</span>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────

export function BookingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    patientId: "", testIds: [], date: "", timeSlot: "",
  });

  const { data: patients = [] } = useQuery<PatientProfile[]>({
    queryKey: ["patients"],
    queryFn: api.listPatients,
  });
  const { data: tests = [] } = useQuery<LabTest[]>({
    queryKey: ["lab-tests"],
    queryFn: api.listLabTests,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.bookAppointment({
        appointment_date: state.date,
        time_slot: state.timeSlot,
        tests: state.testIds.map((tid) => ({ test_id: tid, patient_id: state.patientId })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast("Appointment booked successfully!", "success");
      navigate("/app/appointments");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  function canAdvance(): boolean {
    if (step === 1) return !!state.patientId;
    if (step === 2) return state.testIds.length > 0;
    if (step === 3) return !!state.date;
    if (step === 4) return !!state.timeSlot;
    return true;
  }

  function toggleTest(id: string) {
    setState((s) => ({
      ...s,
      testIds: s.testIds.includes(id)
        ? s.testIds.filter((t) => t !== id)
        : [...s.testIds, id],
    }));
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-6 py-5">
        <h1 className="text-base font-semibold text-text-dark">Book a Lab Test</h1>
        <div className="mt-4">
          <StepIndicator steps={STEPS} current={step} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-10">
          {step === 1 && (
            <StepPatient
              selected={state.patientId}
              onSelect={(id) => setState((s) => ({ ...s, patientId: id }))}
            />
          )}
          {step === 2 && (
            <StepTests selected={state.testIds} onToggle={toggleTest} />
          )}
          {step === 3 && (
            <StepDate
              selected={state.date}
              onSelect={(d) => setState((s) => ({ ...s, date: d }))}
            />
          )}
          {step === 4 && (
            <StepTime
              selected={state.timeSlot}
              onSelect={(t) => setState((s) => ({ ...s, timeSlot: t }))}
            />
          )}
          {step === 5 && (
            <StepConfirm state={state} patients={patients} tests={tests} />
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="border-t border-slate-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-text-muted hover:border-slate-300 hover:text-text-dark transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? <Spinner size="sm" className="text-white" /> : <Check className="h-4 w-4" />}
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { api, type PatientProfile, type PatientProfileCreate } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { useState } from "react";

const GENDERS = ["male", "female", "other"];
const RELATIONSHIPS = ["self", "spouse", "child", "parent", "sibling", "other"];

function ProfileCard({ profile }: { profile: PatientProfile }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1">
      <Avatar name={`${profile.first_name} ${profile.last_name}`} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-dark">
          {profile.first_name} {profile.last_name}
        </p>
        <p className="text-sm text-text-muted capitalize">
          {profile.relationship_to_owner} · DOB {profile.date_of_birth}
        </p>
      </div>
      {profile.phone_number && (
        <span className="text-xs text-text-muted">{profile.phone_number}</span>
      )}
    </div>
  );
}

export function Family() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<PatientProfileCreate>({
    first_name: "", last_name: "", phone_number: "",
    date_of_birth: "", biological_gender: "male", relationship_to_owner: "self",
  });

  const { data: profiles = [], isLoading } = useQuery<PatientProfile[]>({
    queryKey: ["patients"],
    queryFn: api.listPatients,
  });

  const mutation = useMutation({
    mutationFn: () => api.createPatient(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast("Profile added", "success");
      setSheetOpen(false);
      setForm({ first_name: "", last_name: "", phone_number: "", date_of_birth: "", biological_gender: "male", relationship_to_owner: "self" });
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const set = (k: keyof PatientProfileCreate, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.first_name && form.last_name && form.date_of_birth;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Family Profiles</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage patient profiles for yourself and family members.
          </p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1">
              <div className="h-9 w-9 rounded-full bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}

        {!isLoading && profiles.length === 0 && (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No profiles yet"
            description="Add patient profiles for yourself and family members to book lab tests."
            action={
              <button
                onClick={() => setSheetOpen(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Add Profile
              </button>
            }
          />
        )}

        {profiles.map((p) => <ProfileCard key={p.patient_id} profile={p} />)}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="New Patient Profile" side="right">
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
            <label className="mb-1 block text-xs font-medium text-text-muted">Phone</label>
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
            {mutation.isPending && <Spinner size="sm" className="text-white" />}
            Save Profile
          </button>
        </div>
      </Sheet>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Building2, Plus, XCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  InterviewSlot,
  bookInterviewSlot,
  cancelInterviewSlot,
  createInterviewSlot,
  getJobs,
  getMyInterviews,
  rescheduleInterviewSlot,
} from "@/lib/api.ts";

const typeColors: Record<string, string> = {
  aptitude: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-purple-50 text-purple-700 border-purple-200",
  hr: "bg-amber-50 text-amber-700 border-amber-200",
};

const statusColors: Record<string, string> = {
  available: "bg-green-50 text-green-700 border-green-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-gray-50 text-gray-500 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

type PendingAction =
  | { type: "book"; slot: InterviewSlot }
  | { type: "cancel"; slot: InterviewSlot }
  | { type: "reschedule"; slot: InterviewSlot; startAt: string; durationMinutes: number }
  | null;

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SlotFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { jobId: string; startAt: string; durationMinutes: number; type: "aptitude" | "technical" | "hr"; interviewer?: string }) => void;
}) {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => getJobs() });
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [type, setType] = useState<"aptitude" | "technical" | "hr">("technical");
  const [interviewer, setInterviewer] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!jobId || !date || !time) {
      setError("Job, date, and time are required.");
      return;
    }
    const startAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startAt.getTime()) || startAt < new Date()) {
      setError("Interview time must be in the future.");
      return;
    }
    onSubmit({
      jobId,
      startAt: startAt.toISOString(),
      durationMinutes: Number(durationMinutes),
      type,
      interviewer: interviewer || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Interview Slot</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Job</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job._id} value={job._id}>{job.title} - {job.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Round</Label>
              <Select value={type} onValueChange={(value) => setType(value as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aptitude">Aptitude</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input type="number" min="15" max="240" step="15" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interviewer</Label>
            <Input value={interviewer} onChange={(event) => setInterviewer(event.target.value)} placeholder="Panel or interviewer name" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create slot</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RescheduleDialog({
  slot,
  onClose,
  onSubmit,
}: {
  slot: InterviewSlot | null;
  onClose: () => void;
  onSubmit: (startAt: string, durationMinutes: number) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!date || !time) {
      setError("Date and time are required.");
      return;
    }
    const startAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startAt.getTime()) || startAt < new Date()) {
      setError("New interview time must be in the future.");
      return;
    }
    onSubmit(startAt.toISOString(), Number(durationMinutes));
  }

  return (
    <Dialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Interview</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input type="number" min="15" max="240" step="15" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Interviews() {
  const { user } = useAuth();
  const role = user?.role || "student";
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [reschedulingSlot, setReschedulingSlot] = useState<InterviewSlot | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: getMyInterviews,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["interviews"] });

  const createMutation = useMutation({
    mutationFn: createInterviewSlot,
    onSuccess: () => {
      toast.success("Interview slot created");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const bookMutation = useMutation({
    mutationFn: bookInterviewSlot,
    onSuccess: () => {
      toast.success("Interview slot booked");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInterviewSlot,
    onSuccess: () => {
      toast.success("Interview updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, startAt, durationMinutes }: { id: string; startAt: string; durationMinutes: number }) =>
      rescheduleInterviewSlot(id, { startAt, durationMinutes }),
    onSuccess: () => {
      toast.success("Interview rescheduled");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => slots
    .filter((slot) => filterType === "all" || slot.type === filterType)
    .sort((a, b) => (a.startAt || "").localeCompare(b.startAt || "")), [slots, filterType]);

  const mySlots = slots.filter((slot) => slot.bookedBy === user?.id);
  const scheduledCount = slots.filter((slot) => slot.status === "scheduled").length;

  function confirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "book") bookMutation.mutate(pendingAction.slot.id);
    if (pendingAction.type === "cancel") cancelMutation.mutate(pendingAction.slot.id);
    if (pendingAction.type === "reschedule") {
      rescheduleMutation.mutate({
        id: pendingAction.slot.id,
        startAt: pendingAction.startAt,
        durationMinutes: pendingAction.durationMinutes,
      });
    }
    setPendingAction(null);
  }

  const confirmText = pendingAction?.type === "book"
    ? `Book the ${pendingAction.slot.type} interview for ${pendingAction.slot.jobTitle}. This slot will become unavailable to other students.`
    : pendingAction?.type === "cancel"
      ? `Cancel this interview for ${pendingAction.slot.jobTitle}. ${role === "student" ? "The slot will be released for other eligible students." : "The student will be notified and the slot will no longer be available."}`
      : pendingAction?.type === "reschedule"
        ? `Move this interview for ${pendingAction.slot.jobTitle} to the selected new time. The booked student will be notified.`
        : "";

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Interview Schedule</h1>
          <p className="text-muted-foreground mt-1">
            {role === "student" ? `${mySlots.length} of your slots - ${scheduledCount} scheduled` : `${scheduledCount} slots scheduled`}
          </p>
        </div>
        {role !== "student" && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create slot
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total slots", value: slots.length },
          { label: "Available", value: slots.filter((slot) => slot.status === "available").length },
          { label: "Scheduled", value: scheduledCount },
          { label: role === "student" ? "Your bookings" : "Cancelled", value: role === "student" ? mySlots.length : slots.filter((slot) => slot.status === "cancelled").length },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-lg border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-semibold mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
          {(["list", "calendar"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setView(item)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize font-medium transition-colors ${
                view === item ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rounds</SelectItem>
            <SelectItem value="aptitude">Aptitude</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-muted-foreground">Loading interviews...</div>}

      {view === "list" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((slot) => {
            const isMyBooking = slot.bookedBy === user?.id;
            return (
              <div key={slot.id} className={`bg-card rounded-lg border border-border p-5 ${slot.status === "cancelled" ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs capitalize ${typeColors[slot.type]}`}>{slot.type} round</Badge>
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[slot.status]}`}>{slot.status}</Badge>
                </div>
                <h3 className="font-display font-semibold mb-1">{slot.jobTitle}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {slot.company}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(slot.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {slot.time}</span>
                </div>
                {slot.candidate && <p className="text-sm text-muted-foreground mb-4">Candidate: {slot.candidate}</p>}
                <div className="flex flex-wrap gap-2">
                  {role === "student" && slot.status === "available" && (
                    <Button size="sm" onClick={() => setPendingAction({ type: "book", slot })}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Book
                    </Button>
                  )}
                  {role === "student" && isMyBooking && (
                    <Button size="sm" variant="outline" onClick={() => setPendingAction({ type: "cancel", slot })}>
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  )}
                  {role !== "student" && slot.status !== "cancelled" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setReschedulingSlot(slot)}>
                        <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setPendingAction({ type: "cancel", slot })}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-5 space-y-5">
          {[...new Set(filtered.map((slot) => slot.date))].map((date) => (
            <div key={date}>
              <h3 className="text-sm font-semibold mb-3">{formatDate(date)}</h3>
              <div className="space-y-2 border-l-2 border-border pl-4">
                {filtered.filter((slot) => slot.date === date).map((slot) => (
                  <div key={slot.id} className="rounded-md border border-border bg-muted/50 p-3 text-sm">
                    <span className="font-medium">{slot.time}</span> - {slot.company} - {slot.jobTitle}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No interview slots found.
        </div>
      )}

      {role !== "student" && (
        <SlotFormDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      )}
      <RescheduleDialog
        slot={reschedulingSlot}
        onClose={() => setReschedulingSlot(null)}
        onSubmit={(startAt, durationMinutes) => {
          if (reschedulingSlot) {
            setPendingAction({ type: "reschedule", slot: reschedulingSlot, startAt, durationMinutes });
            setReschedulingSlot(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.type === "book" ? "Book interview slot?" : pendingAction?.type === "reschedule" ? "Reschedule interview?" : "Cancel interview?"}
        description={confirmText}
        confirmLabel={pendingAction?.type === "book" ? "Book slot" : pendingAction?.type === "reschedule" ? "Reschedule" : "Cancel interview"}
        destructive={pendingAction?.type === "cancel"}
        onConfirm={confirmPendingAction}
      />
    </DashboardLayout>
  );
}

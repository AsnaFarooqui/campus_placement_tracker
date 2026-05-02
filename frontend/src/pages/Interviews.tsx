import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import {
  InterviewSlot,
  bookInterviewSlot,
  cancelInterviewSlot,
  createInterviewSlot,
  getJobs,
  getMyInterviews,
  requestInterviewReschedule,
  reviewInterviewRescheduleRequest,
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
  | { type: "request-reschedule"; slot: InterviewSlot; startAt: string; durationMinutes: number; reason?: string }
  | { type: "review-request"; slot: InterviewSlot; decision: "approve" | "reject" }
  | null;

const roundSuggestions = ["aptitude", "technical", "hr", "managerial", "group discussion"];

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function roundLabel(value: string) {
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SlotFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { jobId: string; startAt: string; durationMinutes: number; type: string; interviewer?: string; location?: string }) => void;
}) {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => getJobs() });
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [type, setType] = useState("technical");
  const [interviewer, setInterviewer] = useState("");
  const [location, setLocation] = useState("Karachi placement cell");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!jobId || !date || !time || !type.trim()) {
      setError("Job, date, time, and round type are required.");
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
      type: type.trim(),
      interviewer: interviewer || undefined,
      location: location || undefined,
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
              <Input
                list="interview-round-options"
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="Technical, HR, managerial..."
              />
              <datalist id="interview-round-options">
                {roundSuggestions.map((round) => (
                  <option key={round} value={roundLabel(round)} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input type="number" min="15" max="240" step="15" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Karachi office, Zoom, campus room..." />
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
  requestMode = false,
}: {
  slot: InterviewSlot | null;
  onClose: () => void;
  onSubmit: (startAt: string, durationMinutes: number, reason?: string) => void;
  requestMode?: boolean;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slot) return;
    const currentStart = slot.startAt ? new Date(slot.startAt) : null;
    const duration = slot.startAt && slot.endAt
      ? Math.max(15, Math.round((new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000))
      : 60;

    setDate(currentStart && !Number.isNaN(currentStart.getTime()) ? currentStart.toISOString().slice(0, 10) : "");
    setTime(currentStart && !Number.isNaN(currentStart.getTime()) ? currentStart.toTimeString().slice(0, 5) : "");
    setDurationMinutes(String(duration));
    setReason("");
    setError("");
  }, [slot]);

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
    onSubmit(startAt.toISOString(), Number(durationMinutes), reason.trim() || undefined);
  }

  return (
    <Dialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{requestMode ? "Request Interview Change" : "Reschedule Interview"}</DialogTitle>
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
          {requestMode && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Briefly explain why you need a different time"
                rows={3}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{requestMode ? "Send request" : "Continue"}</Button>
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
  const [requestingSlot, setRequestingSlot] = useState<InterviewSlot | null>(null);
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

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, startAt, durationMinutes, reason }: { id: string; startAt: string; durationMinutes: number; reason?: string }) =>
      requestInterviewReschedule(id, { startAt, durationMinutes, reason }),
    onSuccess: () => {
      toast.success("Reschedule request sent");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviewRequestMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      reviewInterviewRescheduleRequest(id, { decision }),
    onSuccess: (_data, variables) => {
      toast.success(variables.decision === "approve" ? "Request approved" : "Request rejected");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roundFilterOptions = useMemo(() => {
    const rounds = new Set(roundSuggestions.map((round) => round.toLowerCase()));
    slots.forEach((slot) => {
      if (slot.type) rounds.add(slot.type.toLowerCase());
    });
    return ["all", ...Array.from(rounds)];
  }, [slots]);

  const filtered = useMemo(() => slots
    .filter((slot) => filterType === "all" || slot.type.toLowerCase() === filterType)
    .sort((a, b) => (a.startAt || "").localeCompare(b.startAt || "")), [slots, filterType]);

  const mySlots = slots.filter((slot) => slot.bookedBy === user?.id);
  const scheduledCount = slots.filter((slot) => slot.status === "scheduled").length;
  const pendingRequestCount = slots.filter((slot) => slot.rescheduleRequest?.status === "pending").length;

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
    if (pendingAction.type === "request-reschedule") {
      requestRescheduleMutation.mutate({
        id: pendingAction.slot.id,
        startAt: pendingAction.startAt,
        durationMinutes: pendingAction.durationMinutes,
        reason: pendingAction.reason,
      });
    }
    if (pendingAction.type === "review-request") {
      reviewRequestMutation.mutate({
        id: pendingAction.slot.id,
        decision: pendingAction.decision,
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
        : pendingAction?.type === "request-reschedule"
          ? `Send this requested time change for ${pendingAction.slot.jobTitle}. The interview time will not change unless the recruiter approves it.`
          : pendingAction?.type === "review-request"
            ? `${pendingAction.decision === "approve" ? "Approve" : "Reject"} this student's requested interview time for ${pendingAction.slot.jobTitle}. ${pendingAction.decision === "approve" ? "The confirmed interview time will be updated." : "The original interview time will stay unchanged."}`
            : "";

  const confirmTitle = pendingAction?.type === "book"
    ? "Book interview slot?"
    : pendingAction?.type === "reschedule"
      ? "Reschedule interview?"
      : pendingAction?.type === "request-reschedule"
        ? "Send reschedule request?"
        : pendingAction?.type === "review-request"
          ? pendingAction.decision === "approve" ? "Approve request?" : "Reject request?"
          : "Cancel interview?";

  const confirmLabel = pendingAction?.type === "book"
    ? "Book slot"
    : pendingAction?.type === "reschedule"
      ? "Reschedule"
      : pendingAction?.type === "request-reschedule"
        ? "Send request"
        : pendingAction?.type === "review-request"
          ? pendingAction.decision === "approve" ? "Approve request" : "Reject request"
          : "Cancel interview";

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
          { label: role === "student" ? "Your bookings" : "Pending requests", value: role === "student" ? mySlots.length : pendingRequestCount },
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
            {roundFilterOptions.map((round) => (
              <SelectItem key={round} value={round}>
                {round === "all" ? "All rounds" : roundLabel(round)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-muted-foreground">Loading interviews...</div>}

      {view === "list" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((slot) => {
            const isMyBooking = slot.bookedBy === user?.id;
            const pendingRequest = slot.rescheduleRequest?.status === "pending" ? slot.rescheduleRequest : null;
            const roundColor = typeColors[slot.type.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-200";
            return (
              <div key={slot.id} className={`bg-card rounded-lg border border-border p-5 ${slot.status === "cancelled" ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs capitalize ${roundColor}`}>{roundLabel(slot.type)} round</Badge>
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
                {(slot.location || slot.interviewer) && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {slot.location ? `Location: ${slot.location}` : ""}{slot.location && slot.interviewer ? " - " : ""}{slot.interviewer ? `Interviewer: ${slot.interviewer}` : ""}
                  </p>
                )}
                {slot.candidate && <p className="text-sm text-muted-foreground mb-4">Candidate: {slot.candidate}</p>}
                {pendingRequest && (
                  <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">Pending change request</p>
                    <p>Requested: {formatDateTime(pendingRequest.startAt)}</p>
                    {pendingRequest.reason && <p>Reason: {pendingRequest.reason}</p>}
                    {role !== "student" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => setPendingAction({ type: "review-request", slot, decision: "approve" })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPendingAction({ type: "review-request", slot, decision: "reject" })}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {role === "student" && slot.status === "available" && (
                    <Button size="sm" onClick={() => setPendingAction({ type: "book", slot })}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Book
                    </Button>
                  )}
                  {role === "student" && isMyBooking && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setRequestingSlot(slot)} disabled={Boolean(pendingRequest)}>
                        <RefreshCw className="w-3.5 h-3.5" /> Request change
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingAction({ type: "cancel", slot })}>
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </>
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
      <RescheduleDialog
        slot={requestingSlot}
        requestMode
        onClose={() => setRequestingSlot(null)}
        onSubmit={(startAt, durationMinutes, reason) => {
          if (requestingSlot) {
            setPendingAction({ type: "request-reschedule", slot: requestingSlot, startAt, durationMinutes, reason });
            setRequestingSlot(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={confirmTitle}
        description={confirmText}
        confirmLabel={confirmLabel}
        destructive={pendingAction?.type === "cancel" || (pendingAction?.type === "review-request" && pendingAction.decision === "reject")}
        onConfirm={confirmPendingAction}
      />
    </DashboardLayout>
  );
}

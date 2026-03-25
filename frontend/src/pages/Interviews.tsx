import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { mockInterviews, currentStudent, InterviewSlot } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
  Calendar, Clock, Building2, User, Plus, X,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────────

function timeToMins(t: string): number {
  const clean = t.trim();
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const [hStr, mStr] = clean.replace(/\s*(am|pm)/i, "").split(":").map(Number);
  let h = hStr;
  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + (mStr || 0);
}

function hasTimeConflict(slots: InterviewSlot[], date: string, time: string, excludeId?: string): boolean {
  const newStart = timeToMins(time);
  const newEnd = newStart + 60;
  return slots
    .filter((s) => s.date === date && s.id !== excludeId && s.status !== "cancelled")
    .some((s) => {
      const sStart = timeToMins(s.time);
      return newStart < sStart + 60 && newEnd > sStart;
    });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// ── badge colours ──────────────────────────────────────────────────────────────

const typeColors: Record<string, string> = {
  aptitude: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-purple-50 text-purple-700 border-purple-200",
  hr: "bg-amber-50 text-amber-700 border-amber-200",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-gray-50 text-gray-500 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

// ── slot card ──────────────────────────────────────────────────────────────────

function SlotCard({
  slot, role, onBook, onCancel, onDelete, isMyBooking,
}: {
  slot: InterviewSlot; role: string;
  onBook: (id: string) => void; onCancel: (id: string) => void; onDelete: (id: string) => void;
  isMyBooking: boolean;
}) {
  const isBooked = !!slot.candidate;
  const isCancelled = slot.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow ${isCancelled ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <Badge variant="outline" className={`text-xs capitalize ${typeColors[slot.type]}`}>{slot.type} Round</Badge>
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

      {role !== "student" && (
        <div className="mb-4 pt-3 border-t border-border flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          {slot.candidate
            ? <span>{slot.candidate}</span>
            : <span className="text-muted-foreground italic">No candidate yet</span>}
        </div>
      )}

      {!isCancelled && (
        <div className="flex gap-2">
          {role === "student" && !isBooked && (
            <Button size="sm" className="flex-1" onClick={() => onBook(slot.id)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Book slot
            </Button>
          )}
          {role === "student" && isMyBooking && (
            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onCancel(slot.id)}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
          )}
          {role === "recruiter" && (
            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onDelete(slot.id)}>
              <X className="w-3.5 h-3.5 mr-1" /> Delete slot
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── calendar timeline ──────────────────────────────────────────────────────────

function CalendarView({ slots, studentName }: { slots: InterviewSlot[]; studentName: string }) {
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  if (!dates.length)
    return <p className="text-muted-foreground text-sm text-center py-12">No interviews scheduled.</p>;

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const day = slots.filter((s) => s.date === date).sort((a, b) => timeToMins(a.time) - timeToMins(b.time));
        return (
          <div key={date}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {formatDate(date)}
            </h3>
            <div className="relative border-l-2 border-border ml-1 pl-5 space-y-3">
              {day.map((slot) => {
                const isMine = slot.candidate === studentName;
                const bgClass = isMine ? "bg-blue-50 border-blue-200"
                  : slot.candidate ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200";
                return (
                  <div key={slot.id} className={`rounded-lg p-3 text-xs border ${bgClass}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{slot.time}</span>
                      <span className="capitalize text-muted-foreground">{slot.type}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{slot.company} · {slot.jobTitle}</p>
                    {isMine && <p className="text-blue-700 font-medium mt-0.5">Your booking</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── create slot dialog (recruiter) ─────────────────────────────────────────────

interface NewSlotForm { jobTitle: string; company: string; date: string; time: string; type: InterviewSlot["type"]; }
const EMPTY_FORM: NewSlotForm = { jobTitle: "", company: "", date: "", time: "", type: "technical" };

function CreateSlotDialog({ open, onClose, onCreate, existingSlots }: {
  open: boolean; onClose: () => void;
  onCreate: (slot: Omit<InterviewSlot, "id">) => void;
  existingSlots: InterviewSlot[];
}) {
  const [form, setForm] = useState<NewSlotForm>(EMPTY_FORM);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleSubmit() {
    const { jobTitle, company, date, time, type } = form;
    if (!jobTitle || !company || !date || !time) { setError("All fields are required."); return; }

    // convert 24h → 12h AM/PM for consistency with existing data
    const [h24, m] = time.split(":").map(Number);
    const suffix = h24 >= 12 ? "PM" : "AM";
    const displayTime = `${h24 % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;

    if (hasTimeConflict(existingSlots, date, displayTime)) {
      setError(`Conflict: another slot already exists near ${displayTime} on ${formatDate(date)}.`);
      return;
    }
    onCreate({ jobTitle, company, date, time: displayTime, type, status: "scheduled" });
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Interview Slot</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Job Title</label>
            <Input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Company</label>
            <Input name="company" value={form.company} onChange={handleChange} placeholder="e.g. Google" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <Input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time</label>
              <Input type="time" name="time" value={form.time} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Round Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="aptitude">Aptitude</option>
              <option value="technical">Technical</option>
              <option value="hr">HR</option>
            </select>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create slot</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function Interviews() {
  const { role, userName } = useAuth();
  const [slots, setSlots] = useState<InterviewSlot[]>(mockInterviews);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const studentName = role === "student" ? (userName || currentStudent.name) : "";
  const filtered = slots
    .filter((s) => filterType === "all" || s.type === filterType)
    .sort((a, b) => a.date.localeCompare(b.date) || timeToMins(a.time) - timeToMins(b.time));

  const scheduledCount = slots.filter((s) => s.status === "scheduled").length;
  const mySlots = slots.filter((s) => s.candidate === studentName);

  function handleBook(id: string) {
    const slot = slots.find((s) => s.id === id)!;
    if (hasTimeConflict(slots.filter((s) => s.candidate === studentName), slot.date, slot.time)) {
      toast.error("Conflict: you already have an interview at this time.");
      return;
    }
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, candidate: studentName } : s));
    toast.success(`Slot booked: ${slot.jobTitle} at ${slot.company}`);
  }

  function handleCancel(id: string) {
    const slot = slots.find((s) => s.id === id)!;
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, candidate: undefined } : s));
    toast.info(`Booking cancelled: ${slot.jobTitle}`);
  }

  function handleDelete(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    toast.success("Slot deleted.");
  }

  function handleCreate(data: Omit<InterviewSlot, "id">) {
    setSlots((prev) => [...prev, { ...data, id: `i${Date.now()}` }]);
    toast.success("Interview slot created.");
  }

  return (
    <DashboardLayout>
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Interview Schedule</h1>
          <p className="text-muted-foreground mt-1">
            {role === "student"
              ? `${mySlots.length} of your slots · ${scheduledCount} total scheduled`
              : `${scheduledCount} slots scheduled`}
          </p>
        </div>
        {role === "recruiter" && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create slot
          </Button>
        )}
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total slots", value: slots.length },
          { label: "Scheduled", value: scheduledCount },
          { label: "Completed", value: slots.filter((s) => s.status === "completed").length },
          { label: role === "student" ? "Your bookings" : "Booked slots",
            value: role === "student" ? mySlots.length : slots.filter((s) => !!s.candidate).length },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
          {(["list", "calendar"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize font-medium transition-colors ${
                view === v ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}>
              {v === "list" ? "List" : "Calendar"}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="text-xs border border-input rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All types</option>
          <option value="aptitude">Aptitude</option>
          <option value="technical">Technical</option>
          <option value="hr">HR</option>
        </select>
      </div>

      {/* main content */}
      {view === "list" ? (
        filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((slot) => (
              <SlotCard key={slot.id} slot={slot} role={role}
                isMyBooking={slot.candidate === studentName}
                onBook={handleBook} onCancel={handleCancel} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground text-sm">No slots found.</div>
        )
      ) : (
        <div className="bg-card rounded-xl border border-border p-5">
          <CalendarView slots={filtered} studentName={studentName} />
        </div>
      )}

      {/* my bookings panel — student only */}
      {role === "student" && mySlots.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-blue-800 mb-3">Your booked interviews</h2>
          <div className="space-y-2">
            {mySlots.sort((a, b) => a.date.localeCompare(b.date)).map((s) => (
              <div key={s.id}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-blue-100 text-xs">
                <div>
                  <span className="font-semibold">{s.company}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-muted-foreground">{s.jobTitle}</span>
                </div>
                <span className="text-muted-foreground">{formatDate(s.date)} at {s.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateSlotDialog open={showCreate} onClose={() => setShowCreate(false)}
        onCreate={handleCreate} existingSlots={slots} />
    </DashboardLayout>
  );
}

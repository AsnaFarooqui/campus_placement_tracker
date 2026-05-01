import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, FileText, UserRound } from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  ApplicationStatus,
  PlacementApplication,
  getApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "@/lib/api.ts";

const stages = ["Applied", "Shortlisted", "Interview Scheduled", "Selected"] as const;
const statusOptions: ApplicationStatus[] = ["Shortlisted", "Interview Scheduled", "Selected", "Rejected"];

const statusStyles: Record<string, string> = {
  Applied: "bg-info/10 text-info",
  Shortlisted: "bg-accent/10 text-accent",
  "Interview Scheduled": "bg-secondary/10 text-secondary",
  Selected: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Withdrawn: "bg-muted text-muted-foreground",
};

type PendingAction =
  | { type: "withdraw"; application: PlacementApplication }
  | { type: "status"; application: PlacementApplication; nextStatus: ApplicationStatus }
  | null;

function formatDate(dateString?: string) {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Applications() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("status") || "all";
  const [filter, setFilter] = useState(initialFilter);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: getApplications,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      toast.success("Application status updated");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["officer-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: () => {
      toast.success("Application withdrawn");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredApps = useMemo(() => applications.filter((app) => {
    if (filter === "all") return true;
    if (filter === "active") return !["Selected", "Rejected", "Withdrawn"].includes(app.status);
    return app.status === filter;
  }), [applications, filter]);

  const confirmDescription = pendingAction?.type === "withdraw"
    ? `Withdrawing from ${pendingAction.application.jobTitle} removes you from recruiter review. You can only reapply if the deadline is still open and duplicate rules allow it.`
    : pendingAction?.type === "status"
      ? `This will change ${pendingAction.application.studentName || "the applicant"} from ${pendingAction.application.status} to ${pendingAction.nextStatus} and notify the student.`
      : "";

  const handleConfirm = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "withdraw") {
      withdrawMutation.mutate(pendingAction.application.id);
    } else {
      updateMutation.mutate({ id: pendingAction.application.id, status: pendingAction.nextStatus });
    }
    setPendingAction(null);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">
          {role === "student" ? "My Applications" : "Applications"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {role === "student" ? "Track your placement journey" : "Review applicants and manage workflow status"}
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "active", "Applied", "Shortlisted", "Interview Scheduled", "Selected", "Rejected", "Withdrawn"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-3 py-1 rounded-full text-sm capitalize ${
              filter === item ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-muted-foreground">Loading applications...</div>}

      <div className="space-y-4">
        {filteredApps.map((app, index) => {
          const stageIndex = stages.indexOf(app.status as any);
          const canWithdraw = role === "student" && !["Selected", "Rejected", "Withdrawn"].includes(app.status);
          const visibleStatusOptions = Array.from(new Set([app.status, ...statusOptions]));

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card rounded-lg border border-border p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {role === "student" ? <FileText className="w-5 h-5 text-primary" /> : <UserRound className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{app.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {app.company} - Applied {formatDate(app.appliedDate)}
                    </p>
                    {role !== "student" && (
                      <p className="text-sm text-muted-foreground">
                        {app.studentName || "Unknown student"} - {app.studentBranch || "Branch missing"} - CGPA {app.studentCgpa ?? "N/A"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusStyles[app.status]}>{app.status}</Badge>
                  {role !== "student" && (
                    <Select
                      value={app.status}
                      onValueChange={(nextStatus) =>
                        setPendingAction({ type: "status", application: app, nextStatus: nextStatus as ApplicationStatus })
                      }
                    >
                      <SelectTrigger className="w-[210px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {canWithdraw && (
                    <Button variant="outline" onClick={() => setPendingAction({ type: "withdraw", application: app })}>
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {stages.map((stage, stagePosition) => {
                  const isActive = stagePosition <= stageIndex && !["Rejected", "Withdrawn"].includes(app.status);
                  return (
                    <div key={stage} className="flex items-center gap-1 flex-1">
                      <div className={`flex-1 h-1.5 rounded-full transition-colors ${isActive ? "bg-secondary" : "bg-muted"}`} />
                      {stagePosition < stages.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-md bg-muted/60 p-3">
                <p className="text-xs font-medium mb-2">Status history</p>
                <div className="space-y-1">
                  {(app.statusHistory || []).map((entry, historyIndex) => (
                    <div key={`${entry.status}-${historyIndex}`} className="text-xs text-muted-foreground">
                      {entry.status} - {formatDate(entry.changedAt)}{entry.note ? ` - ${entry.note}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}

        {!isLoading && filteredApps.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No applications found for this filter.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.type === "withdraw" ? "Withdraw application?" : "Change application status?"}
        description={confirmDescription}
        confirmLabel={pendingAction?.type === "withdraw" ? "Withdraw application" : "Change status"}
        destructive={pendingAction?.type === "withdraw" || pendingAction?.type === "status" && pendingAction.nextStatus === "Rejected"}
        onConfirm={handleConfirm}
      />
    </DashboardLayout>
  );
}

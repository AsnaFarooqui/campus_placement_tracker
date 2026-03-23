import DashboardLayout from "@/components/DashboardLayout";
import { mockApplications } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { FileText, ChevronRight } from "lucide-react";

const stages = ["applied", "shortlisted", "interview", "selected"] as const;

const statusStyles: Record<string, { bg: string; dot: string }> = {
  applied: { bg: "bg-info/10 text-info", dot: "bg-info" },
  shortlisted: { bg: "bg-accent/10 text-accent", dot: "bg-accent" },
  interview: { bg: "bg-secondary/10 text-secondary", dot: "bg-secondary" },
  selected: { bg: "bg-success/10 text-success", dot: "bg-success" },
  rejected: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

export default function Applications() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground mt-1">Track your placement journey</p>
      </div>

      <div className="space-y-4">
        {mockApplications.map((app, i) => {
          const style = statusStyles[app.status];
          const stageIndex = stages.indexOf(app.status as any);
          return (
            <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{app.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">{app.company} · Applied {app.appliedDate}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${style.bg}`}>
                  {app.status}
                </span>
              </div>

              {/* Pipeline */}
              <div className="flex items-center gap-1">
                {stages.map((stage, si) => {
                  const isActive = si <= stageIndex && app.status !== "rejected";
                  const isCurrent = si === stageIndex;
                  return (
                    <div key={stage} className="flex items-center gap-1 flex-1">
                      <div className={`flex-1 h-1.5 rounded-full transition-colors ${isActive ? "bg-secondary" : "bg-muted"}`} />
                      {si < stages.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1.5">
                {stages.map((s) => (
                  <span key={s} className="text-[10px] text-muted-foreground capitalize flex-1">{s}</span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

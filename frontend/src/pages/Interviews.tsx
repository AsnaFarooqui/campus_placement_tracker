import DashboardLayout from "@/components/DashboardLayout";
import { mockInterviews } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const typeColors: Record<string, string> = {
  aptitude: "bg-info/10 text-info border-info/20",
  technical: "bg-secondary/10 text-secondary border-secondary/20",
  hr: "bg-accent/10 text-accent border-accent/20",
};

export default function Interviews() {
  const scheduled = mockInterviews.filter((i) => i.status === "scheduled");

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Interview Schedule</h1>
        <p className="text-muted-foreground mt-1">{scheduled.length} upcoming interviews</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockInterviews.map((iv, i) => (
          <motion.div key={iv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className={`text-xs capitalize ${typeColors[iv.type]}`}>
                {iv.type} Round
              </Badge>
              <Badge variant={iv.status === "scheduled" ? "default" : "secondary"}
                className={`text-xs capitalize ${iv.status === "scheduled" ? "bg-success/10 text-success border-success/20" : ""}`}>
                {iv.status}
              </Badge>
            </div>
            <h3 className="font-display font-semibold mb-1">{iv.jobTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {iv.company}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {iv.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {iv.time}
              </span>
            </div>
            {iv.candidate && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{iv.candidate}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}

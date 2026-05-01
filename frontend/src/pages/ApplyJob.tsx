import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyToJob } from "@/lib/api.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [resume, setResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { jobId: string; resume: string; coverLetter: string }) =>
      applyToJob(data.jobId, {
        resume: data.resume,
        coverLetter: data.coverLetter,
      }),

    onSuccess: () => {
      toast.success("Application submitted");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate("/applications");
    },

    onError: (err: any) => {
      toast.error(err.details?.join("\n") || err.message);
    },
  });

  const handleSubmit = () => {
    setError("");
    if (!resume.trim()) {
      setError("Resume URL is required.");
      return;
    }
    mutation.mutate({
      jobId: jobId!,
      resume,
      coverLetter,
    });
  };
  
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Apply to Job</h1>

      <div className="space-y-4 max-w-lg">
        <Input
          placeholder="Resume URL"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
        />

        <Textarea
          placeholder="Cover Letter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </DashboardLayout>
  );
}

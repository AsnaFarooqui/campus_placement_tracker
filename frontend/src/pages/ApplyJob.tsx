import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyToJob } from "@/lib/api.ts";
import { useMutation } from "@tanstack/react-query";

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { jobId: string; resume: string; coverLetter: string }) =>
      applyToJob(data.jobId, {
        resume: data.resume,
        coverLetter: data.coverLetter,
      }),

    onSuccess: () => {
      alert("Application submitted");
      navigate("/applications");
    },

    onError: (err: any) => {
      alert(err.message);
    },
  });

  const handleSubmit = () => {
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

        <Input
          placeholder="Cover Letter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
        />

        <Button onClick={handleSubmit}>Submit Application</Button>
      </div>
    </DashboardLayout>
  );
}
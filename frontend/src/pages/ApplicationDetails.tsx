import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { mockApplications } from "@/lib/mock-data";

export default function ApplicationDetails() {
  const { id } = useParams();
  const app = mockApplications.find((a) => a.id === id);

  if (!app) return <div>Not found</div>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">{app.jobTitle}</h1>
      <p>{app.company}</p>
      <p>Status: {app.status}</p>
      <p>Applied on: {app.appliedDate}</p>
    </DashboardLayout>
  );
}
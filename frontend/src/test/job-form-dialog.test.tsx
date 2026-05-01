import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import JobFormDialog from "@/components/jobs/JobFormDialog";

describe("JobFormDialog", () => {
  it("shows frontend validation messages before submitting invalid job data", async () => {
    const onSubmit = vi.fn();
    render(<JobFormDialog triggerLabel="Post Job" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Post Job" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    expect(await screen.findByText("Job title is required.")).toBeInTheDocument();
    expect(screen.getByText("Company is required.")).toBeInTheDocument();
    expect(screen.getByText("Description is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

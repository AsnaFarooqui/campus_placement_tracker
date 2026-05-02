import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

  it("allows a custom branch to be added manually", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<JobFormDialog triggerLabel="Post Job" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Post Job" }));

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Software Engineer" } });
    fireEvent.change(inputs[1], { target: { value: "Systems Limited" } });
    fireEvent.change(document.querySelector("textarea")!, { target: { value: "Build placement products" } });
    fireEvent.change(inputs[2], { target: { value: "Karachi" } });
    fireEvent.change(inputs[7], { target: { value: "2099-01-01" } });

    fireEvent.change(screen.getByPlaceholderText("Add another branch manually"), {
      target: { value: "Cyber Security" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add branch" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].allowedBranches).toContain("Cyber Security");
  });
});

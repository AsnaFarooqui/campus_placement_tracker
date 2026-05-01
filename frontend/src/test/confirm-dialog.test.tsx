import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import ConfirmDialog from "@/components/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("requires explicit confirmation before running the risky action", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Close this job posting?"
        description="Students will no longer be able to apply."
        confirmLabel="Close job"
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("Students will no longer be able to apply.")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close job" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

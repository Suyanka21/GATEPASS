import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GatePassApp } from "../GatePassApp";

describe("GatePass UI", () => {
  it("renders the guard entry screen as the default home", () => {
    render(<GatePassApp />);
    expect(screen.getByRole("heading", { name: "GatePass" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scan QR/i })).toBeInTheDocument();
  });

  it("shows explicit feedback for repeated partial form submission", () => {
    render(<GatePassApp />);
    fireEvent.click(screen.getByRole("button", { name: "Walk-in" }));
    fireEvent.click(screen.getByRole("button", { name: "Log entry" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Visitor name is required");
  });

  it("surfaces camera failure and provides fallback actions", () => {
    render(<GatePassApp />);
    fireEvent.click(screen.getByRole("button", { name: "Scan QR" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate camera failure" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Camera failed");
    expect(screen.getByRole("button", { name: "Use walk-in" })).toBeInTheDocument();
  });
});

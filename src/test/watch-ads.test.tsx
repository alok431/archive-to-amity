import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WatchAds } from "@/components/snow/WatchAds";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Watch screen simulation", () => {
  it("fills one progress notch after the 3 second countdown", () => {
    vi.useFakeTimers();
    render(<WatchAds />);
    fireEvent.click(screen.getAllByRole("button", { name: "Watch Ad" })[0]!);
    expect(screen.getByRole("dialog")).toBeDefined();
    act(() => { vi.advanceTimersByTime(3100); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("progressbar")[0]!.getAttribute("aria-valuenow")).toBe("1");
  });
});

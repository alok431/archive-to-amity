import { afterEach, expect, it, vi } from "vitest";
import { createFrameScheduler } from "@/lib/frame-scheduler";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("sleeps on pause and resumes one retained frame without advancing paused time", () => {
  const request = vi.fn().mockReturnValue(7);
  const cancel = vi.fn();
  vi.stubGlobal("requestAnimationFrame", request);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  const paused = { current: false }, resume = vi.fn(), draw = vi.fn();
  const frames = createFrameScheduler(paused, resume);
  frames.request(draw);
  expect(request).toHaveBeenCalledTimes(1);
  paused.current = true;
  document.dispatchEvent(new Event("arcade-pause-change"));
  expect(cancel).toHaveBeenCalledWith(7);
  expect(draw).not.toHaveBeenCalled();
  paused.current = false;
  document.dispatchEvent(new Event("arcade-pause-change"));
  expect(resume).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(2);
  const callback = request.mock.calls[1]?.[0];
  expect(callback).toBeTypeOf("function");
  callback?.(100);
  expect(draw).toHaveBeenCalledWith(100);
  frames.dispose();
});

it("retains work in a hidden tab and rejects late requests after exit", () => {
  const request = vi.fn().mockReturnValue(3);
  vi.stubGlobal("requestAnimationFrame", request);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  const resume = vi.fn(), frames = createFrameScheduler({ current: false }, resume);
  frames.request(vi.fn());
  expect(request).not.toHaveBeenCalled();
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(request).toHaveBeenCalledTimes(1);
  expect(resume).toHaveBeenCalledOnce();
  frames.dispose();
  frames.request(vi.fn());
  document.dispatchEvent(new Event("visibilitychange"));
  expect(request).toHaveBeenCalledTimes(1);
});
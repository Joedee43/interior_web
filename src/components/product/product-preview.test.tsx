import { describe, expect, it, vi } from "vitest";

import { supportsWebGL2, watchForContextLoss } from "./product-preview";

describe("3D support detection", () => {
  it("requires a WebGL2 context", () => {
    const original = document.createElement.bind(document);
    const create = vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
      const element = original(tag, options);
      if (tag === "canvas") vi.spyOn(element as HTMLCanvasElement, "getContext").mockReturnValue(null);
      return element;
    });
    expect(supportsWebGL2()).toBe(false);
    create.mockRestore();
  });

  it("reports context loss and removes its listener during cleanup", () => {
    const canvas = document.createElement("canvas");
    const failure = vi.fn();
    const cleanup = watchForContextLoss(canvas, failure);
    const first = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    expect(failure).toHaveBeenCalledWith("The WebGL context was lost.");

    cleanup();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(failure).toHaveBeenCalledTimes(1);
  });
});

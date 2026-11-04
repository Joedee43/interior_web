import { describe, expect, it, vi } from "vitest";

import { supportsWebGL2 } from "./product-preview";

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
});

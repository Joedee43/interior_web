import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders an ordinary accessible button", () => {
    render(<Button>Save room</Button>);
    expect(screen.getByRole("button", { name: "Save room" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("composes a link through the Radix Slot primitive", () => {
    render(
      <Button asChild>
        <a href="/catalog">Browse furniture</a>
      </Button>,
    );
    expect(
      screen.getByRole("link", { name: "Browse furniture" }),
    ).toHaveAttribute("href", "/catalog");
  });
});

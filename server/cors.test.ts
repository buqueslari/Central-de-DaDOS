import type { VercelResponse } from "@vercel/node";
import { describe, expect, it, vi } from "vitest";
import { applyCors } from "./cors.js";

describe("applyCors", () => {
  it("allows requests from any origin", () => {
    const setHeader = vi.fn();
    const response = { setHeader } as unknown as VercelResponse;

    applyCors(response);

    expect(setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,POST,OPTIONS",
    );
    expect(setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type",
    );
  });
});

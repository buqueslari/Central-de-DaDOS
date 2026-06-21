import { describe, expect, it } from "vitest";
import { defaultSettings, type Submission } from "../types";
import { buildCsv } from "./csv";

describe("buildCsv", () => {
  it("mantem zeros iniciais e neutraliza formulas de planilha", () => {
    const row: Submission = {
      id: "abc",
      name: "=CMD()",
      number_16: "0012345678901234",
      number_4: "0032",
      number_3: "007",
      created_at: "2026-06-21T12:00:00.000Z",
    };

    const csv = buildCsv([row], defaultSettings);

    expect(csv).toContain("0012345678901234");
    expect(csv).toContain("'=CMD()");
  });
});

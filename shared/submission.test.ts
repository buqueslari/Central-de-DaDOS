import { describe, expect, it } from "vitest";
import { submissionSchema } from "./submission";

describe("submissionSchema", () => {
  it("preserva exatamente os textos enviados, inclusive zeros iniciais", () => {
    const payload = {
      name: " Joao Silva ",
      number16: "0012345678901234",
      number4: "0032",
      number3: "007",
    };

    expect(submissionSchema.parse(payload)).toEqual(payload);
  });

  it("rejeita numeros enviados como number para evitar perda de precisao", () => {
    const result = submissionSchema.safeParse({
      name: "Joao Silva",
      number16: 1234567890123456,
      number4: "1232",
      number3: "123",
    });

    expect(result.success).toBe(false);
  });

  it("exige as quantidades exatas de digitos", () => {
    const result = submissionSchema.safeParse({
      name: "Joao Silva",
      number16: "123",
      number4: "12A2",
      number3: "1234",
    });

    expect(result.success).toBe(false);
  });
});

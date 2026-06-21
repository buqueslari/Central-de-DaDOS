import { z } from "zod";

export const submissionSchema = z
  .object({
    name: z
      .string({ error: "O nome deve ser um texto." })
      .max(120, "O nome deve ter no maximo 120 caracteres.")
      .refine((value) => value.trim().length > 0, "Informe o nome."),
    number16: z
      .string({ error: "O numero de 16 digitos deve ser enviado como texto." })
      .regex(/^\d{16}$/, "Informe exatamente 16 digitos numericos."),
    number4: z
      .string({ error: "O numero de 4 digitos deve ser enviado como texto." })
      .regex(/^\d{4}$/, "Informe exatamente 4 digitos numericos."),
    number3: z
      .string({ error: "O numero de 3 digitos deve ser enviado como texto." })
      .regex(/^\d{3}$/, "Informe exatamente 3 digitos numericos."),
  })
  .strict();

export type SubmissionPayload = z.infer<typeof submissionSchema>;

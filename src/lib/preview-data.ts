import type { FormSettings, Submission, SubmissionStats } from "../types";
import { defaultSettings } from "../types";

const names = [
  "Joao Silva",
  "Maria Oliveira",
  "Carlos Santos",
  "Ana Pereira",
  "Lucas Ferreira",
  "Beatriz Lima",
  "Rafael Almeida",
  "Juliana Costa",
  "Gustavo Rocha",
  "Fernanda Martins",
  "Renata Souza",
  "Diego Ribeiro",
];

export const previewSubmissions: Submission[] = names.map((name, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name,
  number_16: `${index + 1}`.repeat(16).slice(0, 16),
  number_4: `${(index + 1) * 1111}`.slice(0, 4).padStart(4, "0"),
  number_3: `${(index + 1) * 111}`.slice(0, 3).padStart(3, "0"),
  created_at: new Date(Date.now() - index * 17 * 60 * 1000).toISOString(),
}));

export const previewStats: SubmissionStats = {
  total: 1246,
  today: 98,
  thisWeek: 542,
  thisMonth: 1102,
};

export const previewSettings: FormSettings = { ...defaultSettings };

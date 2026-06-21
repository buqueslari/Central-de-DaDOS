export interface Submission {
  id: string;
  name: string;
  number_16: string;
  number_4: string;
  number_3: string;
  created_at: string;
}

export interface SubmissionStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface FormSettings {
  form_title: string;
  success_message: string;
  name_label: string;
  number_16_label: string;
  number_4_label: string;
  number_3_label: string;
}

export const defaultSettings: FormSettings = {
  form_title: "Envie seus dados",
  success_message: "Dados enviados com sucesso.",
  name_label: "Nome",
  number_16_label: "Numero de 16 digitos",
  number_4_label: "Numero de 4 digitos",
  number_3_label: "Numero de 3 digitos",
};

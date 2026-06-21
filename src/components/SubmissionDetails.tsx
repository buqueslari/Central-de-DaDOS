import {
  Clock,
  Copy,
  DownloadSimple,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { FormSettings, Submission } from "../types";

interface SubmissionDetailsProps {
  submission: Submission | null;
  settings: FormSettings;
  open: boolean;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
  onDelete: (submission: Submission) => void;
  onExport: (submission: Submission) => void;
}

export function SubmissionDetails({
  submission,
  settings,
  open,
  onClose,
  onCopy,
  onDelete,
  onExport,
}: SubmissionDetailsProps) {
  if (!submission) return null;

  const fields = [
    { label: settings.name_label, value: submission.name, mono: false },
    { label: settings.number_16_label, value: submission.number_16, mono: true },
    { label: settings.number_4_label, value: submission.number_4, mono: true },
    { label: settings.number_3_label, value: submission.number_3, mono: true },
  ];

  return (
    <aside className={`details-panel${open ? " is-open" : ""}`} aria-label="Detalhes do recebimento">
      <div className="details-header">
        <div>
          <span className="eyebrow">PACOTE DE DADOS</span>
          <h2>Detalhes do recebimento</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Fechar detalhes">
          <X size={23} />
        </button>
      </div>

      <div className="details-fields">
        {fields.map((field) => (
          <div className="detail-field" key={field.label}>
            <span>{field.label}</span>
            <div>
              <strong className={field.mono ? "mono" : ""}>{field.value}</strong>
              <button
                className="copy-button"
                onClick={() => onCopy(field.value, field.label)}
                aria-label={`Copiar ${field.label}`}
              >
                <Copy size={18} />
                Copiar
              </button>
            </div>
          </div>
        ))}

        <div className="received-time">
          <Clock size={18} />
          <div>
            <span>Recebido em</span>
            <strong className="mono">
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "medium",
              }).format(new Date(submission.created_at))}
            </strong>
          </div>
        </div>
      </div>

      <div className="details-actions">
        <button className="button danger" onClick={() => onDelete(submission)}>
          <Trash size={19} />
          Excluir recebimento
        </button>
        <button className="button outline-cyan" onClick={() => onExport(submission)}>
          <DownloadSimple size={19} />
          Exportar recebimento
        </button>
      </div>
    </aside>
  );
}

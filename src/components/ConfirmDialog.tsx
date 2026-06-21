import { Warning, X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button dialog-close" onClick={onCancel} aria-label="Fechar">
          <X size={20} />
        </button>
        <div className="danger-icon"><Warning size={25} weight="fill" /></div>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="button secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className="button danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Excluindo..." : "Excluir recebimento"}
          </button>
        </div>
      </div>
    </div>
  );
}

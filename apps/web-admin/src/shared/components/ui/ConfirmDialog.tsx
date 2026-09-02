import { AppButton } from './AppButton';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Required in front of every destructive action (archive, disable, delete). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Sahkan',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-text-secondary">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <AppButton variant="ghost" onClick={onCancel} disabled={pending}>
          Batal
        </AppButton>
        <AppButton variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? 'Memproses...' : confirmLabel}
        </AppButton>
      </div>
    </Modal>
  );
}

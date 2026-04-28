import Dialog from "~/components/dialog/Dialog";
import Button from "~/components/button/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Видалити",
  cancelText = "Скасувати",
  isPending,
  onConfirm,
  onCancel,
  onClose,
  children,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose ?? onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="bg-[#ef4444] hover:bg-[#dc2626]"
          >
            {isPending ? "Видалення…" : confirmText}
          </Button>
        </>
      }
    >
      {children ? (
        children
      ) : (
        <p className="text-sm text-[#45556c]">
          Після видалення об&apos;єкт неможливо буде відновити.
        </p>
      )}
    </Dialog>
  );
}

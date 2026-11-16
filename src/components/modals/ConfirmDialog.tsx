import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import type { ConfirmOptions } from "../../context/UIContext";

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onClose: () => void;
}

export function ConfirmDialog({ options, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      open
      onClose={onClose}
      title={options.title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant={options.tone === "brand" ? "primary" : "danger"}
            onClick={() => {
              options.onConfirm();
              onClose();
            }}
            className="flex-1"
          >
            {options.confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="pt-0.5 text-[15px] leading-relaxed text-slate-700">
          {options.description}
        </p>
      </div>
    </Modal>
  );
}

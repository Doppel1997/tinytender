import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MovementReason, MovementType, Product } from "../types";

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "brand";
  onConfirm: () => void;
}

export interface MovementFormOptions {
  reason?: MovementReason;
  quantity?: number;
}

export type ModalState =
  | { kind: "product-form"; product?: Product }
  | { kind: "product-detail"; productId: string }
  | {
      kind: "movement";
      type: MovementType;
      productId?: string;
      options?: MovementFormOptions;
    }
  | { kind: "confirm"; options: ConfirmOptions }
  | null;

interface UIContextValue {
  modal: ModalState;
  openProductForm: (product?: Product) => void;
  openProductDetail: (productId: string) => void;
  openMovementForm: (
    type: MovementType,
    productId?: string,
    options?: MovementFormOptions,
  ) => void;
  openConfirm: (options: ConfirmOptions) => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);

  const closeModal = useCallback(() => setModal(null), []);
  const openProductForm = useCallback(
    (product?: Product) => setModal({ kind: "product-form", product }),
    [],
  );
  const openProductDetail = useCallback(
    (productId: string) => setModal({ kind: "product-detail", productId }),
    [],
  );
  const openMovementForm = useCallback(
    (type: MovementType, productId?: string, options?: MovementFormOptions) =>
      setModal({ kind: "movement", type, productId, options }),
    [],
  );
  const openConfirm = useCallback(
    (options: ConfirmOptions) => setModal({ kind: "confirm", options }),
    [],
  );

  const value = useMemo<UIContextValue>(
    () => ({
      modal,
      openProductForm,
      openProductDetail,
      openMovementForm,
      openConfirm,
      closeModal,
    }),
    [
      modal,
      openProductForm,
      openProductDetail,
      openMovementForm,
      openConfirm,
      closeModal,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI debe usarse dentro de UIProvider.");
  }
  return context;
}

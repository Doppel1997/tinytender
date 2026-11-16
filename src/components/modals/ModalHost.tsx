import { useUI } from "../../context/UIContext";
import { ProductFormModal } from "./ProductFormModal";
import { ProductDetailModal } from "./ProductDetailModal";
import { MovementFormModal } from "./MovementFormModal";
import { ConfirmDialog } from "./ConfirmDialog";

export function ModalHost() {
  const { modal, closeModal } = useUI();

  if (!modal) return null;

  if (modal.kind === "product-form") {
    return (
      <ProductFormModal
        key={modal.product?.id ?? "new-product"}
        product={modal.product}
        onClose={closeModal}
      />
    );
  }

  if (modal.kind === "product-detail") {
    return (
      <ProductDetailModal
        key={modal.productId}
        productId={modal.productId}
        onClose={closeModal}
      />
    );
  }

  if (modal.kind === "movement") {
    return (
      <MovementFormModal
        key={`${modal.type}-${modal.productId ?? "any"}-${modal.options?.reason ?? "none"}`}
        initialType={modal.type}
        initialProductId={modal.productId}
        initialReason={modal.options?.reason}
        initialQuantity={modal.options?.quantity}
        onClose={closeModal}
      />
    );
  }

  return (
    <ConfirmDialog
      key={`${modal.options.title}-${modal.options.confirmLabel}`}
      options={modal.options}
      onClose={closeModal}
    />
  );
}

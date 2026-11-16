import { useId, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Save, Sparkles } from "lucide-react";
import type { Category, Product, ProductInput, Unit } from "../../types";
import { CATEGORIES, UNITS } from "../../types";
import { Button } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { ProductIcon } from "../ProductIcon";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../lib/utils";
import { formatCurrency, normalizeText } from "../../lib/format";

interface ProductFormModalProps {
  product?: Product;
  onClose: () => void;
}

interface FormState {
  name: string;
  category: Category;
  sku: string;
  purchasePrice: string;
  salePrice: string;
  quantity: string;
  minStock: string;
  unit: Unit;
  expiresAt: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  category: "Abarrotes",
  sku: "",
  purchasePrice: "",
  salePrice: "",
  quantity: "0",
  minStock: "4",
  unit: "un",
  expiresAt: "",
};

function buildInitialForm(product?: Product): FormState {
  if (!product) return { ...emptyForm };
  return {
    name: product.name,
    category: product.category,
    sku: product.sku,
    purchasePrice: product.purchasePrice ? String(product.purchasePrice) : "",
    salePrice: product.salePrice ? String(product.salePrice) : "",
    quantity: String(product.quantity),
    minStock: String(product.minStock),
    unit: product.unit,
    expiresAt: product.batches.length > 1 ? "" : (product.expiresAt ?? ""),
  };
}

function categoryPrefix(category: Category): string {
  const normalized = normalizeText(category).replace(/\s/g, "");
  return normalized.slice(0, 3).toUpperCase();
}

function generateSku(category: Category, existing: string[]): string {
  const prefix = categoryPrefix(category);
  const used = new Set(existing.map((sku) => sku.toUpperCase()));
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const number = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-${number}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

export function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const { products, addProduct, updateProduct } = useStore();
  const { pushToast } = useToast();
  const formId = useId();
  const detailsId = useId();
  const [form, setForm] = useState<FormState>(() => buildInitialForm(product));
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDetails, setShowDetails] = useState(Boolean(product));
  const isEdit = Boolean(product);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const margin = useMemo(() => {
    const purchase = Number(form.purchasePrice);
    const sale = Number(form.salePrice);
    if (
      form.purchasePrice === "" ||
      form.salePrice === "" ||
      !Number.isFinite(purchase) ||
      !Number.isFinite(sale) ||
      sale <= 0
    ) {
      return null;
    }
    return {
      percent: Math.round(((sale - purchase) / sale) * 100),
      profit: sale - purchase,
    };
  }, [form.purchasePrice, form.salePrice]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    const name = form.name.trim();
    if (name.length < 2) nextErrors.name = "Escribe el nombre del producto.";

    const quantity = Number(form.quantity);
    if (form.quantity === "" || !Number.isInteger(quantity) || quantity < 0) {
      nextErrors.quantity = "Escribe cuántas unidades tienes (0 o más).";
    }

    const minStock = Number(form.minStock);
    if (form.minStock === "" || !Number.isInteger(minStock) || minStock < 0) {
      nextErrors.minStock = "Escribe un número igual o mayor a cero.";
    }

    const purchase = form.purchasePrice === "" ? 0 : Number(form.purchasePrice);
    if (!Number.isFinite(purchase) || purchase < 0) {
      nextErrors.purchasePrice = "Escribe un precio válido.";
    }

    const sale = form.salePrice === "" ? 0 : Number(form.salePrice);
    if (!Number.isFinite(sale) || sale < 0) {
      nextErrors.salePrice = "Escribe un precio válido.";
    }

    const sku = form.sku.trim().toUpperCase();
    if (
      sku &&
      products.some(
        (item) => item.id !== product?.id && item.sku.toUpperCase() === sku,
      )
    ) {
      nextErrors.sku = "Ya tienes un producto con este código.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (
        nextErrors.purchasePrice ||
        nextErrors.salePrice ||
        nextErrors.sku
      ) {
        setShowDetails(true);
      }
      return;
    }

    const payload: ProductInput = {
      name,
      category: form.category,
      sku:
        sku ||
        generateSku(
          form.category,
          products.map((item) => item.sku).filter(Boolean),
        ),
      purchasePrice: Math.round(purchase),
      salePrice: Math.round(sale),
      quantity,
      minStock,
      unit: form.unit,
      expiresAt: form.expiresAt || null,
      icon: "",
    };

    if (product) {
      updateProduct(product.id, payload);
      pushToast({
        title: "Cambios guardados",
        description: `Actualizamos los datos de ${name}.`,
      });
    } else {
      addProduct(payload);
      pushToast({
        title: "¡Producto guardado!",
        description: `${name} ya está en tu tienda.`,
      });
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Editar producto" : "Agregar producto"}
      description={
        isEdit
          ? "Cambia lo que necesites y guarda."
          : "Con el nombre y la cantidad ya puedes guardarlo."
      }
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            className="w-full sm:flex-[2]"
          >
            <Save className="h-5 w-5" />
            Guardar producto
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          label="Nombre del producto"
          htmlFor="product-name"
          required
          error={errors.name}
        >
          <Input
            id="product-name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Ej.: Gaseosa Coca-Cola 1.5 litros"
            maxLength={64}
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="¿Cuántas unidades tienes?"
            htmlFor="product-quantity"
            required
            error={errors.quantity}
          >
            <Input
              id="product-quantity"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              placeholder="0"
            />
          </Field>
          <Field
            label="Avisarme cuando queden pocas"
            htmlFor="product-min-stock"
            required
            error={errors.minStock}
            hint="Por ejemplo, 4. Te avisamos cuando queden 4 o menos."
          >
            <Input
              id="product-min-stock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.minStock}
              onChange={(event) => update("minStock", event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Fecha de vencimiento"
          htmlFor="product-expiry"
          optional
          hint={
            isEdit && product && product.batches.length > 1
              ? "Este producto tiene varios lotes. Para registrar uno nuevo con otra fecha, usa «Recibir mercancía»."
              : "Déjala vacía si el producto no vence, como los licores."
          }
        >
          <Input
            id="product-expiry"
            type="date"
            value={form.expiresAt}
            onChange={(event) => update("expiresAt", event.target.value)}
          />
        </Field>

        <div className="rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            aria-controls={detailsId}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <span>
              <span className="block text-base font-bold text-slate-900">
                Agregar más detalles
              </span>
              <span className="mt-0.5 block text-sm text-slate-600">
                Categoría, precios, código y unidad de medida
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-slate-600 transition-transform",
                showDetails && "rotate-180",
              )}
            />
          </button>

          <div
            id={detailsId}
            hidden={!showDetails}
            className="space-y-4 border-t border-slate-200 px-4 py-4"
          >
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <ProductIcon product={{ category: form.category }} size="sm" />
              <p className="text-sm leading-snug text-slate-700">
                El icono cambia según la categoría que elijas.
              </p>
            </div>

            <Field label="Categoría" htmlFor="product-category" optional>
              <Select
                id="product-category"
                value={form.category}
                onChange={(event) =>
                  update("category", event.target.value as Category)
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Código del producto"
              htmlFor="product-sku"
              optional
              error={errors.sku}
              hint="Si lo dejas vacío, lo creamos por ti."
            >
              <Input
                id="product-sku"
                value={form.sku}
                onChange={(event) =>
                  update("sku", event.target.value.toUpperCase())
                }
                placeholder="Ej.: GAS-0001"
                maxLength={20}
                className="uppercase"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Precio de compra"
                htmlFor="product-purchase"
                optional
                error={errors.purchasePrice}
              >
                <Input
                  id="product-purchase"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  value={form.purchasePrice}
                  onChange={(event) =>
                    update("purchasePrice", event.target.value)
                  }
                  placeholder="Ej.: 5200"
                />
              </Field>
              <Field
                label="Precio de venta"
                htmlFor="product-sale"
                optional
                error={errors.salePrice}
              >
                <Input
                  id="product-sale"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  value={form.salePrice}
                  onChange={(event) => update("salePrice", event.target.value)}
                  placeholder="Ej.: 7000"
                />
              </Field>
            </div>

            {margin ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
                <span className="text-slate-600">Ganancia por unidad</span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      margin.percent >= 0 ? "text-brand-800" : "text-red-700",
                    )}
                  >
                    {margin.percent}%
                  </span>
                  <span className="font-semibold tabular-nums text-slate-800">
                    {formatCurrency(margin.profit)}
                  </span>
                </span>
              </div>
            ) : null}

            <Field
              label="Unidad de medida"
              htmlFor="product-unit"
              optional
              hint="Cómo cuentas este producto: unidades, botellas, cajas…"
            >
              <Select
                id="product-unit"
                value={form.unit}
                onChange={(event) =>
                  update("unit", event.target.value as Unit)
                }
              >
                {UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </Select>
            </Field>

            <p className="flex items-start gap-2 text-sm leading-snug text-slate-600">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
              Todos estos datos son opcionales. Puedes completarlos después.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}

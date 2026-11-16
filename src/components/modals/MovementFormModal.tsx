import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import type { MovementReason, MovementType } from "../../types";
import {
  MOVEMENT_REASONS,
  MOVEMENT_REASON_LABEL,
  unitFor,
} from "../../types";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/SectionCard";
import { ProductIcon } from "../ProductIcon";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useUI } from "../../context/UIContext";
import { cn } from "../../lib/utils";
import { normalizeText } from "../../lib/format";
import { formatDate, parseDate, todayISO, toISODate } from "../../lib/date";

interface MovementFormModalProps {
  initialType: MovementType;
  initialProductId?: string;
  initialReason?: MovementReason;
  initialQuantity?: number;
  onClose: () => void;
}

interface FormErrors {
  product?: string;
  quantity?: string;
  reason?: string;
  form?: string;
}

const REASON_HINT: Record<MovementReason, string> = {
  venta: "La vendiste a un cliente",
  vencido: "Ya no se puede vender",
  danado: "Se dañó o se rompió",
  perdido: "Se perdió o no aparece",
  consumo: "La usaste en tu negocio",
  otro: "Otro motivo",
};

export function MovementFormModal({
  initialType,
  initialProductId,
  initialReason,
  initialQuantity,
  onClose,
}: MovementFormModalProps) {
  const { products, addMovement } = useStore();
  const { pushToast } = useToast();
  const { openProductForm } = useUI();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [type, setType] = useState<MovementType>(initialType);
  const [productId, setProductId] = useState(initialProductId ?? "");
  const [pickerOpen, setPickerOpen] = useState(!initialProductId);
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(
    initialQuantity && initialQuantity > 0 ? String(initialQuantity) : "",
  );
  const [reason, setReason] = useState<MovementReason>(initialReason ?? "venta");
  const [expiresAt, setExpiresAt] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [products, productId],
  );

  const filteredProducts = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return products;
    return products.filter((item) => normalizeText(item.name).includes(term));
  }, [products, query]);

  const quantityNumber = Number(quantity);
  const hasValidQuantity =
    quantity !== "" && Number.isInteger(quantityNumber) && quantityNumber > 0;
  const exceedsStock =
    Boolean(product) &&
    type === "salida" &&
    hasValidQuantity &&
    quantityNumber > (product?.quantity ?? 0);
  const newStock = product
    ? product.quantity + (type === "entrada" ? quantityNumber : -quantityNumber)
    : 0;

  const quickValues = useMemo(() => {
    if (!product) return [];
    if (type === "entrada") return [6, 12, 24, 36];
    return [1, 2, 3, 6, 12].filter((value) => value <= product.quantity);
  }, [product, type]);

  const clearError = (key: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const adjustQuantity = (delta: number) => {
    const current = Number(quantity) || 0;
    const next = Math.max(current + delta, 0);
    setQuantity(next === 0 ? "" : String(next));
    clearError("quantity");
  };

  const selectProduct = (id: string) => {
    setProductId(id);
    setPickerOpen(false);
    setQuery("");
    setErrors({});
    const selected = products.find((item) => item.id === id);
    if (
      type === "salida" &&
      selected &&
      Number(quantity) > selected.quantity
    ) {
      setQuantity("");
    }
  };

  const switchType = (nextType: MovementType) => {
    setType(nextType);
    clearError("quantity");
    if (nextType === "entrada") {
      setReason("venta");
    }
  };

  const handleContinue = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    if (!product) {
      nextErrors.product = "Elige el producto que vas a mover.";
    }
    if (!hasValidQuantity) {
      nextErrors.quantity = "Escribe una cantidad mayor que cero.";
    } else if (product && type === "salida" && quantityNumber > product.quantity) {
      nextErrors.quantity =
        product.quantity === 0
          ? "No tienes unidades disponibles de este producto."
          : `Solo tienes ${product.quantity} ${unitFor(
              product.unit,
              product.quantity,
            )}.`;
    }
    if (!date) {
      nextErrors.form = "Elige la fecha.";
    }
    if (type === "salida" && !reason) {
      nextErrors.reason = "Elige el motivo de la salida.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.form) setShowDetails(true);
      return;
    }

    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!product) return;

    const selectedDate = parseDate(date);
    const now = new Date();
    let dateIso: string;
    if (toISODate(selectedDate) === toISODate(now)) {
      dateIso = now.toISOString();
    } else {
      selectedDate.setHours(12, 0, 0, 0);
      dateIso = selectedDate.toISOString();
    }

    const result = addMovement({
      productId: product.id,
      type,
      quantity: quantityNumber,
      date: dateIso,
      reason: type === "salida" ? reason : undefined,
      expiresAt: type === "entrada" ? expiresAt || null : undefined,
      note,
    });

    if (!result.ok) {
      setErrors({ form: result.error });
      setStep("form");
      pushToast({
        title: "No se pudo guardar",
        description: result.error,
        variant: "error",
      });
      return;
    }

    pushToast({
      title: type === "entrada" ? "¡Listo! Recibiste mercancía" : "¡Listo! Registramos la salida",
      description: `${product.name}: ahora tienes ${result.newStock} ${unitFor(
        product.unit,
        result.newStock,
      )}.`,
    });
    onClose();
  };

  if (products.length === 0) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Todavía no tienes productos"
        description="Primero agrega un producto para poder recibir o sacar mercancía."
        footer={
          <Button size="lg" className="w-full" onClick={() => openProductForm()}>
            Agregar producto
          </Button>
        }
      >
        <EmptyState
          icon={ArrowDownToLine}
          title="Tu tienda está vacía"
          description="Agrega tu primer producto y después podrás registrar lo que llega y lo que sale."
        />
      </Modal>
    );
  }

  const title =
    step === "confirm"
      ? "Revisa antes de guardar"
      : type === "entrada"
        ? "Recibir mercancía"
        : "Registrar salida";

  const description =
    step === "confirm"
      ? "Así quedará tu inventario cuando guardes."
      : type === "entrada"
        ? "Anota lo que llegó a tu tienda."
        : "Anota lo que salió de tu tienda.";

  const footer =
    step === "form" ? (
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="outline" onClick={onClose} className="w-full sm:flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          form="movement-form"
          size="lg"
          className="w-full sm:flex-[2]"
        >
          Continuar
        </Button>
      </div>
    ) : (
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => setStep("form")}
          className="w-full sm:flex-1"
        >
          Volver
        </Button>
        <Button size="lg" onClick={handleConfirm} className="w-full sm:flex-[2]">
          <CheckCircle2 className="h-5 w-5" />
          {type === "entrada" ? "Sí, recibí la mercancía" : "Sí, registrar la salida"}
        </Button>
      </div>
    );

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      footer={footer}
    >
      {step === "form" ? (
        <form
          id="movement-form"
          onSubmit={handleContinue}
          className="space-y-5"
          noValidate
        >
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => switchType("entrada")}
              aria-pressed={type === "entrada"}
              className={cn(
                "flex min-h-[64px] items-center gap-2.5 rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                type === "entrada"
                  ? "border-brand-700 bg-brand-50"
                  : "border-slate-200 bg-white hover:border-slate-400",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  type === "entrada"
                    ? "bg-brand-800 text-white"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                <ArrowDownToLine className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-slate-900">
                  Llegó
                </span>
                <span className="block text-[13px] leading-tight text-slate-600">
                  Entra mercancía
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchType("salida")}
              aria-pressed={type === "salida"}
              className={cn(
                "flex min-h-[64px] items-center gap-2.5 rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                type === "salida"
                  ? "border-amber-600 bg-amber-50"
                  : "border-slate-200 bg-white hover:border-slate-400",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  type === "salida"
                    ? "bg-amber-700 text-white"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                <ArrowUpFromLine className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-slate-900">
                  Salió
                </span>
                <span className="block text-[13px] leading-tight text-slate-600">
                  Sale mercancía
                </span>
              </span>
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              ¿Qué producto?
            </p>

            {product && !pickerOpen ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3">
                <ProductIcon product={product} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-slate-900">
                    {product.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Tienes {product.quantity}{" "}
                    {unitFor(product.unit, product.quantity)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar producto…"
                    aria-label="Buscar producto"
                    className="pl-11"
                    autoFocus={!initialProductId}
                  />
                </div>
                {errors.product ? (
                  <p className="mt-1.5 text-sm font-semibold text-red-700">
                    {errors.product}
                  </p>
                ) : null}
                <ul className="mt-2 max-h-[260px] divide-y divide-slate-200 overflow-y-auto rounded-xl border border-slate-300">
                  {filteredProducts.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-slate-600">
                      No encontramos ese producto.
                    </li>
                  ) : (
                    filteredProducts.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectProduct(item.id)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
                        >
                          <ProductIcon product={item} size="xs" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold text-slate-900">
                              {item.name}
                            </span>
                            <span
                              className={cn(
                                "block text-[13px]",
                                item.quantity <= 0
                                  ? "font-semibold text-red-700"
                                  : "text-slate-600",
                              )}
                            >
                              {item.quantity <= 0
                                ? "Agotado"
                                : `${item.quantity} ${unitFor(
                                    item.unit,
                                    item.quantity,
                                  )}`}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          {product ? (
            <>
              <Field
                label="¿Cuántas unidades?"
                htmlFor="movement-quantity"
                required
                error={errors.quantity}
                hint={
                  type === "salida"
                    ? `Tienes ${product.quantity} ${unitFor(
                        product.unit,
                        product.quantity,
                      )}.`
                    : `Ahora tienes ${product.quantity} ${unitFor(
                        product.unit,
                        product.quantity,
                      )}.`
                }
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustQuantity(-1)}
                    aria-label="Quitar una unidad"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input
                    id="movement-quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value);
                      clearError("quantity");
                    }}
                    placeholder="0"
                    className="flex-1 text-center text-xl font-bold tabular-nums"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustQuantity(1)}
                    aria-label="Agregar una unidad"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                {quickValues.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickValues.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setQuantity(String(value));
                          clearError("quantity");
                        }}
                        className={cn(
                          "min-h-[44px] rounded-lg border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                          Number(quantity) === value
                            ? "border-brand-700 bg-brand-50 text-brand-900"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                    {type === "salida" && product.quantity > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuantity(String(product.quantity));
                          clearError("quantity");
                        }}
                        className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        Todo ({product.quantity})
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </Field>

              {type === "entrada" ? (
                <Field
                  label="¿Este lote tiene vencimiento?"
                  htmlFor="movement-expiry"
                  optional
                  hint="Si no vence, déjala vacía."
                >
                  <Input
                    id="movement-expiry"
                    type="date"
                    min={todayISO()}
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </Field>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    ¿Por qué salió?
                  </p>
                  <div
                    role="group"
                    aria-label="Motivo de la salida"
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {MOVEMENT_REASONS.map((option) => {
                      const active = reason === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setReason(option);
                            clearError("reason");
                          }}
                          aria-pressed={active}
                          className={cn(
                            "flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                            active
                              ? "border-brand-700 bg-brand-50"
                              : "border-slate-200 bg-white hover:border-slate-400",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                              active
                                ? "border-brand-700 bg-brand-700 text-white"
                                : "border-slate-400 text-transparent",
                            )}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[15px] font-semibold text-slate-900">
                              {MOVEMENT_REASON_LABEL[option]}
                            </span>
                            <span className="block text-[13px] leading-tight text-slate-600">
                              {REASON_HINT[option]}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.reason ? (
                    <p className="text-sm font-semibold text-red-700">
                      {errors.reason}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setShowDetails((value) => !value)}
                  aria-expanded={showDetails}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    Fecha y nota (opcional)
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-600 transition-transform",
                      showDetails && "rotate-180",
                    )}
                  />
                </button>
                {showDetails ? (
                  <div className="space-y-4 border-t border-slate-200 px-4 py-4">
                    <Field
                      label={type === "entrada" ? "Fecha de llegada" : "Fecha de salida"}
                      htmlFor="movement-date"
                      required
                    >
                      <div className="relative">
                        <Input
                          id="movement-date"
                          type="date"
                          value={date}
                          max={todayISO()}
                          onChange={(event) => setDate(event.target.value)}
                          className="pr-10"
                        />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      </div>
                    </Field>
                    <Field label="Nota" htmlFor="movement-note" optional>
                      <Textarea
                        id="movement-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Ej.: pedido a domicilio, compra al proveedor…"
                        maxLength={140}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>

              {hasValidQuantity && !exceedsStock ? (
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-[15px] font-medium text-slate-800">
                  Quedarán <strong className="font-bold">{newStock}</strong>{" "}
                  {unitFor(product.unit, newStock)} de {product.name}.
                </p>
              ) : null}
            </>
          ) : null}

          {errors.form ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errors.form}
            </p>
          ) : null}
        </form>
      ) : product ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
            <ProductIcon product={product} size="md" />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-snug text-slate-900">
                {product.name}
              </p>
              <p className="text-sm text-slate-600">
                Tienes {product.quantity}{" "}
                {unitFor(product.unit, product.quantity)}
              </p>
            </div>
          </div>

          <dl className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-300">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-[15px] text-slate-700">
                {type === "entrada" ? "Van a entrar" : "Van a salir"}
              </dt>
              <dd
                className={cn(
                  "text-xl font-bold tabular-nums",
                  type === "entrada" ? "text-brand-800" : "text-amber-800",
                )}
              >
                {type === "entrada" ? "+" : "−"}
                {quantityNumber} {unitFor(product.unit, quantityNumber)}
              </dd>
            </div>
            {type === "salida" ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[15px] text-slate-700">Motivo</dt>
                <dd className="text-right text-[15px] font-semibold text-slate-900">
                  {MOVEMENT_REASON_LABEL[reason]}
                </dd>
              </div>
            ) : null}
            {type === "entrada" && expiresAt ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[15px] text-slate-700">Vence</dt>
                <dd className="text-right text-[15px] font-semibold text-slate-900">
                  {formatDate(expiresAt)}
                </dd>
              </div>
            ) : null}
            {date !== todayISO() ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[15px] text-slate-700">Fecha</dt>
                <dd className="text-right text-[15px] font-semibold text-slate-900">
                  {formatDate(date)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 bg-brand-50 px-4 py-3.5">
              <dt className="text-[15px] font-semibold text-brand-900">
                Te quedarán
              </dt>
              <dd className="text-xl font-extrabold tabular-nums text-brand-900">
                {newStock} {unitFor(product.unit, newStock)}
              </dd>
            </div>
          </dl>

          <p className="text-sm leading-relaxed text-slate-600">
            {type === "entrada"
              ? "Se sumará a lo que ya tienes y quedará guardado en este celular."
              : "Se descontará de tu inventario. La cantidad no puede quedar en negativo."}
          </p>

          {errors.form ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errors.form}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

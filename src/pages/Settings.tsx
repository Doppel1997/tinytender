import { useEffect, useState, type FormEvent } from "react";
import {
  Database,
  HardDrive,
  RotateCcw,
  Save,
  ShoppingBasket,
  SlidersHorizontal,
  Store,
  Trash2,
  Wine,
} from "lucide-react";
import type { BusinessType } from "../types";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { useUI } from "../context/UIContext";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Switch } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { cn } from "../lib/utils";

interface ProfileForm {
  businessName: string;
  ownerName: string;
  businessType: BusinessType;
  city: string;
  address: string;
  phone: string;
}

type ProfileKey = keyof ProfileForm;

const BUSINESS_TYPES: Array<{
  value: BusinessType;
  label: string;
  icon: typeof Store;
}> = [
  { value: "tienda", label: "Tienda", icon: Store },
  { value: "licorera", label: "Licorera", icon: Wine },
  { value: "mixta", label: "Las dos", icon: ShoppingBasket },
];

export function SettingsPage() {
  const {
    settings,
    products,
    movements,
    updateSettings,
    resetDemo,
    clearInventory,
  } = useStore();
  const { pushToast } = useToast();
  const { openConfirm } = useUI();
  const [form, setForm] = useState<ProfileForm>({
    businessName: settings.businessName,
    ownerName: settings.ownerName,
    businessType: settings.businessType,
    city: settings.city,
    address: settings.address,
    phone: settings.phone,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      businessName: settings.businessName,
      ownerName: settings.ownerName,
      businessType: settings.businessType,
      city: settings.city,
      address: settings.address,
      phone: settings.phone,
    });
  }, [
    settings.businessName,
    settings.ownerName,
    settings.businessType,
    settings.city,
    settings.address,
    settings.phone,
  ]);

  const update = <K extends ProfileKey>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "businessName") setError(null);
  };

  const dirty = (Object.keys(form) as ProfileKey[]).some(
    (key) => settings[key] !== form[key],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.businessName.trim().length < 2) {
      setError("Escribe el nombre de tu negocio.");
      return;
    }
    updateSettings({
      businessName: form.businessName.trim(),
      ownerName: form.ownerName.trim(),
      businessType: form.businessType,
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
    });
    pushToast({
      title: "Datos guardados",
      description: "Así aparecerá tu negocio en la aplicación.",
    });
  };

  const handleRestore = () => {
    openConfirm({
      title: "Restaurar datos de ejemplo",
      description:
        "Se reemplazarán tus productos, tus entradas y salidas y la configuración por los datos de ejemplo de Tienda Doña Rosa. Esta acción no se puede deshacer.",
      confirmLabel: "Sí, restaurar",
      tone: "danger",
      onConfirm: () => {
        resetDemo();
        pushToast({
          title: "Datos de ejemplo restaurados",
          description: "La tienda volvió a como estaba al principio.",
        });
      },
    });
  };

  const handleClear = () => {
    openConfirm({
      title: "Borrar todo el inventario",
      description:
        "Se eliminarán todos los productos y todas las entradas y salidas. Los datos de tu negocio se conservan. Esta acción no se puede deshacer.",
      confirmLabel: "Sí, borrar todo",
      tone: "danger",
      onConfirm: () => {
        clearInventory();
        pushToast({
          title: "Inventario borrado",
          description: "Ya puedes empezar con tus propios productos.",
        });
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Los datos de tu negocio y la información guardada en este celular."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-slate-300 bg-white p-4 sm:p-5 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-800">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tu negocio</h2>
              <p className="text-sm text-slate-600">
                Así te saludamos y mostramos tu tienda.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre del negocio"
                htmlFor="settings-business-name"
                required
                error={error ?? undefined}
              >
                <Input
                  id="settings-business-name"
                  value={form.businessName}
                  onChange={(event) =>
                    update("businessName", event.target.value)
                  }
                  placeholder="Ej.: Tienda Doña Rosa"
                  maxLength={50}
                />
              </Field>
              <Field
                label="Tu nombre"
                htmlFor="settings-owner"
                optional
                hint="Lo usamos para saludarte en el inicio."
              >
                <Input
                  id="settings-owner"
                  value={form.ownerName}
                  onChange={(event) => update("ownerName", event.target.value)}
                  placeholder="Ej.: Doña Rosa"
                  maxLength={40}
                />
              </Field>
            </div>

            <Field label="¿Qué tipo de negocio es?" required>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_TYPES.map((item) => {
                  const active = form.businessType === item.value;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => update("businessType", item.value)}
                      aria-pressed={active}
                      className={cn(
                        "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                        active
                          ? "border-brand-700 bg-brand-50"
                          : "border-slate-200 bg-white hover:border-slate-400",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          active ? "text-brand-800" : "text-slate-600",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          active ? "text-brand-900" : "text-slate-800",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ciudad o municipio" htmlFor="settings-city" optional>
                <Input
                  id="settings-city"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  placeholder="Ej.: Villavicencio"
                  maxLength={40}
                />
              </Field>
              <Field label="Teléfono o WhatsApp" htmlFor="settings-phone" optional>
                <Input
                  id="settings-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="Ej.: 310 555 0182"
                  maxLength={24}
                />
              </Field>
            </div>

            <Field label="Dirección" htmlFor="settings-address" optional>
              <Input
                id="settings-address"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="Ej.: Calle 15 # 8-42, Barrio La Esperanza"
                maxLength={80}
              />
            </Field>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {dirty
                  ? "Tienes cambios sin guardar."
                  : "Tus datos están al día."}
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={!dirty}
                className="w-full sm:w-auto"
              >
                <Save className="h-5 w-5" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </section>

        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-xl border border-slate-300 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-800">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Avisos</h2>
                <p className="text-sm text-slate-600">
                  Cuándo te avisamos de un vencimiento.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Field
                label="Avisarme antes de que venza"
                htmlFor="settings-warning-days"
                hint={`Te avisamos cuando falten ${settings.expiryWarningDays} días o menos.`}
              >
                <Select
                  id="settings-warning-days"
                  value={settings.expiryWarningDays}
                  onChange={(event) =>
                    updateSettings({
                      expiryWarningDays: Number(event.target.value),
                    })
                  }
                >
                  <option value={7}>7 días antes</option>
                  <option value={15}>15 días antes</option>
                  <option value={30}>30 días antes</option>
                </Select>
              </Field>

              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">
                    Sugerencias de compra
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-600">
                    Cuando un producto esté bajo o agotado, te decimos cuánto
                    pedir.
                  </p>
                </div>
                <Switch
                  checked={settings.showReorderSuggestions}
                  onChange={(checked) =>
                    updateSettings({ showReorderSuggestions: checked })
                  }
                  label="Mostrar sugerencias de compra"
                />
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                Los avisos se guardan automáticamente.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-300 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Tu información
                </h2>
                <p className="text-sm text-slate-600">
                  {products.length}{" "}
                  {products.length === 1 ? "producto" : "productos"} ·{" "}
                  {movements.length}{" "}
                  {movements.length === 1
                    ? "entrada o salida"
                    : "entradas y salidas"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-[15px] font-semibold text-slate-900">
                  Volver a los datos de ejemplo
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                  Carga otra vez los productos ficticios de Tienda Doña Rosa.
                  Reemplaza lo que tienes ahora.
                </p>
                <Button
                  variant="outline"
                  onClick={handleRestore}
                  className="mt-2.5 w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar datos de ejemplo
                </Button>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                <p className="text-[15px] font-semibold text-slate-900">
                  Borrar mis productos
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
                  Elimina todos los productos y todo el historial. Los datos de
                  tu negocio se conservan.
                </p>
                <Button
                  variant="dangerGhost"
                  onClick={handleClear}
                  className="mt-2.5 w-full border border-red-200 bg-white sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Borrar todo
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
        <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
        <p className="text-sm leading-relaxed text-slate-700">
          <strong className="font-semibold text-slate-900">
            Guardado en este celular.
          </strong>{" "}
          La información no se envía a internet. Si borras los datos del
          navegador, perderás lo que tengas guardado.
        </p>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        Tienda Clara · Hecha para tiendas y licoreras de barrio en Colombia.
      </p>
    </div>
  );
}

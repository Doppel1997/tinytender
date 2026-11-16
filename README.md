# Tienda Clara

Aplicación sencilla para que tiendas y licoreras de barrio en Colombia sepan qué productos tienen, cuántos les quedan y qué necesitan comprar. Funciona directamente en el navegador, sin backend, autenticación ni base de datos: todo se guarda en `LocalStorage`.

> **Aviso:** las salidas registran unidades que dejan el inventario. No representan ventas confirmadas, ingresos ni información contable. Los valores en pesos son estimaciones calculadas con los precios que registres.

## Demo

- Negocio de ejemplo: **Tienda Doña Rosa**, tienda y licorera en Villavicencio.
- **27 productos** ficticios de todas las categorías, con precios en pesos colombianos (COP).
- Casos variados: productos disponibles, con pocas unidades, agotados, próximos a vencer y vencidos.
- Varios productos tienen **lotes con fechas de vencimiento distintas**, por ejemplo leche, cerveza Poker y Coca-Cola.
- Alrededor de **99 movimientos** de entrada y salida, incluidos 5 registros de pérdida (vencidos o dañados).
- Los datos, personas y direcciones son ficticios.

## Funcionalidades

- **Inicio:** saludo personalizado, tres acciones grandes («Llegó mercancía», «Salió mercancía», «Revisar productos») y productos que necesitan atención agrupados por prioridad: vencidos, agotados, pocas unidades y próximos a vencer.
- **Productos:** búsqueda por nombre, filtros por categoría y disponibilidad, tarjetas en móvil y tabla en escritorio. Muestra cantidad disponible, estado, vencimiento y lotes.
- **Agregar producto:** el formulario principal solo pide nombre, cantidad, aviso de pocas unidades y vencimiento opcional. Categoría, código, precios y unidad están dentro de «Agregar más detalles».
- **Entradas y salidas:** búsqueda de producto, cantidad con botones de disminuir/aumentar y montos rápidos, paso de confirmación antes de guardar y mensaje con la nueva cantidad. Las salidas piden un motivo: venta, producto vencido, dañado, perdido, consumo del negocio u otro.
- **Lotes:** cada entrada puede registrar su propia fecha de vencimiento. Al sacar mercancía se consume primero el lote que vence antes (PEPS/FEFO). Los lotes se consultan desde el detalle del producto.
- **Pérdidas:** las salidas que no son venta conservan su motivo. Si hay precio de compra, se calcula el valor estimado de la pérdida. La acción «Sacar del inventario» pide confirmación.
- **Alertas:** agrupadas por vencidos, agotados, pocas unidades y próximos a vencer, con cantidades y fechas concretas. Cada producto aparece una sola vez, en el grupo más urgente.
- **Cómo va mi negocio:** periodo de 7, 30 o 90 días, unidades recibidas y salidas, valor estimado de la mercancía, pérdidas registradas, productos que más y menos salen y gráfico de entradas/salidas.
- **Configuración:** datos del negocio, nombre del propietario, aviso de vencimientos, sugerencias de compra, restauración de los datos de ejemplo y borrado del inventario.
- **Accesibilidad:** texto principal de 16 px, etiquetas visibles, botones de 44 a 52 px, foco visible, estados con icono y palabra (no solo color) y navegación inferior fija con texto.
- **Persistencia:** los cambios sobreviven a recargas en el mismo navegador.

## Cómo se guardan los datos

- Se usa la clave `tienda-clara:data:v1` de `LocalStorage`; la clave se conserva para no perder información existente.
- Los datos guardados con la estructura anterior (versión 1) se migran automáticamente en memoria a la nueva estructura con lotes y motivos de salida. No se borra nada durante la migración.
- La cantidad total del producto siempre coincide con la suma de sus lotes. El vencimiento del producto refleja el lote más próximo.
- La aplicación no borra información automáticamente. Restaurar los datos de ejemplo o borrar el inventario siempre pide confirmación.
- No se envía información a ningún servidor ni se usan servicios de analítica.
- Si borras los datos de navegación, se pierde lo que tengas guardado.

## Tecnologías

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) para iconografía
- [Recharts](https://recharts.org/) para el gráfico de entradas y salidas
- [React Router 6](https://reactrouter.com/) con `HashRouter` (rutas compatibles con GitHub Pages)

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:5173`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Valida TypeScript y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la carpeta `dist/`. |
| `npm run typecheck` | Ejecuta únicamente la validación de TypeScript. |

## Estructura del proyecto

```text
src/
  components/
    layout/      Barra lateral, navegación móvil y estructura general
    modals/      Formularios de producto y movimiento, detalle y confirmaciones
    ui/          Botones, campos, modales, tarjetas y encabezados
  context/       Estado del negocio, avisos y modales globales
  data/          Datos de demostración y ajustes por defecto
  lib/           Fechas, formato, inventario, alertas, lotes y estadísticas
  pages/         Inicio, Productos, Entradas y salidas, Alertas, Cómo va mi negocio y Configuración
  types.ts       Modelos y catálogos del dominio
```

Las rutas internas conservan sus nombres anteriores (`/inventario`, `/movimientos`, `/estadisticas`) para evitar romper enlaces existentes; solo cambiaron las etiquetas visibles.

## Despliegue en GitHub Pages

El repositorio incluye el workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que construye y publica el sitio en cada push a `main`.

1. Sube el proyecto a un repositorio de GitHub.
2. En el repositorio, abre **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. Haz push a `main` o ejecuta el workflow manualmente desde **Actions**.
5. El sitio quedará en `https://<usuario>.github.io/<repositorio>/`.

El workflow calcula automáticamente la base de Vite:

- Para un repositorio de proyecto usa `/<nombre-del-repositorio>/`.
- Para un repositorio de usuario u organización (`<usuario>.github.io`) usa `/`.

También puedes construir manualmente indicando la base:

```bash
# Windows PowerShell
$env:VITE_BASE="/mi-repositorio/"; npm run build

# macOS / Linux
VITE_BASE=/mi-repositorio/ npm run build
```

Las rutas internas usan `HashRouter`, por lo que funcionan sin configurar redirecciones del servidor. Ejemplo: `https://<usuario>.github.io/<repositorio>/#/inventario`.

## Alcance del prototipo

Este proyecto es una demostración funcional de interfaz y flujo de inventario. No incluye:

- backend, base de datos ni sincronización entre dispositivos;
- usuarios, roles o autenticación;
- facturación, ventas confirmadas, cuentas por cobrar o contabilidad;
- lector de código de barras, impresión de recibos o integraciones externas;
- órdenes de compra a proveedores: en los agotados, la acción «Comprar» se resuelve con «Recibir mercancía», que registra la llegada real al inventario.

Las versiones anteriores de los datos se migran automáticamente y no se eliminan sin confirmación. Los productos, personas, direcciones y movimientos de la demo son ficticios.

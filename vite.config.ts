import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * `base` es configurable para GitHub Pages.
 * - En local y en builds genéricos usamos rutas relativas (`./`), compatibles
 *   con cualquier subcarpeta del sitio.
 * - El workflow de GitHub Actions define VITE_BASE=/nombre-del-repositorio/.
 */
const base = process.env.VITE_BASE || "./";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

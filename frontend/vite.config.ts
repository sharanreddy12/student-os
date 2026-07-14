import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { TanStackStartVite } from "@tanstack/react-start/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    TanStackStartVite({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});

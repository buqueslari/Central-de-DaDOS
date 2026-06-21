import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@phosphor-icons")) return "icons";
          if (id.includes("react")) return "react";
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/.npm-cache/**", "**/.pnpm-store/**", "**/dist/**"],
  },
  plugins: [react()],
});

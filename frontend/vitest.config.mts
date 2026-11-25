import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    env: { TZ: "Asia/Kolkata" }, // a fixed non-UTC zone keeps date tests identical on every machine
    coverage: {
      provider: "v8",
      include: ["components/**", "lib/**"],
      exclude: ["**/*.test.*"],
      reporter: ["text", "html"],
    },
  },
});

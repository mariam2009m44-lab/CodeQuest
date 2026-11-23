import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  // The React workspace is mounted by Vercel at /app/.
  base: "/app/",
  build: {
    rollupOptions: {
      // Emit the existing app.html as the service's index.html.
      input: {
        index: resolve(process.cwd(), "app.html")
      }
    }
  }
});

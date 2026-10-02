import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // In development, send /api calls to the local backend
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        secure: false,
      },
      // Share links with previews (WhatsApp / Facebook)
      "/share": {
        target: "http://localhost:3001",
        secure: false,
      },
    },
  },
  plugins: [react()],
});

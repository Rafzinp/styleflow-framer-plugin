import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import mkcert from "vite-plugin-mkcert"
import framer from "vite-plugin-framer"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss(), react(), mkcert(), framer()],
})

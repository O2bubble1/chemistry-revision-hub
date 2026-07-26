import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"


export function getBasePath(environment: Record<string, string | undefined>): string {
  if (environment.GITHUB_ACTIONS !== "true") return "/"
  const repository = environment.GITHUB_REPOSITORY?.split("/")[1]
  return repository ? `/${repository}/` : "/"
}
// https://vite.dev/config/
export default defineConfig({
  base: getBasePath(process.env),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

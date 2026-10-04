import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// El prefijo de GitHub Pages solo aplica al build; en desarrollo se usa la raíz
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  base: command === 'build' ? '/COG-FULL-STACK/' : '/',
}))

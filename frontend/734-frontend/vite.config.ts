import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
// El prefijo de GitHub Pages solo aplica al build; en desarrollo se usa la raíz
export default defineConfig(({ command, mode }) => {
  // Sin credenciales de Supabase el sitio publicado queda en blanco: el build se detiene antes
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd())
    const faltantes = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter((k) => !env[k])
    if (faltantes.length) {
      throw new Error(`Faltan ${faltantes.join(' y ')} en .env.local; copia .env.example y complétalo antes de hacer build o deploy`)
    }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    base: command === 'build' ? '/COG-FULL-STACK/' : '/',
  }
})

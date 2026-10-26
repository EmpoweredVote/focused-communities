import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Local dev reads the LIVE public API by default, so a fresh clone with no
// .env shows the real communities and stances. The app calls same-origin
// `/api` (src/lib/apiFetch.ts) and this proxy forwards it to production —
// the accounts engine, which serves this API under /fc (see FROZEN.md), so
// the path is rewritten /api -> /fc/api. Signed out, it reaches only what any
// visitor reaches. Running the engine locally? Set
// VITE_API_PROXY_TARGET=http://localhost:3000. Dev only.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'https://accounts-api.empowered.vote',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '/fc/api'),
        },
      },
    },
  }
})

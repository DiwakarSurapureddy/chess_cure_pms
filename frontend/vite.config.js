import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    fs: {
      allow: ['/home/user/chess_cure_pms', '/home/user/.gemini/antigravity-ide/brain']
    }
  }
})

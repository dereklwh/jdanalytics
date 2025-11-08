import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: {
        darkMode: 'class', // 👈 this enables .dark toggle
        theme: {
          extend: {},
        },
      },
    }),
  ],
})

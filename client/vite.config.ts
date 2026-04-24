import { defineConfig } from 'vitest/config'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const CLIENT_NODE_MODULES = path.resolve(__dirname, 'node_modules')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@testing-library/react': path.join(CLIENT_NODE_MODULES, '@testing-library/react'),
      '@testing-library/user-event': path.join(CLIENT_NODE_MODULES, '@testing-library/user-event'),
      '@testing-library/jest-dom': path.join(CLIENT_NODE_MODULES, '@testing-library/jest-dom'),
      vitest: path.join(CLIENT_NODE_MODULES, 'vitest'),
      react: path.join(CLIENT_NODE_MODULES, 'react'),
      'react-dom': path.join(CLIENT_NODE_MODULES, 'react-dom'),
      '@clerk/clerk-react': path.join(CLIENT_NODE_MODULES, '@clerk/clerk-react'),
      'lucide-react': path.join(CLIENT_NODE_MODULES, 'lucide-react'),
    },
  },
  server: {
    proxy: {
      '/api/inventory': 'http://localhost:3002',
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],
    include: ['tests/frontend/**/*.test.tsx', 'tests/frontend/**/*.test.ts'],
  },
})

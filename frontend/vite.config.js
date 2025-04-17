import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/generate_contract': 'http://localhost:8000',
      '/deploy_contract': 'http://localhost:8000',
      '/my_tokens': 'http://localhost:8000',
    },
  },
});

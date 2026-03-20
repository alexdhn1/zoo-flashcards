import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Modifier cette ligne avec le nom de ton repo GitHub
  // Ex: si ton repo est https://github.com/alexdhn1/zoo-flashcards
  // alors base: '/zoo-flashcards/'
  base: '/zoo-flashcards/',
})

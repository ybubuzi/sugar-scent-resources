import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { cspPlugin } from './scp.vite.config';
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins:[cspPlugin()]
  }
})

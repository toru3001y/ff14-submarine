import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // 既定は node。データ整合性テスト（SPEC §8.2）が old/*.js を fs で読むため。
    // コンポーネントテスト（SPEC §8.3）は各ファイル先頭の
    // `// @vitest-environment jsdom` で個別に切り替える。
    environment: 'node',
  },
})

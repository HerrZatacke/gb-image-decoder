import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/helpers/vitest.setup.ts'],
    environment: 'node',
    // environmentOptions: {
    //   jsdom: {
    //     resources: 'usable',
    //   },
    // },
  },
});

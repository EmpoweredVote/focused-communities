import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 15000,
    env: {
      // Satisfy module-level env var checks so supabase client initializes.
      // Tests stub global fetch to intercept all actual network calls.
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    },
  },
});

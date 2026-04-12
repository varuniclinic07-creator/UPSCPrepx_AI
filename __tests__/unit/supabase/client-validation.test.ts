/**
 * Tests for Supabase client environment variable validation
 */

// We need to test the module with different env var states,
// so we use dynamic imports and reset modules between tests.

describe('Supabase Client Validation', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    // Restore env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    jest.resetModules();
  });

  it('should throw when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    // Re-require to get fresh module with new env
    jest.isolateModules(() => {
      const { createClient } = require('@/lib/supabase/client');
      expect(() => createClient()).toThrow('Missing Supabase environment variables');
    });
  });

  it('should throw when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    jest.isolateModules(() => {
      const { createClient } = require('@/lib/supabase/client');
      expect(() => createClient()).toThrow('Missing Supabase environment variables');
    });
  });

  it('should not throw when both env vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    jest.isolateModules(() => {
      const { createClient } = require('@/lib/supabase/client');
      expect(() => createClient()).not.toThrow();
    });
  });
});

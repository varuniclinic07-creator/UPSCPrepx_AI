import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.A4F_API_KEY = 'test-api-key'
process.env.RAZORPAY_KEY_ID = 'test-key-id'
process.env.RAZORPAY_KEY_SECRET = 'test-key-secret'
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.SERVER_IP = '127.0.0.1'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

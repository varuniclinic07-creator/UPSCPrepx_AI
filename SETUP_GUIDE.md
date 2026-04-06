# DEVELOPMENT SETUP GUIDE

## Prerequisites
- Node.js 18+ installed
- Docker Desktop installed (for Redis/PostgreSQL)
- Git installed

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your credentials
# REQUIRED: REDIS_URL, SUPABASE credentials, A4F_API_KEY, RAZORPAY keys, SERVER_IP
```

### 3. Start Local Services
```bash
# Start Redis and PostgreSQL
npm run docker:up

# Verify services are running
docker ps
```

### 4. Run Database Migrations
```bash
# Connect to your Supabase project and run migrations
# Or use local PostgreSQL:
psql -U postgres -d upsc_db -f supabase/migrations/001_initial_schema.sql
# ... run all migrations in order
```

### 5. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Development Workflow

### Code Quality Checks
```bash
# Run all checks
npm run validate

# Individual checks
npm run type-check    # TypeScript
npm run lint          # ESLint
npm run format:check  # Prettier
```

### Testing
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Formatting
```bash
# Format all files
npm run format

# Fix linting issues
npm run lint:fix
```

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `REDIS_URL` - Redis connection string
- `A4F_API_KEY` - A4F AI API key
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret
- `SERVER_IP` - Server IP address
- `NEXT_PUBLIC_APP_URL` - Application URL

### Optional
- `TWILIO_ACCOUNT_SID` - For SMS OTP
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `RESEND_API_KEY` - For email notifications
- `NEXT_PUBLIC_SENTRY_DSN` - Error monitoring

## Common Issues

### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
npm run docker:down
npm run docker:up
```

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

## Project Structure
```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/              # Utilities and services
│   ├── api/         # API versioning
│   ├── audit/       # Audit logging
│   ├── auth/        # Authentication
│   ├── constants/   # App constants
│   ├── env/         # Environment validation
│   ├── errors/      # Error handling
│   ├── logger/      # Structured logging
│   ├── monitoring/  # Error tracking
│   ├── resilience/  # Circuit breakers
│   ├── supabase/    # Database client
│   └── validation/  # Zod schemas
└── types/           # TypeScript types
```

## Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Run validation before push
npm run validate

# Push changes
git push origin feature/your-feature
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Build
```bash
docker build -t upsc-cse-master .
docker run -p 3000:3000 upsc-cse-master
```

## Support
- Check README.md for feature documentation
- Review APP_STRUCTURE_ANALYSIS.md for architecture
- See SECURITY_FIXES_SUMMARY.md for security details

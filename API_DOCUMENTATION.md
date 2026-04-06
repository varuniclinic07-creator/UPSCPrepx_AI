# UPSC CSE Master - Complete API Documentation

## 📋 API Overview

**Base URL**: `https://your-app.vercel.app/api`  
**Version**: 1.0.0  
**Authentication**: Bearer token (Supabase JWT)

---

## 🔐 Authentication

All authenticated endpoints require:
```
Authorization: Bearer <supabase_jwt_token>
```

Admin endpoints additionally require `role: 'admin' | 'super_admin'`

---

## 📊 API Endpoints Summary

### Health & Monitoring
- `GET /health` - System health check

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/otp` - OTP verification
- `POST /auth/[...nextauth]` - NextAuth handlers

### User Management
- `GET /user` - Get current user
- `PUT /user` - Update user profile
- `GET /user/preferences` - Get preferences
- `PUT /user/preferences` - Update preferences

### Notes
- `GET /notes` - List user notes
- `POST /notes/generate` - Generate AI notes
- `GET /notes/[id]` - Get specific note
- `PUT /notes/[id]` - Update note
- `DELETE /notes/[id]` - Delete note

### Quiz
- `GET /quiz` - List quizzes
- `POST /quiz/generate` - Generate quiz
- `GET /quiz/[id]` - Get quiz
- `POST /quiz/[id]/submit` - Submit answers

### Current Affairs
- `GET /current-affairs` - List articles
- `GET /current-affairs/[id]` - Get article

### Lectures
- `GET /lectures` - List lectures
- `POST /lectures/generate` - Generate lecture
- `GET /lectures/[id]` - Get lecture
- `GET /lectures/[id]/status` - Check status
- `POST /lectures/[id]/cancel` - Cancel generation

### Mind Maps
- `GET /mind-maps` - List mind maps
- `POST /mind-maps/generate` - Generate mind map

### Materials
- `POST /materials/upload` - Upload study material

### Payments
- `POST /payments/initiate` - Start payment
- `POST /payments/verify` - Verify payment

### Planner & Revision
- `GET /planner` - Get study planner
- `POST /planner` - Create plan
- `GET /revision` - Get revision schedule

### Bookmarks
- `GET /bookmarks` - List bookmarks
- `POST /bookmarks` - Add bookmark
- `DELETE /bookmarks` - Remove bookmark

### Agentic Services
- `POST /agentic/explain` - Explain concepts
- `POST /agentic/search-files` - Search files
- `POST /agentic/search-web` - Web search

### Admin
- `GET /admin/users` - List users
- `PUT /admin/users` - Update user
- `GET /admin/ai-providers` - List AI providers
- `PUT /admin/ai-providers` - Update provider
- `GET /admin/features` - List features
- `PUT /admin/features` - Update feature
- `GET /admin/leads` - List leads
- `PUT /admin/leads` - Update lead

### Webhooks
- `POST /webhooks/razorpay` - Razorpay webhook

### Cron Jobs
- `GET /cron/scrape-current-affairs` - Daily scraping

---

## 📝 Detailed Endpoint Documentation

### Health Check
```http
GET /api/health
```

**Response 200**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "pass", "responseTime": 45 },
    "redis": { "status": "pass", "responseTime": 12 },
    "circuitBreakers": { "status": "pass" }
  }
}
```

---

### Generate Notes
```http
POST /api/notes/generate
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "topic": "Indian Federalism",
  "subject": "Polity",
  "difficulty": "intermediate",
  "language": "en"
}
```

**Response 200**:
```json
{
  "id": "uuid",
  "topic": "Indian Federalism",
  "content": "...",
  "summary": "...",
  "key_points": ["..."],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response 429** (Rate Limited):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

### Generate Quiz
```http
POST /api/quiz/generate
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "topic": "Indian Economy",
  "difficulty": "hard",
  "num_questions": 10,
  "question_types": ["mcq", "true_false"]
}
```

**Response 200**:
```json
{
  "id": "uuid",
  "title": "Indian Economy Quiz",
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "..."
    }
  ]
}
```

---

### Submit Quiz
```http
POST /api/quiz/[id]/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "answers": {
    "q1": "B",
    "q2": "A"
  }
}
```

**Response 200**:
```json
{
  "score": 8,
  "total": 10,
  "percentage": 80,
  "correct_answers": 8,
  "time_taken": 600,
  "feedback": "..."
}
```

---

### Initiate Payment
```http
POST /api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "plan_id": "premium_monthly",
  "amount": 499
}
```

**Response 200**:
```json
{
  "order_id": "order_xxx",
  "amount": 499,
  "currency": "INR",
  "key_id": "rzp_xxx"
}
```

---

### Admin: List Users
```http
GET /api/admin/users?page=1&limit=20&role=student
Authorization: Bearer <admin_token>
```

**Response 200**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "student",
      "subscription_tier": "premium",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### Agentic: Explain Concept
```http
POST /api/agentic/explain
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "content": "Explain Article 356",
  "context": "UPSC Mains GS2"
}
```

**Response 200**:
```json
{
  "explanation": "Article 356 deals with..."
}
```

**Response 503** (Service Unavailable):
```json
{
  "error": "Service unavailable"
}
```

---

## 🔒 Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "topic",
      "message": "Topic is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "requestId": "req_xxx"
}
```

---

## 📊 Rate Limits

| Tier | Requests/Hour | Notes/Day | Quiz/Day |
|------|---------------|-----------|----------|
| Free | 100 | 5 | 3 |
| Basic | 500 | 20 | 10 |
| Premium | 2000 | 100 | 50 |
| Admin | Unlimited | Unlimited | Unlimited |

---

## 🔄 Webhooks

### Razorpay Payment Webhook
```http
POST /api/webhooks/razorpay
X-Razorpay-Signature: <signature>
Content-Type: application/json
```

**Payload**:
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "amount": 49900,
        "status": "captured"
      }
    }
  }
}
```

---

## 🧪 Testing

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### Authenticated Request
```bash
curl -X POST https://your-app.vercel.app/api/notes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Federalism","subject":"Polity"}'
```

---

## 📈 Monitoring Endpoints

- `/api/health` - Overall system health
- Circuit breaker status included in health check
- Redis connection status
- Database connection status

---

## 🔗 External Services

### Integrated Services
- **Supabase**: Database & Auth
- **Redis**: Caching & Rate limiting
- **MinIO**: File storage
- **Crawl4AI**: Web scraping
- **A4F API**: AI generation
- **Razorpay**: Payments
- **Plausible**: Analytics (optional)
- **Mautic**: Marketing (optional)
- **Uptime Kuma**: Monitoring (optional)

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- Pagination uses `page` and `limit` query parameters
- Sorting uses `sort` and `order` query parameters
- Filtering uses field-specific query parameters

---

## 🆘 Support

**Documentation**: See README.md  
**Issues**: GitHub Issues  
**Email**: support@upsccsemaster.com

# BMAD Phase 4 - Feature F18-F20: Admin Dashboard, Community, & Mobile Polish

## Master Prompt v8.0 Compliance
- **Security**: Admin routes restricted to `role == 'admin'`
- **Mobile-first**: React Native Offline support & Push Notifications

---

## 1. Feature Overview

### 1.1 Admin Dashboard (F18)
Centralized control for platform operations:
- **User Management**: View/List users, Suspend/Ban, Grant XP.
- **Analytics**: Global stats (Revenue, Active Users, Content Consumed).
- **Content Moderation**: Approve/Reject AI generated videos, Review reported content.

### 1.2 Community Forums (F19)
Peer-to-peer interaction:
- **Discussion Threads**: Topic-based forums (Polity, Science, etc.).
- **Q&A**: Students help each other, upvote valid answers.

### 1.3 Mobile Polish (F20)
Offline & Engagement:
- **Offline Cache**: Download Videos/Notes for offline viewing.
- **Push Notifications**: Reminders, Leaderboard alerts, Live class alerts.

---

## 2. Database Schema

### 2.1 Admin Tables
```sql
-- User Reports (For Moderation)
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  target_type TEXT, -- 'NOTE', 'COMMENT', 'VIDEO'
  target_id UUID,
  reason TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, RESOLVED, DISMISSED
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Community Tables
```sql
-- Forum Threads
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments/Replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Mobile Push Tokens
```sql
-- User Push Tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'ANDROID',
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Implementation Checklist

- [x] BMAD Specification
- [ ] Database Migrations (036, 037)
- [ ] Admin Dashboard Pages (`/admin/dashboard`, `/admin/users`)
- [ ] API Endpoints (Admin analytics, User suspension)
- [ ] Community Forum Pages (`/community`, `/community/thread/[id]`)
- [ ] React Native Offline Manager
- [ ] React Native Notifications Service
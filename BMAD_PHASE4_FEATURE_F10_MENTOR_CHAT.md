# BMAD Phase 4 - Feature F10: AI Mentor Chat

## Master Prompt v8.0 Compliance
- **READ Mode Feature** (Section 5 - Core Learning Features)
- **AI Provider**: 9Router → Groq → Ollama (NOT A4F)
- **Rule 3**: SIMPLIFIED_LANGUAGE_PROMPT for all user-facing content
- **Bilingual**: English + Hindi throughout
- **Mobile-first**: 360px viewport support

---

## 1. Feature Overview

### 1.1 Purpose
24/7 AI-powered mentor that provides:
- Study guidance & accountability
- Career counseling for UPSC & beyond
- Emotional support & motivation
- Strategy adjustments based on performance data
- RAG-grounded using user's notes, progress, and syllabus

### 1.2 User Stories

#### US-F10-01: Chat with AI Mentor
**As a** UPSC aspirant  
**I want to** chat with an AI mentor anytime  
**So that** I can get guidance without waiting  

**Acceptance Criteria:**
- Real-time streaming chat interface
- Context-aware responses (uses notes, CA, performance data)
- Bilingual responses (EN+HI toggle)
- Message history saved

#### US-F10-02: Mentor Knows My Progress
**As a** user  
**I want** the mentor to know my strengths/weaknesses  
**So that** advice is personalized  

**Acceptance Criteria:**
- Mentor analyzes MCQ analytics
- Mentions study planner status
- Suggests based on weak areas

#### US-F10-03: Goal Setting
**As a** user  
**I want to** set goals with my mentor  
**So that** I stay on track  

**Acceptance Criteria:**
- Daily/weekly goal suggestions
- Mentor checks in on goals
- Celebrates achievements

#### US-F10-04: Career Guidance
**As a** user  
**I want** career advice beyond UPSC  
**So that** I have backup plans  

**Acceptance Criteria:**
- State services info
- NGO/Think tank options
- Skill development advice

---

## 2. Database Schema

### 2.1 Tables

```sql
-- Mentor Sessions
CREATE TABLE mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  topic TEXT, -- e.g., 'Study Strategy', 'Career Advice'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor Messages
CREATE TABLE mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  context_snapshot JSONB, -- snapshot of user's progress at time of message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor Goals
CREATE TABLE mentor_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  type TEXT CHECK (type IN ('daily', 'weekly', 'exam')),
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. AI Integration

### 3.1 Mentor System Prompt
```
You are an experienced UPSC mentor with 15+ years of guiding successful candidates.
Your tone is encouraging, empathetic, and direct.

CONTEXT PROVIDED:
- User's current syllabus coverage: {coverage}%
- Weakest subjects: {weak_subjects}
- MCQ accuracy: {accuracy}%
- Study streak: {streak} days
- Exam date: {exam_date}
- Recent notes: {recent_notes}

RULES:
1. Use SIMPLIFIED language (10th grade level)
2. Provide both English and Hindi versions if requested
3. Reference user's actual data to personalize advice
4. Be motivating but honest about gaps
5. Suggest actionable next steps
```

---

## 4. API Endpoints

### 4.1 POST /api/mentor/chat
Send a message to the mentor.
Request: `{ session_id, message, context? }`
Response: `{ reply, session_id, goal_suggestion? }`

### 4.2 GET /api/mentor/history
Get conversation history.
Response: `{ sessions: [{ id, title, last_message, count }] }`

### 4.3 POST /api/mentor/goals
Set/update goals.
Request: `{ title, type, due_date }`
Response: `{ goal_id }`

---

## 5. UI Components

- **mentor-chat-window.tsx**: Streaming messages, typing indicator, input
- **mentor-sidebar.tsx**: Session list, goal quick-view
- **goal-card.tsx**: Goal display with progress check
- **mentor-profile.tsx**: Mentor avatar, capabilities

---
## 6. Implementation Checklist
- [ ] BMAD Specification
- [ ] Database migration (029)
- [ ] Chat service (streaming)
- [ ] API routes
- [ ] UI components
- [ ] Mentor page
- [ ] Master Prompt compliance

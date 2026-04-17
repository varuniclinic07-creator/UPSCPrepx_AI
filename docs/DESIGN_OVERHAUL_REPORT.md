# UPSC AI - Design Overhaul Implementation Report

**Date:** 2026-04-17  
**Reference:** PrepX-AI / Chanakya AI design system (C:\Users\DR-VARUNI\Desktop\latest UI upsc)

---

## Summary

Complete visual overhaul of the UPSC AI platform from a slate-blue dark theme to a premium pure-black design system matching the Chanakya AI reference app. Also fixed auth persistence bug and HTTP 405 route error.

## Changes Made (21 files, +1232/-934 lines)

### Phase 1: Auth Fix
- **`src/lib/supabase/client.ts`** — `persistSession: false` by default. New `setRememberMe()` function controls persistence via localStorage flag. Singleton resets on toggle.
- **`src/app/(auth)/login/page.tsx`** — Added "Remember Me" checkbox. Calls `setRememberMe()` before creating Supabase client on login.
- **`src/hooks/use-user.tsx`** — `signOut()` now clears remember-me flag.

### Phase 2: Route Fix
- **`src/app/api/ai/generate/route.ts`** — Added GET handler returning endpoint info (fixes HTTP 405).

### Phase 3A: Design Tokens
- **`src/app/globals.css`** — Complete overhaul:
  - Background: `hsl(222,47%,6%)` → `#000000` (pure black)
  - Text hierarchy: white opacity system (`white/5` through `white/90`)
  - Primary: `#3b82f6` (blue), Secondary: `#f97316` (orange)
  - Cards: `bg-white/[0.03] border border-white/[0.05]`
  - Sidebar: `black/40 + backdrop-blur-48px`
  - Navbar: transparent → glass-on-scroll
  - Scrollbar: `white/10` thumb on transparent track
  - All component classes updated to use rgba white values

### Phase 3B: Layout Shell
- **`command-sidebar.tsx`** — White logo, keyboard shortcut tooltips, blue active indicator glow
- **`command-navbar.tsx`** — Gamification stats (streak/XP), rounded-full search with focus ring, transparent-to-blur transition
- **`command-center-shell.tsx`** — Decorative blur orbs, proper mobile bottom nav with active states and icons

### Phase 3C: Dashboard
- **`src/app/dashboard/page.tsx`** — Performance Analytics with timeframe toggle, AI Performance Insights (3 colored cards), Gamification section (streak + badges), Chanakya AI Mentor card, white rounded-full CTA buttons

### Phase 3D: Landing Page
- **`src/app/page.tsx`** — "UPSC. Reimagined." hero with text-gradient, bento demo cards (rank prediction, AI chat, daily target), storytelling sections, pure black design

### Phase 3E: Login Page
- **`src/app/(auth)/login/page.tsx`** — Clean dark modal card, white/5 input backgrounds, blue focus rings, white CTA button, Remember Me checkbox
- **`src/app/(auth)/layout.tsx`** — Simplified to plain black wrapper

### Phase 3F: Feature Pages
- **Notes, Quiz, Current Affairs, Videos, Answer Practice, Planner** — All updated from old HSL token system to white-opacity dark theme

### Phase 3G: Shared Components
- **`stat-card.tsx`** — Updated from `text-foreground/muted-foreground` to `text-white/white-40`
- **`layout.tsx`** — Theme color updated to `#000000`

## Design Token Reference

| Element | Old | New |
|---------|-----|-----|
| Background | `hsl(222,47%,6%)` | `#000000` |
| Text Primary | `hsl(210,40%,98%)` | `white` |
| Text Secondary | `hsl(215,20%,65%)` | `white/40` |
| Card BG | `hsl(222,47%,9%)` | `white/[0.03]` |
| Card Border | `hsl(217,33%,17%)` | `white/[0.05]` |
| Hover Border | `primary/30` | `white/[0.1]` |
| Primary | `hsl(217,91%,65%)` | `#3b82f6` |
| Secondary | `hsl(189,94%,45%)` | `#f97316` |
| CTA Button | `bg-primary text-white rounded-xl` | `bg-white text-black rounded-full` |

## Verification Checklist

- [ ] Visit app URL → login page (not auto-logged in)
- [ ] Login without "Remember Me" → close tab → reopen → logged out
- [ ] Login with "Remember Me" → close tab → reopen → stays logged in
- [ ] GET `/api/ai/generate` → returns JSON info
- [ ] Landing page shows "UPSC. Reimagined." hero with pure black bg
- [ ] Dashboard shows performance analytics, AI insights, gamification
- [ ] Sidebar has keyboard shortcut tooltips
- [ ] All feature pages have consistent dark theme

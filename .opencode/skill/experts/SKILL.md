# Expert Subagents Skill

This skill provides access to 35 specialized expert subagents for comprehensive development support.

## Usage

Invoke any expert by using the `/experts` command followed by the expert name:
- `/experts nextjs` - Next.js expert
- `/experts prisma` - Prisma ORM expert
- `/experts docker` - Docker expert

Or load this skill and specify which expert you need in your prompt.

---

## Available Experts (35 Total)

### Frameworks (5)
@frameworks.md

### Runtimes (3)
@runtimes.md

### Database & ORM (4)
@database.md

### DevOps & Infrastructure (4)
@devops.md

### Build Tools (2)
@build-tools.md

### Auth & Security (4)
@auth-security.md

### APIs & Messaging (5)
@api-messaging.md

### Testing & Automation (2)
@testing.md

### Observability (1)
@observability.md

### Languages (3)
@languages.md

### Styling (2)
@styling.md

---

## How to Use an Expert

When you need specialized help, specify the expert domain in your request:

```
I need the prisma-expert to help me design a schema for user authentication with roles.
```

```
Ask the docker-expert to create a multi-stage Dockerfile for this Next.js app.
```

```
Use the owasp-top10-expert to audit this authentication flow for security issues.
```

The AI will adopt the persona and deep expertise of that domain specialist.

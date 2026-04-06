# Expert Loader

This file provides quick-load instructions for invoking any expert subagent.

## How to Invoke an Expert

When you need specialized help, use this format in your prompt:

```
Use the [expert-name] to help me with [task description]
```

## Expert Invocation Reference

### Frameworks
- **nextjs-expert**: Next.js App Router, SSR, Server Components, API routes
- **nestjs-expert**: NestJS modules, dependency injection, microservices
- **react-expert**: React components, hooks, state management, testing
- **fastapi-expert**: FastAPI endpoints, Pydantic models, async operations
- **electron-expert**: Desktop apps, IPC communication, native modules

### Runtimes
- **nodejs-expert**: Node.js core APIs, streams, workers, performance
- **bun-expert**: Bun runtime, built-in bundler, test runner, speed
- **deno-expert**: Deno security model, Fresh framework, Deploy

### Database & ORM
- **prisma-expert**: Schema design, migrations, queries, relations
- **vector-db-expert**: Embeddings, similarity search, RAG pipelines
- **opensearch-expert**: Full-text search, aggregations, analyzers
- **redis-expert**: Caching, pub/sub, data structures, clustering

### DevOps & Infrastructure
- **terraform-expert**: Infrastructure as Code, modules, state, providers
- **docker-expert**: Dockerfiles, Compose, multi-stage builds, optimization
- **github-actions-expert**: CI/CD workflows, matrix builds, secrets
- **flyway-expert**: Database migrations, versioning, rollbacks

### Build Tools
- **webpack-expert**: Bundling, loaders, plugins, code splitting
- **rollup-expert**: Library bundling, tree shaking, ES modules

### Auth & Security
- **auth0-expert**: Auth0 integration, SSO, MFA, Actions
- **jwt-expert**: JWT tokens, signing algorithms, validation
- **oauth-oidc-expert**: OAuth 2.0 flows, OpenID Connect, PKCE
- **owasp-top10-expert**: Security vulnerabilities, prevention, auditing

### APIs & Messaging
- **openai-api-expert**: OpenAI API, Chat Completions, Assistants, embeddings
- **grpc-expert**: gRPC services, protobuf, streaming, interceptors
- **rest-expert**: REST API design, OpenAPI, versioning, best practices
- **nats-expert**: NATS messaging, JetStream, pub/sub, queues
- **braintree-expert**: Payment processing, subscriptions, fraud protection

### Testing & Automation
- **puppeteer-expert**: Browser automation, screenshots, scraping
- **playwright-expert**: Cross-browser E2E testing, locators, fixtures

### Observability
- **opentelemetry-expert**: Distributed tracing, metrics, logs, collectors

### Languages
- **python-expert**: Python 3.10+, async, typing, best practices
- **javascript-expert**: ES6+, closures, promises, DOM
- **typescript-expert**: Type system, generics, configuration

### Styling
- **css-expert**: CSS Grid, Flexbox, animations, architecture
- **tailwind-expert**: Utility classes, configuration, plugins

## Multi-Expert Collaboration

For complex tasks, combine experts:

```
I need the nextjs-expert, prisma-expert, and tailwind-expert to help me build 
a user dashboard with database queries and responsive styling.
```

```
Use the docker-expert and github-actions-expert to create a CI/CD pipeline 
that builds and deploys my containerized application.
```

```
Ask the owasp-top10-expert and jwt-expert to audit my authentication 
implementation for security vulnerabilities.
```

## Project-Specific Usage (UPSC CSE Master)

For this project, commonly needed experts:

| Task | Recommended Expert(s) |
|------|----------------------|
| AI note generation | `openai-api-expert`, `nextjs-expert` |
| Quiz system | `prisma-expert`, `react-expert` |
| Authentication | `auth0-expert` or `jwt-expert`, `owasp-top10-expert` |
| Styling/UI | `tailwind-expert`, `css-expert` |
| API development | `rest-expert`, `nextjs-expert` |
| Database schema | `prisma-expert` |
| Deployment | `docker-expert`, `terraform-expert` |
| Testing | `playwright-expert` |
| Performance | `opentelemetry-expert`, `redis-expert` |

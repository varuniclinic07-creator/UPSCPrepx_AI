import json

subagents = [
    "nextjs-expert1", "nestjs-expert2", "prisma-expert", "terraform-expert",
    "docker-expert", "openai-api-expert", "auth0-expert", "grpc-expert",
    "rest-expert", "nodejs-expert", "bun-expert", "deno-expert", "flyway-expert",
    "webpack-expert", "rollup-expert", "owasp-top10-expert", "jwt-expert",
    "oauth-oidc-expert", "opentelemetry-expert", "puppeteer-expert",
    "playwright-expert", "nats-expert", "braintree-expert", "github-actions-expert",
    "vector-db-expert", "opensearch-expert", "redis-expert", "electron-expert",
    "css-expert", "tailwind-expert", "fastapi-expert", "react-expert",
    "python-expert", "javascript-expert", "typescript-expert"
]

print(json.dumps({"subagents": subagents}))

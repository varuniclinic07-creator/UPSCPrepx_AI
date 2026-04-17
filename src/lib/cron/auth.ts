export function isAuthorizedCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice('Bearer '.length);
  const allowedTokens = [process.env.CRON_SECRET, process.env.HERMES_GATEWAY_TOKEN].filter(
    (value): value is string => Boolean(value && value.trim())
  );

  if (allowedTokens.length === 0) {
    return false;
  }

  return allowedTokens.includes(token);
}

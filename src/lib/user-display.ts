export function sanitizeUsername(username?: string | null): string | null {
  const normalized = username?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export function usernameOrFallback(
  username?: string | null,
  fallback = "rider"
): string {
  return sanitizeUsername(username) ?? fallback;
}

export function usernameHandle(
  username?: string | null,
  fallback = "rider"
): string {
  return `@${usernameOrFallback(username, fallback)}`;
}

export function usernameInitials(
  username?: string | null,
  fallback = "R"
): string {
  return usernameOrFallback(username, fallback).slice(0, 2).toUpperCase();
}

export function usernameProfileHref(username?: string | null): string | null {
  const normalized = sanitizeUsername(username);
  return normalized ? `/user/${normalized}` : null;
}

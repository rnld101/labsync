// Minimal auth shim. Production: Cognito Hosted UI / OIDC PKCE, then store the JWT and attach it
// as a Bearer token (api.ts reads getToken()). Kept intentionally tiny for the scaffold.
const TOKEN_KEY = "lablumen.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

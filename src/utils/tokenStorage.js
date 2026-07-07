// In-memory access token holder — deliberately NOT localStorage/sessionStorage
// to reduce XSS exposure. Lost on full page reload by design; AuthContext
// restores it via a silent /auth/refresh call (the refresh token lives in an
// httpOnly cookie the browser sends automatically).
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

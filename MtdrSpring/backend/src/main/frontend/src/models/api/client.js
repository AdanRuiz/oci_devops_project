import axios from 'axios';

const client = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

// Holds a getter function that returns the current token synchronously.
// Updated on every render of RequireAuth so the interceptor always has
// the latest token — even before useEffect runs (fixes the race condition
// between React Query query effects and the auth token setup in production).
let _getToken = null;

export function setTokenGetter(fn) {
  _getToken = fn;
}

client.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = _getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Kept for explicit token updates (page refresh, sign-out).
export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
}

export default client;
